const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

router.get('/:userModel/:userId', notificationController.getNotifications);
router.put('/:id/read', notificationController.markAsRead);
router.put('/read-all/:userModel/:userId', notificationController.markAllAsRead);
router.delete('/:id', notificationController.deleteNotification);
router.delete('/clear-all/:userModel/:userId', notificationController.clearAllNotifications);

module.exports = router;
