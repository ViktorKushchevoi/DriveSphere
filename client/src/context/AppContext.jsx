import { createContext, useContext, useEffect, useState } from "react";
import axios from 'axios'
import {toast} from 'react-hot-toast'
import { useNavigate } from "react-router-dom";

const configuredBaseURL = import.meta.env.VITE_BASE_URL || import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL
const isInvalidLocalPort = (url)=> /^https?:\/\/(localhost|127\.0\.0\.1):9(\/|$)/i.test(String(url || ''))
axios.defaults.baseURL = configuredBaseURL && !isInvalidLocalPort(configuredBaseURL) ? configuredBaseURL : 'http://localhost:3000'

export const AppContext = createContext();

export const AppProvider = ({ children })=>{

    const navigate = useNavigate()
    const currency = import.meta.env.VITE_CURRENCY

    const [token, setToken] = useState(null)
    const [user, setUser] = useState(null)
    const [isAdmin, setIsAdmin] = useState(false)
    const [authLoading, setAuthLoading] = useState(true)
    const [showLogin, setShowLogin] = useState(false)
    const [pickupDate, setPickupDate] = useState('')
    const [returnDate, setReturnDate] = useState('')

    const [cars, setCars] = useState([])
    const [carsLoading, setCarsLoading] = useState(false)
    const [notifications, setNotifications] = useState([])
    const [notificationsLoading, setNotificationsLoading] = useState(false)
    const [savedCarIds, setSavedCarIds] = useState([])
    const [savedCarsLoading, setSavedCarsLoading] = useState(false)

    // Function to check if user is logged in
    const fetchUser = async ()=>{
        try {
           const {data} = await axios.get('/api/user/data')
           if (data.success) {
            setUser(data.user)
            setIsAdmin(data.user.role === 'admin')
            return data.user
           }else{
            localStorage.removeItem('token')
            setToken(null)
            setUser(null)
            setIsAdmin(false)
            setSavedCarIds([])
            axios.defaults.headers.common['Authorization'] = ''
           }
        } catch (error) {
            localStorage.removeItem('token')
            setToken(null)
            setUser(null)
            setIsAdmin(false)
            setSavedCarIds([])
            axios.defaults.headers.common['Authorization'] = ''
            toast.error(error.response?.data?.message || error.message)
        } finally {
            setAuthLoading(false)
        }
        return null
    }
    // Function to fetch all cars from the server

    const fetchCars = async () =>{
        try {
            setCarsLoading(true)
            const {data} = await axios.get('/api/user/cars')
            data.success ? setCars(data.cars) : toast.error(data.message)
        } catch (error) {
            toast.error(error.message)
        } finally {
            setCarsLoading(false)
        }
    }

    const fetchNotifications = async ()=>{
        if(!token || !user){
            setNotifications([])
            return []
        }

        try {
            setNotificationsLoading(true)
            const {data} = await axios.get('/api/notifications')
            if(data.success){
                setNotifications(data.notifications)
                return data.notifications
            }
            toast.error(data.message || 'Unable to load notifications. Please try again.')
        } catch (error) {
            toast.error(error.response?.data?.message || 'Unable to load notifications. Please try again.')
        } finally {
            setNotificationsLoading(false)
        }
        return []
    }

    const fetchSavedCars = async ()=>{
        if(!token || user?.role !== 'user'){
            setSavedCarIds([])
            return []
        }

        try {
            setSavedCarsLoading(true)
            const {data} = await axios.get('/api/user/saved-cars')
            if(data.success){
                const savedCars = data.savedCars || []
                setSavedCarIds(savedCars.map(car => car._id))
                return savedCars
            }
            toast.error(data.message || 'Unable to load saved cars. Please try again.')
        } catch (error) {
            toast.error(error.response?.data?.message || 'Unable to load saved cars. Please try again.')
        } finally {
            setSavedCarsLoading(false)
        }
        return []
    }

    const toggleSavedCar = async (carId)=>{
        if(!token || user?.role !== 'user'){
            toast.error('Please log in to save cars.')
            setShowLogin(true)
            return null
        }

        try {
            const {data} = await axios.post('/api/user/toggle-saved-car', {carId})
            if(data.success){
                setSavedCarIds(data.savedCarIds || [])
                toast.success(data.message)
                return data.savedCarIds || []
            }
            toast.error(data.message || 'Unable to update saved cars. Please try again.')
        } catch (error) {
            toast.error(error.response?.data?.message || 'Unable to update saved cars. Please try again.')
        }
        return null
    }

    const isCarSaved = (carId)=> savedCarIds.includes(carId)

    const markNotificationRead = async (notificationId)=>{
        try {
            const {data} = await axios.post('/api/notifications/mark-read', {notificationId})
            if(data.success){
                setNotifications(prev => prev.map(notification => notification._id === data.notification._id ? data.notification : notification))
            }else{
                toast.error(data.message || 'Unable to update notification. Please try again.')
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Unable to update notification. Please try again.')
        }
    }

    const markAllNotificationsRead = async ()=>{
        try {
            const {data} = await axios.post('/api/notifications/mark-all-read')
            if(data.success){
                setNotifications(prev => prev.map(notification => ({...notification, isRead: true})))
            }else{
                toast.error(data.message || 'Unable to update notifications. Please try again.')
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Unable to update notifications. Please try again.')
        }
    }

    // Function to log out the user
    const logout = ()=>{
        localStorage.removeItem('token')
        setToken(null)
        setUser(null)
        setIsAdmin(false)
        setNotifications([])
        setSavedCarIds([])
        axios.defaults.headers.common['Authorization'] = ''
        toast.success('You have been logged out')
    }


    // useEffect to retrieve the token from localStorage
    useEffect(()=>{
        const token = localStorage.getItem('token')
        if(token){
            setToken(token)
        }else{
            setUser(null)
            setIsAdmin(false)
            axios.defaults.headers.common['Authorization'] = ''
            setAuthLoading(false)
        }
        fetchCars()
    },[])

    // useEffect to fetch user data when token is available
    useEffect(()=>{
        if(token){
            axios.defaults.headers.common['Authorization'] = `${token}`
            fetchUser()
        }else{
            setUser(null)
            setIsAdmin(false)
            setSavedCarIds([])
        }
    },[token])

    useEffect(()=>{
        if(token && user){
            fetchNotifications()
            const intervalId = setInterval(fetchNotifications, 30000)
            return ()=> clearInterval(intervalId)
        }else{
            setNotifications([])
        }
    },[token, user?.role])

    useEffect(()=>{
        if(token && user?.role === 'user'){
            fetchSavedCars()
        }else{
            setSavedCarIds([])
        }
    },[token, user?.role])

    const value = {
        navigate, currency, axios, user, setUser,
        token, setToken, isAdmin, authLoading, fetchUser, showLogin, setShowLogin, logout, fetchCars, cars, setCars, carsLoading,
        pickupDate, setPickupDate, returnDate, setReturnDate,
        notifications, notificationsLoading, fetchNotifications, markNotificationRead, markAllNotificationsRead,
        savedCarIds, savedCarsLoading, fetchSavedCars, toggleSavedCar, isCarSaved
    }

    return (
    <AppContext.Provider value={value}>
        { children }
    </AppContext.Provider>
    )
}

export const useAppContext = ()=>{
    return useContext(AppContext)
}
