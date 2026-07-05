import React, { useEffect, useMemo, useState } from 'react'
import Title from '../../components/admin/Title'
import { assets } from '../../assets/assets'
import { useAppContext } from '../../context/AppContext'
import toast from 'react-hot-toast'
import BookingConversation from '../../components/BookingConversation'
import { useSearchParams } from 'react-router-dom'
import CustomSelect from '../../components/CustomSelect'
import Pagination from '../../components/Pagination'

const statusClass = {
  pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  confirmed: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  cancelled: 'bg-red-50 text-red-700 ring-red-200',
}

const statusOptions = [
  {value: 'pending', label: 'Pending'},
  {value: 'cancelled', label: 'Cancelled'},
  {value: 'confirmed', label: 'Confirmed'},
]

const statusFilterOptions = [
  {value: 'all', label: 'All statuses'},
  {value: 'pending', label: 'Pending'},
  {value: 'confirmed', label: 'Confirmed'},
  {value: 'cancelled', label: 'Cancelled'},
]

const sortOptions = [
  {value: 'newest', label: 'Newest first'},
  {value: 'oldest', label: 'Oldest first'},
  {value: 'pickup-soonest', label: 'Pickup date soonest'},
  {value: 'pickup-latest', label: 'Pickup date latest'},
  {value: 'price-low', label: 'Price low to high'},
  {value: 'price-high', label: 'Price high to low'},
  {value: 'booking-asc', label: 'Booking # ascending'},
  {value: 'booking-desc', label: 'Booking # descending'},
]

const bookingsPerPage = 5

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

