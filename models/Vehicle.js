const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  numberPlate: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  capacity: {
    type: Number,
    required: true,
    min: 1,
    max: 50
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'rsrapp-User'
  },
  status: {
    type: String,
    enum: ['active', 'maintenance', 'inactive'],
    default: 'active'
  },
  specifications: {
    make: String,
    model: String,
    year: Number,
    fuelType: {
      type: String,
      enum: ['petrol', 'diesel', 'electric', 'hybrid'],
      default: 'petrol'
    },
    mileage: Number
  },
  maintenance: {
    lastServiceDate: Date,
    nextServiceDate: Date,
    totalDistance: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Index for efficient queries
vehicleSchema.index({ status: 1, driverId: 1 });

module.exports = mongoose.model('rsrapp-Vehicle', vehicleSchema);