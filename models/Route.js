const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  pickupPoints: [{
    name: String,
    address: String,
    lat: Number,
    lng: Number,
    order: Number
  }],
  dropPoints: [{
    name: String,
    address: String,
    lat: Number,
    lng: Number,
    order: Number
  }],
  assignedDrivers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'rsrapp-User'
  }],
  assignedVehicles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'rsrapp-Vehicle'
  }],
  schedule: {
    days: [{
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    }],
    startTime: String,
    endTime: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  estimatedDuration: Number, // in minutes
  estimatedDistance: Number // in kilometers
}, {
  timestamps: true
});

module.exports = mongoose.model('rsrapp-Route', routeSchema);