import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next)=>{
    const token = req.headers.authorization;
    if(!token){
        return res.status(401).json({success: false, message: "not authorized"})
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const userId = decoded.userId;

        if(!userId){
            return res.status(401).json({success: false, message: "not authorized"})
        }
        req.user = await User.findById(userId).select("-password")
        if(!req.user){
            return res.status(401).json({success: false, message: "not authorized"})
        }
        next();
    } catch (error) {
        return res.status(401).json({success: false, message: "not authorized"})
    }
}

export const requireAdmin = (req, res, next)=>{
    if(req.user?.role !== "admin"){
        return res.status(403).json({success: false, message: "Unauthorized"})
    }
    next();
}
