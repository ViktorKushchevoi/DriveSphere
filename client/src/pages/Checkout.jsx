import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { assets } from '../assets/assets'
import Loader from '../components/Loader'
import { useAppContext } from '../context/AppContext'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const adminBookingMessage = 'Admin accounts cannot create bookings. Please use a customer account to book a car.'

const Checkout = () => {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const {
    cars,
    axios,
    user,
    token,
    currency,
    pickupDate: contextPickupDate,
    returnDate: contextReturnDate,
    setShowLogin,
  } = useAppContext()

  const pickupDate = searchParams.get('pickupDate') || contextPickupDate
  const returnDate = searchParams.get('returnDate') || contextReturnDate
  const car = cars.find(item => item._id === id)

  const [formData, setFormData] = useState({
    pickupTime: '',
    returnTime: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    deliveryStreet: '',
    deliveryDetails: '',
    specialRequests: '',
  })
  const [touched, setTouched] = useState({})
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const rentalDays = useMemo(()=>{
    if(!pickupDate || !returnDate || returnDate <= pickupDate) return null
    const pickup = new Date(`${pickupDate}T00:00:00`)
    const dropoff = new Date(`${returnDate}T00:00:00`)
    const days = Math.ceil((dropoff - pickup) / (1000 * 60 * 60 * 24))
    return days > 0 ? days : null
  },[pickupDate, returnDate])

  const totalPrice = rentalDays && car ? rentalDays * Number(car.pricePerDay || 0) : null
  const datesAreValid = Boolean(pickupDate && returnDate && rentalDays)

  const bookingDateTimeIsValid = useMemo(()=>{
    if(!datesAreValid || !formData.pickupTime || !formData.returnTime) return false
    const pickup = new Date(`${pickupDate}T${formData.pickupTime}:00`)
    const returned = new Date(`${returnDate}T${formData.returnTime}:00`)
    return !Number.isNaN(pickup.getTime()) && !Number.isNaN(returned.getTime()) && returned > pickup
  },[datesAreValid, formData.pickupTime, formData.returnTime, pickupDate, returnDate])

  const errors = useMemo(()=>{
    const nextErrors = {}

    if(!formData.contactName.trim()){
      nextErrors.contactName = 'Full name is required'
    }

    if(!formData.pickupTime){
      nextErrors.pickupTime = 'Pickup time is required'
    }

    if(!formData.returnTime){
      nextErrors.returnTime = 'Return time is required'
    }

    if(formData.pickupTime && formData.returnTime && datesAreValid && !bookingDateTimeIsValid){
      nextErrors.returnTime = 'Return date and time must be after pickup date and time'
    }

    if(!formData.contactEmail.trim()){
      nextErrors.contactEmail = 'Email is required'
    }else if(!emailPattern.test(formData.contactEmail.trim())){
      nextErrors.contactEmail = 'Enter a valid email address'
    }

    const phoneDigits = formData.contactPhone.replace(/\D/g, '')
    if(!formData.contactPhone.trim()){
      nextErrors.contactPhone = 'Phone number is required'
    }else if(phoneDigits.length < 7){
      nextErrors.contactPhone = 'Enter a valid phone number'
    }

    if(!car?.location?.trim()){
      nextErrors.deliveryCity = 'Delivery city is required'
    }

    if(!formData.deliveryStreet.trim()){
      nextErrors.deliveryStreet = 'Street address is required'
    }

    return nextErrors
  },[bookingDateTimeIsValid, car?.location, datesAreValid, formData])

  const showError = (field)=> (touched[field] || submitAttempted) && errors[field]

  const handleChange = (field, value)=>{
    setFormData(prev => ({...prev, [field]: value}))
    setSubmitError('')
  }

  const handleBlur = (field)=>{
    setTouched(prev => ({...prev, [field]: true}))
  }

  const handleSubmit = async (e)=>{
    e.preventDefault()
    setSubmitAttempted(true)
    setSubmitError('')

    if(!user || !token){
      toast.error('Please log in or create an account to book this car.')
      setShowLogin(true)
      return
    }

    if(user.role === 'admin'){
      toast.error(adminBookingMessage)
      navigate('/admin', {replace: true})
      return
    }

    if(!datesAreValid){
      setSubmitError('Return date must be after pickup date')
      return
    }

    if(Object.keys(errors).length > 0){
      return
    }

    try {
      setIsSubmitting(true)
      const { data } = await axios.post('/api/bookings/create', {
        car: id,
        pickupDate,
        returnDate,
        pickupTime: formData.pickupTime,
        returnTime: formData.returnTime,
        contactName: formData.contactName.trim(),
        contactEmail: formData.contactEmail.trim(),
        contactPhone: formData.contactPhone.trim(),
        deliveryCity: car.location,
        deliveryStreet: formData.deliveryStreet.trim(),
        deliveryDetails: formData.deliveryDetails.trim(),
        specialRequests: formData.specialRequests.trim(),
      })

      if(data.success){
        toast.success(data.message)
        navigate(`/booking-success/${data.bookingId}`)
      }else{
        setSubmitError(data.message || 'Unable to create booking. Please try again.')
      }
    } catch (error) {
      if(error.response?.status === 401){
        toast.error('Please log in or create an account to book this car.')
        setShowLogin(true)
      }else{
        setSubmitError(error.response?.data?.message || 'Unable to create booking. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(()=>{
    if(user){
      setFormData(prev => ({
        ...prev,
        contactName: prev.contactName || user.name || '',
        contactEmail: prev.contactEmail || user.email || '',
        contactPhone: prev.contactPhone || user.phone || '',
      }))
    }
  },[user])

  useEffect(()=>{
    if(user?.role === 'admin'){
      toast.error(adminBookingMessage)
      navigate('/admin', {replace: true})
    }
  },[user, navigate])

  if(!car){
    return <Loader />
  }

  return (
    <main className='bg-slate-50'>
      <div className='mx-auto max-w-7xl px-5 py-10 md:px-8 md:py-12'>
        <button onClick={()=> navigate(`/car-details/${id}`)} className='mb-6 flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-primary'>
          <img src={assets.arrow_icon} alt="" className='rotate-180 opacity-65'/>
          Back to car details
        </button>

        <div className='mb-8'>
          <p className='text-sm font-semibold uppercase tracking-[0.2em] text-primary'>Checkout</p>
          <h1 className='mt-3 text-4xl font-semibold text-slate-950'>Confirm your reservation</h1>
          <p className='mt-3 max-w-2xl text-slate-500'>Review your rental dates, add contact details, and send your booking request.</p>
        </div>

        <div className='grid gap-8 lg:grid-cols-[minmax(0,1fr)_390px]'>
          <form onSubmit={handleSubmit} className='rounded-md border border-slate-200 bg-white p-5 shadow-sm md:p-7'>
            <div>
              <h2 className='text-2xl font-semibold text-slate-950'>Contact details</h2>
              <p className='mt-2 text-sm text-slate-500'>These details help the team confirm delivery and booking updates.</p>
            </div>

            <div className='mt-6 grid gap-5 md:grid-cols-2'>
              <div className='flex flex-col gap-2'>
                <label htmlFor="checkout-pickup-time" className='text-sm font-semibold text-slate-700'>Pickup time</label>
                <input
                  id="checkout-pickup-time"
                  type="time"
                  value={formData.pickupTime}
                  onChange={(e)=> handleChange('pickupTime', e.target.value)}
                  onBlur={()=> handleBlur('pickupTime')}
                  className={`rounded-md border px-4 py-3 outline-primary transition ${showError('pickupTime') ? 'border-red-300 bg-red-50/40' : 'border-slate-200 hover:border-primary'}`}
                />
                {showError('pickupTime') && <p className='text-sm font-medium text-red-600'>{errors.pickupTime}</p>}
              </div>

              <div className='flex flex-col gap-2'>
                <label htmlFor="checkout-return-time" className='text-sm font-semibold text-slate-700'>Return time</label>
                <input
                  id="checkout-return-time"
                  type="time"
                  value={formData.returnTime}
                  onChange={(e)=> handleChange('returnTime', e.target.value)}
                  onBlur={()=> handleBlur('returnTime')}
                  className={`rounded-md border px-4 py-3 outline-primary transition ${showError('returnTime') ? 'border-red-300 bg-red-50/40' : 'border-slate-200 hover:border-primary'}`}
                />
                {showError('returnTime') && <p className='text-sm font-medium text-red-600'>{errors.returnTime}</p>}
              </div>

              <div className='flex flex-col gap-2'>
                <label htmlFor="checkout-name" className='text-sm font-semibold text-slate-700'>Full name</label>
                <input
                  id="checkout-name"
                  type="text"
                  value={formData.contactName}
                  onChange={(e)=> handleChange('contactName', e.target.value)}
                  onBlur={()=> handleBlur('contactName')}
                  placeholder="Enter your full name"
                  autoComplete="name"
                  className={`rounded-md border px-4 py-3 outline-primary transition ${showError('contactName') ? 'border-red-300 bg-red-50/40' : 'border-slate-200 hover:border-primary'}`}
                />
                {showError('contactName') && <p className='text-sm font-medium text-red-600'>{errors.contactName}</p>}
              </div>

              <div className='flex flex-col gap-2'>
                <label htmlFor="checkout-email" className='text-sm font-semibold text-slate-700'>Email</label>
                <input
                  id="checkout-email"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e)=> handleChange('contactEmail', e.target.value)}
                  onBlur={()=> handleBlur('contactEmail')}
                  placeholder="Enter your email"
                  autoComplete="email"
                  className={`rounded-md border px-4 py-3 outline-primary transition ${showError('contactEmail') ? 'border-red-300 bg-red-50/40' : 'border-slate-200 hover:border-primary'}`}
                />
                {showError('contactEmail') && <p className='text-sm font-medium text-red-600'>{errors.contactEmail}</p>}
              </div>

              <div className='flex flex-col gap-2'>
                <label htmlFor="checkout-phone" className='text-sm font-semibold text-slate-700'>Phone number</label>
                <input
                  id="checkout-phone"
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e)=> handleChange('contactPhone', e.target.value)}
                  onBlur={()=> handleBlur('contactPhone')}
                  placeholder="Enter your phone number"
                  autoComplete="tel"
                  className={`rounded-md border px-4 py-3 outline-primary transition ${showError('contactPhone') ? 'border-red-300 bg-red-50/40' : 'border-slate-200 hover:border-primary'}`}
                />
                {showError('contactPhone') && <p className='text-sm font-medium text-red-600'>{errors.contactPhone}</p>}
              </div>

              <div className='flex flex-col gap-2'>
                <label htmlFor="checkout-city" className='text-sm font-semibold text-slate-700'>Delivery city</label>
                <input
                  id="checkout-city"
                  type="text"
                  value={car.location || ''}
                  readOnly
                  disabled
                  className={`rounded-md border px-4 py-3 outline-primary transition disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-600 ${showError('deliveryCity') ? 'border-red-300 bg-red-50/40' : 'border-slate-200'}`}
                />
                {showError('deliveryCity') && <p className='text-sm font-medium text-red-600'>{errors.deliveryCity}</p>}
              </div>

              <div className='flex flex-col gap-2'>
                <label htmlFor="checkout-street" className='text-sm font-semibold text-slate-700'>Street address</label>
                <input
                  id="checkout-street"
                  type="text"
                  value={formData.deliveryStreet}
                  onChange={(e)=> handleChange('deliveryStreet', e.target.value)}
                  onBlur={()=> handleBlur('deliveryStreet')}
                  placeholder="Enter street address"
                  autoComplete="street-address"
                  className={`rounded-md border px-4 py-3 outline-primary transition ${showError('deliveryStreet') ? 'border-red-300 bg-red-50/40' : 'border-slate-200 hover:border-primary'}`}
                />
                {showError('deliveryStreet') && <p className='text-sm font-medium text-red-600'>{errors.deliveryStreet}</p>}
              </div>

              <div className='flex flex-col gap-2'>
                <label htmlFor="checkout-delivery-details" className='text-sm font-semibold text-slate-700'>Apartment / building details</label>
                <input
                  id="checkout-delivery-details"
                  type="text"
                  value={formData.deliveryDetails}
                  onChange={(e)=> handleChange('deliveryDetails', e.target.value)}
                  placeholder="Optional delivery details"
                  autoComplete="address-line2"
                  className='rounded-md border border-slate-200 px-4 py-3 outline-primary transition hover:border-primary'
                />
              </div>

              <div className='flex flex-col gap-2'>
                <label htmlFor="checkout-requests" className='text-sm font-semibold text-slate-700'>Special requests</label>
                <textarea
                  id="checkout-requests"
                  value={formData.specialRequests}
                  onChange={(e)=> handleChange('specialRequests', e.target.value)}
                  placeholder="Add pickup notes or requests"
                  rows={4}
                  className='resize-none rounded-md border border-slate-200 px-4 py-3 outline-primary transition hover:border-primary'
                />
              </div>
            </div>

            {submitError && <p className='mt-5 rounded-md bg-red-50 px-4 py-3 text-sm font-medium text-red-700'>{submitError}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className='mt-6 w-full cursor-pointer rounded-md bg-primary py-3.5 font-semibold text-white transition hover:bg-primary-dull disabled:cursor-not-allowed disabled:opacity-70'
            >
              {isSubmitting ? 'Confirming...' : 'Confirm Booking'}
            </button>
          </form>

          <aside className='lg:sticky lg:top-24 lg:h-max'>
            <div className='overflow-hidden rounded-md border border-slate-200 bg-white shadow-xl shadow-slate-200/70'>
              <img src={car.image} alt={`${car.brand} ${car.model}`} className='h-56 w-full object-cover'/>
              <div className='p-5'>
                <div className='flex flex-wrap items-center gap-2'>
                  <span className='rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600'>{car.category}</span>
                  <span className='rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600'>{car.year}</span>
                </div>
                <h2 className='mt-4 text-2xl font-semibold text-slate-950'>{car.brand} {car.model}</h2>
                <p className='mt-2 flex items-center gap-2 text-sm text-slate-500'>
                  <img src={assets.location_icon} alt="" className='h-4 opacity-70'/>
                  {car.location}
                </p>

                <div className='mt-5 grid gap-3 rounded-md bg-slate-50 p-4 text-sm'>
                  <div className='flex items-center justify-between'>
                    <span className='text-slate-500'>Pickup date</span>
                    <span className='font-semibold text-slate-950'>{pickupDate || '-'}</span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-slate-500'>Pickup time</span>
                    <span className='font-semibold text-slate-950'>{formData.pickupTime || '-'}</span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-slate-500'>Return date</span>
                    <span className='font-semibold text-slate-950'>{returnDate || '-'}</span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-slate-500'>Return time</span>
                    <span className='font-semibold text-slate-950'>{formData.returnTime || '-'}</span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-slate-500'>Rental length</span>
                    <span className='font-semibold text-slate-950'>{rentalDays ? `${rentalDays} day${rentalDays > 1 ? 's' : ''}` : 'Select dates'}</span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-slate-500'>Price per day</span>
                    <span className='font-semibold text-slate-950'>{currency}{car.pricePerDay}</span>
                  </div>
                </div>

                {!datesAreValid && (
                  <p className='mt-4 rounded-md bg-red-50 px-4 py-3 text-sm font-medium text-red-700'>Return date must be after pickup date</p>
                )}

                <div className='mt-5 flex items-end justify-between border-t border-slate-200 pt-5'>
                  <span className='text-slate-500'>Total price</span>
                  <span className='text-3xl font-semibold text-primary'>{totalPrice ? `${currency}${totalPrice}` : '-'}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}

export default Checkout
