import express from "express";
import { addBookingMessage, cancelBooking, changeBookingStatus, checkAvailabilityOfCar, createBooking, deleteBookingMessage, editBookingMessage, getAdminBookings, getBookingById, getBookingConversation, getUnavailableDates, getUserBookings, toggleBookingMessageReaction, updateBookingDetails } from "../controllers/bookingController.js";
import { protect, requireAdmin } from "../middleware/auth.js";
import upload from "../middleware/multer.js";

const bookingRouter = express.Router();

bookingRouter.post('/check-availability', checkAvailabilityOfCar)
bookingRouter.get('/unavailable/:carId', getUnavailableDates)
bookingRouter.post('/create', protect, createBooking)
bookingRouter.get('/user', protect, getUserBookings)
bookingRouter.post('/cancel', protect, cancelBooking)
bookingRouter.post('/update-details', protect, updateBookingDetails)
bookingRouter.get('/conversation/:bookingId', protect, getBookingConversation)
bookingRouter.post('/message', protect, upload.single("attachment"), addBookingMessage)
bookingRouter.post('/message/edit', protect, editBookingMessage)
bookingRouter.post('/message/delete', protect, deleteBookingMessage)
bookingRouter.post('/message/reaction', protect, toggleBookingMessageReaction)
bookingRouter.get('/admin', protect, requireAdmin, getAdminBookings)
bookingRouter.post('/change-status', protect, requireAdmin, changeBookingStatus)
bookingRouter.get('/:id', protect, getBookingById)

export default bookingRouter;
