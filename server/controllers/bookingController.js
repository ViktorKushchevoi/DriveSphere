import Booking from "../models/Booking.js"
import Car from "../models/Car.js";
import Notification from "../models/Notification.js";
import imagekit from "../configs/imageKit.js";
import fs from "fs";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const validateBookingDates = (pickupDate, returnDate)=>{
    if(!pickupDate || !returnDate){
        return {success: false, message: "Pickup date and return date are required"};
    }

    const picked = new Date(pickupDate);
    const returned = new Date(returnDate);

    if(Number.isNaN(picked.getTime()) || Number.isNaN(returned.getTime())){
        return {success: false, message: "Invalid booking dates"};
    }

    if(returned <= picked){
        return {success: false, message: "Return date must be after pickup date"};
    }

    const noOfDays = Math.ceil((returned.getTime() - picked.getTime()) / MS_PER_DAY);
    if(noOfDays <= 0){
        return {success: false, message: "Return date must be after pickup date"};
    }

    return {success: true, picked, returned, noOfDays};
}

const isValidTime = (time)=> /^([01]\d|2[0-3]):[0-5]\d$/.test(time || "");

const validateBookingDateTime = ({pickupDate, returnDate, pickupTime, returnTime})=>{
    if(!pickupTime?.trim()){
        return {success: false, message: "Pickup time is required"};
    }

    if(!returnTime?.trim()){
        return {success: false, message: "Return time is required"};
    }

    if(!isValidTime(pickupTime.trim()) || !isValidTime(returnTime.trim())){
        return {success: false, message: "Please select valid pickup and return times"};
    }

    const pickupDateTime = new Date(`${pickupDate}T${pickupTime.trim()}:00`);
    const returnDateTime = new Date(`${returnDate}T${returnTime.trim()}:00`);

    if(Number.isNaN(pickupDateTime.getTime()) || Number.isNaN(returnDateTime.getTime())){
        return {success: false, message: "Invalid pickup or return time"};
    }

    if(returnDateTime <= pickupDateTime){
        return {success: false, message: "Return date and time must be after pickup date and time"};
    }

    return {success: true};
}

