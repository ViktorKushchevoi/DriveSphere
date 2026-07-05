import React, { useEffect, useMemo, useState } from 'react'
import { assets} from '../../assets/assets'
import CarAvailabilityCalendar from '../../components/admin/CarAvailabilityCalendar'
import Title from '../../components/admin/Title'
import { useAppContext } from '../../context/AppContext'
import toast from 'react-hot-toast'
import CustomSelect from '../../components/CustomSelect'
import Pagination from '../../components/Pagination'

const Field = ({label, children}) => (
  <label className='flex flex-col gap-2'>
    <span className='text-sm font-semibold text-slate-700'>{label}</span>
    {children}
  </label>
)

const inputClass = 'rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-primary transition focus:border-primary'
const carsPerPage = 5

const defaultFilters = {
  availability: 'All',
  category: 'All',
  location: 'All',
  fuelType: 'All',
  transmission: 'All',
}

const categoryOptions = ['All', 'Sedan', 'Compact', 'Hatchback', 'SUV']
const locationOptions = ['All', 'New York', 'Los Angeles', 'Houston', 'Chicago']
const fuelTypeOptions = ['All', 'Petrol', 'Diesel', 'Hybrid', 'Electric']
const transmissionOptions = ['All', 'Automatic', 'Manual']
const editCategoryOptions = [{value: '', label: 'Select a category'}, 'Sedan', 'SUV', 'Compact', 'Hatchback', 'Van']
const editFuelTypeOptions = [{value: '', label: 'Select fuel type'}, 'Petrol', 'Diesel', 'Electric', 'Hybrid', 'Gas']
const editTransmissionOptions = [{value: '', label: 'Select transmission'}, 'Automatic', 'Manual', 'Semi-Automatic']
const editLocationOptions = [{value: '', label: 'Select a location'}, 'New York', 'Los Angeles', 'Houston', 'Chicago']
const availabilityOptions = ['All', 'Available', 'Unavailable']
const sortOptions = ['Newest first', 'Price low to high', 'Price high to low', 'Brand A-Z']

