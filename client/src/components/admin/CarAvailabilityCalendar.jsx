import React, { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { useAppContext } from '../../context/AppContext'

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const formatDateKey = (value)=>{
  if(typeof value === 'string'){
    const dateKey = value.slice(0, 10)
    return /^\d{4}-\d{2}-\d{2}$/.test(dateKey) ? dateKey : ''
  }

  const date = value instanceof Date ? value : new Date(value)
  if(Number.isNaN(date.getTime())) return ''

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const buildCalendarDays = (viewDate)=>{
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const firstWeekday = (firstDay.getDay() + 6) % 7
  const days = []

  for(let index = 0; index < firstWeekday; index += 1){
    days.push(null)
  }

  for(let day = 1; day <= lastDay.getDate(); day += 1){
    days.push(new Date(year, month, day))
  }

  return days
}

const isDateInRange = (dateKey, ranges)=> ranges.some((range)=>(
  dateKey >= range.pickupDate && dateKey <= range.returnDate
))

const normalizeDateList = (dates = [])=> [...new Set(dates.map(formatDateKey).filter(Boolean))].sort()

const CarAvailabilityCalendar = ({carId, onCarUpdated}) => {
  const {axios} = useAppContext()
  const [viewDate, setViewDate] = useState(()=> new Date())
  const [bookedRanges, setBookedRanges] = useState([])
  const [savedManualDates, setSavedManualDates] = useState([])
  const [selectedDates, setSelectedDates] = useState([])
  const [datesToMakeAvailable, setDatesToMakeAvailable] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const todayKey = formatDateKey(new Date())
  const calendarDays = useMemo(()=> buildCalendarDays(viewDate), [viewDate])
  const normalizedBookedRanges = useMemo(()=> bookedRanges.map((range)=>({
    pickupDate: formatDateKey(range.pickupDate),
    returnDate: formatDateKey(range.returnDate),
  })).filter((range)=> range.pickupDate && range.returnDate), [bookedRanges])
  const normalizedManualDates = useMemo(()=> normalizeDateList(savedManualDates), [savedManualDates])
  const normalizedSelectedDates = useMemo(()=> normalizeDateList(selectedDates), [selectedDates])
  const normalizedAvailableAgainDates = useMemo(()=> normalizeDateList(datesToMakeAvailable), [datesToMakeAvailable])
  const displayedUnavailableDates = useMemo(()=>(
    normalizedManualDates.filter(date => !normalizedAvailableAgainDates.includes(date))
  ), [normalizedAvailableAgainDates, normalizedManualDates])
  const fetchAvailability = async ()=>{
    try {
      setLoading(true)
      setErrorMessage('')
      const {data} = await axios.get(`/api/admin/car-availability/${carId}`)

      if(data.success){
        const nextManualDates = normalizeDateList(data.manualUnavailableDates || [])
        setBookedRanges(data.unavailableDates || [])
        setSavedManualDates(nextManualDates)
        setSelectedDates([])
        setDatesToMakeAvailable([])
      }else{
        const message = data.message || 'Unable to load availability. Please try again.'
        setErrorMessage(message)
        toast.error(message)
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Unable to load availability. Please try again.'
      setErrorMessage(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const goToPreviousMonth = ()=> setViewDate(current => new Date(current.getFullYear(), current.getMonth() - 1, 1))
  const goToNextMonth = ()=> setViewDate(current => new Date(current.getFullYear(), current.getMonth() + 1, 1))

  const toggleDateSelection = (dateKey)=>{
    if(isDateInRange(dateKey, normalizedBookedRanges) || dateKey < todayKey) return

    if(normalizedManualDates.includes(dateKey)){
      setDatesToMakeAvailable(current => (
        current.includes(dateKey)
          ? current.filter(date => date !== dateKey)
          : [...current, dateKey].sort()
      ))
      return
    }

    setSelectedDates(current => (
      current.includes(dateKey)
        ? current.filter(date => date !== dateKey)
        : [...current, dateKey].sort()
    ))
  }

  const saveUnavailableDates = async ()=>{
    try {
      setSaving(true)
      setErrorMessage('')
      const nextDates = [...new Set([...normalizedManualDates, ...normalizedSelectedDates])].sort()
      const {data} = await axios.post('/api/admin/car-unavailable-dates', {
        carId,
        manualUnavailableDates: nextDates,
      })

      if(data.success){
        const nextManualDates = normalizeDateList(data.manualUnavailableDates || [])
        setSavedManualDates(nextManualDates)
        setSelectedDates([])
        onCarUpdated?.(data.car)
        toast.success('Selected dates marked as unavailable.')
      }else{
        const message = data.message || 'Unable to update unavailable dates. Please try again.'
        setErrorMessage(message)
        toast.error(message)
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Unable to update unavailable dates. Please try again.'
      setErrorMessage(message)
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const saveAvailableDates = async ()=>{
    try {
      setSaving(true)
      setErrorMessage('')
      const nextDates = normalizedManualDates.filter(date => !normalizedAvailableAgainDates.includes(date))
      const {data} = await axios.post('/api/admin/car-unavailable-dates', {
        carId,
        manualUnavailableDates: nextDates,
      })

      if(data.success){
        const nextManualDates = normalizeDateList(data.manualUnavailableDates || [])
        setSavedManualDates(nextManualDates)
        setDatesToMakeAvailable([])
        onCarUpdated?.(data.car)
        toast.success('Selected dates marked as available.')
      }else{
        const message = data.message || 'Unable to update unavailable dates. Please try again.'
        setErrorMessage(message)
        toast.error(message)
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Unable to update unavailable dates. Please try again.'
      setErrorMessage(message)
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  useEffect(()=>{
    if(carId){
      fetchAvailability()
    }
  }, [carId])

  return (
    <div className='w-[min(360px,calc(100vw-2rem))] rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-300/60'>
      <div className='flex items-start justify-between gap-3'>
        <div>
          <h3 className='text-sm font-semibold text-slate-950'>Availability calendar</h3>
        </div>
      </div>

      <div className='mt-4 flex items-center justify-between gap-2'>
        <button type='button' onClick={goToPreviousMonth} className='flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-600 transition hover:border-primary hover:text-primary' aria-label='Previous month'>
          ‹
        </button>
        <p className='text-center text-sm font-semibold text-slate-800'>
          {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
        </p>
        <button type='button' onClick={goToNextMonth} className='flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-600 transition hover:border-primary hover:text-primary' aria-label='Next month'>
          ›
        </button>
      </div>

      <div className='mt-3 flex flex-wrap items-center gap-2 text-[11px] font-medium text-slate-500'>
        <span className='inline-flex items-center gap-1.5'><span className='h-2.5 w-2.5 rounded-full border border-slate-200 bg-white'></span>Available</span>
        <span className='inline-flex items-center gap-1.5'><span className='h-2.5 w-2.5 rounded-full bg-slate-950'></span>Selected</span>
        <span className='inline-flex items-center gap-1.5'><span className='h-2.5 w-2.5 rounded-full bg-red-100 ring-1 ring-red-200'></span>Booked</span>
        <span className='inline-flex items-center gap-1.5'><span className='h-2.5 w-2.5 rounded-full bg-amber-100 ring-1 ring-amber-200'></span>Unavailable</span>
        <span className='inline-flex items-center gap-1.5'><span className='h-2.5 w-2.5 rounded-full bg-primary/10 ring-1 ring-primary/30'></span>Today</span>
      </div>

      {loading ? (
        <div className='mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-600'>
          Loading availability...
        </div>
      ) : errorMessage ? (
        <div className='mt-4 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700'>
          {errorMessage}
        </div>
      ) : (
        <>
          <div className='mt-4 grid grid-cols-7 gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-2'>
            {weekDays.map((day)=>(
              <div key={day} className='flex h-7 items-center justify-center text-[10px] font-bold uppercase tracking-wide text-slate-400'>
                {day}
              </div>
            ))}

            {calendarDays.map((date, index)=>{
              if(!date){
                return <div key={`empty-${index}`} className='h-9 rounded-lg'></div>
              }

              const dateKey = formatDateKey(date)
              const isBooked = isDateInRange(dateKey, normalizedBookedRanges)
              const isManualUnavailable = displayedUnavailableDates.includes(dateKey)
              const isSelected = normalizedSelectedDates.includes(dateKey)
              const isMarkedAvailableAgain = normalizedAvailableAgainDates.includes(dateKey)
              const isPast = dateKey < todayKey
              const isToday = dateKey === todayKey

              return (
                <button
                  key={dateKey}
                  type='button'
                  disabled={isBooked || isPast}
                  onClick={()=> toggleDateSelection(dateKey)}
                  className={`flex h-9 items-center justify-center rounded-lg text-xs font-semibold transition ${
                    isBooked
                      ? 'cursor-not-allowed bg-red-100 text-red-700 ring-1 ring-red-200'
                      : isPast
                        ? 'cursor-not-allowed bg-slate-50 text-slate-300'
                      : isSelected
                        ? 'bg-slate-950 text-white ring-1 ring-slate-950'
                      : isMarkedAvailableAgain
                        ? 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200 hover:bg-emerald-200'
                      : isManualUnavailable
                        ? 'bg-amber-100 text-amber-800 ring-1 ring-amber-200 hover:bg-amber-200'
                        : isToday
                          ? 'bg-primary/10 text-primary ring-1 ring-primary/30'
                          : 'bg-white text-slate-700 ring-1 ring-slate-100 hover:bg-amber-50 hover:text-amber-700'
                  }`}
                  title={isBooked ? 'Booked' : isSelected ? 'Selected' : isMarkedAvailableAgain ? 'Will be available' : isManualUnavailable ? 'Unavailable' : 'Available'}
                >
                  {date.getDate()}
                </button>
              )
            })}
          </div>

          <div className='mt-3 flex items-center justify-between gap-3'>
            <p className='text-xs text-slate-500'>{normalizedManualDates.length} unavailable date{normalizedManualDates.length === 1 ? '' : 's'}</p>
            <button
              type='button'
              disabled={normalizedSelectedDates.length === 0 || saving}
              onClick={saveUnavailableDates}
              className='rounded-xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-primary-dull disabled:cursor-not-allowed disabled:opacity-50'
            >
              {saving ? 'Saving...' : 'Make unavailable'}
            </button>
          </div>

          {normalizedAvailableAgainDates.length > 0 && (
            <button
              type='button'
              disabled={saving}
              onClick={saveAvailableDates}
              className='mt-2 w-full rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 transition hover:border-emerald-300 disabled:cursor-not-allowed disabled:opacity-50'
            >
              {saving ? 'Saving...' : 'Make available'}
            </button>
          )}
        </>
      )}
    </div>
  )
}

export default CarAvailabilityCalendar