const getBookingNumber = (booking)=> booking?.bookingNumber || booking?._id?.slice?.(-7) || ''
const normalizeBookingSearch = (value)=> value.trim().replace(/^#/, '').toLowerCase()
const getBookingNumberValue = (booking)=> Number(getBookingNumber(booking)) || 0
const getPickupMonthKey = (booking)=> booking?.pickupDate ? booking.pickupDate.slice(0, 7) : ''
const formatMonthLabel = (monthKey)=>{
  if(!monthKey) return ''
  const [year, month] = monthKey.split('-').map(Number)
  return new Date(year, month - 1, 1).toLocaleString('en-US', {month: 'long', year: 'numeric'})
}

const ManageBookings = () => {

  const { currency, axios } = useAppContext()
  const [searchParams] = useSearchParams()
  const bookingIdParam = searchParams.get('bookingId')

  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [expandedConversations, setExpandedConversations] = useState({})
  const [highlightedBookingId, setHighlightedBookingId] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [locationFilter, setLocationFilter] = useState('all')
  const [monthFilter, setMonthFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [currentPage, setCurrentPage] = useState(1)

  const fetchAdminBookings = async (showLoading = true)=>{
    try {
      if(showLoading) setLoading(true)
      setErrorMessage('')
      const { data } = await axios.get('/api/bookings/admin')
      if(data.success){
        setBookings(data.bookings)
      }else{
        const message = data.message || 'Unable to load bookings. Please try again.'
        setErrorMessage(message)
        toast.error(message)
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Unable to load bookings. Please try again.'
      setErrorMessage(message)
      toast.error(message)
    } finally {
      if(showLoading) setLoading(false)
    }
  }

  const changeBookingStatus = async (bookingId, status)=>{
    try {
      const { data } = await axios.post('/api/bookings/change-status', {bookingId, status})
      if(data.success){
        toast.success(data.message)
        fetchAdminBookings(false)
      }else{
        toast.error(data.message || 'Unable to update booking status. Please try again.')
      }
      
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to update booking status. Please try again.')
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

  const locationOptions = useMemo(()=>{
    const locations = [...new Set(bookings.map((booking)=> getDeliveryParts(booking).city || booking.car?.location).filter(Boolean))].sort()
    return [{value: 'all', label: 'All'}, ...locations]
  }, [bookings])

  const monthOptions = useMemo(()=>{
    const monthKeys = [...new Set(bookings.map(getPickupMonthKey).filter(Boolean))].sort().reverse()
    return [{value: 'all', label: 'All months'}, ...monthKeys.map((monthKey)=> ({value: monthKey, label: formatMonthLabel(monthKey)}))]
  }, [bookings])

  const filteredBookings = useMemo(()=>{
    const query = normalizeBookingSearch(searchQuery)

    const results = bookings.filter((booking)=>{
      const deliveryParts = getDeliveryParts(booking)
      const legacyAddress = formatLegacyDeliveryAddress(booking)
      const matchesStatus = statusFilter === 'all' || String(booking.status || '').toLowerCase() === statusFilter
      const bookingLocation = deliveryParts.city || booking.car?.location || ''
      const matchesLocation = locationFilter === 'all' || bookingLocation === locationFilter
      const matchesMonth = monthFilter === 'all' || getPickupMonthKey(booking) === monthFilter
      const searchableText = [
        getBookingNumber(booking),
        `#${getBookingNumber(booking)}`,
        booking.car?.brand,
        booking.car?.model,
        booking.contactName,
        booking.contactEmail,
        booking.contactPhone,
        deliveryParts.city,
        deliveryParts.street,
        deliveryParts.details,
        legacyAddress,
      ].filter(Boolean).join(' ').toLowerCase()
      const matchesSearch = !query || searchableText.includes(query)

      return matchesStatus && matchesLocation && matchesMonth && matchesSearch
    })

    return [...results].sort((a, b)=>{
      if(sortBy === 'oldest') return new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
      if(sortBy === 'pickup-soonest') return new Date(a.pickupDate || 0) - new Date(b.pickupDate || 0)
      if(sortBy === 'pickup-latest') return new Date(b.pickupDate || 0) - new Date(a.pickupDate || 0)
      if(sortBy === 'price-low') return Number(a.price || 0) - Number(b.price || 0)
      if(sortBy === 'price-high') return Number(b.price || 0) - Number(a.price || 0)
      if(sortBy === 'booking-asc') return getBookingNumberValue(a) - getBookingNumberValue(b)
      if(sortBy === 'booking-desc') return getBookingNumberValue(b) - getBookingNumberValue(a)
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    })
  }, [bookings, locationFilter, monthFilter, searchQuery, sortBy, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / bookingsPerPage))
  const paginatedBookings = filteredBookings.slice((currentPage - 1) * bookingsPerPage, currentPage * bookingsPerPage)

  const clearFilters = ()=>{
    setSearchQuery('')
    setStatusFilter('all')
    setLocationFilter('all')
    setMonthFilter('all')
    setSortBy('newest')
    setCurrentPage(1)
  }

  useEffect(()=>{
    fetchAdminBookings()
  },[])

  useEffect(()=>{
    setCurrentPage(1)
  }, [locationFilter, monthFilter, searchQuery, sortBy, statusFilter])

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
      document.getElementById(`admin-booking-${bookingIdParam}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }, 0)

    const timeoutId = setTimeout(()=> setHighlightedBookingId(''), 2500)
    return ()=> clearTimeout(timeoutId)
  }, [bookingIdParam, filteredBookings])

  return (
    <main className='min-w-0 flex-1 p-4 md:p-8'>
      <div className='mx-auto max-w-7xl'>
        <Title
          title="Booking Control"
          action={<span className='rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200'>{filteredBookings.length} {filteredBookings.length === 1 ? 'booking' : 'bookings'}</span>}
        />

        <section className='mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm'>
          <div className='grid gap-4'>
            <label className='flex flex-col gap-2'>
              <span className='text-sm font-semibold text-slate-700'>Search bookings</span>
              <input
                type='search'
                value={searchQuery}
                onChange={(event)=> setSearchQuery(event.target.value)}
                placeholder='Search by booking #, car, customer, email, phone, or address'
                className='rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-primary transition focus:border-primary'
              />
            </label>

            <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1fr_auto] xl:items-end'>
              <CustomSelect
                label='Status'
                value={statusFilter}
                onChange={setStatusFilter}
                options={statusFilterOptions}
              />

              <CustomSelect
                label='Location'
                value={locationFilter}
                onChange={setLocationFilter}
                options={locationOptions}
              />

              <CustomSelect
                label='Rental month'
                value={monthFilter}
                onChange={setMonthFilter}
                options={monthOptions}
              />

              <CustomSelect
                label='Sort by'
                value={sortBy}
                onChange={setSortBy}
                options={sortOptions}
              />

              <button
                type='button'
                onClick={clearFilters}
                className='rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:border-primary hover:text-primary'
              >
                Clear filters
              </button>
            </div>
          </div>
        </section>

        {loading ? (
          <div className='mt-8 grid gap-5'>
            <div className='rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm'>
              <p className='font-semibold text-slate-950'>Loading bookings...</p>
              <p className='mt-2 text-sm text-slate-500'>Fetching customer booking requests.</p>
            </div>
            {[1, 2, 3].map(item => (
              <div key={item} className='h-48 animate-pulse rounded-3xl bg-white shadow-sm ring-1 ring-slate-200'></div>
            ))}
          </div>
        ) : errorMessage ? (
          <div className='mt-8 rounded-3xl border border-red-100 bg-red-50 p-6 text-sm font-medium text-red-700'>
            {errorMessage}
          </div>
        ) : bookings.length > 0 ? (
          <div className='mt-8 grid gap-5'>
            {filteredBookings.length > 0 ? paginatedBookings.map((booking)=>(
              <article
                key={booking._id}
                id={`admin-booking-${booking._id}`}
                className={`rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-xl ${highlightedBookingId === booking._id ? 'ring-2 ring-primary/40' : ''}`}
              >
                <div className='grid gap-5 xl:grid-cols-[220px_1fr_220px] xl:items-center'>
                  <img src={booking.car.image} alt={`${booking.car.brand} ${booking.car.model}`} className='h-44 w-full rounded-2xl object-cover xl:h-36'/>

                  <div>
                    <div className='flex flex-wrap items-center gap-3'>
                      <h2 className='text-2xl font-semibold text-slate-950'>{booking.car.brand} {booking.car.model}</h2>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ring-1 ${statusClass[booking.status] || 'bg-slate-100 text-slate-600 ring-slate-200'}`}>{booking.status}</span>
                    </div>
                    <p className='mt-2 text-sm font-semibold text-primary'>Booking #{getBookingNumber(booking)}</p>
                    <div className='mt-5 grid gap-3 text-sm text-slate-600 md:grid-cols-2'>
                      <div className='rounded-2xl bg-slate-50 px-4 py-3'>
                        <p className='text-xs uppercase tracking-wide text-slate-400'>Rental window</p>
                        <p className='mt-1 font-semibold text-slate-900'>{booking.pickupDate.split('T')[0]}{booking.pickupTime ? ` at ${booking.pickupTime}` : ''} to {booking.returnDate.split('T')[0]}{booking.returnTime ? ` at ${booking.returnTime}` : ''}</p>
                      </div>
                      <div className='rounded-2xl bg-slate-50 px-4 py-3'>
                        <p className='text-xs uppercase tracking-wide text-slate-400'>Total</p>
                        <p className='mt-1 font-semibold text-slate-900'>{currency}{booking.price}</p>
                      </div>
                    </div>
                    {(booking.contactName || booking.contactEmail || booking.contactPhone || booking.deliveryAddress || booking.deliveryCity || booking.deliveryStreet || booking.deliveryDetails || booking.specialRequests) && (
                      <div className='mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600'>
                        <p className='text-xs font-semibold uppercase tracking-wide text-slate-400'>Customer contact</p>
                        <div className='mt-3 grid gap-2 md:grid-cols-2'>
                          {(() => {
                            const deliveryParts = getDeliveryParts(booking)
                            const legacyAddress = formatLegacyDeliveryAddress(booking)
                            return (
                              <>
                                {booking.contactName && <p><span className='font-semibold text-slate-900'>Name:</span> {booking.contactName}</p>}
                                {booking.contactEmail && <p><span className='font-semibold text-slate-900'>Email:</span> {booking.contactEmail}</p>}
                                {booking.contactPhone && <p><span className='font-semibold text-slate-900'>Phone:</span> {booking.contactPhone}</p>}
                                {deliveryParts.city && <p><span className='font-semibold text-slate-900'>City:</span> {deliveryParts.city}</p>}
                                {deliveryParts.street && <p><span className='font-semibold text-slate-900'>Street:</span> {deliveryParts.street}</p>}
                                {deliveryParts.details && <p><span className='font-semibold text-slate-900'>Details:</span> {deliveryParts.details}</p>}
                                {legacyAddress && <p className='md:col-span-2'><span className='font-semibold text-slate-900'>Delivery:</span> {legacyAddress}</p>}
                                {booking.specialRequests && <p className='md:col-span-2'><span className='font-semibold text-slate-900'>Special requests:</span> {booking.specialRequests}</p>}
                              </>
                            )
                          })()}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className='xl:justify-self-end'>
                    <button
                      type="button"
                      onClick={()=> toggleConversation(booking._id)}
                      className='relative mb-3 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-primary hover:text-primary xl:w-52'
                    >
                      {expandedConversations[booking._id] ? 'Hide conversation' : 'Show conversation'}
                      {Number(booking.unreadConversationCount) > 0 && (
                        <span className='absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-white'>
                          {booking.unreadConversationCount}
                        </span>
                      )}
                    </button>
                    {booking.status === 'pending' ? (
                      <div>
                        <p className='mb-2 text-sm font-semibold text-slate-700'>Update status</p>
                        <CustomSelect
                          value={booking.status}
                          onChange={(value)=> changeBookingStatus(booking._id, value)}
                          options={statusOptions}
                          className='xl:w-52'
                        />
                      </div>
                    ): (
                      <span className='inline-flex w-full justify-center rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold capitalize text-slate-600 xl:w-52'>{booking.status}</span>
                    )}
                  </div>
                </div>
                {expandedConversations[booking._id] && (
                  <BookingConversation booking={booking} onRead={markConversationRead} />
                )}
              </article>
            )) : (
              <div className='rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm'>
                <div className='mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100'>
                  <img src={assets.listIconColored} alt="" className='h-6 w-6'/>
                </div>
                <h2 className='mt-5 text-xl font-semibold text-slate-950'>No bookings match your filters.</h2>
                <p className='mt-2 text-slate-500'>Try a different search term, status, location, month, or sort option.</p>
                <button type='button' onClick={clearFilters} className='mt-5 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-dull'>
                  Clear filters
                </button>
              </div>
            )}
            {filteredBookings.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={filteredBookings.length}
                pageSize={bookingsPerPage}
              />
            )}
          </div>
        ) : (
          <div className='mt-8 rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm'>
            <div className='mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100'>
              <img src={assets.listIconColored} alt="" className='h-6 w-6'/>
            </div>
            <h2 className='mt-5 text-xl font-semibold text-slate-950'>No bookings yet</h2>
            <p className='mt-2 text-slate-500'>Customer booking requests will appear here when they are created.</p>
          </div>
        )}
      </div>
    </main>
  )
}

export default ManageBookings
