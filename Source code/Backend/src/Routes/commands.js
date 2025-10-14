import express from 'express';
import CommandsController from '../Controllers/CommandsController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Protected routes cho user gửi lệnh
router.use(authMiddleware);

router.post('/:deviceId/send', CommandsController.sendCommand);
router.get('/:deviceId', CommandsController.getCommands);
router.get('/:deviceId/recent', CommandsController.getRecentCommands);
router.get('/:deviceId/stats', CommandsController.getCommandStats);

// Public route cho ESP32 cập nhật kết quả lệnh
router.put('/result/:commandId', CommandsController.updateCommandResult);

export default router;