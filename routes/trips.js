const express = require('express');
const Trip = require('../models/Trip');
const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all trips (Admin and Travel Admin)
router.get('/', auth, authorize(['company-admin', 'travel-admin']), async (req, res) => {
  try {
    const { status, date, driverId } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      filter.scheduledDate = { $gte: startDate, $lt: endDate };
    }
    if (driverId) filter.driverId = driverId;

    const trips = await Trip.find(filter)
      .populate('driverId', 'name email')
      .populate('vehicleId', 'name numberPlate')
      .populate('employees.employeeId', 'name email')
      .sort({ scheduledDate: -1, scheduledStartTime: 1 });

    res.json(trips);
  } catch (error) {
    console.error('Get trips error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get trips by driver ID
router.get('/driver/:driverId', auth, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { driverId: req.params.driverId };
    
    if (status) filter.status = status;

    const trips = await Trip.find(filter)
      .populate('vehicleId', 'name numberPlate')
      .populate('employees.employeeId', 'name email')
      .sort({ scheduledDate: -1, scheduledStartTime: 1 });

    res.json(trips);
  } catch (error) {
    console.error('Get driver trips error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get trips by employee ID
router.get('/employee/:employeeId', auth, async (req, res) => {
  try {
    const trips = await Trip.find({ 'employees.employeeId': req.params.employeeId })
      .populate('driverId', 'name email')
      .populate('vehicleId', 'name numberPlate')
      .sort({ scheduledDate: -1, scheduledStartTime: 1 });

    res.json(trips);
  } catch (error) {
    console.error('Get employee trips error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create trip (Travel Admin)
router.post('/', auth, authorize(['travel-admin']), async (req, res) => {
  try {
    const trip = new Trip(req.body);
    await trip.save();
    
    const populatedTrip = await Trip.findById(trip._id)
      .populate('driverId', 'name email')
      .populate('vehicleId', 'name numberPlate')
      .populate('employees.employeeId', 'name email');

    res.status(201).json(populatedTrip);
  } catch (error) {
    console.error('Create trip error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update trip (Travel Admin)
router.put('/:id', auth, authorize(['travel-admin']), async (req, res) => {
  try {
    const trip = await Trip.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('driverId', 'name email')
     .populate('vehicleId', 'name numberPlate')
     .populate('employees.employeeId', 'name email');

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    res.json(trip);
  } catch (error) {
    console.error('Update trip error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Start trip (Driver)
router.put('/:id/start', auth, authorize(['driver']), async (req, res) => {
  try {
    const trip = await Trip.findOneAndUpdate(
      { _id: req.params.id, driverId: req.user._id },
      { 
        status: 'Started',
        actualStartTime: new Date()
      },
      { new: true }
    ).populate('vehicleId', 'name numberPlate')
     .populate('employees.employeeId', 'name email');

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found or not assigned to you' });
    }

    res.json(trip);
  } catch (error) {
    console.error('Start trip error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update employee pickup status
router.put('/:id/pickup/:employeeId', auth, authorize(['driver']), async (req, res) => {
  try {
    const trip = await Trip.findOneAndUpdate(
      { 
        _id: req.params.id, 
        driverId: req.user._id,
        'employees.employeeId': req.params.employeeId
      },
      { 
        'employees.$.status': 'Picked',
        'employees.$.pickupTime': new Date(),
        status: 'In Progress'
      },
      { new: true }
    ).populate('vehicleId', 'name numberPlate')
     .populate('employees.employeeId', 'name email');

    if (!trip) {
      return res.status(404).json({ message: 'Trip or employee not found' });
    }

    res.json(trip);
  } catch (error) {
    console.error('Pickup employee error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update employee drop status
router.put('/:id/drop/:employeeId', auth, authorize(['driver']), async (req, res) => {
  try {
    const trip = await Trip.findOneAndUpdate(
      { 
        _id: req.params.id, 
        driverId: req.user._id,
        'employees.employeeId': req.params.employeeId
      },
      { 
        'employees.$.status': 'Dropped',
        'employees.$.dropTime': new Date()
      },
      { new: true }
    ).populate('vehicleId', 'name numberPlate')
     .populate('employees.employeeId', 'name email');

    if (!trip) {
      return res.status(404).json({ message: 'Trip or employee not found' });
    }

    // Check if all employees are dropped
    const allDropped = trip.employees.every(emp => emp.status === 'Dropped');
    if (allDropped) {
      trip.status = 'Completed';
      trip.actualEndTime = new Date();
      await trip.save();
    }

    res.json(trip);
  } catch (error) {
    console.error('Drop employee error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update driver location
router.put('/:id/location', auth, authorize(['driver']), async (req, res) => {
  try {
    const { lat, lng, speed } = req.body;
    
    const trip = await Trip.findOneAndUpdate(
      { _id: req.params.id, driverId: req.user._id },
      { 
        currentLocation: {
          lat,
          lng,
          timestamp: new Date()
        },
        $push: {
          locationHistory: {
            lat,
            lng,
            timestamp: new Date(),
            speed: speed || 0
          }
        }
      },
      { new: true }
    ).populate('vehicleId', 'name numberPlate')
     .populate('employees.employeeId', 'name email');

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found or not assigned to you' });
    }

    res.json(trip);
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Calculate and update trip distance
router.put('/:id/distance', auth, authorize(['driver']), async (req, res) => {
  try {
    const { totalDistance, completedDistance } = req.body;
    
    const trip = await Trip.findOneAndUpdate(
      { _id: req.params.id, driverId: req.user._id },
      { 
        totalDistance,
        completedDistance
      },
      { new: true }
    );

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    res.json(trip);
  } catch (error) {
    console.error('Update distance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get live trips
router.get('/live', auth, authorize(['company-admin', 'travel-admin']), async (req, res) => {
  try {
    const liveTrips = await Trip.find({ 
      status: { $in: ['Started', 'In Progress'] }
    })
    .populate('driverId', 'name email')
    .populate('vehicleId', 'name numberPlate')
    .populate('employees.employeeId', 'name email')
    .sort({ actualStartTime: -1 });

    res.json(liveTrips);
  } catch (error) {
    console.error('Get live trips error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Generate trip report (PDF)
router.get('/:id/report', auth, async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id)
      .populate('driverId', 'name email')
      .populate('vehicleId', 'name numberPlate')
      .populate('employees.employeeId', 'name email');

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Generate PDF report (simplified version)
    const reportData = {
      tripId: trip._id,
      tripName: trip.tripName,
      driver: trip.driverId.name,
      vehicle: `${trip.vehicleId.name} (${trip.vehicleId.numberPlate})`,
      scheduledDate: trip.scheduledDate,
      actualStartTime: trip.actualStartTime,
      actualEndTime: trip.actualEndTime,
      totalDistance: trip.totalDistance,
      employees: trip.employees.map(emp => ({
        name: emp.employeeId.name,
        pickupLocation: emp.pickupLocation.address,
        dropLocation: emp.dropLocation.address,
        pickupTime: emp.pickupTime,
        dropTime: emp.dropTime,
        status: emp.status
      })),
      status: trip.status
    };

    res.json({
      message: 'Trip report generated',
      data: reportData,
      downloadUrl: `/api/trips/${trip._id}/download-pdf`
    });
  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Export trips data
router.get('/export', auth, authorize(['company-admin', 'travel-admin']), async (req, res) => {
  try {
    const { format, startDate, endDate, status } = req.query;
    
    const filter = {};
    if (startDate && endDate) {
      filter.scheduledDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    if (status) filter.status = status;

    const trips = await Trip.find(filter)
      .populate('driverId', 'name email')
      .populate('vehicleId', 'name numberPlate')
      .populate('employees.employeeId', 'name email')
      .sort({ scheduledDate: -1 });

    const exportData = trips.map(trip => ({
      tripId: trip._id,
      tripName: trip.tripName,
      driver: trip.driverId.name,
      vehicle: `${trip.vehicleId.name} (${trip.vehicleId.numberPlate})`,
      scheduledDate: trip.scheduledDate,
      scheduledStartTime: trip.scheduledStartTime,
      actualStartTime: trip.actualStartTime,
      actualEndTime: trip.actualEndTime,
      totalDistance: trip.totalDistance,
      employeeCount: trip.employees.length,
      status: trip.status,
      duration: trip.actualDuration || 0
    }));

    res.json({
      message: 'Export data prepared',
      format: format || 'json',
      count: exportData.length,
      data: exportData
    });
  } catch (error) {
    console.error('Export trips error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete trip (Travel Admin only)
router.delete('/:id', auth, authorize(['travel-admin']), async (req, res) => {
  try {
    const trip = await Trip.findByIdAndDelete(req.params.id);
    
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }
    
    res.json({ message: 'Trip deleted successfully' });
  } catch (error) {
    console.error('Delete trip error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;