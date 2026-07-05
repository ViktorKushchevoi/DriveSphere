import React, { useEffect } from 'react'
import Navbar from './components/Navbar'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import CarDetails from './pages/CarDetails'
import Cars from './pages/Cars'
import MyBookings from './pages/MyBookings'
import Checkout from './pages/Checkout'
import Profile from './pages/Profile'
import BookingSuccess from './pages/BookingSuccess'
import SavedCars from './pages/SavedCars'
import Footer from './components/Footer'
import Layout from './pages/admin/Layout'
import Dashboard from './pages/admin/Dashboard'
import AddCar from './pages/admin/AddCar'
import ManageCars from './pages/admin/ManageCars'
import ManageBookings from './pages/admin/ManageBookings'
import Login from './components/Login'
import { Toaster } from 'react-hot-toast'
import { useAppContext } from './context/AppContext'

const ProtectedAdminRoute = ({children}) => {
  const {authLoading, user, isAdmin} = useAppContext()

  if(authLoading){
    return null
  }

  return user?.role === 'admin' && isAdmin ? children : <Navigate to='/' replace />
}

const CustomerOnlyRoute = ({children}) => {
  const {authLoading, user} = useAppContext()

  if(authLoading){
    return null
  }

  return user?.role === 'admin' ? <Navigate to='/admin' replace /> : children
}

const ProtectedUserRoute = ({children}) => {
  const {authLoading, user, setShowLogin} = useAppContext()

  useEffect(()=>{
    if(!authLoading && !user){
      setShowLogin(true)
    }
  }, [authLoading, setShowLogin, user])

  if(authLoading){
    return null
  }

  if(user?.role === 'admin'){
    return <Navigate to='/admin' replace />
  }

  return user?.role === 'user' ? children : <Navigate to='/' replace />
}

const App = () => {

  const {showLogin} = useAppContext()
  const isAdminPath = useLocation().pathname.startsWith('/admin')

  return (
    <>
     <Toaster />
      {showLogin && <Login/>}

      {!isAdminPath && <Navbar/>}

    <Routes>
      <Route path='/' element={<Home/>}/>
      <Route path='/car-details/:id' element={<CarDetails/>}/>
      <Route path='/checkout/:id' element={<Checkout/>}/>
      <Route path='/booking-success/:id' element={<ProtectedUserRoute><BookingSuccess/></ProtectedUserRoute>}/>
      <Route path='/cars' element={<Cars/>}/>
      <Route path='/my-bookings' element={<CustomerOnlyRoute><MyBookings/></CustomerOnlyRoute>}/>
      <Route path='/profile' element={<ProtectedUserRoute><Profile/></ProtectedUserRoute>}/>
      <Route path='/saved-cars' element={<ProtectedUserRoute><SavedCars/></ProtectedUserRoute>}/>
      <Route path='/admin' element={<ProtectedAdminRoute><Layout /></ProtectedAdminRoute>}>
        <Route index element={<Dashboard />}/>
        <Route path="add-car" element={<AddCar />}/>
        <Route path="manage-cars" element={<ManageCars />}/>
        <Route path="manage-bookings" element={<ManageBookings />}/>
      </Route>
    </Routes>

    {!isAdminPath && <Footer />}
    
    </>
  )
}

export default App
