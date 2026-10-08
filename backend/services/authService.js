const Customer = require('../models/Customer');
const Driver = require('../models/Driver');

const createCustomer = async (customerData) => {
  const newCustomer = new Customer(customerData);
  await newCustomer.save();
  return newCustomer;
};

const createDriver = async (driverData) => {
  const newDriver = new Driver(driverData);
  await newDriver.save();
  return newDriver;
};

const loginCustomer = async (phone, password) => {
  return await Customer.findOne({ phone, password });
};

const loginDriver = async (phone, password) => {
  return await Driver.findOne({ phone, password });
};

const getProfile = async (userId, role) => {
  const isDriver = (role || '').toLowerCase() === 'driver';
  let user = isDriver 
    ? await Driver.findById(userId).select('-password')
    : await Customer.findById(userId).select('-password');
  
  // Fallback check if role wasn't matching
  if (!user) {
    user = isDriver
      ? await Customer.findById(userId).select('-password')
      : await Driver.findById(userId).select('-password');
  }
  return user;
};

const updateProfile = async (userId, role, updateData) => {
  const isDriver = (role || '').toLowerCase() === 'driver';
  let user = isDriver
    ? await Driver.findByIdAndUpdate(userId, updateData, { new: true }).select('-password')
    : await Customer.findByIdAndUpdate(userId, updateData, { new: true }).select('-password');

  if (!user) {
    user = isDriver
      ? await Customer.findByIdAndUpdate(userId, updateData, { new: true }).select('-password')
      : await Driver.findByIdAndUpdate(userId, updateData, { new: true }).select('-password');
  }
  return user;
};

module.exports = {
  createCustomer,
  createDriver,
  loginCustomer,
  loginDriver,
  getProfile,
  updateProfile
};
