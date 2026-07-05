import express from "express";
import { getNotifications, markAllNotificationsRead, markNotificationRead } from "../controllers/notificationController.js";
import { protect } from "../middleware/auth.js";

const notificationRouter = express.Router();

notificationRouter.get("/", protect, getNotifications);
notificationRouter.post("/mark-read", protect, markNotificationRead);
notificationRouter.post("/mark-all-read", protect, markAllNotificationsRead);

export default notificationRouter;
