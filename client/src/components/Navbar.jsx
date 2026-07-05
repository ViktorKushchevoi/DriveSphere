import React, { useState } from 'react'
import { menuLinks } from '../assets/assets'
import {Link, useLocation, useNavigate} from 'react-router-dom'
import { useAppContext } from '../context/AppContext'

const Navbar = () => {

    const {
        setShowLogin,
        user,
        logout,
        isAdmin,
        setPickupDate,
        setReturnDate,
        notifications,
        notificationsLoading,
        markNotificationRead,
        markAllNotificationsRead,
        fetchNotifications,
    } = useAppContext()

    const location = useLocation()
    const [open, setOpen] = useState(false)
    const [notificationsOpen, setNotificationsOpen] = useState(false)
    const navigate = useNavigate()
    const visibleMenuLinks = menuLinks.filter((link)=> link.path !== '/my-bookings' || (user?.role === 'user' && !isAdmin))
    const showNotifications = Boolean(user)
    const unreadCount = notifications.filter(notification => !notification.isRead).length
    const userInitial = user?.name?.charAt(0)?.toUpperCase() || 'U'

    const getUserImageSrc = ()=>{
        if(!user?.image) return ''
        const separator = user.image.includes('?') ? '&' : '?'
        const version = user.updatedAt || user._id || 'profile'
        return `${user.image}${separator}v=${encodeURIComponent(version)}`
    }

    const userImageSrc = getUserImageSrc()

    const formatNotificationDate = (value)=>{
        if(!value) return ''
        return new Date(value).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        })
    }

    const handleAdminAction = ()=>{
        setOpen(false)
        setNotificationsOpen(false)
        navigate('/admin')
    }

    const handleAuthAction = ()=>{
        setOpen(false)
        setNotificationsOpen(false)
        user ? logout() : setShowLogin(true)
    }

    const handleNavClick = (path)=>{
        setOpen(false)
        setNotificationsOpen(false)
        if(path === '/cars'){
            setPickupDate('')
            setReturnDate('')
        }
    }

    const handleNotificationsToggle = ()=>{
        setNotificationsOpen(prev => !prev)
        if(!notificationsOpen){
            fetchNotifications()
        }
    }

    const getNotificationBookingId = (notification)=>{
        if(!notification?.booking) return ''
        return typeof notification.booking === 'object' ? notification.booking._id : notification.booking
    }

    const handleNotificationClick = async (notification)=>{
        if(!notification.isRead){
            await markNotificationRead(notification._id)
        }
        const bookingId = getNotificationBookingId(notification)
        setNotificationsOpen(false)
        setOpen(false)
        if(user?.role === 'admin' || isAdmin){
            navigate(bookingId ? `/admin/manage-bookings?bookingId=${bookingId}` : '/admin/manage-bookings')
        }else{
            navigate(bookingId ? `/my-bookings?bookingId=${bookingId}` : '/my-bookings')
        }
    }

  return (
    <header className='sticky top-0 z-50 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl'>

        <div className='mx-auto flex h-18 max-w-7xl items-center justify-between gap-5 px-5 md:px-8'>
            <Link to='/' onClick={()=> setOpen(false)} className='group flex items-center gap-2.5'>
                <span className='relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-slate-950 text-xs font-bold text-white'>
                    <span className='absolute inset-x-0 top-0 h-1/2 bg-white/10'></span>
                    DS
                </span>
                <span className='leading-tight'>
                    <span className='block text-[17px] font-semibold tracking-wide text-slate-950 transition group-hover:text-primary'>DriveSphere</span>
                    <span className='hidden text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 sm:block'>Premium booking</span>
                </span>
            </Link>

            <nav className='hidden items-center gap-7 lg:flex'>
                {visibleMenuLinks.map((link)=> (
                    <Link key={link.path} to={link.path} onClick={()=> handleNavClick(link.path)} className={`relative py-2 text-sm font-semibold transition ${location.pathname === link.path ? 'text-slate-950 after:absolute after:inset-x-1 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-primary' : 'text-slate-500 hover:text-slate-950'}`}>
                        {link.name}
                    </Link>
                ))}
            </nav>

            <div className='hidden items-center gap-4 lg:flex'>
                {isAdmin && (
                    <button onClick={handleAdminAction} className='text-sm font-semibold text-primary transition hover:text-primary-dull'>
                        Admin Dashboard
                    </button>
                )}

                {user?.role === 'user' && !isAdmin && (
                    <Link to="/saved-cars" onClick={()=> setNotificationsOpen(false)} className={`text-sm font-semibold transition ${location.pathname === '/saved-cars' ? 'text-slate-950' : 'text-slate-500 hover:text-slate-950'}`}>
                        Saved Cars
                    </Link>
                )}

                {user?.role === 'user' && !isAdmin && (
                    <Link to="/profile" onClick={()=> setNotificationsOpen(false)} className={`text-sm font-semibold transition ${location.pathname === '/profile' ? 'text-slate-950' : 'text-slate-500 hover:text-slate-950'}`}>
                        Profile
                    </Link>
                )}

                {showNotifications && (
                    <div className='relative'>
                        <button
                            type="button"
                            onClick={handleNotificationsToggle}
                            className='relative cursor-pointer rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-primary hover:text-primary'
                        >
                            Notifications
                            {unreadCount > 0 && (
                                <span className='absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-white'>
                                    {unreadCount}
                                </span>
                            )}
                        </button>

                        {notificationsOpen && (
                            <div className='absolute right-0 top-12 w-96 max-w-[calc(100vw-2rem)] rounded-md border border-slate-200 bg-white p-4 shadow-2xl'>
                                <div className='flex items-center justify-between gap-4'>
                                    <p className='font-semibold text-slate-950'>Notifications</p>
                                    {notifications.length > 0 && (
                                        <button type="button" onClick={markAllNotificationsRead} className='text-xs font-semibold text-primary hover:text-primary-dull'>
                                            Mark all as read
                                        </button>
                                    )}
                                </div>

                                <div className='mt-3 max-h-80 overflow-y-auto'>
                                    {notificationsLoading ? (
                                        <p className='py-6 text-center text-sm text-slate-500'>Loading notifications...</p>
                                    ) : notifications.length > 0 ? (
                                        <div className='grid gap-2'>
                                            {notifications.map(notification => (
                                                <button
                                                    key={notification._id}
                                                    type="button"
                                                    onClick={()=> handleNotificationClick(notification)}
                                                    className={`rounded-md border p-3 text-left transition ${notification.isRead ? 'border-slate-100 bg-white' : 'border-primary/20 bg-primary/5'}`}
                                                >
                                                    <div className='flex items-start justify-between gap-3'>
                                                        <p className='text-sm font-semibold text-slate-950'>{notification.title}</p>
                                                        {!notification.isRead && <span className='mt-1 h-2 w-2 shrink-0 rounded-full bg-primary'></span>}
                                                    </div>
                                                    <p className='mt-1 text-sm leading-5 text-slate-600'>{notification.message}</p>
                                                    <p className='mt-2 text-xs font-medium text-slate-400'>{formatNotificationDate(notification.createdAt)}</p>
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className='py-6 text-center text-sm text-slate-500'>No notifications yet.</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {user && (
                    <div className='flex items-center gap-2.5 border-l border-slate-200 pl-4'>
                        {userImageSrc ? (
                            <img src={userImageSrc} alt="" className='h-8 w-8 rounded-full object-cover ring-1 ring-slate-200'/>
                        ) : (
                            <span className='flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700'>
                                {userInitial}
                            </span>
                        )}
                        <p className='max-w-28 truncate text-sm font-semibold text-slate-800'>{user.name}</p>
                    </div>
                )}

                <button onClick={handleAuthAction} className={`cursor-pointer rounded-md px-4 py-2 text-sm font-semibold transition ${user ? 'text-slate-500 hover:text-slate-950' : 'bg-slate-950 text-white hover:bg-primary-dull'}`}>
                    {user ? 'Logout' : 'Login'}
                </button>
            </div>

            <button className='rounded-md border border-slate-200 bg-white p-2.5 lg:hidden' aria-label={open ? 'Close menu' : 'Open menu'} onClick={()=> setOpen(!open)}>
                <span className={`block h-0.5 w-5 bg-slate-900 transition ${open ? 'translate-y-1 rotate-45' : ''}`}></span>
                <span className={`mt-1.5 block h-0.5 w-5 bg-slate-900 transition ${open ? '-translate-y-1 -rotate-45' : ''}`}></span>
            </button>
        </div>

        <div className={`border-t border-slate-200/80 bg-white px-5 py-4 shadow-xl lg:hidden ${open ? 'block' : 'hidden'}`}>
            <div className='mx-auto max-w-7xl'>
                <div className='grid gap-2'>
                    {visibleMenuLinks.map((link)=> (
                        <Link key={link.path} to={link.path} onClick={()=> handleNavClick(link.path)} className={`rounded-md px-3 py-3 text-sm font-semibold transition ${location.pathname === link.path ? 'bg-slate-100 text-slate-950' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-950'}`}>
                            {link.name}
                        </Link>
                    ))}
                    {isAdmin && (
                        <button onClick={handleAdminAction} className='rounded-md px-3 py-3 text-left text-sm font-semibold text-primary transition hover:bg-primary/10'>
                            Admin Dashboard
                        </button>
                    )}
                    {user?.role === 'user' && !isAdmin && (
                        <Link to="/saved-cars" onClick={()=> handleNavClick('/saved-cars')} className={`rounded-md px-3 py-3 text-sm font-semibold transition ${location.pathname === '/saved-cars' ? 'bg-slate-100 text-slate-950' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-950'}`}>
                            Saved Cars
                        </Link>
                    )}
                    {user?.role === 'user' && !isAdmin && (
                        <Link to="/profile" onClick={()=> handleNavClick('/profile')} className={`rounded-md px-3 py-3 text-sm font-semibold transition ${location.pathname === '/profile' ? 'bg-slate-100 text-slate-950' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-950'}`}>
                            Profile
                        </Link>
                    )}
                    {showNotifications && (
                        <button onClick={handleNotificationsToggle} className='flex items-center justify-between rounded-md px-3 py-3 text-left text-sm font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-slate-950'>
                            <span>Notifications</span>
                            {unreadCount > 0 && <span className='rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-white'>{unreadCount}</span>}
                        </button>
                    )}
                </div>

                {showNotifications && notificationsOpen && (
                    <div className='mt-3 rounded-md border border-slate-200 bg-slate-50 p-3'>
                        <div className='flex items-center justify-between gap-3'>
                            <p className='text-sm font-semibold text-slate-950'>Notifications</p>
                            {notifications.length > 0 && (
                                <button type="button" onClick={markAllNotificationsRead} className='text-xs font-semibold text-primary'>
                                    Mark all as read
                                </button>
                            )}
                        </div>
                        <div className='mt-3 grid max-h-72 gap-2 overflow-y-auto'>
                            {notificationsLoading ? (
                                <p className='py-4 text-center text-sm text-slate-500'>Loading notifications...</p>
                            ) : notifications.length > 0 ? (
                                notifications.map(notification => (
                                    <button
                                        key={notification._id}
                                        type="button"
                                        onClick={()=> handleNotificationClick(notification)}
                                        className={`rounded-md border p-3 text-left ${notification.isRead ? 'border-slate-100 bg-white' : 'border-primary/20 bg-white'}`}
                                    >
                                        <p className='text-sm font-semibold text-slate-950'>{notification.title}</p>
                                        <p className='mt-1 text-sm text-slate-600'>{notification.message}</p>
                                        <p className='mt-2 text-xs font-medium text-slate-400'>{formatNotificationDate(notification.createdAt)}</p>
                                    </button>
                                ))
                            ) : (
                                <p className='py-4 text-center text-sm text-slate-500'>No notifications yet.</p>
                            )}
                        </div>
                    </div>
                )}

                <div className='mt-4 border-t border-slate-200 pt-4'>
                    {user ? (
                        <div className='mb-4 flex items-center gap-3'>
                            {userImageSrc ? (
                                <img src={userImageSrc} alt="" className='h-9 w-9 rounded-full object-cover ring-1 ring-slate-200'/>
                            ) : (
                                <span className='flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700'>
                                    {userInitial}
                                </span>
                            )}
                            <div>
                                <p className='font-semibold text-slate-950'>{user.name}</p>
                                <p className='text-sm text-slate-500'>{isAdmin ? 'Admin access' : 'Booking member'}</p>
                            </div>
                        </div>
                    ) : (
                        <p className='mb-4 text-sm leading-6 text-slate-500'>Sign in to manage your bookings.</p>
                    )}
                    <button onClick={handleAuthAction} className='w-full cursor-pointer rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-dull'>
                        {user ? 'Logout' : 'Login'}
                    </button>
                </div>
            </div>
        </div>
    </header>
  )
}

export default Navbar
