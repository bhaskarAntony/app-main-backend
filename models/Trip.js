const mongoose = require('mongoose');

const employeePickupSchema = {
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'rsrapp-User',
    required: true
  },
  pickupLocation: {
    address: String,
    lat: Number,
    lng: Number,
    name: String
  },
  dropLocation: {
    address: String,
    lat: Number,
    lng: Number,
    name: String
  },
  pickupTime: Date,
  dropTime: Date,
  status: {
    type: String,
    enum: ['Pending', 'Picked', 'Dropped'],
    default: 'Pending'
  }
};

const tripSchema = new mongoose.Schema({
  tripName: {
    type: String,
    required: true
  },
  routeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'rsrapp-Route'
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'rsrapp-User',
    required: true
  },
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'rsrapp-Vehicle',
    required: true
  },
  employees: [employeePickupSchema],
  startLocation: {
    address: String,
    lat: Number,
    lng: Number,
    name: String
  },
  endLocation: {
    address: String,
    lat: Number,
    lng: Number,
    name: String
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  scheduledStartTime: {
    type: String,
    required: true
  },
  scheduledEndTime: {
    type: String,
    required: true
  },
  actualStartTime: Date,
  actualEndTime: Date,
  status: {
    type: String,
    enum: ['Scheduled', 'Started', 'In Progress', 'Completed', 'Cancelled'],
    default: 'Scheduled'
  },
  currentLocation: {
    lat: Number,
    lng: Number,
    timestamp: Date
  },
  totalDistance: {
    type: Number,
    default: 0
  },
  completedDistance: {
    type: Number,
    default: 0
  },
  estimatedDuration: Number,
  actualDuration: Number,
  notes: String,
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringDays: [{
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  }],
  locationHistory: [{
    lat: Number,
    lng: Number,
    timestamp: Date,
    speed: Number
  }]
}, {
  timestamps: true
});

tripSchema.index({ driverId: 1, scheduledDate: -1 });
tripSchema.index({ status: 1, scheduledDate: 1 });
tripSchema.index({ 'employees.employeeId': 1 });

module.exports = mongoose.model('rsrapp-Trip', tripSchema);