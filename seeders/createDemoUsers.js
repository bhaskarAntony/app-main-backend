const mongoose = require('mongoose');
const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
require('dotenv').config();

const demoUsers = [
  {
    name: 'John Admin',
    email: 'admin@company.com',
    password: 'admin123',
    role: 'company-admin'
  },
  {
    name: 'Sarah Travel',
    email: 'travel@company.com',
    password: 'travel123',
    role: 'travel-admin'
  },
  {
    name: 'Mike Driver',
    email: 'driver@company.com',
    password: 'driver123',
    role: 'driver'
  },
  {
    name: 'Alice Employee',
    email: 'employee@company.com',
    password: 'employee123',
    role: 'employee'
  }
];

const demoVehicles = [
  {
    name: 'Toyota Innova',
    numberPlate: 'KA05MN1234',
    capacity: 7,
    status: 'active',
    specifications: {
      make: 'Toyota',
      model: 'Innova',
      year: 2022,
      fuelType: 'diesel',
      mileage: 15
    }
  },
  {
    name: 'Honda City',
    numberPlate: 'KA01AB5678',
    capacity: 4,
    status: 'active',
    specifications: {
      make: 'Honda',
      model: 'City',
      year: 2021,
      fuelType: 'petrol',
      mileage: 18
    }
  }
];

async function createDemoData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Vehicle.deleteMany({});

    // Create demo users
    const users = await User.insertMany(demoUsers);
    console.log('Demo users created:', users.length);

    // Find the driver
    const driver = users.find(user => user.role === 'driver');

    // Create demo vehicles and assign to driver
    const vehiclesWithDriver = demoVehicles.map(vehicle => ({
      ...vehicle,
      driverId: driver._id
    }));

    const vehicles = await Vehicle.insertMany(vehiclesWithDriver);
    console.log('Demo vehicles created:', vehicles.length);

    // Update driver with assigned vehicle
    await User.findByIdAndUpdate(driver._id, {
      assignedVehicle: vehicles[0]._id
    });

    console.log('Demo data creation completed successfully!');
    console.log('\nDemo Login Credentials:');
    console.log('Company Admin: admin@company.com / admin123');
    console.log('Travel Admin: travel@company.com / travel123');
    console.log('Driver: driver@company.com / driver123');
    console.log('Employee: employee@company.com / employee123');

    process.exit(0);
  } catch (error) {
    console.error('Error creating demo data:', error);
    process.exit(1);
  }
}

createDemoData();