const ManageCars = () => {

  const {isAdmin, axios, currency, fetchCars} = useAppContext()

  const [cars, setCars] = useState([])
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [editingCar, setEditingCar] = useState(null)
  const [editImage, setEditImage] = useState(null)
  const [editForm, setEditForm] = useState(null)
  const [savingEdit, setSavingEdit] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState(defaultFilters)
  const [sortBy, setSortBy] = useState('Newest first')
  const [currentPage, setCurrentPage] = useState(1)
  const [expandedCalendarId, setExpandedCalendarId] = useState(null)

  const fetchAdminCars = async ()=>{
    try {
      setLoading(true)
      setErrorMessage('')
      const {data} = await axios.get('/api/admin/cars')
      if(data.success){
        setCars(data.cars)
      }else{
        const message = data.message || 'Unable to load cars. Please try again.'
        setErrorMessage(message)
        toast.error(message)
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Unable to load cars. Please try again.'
      setErrorMessage(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const deleteCar = async (carId)=>{
    try {

      const confirm = window.confirm('Are you sure you want to delete this car?')

      if(!confirm) return null

      const {data} = await axios.post('/api/admin/delete-car', {carId})
      if(data.success){
        toast.success(data.message)
        fetchAdminCars()
        fetchCars()
      }else{
        toast.error(data.message || 'Unable to remove this car. Please try again.')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to remove this car. Please try again.')
    }
  }

  const openEditModal = (car)=>{
    setEditingCar(car)
    setEditImage(null)
    setEditForm({
      brand: car.brand || '',
      model: car.model || '',
      year: car.year || '',
      category: car.category || '',
      seating_capacity: car.seating_capacity || '',
      fuel_type: car.fuel_type || '',
      transmission: car.transmission || '',
      pricePerDay: car.pricePerDay || '',
      location: car.location || '',
      description: car.description || '',
      isAvaliable: Boolean(car.isAvaliable),
    })
  }

  const closeEditModal = ()=>{
    setEditingCar(null)
    setEditImage(null)
    setEditForm(null)
  }

  const updateEditField = (field, value)=>{
    setEditForm(prev => ({...prev, [field]: value}))
  }

  const submitEdit = async (e)=>{
    e.preventDefault()
    if(!editingCar || !editForm || savingEdit) return

    try {
      setSavingEdit(true)
      let response

      if(editImage){
        const formData = new FormData()
        formData.append('carId', editingCar._id)
        formData.append('carData', JSON.stringify(editForm))
        formData.append('image', editImage)
        response = await axios.post('/api/admin/update-car', formData)
      }else{
        response = await axios.post('/api/admin/update-car', {
          carId: editingCar._id,
          carData: editForm,
        })
      }

      const {data} = response
      if(data.success){
        toast.success(data.message)
        closeEditModal()
        fetchAdminCars()
        fetchCars()
      }else{
        toast.error(data.message || 'Unable to update this car. Please try again.')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to update this car. Please try again.')
    } finally {
      setSavingEdit(false)
    }
  }

  const filteredCars = useMemo(()=>{
    const query = searchQuery.trim().toLowerCase()

    const results = cars.filter((car)=>{
      const searchableText = [
        car.brand,
        car.model,
        car.category,
        car.fuel_type,
        car.transmission,
        car.location,
        car.description,
      ].filter(Boolean).join(' ').toLowerCase()

      const matchesSearch = !query || searchableText.includes(query)
      const matchesAvailability = filters.availability === 'All'
        || (filters.availability === 'Available' && car.isAvaliable)
        || (filters.availability === 'Unavailable' && !car.isAvaliable)
      const matchesCategory = filters.category === 'All' || car.category === filters.category
      const matchesLocation = filters.location === 'All' || car.location === filters.location
      const matchesFuelType = filters.fuelType === 'All' || car.fuel_type === filters.fuelType
      const matchesTransmission = filters.transmission === 'All' || car.transmission === filters.transmission

      return matchesSearch && matchesAvailability && matchesCategory && matchesLocation && matchesFuelType && matchesTransmission
    })

    return [...results].sort((a, b)=>{
      if(sortBy === 'Price low to high') return Number(a.pricePerDay || 0) - Number(b.pricePerDay || 0)
      if(sortBy === 'Price high to low') return Number(b.pricePerDay || 0) - Number(a.pricePerDay || 0)
      if(sortBy === 'Brand A-Z') return `${a.brand || ''} ${a.model || ''}`.localeCompare(`${b.brand || ''} ${b.model || ''}`)
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    })
  }, [cars, filters, searchQuery, sortBy])

  const totalPages = Math.max(1, Math.ceil(filteredCars.length / carsPerPage))
  const paginatedCars = filteredCars.slice((currentPage - 1) * carsPerPage, currentPage * carsPerPage)
  const hasActiveFilters = searchQuery.trim() || Object.values(filters).some(value => value !== 'All') || sortBy !== 'Newest first'

  const updateFilter = (field, value)=>{
    setFilters(prev => ({...prev, [field]: value}))
    setCurrentPage(1)
  }

  const handleSearchChange = (value)=>{
    setSearchQuery(value)
    setCurrentPage(1)
  }

  const handleSortChange = (value)=>{
    setSortBy(value)
    setCurrentPage(1)
  }

  const clearFilters = ()=>{
    setSearchQuery('')
    setFilters(defaultFilters)
    setSortBy('Newest first')
    setCurrentPage(1)
  }

  const toggleCalendar = (carId)=>{
    setExpandedCalendarId(current => current === carId ? null : carId)
  }

  const handlePageChange = (page)=>{
    setCurrentPage(page)
    setExpandedCalendarId(null)
  }

  const updateCarInList = (updatedCar)=>{
    if(!updatedCar?._id) return
    setCars(prev => prev.map(car => car._id === updatedCar._id ? updatedCar : car))
    fetchCars()
  }

  useEffect(()=>{
    isAdmin && fetchAdminCars()
  },[isAdmin])

  useEffect(()=>{
    if(currentPage > totalPages){
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  return (
    <main className='min-w-0 flex-1 p-4 md:p-8'>
      <div className='mx-auto max-w-7xl'>
        <Title
          title="Fleet Management"
          action={<span className='rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200'>{filteredCars.length} vehicles</span>}
        />

        <section className='mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm'>
          <div className='grid gap-4 xl:grid-cols-[1.3fr_repeat(3,1fr)]'>
            <label className='flex flex-col gap-2'>
              <span className='text-sm font-semibold text-slate-700'>Search</span>
              <input
                type='search'
                value={searchQuery}
                onChange={e=> handleSearchChange(e.target.value)}
                placeholder='Search by brand, model, location, or features'
                className={inputClass}
              />
            </label>

            <label className='flex flex-col gap-2'>
              <span className='text-sm font-semibold text-slate-700'>Availability</span>
              <CustomSelect value={filters.availability} onChange={(value)=> updateFilter('availability', value)} options={availabilityOptions} />
            </label>

            <label className='flex flex-col gap-2'>
              <span className='text-sm font-semibold text-slate-700'>Category</span>
              <CustomSelect value={filters.category} onChange={(value)=> updateFilter('category', value)} options={categoryOptions} />
            </label>

            <label className='flex flex-col gap-2'>
              <span className='text-sm font-semibold text-slate-700'>Location</span>
              <CustomSelect value={filters.location} onChange={(value)=> updateFilter('location', value)} options={locationOptions} />
            </label>
          </div>

          <div className='mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_auto]'>
            <label className='flex flex-col gap-2'>
              <span className='text-sm font-semibold text-slate-700'>Fuel type</span>
              <CustomSelect value={filters.fuelType} onChange={(value)=> updateFilter('fuelType', value)} options={fuelTypeOptions} />
            </label>

            <label className='flex flex-col gap-2'>
              <span className='text-sm font-semibold text-slate-700'>Transmission</span>
              <CustomSelect value={filters.transmission} onChange={(value)=> updateFilter('transmission', value)} options={transmissionOptions} />
            </label>

            <label className='flex flex-col gap-2'>
              <span className='text-sm font-semibold text-slate-700'>Sort by</span>
              <CustomSelect value={sortBy} onChange={handleSortChange} options={sortOptions} />
            </label>

            <div className='flex items-end'>
              <button type='button' onClick={clearFilters} className='w-full rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:border-primary hover:text-primary xl:w-max'>
                Clear filters
              </button>
            </div>
          </div>
        </section>

        {loading ? (
          <div className='mt-8 grid gap-5'>
            <div className='rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm'>
              <p className='font-semibold text-slate-950'>Loading cars...</p>
              <p className='mt-2 text-sm text-slate-500'>Fetching your fleet inventory.</p>
            </div>
            {[1, 2, 3].map(item => (
              <div key={item} className='h-56 animate-pulse rounded-3xl bg-white shadow-sm ring-1 ring-slate-200'></div>
            ))}
          </div>
        ) : errorMessage ? (
          <div className='mt-8 rounded-3xl border border-red-100 bg-red-50 p-6 text-sm font-medium text-red-700'>
            {errorMessage}
          </div>
        ) : cars.length > 0 ? (
          <div className='mt-8 grid gap-5'>
            {paginatedCars.length > 0 ? paginatedCars.map((car)=>(
              <article key={car._id} className='overflow-visible rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:shadow-xl'>
                <div className='grid gap-0 lg:grid-cols-[260px_1fr]'>
                  <div className='relative h-56 overflow-hidden rounded-t-3xl bg-slate-100 lg:h-[220px] lg:rounded-l-3xl lg:rounded-tr-none'>
                    <img src={car.image} alt={`${car.brand} ${car.model}`} className='h-full w-full object-cover'/>
                    <span className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-semibold uppercase ring-1 ${car.isAvaliable ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-red-50 text-red-700 ring-red-200'}`}>
                      {car.isAvaliable ? "Available" : "Unavailable" }
                    </span>
                  </div>

                  <div className='grid gap-5 p-5 xl:grid-cols-[1fr_auto] xl:items-center'>
                    <div>
                      <p className='text-xs font-semibold uppercase tracking-[0.18em] text-primary'>{car.category}</p>
                      <h2 className='mt-2 text-2xl font-semibold text-slate-950'>{car.brand} {car.model}</h2>
                      <div className='mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2 xl:grid-cols-4'>
                        <span className='rounded-2xl bg-slate-50 px-4 py-3'>{car.seating_capacity} Seats</span>
                        <span className='rounded-2xl bg-slate-50 px-4 py-3'>{car.transmission}</span>
                        <span className='rounded-2xl bg-slate-50 px-4 py-3'>{car.fuel_type}</span>
                        <span className='rounded-2xl bg-slate-50 px-4 py-3'>{car.location}</span>
                      </div>
                    </div>

                    <div className='flex flex-col gap-4 xl:items-end'>
                      <div>
                        <p className='text-sm text-slate-500'>Daily rate</p>
                        <p className='text-3xl font-semibold text-slate-950'>{currency}{car.pricePerDay}</p>
                      </div>
                      <div className='flex flex-wrap gap-3'>
                        <button onClick={()=> openEditModal(car)} className='rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-primary hover:text-primary'>
                          Edit
                        </button>
                        <div className='relative'>
                          <button onClick={()=> toggleCalendar(car._id)} className='rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-primary hover:text-primary'>
                            {expandedCalendarId === car._id ? 'Hide calendar' : 'View calendar'}
                          </button>
                          {expandedCalendarId === car._id && (
                            <div className='absolute right-0 top-full z-50 mt-2'>
                              <CarAvailabilityCalendar carId={car._id} onCarUpdated={updateCarInList} />
                            </div>
                          )}
                        </div>
                        <button onClick={()=> deleteCar(car._id)} className='rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 transition hover:border-red-300'>
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            )) : (
              <div className='rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm'>
                <div className='mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100'>
                  <img src={assets.carIconColored} alt="" className='h-6 w-6'/>
                </div>
                <h2 className='mt-5 text-xl font-semibold text-slate-950'>No cars match your filters.</h2>
                <p className='mt-2 text-slate-500'>Try adjusting search, filters, or sorting.</p>
                {hasActiveFilters && (
                  <button type='button' onClick={clearFilters} className='mt-5 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-dull'>
                    Clear filters
                  </button>
                )}
              </div>
            )}

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              totalItems={filteredCars.length}
              pageSize={carsPerPage}
            />
          </div>
        ) : (
          <div className='mt-8 rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm'>
            <div className='mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100'>
              <img src={assets.carIconColored} alt="" className='h-6 w-6'/>
            </div>
            <h2 className='mt-5 text-xl font-semibold text-slate-950'>No cars added yet.</h2>
            <p className='mt-2 text-slate-500'>Add your first vehicle to start accepting booking requests.</p>
          </div>
        )}
      </div>

      {editingCar && editForm && (
        <div className='fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 px-4 py-6 backdrop-blur-sm'>
          <div className='mx-auto max-w-5xl rounded-3xl bg-white p-5 shadow-2xl md:p-6'>
            <div className='flex flex-col gap-3 border-b border-slate-200 pb-5 md:flex-row md:items-center md:justify-between'>
              <div>
                <p className='text-sm font-semibold uppercase tracking-[0.18em] text-primary'>Edit car</p>
                <h2 className='mt-2 text-2xl font-semibold text-slate-950'>{editingCar.brand} {editingCar.model}</h2>
              </div>
              <button type='button' onClick={closeEditModal} className='w-max rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-primary hover:text-primary'>
                Close
              </button>
            </div>

            <form onSubmit={submitEdit} className='mt-6 grid gap-6 lg:grid-cols-[300px_1fr]'>
              <section className='h-max rounded-3xl border border-slate-200 bg-slate-50 p-5'>
                <h3 className='text-lg font-semibold text-slate-950'>Listing image</h3>
                <p className='mt-2 text-sm text-slate-500'>Upload a new image only if you want to replace the current one.</p>
                <label htmlFor='edit-car-image' className='mt-5 flex aspect-[4/3] cursor-pointer items-center justify-center overflow-hidden rounded-3xl border border-dashed border-slate-300 bg-white text-center transition hover:border-primary'>
                  <img
                    src={editImage ? URL.createObjectURL(editImage) : editingCar.image}
                    alt={`${editingCar.brand} ${editingCar.model}`}
                    className='h-full w-full object-cover'
                  />
                  <input id='edit-car-image' type='file' accept='image/*' hidden onChange={e=> setEditImage(e.target.files[0])}/>
                </label>
                <p className='mt-3 text-xs text-slate-500'>{editImage ? editImage.name : 'Current image will be kept if no new file is selected.'}</p>
              </section>

              <div className='grid gap-5'>
                <section className='rounded-3xl border border-slate-200 p-5'>
                  <h3 className='text-lg font-semibold text-slate-950'>Basic details</h3>
                  <div className='mt-5 grid gap-4 md:grid-cols-2'>
                    <Field label='Brand'>
                      <input required className={inputClass} value={editForm.brand} onChange={e=> updateEditField('brand', e.target.value)}/>
                    </Field>
                    <Field label='Model'>
                      <input required className={inputClass} value={editForm.model} onChange={e=> updateEditField('model', e.target.value)}/>
                    </Field>
                    <Field label='Year'>
                      <input required type='number' min='1' className={inputClass} value={editForm.year} onChange={e=> updateEditField('year', e.target.value)}/>
                    </Field>
                    <Field label='Category'>
                      <CustomSelect value={editForm.category} onChange={(value)=> updateEditField('category', value)} placeholder='Select a category' options={editCategoryOptions} />
                    </Field>
                  </div>
                </section>

                <section className='rounded-3xl border border-slate-200 p-5'>
                  <h3 className='text-lg font-semibold text-slate-950'>Specifications</h3>
                  <div className='mt-5 grid gap-4 md:grid-cols-3'>
                    <Field label='Seats'>
                      <input required type='number' min='1' className={inputClass} value={editForm.seating_capacity} onChange={e=> updateEditField('seating_capacity', e.target.value)}/>
                    </Field>
                    <Field label='Fuel type'>
                      <CustomSelect value={editForm.fuel_type} onChange={(value)=> updateEditField('fuel_type', value)} placeholder='Select fuel type' options={editFuelTypeOptions} />
                    </Field>
                    <Field label='Transmission'>
                      <CustomSelect value={editForm.transmission} onChange={(value)=> updateEditField('transmission', value)} placeholder='Select transmission' options={editTransmissionOptions} />
                    </Field>
                  </div>
                </section>

                <section className='rounded-3xl border border-slate-200 p-5'>
                  <h3 className='text-lg font-semibold text-slate-950'>Pricing, location, and status</h3>
                  <div className='mt-5 grid gap-4 md:grid-cols-3'>
                    <Field label={`Daily price (${currency})`}>
                      <input required type='number' min='1' className={inputClass} value={editForm.pricePerDay} onChange={e=> updateEditField('pricePerDay', e.target.value)}/>
                    </Field>
                    <Field label='Location'>
                      <CustomSelect value={editForm.location} onChange={(value)=> updateEditField('location', value)} placeholder='Select a location' options={editLocationOptions} />
                    </Field>
                    <Field label='Availability'>
                      <CustomSelect
                        value={String(editForm.isAvaliable)}
                        onChange={(value)=> updateEditField('isAvaliable', value === 'true')}
                        options={[
                          {value: 'true', label: 'Available'},
                          {value: 'false', label: 'Unavailable'},
                        ]}
                      />
                    </Field>
                  </div>
                </section>

                <section className='rounded-3xl border border-slate-200 p-5'>
                  <Field label='Description'>
                    <textarea required rows={5} className={`${inputClass} resize-none`} value={editForm.description} onChange={e=> updateEditField('description', e.target.value)}></textarea>
                  </Field>
                  <div className='mt-5 flex flex-wrap justify-end gap-3'>
                    <button type='button' onClick={closeEditModal} className='rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:border-primary hover:text-primary'>
                      Cancel
                    </button>
                    <button disabled={savingEdit} className='rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-dull disabled:cursor-not-allowed disabled:opacity-70'>
                      {savingEdit ? 'Saving...' : 'Save changes'}
                    </button>
                  </div>
                </section>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}

export default ManageCars