const validateCheckoutDetails = ({contactName, contactEmail, contactPhone, deliveryCity, deliveryStreet})=>{
    if(!contactName?.trim() || !contactEmail?.trim() || !contactPhone?.trim() || !deliveryCity?.trim() || !deliveryStreet?.trim()){
        return {success: false, message: "Please fill in all required contact details"};
    }

    return {success: true};
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isValidPhone = (phone)=> phone.replace(/\D/g, "").length >= 7;

const formatDateOnly = (date)=> date.toISOString().split('T')[0];
const confirmedStatusQuery = {$regex: /^confirmed$/i};
const adminBookingMessage = "Admin accounts cannot create bookings. Please use a customer account to book a car.";

const generateBookingNumber = ()=> String(Math.floor(1000000 + Math.random() * 9000000));

const createUniqueBookingNumber = async ()=>{
    for(let attempt = 0; attempt < 10; attempt += 1){
        const bookingNumber = generateBookingNumber();
        const exists = await Booking.exists({bookingNumber});
        if(!exists){
            return bookingNumber;
        }
    }
    throw new Error("Unable to generate booking number");
}

const getPublicBookingNumber = (booking)=> booking?.bookingNumber || booking?._id?.toString?.()?.slice(-7) || "";
const formatBookingLabel = (booking)=> getPublicBookingNumber(booking) ? `#${getPublicBookingNumber(booking)}` : "";

const normalizeDateKey = (value)=>{
    if(!value) return "";
    if(typeof value === "string") return value.slice(0, 10);
    if(value instanceof Date && !Number.isNaN(value.getTime())) return formatDateOnly(value);
    return "";
}

const hasManualUnavailableDateInRange = (manualUnavailableDates = [], pickupDate, returnDate)=>{
    const pickupKey = normalizeDateKey(pickupDate);
    const returnKey = normalizeDateKey(returnDate);
    if(!pickupKey || !returnKey) return false;

    return (manualUnavailableDates || []).some((date)=>{
        const dateKey = normalizeDateKey(date);
        return dateKey && dateKey >= pickupKey && dateKey <= returnKey;
    });
}

const getBookingConversationAccess = (booking, user)=>{
    if(!booking || !user) return false;
    const ownerId = booking.owner?._id?.toString?.() || booking.owner?.toString?.();
    const userId = booking.user?._id?.toString?.() || booking.user?.toString?.();
    if(user.role === "admin"){
        return ownerId === user._id.toString();
    }
    return userId === user._id.toString();
}

const formatConversationResponse = (booking)=>{
    return {
        bookingId: booking._id,
        bookingNumber: booking.bookingNumber || "",
        car: {
            _id: booking.car?._id,
            brand: booking.car?.brand,
            model: booking.car?.model,
            image: booking.car?.image,
        },
        customerContact: {
            name: booking.contactName || booking.user?.name || "",
            email: booking.contactEmail || booking.user?.email || "",
            phone: booking.contactPhone || booking.user?.phone || "",
        },
        ownerContact: {
            name: booking.owner?.name || "",
            email: booking.owner?.email || "",
            phone: booking.owner?.phone || "",
        },
        conversation: booking.conversation || [],
    };
}

const getUnreadConversationCount = (booking, userId)=>{
    const currentUserId = userId.toString();
    return (booking.conversation || []).filter((message)=>{
        const senderId = message?.sender?._id?.toString?.() || message?.sender?.toString?.() || String(message?.sender || "");
        const readBy = (message.readBy || []).map((reader)=> reader?._id?.toString?.() || reader?.toString?.());
        return senderId !== currentUserId && !readBy.includes(currentUserId);
    }).length;
}

const attachUnreadCount = (booking, userId)=>{
    const bookingObject = booking.toObject ? booking.toObject() : booking;
    bookingObject.unreadConversationCount = getUnreadConversationCount(booking, userId);
    return bookingObject;
}

const markConversationRead = async (booking, userId)=>{
    const currentUserId = userId.toString();
    let changed = false;
    (booking.conversation || []).forEach((message)=>{
        const readBy = (message.readBy || []).map((reader)=> reader?.toString?.() || String(reader));
        if(!readBy.includes(currentUserId)){
            message.readBy = [...(message.readBy || []), userId];
            changed = true;
        }
    });
    if(changed){
        await booking.save();
    }
}

const uploadConversationAttachment = async (file)=>{
    if(!file) return null;
    if(!file.mimetype?.startsWith("image/")){
        throw new Error("Only image attachments are allowed");
    }

    const fileBuffer = fs.readFileSync(file.path);
    const response = await imagekit.upload({
        file: fileBuffer,
        fileName: file.originalname,
        folder: "/booking-conversations"
    });

    const url = imagekit.url({
        path: response.filePath,
        transformation: [
            {width: "1000"},
            {quality: "auto"},
            {format: "webp"}
        ]
    });

    return {
        url,
        type: "image",
        fileName: file.originalname,
    };
}

const findConversationBooking = async (bookingId)=>{
    return Booking.findById(bookingId)
        .populate("car", "brand model image")
        .populate("user", "name email phone")
        .populate("owner", "name email phone")
        .populate("conversation.sender", "name role")
        .populate("conversation.reaction.user", "name role");
}

const isOwnConversationMessage = (message, user)=>{
    const senderId = message?.sender?._id?.toString?.() || message?.sender?.toString?.() || String(message?.sender || "");
    return senderId === user._id.toString();
}

const getConversationMessageById = (booking, messageId)=>{
    const safeMessageId = String(messageId || "");
    if(!safeMessageId) return null;

    try {
        const message = booking.conversation.id(safeMessageId);
        if(message) return message;
    } catch (error) {
        // Fall back to string comparison below when Mongoose cannot cast the id.
    }

    return booking.conversation.find((message)=> message._id?.toString() === safeMessageId) || null;
}

// Function to Check Availability of Car for a given Date
const checkAvailability = async (car, pickupDate, returnDate, excludeBookingId = null)=>{
    const carData = typeof car === "object" && car?._id ? car : await Car.findById(car).select("manualUnavailableDates");
    if(!carData){
        return false;
    }

    if(hasManualUnavailableDateInRange(carData.manualUnavailableDates, pickupDate, returnDate)){
        return false;
    }

    const query = {
        car: carData._id || car,
        pickupDate: {$lte: returnDate},
        returnDate: {$gte: pickupDate},
        status: confirmedStatusQuery,
    };

    if(excludeBookingId){
        query._id = {$ne: excludeBookingId};
    }

    const bookings = await Booking.find(query)
    return bookings.length === 0;
}

// API to Check Availability of Cars for the given Date and location
export const checkAvailabilityOfCar = async (req, res)=>{
    try {
        const {location, pickupDate, returnDate} = req.body
        const dateValidation = validateBookingDates(pickupDate, returnDate);
        if(!dateValidation.success){
            return res.status(400).json(dateValidation);
        }

        const carQuery = {isAvaliable: true};
        if(location && location !== "all"){
            carQuery.location = location;
        }

        // fetch all available cars for the given location, or every location when no location is selected
        const cars = await Car.find(carQuery)

        // check car availability for the given date range using promise
        const availableCarsPromises = cars.map(async (car)=>{
           const isAvailable = await checkAvailability(car, pickupDate, returnDate)
           return {...car._doc, isAvailable: isAvailable}
        })

        let availableCars = await Promise.all(availableCarsPromises);
        availableCars = availableCars.filter(car => car.isAvailable === true)

        res.json({success: true, availableCars})

    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message})
    }
}

