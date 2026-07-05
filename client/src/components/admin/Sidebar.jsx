import React, { useState } from 'react'
import { adminMenuLinks } from '../../assets/assets'
import { NavLink } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';

const Sidebar = () => {

    const {user, axios, fetchUser} = useAppContext()
    const [image, setImage] = useState('')
    const profileImage = image ? URL.createObjectURL(image) : user?.image
    const adminInitial = user?.name?.charAt(0)?.toUpperCase() || 'A'

    const updateImage = async ()=>{
        try {
          const formData = new FormData()
          formData.append('image', image)

          const {data} = await axios.post('/api/admin/update-image', formData)

          if(data.success){
            fetchUser()
            toast.success(data.message)
            setImage('')
          }else{
            toast.error(data.message)
          }
        } catch (error) {
          toast.error(error.message)
        }
    }

  return (
    <aside className='sticky top-0 flex h-screen w-[76px] shrink-0 flex-col overflow-hidden bg-slate-950 text-sm text-white md:w-80'>
      <div className='border-b border-white/10 p-4 md:p-6'>
        <div className='flex items-center gap-3'>
          <span className='flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-emerald-600 text-base font-bold shadow-lg shadow-teal-950/40'>DS</span>
          <div className='hidden md:block'>
            <p className='text-lg font-semibold tracking-wide'>DriveSphere</p>
            <p className='text-xs text-slate-400'>Fleet operations suite</p>
          </div>
        </div>
      </div>

      <div className='hidden px-4 pt-5 md:block'>
        <div className='rounded-2xl border border-white/10 bg-white/[0.06] p-4 shadow-2xl shadow-black/20'>
          <label htmlFor="image" className='flex cursor-pointer items-center gap-3'>
            {profileImage ? (
              <img src={profileImage} alt="" className='h-14 w-14 rounded-xl object-cover ring-2 ring-white/10'/>
            ) : (
              <span className='flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/10 text-lg font-bold text-teal-100 ring-2 ring-white/10'>
                {adminInitial}
              </span>
            )}
            <div className='min-w-0'>
              <p className='truncate font-semibold'>{user?.name || 'Admin'}</p>
              <p className='mt-1 text-xs text-slate-400'>Workspace administrator</p>
            </div>
            <input type="file" id='image' accept="image/*" hidden onChange={e=> setImage(e.target.files[0])}/>
          </label>
          {image && (
            <button className='mt-4 w-full rounded-xl bg-primary px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dull' onClick={updateImage}>Save profile image</button>
          )}
        </div>
      </div>
      
      <nav className='mt-5 flex-1 px-3 md:px-4'>
        <p className='mb-3 hidden px-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 md:block'>Navigation</p>
        {adminMenuLinks.map((link)=>(
            <NavLink key={link.path} to={link.path} end={link.path === '/admin'} className={({isActive}) => `group relative mb-2 flex items-center gap-3 rounded-xl px-3 py-3 transition ${isActive ? 'bg-white text-slate-950 shadow-lg shadow-black/20' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}>
                {({isActive}) => (
                  <>
                    <span className={`absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full ${isActive ? 'bg-primary' : 'bg-transparent'}`}></span>
                    <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${isActive ? 'bg-slate-100' : 'bg-white/5 group-hover:bg-white/10'}`}>
                      <img src={isActive ? link.coloredIcon : link.icon} alt="" className='h-5 w-5' />
                    </span>
                    <span className='hidden font-medium md:inline'>{link.name}</span>
                  </>
                )}
            </NavLink>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar
