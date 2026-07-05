import React, { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { useAppContext } from '../context/AppContext'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const Profile = () => {
  const {user, setUser, axios, fetchUser, navigate, setShowLogin} = useAppContext()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  })
  const [image, setImage] = useState(null)
  const [touched, setTouched] = useState({})
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const previewImage = image ? URL.createObjectURL(image) : user?.image
  const initial = formData.name?.charAt(0)?.toUpperCase() || user?.name?.charAt(0)?.toUpperCase() || 'U'

  const errors = useMemo(()=>{
    const nextErrors = {}

    if(!formData.name.trim()){
      nextErrors.name = 'Full name is required'
    }

    if(!formData.email.trim()){
      nextErrors.email = 'Email is required'
    }else if(!emailPattern.test(formData.email.trim())){
      nextErrors.email = 'Please enter a valid email address.'
    }

    const phoneDigits = formData.phone.replace(/\D/g, '')
    if(formData.phone.trim() && phoneDigits.length < 7){
      nextErrors.phone = 'Please enter a valid phone number.'
    }

    return nextErrors
  }, [formData])

  const showError = (field)=> (touched[field] || submitAttempted) && errors[field]

  const handleChange = (field, value)=>{
    setFormData(prev => ({...prev, [field]: value}))
  }

  const handleSubmit = async (event)=>{
    event.preventDefault()
    setSubmitAttempted(true)

    if(Object.keys(errors).length > 0){
      return
    }

    try {
      setIsSaving(true)
      const payload = new FormData()
      payload.append('name', formData.name.trim())
      payload.append('email', formData.email.trim())
      payload.append('phone', formData.phone.trim())
      if(image){
        payload.append('image', image)
      }

      const {data} = await axios.post('/api/user/update-profile', payload)
      if(data.success){
        toast.success(data.message)
        setImage(null)
        setUser(data.user)
        await fetchUser()
      }else{
        toast.error(data.message || 'Unable to update profile. Please try again.')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to update profile. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  useEffect(()=>{
    if(!user){
      setShowLogin(true)
      navigate('/')
      return
    }

    if(user.role === 'admin'){
      navigate('/admin', {replace: true})
      return
    }

    setFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
    })
  }, [navigate, setShowLogin, user])

  if(!user || user.role === 'admin'){
    return null
  }

  return (
    <main className='bg-slate-50'>
      <div className='mx-auto max-w-5xl px-5 py-12 md:px-8'>
        <div className='mb-8'>
          <p className='text-sm font-semibold uppercase tracking-[0.2em] text-primary'>Profile</p>
          <h1 className='mt-3 text-4xl font-semibold text-slate-950'>Your account details</h1>
          <p className='mt-3 max-w-2xl text-slate-500'>Manage your contact details for faster checkout on future bookings.</p>
        </div>

        <form onSubmit={handleSubmit} className='grid gap-6 rounded-md border border-slate-200 bg-white p-5 shadow-sm md:p-7 lg:grid-cols-[260px_1fr]'>
          <section className='rounded-md border border-slate-200 bg-slate-50 p-5'>
            <p className='font-semibold text-slate-950'>Profile image</p>
            <p className='mt-2 text-sm text-slate-500'>Upload an optional avatar for your account.</p>

            <label htmlFor="profile-image" className='mt-5 flex aspect-square cursor-pointer items-center justify-center overflow-hidden rounded-md border border-dashed border-slate-300 bg-white transition hover:border-primary'>
              {previewImage ? (
                <img src={previewImage} alt="" className='h-full w-full object-cover'/>
              ) : (
                <span className='flex h-20 w-20 items-center justify-center rounded-full bg-slate-950 text-2xl font-semibold text-white'>
                  {initial}
                </span>
              )}
              <input id="profile-image" type="file" accept="image/*" hidden onChange={event => setImage(event.target.files[0])}/>
            </label>
            <p className='mt-3 text-xs text-slate-500'>{image ? image.name : 'Current image is kept if no new file is selected.'}</p>
          </section>

          <section>
            <div className='grid gap-5 md:grid-cols-2'>
              <label className='flex flex-col gap-2'>
                <span className='text-sm font-semibold text-slate-700'>Full name</span>
                <input
                  type="text"
                  value={formData.name}
                  onChange={event => handleChange('name', event.target.value)}
                  onBlur={()=> setTouched(prev => ({...prev, name: true}))}
                  className={`rounded-md border px-4 py-3 outline-primary transition ${showError('name') ? 'border-red-300 bg-red-50/40' : 'border-slate-200 hover:border-primary'}`}
                />
                {showError('name') && <p className='text-sm font-medium text-red-600'>{errors.name}</p>}
              </label>

              <label className='flex flex-col gap-2'>
                <span className='text-sm font-semibold text-slate-700'>Email</span>
                <input
                  type="email"
                  value={formData.email}
                  onChange={event => handleChange('email', event.target.value)}
                  onBlur={()=> setTouched(prev => ({...prev, email: true}))}
                  className={`rounded-md border px-4 py-3 outline-primary transition ${showError('email') ? 'border-red-300 bg-red-50/40' : 'border-slate-200 hover:border-primary'}`}
                />
                {showError('email') && <p className='text-sm font-medium text-red-600'>{errors.email}</p>}
              </label>

              <label className='flex flex-col gap-2 md:col-span-2'>
                <span className='text-sm font-semibold text-slate-700'>Phone number</span>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={event => handleChange('phone', event.target.value)}
                  onBlur={()=> setTouched(prev => ({...prev, phone: true}))}
                  placeholder="Add your phone number"
                  className={`rounded-md border px-4 py-3 outline-primary transition ${showError('phone') ? 'border-red-300 bg-red-50/40' : 'border-slate-200 hover:border-primary'}`}
                />
                {showError('phone') && <p className='text-sm font-medium text-red-600'>{errors.phone}</p>}
              </label>
            </div>

            <div className='mt-6 flex justify-end'>
              <button disabled={isSaving} className='cursor-pointer rounded-md bg-primary px-6 py-3 font-semibold text-white transition hover:bg-primary-dull disabled:cursor-not-allowed disabled:opacity-70'>
                {isSaving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </section>
        </form>
      </div>
    </main>
  )
}

export default Profile
