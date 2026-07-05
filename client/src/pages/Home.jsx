import React from 'react'
import Hero from '../components/Hero'
import FeaturedSection from '../components/FeaturedSection'
import Banner from '../components/Banner'
import { useNavigate } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'

const Home = () => {
  const navigate = useNavigate()
  const {setPickupDate, setReturnDate} = useAppContext()
  const carTypes = ['SUV', 'Sedan', 'Compact', 'Hatchback']

  const openCategory = (type)=>{
    setPickupDate('')
    setReturnDate('')
    navigate(`/cars?category=${encodeURIComponent(type)}`)
  }

  return (
    <>
      <Hero />
      <FeaturedSection />
      <Banner />
      <section className='px-5 py-20 md:px-8 md:py-24'>
        <div className='mx-auto max-w-7xl'>
          <div className='grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end'>
            <div>
              <p className='text-sm font-semibold uppercase tracking-[0.2em] text-primary'>Popular car types</p>
              <h2 className='mt-3 text-4xl font-semibold text-slate-950'>Choose by the drive you need.</h2>
            </div>
            <p className='leading-7 text-slate-500'>From refined sedans to roomy SUVs, DriveSphere keeps browsing focused on real rental needs.</p>
          </div>
          <div className='mt-10 grid grid-cols-2 gap-4 md:grid-cols-4'>
            {carTypes.map((type)=> (
              <button key={type} onClick={()=> openCategory(type)} className='cursor-pointer rounded-md border border-slate-200 bg-white p-6 text-left transition hover:-translate-y-1 hover:border-primary hover:shadow-lg'>
                <span className='text-2xl font-semibold text-slate-950'>{type}</span>
                <span className='mt-3 block text-sm text-slate-500'>Browse available cars</span>
              </button>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

export default Home
