import User from "../models/User.js"
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import Car from "../models/Car.js";
import Review from "../models/Review.js";
import imagekit from "../configs/imageKit.js";
import fs from "fs";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const escapeRegex = (value)=> value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const isValidPhone = (phone)=>{
    const phoneDigits = phone.replace(/\D/g, '')
    return phoneDigits.length >= 7 && phoneDigits.length <= 15
}

// Generate JWT Token
const generateToken = (userId)=>{
    return jwt.sign({userId}, process.env.JWT_SECRET, {expiresIn: "7d"})
}

// Register User
export const registerUser = async (req, res)=>{
    try {
        const {name, email, phone, password} = req.body
        const trimmedName = name?.trim()
        const trimmedEmail = email?.trim().toLowerCase()
        const trimmedPhone = phone?.trim()
        const trimmedPassword = password?.trim()

        if(!trimmedName || !trimmedEmail || !trimmedPhone || !trimmedPassword){
            return res.json({success: false, message: 'Please fill in all required fields.'})
        }

        if(!emailRegex.test(trimmedEmail)){
            return res.json({success: false, message: 'Please enter a valid email address.'})
        }

        if(!isValidPhone(trimmedPhone)){
            return res.json({success: false, message: 'Please enter a valid phone number.'})
        }

        if(trimmedPassword.length < 8){
            return res.json({success: false, message: 'Password must be at least 8 characters long.'})
        }

        const userExists = await User.findOne({email: {$regex: `^${escapeRegex(trimmedEmail)}$`, $options: 'i'}})
        if(userExists){
            return res.json({success: false, message: 'An account with this email already exists.'})
        }

        const hashedPassword = await bcrypt.hash(trimmedPassword, 10)
        const user = await User.create({name: trimmedName, email: trimmedEmail, phone: trimmedPhone, password: hashedPassword})
        const token = generateToken(user._id.toString())
        res.json({success: true, token})

    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message})
    }
}

// Login User 
export const loginUser = async (req, res)=>{
    try {
        const {email, password} = req.body
        const trimmedEmail = email?.trim().toLowerCase()
        const user = await User.findOne({email: {$regex: `^${escapeRegex(trimmedEmail || '')}$`, $options: 'i'}})
        if(!user){
            return res.json({success: false, message: "User not found" })
        }
        const isMatch = await bcrypt.compare(password, user.password)
        if(!isMatch){
            return res.json({success: false, message: "Invalid Credentials" })
        }
        const token = generateToken(user._id.toString())
        res.json({success: true, token})
    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message})
    }
}

// Get User data using Token (JWT)
export const getUserData = async (req, res) =>{
    try {
        const {user} = req;
        res.json({success: true, user})
    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message})
    }
}

// Get current user profile
export const getUserProfile = async (req, res)=>{
    try {
        const {user} = req;
        if(user.role === "admin"){
            return res.status(403).json({success: false, message: "Unauthorized"})
        }

        res.json({
            success: true,
            user: {
                name: user.name,
                email: user.email,
                phone: user.phone || '',
                image: user.image || '',
                role: user.role,
            }
        })
    } catch (error) {
        console.log(error.message);
        res.status(400).json({success: false, message: "Unable to load profile. Please try again."})
    }
}

