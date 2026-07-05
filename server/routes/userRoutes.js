import express from "express";
import { getCars, getSavedCars, getUserData, getUserProfile, loginUser, registerUser, toggleSavedCar, updateUserProfile } from "../controllers/userController.js";
import { protect } from "../middleware/auth.js";
import upload from "../middleware/multer.js";

const userRouter = express.Router();

userRouter.post('/register', registerUser)
userRouter.post('/login', loginUser)
userRouter.get('/data', protect, getUserData)
userRouter.get('/profile', protect, getUserProfile)
userRouter.post('/update-profile', protect, upload.single("image"), updateUserProfile)
userRouter.get('/saved-cars', protect, getSavedCars)
userRouter.post('/toggle-saved-car', protect, toggleSavedCar)
userRouter.get('/cars', getCars)

export default userRouter;
