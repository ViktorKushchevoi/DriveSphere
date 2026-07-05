import imagekit from "../configs/imageKit.js";
import Booking from "../models/Booking.js";
import Car from "../models/Car.js";
import User from "../models/User.js";
import fs from "fs";

const requiredCarFields = [
    "brand",
    "model",
    "year",
    "category",
    "seating_capacity",
    "fuel_type",
    "transmission",
    "pricePerDay",
    "location",
    "description",
]

const uploadCarImage = async (imageFile)=>{
    if(!imageFile){
        throw new Error("Image upload failed. Please try again.")
    }

    try {
        const fileBuffer = fs.readFileSync(imageFile.path)
        const response = await imagekit.upload({
            file: fileBuffer,
            fileName: imageFile.originalname,
            folder: '/cars'
        })

        return imagekit.url({
            path : response.filePath,
            transformation : [
                {width: '1280'},
                {quality: 'auto'},
                { format: 'webp' }
            ]
        });
    } catch (error) {
        console.log("ImageKit upload failed:", error.message);
        throw new Error("Image upload failed. Please try again.")
    } finally {
        if(imageFile?.path && fs.existsSync(imageFile.path)){
            fs.unlinkSync(imageFile.path)
        }
    }
}

const validateCarData = (car)=>{
    const missingField = requiredCarFields.find((field)=> car[field] === undefined || car[field] === null || String(car[field]).trim() === "")
    if(missingField){
        return {success: false, message: "Please fill in all required car fields"}
    }

    if(Number(car.year) <= 0 || Number(car.seating_capacity) <= 0 || Number(car.pricePerDay) <= 0){
        return {success: false, message: "Year, seats, and price must be valid positive numbers"}
    }

    return {success: true}
}

const parseCarData = (body)=>{
    if(body.carData){
        return typeof body.carData === "string" ? JSON.parse(body.carData) : body.carData;
    }

    const car = {};
    requiredCarFields.forEach((field)=>{
        if(body[field] !== undefined){
            car[field] = body[field];
        }
    })

    if(body.isAvaliable !== undefined){
        car.isAvaliable = body.isAvaliable;
    }

    return car;
}

const dateKeyPattern = /^\d{4}-\d{2}-\d{2}$/;

const normalizeManualUnavailableDates = (dates = [])=>{
    if(!Array.isArray(dates)){
        return null;
    }

    const uniqueDates = [...new Set(dates.map((date)=> String(date || "").trim()).filter(Boolean))];
    const hasInvalidDate = uniqueDates.some((date)=>{
        if(!dateKeyPattern.test(date)) return true;
        const [year, month, day] = date.split("-").map(Number);
        const parsedDate = new Date(Date.UTC(year, month - 1, day));
        return Number.isNaN(parsedDate.getTime())
            || parsedDate.getUTCFullYear() !== year
            || parsedDate.getUTCMonth() !== month - 1
            || parsedDate.getUTCDate() !== day;
    });

    if(hasInvalidDate){
        return null;
    }

    return uniqueDates.sort();
}

// API to List Car

export const addCar = async (req, res)=>{
    try {
        const {_id} = req.user;
        let car = JSON.parse(req.body.carData);
        const imageFile = req.file;

        const validation = validateCarData(car)
        if(!validation.success){
            return res.status(400).json(validation)
        }

        // Upload Image to ImageKit
        const image = await uploadCarImage(imageFile);
        await Car.create({...car, owner: _id, image})

        res.json({success: true, message: "Car Added"})

    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message})
    }
}

// API to update admin car
export const updateCar = async (req, res)=>{
    try {
        const {_id} = req.user;
        const {carId} = req.body;
        const carData = parseCarData(req.body);
        const imageFile = req.file;

        if(!carId){
            return res.status(400).json({success: false, message: "Car ID is required"})
        }

        const validation = validateCarData(carData)
        if(!validation.success){
            return res.status(400).json(validation)
        }

        const car = await Car.findOne({_id: carId, owner: _id})
        if(!car){
            return res.status(404).json({success: false, message: "Car not found or you do not have permission to update it."})
        }

        const updatedCar = {
            brand: carData.brand,
            model: carData.model,
            year: Number(carData.year),
            category: carData.category,
            seating_capacity: Number(carData.seating_capacity),
            fuel_type: carData.fuel_type,
            transmission: carData.transmission,
            pricePerDay: Number(carData.pricePerDay),
            location: carData.location,
            description: carData.description,
            isAvaliable: carData.isAvaliable === true || carData.isAvaliable === "true",
        }

        if(imageFile){
            updatedCar.image = await uploadCarImage(imageFile)
        }

        await Car.findOneAndUpdate({_id: carId, owner: _id}, updatedCar, {new: true, runValidators: true})

        res.json({success: true, message: "Car Updated"})
    } catch (error) {
        console.log(error.message);
        res.status(400).json({success: false, message: error.message === "Image upload failed. Please try again." ? error.message : "Unable to add car. Please try again."})
    }
}

// API to list admin cars
export const getAdminCars = async (req, res)=>{
    try {
        const {_id} = req.user;
        const cars = await Car.find({owner: _id })
        res.json({success: true, cars})
    } catch (error) {
        console.log(error.message);
        res.status(400).json({success: false, message: error.message === "Image upload failed. Please try again." ? error.message : "Unable to update this car. Please try again."})
    }
}

