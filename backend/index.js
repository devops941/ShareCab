const cors = require('cors');
const express = require('express');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const tripRoutes = require('./routes/tripRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = require('./config/db');
connectDB();

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(cors());
app.use(express.json());

// Basic health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'Server is running' });
});

// API Routes
app.use('/api', authRoutes);
app.use('/api/trip', tripRoutes);
app.use('/api/notifications', notificationRoutes);

// Start the server
app.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}`);
});
