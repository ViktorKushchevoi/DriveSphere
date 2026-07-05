import express from "express";
import { protect } from "../middleware/auth.js";
import { createReview, getCarReviews, getMyReviewedCars, getReviewEligibility, updateReview } from "../controllers/reviewController.js";

const reviewRouter = express.Router();

reviewRouter.get("/car/:carId", getCarReviews);
reviewRouter.get("/eligibility/:carId", protect, getReviewEligibility);
reviewRouter.get("/my-reviewed-cars", protect, getMyReviewedCars);
reviewRouter.post("/", protect, createReview);
reviewRouter.post("/update", protect, updateReview);

export default reviewRouter;
