import React, { useEffect } from 'react'
import NavbarAdmin from '../../components/admin/NavbarAdmin'
import Sidebar from '../../components/admin/Sidebar'
import { Outlet } from 'react-router-dom'
import { useAppContext } from '../../context/AppContext'

const Layout = () => {
  const {isAdmin, navigate} = useAppContext()

  useEffect(()=>{
    if(!isAdmin){
      navigate('/')
    }
  },[isAdmin])
  return (
    <div className='min-h-screen bg-[#F4F7F6]'>
      <div className='flex'>
        <Sidebar />
        <div className='min-w-0 flex-1'>
          <NavbarAdmin />
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default Layout
