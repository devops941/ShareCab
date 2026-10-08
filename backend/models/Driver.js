const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  carModel: { type: String, required: true },
  vehicleNumber: { type: String, required: true },
  license: { type: String, required: true },
  insurance: { type: String, required: true },
  profileImage: { type: String, default: '' },
  carImage: { type: String, default: '' },
  role: { type: String, default: 'driver' }
}, { timestamps: true });

module.exports = mongoose.model('Driver', driverSchema);
