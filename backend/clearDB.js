const mongoose = require('mongoose');
const Customer = require('./models/Customer');
const Driver = require('./models/Driver');
const Trip = require('./models/Trip');
require('dotenv').config();

const clearDB = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URL);
    console.log('Connected to DB');

    await Customer.deleteMany({});
    console.log('Cleared Customers');

    await Driver.deleteMany({});
    console.log('Cleared Drivers');

    await Trip.deleteMany({});
    console.log('Cleared Trips');

    console.log('Database completely cleared!');
    process.exit(0);
  } catch (error) {
    console.error('Error clearing DB', error);
    process.exit(1);
  }
};

clearDB();
