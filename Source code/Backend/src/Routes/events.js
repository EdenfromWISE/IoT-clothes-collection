import express from 'express';
import EventController from '../Controllers/EventsController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Public route cho ESP32 tạo event
router.post('/', EventController.createEvent);

// Protected routes
router.use(authMiddleware);

router.get('/:deviceId', EventController.getEvents);
router.get('/:deviceId/recent', EventController.getRecentEvents);
router.get('/:deviceId/stats', EventController.getEventStats);
router.delete('/cleanup', EventController.deleteOldEvents);

export default router;