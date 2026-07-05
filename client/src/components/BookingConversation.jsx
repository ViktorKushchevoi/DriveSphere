import React, { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { useAppContext } from '../context/AppContext'

const formatMessageDate = (value)=>{
  if(!value) return ''
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

const getSenderLabel = (role)=> role === 'admin' ? 'Owner' : 'Customer'
const getSenderId = (sender)=> typeof sender === 'object' ? sender?._id : sender
const getReactionUserId = (reaction)=> reaction?.user?._id || reaction?.user || reaction?.userId || reaction?.reactedBy?._id || reaction?.reactedBy || ''
const getBookingNumber = (booking, conversationData)=> conversationData?.bookingNumber || booking?.bookingNumber || booking?._id?.slice?.(-7) || ''
const compactEmojiOptions = [
  '\u{1F600}', '\u{1F601}', '\u{1F602}', '\u{1F60A}', '\u{1F60D}', '\u{1F44D}',
  '\u{1F64F}', '\u{1F525}', '\u{2705}', '\u{1F697}', '\u{1F4CD}', '\u{23F0}',
  '\u{1F4AC}', '\u{1F44C}', '\u{1F64C}', '\u{1F642}', '\u{1F60E}', '\u{2757}',
]

const BookingConversation = ({booking, onRead}) => {
  const {axios, user, fetchNotifications} = useAppContext()
  const mutationLockRef = useRef(false)
  const [conversationData, setConversationData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState('')
  const [attachment, setAttachment] = useState(null)
  const [attachmentPreview, setAttachmentPreview] = useState('')
  const [emojiOpen, setEmojiOpen] = useState(false)
  const [editingMessageId, setEditingMessageId] = useState('')
  const [editingText, setEditingText] = useState('')
  const [editEmojiOpen, setEditEmojiOpen] = useState(false)
  const [updatingMessageId, setUpdatingMessageId] = useState('')
  const [deleteConfirmId, setDeleteConfirmId] = useState('')

  const loadConversation = async (showLoading = true)=>{
    if(!booking?._id) return
    try {
      if(showLoading) setLoading(true)
      const {data} = await axios.get(`/api/bookings/conversation/${booking._id}`)
      if(data.success){
        setConversationData(data)
        onRead?.(booking._id)
      }else{
        toast.error(data.message || 'Unable to load conversation. Please try again.')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to load conversation. Please try again.')
    } finally {
      if(showLoading) setLoading(false)
    }
  }

  const handleSendMessage = async (event)=>{
    event.preventDefault()
    const trimmedMessage = message.trim()
    if((!trimmedMessage && !attachment) || sending) return

    try {
      setSending(true)
      const payload = new FormData()
      payload.append('bookingId', booking._id)
      payload.append('message', trimmedMessage)
      if(attachment){
        payload.append('attachment', attachment)
      }
      const {data} = await axios.post('/api/bookings/message', payload)
      if(data.success){
        setConversationData(data)
        setMessage('')
        setAttachment(null)
        setAttachmentPreview('')
        setEmojiOpen(false)
        fetchNotifications()
      }else{
        toast.error(data.message || 'Unable to send message. Please try again.')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to send message. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const startEdit = (item)=>{
    setEditingMessageId(item._id)
    setEditingText(item.message)
    setDeleteConfirmId('')
    setEditEmojiOpen(false)
  }

  const cancelEdit = ()=>{
    setEditingMessageId('')
    setEditingText('')
    setEditEmojiOpen(false)
  }

  const handleEditMessage = async (messageId)=>{
    const trimmedMessage = editingText.trim()
    if(!trimmedMessage || updatingMessageId || mutationLockRef.current) return

    try {
      mutationLockRef.current = true
      setUpdatingMessageId(messageId)
      const {data} = await axios.post('/api/bookings/message/edit', {
        bookingId: booking._id,
        messageId,
        message: trimmedMessage,
      })
      if(data.success){
        setConversationData(data)
        cancelEdit()
      }else{
        toast.error(data.message || 'Unable to update this message. Please try again.', {id: `edit-message-${messageId}`})
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to update this message. Please try again.', {id: `edit-message-${messageId}`})
    } finally {
      setUpdatingMessageId('')
      mutationLockRef.current = false
    }
  }

  const handleDeleteMessage = async (messageId)=>{
    if(updatingMessageId || mutationLockRef.current) return
    try {
      mutationLockRef.current = true
      setUpdatingMessageId(messageId)
      const {data} = await axios.post('/api/bookings/message/delete', {
        bookingId: booking._id,
        messageId,
      })
      if(data.success){
        setConversationData(data)
        setDeleteConfirmId('')
        if(editingMessageId === messageId) cancelEdit()
      }else{
        toast.error(data.message || 'Unable to delete this message. Please try again.', {id: `delete-message-${messageId}`})
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to delete this message. Please try again.', {id: `delete-message-${messageId}`})
    } finally {
      setUpdatingMessageId('')
      mutationLockRef.current = false
    }
  }

  const handleToggleReaction = async (messageId)=>{
    if(updatingMessageId || mutationLockRef.current) return
    try {
      mutationLockRef.current = true
      setUpdatingMessageId(messageId)
      const {data} = await axios.post('/api/bookings/message/reaction', {
        bookingId: booking._id,
        messageId,
        type: 'heart',
      })
      if(data.success){
        setConversationData(data)
      }else{
        toast.error(data.message || 'Unable to update reaction. Please try again.', {id: `reaction-message-${messageId}`})
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to update reaction. Please try again.', {id: `reaction-message-${messageId}`})
    } finally {
      setUpdatingMessageId('')
      mutationLockRef.current = false
    }
  }

  const insertEmoji = (emoji, target = 'message')=>{
    if(target === 'edit'){
      setEditingText(prev => `${prev}${emoji}`)
      setEditEmojiOpen(false)
      return
    }
    setMessage(prev => `${prev}${emoji}`)
    setEmojiOpen(false)
  }

  const handleAttachmentChange = (event)=>{
    const file = event.target.files?.[0]
    if(!file) return
    if(!file.type.startsWith('image/')){
      toast.error('Please attach an image file.')
      event.target.value = ''
      return
    }
    setAttachment(file)
    setAttachmentPreview(URL.createObjectURL(file))
    event.target.value = ''
  }

  const clearAttachment = ()=>{
    if(attachmentPreview){
      URL.revokeObjectURL(attachmentPreview)
    }
    setAttachment(null)
    setAttachmentPreview('')
  }

  useEffect(()=>{
    loadConversation()
  }, [booking?._id])

  useEffect(()=>{
    return ()=>{
      if(attachmentPreview){
        URL.revokeObjectURL(attachmentPreview)
      }
    }
  }, [attachmentPreview])

  if(!booking){
    return null
  }

  const car = conversationData?.car || booking.car
  const messages = conversationData?.conversation || []
  const bookingNumber = getBookingNumber(booking, conversationData)

  return (
    <section className='mt-5 overflow-hidden rounded-md border border-slate-200 bg-white text-slate-900 shadow-xl shadow-slate-200/60'>
      <div className='flex flex-col gap-3 border-b border-slate-200 bg-slate-900 p-4 text-white sm:flex-row sm:items-start sm:justify-between'>
        <div>
          <p className='text-xs font-semibold uppercase tracking-[0.2em] text-primary'>Booking Conversation</p>
          <h3 className='mt-2 text-xl font-semibold text-white'>{car?.brand} {car?.model}</h3>
          <p className='mt-1 text-sm text-slate-300'>Booking #{bookingNumber} messages are saved inside this booking.</p>
        </div>
        <button type='button' onClick={()=> loadConversation()} className='w-max rounded-md border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-primary hover:text-primary'>
          Refresh
        </button>
      </div>

      <div className='bg-slate-50 p-4'>
        {loading ? (
          <div className='rounded-md border border-slate-200 bg-white p-6 text-center'>
            <p className='font-semibold text-slate-950'>Loading conversation...</p>
          </div>
        ) : (
          <>
            <div className='grid max-h-96 gap-3 overflow-y-auto pr-1'>
              {messages.length > 0 ? messages.map((item)=> {
                const isOwnMessage = item.senderRole === user?.role || getSenderId(item.sender) === user?._id
                const isEditing = editingMessageId === item._id
                const canModify = isOwnMessage && !item.isDeleted
                const reactionUserId = getReactionUserId(item.reaction)
                const hasHeart = !item.isDeleted && Boolean(reactionUserId)
                const isHeartedByCurrentUser = reactionUserId?.toString?.() === user?._id
                const canReact = !isOwnMessage && !item.isDeleted
                const shouldShowReaction = hasHeart || canReact

                return (
                  <div key={item._id || `${item.senderRole}-${item.createdAt}`} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[88%] rounded-md border px-4 py-3 shadow-sm ${isOwnMessage ? 'border-primary/20 bg-primary/10' : 'border-slate-200 bg-white'}`}>
                      <div className='flex flex-wrap items-center gap-2'>
                        <p className='text-xs font-semibold uppercase tracking-wide text-slate-500'>{getSenderLabel(item.senderRole)}</p>
                        <p className='text-xs text-slate-400'>{formatMessageDate(item.createdAt)}</p>
                        {item.editedAt && !item.isDeleted && <p className='text-xs font-medium text-slate-400'>edited</p>}
                      </div>

                      {isEditing ? (
                        <div className='mt-3'>
                          <textarea
                            value={editingText}
                            onChange={(event)=> setEditingText(event.target.value)}
                            rows={3}
                            className='w-full resize-none rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-primary'
                          />
                          <div className='mt-2 flex flex-wrap items-center justify-between gap-2'>
                            <div className='relative'>
                              <button type='button' onClick={()=> setEditEmojiOpen(open => !open)} className='rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition hover:border-primary hover:text-primary'>
                                Emoji
                              </button>
                              {editEmojiOpen && (
                                <div className='absolute bottom-10 left-0 z-10 grid max-h-36 w-56 grid-cols-6 gap-1 overflow-y-auto rounded-md border border-slate-200 bg-white p-2 shadow-xl'>
                                  {compactEmojiOptions.map(emoji => (
                                    <button key={emoji} type='button' onClick={()=> insertEmoji(emoji, 'edit')} className='flex h-8 w-8 items-center justify-center rounded-md text-xl leading-none transition hover:bg-slate-100'>
                                      {emoji}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className='flex gap-2'>
                              <button type='button' onClick={cancelEdit} className='rounded-md px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-100'>
                                Cancel
                              </button>
                              <button
                                type='button'
                                disabled={!editingText.trim() || Boolean(updatingMessageId)}
                                onClick={()=> handleEditMessage(item._id)}
                                className='rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white transition hover:bg-primary-dull disabled:cursor-not-allowed disabled:opacity-60'
                              >
                                {updatingMessageId === item._id ? 'Saving...' : 'Save'}
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className={`mt-2 whitespace-pre-wrap text-sm leading-6 ${item.isDeleted ? 'italic text-slate-400' : 'text-slate-700'}`}>
                          {item.isDeleted ? 'This message was deleted.' : item.message}
                        </p>
                      )}

                      {!item.isDeleted && item.attachments?.length > 0 && (
                        <div className='mt-3 grid gap-2'>
                          {item.attachments.map((attachment)=> (
                            <a key={attachment.url} href={attachment.url} target='_blank' rel='noreferrer' className='block overflow-hidden rounded-md border border-slate-200 bg-white'>
                              <img src={attachment.url} alt={attachment.fileName || 'Conversation attachment'} className='max-h-64 w-full object-cover'/>
                            </a>
                          ))}
                        </div>
                      )}

                      {shouldShowReaction && (
                        canReact ? (
                          <button
                            type='button'
                            disabled={updatingMessageId === item._id}
                            onClick={()=> handleToggleReaction(item._id)}
                            aria-label={hasHeart ? 'Remove heart reaction' : 'Add heart reaction'}
                            className={`mt-3 inline-flex h-8 w-8 items-center justify-center rounded-full border text-lg leading-none transition disabled:opacity-60 ${hasHeart ? 'border-red-200 bg-red-50 text-red-500' : 'border-slate-200 bg-white text-slate-500 hover:border-red-200 hover:text-red-500'}`}
                          >
                            {isHeartedByCurrentUser || hasHeart ? '\u2764\uFE0F' : '\u2661'}
                          </button>
                        ) : (
                          <span
                            aria-label='Heart reaction'
                            className='mt-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-red-200 bg-red-50 text-lg leading-none text-red-500'
                          >
                            {'\u2764\uFE0F'}
                          </span>
                        )
                      )}

                      {canModify && !isEditing && (
                        <div className='mt-3 flex flex-wrap items-center gap-2'>
                          <button type='button' onClick={()=> startEdit(item)} className='text-xs font-semibold text-slate-500 transition hover:text-primary'>
                            Edit
                          </button>
                          {deleteConfirmId === item._id ? (
                            <>
                              <button
                                type='button'
                                disabled={Boolean(updatingMessageId)}
                                onClick={()=> handleDeleteMessage(item._id)}
                                className='text-xs font-semibold text-red-600 transition hover:text-red-500 disabled:opacity-60'
                              >
                                {updatingMessageId === item._id ? 'Deleting...' : 'Confirm delete'}
                              </button>
                              <button type='button' onClick={()=> setDeleteConfirmId('')} className='text-xs font-semibold text-slate-500 transition hover:text-slate-950'>
                                Keep
                              </button>
                            </>
                          ) : (
                            <button type='button' onClick={()=> setDeleteConfirmId(item._id)} className='text-xs font-semibold text-red-600 transition hover:text-red-500'>
                              Delete
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              }) : (
                <div className='rounded-md border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500'>
                  No messages yet. Start the conversation.
                </div>
              )}
            </div>
          </>
        )}

        <form onSubmit={handleSendMessage} className='mt-4 border-t border-slate-200 pt-4'>
          <label htmlFor={`booking-message-${booking._id}`} className='text-sm font-semibold text-slate-700'>Message</label>
          <textarea
            id={`booking-message-${booking._id}`}
            value={message}
            onChange={(event)=> setMessage(event.target.value)}
            rows={3}
            placeholder='Write a message...'
            className='mt-2 w-full resize-none rounded-md border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-primary placeholder:text-slate-400'
          />
          {attachmentPreview && (
            <div className='mt-3 flex items-start gap-3 rounded-md border border-slate-200 bg-white p-3'>
              <img src={attachmentPreview} alt='Selected attachment preview' className='h-20 w-28 rounded-md object-cover'/>
              <div className='min-w-0 flex-1'>
                <p className='truncate text-sm font-semibold text-slate-800'>{attachment?.name}</p>
                <p className='mt-1 text-xs text-slate-500'>Photo ready to send</p>
                <button type='button' onClick={clearAttachment} className='mt-2 text-xs font-semibold text-red-600 transition hover:text-red-500'>
                  Remove photo
                </button>
              </div>
            </div>
          )}
          <div className='mt-3 flex flex-wrap items-center justify-between gap-3'>
            <div className='flex flex-wrap items-center gap-2'>
              <div className='relative'>
                <button type='button' onClick={()=> setEmojiOpen(open => !open)} className='rounded-md border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-primary hover:text-primary'>
                  Emoji
                </button>
              {emojiOpen && (
                <div className='absolute bottom-12 left-0 z-10 grid max-h-36 w-56 grid-cols-6 gap-1 overflow-y-auto rounded-md border border-slate-200 bg-white p-2 shadow-xl'>
                  {compactEmojiOptions.map(emoji => (
                    <button key={emoji} type='button' onClick={()=> insertEmoji(emoji)} className='flex h-8 w-8 items-center justify-center rounded-md text-xl leading-none transition hover:bg-slate-100'>
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
              </div>
              <label className='cursor-pointer rounded-md border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-primary hover:text-primary'>
                Attach photo
                <input type='file' accept='image/*' hidden onChange={handleAttachmentChange}/>
              </label>
            </div>
            <button
              type='submit'
              disabled={(!message.trim() && !attachment) || sending}
              className='rounded-md bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-dull disabled:cursor-not-allowed disabled:opacity-60'
            >
              {sending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}

export default BookingConversation
