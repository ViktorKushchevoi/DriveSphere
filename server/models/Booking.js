import mongoose from "mongoose";
const {ObjectId} = mongoose.Schema.Types

const bookingSchema = new mongoose.Schema({
    bookingNumber: {type: String, unique: true, index: true, sparse: true},
    car: {type: ObjectId, ref: "Car", required: true},
    user: {type: ObjectId, ref: "User", required: true},
    owner: {type: ObjectId, ref: "User", required: true},
    pickupDate: {type: Date, required: true},
    returnDate: {type: Date, required: true},
    pickupTime: {type: String, default: "", trim: true},
    returnTime: {type: String, default: "", trim: true},
    contactName: {type: String, required: true, trim: true},
    contactEmail: {type: String, required: true, trim: true},
    contactPhone: {type: String, required: true, trim: true},
    deliveryCity: {type: String, default: "", trim: true},
    deliveryStreet: {type: String, default: "", trim: true},
    deliveryDetails: {type: String, default: "", trim: true},
    deliveryAddress: {type: String, required: true, trim: true},
    specialRequests: {type: String, default: "", trim: true},
    status: {type: String, enum: ["pending", "confirmed", "cancelled"], default: "pending"},
    price: {type: Number, required: true},
    conversation: [
        {
            sender: {type: ObjectId, ref: "User", required: true},
            senderRole: {type: String, enum: ["user", "admin"], required: true},
            message: {type: String, default: "", trim: true},
            attachments: [
                {
                    url: {type: String, default: ""},
                    type: {type: String, default: "image"},
                    fileName: {type: String, default: ""}
                }
            ],
            readBy: [{type: ObjectId, ref: "User"}],
            reaction: {
                user: {type: ObjectId, ref: "User", default: null},
                type: {type: String, default: "heart"},
                createdAt: {type: Date, default: null}
            },
            editedAt: {type: Date, default: null},
            isDeleted: {type: Boolean, default: false},
            createdAt: {type: Date, default: Date.now}
        }
    ]
},{timestamps: true})

const Booking = mongoose.model('Booking', bookingSchema)

export default Booking