// API to Create Booking
export const createBooking = async (req, res)=>{
    try {
        const {_id} = req.user;
        if(req.user.role === "admin"){
            return res.status(403).json({success: false, message: adminBookingMessage})
        }

        const {
            car,
            pickupDate,
            returnDate,
            pickupTime,
            returnTime,
            contactName,
            contactEmail,
            contactPhone,
            deliveryCity,
            deliveryStreet,
            deliveryDetails = "",
            specialRequests = "",
        } = req.body;

        const dateValidation = validateBookingDates(pickupDate, returnDate);
        if(!dateValidation.success){
            return res.status(400).json(dateValidation);
        }

        const dateTimeValidation = validateBookingDateTime({pickupDate, returnDate, pickupTime, returnTime});
        if(!dateTimeValidation.success){
            return res.status(400).json(dateTimeValidation);
        }

        const checkoutValidation = validateCheckoutDetails({contactName, contactEmail, contactPhone, deliveryCity, deliveryStreet});
        if(!checkoutValidation.success){
            return res.status(400).json(checkoutValidation);
        }

        const carData = await Car.findById(car)
        if(!carData){
            return res.status(404).json({success: false, message: "Car not found"})
        }

        const carLocation = carData.location?.trim();
        if(deliveryCity.trim() !== carLocation){
            return res.status(400).json({success: false, message: "Delivery city must match the car location"})
        }

        const isAvailable = await checkAvailability(carData, pickupDate, returnDate)
        if(!isAvailable){
            return res.status(409).json({success: false, message: "This car is not available for the selected dates."})
        }

        // Calculate price based on pickupDate and returnDate
        const noOfDays = dateValidation.noOfDays;
        const price = carData.pricePerDay * noOfDays;
        if(price <= 0){
            return res.status(400).json({success: false, message: "Invalid booking price"})
        }

        const booking = await Booking.create({
            bookingNumber: await createUniqueBookingNumber(),
            car,
            owner: carData.owner,
            user: _id,
            pickupDate,
            returnDate,
            pickupTime: pickupTime.trim(),
            returnTime: returnTime.trim(),
            price,
            contactName: contactName.trim(),
            contactEmail: contactEmail.trim(),
            contactPhone: contactPhone.trim(),
            deliveryCity: carLocation,
            deliveryStreet: deliveryStreet.trim(),
            deliveryDetails: (deliveryDetails || "").trim(),
            deliveryAddress: deliveryStreet.trim(),
            specialRequests: (specialRequests || "").trim(),
        })

        res.json({success: true, message: "Booking Created", bookingId: booking._id, bookingNumber: booking.bookingNumber})

    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message})
    }
}

