const express = require('express');
const router = express.Router();
const tripController = require('../controllers/tripController');

router.post('/publish', tripController.publishTrip);
router.post('/book', tripController.bookTrip);
router.post('/cancel-booking', tripController.cancelBooking);
router.post('/update-booking', tripController.updateBooking);

router.get('/all', tripController.getAllTrips);
router.get('/driver/:driverId', tripController.getTripsByDriver);
router.get('/customer/:customerId', tripController.getTripsByCustomer);
router.get('/earnings/:driverId', tripController.getDriverEarnings);

router.put('/status/:tripId', tripController.updateTripStatus);
router.put('/:tripId', tripController.editTrip);
router.delete('/:tripId', tripController.deleteTrip);

module.exports = router;
