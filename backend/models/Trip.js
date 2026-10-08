const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  from: { type: String, required: true },
  to: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  seats: { type: Number, required: true },
  amount: { type: Number, required: true },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true },
  passengers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Customer' }],
  cancellationFees: { type: Number, default: 0 },
  status: { type: String, enum: ['upcoming', 'inprogress', 'completed', 'cancelled'], default: 'upcoming' },
  active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Trip', tripSchema);
