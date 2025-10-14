import express from 'express';
import DevicesController from '../Controllers/DevicesController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// All device routes require authentication
router.use(authMiddleware);

// Device CRUD
router.get('/', DevicesController.getDevices);
router.get('/stats', DevicesController.getDeviceStats);
router.get('/:deviceId', DevicesController.getDevice);
router.post('/', DevicesController.addDevice);
router.put('/:deviceId', DevicesController.updateDevice);
router.delete('/:deviceId', DevicesController.deleteDevice);

// Device status (công khai cho ESP32)
router.post('/status/:serial', DevicesController.updateDeviceStatus);

export default router;