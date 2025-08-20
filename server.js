const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const socketIo = require('socket.io');
const http = require('http');
const setupSwagger = require('./swagger');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const vehicleRoutes = require('./routes/vehicles');
const tripRoutes = require('./routes/trips');
const routeRoutes = require('./routes/routes');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Setup Swagger Documentation
setupSwagger(app);

// Basic API info route
app.get('/api', (req, res) => {
  res.json({
    message: 'Company Cab Management System API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      vehicles: '/api/vehicles',
      trips: '/api/trips',
      routes: '/api/routes'
    }
  });
});

// Connect to MongoDB
mongoose.connect('mongodb+srv://bhaskarAntoty123:bhaskar3958@bhaskarantony.wagpkay.mongodb.net/?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Wait for MongoDB connection before starting server
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected');
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/routes', routeRoutes);

// Socket.IO for real-time updates
const activeDrivers = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Handle driver joining
  socket.on('driverJoin', (driverId) => {
    activeDrivers.set(driverId, socket.id);
    console.log(`Driver ${driverId} joined`);
  });

  // Handle driver location updates
  socket.on('driverLocationUpdate', (data) => {
    // Broadcast to all connected clients every 4 seconds
    io.emit('driverLocationUpdate', data);
    console.log(`Location update from driver ${data.driverId}`);
  });

  // Handle trip status updates
  socket.on('tripStatusUpdate', (data) => {
    io.emit('tripStatusUpdate', data);
    console.log(`Trip status update: ${data.status}`);
  });

  // Handle trip assignments
  socket.on('tripAssigned', (data) => {
    io.emit('tripAssigned', data);
    console.log(`Trip assigned to driver ${data.driverId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // Remove driver from active list
    for (const [driverId, socketId] of activeDrivers.entries()) {
      if (socketId === socket.id) {
        activeDrivers.delete(driverId);
        console.log(`Driver ${driverId} disconnected`);
        break;
      }
    }
  });
});

// Send location update requests every 4 seconds for active trips
setInterval(() => {
  io.emit('requestLocationUpdate');
}, 4000); // Every 4 seconds as requested

// Broadcast driver locations every 2 seconds for smoother tracking
setInterval(() => {
  // Get all active drivers and broadcast their locations
  for (const [driverId, socketId] of activeDrivers.entries()) {
    io.emit('requestDriverLocation', { driverId });
  }
}, 2000);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});