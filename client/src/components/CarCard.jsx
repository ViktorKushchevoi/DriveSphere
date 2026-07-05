import React from 'react'
import { assets } from '../assets/assets'
import { useNavigate } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'

const CarCard = ({car, onSavedChange}) => {

    const currency = import.meta.env.VITE_CURRENCY
    const navigate = useNavigate()
    const {user, isAdmin, isCarSaved, toggleSavedCar} = useAppContext()
    const showSaveButton = user?.role !== 'admin' && !isAdmin
    const saved = isCarSaved(car._id)
    const hasReviews = Number(car.reviewCount) > 0
    const specs = [
      {icon: assets.users_icon, label: 'Seats', value: `${car.seating_capacity}`},
      {icon: assets.fuel_icon, label: 'Fuel', value: car.fuel_type},
      {icon: assets.car_icon, label: 'Drive', value: car.transmission},
    ]

    const handleSaveClick = async (event)=>{
      event.stopPropagation()
      const updatedSavedIds = await toggleSavedCar(car._id)
      if(updatedSavedIds && onSavedChange){
        onSavedChange(car._id, updatedSavedIds.includes(car._id))
      }
    }

  return (
    <article onClick={()=> {navigate(`/car-details/${car._id}`); scrollTo(0,0)}} className='group cursor-pointer rounded-md border border-slate-200 bg-white p-3 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-2xl hover:shadow-slate-200/70'>
      <div className='relative overflow-hidden rounded-md bg-slate-100'>
        <div className='absolute left-3 right-3 top-3 z-10 flex items-center justify-between gap-2'>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold shadow-sm backdrop-blur ${car.isAvaliable ? 'bg-white/90 text-primary' : 'bg-slate-950/80 text-white'}`}>
            {car.isAvaliable ? 'Available' : 'Unavailable'}
          </span>
          <span className='rounded-full bg-slate-950/80 px-3 py-1 text-xs font-semibold text-white backdrop-blur'>{car.category}</span>
        </div>

        {showSaveButton && (
          <button
            type='button'
            onClick={handleSaveClick}
            aria-label={saved ? 'Remove from saved cars' : 'Save car'}
            className={`absolute right-3 top-14 z-20 flex h-10 w-10 items-center justify-center rounded-full border text-lg shadow-sm backdrop-blur transition ${saved ? 'border-primary bg-primary text-white' : 'border-white/70 bg-white/90 text-slate-700 hover:border-primary hover:text-primary'}`}
          >
            {saved ? '♥' : '♡'}
          </button>
        )}

        <img src={car.image} alt={`${car.brand} ${car.model}`} className='aspect-[1.45] w-full object-cover transition-transform duration-500 group-hover:scale-105'/>

        <div className='absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent p-4 pt-16 text-white'>
          <div>
            <p className='text-xs font-semibold uppercase tracking-[0.18em] text-white/65'>{car.year}</p>
            <h3 className='mt-1 text-xl font-semibold'>{car.brand} {car.model}</h3>
          </div>
          <div className='text-right'>
            <p className='text-xs text-white/65'>From</p>
            <p className='text-2xl font-semibold'>{currency}{car.pricePerDay}</p>
          </div>
        </div>
      </div>

      <div className='px-1 pb-2 pt-4'>
        <div className='flex items-center justify-between gap-4'>
          <div className='flex items-center gap-2 text-sm font-medium text-slate-500'>
            <img src={assets.location_icon} alt="" className='h-4'/>
            <span>{car.location}</span>
          </div>
          {hasReviews ? (
            <span className='rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700'>
              {'\u2605'} {Number(car.averageRating).toFixed(1)}
            </span>
          ) : (
            <span className='text-sm font-medium text-slate-500'>per day</span>
          )}
        </div>

        <div className='mt-4 grid grid-cols-3 gap-2'>
          {specs.map((spec)=> (
            <div key={spec.label} className='rounded-md border border-slate-200 bg-slate-50 px-3 py-3'>
              <div className='flex items-center gap-2'>
                <img src={spec.icon} alt="" className='h-4 opacity-70'/>
                <span className='truncate text-sm font-semibold text-slate-800'>{spec.value}</span>
              </div>
              <p className='mt-1 text-[11px] font-medium uppercase tracking-wide text-slate-400'>{spec.label}</p>
            </div>
          ))}
        </div>

        <div className='mt-4 flex items-center justify-between border-t border-slate-100 pt-4'>
          <span className='text-sm font-semibold text-slate-500'>View details</span>
          <span className='flex h-9 w-9 items-center justify-center rounded-full bg-slate-950 text-white transition group-hover:bg-primary'>&gt;</span>
        </div>
      </div>
    </article>
  )
}

export default CarCard
