import React, { useEffect, useState } from 'react'
import CarCard from '../components/CarCard'
import { useAppContext } from '../context/AppContext'
import Pagination from '../components/Pagination'

const savedCarsPerPage = 6

const SavedCars = () => {
  const {fetchSavedCars, savedCarsLoading, navigate, user, setShowLogin} = useAppContext()
  const [savedCars, setSavedCars] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)

  const loadSavedCars = async ()=>{
    setLoading(true)
    const cars = await fetchSavedCars()
    setSavedCars(cars)
    setLoading(false)
  }

  const handleSavedChange = (carId, isSaved)=>{
    if(!isSaved){
      setSavedCars(prev => prev.filter(car => car._id !== carId))
    }
  }

  const totalPages = Math.max(1, Math.ceil(savedCars.length / savedCarsPerPage))
  const paginatedSavedCars = savedCars.slice((currentPage - 1) * savedCarsPerPage, currentPage * savedCarsPerPage)

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

    loadSavedCars()
  }, [user])

  useEffect(()=>{
    if(currentPage > totalPages){
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  if(!user || user.role === 'admin'){
    return null
  }

  const isLoading = loading || savedCarsLoading

  return (
    <main className='bg-slate-50'>
      <div className='mx-auto max-w-7xl px-5 py-12 md:px-8'>
        <div className='mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
          <div>
            <p className='text-sm font-semibold uppercase tracking-[0.2em] text-primary'>Saved Cars</p>
            <h1 className='mt-3 text-4xl font-semibold text-slate-950'>Cars you saved</h1>
            <p className='mt-3 max-w-2xl text-slate-500'>Keep your favorite DriveSphere listings in one place and return to them when you are ready.</p>
          </div>
          <button onClick={()=> navigate('/cars')} className='rounded-md border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-primary hover:text-primary'>
            Browse cars
          </button>
        </div>

        {isLoading ? (
          <div>
            <p className='text-sm font-medium text-slate-500'>Loading saved cars...</p>
            <div className='mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
              {[1, 2, 3].map((item)=> (
                <div key={item} className='h-80 animate-pulse rounded-md border border-slate-200 bg-white p-4'>
                  <div className='h-44 rounded-md bg-slate-100'></div>
                  <div className='mt-5 h-4 w-2/3 rounded bg-slate-100'></div>
                  <div className='mt-3 h-4 w-1/2 rounded bg-slate-100'></div>
                  <div className='mt-6 h-10 rounded bg-slate-100'></div>
                </div>
              ))}
            </div>
          </div>
        ) : savedCars.length > 0 ? (
          <>
            <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
              {paginatedSavedCars.map(car => (
                <CarCard key={car._id} car={car} onSavedChange={handleSavedChange}/>
              ))}
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={savedCars.length}
              pageSize={savedCarsPerPage}
            />
          </>
        ) : (
          <div className='rounded-md border border-slate-200 bg-white px-6 py-16 text-center shadow-sm'>
            <h2 className='text-2xl font-semibold text-slate-950'>No saved cars yet.</h2>
            <p className='mt-2 text-slate-500'>Save cars you like and compare them later.</p>
            <button onClick={()=> navigate('/cars')} className='mt-6 rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-dull'>
              Browse cars
            </button>
          </div>
        )}
      </div>
    </main>
  )
}

export default SavedCars
