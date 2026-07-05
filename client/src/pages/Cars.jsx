import React, { useEffect, useMemo, useState } from 'react'
import Title from '../components/Title'
import { assets } from '../assets/assets'
import CarCard from '../components/CarCard'
import { useSearchParams } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'
import toast from 'react-hot-toast'
import CustomSelect from '../components/CustomSelect'
import Pagination from '../components/Pagination'

const defaultFilters = {
  category: '',
  fuelType: '',
  transmission: '',
  location: '',
  minPrice: '',
  maxPrice: '',
  seats: '',
}

const carsPerPage = 12

const getUniqueOptions = (cars, key) => {
  return [...new Set(cars.map((car) => car[key]).filter(Boolean))].sort()
}

const Cars = () => {

  // getting search params from url
  const [searchParams, setSearchParams] = useSearchParams()
  const pickupLocation = searchParams.get('pickupLocation') || searchParams.get('location') || ''
  const pickupDate = searchParams.get('pickupDate')
  const returnDate = searchParams.get('returnDate')
  const categoryParam = searchParams.get('category')

  const {cars, axios, currency, carsLoading, setPickupDate, setReturnDate} = useAppContext()

  const [input, setInput] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    ...defaultFilters,
    category: categoryParam || '',
    location: pickupLocation || '',
  })
  const [sortBy, setSortBy] = useState('')
  const [availableCars, setAvailableCars] = useState([])
  const [availabilityLoading, setAvailabilityLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const isSearchData = pickupDate && returnDate
  const baseCars = isSearchData ? availableCars : cars
  const isLoadingCars = carsLoading || availabilityLoading

  const searchCarAvailability = async () =>{
    try {
      setAvailabilityLoading(true)
      const {data} = await axios.post('/api/bookings/check-availability', {location: filters.location, pickupDate, returnDate})
      if (data.success) {
        setAvailableCars(data.availableCars)
        if(data.availableCars.length === 0){
          toast('No cars available')
        }
      }else{
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setAvailabilityLoading(false)
    }
  }

  const syncFilterQuery = (key, value) => {
    const nextParams = new URLSearchParams(searchParams)

    if(key === 'location'){
      nextParams.delete('pickupLocation')
      if(value){
        nextParams.set('location', value)
      }else{
        nextParams.delete('location')
      }
    }

    if(key === 'category'){
      if(value){
        nextParams.set('category', value)
      }else{
        nextParams.delete('category')
      }
    }

    setSearchParams(nextParams)
  }

  const updateFilter = (key, value) => {
    setFilters((prev) => ({...prev, [key]: value}))
    setCurrentPage(1)
    if(key === 'location' || key === 'category'){
      syncFilterQuery(key, value)
    }
  }

  const clearFilters = () => {
    setInput('')
    setFilters(defaultFilters)
    setSortBy('')
    setCurrentPage(1)
    setPickupDate('')
    setReturnDate('')
    setSearchParams({})
  }

  const categoryOptions = useMemo(() => getUniqueOptions(cars, 'category'), [cars])
  const fuelOptions = useMemo(() => getUniqueOptions(cars, 'fuel_type'), [cars])
  const transmissionOptions = useMemo(() => getUniqueOptions(cars, 'transmission'), [cars])
  const locationOptions = useMemo(() => getUniqueOptions(cars, 'location'), [cars])
  const seatOptions = useMemo(() => getUniqueOptions(cars, 'seating_capacity'), [cars])

  const filteredCars = useMemo(() => {
    const search = input.trim().toLowerCase()
    const minPrice = filters.minPrice === '' ? null : Number(filters.minPrice)
    const maxPrice = filters.maxPrice === '' ? null : Number(filters.maxPrice)

    const result = baseCars.filter((car) => {
      const searchableText = [
        car.brand,
        car.model,
        car.category,
        car.fuel_type,
        car.transmission,
        car.location,
        car.description,
      ].filter(Boolean).join(' ').toLowerCase()

      const matchesSearch = !search || searchableText.includes(search)
      const matchesCategory = !filters.category || car.category === filters.category
      const matchesFuel = !filters.fuelType || car.fuel_type === filters.fuelType
      const matchesTransmission = !filters.transmission || car.transmission === filters.transmission
      const matchesLocation = !filters.location || car.location === filters.location
      const matchesMinPrice = minPrice === null || Number(car.pricePerDay) >= minPrice
      const matchesMaxPrice = maxPrice === null || Number(car.pricePerDay) <= maxPrice
      const matchesSeats = !filters.seats || Number(car.seating_capacity) === Number(filters.seats)

      return matchesSearch && matchesCategory && matchesFuel && matchesTransmission && matchesLocation && matchesMinPrice && matchesMaxPrice && matchesSeats
    })

    return result.sort((a, b) => {
      if(sortBy === 'price-low'){
        return Number(a.pricePerDay) - Number(b.pricePerDay)
      }
      if(sortBy === 'price-high'){
        return Number(b.pricePerDay) - Number(a.pricePerDay)
      }
      if(sortBy === 'newest'){
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      }
      if(sortBy === 'seats-low'){
        return Number(a.seating_capacity) - Number(b.seating_capacity)
      }
      if(sortBy === 'seats-high'){
        return Number(b.seating_capacity) - Number(a.seating_capacity)
      }
      return 0
    })
  }, [baseCars, filters, input, sortBy])

  const totalPages = Math.max(1, Math.ceil(filteredCars.length / carsPerPage))
  const paginatedCars = filteredCars.slice((currentPage - 1) * carsPerPage, currentPage * carsPerPage)

  const handleSearchInputChange = (value)=>{
    setInput(value)
    setCurrentPage(1)
  }

  const handleSortChange = (value)=>{
    setSortBy(value)
    setCurrentPage(1)
  }

  useEffect(()=>{
    if(isSearchData){
      searchCarAvailability()
    }else{
      setAvailableCars([])
      setAvailabilityLoading(false)
    }
  },[pickupDate, returnDate, filters.location])

  useEffect(()=>{
    setFilters((prev) => ({
      ...prev,
      category: categoryParam || '',
      location: pickupLocation || '',
    }))
    setCurrentPage(1)
  },[categoryParam, pickupLocation])

  useEffect(()=>{
    setCurrentPage(1)
  },[pickupLocation, pickupDate, returnDate])

  useEffect(()=>{
    if(currentPage > totalPages){
      setCurrentPage(totalPages)
    }
  },[currentPage, totalPages])

  return (
    <div>

      <div className='flex flex-col items-center bg-light px-5 py-16 md:px-8'>
        <Title title='Find your next car' subTitle='Search, filter, and sort the DriveSphere fleet by the details that matter.'/>

        <div className='mt-8 flex h-14 w-full max-w-3xl items-center rounded-md border border-slate-200 bg-white px-4 shadow-sm'>
          <img src={assets.search_icon} alt="" className='w-4.5 h-4.5 mr-2'/>

          <input onChange={(e)=> handleSearchInputChange(e.target.value)} value={input} type="text" placeholder='Search by make, model, or features' className='h-full w-full bg-transparent text-slate-600 outline-none'/>

          <button type='button' onClick={()=> setShowFilters((prev) => !prev)} className='ml-2 rounded-md border border-slate-200 p-2 transition hover:border-primary' aria-label='Toggle filters'>
            <img src={assets.filter_icon} alt="" className='w-4.5 h-4.5'/>
          </button>
        </div>

        {showFilters && (
          <div className='mt-5 w-full max-w-6xl rounded-md border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm'>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
              <CustomSelect
                value={filters.category}
                onChange={(value)=> updateFilter('category', value)}
                placeholder='All Categories'
                options={[{value: '', label: 'All Categories'}, ...categoryOptions]}
                buttonClassName='rounded-md shadow-none'
              />

              <CustomSelect
                value={filters.fuelType}
                onChange={(value)=> updateFilter('fuelType', value)}
                placeholder='All Fuel Types'
                options={[{value: '', label: 'All Fuel Types'}, ...fuelOptions]}
                buttonClassName='rounded-md shadow-none'
              />

              <CustomSelect
                value={filters.transmission}
                onChange={(value)=> updateFilter('transmission', value)}
                placeholder='All Transmissions'
                options={[{value: '', label: 'All Transmissions'}, ...transmissionOptions]}
                buttonClassName='rounded-md shadow-none'
              />

              <CustomSelect
                value={filters.location}
                onChange={(value)=> updateFilter('location', value)}
                placeholder='All Locations'
                options={[{value: '', label: 'All Locations'}, ...locationOptions]}
                buttonClassName='rounded-md shadow-none'
              />

              <input value={filters.minPrice} onChange={(e)=> updateFilter('minPrice', e.target.value)} type="number" min="0" placeholder={`Min Price (${currency})`} className='rounded-md border border-slate-200 px-3 py-3 outline-primary'/>

              <input value={filters.maxPrice} onChange={(e)=> updateFilter('maxPrice', e.target.value)} type="number" min="0" placeholder={`Max Price (${currency})`} className='rounded-md border border-slate-200 px-3 py-3 outline-primary'/>

              <CustomSelect
                value={filters.seats}
                onChange={(value)=> updateFilter('seats', value)}
                placeholder='Any Seats'
                options={[{value: '', label: 'Any Seats'}, ...seatOptions.map((seats)=> ({value: String(seats), label: `${seats} Seats`}))]}
                buttonClassName='rounded-md shadow-none'
              />

              <CustomSelect
                value={sortBy}
                onChange={handleSortChange}
                placeholder='Sort By'
                options={[
                  {value: '', label: 'Sort By'},
                  {value: 'price-low', label: 'Price: Low to High'},
                  {value: 'price-high', label: 'Price: High to Low'},
                  {value: 'newest', label: 'Newest First'},
                  {value: 'seats-low', label: 'Seats: Low to High'},
                  {value: 'seats-high', label: 'Seats: High to Low'},
                ]}
                buttonClassName='rounded-md shadow-none'
              />
            </div>

            <div className='flex justify-end mt-4'>
              <button type='button' onClick={clearFilters} className='cursor-pointer rounded-md border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:border-primary hover:text-primary'>
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      <div className='mx-auto max-w-7xl px-5 py-12 md:px-8'>
        <p className='text-sm font-medium text-slate-500'>Showing {filteredCars.length} Cars</p>

        {isLoadingCars ? (
          <div>
            <p className='mt-5 text-sm font-medium text-slate-500'>Loading available cars...</p>
            <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-5'>
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
        ) : filteredCars.length > 0 ? (
          <div className='mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
            {paginatedCars.map((car)=> (
              <div key={car._id}>
                <CarCard car={car}/>
              </div>
            ))}
          </div>
        ) : (
          <div className='flex flex-col items-center justify-center text-center py-20'>
            <h2 className='text-2xl font-medium text-gray-700'>No cars found</h2>
            <p className='text-gray-500 mt-2'>Try adjusting your search or filters</p>
          </div>
        )}

        {!isLoadingCars && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredCars.length}
            pageSize={carsPerPage}
          />
        )}
      </div>

    </div>
  )
}

export default Cars
