import React, { useState } from 'react'
import { assets, cityList } from '../assets/assets'
import { useAppContext } from '../context/AppContext'
import DatePicker from './DatePicker'
import toast from 'react-hot-toast'
import CustomSelect from './CustomSelect'

const formatDateKey = (date)=>{
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

const Hero = () => {

    const [pickupLocation, setPickupLocation] = useState('')

    const {pickupDate, setPickupDate, returnDate, setReturnDate, navigate} = useAppContext()

    const today = formatDateKey(new Date())

    const getNextDate = (dateString)=>{
        if(!dateString) return today
        const [year, month, day] = dateString.split('-').map(Number)
        const nextDate = new Date(Date.UTC(year, month - 1, day + 1))
        return nextDate.toISOString().split('T')[0]
    }

    const handlePickupDateChange = (value)=>{
        setPickupDate(value)
        if(returnDate && returnDate <= value){
            setReturnDate('')
        }
    }

    const handleSearch = (e)=>{
        e.preventDefault()
        if(!pickupDate || !returnDate){
            toast.error('Please select pickup and return dates')
            return
        }
        if(returnDate <= pickupDate){
            toast.error('Return date must be after pickup date')
            return
        }
        navigate('/cars?pickupLocation=' + encodeURIComponent(pickupLocation) + '&pickupDate=' + encodeURIComponent(pickupDate) + '&returnDate=' + encodeURIComponent(returnDate))
    }

  return (
    <section className='relative overflow-visible bg-slate-950 text-white'>
      <div className='mx-auto grid min-h-[calc(100vh-73px)] max-w-7xl grid-cols-1 items-center gap-10 px-5 py-16 md:px-8 lg:grid-cols-[1.05fr_0.95fr]'>
        <div className='max-w-3xl'>
          <p className='mb-5 w-max rounded-full border border-white/15 px-4 py-2 text-sm text-teal-100'>Premium car booking, simplified</p>
          <h1 className='text-5xl font-semibold leading-tight md:text-7xl'>
            Drive the right car for every moment.
          </h1>
          <p className='mt-6 max-w-2xl text-lg leading-8 text-slate-300'>
            DriveSphere connects you with polished, ready-to-book vehicles for business trips, weekends, and everyday travel.
          </p>

          <form onSubmit={handleSearch} className='relative z-30 mt-10 grid gap-1 rounded-[22px] border border-white/20 bg-white/95 p-1 text-slate-700 shadow-[0_14px_42px_rgba(2,6,23,0.24)] backdrop-blur md:grid-cols-[1.2fr_1fr_1fr_auto] md:items-stretch'>
            <label className='flex min-h-[54px] flex-col justify-center gap-0.5 rounded-[17px] px-3.5 py-2 transition hover:bg-slate-50'>
              <span className='text-[11px] font-semibold uppercase tracking-wide text-slate-400'>Location</span>
              <CustomSelect
                value={pickupLocation}
                onChange={setPickupLocation}
                placeholder='Pickup Location'
                options={cityList}
                variant='hero'
                buttonClassName='h-6 px-0 py-0 text-sm font-semibold leading-6'
                menuClassName='z-[80] min-w-[240px] rounded-3xl p-2'
              />
            </label>
            <label className='flex min-h-[54px] flex-col justify-center gap-0.5 rounded-[17px] border-t border-slate-100 px-3.5 py-2 transition hover:bg-slate-50 md:border-l md:border-t-0'>
              <span className='text-[11px] font-semibold uppercase tracking-wide text-slate-400'>Pickup</span>
              <DatePicker
                value={pickupDate}
                onChange={handlePickupDateChange}
                min={today}
                placeholder="Pickup date"
                buttonClassName="h-6 w-full bg-transparent text-left text-sm font-semibold leading-6 outline-none"
              />
            </label>
            <label className='flex min-h-[54px] flex-col justify-center gap-0.5 rounded-[17px] border-t border-slate-100 px-3.5 py-2 transition hover:bg-slate-50 md:border-l md:border-t-0'>
              <span className='text-[11px] font-semibold uppercase tracking-wide text-slate-400'>Return</span>
              <DatePicker
                value={returnDate}
                onChange={setReturnDate}
                min={getNextDate(pickupDate)}
                placeholder="Return date"
                buttonClassName="h-6 w-full bg-transparent text-left text-sm font-semibold leading-6 outline-none"
              />
            </label>
            <button className='min-h-[54px] rounded-[17px] bg-primary px-7 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/20 transition hover:bg-primary-dull'>
              Search
            </button>
          </form>
        </div>

        <div className='relative'>
          <div className='absolute inset-8 rounded-full bg-teal-400/10 blur-3xl'></div>
          <img src={assets.main_car} alt="Premium car" className='relative z-10 w-full drop-shadow-2xl'/>
          <div className='relative z-20 -mt-6 grid grid-cols-3 gap-3 rounded-md border border-white/10 bg-white/10 p-4 text-center backdrop-blur'>
            {['Curated fleet', 'Fast booking', 'Verified cars'].map((item)=> (
              <p key={item} className='text-sm text-slate-200'>{item}</p>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
