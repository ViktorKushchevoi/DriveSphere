import Notification from "../models/Notification.js";

export const getNotifications = async (req, res)=>{
    try {
        const notifications = await Notification.find({user: req.user._id})
            .sort({createdAt: -1})
            .limit(20);

        res.json({success: true, notifications});
    } catch (error) {
        console.log(error.message);
        res.status(400).json({success: false, message: "Unable to load notifications. Please try again."});
    }
}

export const markNotificationRead = async (req, res)=>{
    try {
        const {notificationId} = req.body;
        if(!notificationId){
            return res.status(400).json({success: false, message: "Notification ID is required"});
        }

        const notification = await Notification.findOneAndUpdate(
            {_id: notificationId, user: req.user._id},
            {$set: {isRead: true}},
            {new: true}
        );

        if(!notification){
            return res.status(404).json({success: false, message: "Notification not found"});
        }

        res.json({success: true, notification});
    } catch (error) {
        console.log(error.message);
        res.status(400).json({success: false, message: "Unable to update notification. Please try again."});
    }
}

export const markAllNotificationsRead = async (req, res)=>{
    try {
        await Notification.updateMany({user: req.user._id, isRead: false}, {$set: {isRead: true}});
        res.json({success: true, message: "Notifications marked as read"});
    } catch (error) {
        console.log(error.message);
        res.status(400).json({success: false, message: "Unable to update notifications. Please try again."});
    }
}
