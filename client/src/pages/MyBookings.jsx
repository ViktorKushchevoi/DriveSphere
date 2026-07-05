import React, { useEffect, useMemo, useState } from 'react'
import { assets} from '../assets/assets'
import Title from '../components/Title'
import { useAppContext } from '../context/AppContext'
import toast from 'react-hot-toast'
import { useSearchParams } from 'react-router-dom'
import BookingConversation from '../components/BookingConversation'
import CustomSelect from '../components/CustomSelect'
import Pagination from '../components/Pagination'

const splitAddressParts = (value)=> (value || '').split(',').map(part => part.trim()).filter(Boolean)

const getDeliveryParts = (booking)=>{
  const city = booking.deliveryCity || booking.car?.location || ''
  const rawStreet = booking.deliveryStreet || ''
  const rawDetails = booking.deliveryDetails || ''
  const fallbackAddress = booking.deliveryAddress || ''
  const source = rawStreet || fallbackAddress

  if(source.includes(',') && !rawDetails){
    const parts = splitAddressParts(source)
    const cityIndex = city ? parts.findIndex(part => part.toLowerCase() === city.toLowerCase()) : -1

    if(cityIndex >= 0){
      return {
        city,
        street: parts.slice(0, cityIndex).join(', ') || parts[0] || '',
        details: parts.slice(cityIndex + 1).join(', '),
      }
    }

    return {
      city,
      street: parts[0] || '',
      details: parts.slice(1).join(', '),
    }
  }

  return {city, street: rawStreet || fallbackAddress, details: rawDetails}
}

