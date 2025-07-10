require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const expenseRoutes = require('./routes/expenseRoutes'); // For your budget features
const groupRoutes = require('./routes/groupRoutes'); // For group management
const { notFound, errorHandler } = require('./middlewares/errorMiddleware');
const dashboardRoutes = require('./routes/dashboardRoutes');

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Security Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});
app.use(limiter);

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/groups', groupRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test route
app.get('/', (req, res) => {
  res.send('BudgetTracker API Running');
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);


app.use('/api/dashboard', dashboardRoutes);

const profileRoutes = require('./routes/profileRoutes');
app.use('/api/profile', profileRoutes);

// Server configuration
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});

module.exports = app; // For testing purposes