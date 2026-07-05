import mongoose from "mongoose";

const {ObjectId} = mongoose.Schema.Types;

const notificationSchema = new mongoose.Schema({
    user: {type: ObjectId, ref: "User", required: true},
    booking: {type: ObjectId, ref: "Booking", required: true},
    type: {type: String, default: "booking_status_updated", trim: true},
    title: {type: String, required: true, trim: true},
    message: {type: String, required: true, trim: true},
    isRead: {type: Boolean, default: false},
}, {timestamps: true});

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
