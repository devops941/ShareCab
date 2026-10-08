const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/customer/signup', authController.signupCustomer);
router.post('/driver/signup', authController.signupDriver);

router.post('/customer/login', authController.loginCustomer);
router.post('/driver/login', authController.loginDriver);

router.get('/profile/:role/:userId', authController.getProfile);
router.put('/profile/:role/:userId', authController.updateProfile);

module.exports = router;
