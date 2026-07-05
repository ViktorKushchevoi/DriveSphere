import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../configs/db.js";
import Booking from "../models/Booking.js";

dotenv.config();

const generateBookingNumber = () => String(Math.floor(1000000 + Math.random() * 9000000));

const createUniqueBookingNumber = async () => {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const bookingNumber = generateBookingNumber();
    const exists = await Booking.exists({ bookingNumber });
    if (!exists) return bookingNumber;
  }
  throw new Error("Unable to generate a unique booking number.");
};

const backfillBookingNumbers = async () => {
  await connectDB();

  const bookings = await Booking.find({
    $or: [
      { bookingNumber: { $exists: false } },
      { bookingNumber: "" },
      { bookingNumber: null },
    ],
  }).select("_id bookingNumber");

  let updatedCount = 0;

  for (const booking of bookings) {
    const bookingNumber = await createUniqueBookingNumber();
    await Booking.updateOne({ _id: booking._id }, { $set: { bookingNumber } });
    updatedCount += 1;
  }

  console.log(`Backfilled booking numbers for ${updatedCount} bookings.`);
  await mongoose.connection.close();
};

backfillBookingNumbers().catch(async (error) => {
  console.error(error.message);
  await mongoose.connection.close();
  process.exit(1);
});
