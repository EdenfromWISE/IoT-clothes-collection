import express from 'express';
import SensorController from '../Controllers/SensorController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Public route cho ESP32 gửi dữ liệu
router.post('/data', SensorController.receiveSensorData);

// Protected routes cho app
router.use(authMiddleware);

router.get('/:deviceId', SensorController.getSensorData);
router.get('/:deviceId/latest', SensorController.getLatestSensorData);
router.get('/:deviceId/stats', SensorController.getSensorStats);
router.get('/:deviceId/chart', SensorController.getSensorChart);

export default router;