// API to get one user booking safely
export const getBookingById = async (req, res)=>{
    try {
        if(req.user.role === "admin"){
            return res.status(403).json({success: false, message: "Unauthorized"})
        }

        const {id} = req.params;
        const booking = await Booking.findOne({_id: id, user: req.user._id})
            .populate("car")

        if(!booking){
            return res.status(404).json({success: false, message: "Booking not found"})
        }

        res.json({success: true, booking})
    } catch (error) {
        console.log(error.message);
        res.status(400).json({success: false, message: "Unable to load booking. Please try again."})
    }
}

// API to get booking conversation for customer or owning admin
export const getBookingConversation = async (req, res)=>{
    try {
        const {bookingId} = req.params;
        const booking = await findConversationBooking(bookingId);

        if(!booking){
            return res.status(404).json({success: false, message: "Booking not found"});
        }

        if(!getBookingConversationAccess(booking, req.user)){
            return res.status(403).json({success: false, message: "Unauthorized"});
        }

        await markConversationRead(booking, req.user._id);
        const updatedBooking = await findConversationBooking(bookingId);
        res.json({success: true, ...formatConversationResponse(updatedBooking)});
    } catch (error) {
        console.log(error.message);
        res.status(400).json({success: false, message: "Unable to load conversation. Please try again."});
    }
}

// API to add a message to booking conversation
export const addBookingMessage = async (req, res)=>{
    try {
        const {bookingId, message} = req.body;
        const trimmedMessage = message?.trim();
        const attachment = await uploadConversationAttachment(req.file);

        if(!bookingId){
            return res.status(400).json({success: false, message: "Booking ID is required"});
        }

        if(!trimmedMessage && !attachment){
            return res.status(400).json({success: false, message: "Please enter a message or attach a photo."});
        }

        const booking = await Booking.findById(bookingId);

        if(!booking){
            return res.status(404).json({success: false, message: "Booking not found"});
        }

        if(!getBookingConversationAccess(booking, req.user)){
            return res.status(403).json({success: false, message: "Unauthorized"});
        }

        booking.conversation.push({
            sender: req.user._id,
            senderRole: req.user.role === "admin" ? "admin" : "user",
            message: trimmedMessage || "",
            attachments: attachment ? [attachment] : [],
            readBy: [req.user._id],
        });

        await booking.save();

        const updatedBooking = await findConversationBooking(bookingId);
        const receiverId = req.user.role === "admin" ? updatedBooking.user?._id : updatedBooking.owner?._id;
        const bookingLabel = formatBookingLabel(updatedBooking);

        if(receiverId && receiverId.toString() !== req.user._id.toString()){
            await Notification.create({
                user: receiverId,
                booking: updatedBooking._id,
                type: "booking_message",
                title: "New booking message",
                message: req.user.role === "admin"
                    ? `You have a new message for booking ${bookingLabel}.`
                    : `New booking message for ${bookingLabel}.`,
            });
        }

        res.json({success: true, ...formatConversationResponse(updatedBooking)});
    } catch (error) {
        console.log(error.message);
        res.status(400).json({success: false, message: "Unable to send message. Please try again."});
    }
}

