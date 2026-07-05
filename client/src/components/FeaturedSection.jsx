import React from 'react'
import Title from './Title'
import CarCard from './CarCard'
import { useNavigate } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'

const FeaturedSection = () => {

    const navigate = useNavigate()
    const {cars, setPickupDate, setReturnDate} = useAppContext()

    const openAllCars = ()=>{
      setPickupDate('')
      setReturnDate('')
      navigate('/cars')
      scrollTo(0,0)
    }

  return (
    <section className='px-5 pb-24 pt-10 md:px-8 md:pt-12'>
      <div className='mx-auto max-w-7xl'>
        <div className='flex flex-col gap-6 md:flex-row md:items-end md:justify-between'>
          <Title title='Featured vehicles' subTitle='A short list of standout cars ready for your next route.' align='left'/>
          <button onClick={openAllCars} className='w-max rounded-md border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-primary hover:text-primary'>
            Explore all cars
          </button>
        </div>

        <div className='mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
          {cars.slice(0,6).map((car)=> (
            <CarCard key={car._id} car={car}/>
          ))}
        </div>
      </div>
    </section>
  )
}

export default FeaturedSection
