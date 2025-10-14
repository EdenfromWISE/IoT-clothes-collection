import express from 'express';
import NotificationsController from '../Controllers/NotificationsController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// All notification routes require authentication
router.use(authMiddleware);

// Device registration for push notifications
router.post('/register-device', NotificationsController.registerDevice);
router.put('/settings/:deviceId', NotificationsController.updateNotificationSettings);

// Notification management
router.get('/', NotificationsController.getNotifications);
router.put('/:notificationId/read', NotificationsController.markAsRead);
router.put('/read-all', NotificationsController.markAllAsRead);

export default router;