// API to edit own booking conversation message
export const editBookingMessage = async (req, res)=>{
    try {
        const {bookingId, messageId, message} = req.body;
        const trimmedMessage = message?.trim();

        if(!bookingId || !messageId){
            return res.status(400).json({success: false, message: "Booking ID and message ID are required"});
        }

        if(!trimmedMessage){
            return res.status(400).json({success: false, message: "Message cannot be empty"});
        }

        const booking = await Booking.findById(bookingId);

        if(!booking){
            return res.status(404).json({success: false, message: "Booking not found"});
        }

        if(!getBookingConversationAccess(booking, req.user)){
            return res.status(403).json({success: false, message: "Unauthorized"});
        }

        const conversationMessage = getConversationMessageById(booking, messageId);
        if(!conversationMessage){
            return res.status(404).json({success: false, message: "Message not found"});
        }

        if(!isOwnConversationMessage(conversationMessage, req.user)){
            return res.status(403).json({success: false, message: "You can only edit your own messages"});
        }

        if(conversationMessage.isDeleted){
            return res.status(400).json({success: false, message: "Deleted messages cannot be edited"});
        }

        conversationMessage.message = trimmedMessage;
        conversationMessage.editedAt = new Date();
        await booking.save();

        const updatedBooking = await findConversationBooking(bookingId);
        res.json({success: true, ...formatConversationResponse(updatedBooking)});
    } catch (error) {
        console.log(error.message);
        res.status(400).json({success: false, message: "Unable to update this message. Please try again."});
    }
}

// API to soft delete own booking conversation message
export const deleteBookingMessage = async (req, res)=>{
    try {
        const {bookingId, messageId} = req.body;

        if(!bookingId || !messageId){
            return res.status(400).json({success: false, message: "Booking ID and message ID are required"});
        }

        const booking = await Booking.findById(bookingId);

        if(!booking){
            return res.status(404).json({success: false, message: "Booking not found"});
        }

        if(!getBookingConversationAccess(booking, req.user)){
            return res.status(403).json({success: false, message: "Unauthorized"});
        }

        const conversationMessage = getConversationMessageById(booking, messageId);
        if(!conversationMessage){
            return res.status(404).json({success: false, message: "Message not found"});
        }

        if(!isOwnConversationMessage(conversationMessage, req.user)){
            return res.status(403).json({success: false, message: "You can only delete your own messages"});
        }

        conversationMessage.message = "This message was deleted.";
        conversationMessage.isDeleted = true;
        conversationMessage.editedAt = null;
        conversationMessage.reaction = {user: null, type: "heart", createdAt: null};
        await booking.save();

        const updatedBooking = await findConversationBooking(bookingId);
        res.json({success: true, ...formatConversationResponse(updatedBooking)});
    } catch (error) {
        console.log(error.message);
        res.status(400).json({success: false, message: "Unable to delete this message. Please try again."});
    }
}

// API to toggle one heart reaction on another participant's message
export const toggleBookingMessageReaction = async (req, res)=>{
    try {
        const {bookingId, messageId, type = "heart"} = req.body;

        if(!bookingId || !messageId){
            return res.status(400).json({success: false, message: "Booking ID and message ID are required"});
        }

        if(type !== "heart"){
            return res.status(400).json({success: false, message: "Invalid reaction type"});
        }

        const booking = await Booking.findById(bookingId);

        if(!booking){
            return res.status(404).json({success: false, message: "Booking not found"});
        }

        if(!getBookingConversationAccess(booking, req.user)){
            return res.status(403).json({success: false, message: "Unauthorized"});
        }

        const conversationMessage = getConversationMessageById(booking, messageId);
        if(!conversationMessage){
            return res.status(404).json({success: false, message: "Message not found"});
        }

        if(conversationMessage.isDeleted){
            return res.status(400).json({success: false, message: "Deleted messages cannot be reacted to"});
        }

        if(isOwnConversationMessage(conversationMessage, req.user)){
            return res.status(403).json({success: false, message: "You cannot react to your own message"});
        }

        const existingReactionUserId = conversationMessage.reaction?.user?.toString?.();
        if(existingReactionUserId === req.user._id.toString()){
            conversationMessage.reaction = {user: null, type: "heart", createdAt: null};
        }else if(!existingReactionUserId){
            conversationMessage.reaction = {
                user: req.user._id,
                type: "heart",
                createdAt: new Date(),
            };
        }else{
            return res.status(400).json({success: false, message: "This message already has a heart reaction"});
        }

        await booking.save();

        const updatedBooking = await findConversationBooking(bookingId);
        res.json({success: true, ...formatConversationResponse(updatedBooking)});
    } catch (error) {
        console.log(error.message);
        res.status(400).json({success: false, message: "Unable to update reaction. Please try again."});
    }
}