// API to get confirmed unavailable ranges for one admin-owned car
export const getCarAvailability = async (req, res)=>{
    try {
        const {_id} = req.user;
        const {carId} = req.params;

        const car = await Car.findOne({_id: carId, owner: _id});
        if(!car){
            return res.status(404).json({success: false, message: "Car not found or you do not have permission to view it."})
        }

        const bookings = await Booking.find({
            car: carId,
            owner: _id,
            status: {$regex: /^confirmed$/i},
        })
            .select("pickupDate returnDate -_id")
            .sort({pickupDate: 1})

        const unavailableDates = bookings.map((booking)=>({
            pickupDate: booking.pickupDate.toISOString().split("T")[0],
            returnDate: booking.returnDate.toISOString().split("T")[0],
        }))

        res.json({
            success: true,
            unavailableDates,
            manualUnavailableDates: car.manualUnavailableDates || [],
        })
    } catch (error) {
        console.log(error.message);
        res.status(400).json({success: false, message: "Unable to load availability. Please try again."})
    }
}

// API to update manual unavailable dates for one admin-owned car
export const updateCarUnavailableDates = async (req, res)=>{
    try {
        const {_id} = req.user;
        const {carId, manualUnavailableDates = []} = req.body;

        if(!carId){
            return res.status(400).json({success: false, message: "Car ID is required"})
        }

        const normalizedDates = normalizeManualUnavailableDates(manualUnavailableDates);
        if(!normalizedDates){
            return res.status(400).json({success: false, message: "Please provide valid unavailable dates."})
        }

        const car = await Car.findOneAndUpdate(
            {_id: carId, owner: _id},
            {manualUnavailableDates: normalizedDates},
            {new: true, runValidators: true}
        )

        if(!car){
            return res.status(404).json({success: false, message: "Car not found or you do not have permission to update it."})
        }

        res.json({
            success: true,
            message: "Availability updated.",
            manualUnavailableDates: car.manualUnavailableDates || [],
            car,
        })
    } catch (error) {
        console.log(error.message);
        res.status(400).json({success: false, message: "Unable to update unavailable dates. Please try again."})
    }
}

// API to Toggle Car Availability
export const toggleCarAvailability = async (req, res) =>{
    try {
        const {_id} = req.user;
        const {carId} = req.body
        const car = await Car.findById(carId)

        // Checking is car belongs to the user
        if(car.owner.toString() !== _id.toString()){
            return res.json({ success: false, message: "Unauthorized" });
        }

        car.isAvaliable = !car.isAvaliable;
        await car.save()

        res.json({success: true, message: "Availability Toggled"})
    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message})
    }
}

// Api to delete a car
export const deleteCar = async (req, res) =>{
    try {
        const {_id} = req.user;
        const {carId} = req.body
        const car = await Car.findById(carId)

        // Checking is car belongs to the user
        if(car.owner.toString() !== _id.toString()){
            return res.json({ success: false, message: "Unauthorized" });
        }

        car.owner = null;
        car.isAvaliable = false;

        await car.save()

        res.json({success: true, message: "Car Removed"})
    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message})
    }
}

// API to get Dashboard Data
export const getDashboardData = async (req, res) =>{
    try {
        const { _id, role } = req.user;

        if(role !== 'admin'){
            return res.json({ success: false, message: "Unauthorized" });
        }

        const cars = await Car.find({owner: _id})
        const bookings = await Booking.find({ owner: _id }).populate('car').sort({ createdAt: -1 });

        const pendingBookings = await Booking.find({owner: _id, status: "pending" })
        const completedBookings = await Booking.find({owner: _id, status: "confirmed" })

        // Calculate monthlyRevenue from bookings where status is confirmed
        const monthlyRevenue = bookings.slice().filter(booking => booking.status === 'confirmed').reduce((acc, booking)=> acc + booking.price, 0)

        const dashboardData = {
            totalCars: cars.length,
            totalBookings: bookings.length,
            pendingBookings: pendingBookings.length,
            completedBookings: completedBookings.length,
            recentBookings: bookings.slice(0,3),
            monthlyRevenue
        }

        res.json({ success: true, dashboardData });

    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message})
    }
}

// API to update user image

export const updateUserImage = async (req, res)=>{
    try {
        const { _id } = req.user;

        const imageFile = req.file;
        if(!imageFile){
            return res.status(400).json({success: false, message: "Image upload failed. Please try again."})
        }

        // Upload Image to ImageKit
        const fileBuffer = fs.readFileSync(imageFile.path)
        const response = await imagekit.upload({
            file: fileBuffer,
            fileName: imageFile.originalname,
            folder: '/users'
        })

        // optimization through imagekit URL transformation
        var optimizedImageUrl = imagekit.url({
            path : response.filePath,
            transformation : [
                {width: '400'}, // Width resizing
                {quality: 'auto'}, // Auto compression
                { format: 'webp' }  // Convert to modern format
            ]
        });

        const image = optimizedImageUrl;

        await User.findByIdAndUpdate(_id, {image});
        res.json({success: true, message: "Image Updated" })

    } catch (error) {
        console.log(error.message);
        res.status(400).json({success: false, message: "Image upload failed. Please try again."})
    } finally {
        if(req.file?.path && fs.existsSync(req.file.path)){
            fs.unlinkSync(req.file.path)
        }
    }
}   
