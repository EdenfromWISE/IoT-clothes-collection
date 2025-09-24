import Command from '../Models/Commands.js';
import Device from '../Models/Devices.js';
import mqtt from 'mqtt';

class CommandsController {
  constructor() {
    this.mqttClient = null;
    this.initMQTT();
  }

  // Khởi tạo MQTT connection
  initMQTT() {
    if (process.env.MQTT_BROKER_URL) {
      this.mqttClient = mqtt.connect(process.env.MQTT_BROKER_URL, {
        username: process.env.MQTT_USERNAME,
        password: process.env.MQTT_PASSWORD
      });

      this.mqttClient.on('connect', () => {
        console.log('MQTT connected for command controller');
      });

      this.mqttClient.on('error', (error) => {
        console.error('MQTT connection error:', error);
      });
    }
  }

  // Gửi lệnh điều khiển motor
  async sendCommand(req, res) {
    try {
      const { deviceId } = req.params;
      const { command, params = {} } = req.body;
      const userId = req.user.userId;

      if (!command || !['collect', 'release', 'stop', 'calibrate'].includes(command)) {
        return res.status(400).json({
          success: false,
          message: 'Lệnh không hợp lệ'
        });
      }

      const device = await Device.findOne({ _id: deviceId, owner: userId });
      if (!device) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thiết bị'
        });
      }

      if (device.status !== 'online') {
        return res.status(400).json({
          success: false,
          message: 'Thiết bị không online'
        });
      }

      // Tạo command record
      const newCommand = new Command({
        deviceId: device._id,
        issuedBy: userId,
        command,
        params,
        status: 'pending'
      });

      await newCommand.save();

      // Gửi lệnh qua MQTT
      const topic = `device/${device.serial}/command`;
      const mqttPayload = {
        commandId: newCommand._id,
        command,
        params,
        timestamp: new Date().toISOString()
      };

      if (this.mqttClient) {
        this.mqttClient.publish(topic, JSON.stringify(mqttPayload), (err) => {
          if (!err) {
            // Cập nhật status thành 'sent'
            newCommand.status = 'sent';
            newCommand.updatedAt = new Date();
            newCommand.save();
          }
        });
      }

      // Cập nhật motorState của device
      let newMotorState = device.motorState;
      switch (command) {
        case 'collect':
          newMotorState = 'collecting';
          break;
        case 'release':
          newMotorState = 'releasing';
          break;
        case 'stop':
          newMotorState = 'stopped';
          break;
        case 'calibrate':
          newMotorState = 'idle';
          break;
      }

      device.motorState = newMotorState;
      await device.save();

      res.status(201).json({
        success: true,
        message: 'Lệnh đã được gửi',
        data: {
          command: {
            id: newCommand._id,
            command: newCommand.command,
            status: newCommand.status,
            createdAt: newCommand.createdAt
          },
          device: {
            id: device._id,
            name: device.name,
            motorState: device.motorState
          }
        }
      });

    } catch (error) {
      console.error('Send command error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi gửi lệnh',
        error: error.message
      });
    }
  }

  // Cập nhật kết quả lệnh (từ ESP32)
  async updateCommandResult(req, res) {
    try {
      const { commandId } = req.params;
      const { status, result } = req.body;

      if (!['executed', 'failed'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Trạng thái không hợp lệ'
        });
      }

      const command = await Command.findById(commandId);
      if (!command) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy lệnh'
        });
      }

      command.status = status;
      command.result = result || {};
      command.updatedAt = new Date();

      await command.save();

      res.status(200).json({
        success: true,
        message: 'Cập nhật kết quả lệnh thành công',
        data: { command }
      });

    } catch (error) {
      console.error('Update command result error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi cập nhật kết quả lệnh',
        error: error.message
      });
    }
  }

  // Lấy danh sách lệnh
  async getCommands(req, res) {
    try {
      const { deviceId } = req.params;
      const { status, command, limit = 20, page = 1 } = req.query;
      const userId = req.user.userId;

      const device = await Device.findOne({ _id: deviceId, owner: userId });
      if (!device) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thiết bị'
        });
      }

      const filter = { deviceId };

      if (status) filter.status = status;
      if (command) filter.command = command;

      const skip = (page - 1) * limit;
      const commands = await Command.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('deviceId', 'name serial')
        .populate('issuedBy', 'username fullName');

      const total = await Command.countDocuments(filter);

      res.status(200).json({
        success: true,
        data: {
          commands,
          pagination: {
            current: parseInt(page),
            total: Math.ceil(total / limit),
            count: commands.length,
            totalCommands: total
          }
        }
      });

    } catch (error) {
      console.error('Get commands error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy danh sách lệnh',
        error: error.message
      });
    }
  }

  // Lấy lệnh gần đây
  async getRecentCommands(req, res) {
    try {
      const { deviceId } = req.params;
      const { limit = 10 } = req.query;
      const userId = req.user.userId;

      const device = await Device.findOne({ _id: deviceId, owner: userId });
      if (!device) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thiết bị'
        });
      }

      const recentCommands = await Command.find({ deviceId })
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .populate('deviceId', 'name serial')
        .populate('issuedBy', 'username fullName');

      res.status(200).json({
        success: true,
        data: { recentCommands }
      });

    } catch (error) {
      console.error('Get recent commands error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy lệnh gần đây',
        error: error.message
      });
    }
  }

  // Thống kê lệnh
  async getCommandStats(req, res) {
    try {
      const { deviceId } = req.params;
      const { startDate, endDate } = req.query;
      const userId = req.user.userId;

      const device = await Device.findOne({ _id: deviceId, owner: userId });
      if (!device) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thiết bị'
        });
      }

      const matchCondition = { deviceId: device._id };

      if (startDate || endDate) {
        matchCondition.createdAt = {};
        if (startDate) matchCondition.createdAt.$gte = new Date(startDate);
        if (endDate) matchCondition.createdAt.$lte = new Date(endDate);
      }

      const stats = await Command.aggregate([
        { $match: matchCondition },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
            sent: { $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] } },
            executed: { $sum: { $cond: [{ $eq: ['$status', 'executed'] }, 1, 0] } },
            failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
            collectCommands: { $sum: { $cond: [{ $eq: ['$command', 'collect'] }, 1, 0] } },
            releaseCommands: { $sum: { $cond: [{ $eq: ['$command', 'release'] }, 1, 0] } },
            stopCommands: { $sum: { $cond: [{ $eq: ['$command', 'stop'] }, 1, 0] } }
          }
        }
      ]);

      const result = stats[0] || {
        total: 0, pending: 0, sent: 0, executed: 0, failed: 0,
        collectCommands: 0, releaseCommands: 0, stopCommands: 0
      };

      res.status(200).json({
        success: true,
        data: { stats: result }
      });

    } catch (error) {
      console.error('Get command stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy thống kê lệnh',
        error: error.message
      });
    }
  }
}

export default new CommandsController();