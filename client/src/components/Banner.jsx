import React from 'react'
import { assets } from '../assets/assets'

const Banner = () => {
  const steps = [
    ['01', 'Search your route', 'Choose location and travel dates in seconds.'],
    ['02', 'Select a car', 'Compare price, seats, fuel, and transmission.'],
    ['03', 'Reserve online', 'Send your booking request without hidden steps.'],
  ]

  return (
    <section className='bg-slate-950 px-5 py-24 text-white md:px-8'>
      <div className='mx-auto grid max-w-7xl grid-cols-1 gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center'>
        <div>
          <p className='text-sm font-semibold uppercase tracking-[0.2em] text-teal-200'>How booking works</p>
          <h2 className='mt-4 text-4xl font-semibold md:text-5xl'>A calmer way to book a better car.</h2>
          <p className='mt-5 leading-7 text-slate-300'>DriveSphere keeps the rental flow direct: search, compare, reserve, and manage your trip from one place.</p>
          <img src={assets.banner_car_image} alt="DriveSphere vehicle" className='mt-10 max-h-56 object-contain'/>
        </div>

        <div className='grid gap-4'>
          {steps.map(([number, title, copy])=> (
            <div key={number} className='grid grid-cols-[64px_1fr] gap-5 rounded-md border border-white/10 bg-white/5 p-5'>
              <span className='flex h-12 w-12 items-center justify-center rounded-md bg-primary text-sm font-semibold'>{number}</span>
              <div>
                <h3 className='text-xl font-semibold'>{title}</h3>
                <p className='mt-2 text-slate-300'>{copy}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Banner
