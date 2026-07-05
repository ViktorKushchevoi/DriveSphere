import React, { useEffect, useMemo, useRef, useState } from 'react'

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const formatDateKey = (value)=>{
  if(!value) return ''

  if(value instanceof Date){
    const year = value.getFullYear()
    const month = String(value.getMonth() + 1).padStart(2, '0')
    const day = String(value.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  if(typeof value === 'string'){
    return value.slice(0, 10)
  }

  return ''
}

const isDateInUnavailableRange = (date, ranges = [])=>{
  const dateKey = formatDateKey(date)
  if(!dateKey) return false

  return ranges.some((range)=>{
    const start = formatDateKey(range.pickupDate)
    const end = formatDateKey(range.returnDate)
    return start && end && dateKey >= start && dateKey <= end
  })
}

const parseDate = (value)=>{
  if(!value) return null
  const [year, month, day] = value.split('-').map(Number)
  if(!year || !month || !day) return null
  return new Date(year, month - 1, day)
}

const formatDisplayDate = (value)=>{
  const date = parseDate(value)
  if(!date) return ''
  return `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
}

const getStartOfCalendar = (date)=>{
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1)
  const mondayOffset = (firstDay.getDay() + 6) % 7
  const start = new Date(firstDay)
  start.setDate(firstDay.getDate() - mondayOffset)
  return start
}

const buildCalendarDays = (monthDate)=>{
  const start = getStartOfCalendar(monthDate)
  return Array.from({ length: 42 }, (_, index)=>{
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    return date
  })
}

const DatePicker = ({
  id,
  value,
  onChange,
  min,
  unavailableRanges = [],
  isDateDisabled,
  placeholder = 'Select date',
  buttonClassName = '',
  popoverClassName = '',
}) => {
  const wrapperRef = useRef(null)
  const selectedDate = parseDate(value)
  const minDate = parseDate(min)
  const todayString = formatDateKey(new Date())
  const [isOpen, setIsOpen] = useState(false)
  const [viewDate, setViewDate] = useState(selectedDate || minDate || new Date())

  const calendarDays = useMemo(()=>buildCalendarDays(viewDate), [viewDate])
  const normalizedUnavailableRanges = useMemo(()=>unavailableRanges.map((range)=>({
    pickupDate: formatDateKey(range.pickupDate),
    returnDate: formatDateKey(range.returnDate),
  })).filter(range => range.pickupDate && range.returnDate), [unavailableRanges])

  const isDisabledDate = (date)=>{
    const dateKey = formatDateKey(date)
    return Boolean(
      (minDate && date < minDate) ||
      isDateInUnavailableRange(dateKey, normalizedUnavailableRanges) ||
      isDateDisabled?.(dateKey)
    )
  }

  useEffect(()=>{
    const nextSelectedDate = parseDate(value)
    if(nextSelectedDate){
      setViewDate(nextSelectedDate)
    }
  }, [value])

  useEffect(()=>{
    const handleClickOutside = (event)=>{
      if(wrapperRef.current && !wrapperRef.current.contains(event.target)){
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return ()=>document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const moveMonth = (amount)=>{
    setViewDate((current)=>new Date(current.getFullYear(), current.getMonth() + amount, 1))
  }

  const handleSelectDate = (date)=>{
    if(isDisabledDate(date)) return
    onChange(formatDateKey(date))
    setIsOpen(false)
  }

  const handleToday = ()=>{
    const today = new Date()

    if(minDate && today < minDate){
      if(isDisabledDate(minDate)) return
      setViewDate(minDate)
      onChange(formatDateKey(minDate))
    }else if(isDisabledDate(today)){
      setViewDate(today)
    }else{
      setViewDate(today)
      onChange(todayString)
    }

    setIsOpen(false)
  }

  const handleClear = ()=>{
    onChange('')
    setIsOpen(false)
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        id={id}
        type="button"
        onClick={()=>setIsOpen((open)=>!open)}
        className={buttonClassName}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        {value ? formatDisplayDate(value) : <span className="text-slate-400">{placeholder}</span>}
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="Choose date"
          className={`absolute left-0 top-full z-[100] mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-md border border-slate-200 bg-white p-4 text-slate-700 shadow-2xl ${popoverClassName}`}
        >
          <div className="flex items-center justify-between gap-3">
            <button type="button" onClick={()=>moveMonth(-1)} className="h-9 w-9 rounded-md border border-slate-200 text-lg font-semibold text-slate-500 transition hover:border-primary hover:text-primary" aria-label="Previous month">
              {'<'}
            </button>
            <p className="text-sm font-semibold text-slate-950">
              {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
            </p>
            <button type="button" onClick={()=>moveMonth(1)} className="h-9 w-9 rounded-md border border-slate-200 text-lg font-semibold text-slate-500 transition hover:border-primary hover:text-primary" aria-label="Next month">
              {'>'}
            </button>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase text-slate-400">
            {weekDays.map((day)=><span key={day}>{day}</span>)}
          </div>

          <div className="mt-2 grid grid-cols-7 gap-1">
            {calendarDays.map((date)=>{
              const dateString = formatDateKey(date)
              const isCurrentMonth = date.getMonth() === viewDate.getMonth()
              const isSelected = value === dateString
              const isToday = todayString === dateString
              const isDisabled = isDisabledDate(date)

              return (
                <button
                  key={dateString}
                  type="button"
                  disabled={isDisabled}
                  onClick={()=>handleSelectDate(date)}
                  title={isDisabled ? 'Unavailable' : undefined}
                  className={`h-9 rounded-md text-sm font-medium transition ${
                    isDisabled
                      ? 'cursor-not-allowed border-0 bg-transparent text-slate-200 hover:bg-transparent'
                      : isSelected
                        ? 'bg-primary text-white'
                        : isToday
                          ? 'border border-primary text-primary'
                          : isCurrentMonth
                            ? 'text-slate-700 hover:bg-slate-100'
                            : 'text-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {date.getDate()}
                </button>
              )
            })}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
            <button type="button" onClick={handleToday} className="rounded-md px-3 py-2 text-sm font-semibold text-primary transition hover:bg-primary/10">
              Today
            </button>
            <button type="button" onClick={handleClear} className="rounded-md px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-100">
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default DatePicker