// API to get unavailable confirmed booking ranges for one car
export const getUnavailableDates = async (req, res)=>{
    try {
        const {carId} = req.params;
        const car = await Car.findById(carId).select("manualUnavailableDates");
        if(!car){
            return res.status(404).json({success: false, message: "Car not found"})
        }

        const bookings = await Booking.find({car: carId, status: confirmedStatusQuery})
            .select("pickupDate returnDate -_id")
            .sort({pickupDate: 1})

        const unavailableDates = bookings.map((booking)=>({
            pickupDate: formatDateOnly(booking.pickupDate),
            returnDate: formatDateOnly(booking.returnDate),
            source: "booking",
        }))

        res.json({
            success: true,
            unavailableDates,
            manualUnavailableDates: car.manualUnavailableDates || [],
        })
    } catch (error) {
        console.log(error.message);
        res.status(400).json({success: false, message: "Unable to load unavailable dates"})
    }
}

// API to cancel own booking
export const cancelBooking = async (req, res)=>{
    try {
        const {_id} = req.user;
        const {bookingId} = req.body;

        if(!bookingId){
            return res.status(400).json({success: false, message: "Booking ID is required"});
        }

        const booking = await Booking.findById(bookingId);
        if(!booking){
            return res.status(404).json({success: false, message: "Booking not found"});
        }

        if(booking.user.toString() !== _id.toString()){
            return res.status(403).json({success: false, message: "Unauthorized"});
        }

        if(booking.status === "cancelled"){
            return res.status(400).json({success: false, message: "Booking is already cancelled"});
        }

        if(!["pending", "confirmed"].includes(booking.status)){
            return res.status(400).json({success: false, message: "This booking cannot be cancelled"});
        }

        await Booking.updateOne({_id: bookingId}, {$set: {status: "cancelled"}});

        res.json({success: true, message: "Booking cancelled", bookingId});
    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message})
    }
}

// API to update editable customer booking details
export const updateBookingDetails = async (req, res)=>{
    try {
        if(req.user.role === "admin"){
            return res.status(403).json({success: false, message: "Admin accounts cannot update customer booking details from this endpoint"})
        }

        const {_id} = req.user;
        const {
            bookingId,
            contactName,
            contactEmail,
            contactPhone,
            pickupTime,
            returnTime,
            deliveryCity,
            deliveryStreet,
            streetAddress,
            deliveryDetails = "",
            apartmentDetails = "",
            specialRequests = "",
        } = req.body;
        const nextDeliveryStreet = deliveryStreet ?? streetAddress;
        const nextDeliveryDetails = deliveryDetails || apartmentDetails || "";

        if(!bookingId){
            return res.status(400).json({success: false, message: "Booking ID is required"});
        }

        if(!contactName?.trim() || !contactEmail?.trim() || !contactPhone?.trim() || !pickupTime?.trim() || !returnTime?.trim() || !deliveryCity?.trim() || !nextDeliveryStreet?.trim()){
            return res.status(400).json({success: false, message: "Please fill in all required fields."});
        }

        if(!emailPattern.test(contactEmail.trim())){
            return res.status(400).json({success: false, message: "Please enter a valid email address."});
        }

        if(!isValidPhone(contactPhone.trim())){
            return res.status(400).json({success: false, message: "Please enter a valid phone number."});
        }

        if(!isValidTime(pickupTime.trim()) || !isValidTime(returnTime.trim())){
            return res.status(400).json({success: false, message: "Please select valid pickup and return times"});
        }

        const booking = await Booking.findById(bookingId).populate("car");
        if(!booking){
            return res.status(404).json({success: false, message: "Booking not found"});
        }

        if(booking.user.toString() !== _id.toString()){
            return res.status(403).json({success: false, message: "You can only update your own bookings"});
        }

        if(booking.status === "cancelled"){
            return res.status(400).json({success: false, message: "Cancelled bookings cannot be edited."});
        }

        if(!["pending", "confirmed"].includes(booking.status)){
            return res.status(400).json({success: false, message: "This booking cannot be edited"});
        }

        const dateTimeValidation = validateBookingDateTime({
            pickupDate: normalizeDateKey(booking.pickupDate),
            returnDate: normalizeDateKey(booking.returnDate),
            pickupTime,
            returnTime,
        });
        if(!dateTimeValidation.success){
            return res.status(400).json(dateTimeValidation);
        }

        const nextValues = {
            contactName: contactName.trim(),
            contactEmail: contactEmail.trim(),
            contactPhone: contactPhone.trim(),
            pickupTime: pickupTime.trim(),
            returnTime: returnTime.trim(),
            deliveryCity: deliveryCity.trim(),
            deliveryStreet: nextDeliveryStreet.trim(),
            deliveryDetails: (nextDeliveryDetails || "").trim(),
            specialRequests: (specialRequests || "").trim(),
        };

        const changedFields = Object.entries(nextValues).filter(([field, value]) => String(booking[field] || "") !== value);
        if(changedFields.length === 0){
            await booking.populate("car");
            return res.json({success: true, message: "No changes to save.", booking});
        }

        Object.entries(nextValues).forEach(([field, value])=>{
            booking[field] = value;
        });
        booking.deliveryAddress = nextValues.deliveryStreet;

        await booking.save();
        await booking.populate("car");

        const bookingLabel = formatBookingLabel(booking);
        await Notification.create({
            user: booking.owner,
            booking: booking._id,
            type: "booking_details_updated",
            title: "Booking details updated",
            message: `Booking ${bookingLabel} details were updated by the customer.`,
        });

        res.json({success: true, message: "Booking details updated", booking});
    } catch (error) {
        console.log(error.message);
        res.status(400).json({success: false, message: "Unable to update booking details. Please try again."})
    }
}

