import express from 'express';
import authRoutes from './auth.js';
import deviceRoutes from './devices.js';
import sensorRoutes from './sensors.js';
import eventRoutes from './events.js';
import commandRoutes from './commands.js';
import notificationRoutes from './notifications.js';

const router = express.Router();

// API Routes
router.use('/auth', authRoutes);
router.use('/devices', deviceRoutes);
router.use('/sensors', sensorRoutes);
router.use('/events', eventRoutes);
router.use('/commands', commandRoutes);
router.use('/notifications', notificationRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

export default router;