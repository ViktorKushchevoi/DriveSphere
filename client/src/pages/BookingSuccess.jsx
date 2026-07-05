import React, { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import Loader from '../components/Loader'
import { useAppContext } from '../context/AppContext'

const formatDate = (value)=> value ? value.split('T')[0] : '-'
const getBookingNumber = (booking)=> booking?.bookingNumber || booking?._id?.slice?.(-7) || ''

const BookingSuccess = () => {
  const {id} = useParams()
  const {axios, currency, navigate, user, setShowLogin} = useAppContext()

  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const rentalDays = useMemo(()=>{
    if(!booking?.pickupDate || !booking?.returnDate) return null
    const pickup = new Date(booking.pickupDate)
    const returned = new Date(booking.returnDate)
    const days = Math.ceil((returned - pickup) / (1000 * 60 * 60 * 24))
    return days > 0 ? days : null
  }, [booking])

  const fetchBooking = async ()=>{
    try {
      setLoading(true)
      setErrorMessage('')
      const {data} = await axios.get(`/api/bookings/${id}`)
      if(data.success){
        setBooking(data.booking)
      }else{
        setErrorMessage(data.message || 'Unable to load booking. Please try again.')
      }
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Unable to load booking. Please try again.')
    } finally {
      setLoading(false)
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

    fetchBooking()
  }, [id, user])

  if(loading){
    return <Loader />
  }

  if(errorMessage){
    return (
      <main className='bg-slate-50'>
        <div className='mx-auto max-w-4xl px-5 py-16 text-center md:px-8'>
          <div className='rounded-md border border-red-100 bg-red-50 p-8 text-red-700'>
            <h1 className='text-2xl font-semibold'>Booking unavailable</h1>
            <p className='mt-2 text-sm'>{errorMessage}</p>
            <button onClick={()=> navigate('/my-bookings')} className='mt-6 rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-dull'>
              View My Bookings
            </button>
          </div>
        </div>
      </main>
    )
  }

  if(!booking){
    return null
  }

  return (
    <main className='bg-slate-50'>
      <div className='mx-auto max-w-6xl px-5 py-12 md:px-8'>
        <div className='rounded-md border border-slate-200 bg-white p-5 shadow-sm md:p-8'>
          <div className='grid gap-8 lg:grid-cols-[360px_1fr]'>
            <img src={booking.car.image} alt={`${booking.car.brand} ${booking.car.model}`} className='h-72 w-full rounded-md object-cover lg:h-full'/>

            <div>
              <span className='inline-flex rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700'>Booking request submitted</span>
              <p className='mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-primary'>Booking #{getBookingNumber(booking)}</p>
              <h1 className='mt-5 text-4xl font-semibold text-slate-950'>{booking.car.brand} {booking.car.model}</h1>
              <p className='mt-3 text-slate-500'>Your booking is pending admin confirmation.</p>

              <div className='mt-6 grid gap-3 text-sm text-slate-600 sm:grid-cols-2'>
                <div className='rounded-md bg-slate-50 p-4'>
                  <p className='text-xs font-semibold uppercase tracking-wide text-slate-400'>Pickup</p>
                  <p className='mt-1 font-semibold text-slate-950'>{formatDate(booking.pickupDate)}{booking.pickupTime ? ` at ${booking.pickupTime}` : ''}</p>
                </div>
                <div className='rounded-md bg-slate-50 p-4'>
                  <p className='text-xs font-semibold uppercase tracking-wide text-slate-400'>Return</p>
                  <p className='mt-1 font-semibold text-slate-950'>{formatDate(booking.returnDate)}{booking.returnTime ? ` at ${booking.returnTime}` : ''}</p>
                </div>
                <div className='rounded-md bg-slate-50 p-4'>
                  <p className='text-xs font-semibold uppercase tracking-wide text-slate-400'>Rental length</p>
                  <p className='mt-1 font-semibold text-slate-950'>{rentalDays ? `${rentalDays} day${rentalDays > 1 ? 's' : ''}` : '-'}</p>
                </div>
                <div className='rounded-md bg-slate-50 p-4'>
                  <p className='text-xs font-semibold uppercase tracking-wide text-slate-400'>Status</p>
                  <p className='mt-1 font-semibold capitalize text-slate-950'>{booking.status}</p>
                </div>
                <div className='rounded-md bg-slate-50 p-4'>
                  <p className='text-xs font-semibold uppercase tracking-wide text-slate-400'>Delivery city</p>
                  <p className='mt-1 font-semibold text-slate-950'>{booking.deliveryCity || booking.car.location}</p>
                </div>
                <div className='rounded-md bg-slate-50 p-4'>
                  <p className='text-xs font-semibold uppercase tracking-wide text-slate-400'>Street address</p>
                  <p className='mt-1 font-semibold text-slate-950'>{booking.deliveryStreet || booking.deliveryAddress || '-'}</p>
                </div>
                {booking.deliveryDetails && (
                  <div className='rounded-md bg-slate-50 p-4 sm:col-span-2'>
                    <p className='text-xs font-semibold uppercase tracking-wide text-slate-400'>Apartment / building details</p>
                    <p className='mt-1 font-semibold text-slate-950'>{booking.deliveryDetails}</p>
                  </div>
                )}
              </div>

              <div className='mt-6 flex flex-col gap-4 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between'>
                <div>
                  <p className='text-sm text-slate-500'>Total price</p>
                  <p className='text-4xl font-semibold text-primary'>{currency}{booking.price}</p>
                </div>
                <div className='flex flex-col gap-3 sm:flex-row'>
                  <button onClick={()=> navigate('/cars')} className='rounded-md border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-primary hover:text-primary'>
                    Browse more cars
                  </button>
                  <button onClick={()=> navigate('/my-bookings')} className='rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-dull'>
                    View My Bookings
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default BookingSuccess