// API to List User Bookings 
export const getUserBookings = async (req, res)=>{
    try {
        const {_id} = req.user;
        const bookings = await Booking.find({ user: _id }).populate("car").sort({createdAt: -1})
        res.json({success: true, bookings: bookings.map((booking)=> attachUnreadCount(booking, _id))})

    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message})
    }
}

// API to get Admin Bookings

export const getAdminBookings = async (req, res)=>{
    try {
        if(req.user.role !== 'admin'){
            return res.json({ success: false, message: "Unauthorized" })
        }
        const bookings = await Booking.find({owner: req.user._id}).populate('car user').select("-user.password").sort({createdAt: -1 })
        res.json({success: true, bookings: bookings.map((booking)=> attachUnreadCount(booking, req.user._id))})
    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message})
    }
}

// API to change booking status
export const changeBookingStatus = async (req, res)=>{
    try {
        const {_id} = req.user;
        const {bookingId, status} = req.body

        if(!["pending", "confirmed", "cancelled"].includes(status)){
            return res.status(400).json({success: false, message: "Invalid booking status"})
        }

        const booking = await Booking.findById(bookingId).populate("car")

        if(!booking){
            return res.status(404).json({success: false, message: "Booking not found"})
        }

        if(booking.owner.toString() !== _id.toString()){
            return res.json({ success: false, message: "Unauthorized"})
        }

        if(status === "confirmed"){
            const isAvailable = await checkAvailability(booking.car._id, booking.pickupDate, booking.returnDate, bookingId);
            if(!isAvailable){
                return res.status(409).json({success: false, message: "This car is not available for the selected dates."})
            }
        }

        const previousStatus = booking.status;
        await Booking.updateOne({_id: bookingId}, {$set: {status}});

        if(previousStatus !== status){
            const carName = booking.car ? `${booking.car.brand} ${booking.car.model}` : "your car";
            const bookingLabel = formatBookingLabel(booking);
            await Notification.create({
                user: booking.user,
                booking: booking._id,
                type: "booking_status_updated",
                title: "Booking status updated",
                message: `Your booking ${bookingLabel} for ${carName} was ${status}.`,
            });
        }

        res.json({ success: true, message: "Status Updated"})
    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message})
    }
}
