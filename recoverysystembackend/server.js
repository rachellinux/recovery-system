const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const courseRoutes = require('./routes/courseRoutes');
const productRoutes = require('./routes/productRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const orderRoutes = require('./routes/orderRoutes');
const swaggerUI = require('swagger-ui-express');
const swaggerDocs = require('./config/swagger');
const errorHandler = require('./middleware/error');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// CORS Configuration
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json());

// Enhanced Morgan logging
morgan.token('body', (req) => JSON.stringify(req.body));
morgan.token('error', (req, res) => res.locals.error);

// Custom morgan format to log detailed request/response info
app.use(morgan(':method :url :status :response-time ms - :res[content-length] :body - :error'));

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Production logging
if (process.env.NODE_ENV === 'production') {
  // Create a write stream for logging to a file
  const fs = require('fs');
  const path = require('path');
  const accessLogStream = fs.createWriteStream(
    path.join(__dirname, 'access.log'),
    { flags: 'a' }
  );
  app.use(morgan('combined', { stream: accessLogStream }));
}

// API Documentation
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocs));

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/products', productRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', require('./routes/cartRoutes'));

// Error handler
app.use(errorHandler);

// Add this before your routes
app.get('/api', (req, res) => {
  res.json({ message: 'Backend API is running' });
});

// Add this before your routes to test the API
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working' });
});

// Update your courses route to include error handling
app.use('/api/courses', courseRoutes);

// Add global error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 