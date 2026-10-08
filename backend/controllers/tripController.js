const Trip = require('../models/Trip');
const Driver = require('../models/Driver');
const Customer = require('../models/Customer');
const Notification = require('../models/Notification');

// Driver publishes a trip
const publishTrip = async (req, res) => {
  try {
    let { from, to, date, time, seats, amount, driverId } = req.body;
    
    if (!driverId) {
      const defaultDriver = await Driver.findOne();
      if (defaultDriver) driverId = defaultDriver._id;
    }

    if (!from || !to || !date || !time || !seats || !amount || !driverId) {
      return res.status(400).json({ error: 'All fields including driverId are required.' });
    }

    const newTrip = new Trip({ from, to, date, time, seats, amount, driverId });
    await newTrip.save();

    // Create in-app notification for the Driver
    await Notification.create({
      userId: driverId,
      userModel: 'Driver',
      title: 'Trip Published! 🚗',
      body: `Your trip from ${from} to ${to} on ${date} at ${time} is now live.`
    });
    
    res.status(201).json({ message: 'Trip published successfully', trip: newTrip });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Customer books a trip
const bookTrip = async (req, res) => {
  try {
    const { tripId, customerId, seatsToBook = 1 } = req.body;
    
    if (!tripId || !customerId) {
      return res.status(400).json({ error: 'tripId and customerId are required.' });
    }

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found.' });
    }
    if (trip.seats < seatsToBook) {
      return res.status(400).json({ error: `Only ${trip.seats} seats available.` });
    }

    // Add passenger and decrement available seats
    for (let i = 0; i < seatsToBook; i++) {
      trip.passengers.push(customerId);
    }
    trip.seats -= seatsToBook; 
    await trip.save();

    const customer = await Customer.findById(customerId);
    const driver = await Driver.findById(trip.driverId);

    // Notify Driver
    if (driver) {
      await Notification.create({
        userId: driver._id,
        userModel: 'Driver',
        title: 'New Booking! 🎟️',
        body: `${customer?.name || 'A rider'} booked ${seatsToBook} seat(s) for your trip to ${trip.to}.`
      });
    }

    // Notify Customer
    await Notification.create({
      userId: customerId,
      userModel: 'Customer',
      title: 'Booking Confirmed! 🎉',
      body: `You booked ${seatsToBook} seat(s) from ${trip.from} to ${trip.to} on ${trip.date}.`
    });

    res.status(200).json({ message: 'Trip booked successfully', trip });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all trips (for customers to browse)
const getAllTrips = async (req, res) => {
  try {
    const trips = await Trip.find({ active: true })
      .populate('driverId', 'name phone carModel vehicleNumber carImage profileImage')
      .sort({ createdAt: -1 });
    res.status(200).json(trips);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get trips created by a specific driver
const getTripsByDriver = async (req, res) => {
  try {
    const { driverId } = req.params;
    const trips = await Trip.find({ driverId })
      .populate('driverId', 'name phone carModel vehicleNumber carImage profileImage')
      .populate('passengers', 'name phone profileImage')
      .sort({ createdAt: -1 });
    res.status(200).json(trips);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get trips booked by a specific customer
const getTripsByCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;
    const trips = await Trip.find({ passengers: customerId })
      .populate('driverId', 'name phone carModel vehicleNumber carImage profileImage')
      .sort({ createdAt: -1 });
    res.status(200).json(trips);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update trip status
const updateTripStatus = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { status } = req.body;

    if (!['upcoming', 'inprogress', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found.' });
    }

    // If trying to start the ride
    if (status === 'inprogress') {
      const activeTrip = await Trip.findOne({ driverId: trip.driverId, status: 'inprogress' });
      if (activeTrip) {
        return res.status(400).json({ error: 'You already have a trip in progress. Complete it first.' });
      }
    }

    trip.status = status;
    await trip.save();

    const uniquePassengers = [...new Set(trip.passengers.map(p => p.toString()))];

    if (status === 'inprogress') {
      // Driver notification
      await Notification.create({
        userId: trip.driverId,
        userModel: 'Driver',
        title: 'Trip Started 🚀',
        body: `Your trip from ${trip.from} to ${trip.to} is now in progress. Drive safe!`
      });

      // Passengers notification
      for (const pId of uniquePassengers) {
        await Notification.create({
          userId: pId,
          userModel: 'Customer',
          title: 'Trip Started 🚀',
          body: `Your ride to ${trip.to} has started. Have a safe journey!`
        });
      }
    } else if (status === 'completed') {
      // Driver notification
      await Notification.create({
        userId: trip.driverId,
        userModel: 'Driver',
        title: 'Trip Completed ✅',
        body: `You successfully completed the trip from ${trip.from} to ${trip.to}.`
      });

      // Passengers notification
      for (const pId of uniquePassengers) {
        await Notification.create({
          userId: pId,
          userModel: 'Customer',
          title: 'Trip Completed ✅',
          body: `Your trip to ${trip.to} has finished. Thank you for riding with ShareCab!`
        });
      }
    }

    res.status(200).json({ message: `Trip status updated to ${status}`, trip });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Edit a trip
const editTrip = async (req, res) => {
  try {
    const { tripId } = req.params;
    const updates = req.body;
    
    const trip = await Trip.findByIdAndUpdate(tripId, updates, { new: true });
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found.' });
    }

    // Notify Driver
    await Notification.create({
      userId: trip.driverId,
      userModel: 'Driver',
      title: 'Trip Updated ✏️',
      body: `Your trip to ${trip.to} was successfully updated.`
    });

    // Notify all passengers
    const uniquePassengers = [...new Set(trip.passengers.map(p => p.toString()))];
    for (const pId of uniquePassengers) {
      await Notification.create({
        userId: pId,
        userModel: 'Customer',
        title: 'Trip Details Updated ℹ️',
        body: `The driver updated details for the trip to ${trip.to}.`
      });
    }
    
    res.status(200).json({ message: 'Trip updated successfully', trip });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete (Cancel) a trip
const deleteTrip = async (req, res) => {
  try {
    const { tripId } = req.params;
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found.' });
    }
    
    trip.status = 'cancelled';
    await trip.save();

    // Notify Driver
    await Notification.create({
      userId: trip.driverId,
      userModel: 'Driver',
      title: 'Trip Cancelled ❌',
      body: `You cancelled the trip from ${trip.from} to ${trip.to}.`
    });
    
    // Notify all passengers
    const uniquePassengers = [...new Set(trip.passengers.map(p => p.toString()))];
    for (const pId of uniquePassengers) {
      await Notification.create({
        userId: pId,
        userModel: 'Customer',
        title: 'Trip Cancelled by Driver ❌',
        body: `The driver cancelled the trip to ${trip.to}. Your seat is released.`
      });
    }
    
    res.status(200).json({ message: 'Trip cancelled successfully', trip });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Cancel a booking
const cancelBooking = async (req, res) => {
  try {
    const { tripId, customerId } = req.body;
    
    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ error: 'Trip not found.' });
    
    if (trip.status && trip.status !== 'upcoming') {
      return res.status(400).json({ error: `Cannot cancel booking for a trip that is ${trip.status}.` });
    }
    
    // Count how many seats the customer booked
    let bookedSeats = 0;
    const newPassengers = [];
    for (const pid of trip.passengers) {
      if (pid.toString() === customerId) {
        bookedSeats++;
      } else {
        newPassengers.push(pid);
      }
    }
    
    if (bookedSeats === 0) return res.status(400).json({ error: 'No booking found for this user.' });
    
    // Apply 50% cancellation fee for all booked seats
    const fee = bookedSeats * trip.amount * 0.5;
    trip.cancellationFees = (trip.cancellationFees || 0) + fee;
    
    trip.passengers = newPassengers;
    trip.seats += bookedSeats; // Restore available seats
    await trip.save();
    
    // Notify Driver
    const driver = await Driver.findById(trip.driverId);
    if (driver) {
      await Notification.create({
        userId: driver._id,
        userModel: 'Driver',
        title: 'Booking Cancelled ⚠️',
        body: `A passenger cancelled their booking for ${bookedSeats} seat(s) on your trip to ${trip.to}.`
      });
    }

    // Notify Customer
    await Notification.create({
      userId: customerId,
      userModel: 'Customer',
      title: 'Booking Cancelled ❌',
      body: `You cancelled ${bookedSeats} seat(s) for the trip to ${trip.to}.`
    });
    
    res.status(200).json({ message: 'Booking cancelled successfully', trip });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update booking seats
const updateBooking = async (req, res) => {
  try {
    const { tripId, customerId, newSeats } = req.body;
    
    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ error: 'Trip not found.' });
    
    if (trip.status && trip.status !== 'upcoming') {
      return res.status(400).json({ error: `Cannot update booking for a trip that is ${trip.status}.` });
    }
    
    let bookedSeats = 0;
    const otherPassengers = [];
    for (const pid of trip.passengers) {
      if (pid.toString() === customerId) {
        bookedSeats++;
      } else {
        otherPassengers.push(pid);
      }
    }
    
    if (bookedSeats === 0) return res.status(400).json({ error: 'No booking found for this user.' });
    
    const diff = newSeats - bookedSeats;
    if (diff > trip.seats) {
      return res.status(400).json({ error: `Only ${trip.seats} seats available.` });
    }
    
    // If reducing seats, apply 50% cancellation fee for the removed seats
    if (diff < 0) {
      const fee = Math.abs(diff) * trip.amount * 0.5;
      trip.cancellationFees = (trip.cancellationFees || 0) + fee;
    }
    
    trip.passengers = otherPassengers;
    for (let i = 0; i < newSeats; i++) {
      trip.passengers.push(customerId);
    }
    trip.seats -= diff;
    await trip.save();

    // Notify Driver
    const driver = await Driver.findById(trip.driverId);
    if (driver) {
      await Notification.create({
        userId: driver._id,
        userModel: 'Driver',
        title: 'Booking Modified 🔄',
        body: `A passenger modified their booking to ${newSeats} seat(s) on your trip to ${trip.to}.`
      });
    }

    // Notify Customer
    await Notification.create({
      userId: customerId,
      userModel: 'Customer',
      title: 'Booking Modified 🔄',
      body: `Your booking for trip to ${trip.to} was updated to ${newSeats} seat(s).`
    });
    
    res.status(200).json({ message: 'Booking updated successfully', trip });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get driver earnings
const getDriverEarnings = async (req, res) => {
  try {
    const { driverId } = req.params;
    const trips = await Trip.find({ driverId });
    
    let totalEarnings = 0;
    let dailyEarnings = {};
    let monthlyEarnings = {};
    let yearlyEarnings = {};

    trips.forEach(trip => {
      let tripEarnings = 0;
      const bookedSeats = trip.passengers.length;
      
      if (trip.status === 'completed') {
        tripEarnings = (bookedSeats * trip.amount) + (trip.cancellationFees || 0);
      } else if (trip.status === 'cancelled') {
        tripEarnings = - (bookedSeats * trip.amount);
      } else {
        tripEarnings = trip.cancellationFees || 0;
      }

      if (tripEarnings !== 0) {
        totalEarnings += tripEarnings;
        
        const dateObj = new Date(trip.createdAt);
        const day = dateObj.toISOString().split('T')[0];
        const month = day.substring(0, 7);
        const year = day.substring(0, 4);

        dailyEarnings[day] = (dailyEarnings[day] || 0) + tripEarnings;
        monthlyEarnings[month] = (monthlyEarnings[month] || 0) + tripEarnings;
        yearlyEarnings[year] = (yearlyEarnings[year] || 0) + tripEarnings;
      }
    });

    res.status(200).json({
      totalEarnings,
      dailyEarnings,
      monthlyEarnings,
      yearlyEarnings
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { 
  publishTrip, 
  bookTrip, 
  getAllTrips, 
  getTripsByDriver, 
  getTripsByCustomer, 
  updateTripStatus, 
  editTrip, 
  deleteTrip, 
  cancelBooking, 
  updateBooking,
  getDriverEarnings
};
