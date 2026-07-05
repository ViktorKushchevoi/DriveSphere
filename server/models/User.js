import mongoose from "mongoose";
const {ObjectId} = mongoose.Schema.Types

const userSchema = new mongoose.Schema({
    name: {type: String, required: true, trim: true},
    email: {type: String, required: true, unique: true, lowercase: true, trim: true },
    password: {type: String, required: true },
    role: {type: String, enum: ["admin", "user"], default: 'user' },
    image: {type: String, default: ''},
    phone: {type: String, default: '', trim: true},
    savedCars: [{type: ObjectId, ref: 'Car'}],
},{timestamps: true})

const User = mongoose.model('User', userSchema)

export default User
