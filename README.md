# DriveSphere — MERN Car Rental Platform

DriveSphere is a full-stack car rental platform built with the MERN stack. It includes public car browsing, a complete booking flow, user accounts, an admin dashboard, ImageKit image upload, reviews, notifications, booking conversation, and car availability management.

## Tech Stack

### Frontend

- React
- Vite
- Tailwind CSS
- Axios
- React Router

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT authentication
- bcrypt
- ImageKit

## Main Features

### Public and User Features

- Browse cars
- Search, filter, and sort cars
- Pagination
- View car details
- Save favorite cars
- Register and log in
- Book a car
- Edit booking details
- Cancel booking
- Booking conversation
- Notifications
- Leave car reviews after booking

### Admin Features

- Admin dashboard
- Manage cars
- Add, edit, and remove cars
- Upload car images
- Manage car availability calendar
- Manage bookings
- Update booking status
- Communicate with customers
- Receive booking notifications

## Project Structure

```text
CarRental-fullstack/
├── client/                 React and Vite frontend application
│   ├── public/             Static public assets
│   └── src/                Frontend source code
│       ├── assets/         Images, icons, and shared static assets
│       ├── components/     Reusable UI components
│       ├── context/        App-wide React context and Axios setup
│       └── pages/          Route-level pages for users and admins
├── server/                 Node.js and Express backend application
│   ├── configs/            Database and third-party service config
│   ├── controllers/        Route handlers and business logic
│   ├── middleware/         Auth, role, and upload middleware
│   ├── models/             Mongoose database models
│   ├── routes/             Express API routes
│   └── scripts/            Maintenance and data scripts
└── README.md
```

## Environment Variables

Real `.env` files should not be committed. Use the example files as templates:

- `client/.env.example`
- `server/.env.example`

Copy each example file to `.env` in the same folder and replace placeholder values with your local or production configuration.

## Installation

### Prerequisites

- Node.js
- npm
- MongoDB database, local or MongoDB Atlas
- ImageKit account

### Backend

```bash
cd server
npm install
npm run start
```

By default, the backend listens on `http://localhost:3000` unless `PORT` is set.

### Frontend

Open a second terminal:

```bash
cd client
npm install
npm run dev
```

By default, Vite serves the frontend at `http://localhost:5173`.

## Local Development Setup

1. Create `server/.env` from `server/.env.example`.
2. Create `client/.env` from `client/.env.example`.
3. Install dependencies in both `server/` and `client/`.
4. Start the backend from `server/`.
5. Start the frontend from `client/`.
6. Open the frontend URL in the browser.

## Environment Notes

### Server

The backend expects:

- `PORT`
- `MONGODB_URI`
- `JWT_SECRET`
- `IMAGEKIT_PUBLIC_KEY`
- `IMAGEKIT_PRIVATE_KEY`
- `IMAGEKIT_URL_ENDPOINT`

The database config appends the `drivesphere` database name to `MONGODB_URI`, so use a MongoDB connection base URI in the example format.

### Client

The frontend reads the API base URL from:

- `VITE_BASE_URL`
- `VITE_BACKEND_URL`
- `VITE_API_URL`

`VITE_BASE_URL` is the preferred variable. The other two are supported fallback names. The frontend also reads `VITE_CURRENCY` for displaying prices.

## Available Scripts

### Backend Scripts

```bash
npm run start
```

Starts the backend with Node.

```bash
npm run server
```

Starts the backend with Nodemon for development.

```bash
npm run seed:cars
```

Seeds car data. Use this only when intentionally resetting or adding seed data.

```bash
npm run backfill:booking-numbers
```

Backfills booking numbers for existing booking records.

### Frontend Scripts

```bash
npm run dev
```

Starts the Vite development server.

```bash
npm run build
```

Builds the frontend for production.

```bash
npm run preview
```

Serves the production build locally.

```bash
npm run lint
```

Runs ESLint.

## API Overview

The backend exposes REST API routes under:

- `/api/user`
- `/api/admin`
- `/api/bookings`
- `/api/notifications`
- `/api/reviews`

Protected routes require a valid JWT token. Admin routes also require the authenticated user to have the admin role.

## Image Uploads

DriveSphere uses ImageKit for uploaded images, including car images, profile images, and booking conversation attachments. Configure ImageKit credentials in `server/.env`.

## Deployment Notes

### Frontend

- Set the project root to `client/`.
- Use `npm run build`.
- Serve the `dist/` output directory.
- Configure `VITE_BASE_URL` to point to the deployed backend API.

### Backend

- Set the project root to `server/`.
- Use `npm run start`.
- Configure all required server environment variables.
- Ensure the deployed backend can connect to MongoDB and ImageKit.

## Important Development Notes

- Do not commit real `.env` files.
- Keep ImageKit private keys secret.
- Keep `JWT_SECRET` secret.
- Do not run seed scripts unless you intentionally want to modify seed data.
- Make sure frontend `VITE_BASE_URL` points to the backend server that is currently running.

## License

This project is provided for educational and portfolio use. Add a project-specific license before public or commercial distribution.
