import mongoose from "mongoose";
const {ObjectId} = mongoose.Schema.Types;

const reviewSchema = new mongoose.Schema({
    user: {type: ObjectId, ref: "User", required: true},
    car: {type: ObjectId, ref: "Car", required: true},
    booking: {type: ObjectId, ref: "Booking"},
    rating: {type: Number, required: true, min: 1, max: 5},
    comment: {type: String, default: "", trim: true},
}, {timestamps: true});

reviewSchema.index({user: 1, car: 1}, {unique: true});

const Review = mongoose.model("Review", reviewSchema);

export default Review;
