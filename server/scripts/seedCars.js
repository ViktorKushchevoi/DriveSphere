import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../configs/db.js";
import Car from "../models/Car.js";
import User from "../models/User.js";

dotenv.config();

const badImageKeywords = ["watermark", "studio", "placeholder", "imagin"];

const getCommonsImageUrl = (fileName) => {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}?width=1200`;
};

const validateSeedImages = (cars) => {
  const badCar = cars.find((car) => {
    const image = car.image.toLowerCase();
    return badImageKeywords.some((keyword) => image.includes(keyword));
  });

  if (badCar) {
    throw new Error(
      `Invalid seed image URL for ${badCar.brand} ${badCar.model}. Remove watermark, studio, placeholder, or Imagin URLs before seeding.`,
    );
  }
};

const seededCars = [
  {
    brand: "Toyota",
    model: "Corolla",
    image: getCommonsImageUrl("2019 Toyota Corolla front.jpg"),
    year: 2022,
    category: "Sedan",
    seating_capacity: 5,
    fuel_type: "Petrol",
    transmission: "Automatic",
    pricePerDay: 58,
    location: "New York",
    description: "A dependable compact sedan with efficient fuel economy, simple controls, and comfortable seating for daily city trips.",
    isAvaliable: true,
  },
  {
    brand: "Honda",
    model: "Civic",
    image: getCommonsImageUrl("2022 Honda Civic Sedan EX in Platinum White Pearl, front left.jpg"),
    year: 2023,
    category: "Compact",
    seating_capacity: 5,
    fuel_type: "Petrol",
    transmission: "Automatic",
    pricePerDay: 62,
    location: "Los Angeles",
    description: "A practical compact car with responsive handling, modern cabin space, and easy parking for urban travel.",
    isAvaliable: true,
  },
  {
    brand: "Nissan",
    model: "Sentra",
    image: getCommonsImageUrl("Nissan Sentra 2017 Front.jpg"),
    year: 2021,
    category: "Sedan",
    seating_capacity: 5,
    fuel_type: "Petrol",
    transmission: "Automatic",
    pricePerDay: 54,
    location: "Houston",
    description: "A comfortable sedan for everyday rentals, offering a smooth ride, good trunk space, and straightforward technology.",
    isAvaliable: true,
  },
  {
    brand: "Hyundai",
    model: "Elantra",
    image: getCommonsImageUrl("2021 Hyundai Elantra CN7 (United States).png"),
    year: 2023,
    category: "Sedan",
    seating_capacity: 5,
    fuel_type: "Hybrid",
    transmission: "Automatic",
    pricePerDay: 64,
    location: "Chicago",
    description: "A modern sedan with a quiet cabin, efficient driving, and useful safety features for commuting or weekend errands.",
    isAvaliable: true,
  },
  {
    brand: "Ford",
    model: "Focus",
    image: getCommonsImageUrl("3rd generation Ford Focus front.jpg"),
    year: 2019,
    category: "Hatchback",
    seating_capacity: 5,
    fuel_type: "Petrol",
    transmission: "Manual",
    pricePerDay: 49,
    location: "New York",
    description: "A compact hatchback with flexible cargo room, efficient running costs, and a nimble feel around town.",
    isAvaliable: true,
  },
  {
    brand: "Chevrolet",
    model: "Malibu",
    image: getCommonsImageUrl("Chevrolet Malibu front.jpg"),
    year: 2021,
    category: "Sedan",
    seating_capacity: 5,
    fuel_type: "Petrol",
    transmission: "Automatic",
    pricePerDay: 63,
    location: "Los Angeles",
    description: "A midsize sedan with relaxed highway manners, roomy seating, and a balanced daily rental experience.",
    isAvaliable: true,
  },
  {
    brand: "Toyota",
    model: "Camry",
    image: getCommonsImageUrl("Toyota Camry front 20080730.jpg"),
    year: 2022,
    category: "Sedan",
    seating_capacity: 5,
    fuel_type: "Hybrid",
    transmission: "Automatic",
    pricePerDay: 72,
    location: "Houston",
    description: "A spacious midsize sedan with strong reliability, excellent comfort, and efficient hybrid driving for longer rentals.",
    isAvaliable: true,
  },
  {
    brand: "Honda",
    model: "Accord",
    image: getCommonsImageUrl("Honda Accord front 20080708.jpg"),
    year: 2020,
    category: "Sedan",
    seating_capacity: 5,
    fuel_type: "Petrol",
    transmission: "Automatic",
    pricePerDay: 68,
    location: "Chicago",
    description: "A roomy sedan with calm road manners, generous rear-seat space, and dependable comfort for business or family travel.",
    isAvaliable: true,
  },
  {
    brand: "Kia",
    model: "Forte",
    image: getCommonsImageUrl("2019 Kia Forte EX, front 5.19.20 (cropped).jpg"),
    year: 2021,
    category: "Compact",
    seating_capacity: 5,
    fuel_type: "Petrol",
    transmission: "Automatic",
    pricePerDay: 52,
    location: "New York",
    description: "An affordable compact sedan with a clean interior, simple controls, and efficient performance for daily rentals.",
    isAvaliable: true,
  },
  {
    brand: "Ford",
    model: "Escape",
    image: getCommonsImageUrl("Ford Escape front.jpg"),
    year: 2022,
    category: "SUV",
    seating_capacity: 5,
    fuel_type: "Hybrid",
    transmission: "Automatic",
    pricePerDay: 82,
    location: "Los Angeles",
    description: "A compact SUV with useful cargo space, elevated visibility, and efficient hybrid driving for city and highway routes.",
    isAvaliable: true,
  },
  {
    brand: "Nissan",
    model: "Rogue",
    image: getCommonsImageUrl("2021 Nissan Rogue (T33) front view (United States).png"),
    year: 2023,
    category: "SUV",
    seating_capacity: 5,
    fuel_type: "Petrol",
    transmission: "Automatic",
    pricePerDay: 86,
    location: "Houston",
    description: "A practical compact SUV with comfortable seating, flexible cargo space, and confident everyday usability.",
    isAvaliable: true,
  },
  {
    brand: "Hyundai",
    model: "Tucson",
    image: getCommonsImageUrl("Hyundai Tucson front 20071004.jpg"),
    year: 2024,
    category: "SUV",
    seating_capacity: 5,
    fuel_type: "Hybrid",
    transmission: "Automatic",
    pricePerDay: 89,
    location: "Chicago",
    description: "A newer compact SUV with a refined cabin, efficient hybrid powertrain, and enough room for luggage or errands.",
    isAvaliable: true,
  },
  {
    brand: "Volkswagen",
    model: "Jetta",
    image: getCommonsImageUrl("'19 Volkswagen Jetta.jpg"),
    year: 2020,
    category: "Sedan",
    seating_capacity: 5,
    fuel_type: "Diesel",
    transmission: "Automatic",
    pricePerDay: 59,
    location: "New York",
    description: "A compact sedan with composed road feel, efficient cruising, and a straightforward cabin for everyday rental needs.",
    isAvaliable: true,
  },
  {
    brand: "Mazda",
    model: "3",
    image: getCommonsImageUrl("Mazda 3 Facelift front.JPG"),
    year: 2021,
    category: "Hatchback",
    seating_capacity: 5,
    fuel_type: "Petrol",
    transmission: "Manual",
    pricePerDay: 57,
    location: "Los Angeles",
    description: "A compact hatchback with sharp handling, a tidy interior, and convenient cargo access for short city rentals.",
    isAvaliable: true,
  },
  {
    brand: "Subaru",
    model: "Impreza",
    image: getCommonsImageUrl("2017 Subaru Impreza sedan front 4.11.18.jpg"),
    year: 2019,
    category: "Compact",
    seating_capacity: 5,
    fuel_type: "Petrol",
    transmission: "Automatic",
    pricePerDay: 55,
    location: "Houston",
    description: "A compact car with confident traction, comfortable seating, and dependable everyday performance for varied road conditions.",
    isAvaliable: true,
  },
  {
    brand: "Chevrolet",
    model: "Equinox",
    image: getCommonsImageUrl("2019 Chevrolet Equinox, front 3.24.19.jpg"),
    year: 2022,
    category: "SUV",
    seating_capacity: 5,
    fuel_type: "Petrol",
    transmission: "Automatic",
    pricePerDay: 78,
    location: "Chicago",
    description: "A compact SUV with an easy driving position, practical cargo room, and balanced comfort for family or work trips.",
    isAvaliable: true,
  },
  {
    brand: "Skoda",
    model: "Octavia",
    image: getCommonsImageUrl("Skoda Octavia.JPG"),
    year: 2022,
    category: "Hatchback",
    seating_capacity: 5,
    fuel_type: "Diesel",
    transmission: "Automatic",
    pricePerDay: 66,
    location: "New York",
    description: "A roomy hatchback with excellent cargo space, efficient cruising, and an easygoing drive for longer rental days.",
    isAvaliable: true,
  },
  {
    brand: "Kia",
    model: "Sportage",
    image: getCommonsImageUrl("Kia Sportage (front).jpg"),
    year: 2023,
    category: "SUV",
    seating_capacity: 5,
    fuel_type: "Hybrid",
    transmission: "Automatic",
    pricePerDay: 88,
    location: "Los Angeles",
    description: "A compact crossover with a comfortable cabin, useful cargo space, and efficient hybrid performance for everyday trips.",
    isAvaliable: true,
  },
  {
    brand: "Toyota",
    model: "RAV4",
    image: getCommonsImageUrl("Toyota RAV4 (5th Gen.) front look.jpg"),
    year: 2023,
    category: "SUV",
    seating_capacity: 5,
    fuel_type: "Hybrid",
    transmission: "Automatic",
    pricePerDay: 92,
    location: "Houston",
    description: "A versatile compact SUV with strong efficiency, confident road manners, and room for luggage or family gear.",
    isAvaliable: true,
  },
  {
    brand: "Honda",
    model: "CR-V",
    image: getCommonsImageUrl("2023 Honda CR-V front end.jpg"),
    year: 2023,
    category: "SUV",
    seating_capacity: 5,
    fuel_type: "Hybrid",
    transmission: "Automatic",
    pricePerDay: 95,
    location: "Chicago",
    description: "A comfortable compact SUV with flexible cargo room, smooth hybrid driving, and practical features for daily rentals.",
    isAvaliable: true,
  },
  {
    brand: "Mazda",
    model: "CX-5",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/2024_Mazda_CX-5_2.5_S_Select_in_Platinum_Quartz_Metallic%2C_front_right.jpg/800px-2024_Mazda_CX-5_2.5_S_Select_in_Platinum_Quartz_Metallic%2C_front_right.jpg",
    year: 2022,
    category: "SUV",
    seating_capacity: 5,
    fuel_type: "Petrol",
    transmission: "Automatic",
    pricePerDay: 84,
    location: "New York",
    description: "A compact SUV with a polished cabin, confident handling, and practical cargo room for daily rentals or weekend drives.",
    isAvaliable: true,
    manualUnavailableDates: [],
  },
  {
    brand: "Subaru",
    model: "Outback",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/2026_Subaru_Outback_Wilderness%2C_front_left%2C_05-24-2026.jpg/800px-2026_Subaru_Outback_Wilderness%2C_front_left%2C_05-24-2026.jpg",
    year: 2021,
    category: "SUV",
    seating_capacity: 5,
    fuel_type: "Petrol",
    transmission: "Automatic",
    pricePerDay: 83,
    location: "Los Angeles",
    description: "A roomy crossover wagon with confident traction, relaxed ride quality, and generous cargo space for longer rental days.",
    isAvaliable: true,
    manualUnavailableDates: [],
  },
  {
    brand: "Nissan",
    model: "Altima",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/2024_Nissan_Altima_SR%2C_front_left%2C_05-05-2025.jpg/800px-2024_Nissan_Altima_SR%2C_front_left%2C_05-05-2025.jpg",
    year: 2022,
    category: "Sedan",
    seating_capacity: 5,
    fuel_type: "Petrol",
    transmission: "Automatic",
    pricePerDay: 69,
    location: "Houston",
    description: "A midsize sedan with comfortable seating, efficient highway cruising, and smooth manners for business or family trips.",
    isAvaliable: true,
    manualUnavailableDates: [],
  },
  {
    brand: "Chevrolet",
    model: "Cruze",
    image: getCommonsImageUrl("2017 Chevrolet Cruze LT in Arctic Blue Metallic, Front Left.jpg"),
    year: 2020,
    category: "Compact",
    seating_capacity: 5,
    fuel_type: "Petrol",
    transmission: "Automatic",
    pricePerDay: 56,
    location: "Chicago",
    description: "A compact sedan with easy parking, efficient fuel use, and enough comfort for quick city rentals or daily errands.",
    isAvaliable: true,
    manualUnavailableDates: [],
  },
  {
    brand: "Kia",
    model: "Soul",
    image: getCommonsImageUrl("2023 Kia Soul GT-Line Limited in Snow White Pearl, Front Right, 09-05-2022.jpg"),
    year: 2022,
    category: "Hatchback",
    seating_capacity: 5,
    fuel_type: "Petrol",
    transmission: "Automatic",
    pricePerDay: 61,
    location: "New York",
    description: "A boxy hatchback with upright seating, flexible cargo space, and simple controls for everyday city travel.",
    isAvaliable: true,
    manualUnavailableDates: [],
  },
  {
    brand: "Jeep",
    model: "Compass",
    image: getCommonsImageUrl("2018 Jeep Compass Latitude 2.4L front 4.20.19.jpg"),
    year: 2021,
    category: "SUV",
    seating_capacity: 5,
    fuel_type: "Petrol",
    transmission: "Automatic",
    pricePerDay: 81,
    location: "Los Angeles",
    description: "A compact SUV with elevated visibility, comfortable seating, and useful cargo room for flexible rental plans.",
    isAvaliable: true,
    manualUnavailableDates: [],
  },
  {
    brand: "Volkswagen",
    model: "Passat",
    image: getCommonsImageUrl("VW Passat B7 1.4 TSI BMT Trendline Islandgrau.JPG"),
    year: 2020,
    category: "Sedan",
    seating_capacity: 5,
    fuel_type: "Petrol",
    transmission: "Automatic",
    pricePerDay: 67,
    location: "Houston",
    description: "A comfortable midsize sedan with a quiet cabin, roomy rear seats, and steady road feel for longer drives.",
    isAvaliable: true,
    manualUnavailableDates: [],
  },
  {
    brand: "Ford",
    model: "Fusion",
    image: getCommonsImageUrl("2019 Ford Fusion Titanium Energi, front 2.29.20.jpg"),
    year: 2020,
    category: "Sedan",
    seating_capacity: 5,
    fuel_type: "Hybrid",
    transmission: "Automatic",
    pricePerDay: 73,
    location: "Chicago",
    description: "A smooth hybrid sedan with supportive seats, balanced ride comfort, and efficient driving for daily or highway rentals.",
    isAvaliable: true,
    manualUnavailableDates: [],
  },
  {
    brand: "Toyota",
    model: "Prius",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Toyota_Prius_2.0_HEV_Limited_%28V%29_%E2%80%93_f_18112022.jpg/800px-Toyota_Prius_2.0_HEV_Limited_%28V%29_%E2%80%93_f_18112022.jpg",
    year: 2023,
    category: "Hatchback",
    seating_capacity: 5,
    fuel_type: "Hybrid",
    transmission: "Automatic",
    pricePerDay: 70,
    location: "New York",
    description: "A fuel-efficient hybrid hatchback with practical cargo access, calm driving manners, and excellent city mileage.",
    isAvaliable: true,
    manualUnavailableDates: [],
  },
  {
    brand: "Honda",
    model: "Fit",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/2017_Honda_Jazz_EX_Navi_i-VTEC_CVT_1.3_Front.jpg/800px-2017_Honda_Jazz_EX_Navi_i-VTEC_CVT_1.3_Front.jpg",
    year: 2019,
    category: "Hatchback",
    seating_capacity: 5,
    fuel_type: "Petrol",
    transmission: "Automatic",
    pricePerDay: 53,
    location: "Los Angeles",
    description: "A small hatchback with flexible interior space, easy maneuverability, and low running costs for short rental trips.",
    isAvaliable: true,
    manualUnavailableDates: [],
  },
];

const seedCars = async () => {
  await connectDB();

  if (mongoose.connection.readyState !== 1) {
    console.log(
      "Unable to connect to MongoDB. Please check MONGODB_URI and database network access before seeding cars.",
    );
    await mongoose.disconnect();
    process.exit(1);
  }

  const admin = await User.findOne({ role: "admin" }).select("_id name email");

  if (!admin) {
    console.log("Please create an admin user before seeding cars.");
    await mongoose.disconnect();
    process.exit(1);
  }

  validateSeedImages(seededCars);

  let createdCount = 0;
  let updatedCount = 0;

  for (const car of seededCars) {
    const { manualUnavailableDates, ...carFields } = car;
    const result = await Car.updateOne(
      {
        owner: admin._id,
        brand: car.brand,
        model: car.model,
      },
      {
        $set: {
          ...carFields,
          owner: admin._id,
        },
        $setOnInsert: {
          manualUnavailableDates: manualUnavailableDates || [],
        },
      },
      { upsert: true },
    );

    if (result.upsertedCount > 0) {
      createdCount += 1;
    } else if (result.modifiedCount > 0 || result.matchedCount > 0) {
      updatedCount += 1;
    }
  }

  console.log(`Upserted ${seededCars.length} cars for the current database.`);
  console.log(`Created ${createdCount} new cars.`);
  console.log(`Updated ${updatedCount} existing cars without changing their IDs.`);
  console.log("Cities used: New York, Los Angeles, Houston, Chicago.");

  await mongoose.disconnect();
};

seedCars().catch(async (error) => {
  console.error(error.message);
  await mongoose.disconnect();
  process.exit(1);
});
