import express from "express";
import { protect, requireAdmin } from "../middleware/auth.js";
import { addCar, deleteCar, getAdminCars, getCarAvailability, getDashboardData, toggleCarAvailability, updateCar, updateCarUnavailableDates, updateUserImage } from "../controllers/adminController.js";
import upload from "../middleware/multer.js";

const adminRouter = express.Router();

adminRouter.post("/add-car", protect, requireAdmin, upload.single("image"), addCar)
adminRouter.get("/cars", protect, requireAdmin, getAdminCars)
adminRouter.get("/car-availability/:carId", protect, requireAdmin, getCarAvailability)
adminRouter.post("/car-unavailable-dates", protect, requireAdmin, updateCarUnavailableDates)
adminRouter.post("/update-car", protect, requireAdmin, upload.single("image"), updateCar)
adminRouter.post("/toggle-car", protect, requireAdmin, toggleCarAvailability)
adminRouter.post("/delete-car", protect, requireAdmin, deleteCar)

adminRouter.get('/dashboard', protect, requireAdmin, getDashboardData)
adminRouter.post('/update-image', protect, requireAdmin, upload.single("image"), updateUserImage)

export default adminRouter;
