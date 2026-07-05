import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { assets } from '../assets/assets'
import Loader from '../components/Loader'
import { useAppContext } from '../context/AppContext'
import toast from 'react-hot-toast'
import DatePicker from '../components/DatePicker'
import Pagination from '../components/Pagination'

const reviewsPerPage = 5

const CarDetails = () => {

  const {id} = useParams()
  const location = useLocation()

  const {cars, axios, pickupDate, setPickupDate, returnDate, setReturnDate, user, token, setShowLogin, isAdmin, isCarSaved, toggleSavedCar} = useAppContext()

  const navigate = useNavigate()
  const [car, setCar] = useState(null)
  const [dateError, setDateError] = useState('')
  const [unavailableRanges, setUnavailableRanges] = useState([])
  const [unavailableLoading, setUnavailableLoading] = useState(false)
  const [reviews, setReviews] = useState([])
  const [reviewStats, setReviewStats] = useState({averageRating: 0, reviewCount: 0})
  const [reviewEligibility, setReviewEligibility] = useState(null)
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewComment, setReviewComment] = useState('')
  const [editingReview, setEditingReview] = useState(false)
  const [reviewsPage, setReviewsPage] = useState(1)
  const currency = import.meta.env.VITE_CURRENCY

  const formatDateKey = (value)=>{
    if(!value) return ''
    if(value instanceof Date){
      const year = value.getFullYear()
      const month = String(value.getMonth() + 1).padStart(2, '0')
      const day = String(value.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
    return String(value).slice(0, 10)
  }

  const today = formatDateKey(new Date())

  const getNextDate = (dateString)=>{
    if(!dateString) return today
    const [year, month, day] = dateString.split('-').map(Number)
    const nextDate = new Date(Date.UTC(year, month - 1, day + 1))
    return nextDate.toISOString().split('T')[0]
  }

  const normalizeUnavailableRanges = (ranges = [])=>{
    return ranges.map(range => ({
      pickupDate: formatDateKey(range.pickupDate),
      returnDate: formatDateKey(range.returnDate),
    })).filter(range => range.pickupDate && range.returnDate)
  }

  const normalizeManualUnavailableDates = (dates = [])=>{
    return dates.map(date => {
      const dateKey = formatDateKey(date)
      return {pickupDate: dateKey, returnDate: dateKey}
    }).filter(range => range.pickupDate)
  }

  const isDateInUnavailableRange = (dateString)=>{
    const dateKey = formatDateKey(dateString)
    return unavailableRanges.some(range => dateKey >= range.pickupDate && dateKey <= range.returnDate)
  }

  const rangeOverlapsUnavailableDates = (startDate, endDate)=>{
    const startKey = formatDateKey(startDate)
    const endKey = formatDateKey(endDate)
    if(!startKey || !endKey) return false
    return unavailableRanges.some(range => startKey <= range.returnDate && endKey >= range.pickupDate)
  }

  const isPickupDateDisabled = (dateString)=>{
    return isDateInUnavailableRange(dateString)
  }

  const isReturnDateDisabled = (dateString)=>{
    return isDateInUnavailableRange(dateString)
  }

  const handlePickupDateChange = (value)=>{
    if(isPickupDateDisabled(value)){
      setDateError('This car is already booked for the selected dates.')
      return
    }

    setPickupDate(value)
    setDateError('')
    if(returnDate && returnDate <= value){
      setReturnDate('')
    }else if(returnDate && rangeOverlapsUnavailableDates(value, returnDate)){
      setReturnDate('')
      setDateError('This car is already booked for the selected dates.')
    }
  }

  const handleReturnDateChange = (value)=>{
    if(isReturnDateDisabled(value)){
      setDateError('This car is already booked for the selected dates.')
      return
    }

    if(pickupDate && rangeOverlapsUnavailableDates(pickupDate, value)){
      setDateError('This car is already booked for the selected dates.')
      return
    }

    setReturnDate(value)
    setDateError('')
  }

  const getRentalDays = ()=>{
    if(!pickupDate || !returnDate || returnDate <= pickupDate) return null
    const pickup = new Date(`${pickupDate}T00:00:00`)
    const dropoff = new Date(`${returnDate}T00:00:00`)
    const days = Math.ceil((dropoff - pickup) / (1000 * 60 * 60 * 24))
    return days > 0 ? days : null
  }

  const rentalDays = getRentalDays()
  const estimatedTotal = rentalDays ? rentalDays * Number(car?.pricePerDay || 0) : null
  const isAdminPreview = user?.role === 'admin'
  const showSaveButton = user?.role !== 'admin' && !isAdmin
  const isSaved = car ? isCarSaved(car._id) : false

  const handleSaveClick = async ()=>{
    await toggleSavedCar(id)
  }

  const renderStars = (rating, sizeClass = 'text-base')=>(
    <span className={`tracking-wide text-amber-400 ${sizeClass}`}>
      {Array.from({length: 5}, (_, index)=>(
        <span key={index}>{index < Number(rating || 0) ? '\u2605' : '\u2606'}</span>
      ))}
    </span>
  )

  const fetchReviews = async ()=>{
    try {
      setReviewsLoading(true)
      const {data} = await axios.get(`/api/reviews/car/${id}`)
      if(data.success){
        setReviews(data.reviews || [])
        setReviewStats({averageRating: data.averageRating || 0, reviewCount: data.reviewCount || 0})
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to load reviews. Please try again.')
    } finally {
      setReviewsLoading(false)
    }
  }

  const fetchReviewEligibility = async ()=>{
    if(!token || !user){
      setReviewEligibility(null)
      return
    }

    try {
      const {data} = await axios.get(`/api/reviews/eligibility/${id}`)
      if(data.success){
        setReviewEligibility(data)
        if(data.existingReview){
          setReviewRating(data.existingReview.rating)
          setReviewComment(data.existingReview.comment || '')
        }
      }
    } catch (error) {
      setReviewEligibility({canReview: false, reason: 'Unable to check review eligibility.', existingReview: null})
    }
  }

  const submitReview = async (event)=>{
    event.preventDefault()

    if(!reviewRating){
      toast.error('Please select a rating.')
      return
    }

    try {
      setReviewSubmitting(true)
      const existingReview = reviewEligibility?.existingReview
      const endpoint = editingReview && existingReview ? '/api/reviews/update' : '/api/reviews'
      const payload = editingReview && existingReview
        ? {reviewId: existingReview._id, rating: reviewRating, comment: reviewComment.trim()}
        : {carId: id, rating: reviewRating, comment: reviewComment.trim()}

      const {data} = await axios.post(endpoint, payload)
      if(data.success){
        toast.success(data.message)
        setReviewStats({averageRating: data.averageRating || 0, reviewCount: data.reviewCount || 0})
        setReviewEligibility({canReview: false, reason: 'You have already reviewed this car.', existingReview: data.review})
        setReviewRating(data.review.rating)
        setReviewComment(data.review.comment || '')
        setEditingReview(false)
        fetchReviews()
      }else{
        toast.error(data.message || 'Unable to submit review. Please try again.')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to submit review. Please try again.')
    } finally {
      setReviewSubmitting(false)
    }
  }

  const handleSubmit = async (e)=>{
    e.preventDefault();
    if(isAdminPreview){
      setDateError('')
      return
    }

    if(!user || !token){
      toast.error('Please log in or create an account to book this car.')
      setShowLogin(true)
      return
    }

    if(!pickupDate || !returnDate){
      setDateError('Please select pickup and return dates')
      return
    }

    if(returnDate <= pickupDate){
      setDateError('Please select a valid return date.')
      return
    }

    if(rangeOverlapsUnavailableDates(pickupDate, returnDate)){
      setDateError('This car is already booked for the selected dates.')
      return
    }

    navigate(`/checkout/${id}?pickupDate=${encodeURIComponent(pickupDate)}&returnDate=${encodeURIComponent(returnDate)}`)
  }

  useEffect(()=>{
    setCar(cars.find(car => car._id === id))
  },[cars, id])

  useEffect(()=>{
    const fetchUnavailableDates = async ()=>{
      try {
        setUnavailableLoading(true)
        const {data} = await axios.get(`/api/bookings/unavailable/${id}`)
        if(data.success){
          setUnavailableRanges([
            ...normalizeUnavailableRanges(data.unavailableDates),
            ...normalizeManualUnavailableDates(data.manualUnavailableDates),
          ])
        }else{
          setDateError(data.message || 'Unable to load unavailable dates.')
        }
      } catch (error) {
        setDateError(error.response?.data?.message || 'Unable to load unavailable dates.')
      } finally {
        setUnavailableLoading(false)
      }
    }

    if(id){
      fetchUnavailableDates()
    }
  },[axios, id])

  useEffect(()=>{
    if(id){
      setReviewsPage(1)
      fetchReviews()
    }
  }, [id])

  useEffect(()=>{
    fetchReviewEligibility()
  }, [id, token, user?.role])

  useEffect(()=>{
    if(location.hash === '#reviews'){
      setTimeout(()=>{
        document.getElementById('reviews')?.scrollIntoView({behavior: 'smooth', block: 'start'})
      }, 150)
    }
  }, [location.hash, reviews.length])

  useEffect(()=>{
    if(pickupDate && returnDate && rangeOverlapsUnavailableDates(pickupDate, returnDate)){
      setDateError('This car is already booked for the selected dates.')
    }
  },[pickupDate, returnDate, unavailableRanges])

  const reviewsTotalPages = Math.max(1, Math.ceil(reviews.length / reviewsPerPage))
  const paginatedReviews = reviews.slice((reviewsPage - 1) * reviewsPerPage, reviewsPage * reviewsPerPage)

  useEffect(()=>{
    if(reviewsPage > reviewsTotalPages){
      setReviewsPage(reviewsTotalPages)
    }
  }, [reviewsPage, reviewsTotalPages])

  return car ? (
    <main className='bg-slate-50'>
      <div className='mx-auto max-w-7xl px-5 py-8 md:px-8 md:py-10'>
        <button onClick={()=> navigate(-1)} className='mb-6 flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-primary'>
          <img src={assets.arrow_icon} alt="" className='rotate-180 opacity-65'/>
          Back to all cars
        </button>

        <div className='grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_400px]'>
          <section className='min-w-0'>
            <div className='overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm'>
              <div className='relative min-h-[360px] overflow-hidden bg-slate-100 md:min-h-[520px]'>
                <img src={car.image} alt={`${car.brand} ${car.model}`} className='h-full min-h-[360px] w-full object-cover md:min-h-[520px]'/>
                <div className='absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/85 via-slate-950/35 to-transparent p-6 text-white md:p-8'>
                  <div className='flex flex-wrap items-center gap-3'>
                    <span className='rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] backdrop-blur'>{car.category}</span>
                    <span className='rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] backdrop-blur'>{car.year}</span>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] backdrop-blur ${car.isAvaliable ? 'bg-primary text-white' : 'bg-white/15 text-white'}`}>
                      {car.isAvaliable ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                  <h1 className='mt-4 text-4xl font-semibold leading-tight md:text-6xl'>{car.brand} {car.model}</h1>
                  <p className='mt-3 flex items-center gap-2 text-slate-200'>
                    <img src={assets.location_icon} alt="" className='h-4 brightness-0 invert'/>
                    {car.location}
                  </p>
                </div>
                {showSaveButton && (
                  <button
                    type='button'
                    onClick={handleSaveClick}
                    aria-label={isSaved ? 'Remove from saved cars' : 'Save car'}
                    className={`absolute right-5 top-5 z-20 flex h-12 w-12 items-center justify-center rounded-full border text-2xl shadow-lg backdrop-blur transition md:right-6 md:top-6 ${isSaved ? 'border-primary bg-primary text-white' : 'border-white/70 bg-white/90 text-slate-700 hover:border-primary hover:text-primary'}`}
                  >
                    {isSaved ? '♥' : '♡'}
                  </button>
                )}
              </div>
            </div>

            <div className='mt-6 grid grid-cols-2 gap-3 md:grid-cols-4'>
              {[
                {icon: assets.users_icon, label: 'Seats', text: `${car.seating_capacity} seats`},
                {icon: assets.fuel_icon, label: 'Fuel type', text: car.fuel_type},
                {icon: assets.car_icon, label: 'Transmission', text: car.transmission},
                {icon: assets.location_icon, label: 'Pickup city', text: car.location},
              ].map(({icon, label, text})=>(
                <div key={label} className='rounded-md border border-slate-200 bg-white p-4 shadow-sm'>
                  <div className='flex h-10 w-10 items-center justify-center rounded-md bg-slate-50'>
                    <img src={icon} alt="" className='h-5 opacity-75'/>
                  </div>
                  <p className='mt-4 text-[11px] font-semibold uppercase tracking-wide text-slate-400'>{label}</p>
                  <p className='mt-1 text-sm font-semibold text-slate-950'>{text}</p>
                </div>
              ))}
            </div>

            <div className='mt-6 rounded-md border border-slate-200 bg-white p-6 shadow-sm md:p-8'>
              <p className='text-sm font-semibold uppercase tracking-[0.2em] text-primary'>Vehicle overview</p>
              <h2 className='mt-3 text-3xl font-semibold text-slate-950'>Built for simple, everyday rentals.</h2>
              <p className='mt-5 max-w-3xl leading-8 text-slate-500'>{car.description}</p>
            </div>

            <div id='reviews' className='mt-6 rounded-md border border-slate-200 bg-white p-6 shadow-sm md:p-8'>
              <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
                <div>
                  <p className='text-sm font-semibold uppercase tracking-[0.2em] text-primary'>Reviews</p>
                  <h2 className='mt-3 text-3xl font-semibold text-slate-950'>Customer ratings</h2>
                </div>
                <div className='rounded-md bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700'>
                  {reviewStats.reviewCount > 0 ? `${'\u2605'} ${Number(reviewStats.averageRating).toFixed(1)} / ${reviewStats.reviewCount} review${reviewStats.reviewCount === 1 ? '' : 's'}` : 'No reviews yet'}
                </div>
              </div>

              <div className='mt-6 rounded-md border border-slate-200 bg-slate-50 p-4'>
                {!token || !user ? (
                  <p className='text-sm font-medium text-slate-600'>Log in to check if you can review this car.</p>
                ) : user.role === 'admin' ? (
                  <p className='text-sm font-medium text-slate-600'>Admins can view reviews, but customer reviews are available only for customer accounts.</p>
                ) : reviewEligibility?.canReview || editingReview ? (
                  <form onSubmit={submitReview} className='grid gap-4'>
                    <div>
                      <p className='text-sm font-semibold text-slate-800'>{editingReview ? 'Edit your review' : 'Leave a review'}</p>
                      <div className='mt-3 flex gap-1'>
                        {[1, 2, 3, 4, 5].map((rating)=>(
                          <button
                            key={rating}
                            type='button'
                            onClick={()=> setReviewRating(rating)}
                            className={`text-2xl transition ${rating <= reviewRating ? 'text-amber-400' : 'text-slate-300 hover:text-amber-300'}`}
                            aria-label={`Rate ${rating} stars`}
                          >
                            {'\u2605'}
                          </button>
                        ))}
                      </div>
                    </div>
                    <textarea
                      value={reviewComment}
                      onChange={(event)=> setReviewComment(event.target.value)}
                      rows={4}
                      placeholder='Share your rental experience'
                      className='resize-none rounded-md border border-slate-200 bg-white px-4 py-3 text-sm outline-primary'
                    />
                    <p className='text-xs font-medium text-slate-500'>Comment is optional.</p>
                    <div className='flex flex-wrap gap-3'>
                      {editingReview && (
                        <button type='button' onClick={()=> setEditingReview(false)} className='rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white'>
                          Cancel
                        </button>
                      )}
                      <button disabled={reviewSubmitting} className='rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-dull disabled:cursor-not-allowed disabled:opacity-70'>
                        {reviewSubmitting ? 'Submitting...' : editingReview ? 'Update review' : 'Submit review'}
                      </button>
                    </div>
                  </form>
                ) : reviewEligibility?.existingReview ? (
                  <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                    <div>
                      <p className='text-sm font-semibold text-slate-800'>Your review</p>
                      <p className='mt-1'>{renderStars(reviewEligibility.existingReview.rating)}</p>
                      {reviewEligibility.existingReview.comment && (
                        <p className='mt-2 text-sm text-slate-600'>{reviewEligibility.existingReview.comment}</p>
                      )}
                    </div>
                    <button type='button' onClick={()=> setEditingReview(true)} className='w-max rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-primary hover:text-primary'>
                      Edit review
                    </button>
                  </div>
                ) : (
                  <p className='text-sm font-medium text-slate-600'>{reviewEligibility?.reason || 'Only customers who booked this car can leave a review.'}</p>
                )}
              </div>

              <div className='mt-6 grid gap-4'>
                {reviewsLoading ? (
                  <p className='text-sm font-medium text-slate-500'>Loading reviews...</p>
                ) : reviews.length > 0 ? (
                  <>
                    {paginatedReviews.map((review)=>(
                      <article key={review._id} className='rounded-md border border-slate-200 p-4'>
                        <div className='flex items-start gap-3'>
                          {review.user?.image ? (
                            <img src={review.user.image} alt={review.user.name || 'Reviewer'} className='h-10 w-10 rounded-full object-cover'/>
                          ) : (
                            <div className='flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600'>
                              {(review.user?.name || 'U').charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className='min-w-0 flex-1'>
                            <div className='flex flex-wrap items-center justify-between gap-2'>
                              <p className='font-semibold text-slate-950'>{review.user?.name || 'Customer'}</p>
                              <p className='text-xs font-medium text-slate-400'>{review.createdAt?.split('T')[0]}</p>
                            </div>
                            <p className='mt-1'>{renderStars(review.rating)}</p>
                            {review.comment && <p className='mt-2 leading-7 text-slate-600'>{review.comment}</p>}
                          </div>
                        </div>
                      </article>
                    ))}
                    <Pagination
                      currentPage={reviewsPage}
                      totalPages={reviewsTotalPages}
                      onPageChange={setReviewsPage}
                      totalItems={reviews.length}
                      pageSize={reviewsPerPage}
                    />
                  </>
                ) : (
                  <p className='text-sm font-medium text-slate-500'>No customer reviews yet.</p>
                )}
              </div>
            </div>
          </section>

          <aside className='lg:sticky lg:top-24 lg:h-max'>
            <form onSubmit={handleSubmit} className='rounded-md border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-200/70 md:p-6'>
              <div className='rounded-md bg-slate-950 p-5 text-white'>
                <p className='text-sm text-slate-300'>Daily rate</p>
                <div className='mt-2 flex items-end justify-between gap-3'>
                  <p className='text-4xl font-semibold'>{currency}{car.pricePerDay}</p>
                  <p className='pb-1 text-sm text-slate-300'>per day</p>
                </div>
              </div>

              <div className='mt-6'>
                <h2 className='text-2xl font-semibold text-slate-950'>Reserve this car</h2>
                <p className='mt-2 text-sm leading-6 text-slate-500'>Choose your rental window and send a booking request.</p>
              </div>

              <div className='mt-6 grid gap-4'>
                <div className='flex flex-col gap-2'>
                  <label htmlFor="pickup-date" className='text-sm font-semibold text-slate-700'>Pickup Date</label>
                  <DatePicker
                    id="pickup-date"
                    value={pickupDate}
                    onChange={handlePickupDateChange}
                    min={today}
                    unavailableRanges={unavailableRanges}
                    isDateDisabled={isPickupDateDisabled}
                    placeholder="Select pickup date"
                    buttonClassName="w-full rounded-md border border-slate-200 px-4 py-3 text-left outline-primary transition hover:border-primary"
                    popoverClassName="right-0 left-auto"
                  />
                </div>

                <div className='flex flex-col gap-2'>
                  <label htmlFor="return-date" className='text-sm font-semibold text-slate-700'>Return Date</label>
                  <DatePicker
                    id="return-date"
                    value={returnDate}
                    onChange={handleReturnDateChange}
                    min={getNextDate(pickupDate)}
                    unavailableRanges={unavailableRanges}
                    isDateDisabled={isReturnDateDisabled}
                    placeholder="Select return date"
                    buttonClassName="w-full rounded-md border border-slate-200 px-4 py-3 text-left outline-primary transition hover:border-primary"
                    popoverClassName="right-0 left-auto"
                  />
                </div>
              </div>

              {unavailableLoading && <p className='mt-3 text-sm font-medium text-slate-500'>Checking booked dates...</p>}
              {dateError && <p className='mt-3 rounded-md bg-red-50 px-4 py-3 text-sm font-medium text-red-700'>{dateError}</p>}

              <div className='mt-5 rounded-md border border-slate-200 bg-slate-50 p-4'>
                <div className='flex items-center justify-between text-sm'>
                  <span className='text-slate-500'>Rental length</span>
                  <span className='font-semibold text-slate-950'>{rentalDays ? `${rentalDays} day${rentalDays > 1 ? 's' : ''}` : 'Select dates'}</span>
                </div>
                <div className='mt-3 flex items-center justify-between text-sm'>
                  <span className='text-slate-500'>Estimated total</span>
                  <span className='font-semibold text-slate-950'>{estimatedTotal ? `${currency}${estimatedTotal}` : '-'}</span>
                </div>
              </div>

              {isAdminPreview ? (
                <div className='mt-6 rounded-md border border-primary/20 bg-primary/10 p-4'>
                  <p className='text-sm font-semibold text-primary'>Preview mode</p>
                  <p className='mt-2 text-sm leading-6 text-slate-600'>Admins can view this listing, but bookings are available only for customer accounts.</p>
                </div>
              ) : (
                <button className='mt-6 w-full cursor-pointer rounded-md bg-primary py-3.5 font-semibold text-white transition hover:bg-primary-dull'>Book Now</button>
              )}

            </form>
          </aside>
        </div>
      </div>
    </main>
  ) : <Loader />
}

export default CarDetails
