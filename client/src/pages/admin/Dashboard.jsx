import React, { useEffect, useState } from 'react'
import { assets } from '../../assets/assets'
import Title from '../../components/admin/Title'
import { useAppContext } from '../../context/AppContext'
import toast from 'react-hot-toast'

const statusClass = {
  pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  confirmed: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  cancelled: 'bg-red-50 text-red-700 ring-red-200',
}

const Dashboard = () => {

  const {axios, isAdmin, currency} = useAppContext()

  const [data, setData] = useState({
    totalCars: 0,
    totalBookings: 0,
    pendingBookings: 0,
    completedBookings: 0,
    recentBookings: [],
    monthlyRevenue: 0,
  })
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const dashboardCards = [
    {title: "Total Cars", value: data.totalCars, icon: assets.carIconColored, tone: 'from-slate-950 to-slate-800', note: 'Fleet inventory'},
    {title: "Total Bookings", value: data.totalBookings, icon: assets.listIconColored, tone: 'from-teal-700 to-emerald-600', note: 'All requests'},
    {title: "Pending", value: data.pendingBookings, icon: assets.cautionIconColored, tone: 'from-amber-500 to-orange-500', note: 'Needs review'},
    {title: "Confirmed", value: data.completedBookings, icon: assets.listIconColored, tone: 'from-emerald-600 to-teal-500', note: 'Approved trips'},
  ]

  const fetchDashboardData = async ()=>{
    try {
       setLoading(true)
       setErrorMessage('')
       const { data } = await axios.get('/api/admin/dashboard')
       if (data.success){
        setData(data.dashboardData)
       }else{
        const message = data.message || 'Unable to load dashboard data. Please try again.'
        setErrorMessage(message)
        toast.error(message)
       }
    } catch (error) {
      const message = error.response?.data?.message || 'Unable to load dashboard data. Please try again.'
      setErrorMessage(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(()=>{
    if(isAdmin){
      fetchDashboardData()
    }
  },[isAdmin])

  return (
    <main className='min-w-0 flex-1 p-4 md:p-8'>
      <div className='mx-auto max-w-7xl'>
        <Title title="Operations Dashboard"/>

        {loading ? (
          <section className='mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
            {[1, 2, 3, 4].map(item => (
              <div key={item} className='h-44 animate-pulse rounded-3xl bg-white shadow-sm ring-1 ring-slate-200'>
                <div className='p-5'>
                  <div className='h-4 w-24 rounded bg-slate-200'></div>
                  <div className='mt-5 h-10 w-20 rounded bg-slate-200'></div>
                  <div className='mt-8 h-3 w-32 rounded bg-slate-100'></div>
                </div>
              </div>
            ))}
          </section>
        ) : (
          <section className='mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
          {dashboardCards.map((card)=>(
            <div key={card.title} className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${card.tone} p-5 text-white shadow-xl shadow-slate-200`}>
              <div className='absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10'></div>
              <div className='relative flex items-start justify-between gap-4'>
                <div>
                  <p className='text-sm text-white/70'>{card.title}</p>
                  <p className='mt-3 text-4xl font-semibold'>{card.value}</p>
                  <p className='mt-4 text-xs font-medium uppercase tracking-[0.18em] text-white/60'>{card.note}</p>
                </div>
                <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-white/95'>
                  <img src={card.icon} alt="" className='h-5 w-5'/>
                </div>
              </div>
            </div>
          ))}
          </section>
        )}

        {errorMessage && !loading && (
          <div className='mt-8 rounded-3xl border border-red-100 bg-red-50 p-6 text-sm font-medium text-red-700'>
            {errorMessage}
          </div>
        )}

        <section className='mt-8 grid gap-6 xl:grid-cols-[1fr_380px]'>
          <div className='rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6'>
            <div className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
              <div>
                <h2 className='text-2xl font-semibold text-slate-950'>Recent Bookings</h2>
                <p className='mt-1 text-sm text-slate-500'>Latest customer requests from your active fleet.</p>
              </div>
              <span className='w-max rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500'>{data.recentBookings.length} shown</span>
            </div>

            {loading ? (
              <div className='mt-6 grid gap-3'>
                {[1, 2, 3].map(item => (
                  <div key={item} className='h-20 animate-pulse rounded-2xl bg-slate-100'></div>
                ))}
              </div>
            ) : data.recentBookings.length > 0 ? (
              <div className='mt-6 divide-y divide-slate-100'>
                {data.recentBookings.map((booking)=>(
                  <div key={booking._id} className='grid gap-4 py-4 md:grid-cols-[1fr_auto] md:items-center'>
                    <div className='flex items-center gap-4'>
                      <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950'>
                        <img src={assets.listIconColored} alt="" className='h-5 w-5'/>
                      </div>
                      <div>
                        <p className='font-semibold text-slate-950'>{booking.car.brand} {booking.car.model}</p>
                        <p className='mt-1 text-sm text-slate-500'>Booked on {booking.createdAt.split('T')[0]}</p>
                      </div>
                    </div>
                    <div className='flex items-center gap-3'>
                      <p className='font-semibold text-slate-950'>{currency}{booking.price}</p>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ring-1 ${statusClass[booking.status] || 'bg-slate-100 text-slate-600 ring-slate-200'}`}>{booking.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : !errorMessage ? (
              <div className='mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center'>
                <p className='font-semibold text-slate-950'>No recent bookings</p>
                <p className='mt-2 text-sm text-slate-500'>New booking requests will appear here.</p>
              </div>
            ) : null}
          </div>

          <div className='grid gap-6'>
            <section className='rounded-3xl bg-slate-950 p-6 text-white shadow-xl shadow-slate-200'>
              <p className='text-sm text-slate-300'>Monthly Revenue</p>
              <p className='mt-4 text-5xl font-semibold'>{currency}{data.monthlyRevenue}</p>
              <div className='mt-6 h-2 overflow-hidden rounded-full bg-white/10'>
                <div className='h-full w-3/4 rounded-full bg-primary'></div>
              </div>
              <p className='mt-4 text-sm leading-6 text-slate-300'>Calculated from confirmed bookings returned by the existing dashboard API.</p>
            </section>

            <section className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
              <h3 className='text-lg font-semibold text-slate-950'>Booking mix</h3>
              <div className='mt-5 grid gap-3'>
                <div className='flex items-center justify-between rounded-2xl bg-amber-50 px-4 py-3 text-amber-800'>
                  <span>Pending review</span>
                  <strong>{data.pendingBookings}</strong>
                </div>
                <div className='flex items-center justify-between rounded-2xl bg-emerald-50 px-4 py-3 text-emerald-800'>
                  <span>Confirmed trips</span>
                  <strong>{data.completedBookings}</strong>
                </div>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  )
}

export default Dashboard