// Update current user profile
export const updateUserProfile = async (req, res)=>{
    try {
        const {_id} = req.user;
        if(req.user.role === "admin"){
            return res.status(403).json({success: false, message: "Unauthorized"})
        }

        const {name, email, phone = ''} = req.body;
        const trimmedName = name?.trim();
        const trimmedEmail = email?.trim().toLowerCase();
        const trimmedPhone = phone?.trim();

        if(!trimmedName || !trimmedEmail){
            return res.status(400).json({success: false, message: "Please fill in all required fields."})
        }

        if(!emailRegex.test(trimmedEmail)){
            return res.status(400).json({success: false, message: "Please enter a valid email address."})
        }

        if(trimmedPhone && !isValidPhone(trimmedPhone)){
            return res.status(400).json({success: false, message: "Please enter a valid phone number."})
        }

        const emailExists = await User.findOne({
            email: {$regex: `^${escapeRegex(trimmedEmail)}$`, $options: 'i'},
            _id: {$ne: _id}
        })
        if(emailExists){
            return res.status(400).json({success: false, message: "Email is already in use."})
        }

        const updatedProfile = {
            name: trimmedName,
            email: trimmedEmail,
            phone: trimmedPhone,
        }

        if(req.file){
            const fileBuffer = fs.readFileSync(req.file.path)
            const response = await imagekit.upload({
                file: fileBuffer,
                fileName: req.file.originalname,
                folder: '/users'
            })

            updatedProfile.image = imagekit.url({
                path : response.filePath,
                transformation : [
                    {width: '400'},
                    {quality: 'auto'},
                    { format: 'webp' }
                ]
            });
        }

        const user = await User.findByIdAndUpdate(_id, updatedProfile, {new: true, runValidators: true}).select("-password")
        res.json({success: true, message: "Profile updated", user})
    } catch (error) {
        console.log(error.message);
        res.status(400).json({success: false, message: "Unable to update profile. Please try again."})
    }
}

// Get saved cars for current user
export const getSavedCars = async (req, res)=>{
    try {
        if(req.user.role === "admin"){
            return res.status(403).json({success: false, message: "Admin accounts cannot save cars."})
        }

        const user = await User.findById(req.user._id)
            .populate({
                path: 'savedCars',
                select: 'brand model image year category seating_capacity fuel_type transmission pricePerDay location isAvaliable'
            })
            .select('savedCars')

        res.json({success: true, savedCars: user?.savedCars || []})
    } catch (error) {
        console.log(error.message);
        res.status(400).json({success: false, message: "Unable to load saved cars. Please try again."})
    }
}

// Toggle saved car for current user
export const toggleSavedCar = async (req, res)=>{
    try {
        if(req.user.role === "admin"){
            return res.status(403).json({success: false, message: "Admin accounts cannot save cars."})
        }

        const {carId} = req.body
        if(!carId){
            return res.status(400).json({success: false, message: "Car id is required."})
        }

        const car = await Car.findById(carId).select('_id')
        if(!car){
            return res.status(404).json({success: false, message: "Car not found."})
        }

        const user = await User.findById(req.user._id)
        const savedCars = user.savedCars || []
        const isSaved = savedCars.some(savedCarId => savedCarId.toString() === carId)

        if(isSaved){
            user.savedCars = savedCars.filter(savedCarId => savedCarId.toString() !== carId)
        }else{
            user.savedCars = [...savedCars, car._id]
        }

        await user.save()

        res.json({
            success: true,
            message: isSaved ? "Car removed from saved cars." : "Car saved.",
            savedCarIds: user.savedCars.map(savedCarId => savedCarId.toString())
        })
    } catch (error) {
        console.log(error.message);
        res.status(400).json({success: false, message: "Unable to update saved cars. Please try again."})
    }
}

// Get All Cars for the Frontend
export const getCars = async (req, res) =>{
    try {
        const cars = await Car.find({isAvaliable: true})
        const reviewStats = await Review.aggregate([
            {$match: {car: {$in: cars.map(car => car._id)}}},
            {$group: {_id: "$car", averageRating: {$avg: "$rating"}, reviewCount: {$sum: 1}}},
        ])
        const statsByCar = reviewStats.reduce((acc, item)=>{
            acc[item._id.toString()] = {
                averageRating: Number(item.averageRating.toFixed(1)),
                reviewCount: item.reviewCount,
            }
            return acc
        }, {})

        const carsWithRatings = cars.map((car)=>{
            const carObject = car.toObject()
            return {
                ...carObject,
                averageRating: statsByCar[car._id.toString()]?.averageRating || 0,
                reviewCount: statsByCar[car._id.toString()]?.reviewCount || 0,
            }
        })

        res.json({success: true, cars: carsWithRatings})
    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message})
    }
}
