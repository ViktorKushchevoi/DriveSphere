import Booking from "../models/Booking.js";
import Car from "../models/Car.js";
import Review from "../models/Review.js";
import mongoose from "mongoose";

const getReviewStats = async (carId)=>{
    const carObjectId = typeof carId === "string" ? new mongoose.Types.ObjectId(carId) : carId;
    const stats = await Review.aggregate([
        {$match: {car: carObjectId}},
        {$group: {_id: "$car", averageRating: {$avg: "$rating"}, reviewCount: {$sum: 1}}},
    ]);

    return {
        averageRating: stats[0] ? Number(stats[0].averageRating.toFixed(1)) : 0,
        reviewCount: stats[0]?.reviewCount || 0,
    };
}

const validateReviewInput = ({rating, comment})=>{
    const numericRating = Number(rating);
    const trimmedComment = comment?.trim() || "";

    if(!numericRating){
        return {success: false, message: "Please select a rating."};
    }

    if(!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5){
        return {success: false, message: "Please select a rating."};
    }

    return {success: true, rating: numericRating, comment: trimmedComment};
}

const getEligibleBooking = async (userId, carId)=>{
    return Booking.findOne({
        user: userId,
        car: carId,
        status: "confirmed",
    }).sort({createdAt: -1});
}

export const getCarReviews = async (req, res)=>{
    try {
        const {carId} = req.params;
        const reviews = await Review.find({car: carId})
            .populate("user", "name image")
            .sort({createdAt: -1});
        const stats = await getReviewStats(carId);

        res.json({success: true, reviews, ...stats});
    } catch (error) {
        console.log(error.message);
        res.status(400).json({success: false, message: "Unable to load reviews. Please try again."});
    }
}

export const getReviewEligibility = async (req, res)=>{
    try {
        const {carId} = req.params;

        if(req.user.role !== "user"){
            return res.json({success: true, canReview: false, reason: "Only customer accounts can leave reviews.", existingReview: null});
        }

        const existingReview = await Review.findOne({user: req.user._id, car: carId});
        if(existingReview){
            return res.json({success: true, canReview: false, reason: "You have already reviewed this car.", existingReview});
        }

        const booking = await getEligibleBooking(req.user._id, carId);
        if(!booking){
            return res.json({success: true, canReview: false, reason: "Only customers who booked this car can leave a review.", existingReview: null});
        }

        res.json({success: true, canReview: true, reason: "", existingReview: null});
    } catch (error) {
        console.log(error.message);
        res.status(400).json({success: false, message: "Unable to check review eligibility. Please try again."});
    }
}

export const getMyReviewedCars = async (req, res)=>{
    try {
        if(req.user.role !== "user"){
            return res.json({success: true, reviewedCarIds: []});
        }

        const reviews = await Review.find({user: req.user._id}).select("car");
        res.json({success: true, reviewedCarIds: reviews.map(review => review.car.toString())});
    } catch (error) {
        console.log(error.message);
        res.status(400).json({success: false, message: "Unable to load reviewed cars. Please try again."});
    }
}

export const createReview = async (req, res)=>{
    try {
        if(req.user.role !== "user"){
            return res.status(403).json({success: false, message: "Only customer accounts can leave reviews."});
        }

        const {carId, rating, comment} = req.body;
        const validation = validateReviewInput({rating, comment});
        if(!validation.success){
            return res.status(400).json(validation);
        }

        const car = await Car.findById(carId).select("_id");
        if(!car){
            return res.status(404).json({success: false, message: "Car not found."});
        }

        const existingReview = await Review.findOne({user: req.user._id, car: carId});
        if(existingReview){
            return res.status(400).json({success: false, message: "You have already reviewed this car."});
        }

        const booking = await getEligibleBooking(req.user._id, carId);
        if(!booking){
            return res.status(403).json({success: false, message: "You can review only cars you have booked."});
        }

        const review = await Review.create({
            user: req.user._id,
            car: carId,
            booking: booking._id,
            rating: validation.rating,
            comment: validation.comment,
        });

        await review.populate("user", "name image");
        const stats = await getReviewStats(carId);
        res.json({success: true, message: "Review submitted.", review, ...stats});
    } catch (error) {
        console.log(error.message);
        if(error.code === 11000){
            return res.status(400).json({success: false, message: "You have already reviewed this car."});
        }
        res.status(400).json({success: false, message: "Unable to submit review. Please try again."});
    }
}

export const updateReview = async (req, res)=>{
    try {
        if(req.user.role !== "user"){
            return res.status(403).json({success: false, message: "Only customer accounts can update reviews."});
        }

        const {reviewId, rating, comment} = req.body;
        const validation = validateReviewInput({rating, comment});
        if(!validation.success){
            return res.status(400).json(validation);
        }

        const review = await Review.findOneAndUpdate(
            {_id: reviewId, user: req.user._id},
            {rating: validation.rating, comment: validation.comment},
            {new: true, runValidators: true}
        ).populate("user", "name image");

        if(!review){
            return res.status(404).json({success: false, message: "Review not found."});
        }

        const stats = await getReviewStats(review.car);
        res.json({success: true, message: "Review updated.", review, ...stats});
    } catch (error) {
        console.log(error.message);
        res.status(400).json({success: false, message: "Unable to update review. Please try again."});
    }
}