const formatLegacyDeliveryAddress = (booking)=>{
  const hasSeparatedAddress = Boolean(booking.deliveryCity || booking.deliveryStreet || booking.deliveryDetails)
  return hasSeparatedAddress ? '' : booking.deliveryAddress
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const getBookingNumber = (booking)=> booking?.bookingNumber || booking?._id?.slice?.(-7) || ''
const getBookingLabel = (booking)=> `Booking #${getBookingNumber(booking)}`
const normalizeBookingSearch = (value)=> value.trim().replace(/^#/, '').toLowerCase()
const formatMonthLabel = (monthKey)=>{
  if(!monthKey) return ''
  const [year, month] = monthKey.split('-').map(Number)
  return new Date(year, month - 1, 1).toLocaleString('en-US', {month: 'long', year: 'numeric'})
}
const getPickupMonthKey = (booking)=>{
  if(!booking?.pickupDate) return ''
  return booking.pickupDate.slice(0, 7)
}

const statusFilterOptions = [
  {value: 'all', label: 'All statuses'},
  {value: 'pending', label: 'Pending'},
  {value: 'confirmed', label: 'Confirmed'},
  {value: 'cancelled', label: 'Cancelled'},
]

const bookingsPerPage = 4

const MyBookings = () => {

  const { axios, user, currency, navigate } = useAppContext()
  const [searchParams] = useSearchParams()
  const bookingIdParam = searchParams.get('bookingId')

  const [bookings, setBookings] = useState([])
  const [reviewedCarIds, setReviewedCarIds] = useState([])
  const [highlightedBookingId, setHighlightedBookingId] = useState('')
  const [editingBooking, setEditingBooking] = useState(null)
  const [bookingToCancel, setBookingToCancel] = useState(null)
  const [expandedConversations, setExpandedConversations] = useState({})
  const [cancelSubmitting, setCancelSubmitting] = useState(false)
  const [editForm, setEditForm] = useState({
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    pickupTime: '',
    returnTime: '',
    deliveryCity: '',
    deliveryStreet: '',
    deliveryDetails: '',
    specialRequests: '',
  })
  const [editTouched, setEditTouched] = useState({})
  const [editSubmitAttempted, setEditSubmitAttempted] = useState(false)
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [monthFilter, setMonthFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)

  const fetchMyBookings = async ()=>{
    try {
      const { data } = await axios.get('/api/bookings/user')
      if (data.success){
        setBookings(data.bookings)
      }else{
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const fetchReviewedCars = async ()=>{
    try {
      const {data} = await axios.get('/api/reviews/my-reviewed-cars')
      if(data.success){
        setReviewedCarIds(data.reviewedCarIds || [])
      }
    } catch (error) {
      setReviewedCarIds([])
    }
  }

  const openCancelBooking = (booking)=>{
    setBookingToCancel(booking)
  }

  const closeCancelBooking = ()=>{
    if(cancelSubmitting) return
    setBookingToCancel(null)
  }

  const handleCancelBooking = async ()=>{
    if(!bookingToCancel) return
    try {
      setCancelSubmitting(true)
      const bookingId = bookingToCancel._id
      const { data } = await axios.post('/api/bookings/cancel', {bookingId})
      if(data.success){
        toast.success(data.message)
        setBookings(prev => prev.map(booking => booking._id === data.bookingId ? {...booking, status: 'cancelled'} : booking))
        setBookingToCancel(null)
        fetchMyBookings()
      }else{
        toast.error(data.message || 'Unable to cancel this booking. Please try again.')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to cancel this booking. Please try again.')
    } finally {
      setCancelSubmitting(false)
    }
  }

  const toggleConversation = (bookingId)=>{
    setExpandedConversations(prev => ({
      ...prev,
      [bookingId]: !prev[bookingId],
    }))
  }

  const markConversationRead = (bookingId)=>{
    setBookings(prev => prev.map(booking => booking._id === bookingId ? {...booking, unreadConversationCount: 0} : booking))
  }

  const monthFilterOptions = useMemo(()=>{
    const monthKeys = [...new Set(bookings.map(getPickupMonthKey).filter(Boolean))].sort().reverse()
    return [
      {value: 'all', label: 'All months'},
      ...monthKeys.map(monthKey => ({value: monthKey, label: formatMonthLabel(monthKey)})),
    ]
  }, [bookings])

  const filteredBookings = useMemo(()=>{
    const query = normalizeBookingSearch(searchQuery)

    return bookings.filter((booking)=>{
      const deliveryParts = getDeliveryParts(booking)
      const legacyAddress = formatLegacyDeliveryAddress(booking)
      const matchesStatus = statusFilter === 'all' || String(booking.status || '').toLowerCase() === statusFilter
      const matchesMonth = monthFilter === 'all' || getPickupMonthKey(booking) === monthFilter
      const searchableText = [
        getBookingNumber(booking),
        `#${getBookingNumber(booking)}`,
        booking.car?.brand,
        booking.car?.model,
        booking.status,
        booking.car?.location,
        deliveryParts.city,
        deliveryParts.street,
        deliveryParts.details,
        legacyAddress,
        booking.contactName,
        booking.contactEmail,
        booking.contactPhone,
      ].filter(Boolean).join(' ').toLowerCase()
      const matchesSearch = !query || searchableText.includes(query)

      return matchesStatus && matchesMonth && matchesSearch
    })
  }, [bookings, monthFilter, searchQuery, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / bookingsPerPage))
  const paginatedBookings = filteredBookings.slice((currentPage - 1) * bookingsPerPage, currentPage * bookingsPerPage)

  const clearFilters = ()=>{
    setSearchQuery('')
    setStatusFilter('all')
    setMonthFilter('all')
    setCurrentPage(1)
  }

  const editErrors = useMemo(()=>{
    const errors = {}

    if(!editForm.contactName.trim()){
      errors.contactName = 'Full name is required'
    }

    if(!editForm.contactEmail.trim()){
      errors.contactEmail = 'Email is required'
    }else if(!emailPattern.test(editForm.contactEmail.trim())){
      errors.contactEmail = 'Please enter a valid email address.'
    }

    const phoneDigits = editForm.contactPhone.replace(/\D/g, '')
    if(!editForm.contactPhone.trim()){
      errors.contactPhone = 'Phone number is required'
    }else if(phoneDigits.length < 7){
      errors.contactPhone = 'Enter a valid phone number'
    }

    if(!editForm.pickupTime.trim()){
      errors.pickupTime = 'Pickup time is required'
    }

    if(!editForm.returnTime.trim()){
      errors.returnTime = 'Return time is required'
    }

    if(!editForm.deliveryCity.trim()){
      errors.deliveryCity = 'Delivery city is required'
    }

    if(!editForm.deliveryStreet.trim()){
      errors.deliveryStreet = 'Street address is required'
    }

    return errors
  }, [editForm])

  const showEditError = (field)=> (editTouched[field] || editSubmitAttempted) && editErrors[field]

  const openEditDetails = (booking)=>{
    const deliveryParts = getDeliveryParts(booking)
    setEditingBooking(booking)
    setEditForm({
      contactName: booking.contactName || '',
      contactEmail: booking.contactEmail || '',
      contactPhone: booking.contactPhone || '',
      pickupTime: booking.pickupTime || '',
      returnTime: booking.returnTime || '',
      deliveryCity: deliveryParts.city,
      deliveryStreet: deliveryParts.street,
      deliveryDetails: deliveryParts.details,
      specialRequests: booking.specialRequests || '',
    })
    setEditTouched({})
    setEditSubmitAttempted(false)
  }

  const closeEditDetails = (force = false)=>{
    if(editSubmitting && !force) return
    setEditingBooking(null)
    setEditTouched({})
    setEditSubmitAttempted(false)
  }

  const handleEditChange = (field, value)=>{
    setEditForm(prev => ({...prev, [field]: value}))
  }

  const hasEditChanges = ()=>{
    if(!editingBooking) return false
    const deliveryParts = getDeliveryParts(editingBooking)
    const originalValues = {
      contactName: editingBooking.contactName || '',
      contactEmail: editingBooking.contactEmail || '',
      contactPhone: editingBooking.contactPhone || '',
      pickupTime: editingBooking.pickupTime || '',
      returnTime: editingBooking.returnTime || '',
      deliveryCity: deliveryParts.city,
      deliveryStreet: deliveryParts.street,
      deliveryDetails: deliveryParts.details,
      specialRequests: editingBooking.specialRequests || '',
    }

    return Object.keys(originalValues).some(field => String(editForm[field] || '').trim() !== String(originalValues[field] || '').trim())
  }

  const handleEditSubmit = async (event)=>{
    event.preventDefault()
    setEditSubmitAttempted(true)

    if(Object.keys(editErrors).length > 0){
      return
    }

    if(!hasEditChanges()){
      toast('No changes to save.')
      return
    }

    try {
      setEditSubmitting(true)
      const { data } = await axios.post('/api/bookings/update-details', {
        bookingId: editingBooking._id,
        contactName: editForm.contactName.trim(),
        contactEmail: editForm.contactEmail.trim(),
        contactPhone: editForm.contactPhone.trim(),
        pickupTime: editForm.pickupTime.trim(),
        returnTime: editForm.returnTime.trim(),
        deliveryCity: editForm.deliveryCity.trim(),
        deliveryStreet: editForm.deliveryStreet.trim(),
        deliveryDetails: editForm.deliveryDetails.trim(),
        specialRequests: editForm.specialRequests.trim(),
      })

      if(data.success){
        toast.success(data.message)
        setBookings(prev => prev.map(booking => booking._id === data.booking._id ? data.booking : booking))
        closeEditDetails(true)
      }else{
        toast.error(data.message || 'Unable to update booking details. Please try again.')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to update booking details. Please try again.')
    } finally {
      setEditSubmitting(false)
    }
  }

  useEffect(()=>{
    if(user){
      fetchMyBookings()
      fetchReviewedCars()
    }
  },[user])

  useEffect(()=>{
    setCurrentPage(1)
  }, [monthFilter, searchQuery, statusFilter])

  useEffect(()=>{
    if(currentPage > totalPages){
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  useEffect(()=>{
    if(!bookingIdParam || bookings.length === 0) return

    clearFilters()
  }, [bookingIdParam, bookings.length])

  useEffect(()=>{
    if(!bookingIdParam || filteredBookings.length === 0) return

    const bookingIndex = filteredBookings.findIndex((booking)=> booking._id === bookingIdParam)
    if(bookingIndex < 0) return

    const targetPage = Math.floor(bookingIndex / bookingsPerPage) + 1
    setCurrentPage(targetPage)
    setHighlightedBookingId(bookingIdParam)
    setExpandedConversations(prev => ({...prev, [bookingIdParam]: true}))
    window.setTimeout(()=>{
      document.getElementById(`booking-${bookingIdParam}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }, 0)

    const timeoutId = setTimeout(()=> setHighlightedBookingId(''), 2500)
    return ()=> clearTimeout(timeoutId)
  }, [bookingIdParam, filteredBookings])

  return (
    <main className='mx-auto max-w-7xl px-5 py-12 md:px-8'>
      <Title
        title='My Bookings'
        subTitle='Track upcoming reservations, statuses, and rental details from one clean view.'
        align="left"
      />

       <section className='mt-8 rounded-md border border-slate-200 bg-white p-5 shadow-sm'>
        <div className='flex flex-col gap-4 lg:flex-row lg:items-end'>
          <label className='flex flex-1 flex-col gap-2'>
            <span className='text-sm font-semibold text-slate-700'>Search bookings</span>
            <input
              type='search'
              value={searchQuery}
              onChange={(event)=> setSearchQuery(event.target.value)}
              placeholder='Search by booking #, car, city, address, or status'
              className='rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-primary transition focus:border-primary'
            />
          </label>

          <CustomSelect
            label='Status'
            value={statusFilter}
            onChange={setStatusFilter}
            options={statusFilterOptions}
            className='lg:w-56'
            buttonClassName='rounded-md shadow-none'
          />

          <CustomSelect
            label='Rental month'
            value={monthFilter}
            onChange={setMonthFilter}
            options={monthFilterOptions}
            className='lg:w-56'
            buttonClassName='rounded-md shadow-none'
          />

          <button
            type='button'
            onClick={clearFilters}
            className='rounded-md border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:border-primary hover:text-primary'
          >
            Clear filters
          </button>
        </div>
        <p className='mt-4 text-sm font-semibold text-slate-500'>{filteredBookings.length} bookings</p>
       </section>

       <div className='mt-10 grid gap-5'>
        {bookings.length > 0 && filteredBookings.length > 0 ? paginatedBookings.map((booking)=>(
          <article 
          key={booking._id}
          id={`booking-${booking._id}`}
          className={`grid grid-cols-1 gap-6 rounded-md border border-slate-200 bg-white p-5 shadow-sm transition md:grid-cols-[220px_1fr_auto] ${highlightedBookingId === booking._id ? 'ring-2 ring-primary/40' : ''}`}
          >
            <img src={booking.car.image} alt={`${booking.car.brand} ${booking.car.model}`} className='h-44 w-full rounded-md object-cover md:h-full'/>

            <div>
              <div className='flex flex-wrap items-center gap-3'>
                <p className='rounded-md bg-light px-3 py-1 text-sm font-medium text-slate-600'>{getBookingLabel(booking)}</p>
                <p className={`rounded-md px-3 py-1 text-xs font-semibold uppercase ${booking.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700' : booking.status === 'cancelled' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>{booking.status}</p>
              </div>

              <h2 className='mt-4 text-2xl font-semibold text-slate-950'>{booking.car.brand} {booking.car.model}</h2>
              <p className='mt-1 text-slate-500'>{booking.car.year} / {booking.car.category} / {booking.car.location}</p>

              <div className='mt-5 grid gap-4 text-sm text-slate-600 sm:grid-cols-2'>
                <div className='flex items-start gap-3'>
                  <img src={assets.calendar_icon_colored} alt="" className='mt-1 h-4 w-4'/>
                  <div>
                    <p className='font-medium text-slate-900'>Rental Period</p>
                    <p>{booking.pickupDate.split('T')[0]}{booking.pickupTime ? ` at ${booking.pickupTime}` : ''} to {booking.returnDate.split('T')[0]}{booking.returnTime ? ` at ${booking.returnTime}` : ''}</p>
                  </div>
                </div>

                <div className='flex items-start gap-3'>
                  <img src={assets.location_icon_colored} alt="" className='mt-1 h-4 w-4'/>
                  <div>
                    <p className='font-medium text-slate-900'>Pick-up Location</p>
                    <p>{booking.car.location}</p>
                  </div>
                </div>
              </div>

              {(booking.contactName || booking.contactEmail || booking.contactPhone || booking.deliveryAddress || booking.deliveryCity || booking.deliveryStreet || booking.deliveryDetails || booking.specialRequests) && (
                <div className='mt-5 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600'>
                  <p className='font-semibold text-slate-900'>Booking contact</p>
                  <div className='mt-3 grid gap-2 sm:grid-cols-2'>
                    {(() => {
                      const deliveryParts = getDeliveryParts(booking)
                      const legacyAddress = formatLegacyDeliveryAddress(booking)
                      return (
                        <>
                          {booking.contactName && <p><span className='font-medium text-slate-800'>Name:</span> {booking.contactName}</p>}
                          {booking.contactEmail && <p><span className='font-medium text-slate-800'>Email:</span> {booking.contactEmail}</p>}
                          {booking.contactPhone && <p><span className='font-medium text-slate-800'>Phone:</span> {booking.contactPhone}</p>}
                          {deliveryParts.city && <p><span className='font-medium text-slate-800'>City:</span> {deliveryParts.city}</p>}
                          {deliveryParts.street && <p><span className='font-medium text-slate-800'>Street:</span> {deliveryParts.street}</p>}
                          {deliveryParts.details && <p><span className='font-medium text-slate-800'>Details:</span> {deliveryParts.details}</p>}
                          {legacyAddress && <p className='sm:col-span-2'><span className='font-medium text-slate-800'>Delivery:</span> {legacyAddress}</p>}
                          {booking.specialRequests && <p className='sm:col-span-2'><span className='font-medium text-slate-800'>Special requests:</span> {booking.specialRequests}</p>}
                        </>
                      )
                    })()}
                  </div>
                </div>
              )}
            </div>

            <div className='flex flex-row justify-between border-t border-slate-200 pt-4 md:flex-col md:border-l md:border-t-0 md:pl-6 md:pt-0 md:text-right'>
              <div>
                <p className='text-sm text-slate-500'>Total Price</p>
                <h3 className='text-3xl font-semibold text-primary'>{currency}{booking.price}</h3>
              </div>
              <div className='flex flex-col gap-3 md:items-end'>
                <p className='text-sm text-slate-500'>Booked on {booking.createdAt.split('T')[0]}</p>
                <button
                  type="button"
                  onClick={()=> toggleConversation(booking._id)}
                  className='relative w-max cursor-pointer rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-primary hover:text-primary'
                >
                  {expandedConversations[booking._id] ? 'Hide conversation' : 'Show conversation'}
                  {Number(booking.unreadConversationCount) > 0 && (
                    <span className='absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-white'>
                      {booking.unreadConversationCount}
                    </span>
                  )}
                </button>
                {booking.status === 'confirmed' && !reviewedCarIds.includes(booking.car?._id) && (
                  <button
                    type="button"
                    onClick={()=> navigate(`/car-details/${booking.car._id}#reviews`)}
                    className='w-max cursor-pointer rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 transition hover:border-amber-300'
                  >
                    Leave review
                  </button>
                )}
                {['pending', 'confirmed'].includes(booking.status) && (
                  <>
                    <button
                      type="button"
                      onClick={()=> openEditDetails(booking)}
                      className='w-max cursor-pointer rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-primary hover:text-primary'
                    >
                      Edit details
                    </button>
                    <button
                      type="button"
                      onClick={()=> openCancelBooking(booking)}
                      className='w-max cursor-pointer rounded-md border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50'
                    >
                      Cancel Booking
                    </button>
                  </>
                )}
              </div>
            </div>
            {expandedConversations[booking._id] && (
              <div className='md:col-span-3'>
                <BookingConversation booking={booking} onRead={markConversationRead} />
              </div>
            )}
          </article>
        )) : bookings.length > 0 ? (
          <div className='rounded-md border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm'>
            <div className='mx-auto flex h-14 w-14 items-center justify-center rounded-md bg-slate-100'>
              <img src={assets.calendar_icon_colored} alt="" className='h-6 w-6'/>
            </div>
            <h2 className='mt-5 text-xl font-semibold text-slate-950'>No bookings match your filters.</h2>
            <p className='mt-2 text-slate-500'>Try a different search term, status, or rental month.</p>
            <button type='button' onClick={clearFilters} className='mt-5 rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-dull'>
              Clear filters
            </button>
          </div>
        ) : (
          <div className='rounded-md border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm'>
            <div className='mx-auto flex h-14 w-14 items-center justify-center rounded-md bg-slate-100'>
              <img src={assets.calendar_icon_colored} alt="" className='h-6 w-6'/>
            </div>
            <h2 className='mt-5 text-xl font-semibold text-slate-950'>No bookings yet</h2>
            <p className='mt-2 text-slate-500'>Your booking history will appear here after you reserve a car.</p>
          </div>
        )}

        {bookings.length > 0 && filteredBookings.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredBookings.length}
            pageSize={bookingsPerPage}
          />
        )}
       </div>

       {editingBooking && (
        <div onClick={closeEditDetails} className='fixed inset-0 z-100 flex items-center bg-slate-950/70 px-5 backdrop-blur-sm'>
          <form onSubmit={handleEditSubmit} onClick={(event)=> event.stopPropagation()} className='mx-auto max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-md bg-white p-6 shadow-2xl'>
            <div>
              <p className='text-sm font-semibold uppercase tracking-[0.2em] text-primary'>Booking details</p>
              <h2 className='mt-2 text-2xl font-semibold text-slate-950'>Edit booking details</h2>
              <p className='mt-2 text-sm text-slate-500'>Rental dates, car, price, and status cannot be changed here.</p>
            </div>

            <div className='mt-6 grid gap-5 sm:grid-cols-2'>
              <div className='flex flex-col gap-2 sm:col-span-2'>
                <span className='text-sm font-semibold text-slate-700'>Booking number</span>
                <div className='rounded-md border border-slate-200 bg-slate-50 px-4 py-3 font-semibold text-slate-700'>
                  {getBookingLabel(editingBooking)}
                </div>
              </div>

              <div className='flex flex-col gap-2'>
                <label htmlFor="edit-contact-name" className='text-sm font-semibold text-slate-700'>Full name</label>
                <input
                  id="edit-contact-name"
                  type="text"
                  value={editForm.contactName}
                  onChange={(event)=> handleEditChange('contactName', event.target.value)}
                  onBlur={()=> setEditTouched(prev => ({...prev, contactName: true}))}
                  className={`rounded-md border px-4 py-3 outline-primary ${showEditError('contactName') ? 'border-red-300 bg-red-50/40' : 'border-slate-200'}`}
                />
                {showEditError('contactName') && <p className='text-sm font-medium text-red-600'>{editErrors.contactName}</p>}
              </div>

              <div className='flex flex-col gap-2'>
                <label htmlFor="edit-contact-email" className='text-sm font-semibold text-slate-700'>Email</label>
                <input
                  id="edit-contact-email"
                  type="email"
                  value={editForm.contactEmail}
                  onChange={(event)=> handleEditChange('contactEmail', event.target.value)}
                  onBlur={()=> setEditTouched(prev => ({...prev, contactEmail: true}))}
                  className={`rounded-md border px-4 py-3 outline-primary ${showEditError('contactEmail') ? 'border-red-300 bg-red-50/40' : 'border-slate-200'}`}
                />
                {showEditError('contactEmail') && <p className='text-sm font-medium text-red-600'>{editErrors.contactEmail}</p>}
              </div>

              <div className='flex flex-col gap-2'>
                <label htmlFor="edit-contact-phone" className='text-sm font-semibold text-slate-700'>Phone number</label>
                <input
                  id="edit-contact-phone"
                  type="tel"
                  value={editForm.contactPhone}
                  onChange={(event)=> handleEditChange('contactPhone', event.target.value)}
                  onBlur={()=> setEditTouched(prev => ({...prev, contactPhone: true}))}
                  className={`rounded-md border px-4 py-3 outline-primary ${showEditError('contactPhone') ? 'border-red-300 bg-red-50/40' : 'border-slate-200'}`}
                />
                {showEditError('contactPhone') && <p className='text-sm font-medium text-red-600'>{editErrors.contactPhone}</p>}
              </div>

              <div className='flex flex-col gap-2'>
                <label htmlFor="edit-pickup-time" className='text-sm font-semibold text-slate-700'>Pickup time</label>
                <input
                  id="edit-pickup-time"
                  type="time"
                  value={editForm.pickupTime}
                  onChange={(event)=> handleEditChange('pickupTime', event.target.value)}
                  onBlur={()=> setEditTouched(prev => ({...prev, pickupTime: true}))}
                  className={`rounded-md border px-4 py-3 outline-primary ${showEditError('pickupTime') ? 'border-red-300 bg-red-50/40' : 'border-slate-200'}`}
                />
                {showEditError('pickupTime') && <p className='text-sm font-medium text-red-600'>{editErrors.pickupTime}</p>}
              </div>

              <div className='flex flex-col gap-2'>
                <label htmlFor="edit-return-time" className='text-sm font-semibold text-slate-700'>Return time</label>
                <input
                  id="edit-return-time"
                  type="time"
                  value={editForm.returnTime}
                  onChange={(event)=> handleEditChange('returnTime', event.target.value)}
                  onBlur={()=> setEditTouched(prev => ({...prev, returnTime: true}))}
                  className={`rounded-md border px-4 py-3 outline-primary ${showEditError('returnTime') ? 'border-red-300 bg-red-50/40' : 'border-slate-200'}`}
                />
                {showEditError('returnTime') && <p className='text-sm font-medium text-red-600'>{editErrors.returnTime}</p>}
              </div>

              <div className='flex flex-col gap-2'>
                <label htmlFor="edit-delivery-city" className='text-sm font-semibold text-slate-700'>Delivery city</label>
                <input
                  id="edit-delivery-city"
                  type="text"
                  value={editForm.deliveryCity}
                  onChange={(event)=> handleEditChange('deliveryCity', event.target.value)}
                  onBlur={()=> setEditTouched(prev => ({...prev, deliveryCity: true}))}
                  className={`rounded-md border px-4 py-3 outline-primary ${showEditError('deliveryCity') ? 'border-red-300 bg-red-50/40' : 'border-slate-200'}`}
                />
                {showEditError('deliveryCity') && <p className='text-sm font-medium text-red-600'>{editErrors.deliveryCity}</p>}
              </div>

              <div className='flex flex-col gap-2 sm:col-span-2'>
                <label htmlFor="edit-delivery-street" className='text-sm font-semibold text-slate-700'>Street address</label>
                <input
                  id="edit-delivery-street"
                  type="text"
                  value={editForm.deliveryStreet}
                  onChange={(event)=> handleEditChange('deliveryStreet', event.target.value)}
                  onBlur={()=> setEditTouched(prev => ({...prev, deliveryStreet: true}))}
                  className={`rounded-md border px-4 py-3 outline-primary ${showEditError('deliveryStreet') ? 'border-red-300 bg-red-50/40' : 'border-slate-200'}`}
                />
                {showEditError('deliveryStreet') && <p className='text-sm font-medium text-red-600'>{editErrors.deliveryStreet}</p>}
              </div>

              <div className='flex flex-col gap-2'>
                <label htmlFor="edit-delivery-details" className='text-sm font-semibold text-slate-700'>Apartment / building details</label>
                <input
                  id="edit-delivery-details"
                  type="text"
                  value={editForm.deliveryDetails}
                  onChange={(event)=> handleEditChange('deliveryDetails', event.target.value)}
                  className='rounded-md border border-slate-200 px-4 py-3 outline-primary'
                />
              </div>

              <div className='flex flex-col gap-2'>
                <label htmlFor="edit-special-requests" className='text-sm font-semibold text-slate-700'>Special requests</label>
                <textarea
                  id="edit-special-requests"
                  value={editForm.specialRequests}
                  onChange={(event)=> handleEditChange('specialRequests', event.target.value)}
                  rows={3}
                  className='resize-none rounded-md border border-slate-200 px-4 py-3 outline-primary'
                />
              </div>
            </div>

            <div className='mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end'>
              <button type="button" onClick={closeEditDetails} className='cursor-pointer rounded-md border border-slate-200 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50'>
                Cancel
              </button>
              <button type="submit" disabled={editSubmitting} className='cursor-pointer rounded-md bg-primary px-5 py-3 font-semibold text-white transition hover:bg-primary-dull disabled:cursor-not-allowed disabled:opacity-70'>
                {editSubmitting ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </form>
        </div>
       )}

       {bookingToCancel && (
        <div onClick={closeCancelBooking} className='fixed inset-0 z-100 flex items-center bg-slate-950/70 px-5 backdrop-blur-sm'>
          <div onClick={(event)=> event.stopPropagation()} className='mx-auto w-full max-w-md rounded-md border border-slate-200 bg-white p-6 shadow-2xl'>
            <div className='flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-xl font-semibold text-red-600'>
              !
            </div>
            <h2 className='mt-5 text-2xl font-semibold text-slate-950'>Cancel booking?</h2>
            <p className='mt-3 text-sm leading-6 text-slate-500'>This booking will be marked as cancelled. You can still view it in your booking history.</p>

            <div className='mt-5 rounded-md border border-slate-200 bg-slate-50 p-4'>
              <p className='font-semibold text-slate-950'>{bookingToCancel.car?.brand} {bookingToCancel.car?.model}</p>
              <p className='mt-1 text-sm text-slate-500'>
                {bookingToCancel.pickupDate?.split('T')[0]} to {bookingToCancel.returnDate?.split('T')[0]}
              </p>
            </div>

            <div className='mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end'>
              <button
                type="button"
                disabled={cancelSubmitting}
                onClick={closeCancelBooking}
                className='cursor-pointer rounded-md border border-slate-200 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60'
              >
                Keep booking
              </button>
              <button
                type="button"
                disabled={cancelSubmitting}
                onClick={handleCancelBooking}
                className='cursor-pointer rounded-md bg-red-600 px-5 py-3 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70'
              >
                {cancelSubmitting ? 'Cancelling...' : 'Yes, cancel booking'}
              </button>
            </div>
          </div>
        </div>
       )}

    </main>
  )
}

export default MyBookings
