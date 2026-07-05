import React, { useState } from 'react'
import Title from '../../components/admin/Title'
import { assets } from '../../assets/assets'
import { useAppContext } from '../../context/AppContext'
import toast from 'react-hot-toast'
import CustomSelect from '../../components/CustomSelect'

const Field = ({label, children}) => (
  <label className='flex flex-col gap-2'>
    <span className='text-sm font-semibold text-slate-700'>{label}</span>
    {children}
  </label>
)

const sectionClass = 'rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6'
const inputClass = 'rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-primary transition focus:border-primary'
const categoryOptions = [
  {value: '', label: 'Select a category'},
  'Sedan',
  'SUV',
  'Van',
]
const transmissionOptions = [
  {value: '', label: 'Select a transmission'},
  'Automatic',
  'Manual',
  'Semi-Automatic',
]
const fuelOptions = [
  {value: '', label: 'Select a fuel type'},
  'Gas',
  'Diesel',
  'Petrol',
  'Electric',
  'Hybrid',
]
const locationOptions = [
  {value: '', label: 'Select a location'},
  'New York',
  'Los Angeles',
  'Houston',
  'Chicago',
]

const AddCar = () => {

  const {axios, currency} = useAppContext()

  const [image, setImage] = useState(null)
  const [car, setCar] = useState({
    brand: '',
    model: '',
    year: 0,
    pricePerDay: 0,
    category: '',
    transmission: '',
    fuel_type: '',
    seating_capacity: 0,
    location: '',
    description: '',
  })

  const [isLoading, setIsLoading] = useState(false)
  const onSubmitHandler = async (e)=>{
    e.preventDefault()
    if(isLoading) return null

    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append('image', image)
      formData.append('carData', JSON.stringify(car))

      const {data} = await axios.post('/api/admin/add-car', formData)

      if(data.success){
        toast.success(data.message)
        setImage(null)
        setCar({
          brand: '',
          model: '',
          year: 0,
          pricePerDay: 0,
          category: '',
          transmission: '',
          fuel_type: '',
          seating_capacity: 0,
          location: '',
          description: '',
        })
      }else{
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }finally{
      setIsLoading(false)
    }
  }

  return (
    <main className='min-w-0 flex-1 p-4 md:p-8'>
      <div className='mx-auto max-w-7xl'>
        <Title title="Add New Car"/>

        <form onSubmit={onSubmitHandler} className='mt-8 grid gap-6 xl:grid-cols-[360px_1fr]'>
          <section className={`${sectionClass} h-max`}>
            <h2 className='text-xl font-semibold text-slate-950'>Listing image</h2>
            <p className='mt-2 text-sm text-slate-500'>Use a clear landscape photo for the best public card presentation.</p>

            <label htmlFor="car-image" className='mt-6 flex aspect-[4/3] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-3xl border border-dashed border-slate-300 bg-slate-50 text-center transition hover:border-primary'>
              <img src={image ? URL.createObjectURL(image) : assets.upload_icon} alt="" className={`${image ? 'h-full w-full object-cover' : 'h-14 w-14 opacity-70'}`}/>
              {!image && <span className='mt-4 text-sm font-semibold text-slate-600'>Upload vehicle image</span>}
              <input type="file" id="car-image" accept="image/*" hidden onChange={e=> setImage(e.target.files[0])}/>
            </label>
          </section>

          <div className='grid gap-6'>
            <section className={sectionClass}>
              <div className='mb-5 flex items-center justify-between'>
                <div>
                  <h2 className='text-xl font-semibold text-slate-950'>Basic details</h2>
                  <p className='mt-1 text-sm text-slate-500'>Name and classify the vehicle.</p>
                </div>
                <span className='rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500'>Step 1</span>
              </div>
              <div className='grid gap-5 md:grid-cols-2'>
                <Field label="Brand">
                  <input type="text" placeholder="e.g. BMW, Mercedes, Audi..." required className={inputClass} value={car.brand} onChange={e=> setCar({...car, brand: e.target.value})}/>
                </Field>
                <Field label="Model">
                  <input type="text" placeholder="e.g. X5, E-Class, M4..." required className={inputClass} value={car.model} onChange={e=> setCar({...car, model: e.target.value})}/>
                </Field>
                <Field label="Year">
                  <input type="number" placeholder="2025" required className={inputClass} value={car.year} onChange={e=> setCar({...car, year: e.target.value})}/>
                </Field>
                <Field label="Category">
                  <CustomSelect value={car.category} onChange={(value)=> setCar({...car, category: value})} placeholder='Select a category' options={categoryOptions} />
                </Field>
              </div>
            </section>

            <section className={sectionClass}>
              <div className='mb-5 flex items-center justify-between'>
                <div>
                  <h2 className='text-xl font-semibold text-slate-950'>Specifications</h2>
                  <p className='mt-1 text-sm text-slate-500'>Help customers compare the driving experience.</p>
                </div>
                <span className='rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500'>Step 2</span>
              </div>
              <div className='grid gap-5 md:grid-cols-3'>
                <Field label="Transmission">
                  <CustomSelect value={car.transmission} onChange={(value)=> setCar({...car, transmission: value})} placeholder='Select a transmission' options={transmissionOptions} />
                </Field>
                <Field label="Fuel Type">
                  <CustomSelect value={car.fuel_type} onChange={(value)=> setCar({...car, fuel_type: value})} placeholder='Select a fuel type' options={fuelOptions} />
                </Field>
                <Field label="Seating Capacity">
                  <input type="number" placeholder="4" required className={inputClass} value={car.seating_capacity} onChange={e=> setCar({...car, seating_capacity: e.target.value})}/>
                </Field>
              </div>
            </section>

            <section className={sectionClass}>
              <div className='mb-5 flex items-center justify-between'>
                <div>
                  <h2 className='text-xl font-semibold text-slate-950'>Pricing and location</h2>
                  <p className='mt-1 text-sm text-slate-500'>Set the daily rate and pickup city.</p>
                </div>
                <span className='rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500'>Step 3</span>
              </div>
              <div className='grid gap-5 md:grid-cols-2'>
                <Field label={`Daily Price (${currency})`}>
                  <input type="number" placeholder="100" required className={inputClass} value={car.pricePerDay} onChange={e=> setCar({...car, pricePerDay: e.target.value})}/>
                </Field>
                <Field label="Location">
                  <CustomSelect value={car.location} onChange={(value)=> setCar({...car, location: value})} placeholder='Select a location' options={locationOptions} />
                </Field>
              </div>
            </section>

            <section className={sectionClass}>
              <Field label="Description">
                <textarea rows={5} placeholder="e.g. A luxurious SUV with a spacious interior and a powerful engine." required className={inputClass} value={car.description} onChange={e=> setCar({...car, description: e.target.value})}></textarea>
              </Field>
              <button className='mt-6 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3.5 font-semibold text-white transition hover:bg-primary-dull md:w-max'>
                <img src={assets.tick_icon} alt="" />
                {isLoading ? 'Publishing...' : 'Publish Car'}
              </button>
            </section>
          </div>
        </form>
      </div>
    </main>
  )
}

export default AddCar
