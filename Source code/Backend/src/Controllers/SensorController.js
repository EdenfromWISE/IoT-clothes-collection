import Sensor from '../Models/Sensors.js';
import Device from '../Models/Devices.js';

class SensorController {
  // Nhận dữ liệu từ ESP32
  async receiveSensorData(req, res) {
    try {
      const { serial, sensorData } = req.body;

      if (!serial || !sensorData || !Array.isArray(sensorData)) {
        return res.status(400).json({
          success: false,
          message: 'Serial và dữ liệu cảm biến là bắt buộc'
        });
      }

      const device = await Device.findOne({ serial });
      if (!device) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thiết bị'
        });
      }

      // Cập nhật lastSeen và status
      device.lastSeen = new Date();
      device.status = 'online';
      await device.save();

      // Lưu dữ liệu cảm biến
      const sensorRecords = sensorData.map(data => ({
        deviceId: device._id,
        type: data.type,
        value: data.value,
        unit: data.unit || '',
        meta: data.meta || {}
      }));

      await Sensor.insertMany(sensorRecords);

      res.status(200).json({
        success: true,
        message: 'Nhận dữ liệu cảm biến thành công',
        data: {
          deviceId: device._id,
          recordsCount: sensorRecords.length
        }
      });

    } catch (error) {
      console.error('Receive sensor data error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi nhận dữ liệu cảm biến',
        error: error.message
      });
    }
  }

  // Lấy dữ liệu cảm biến cho app
  async getSensorData(req, res) {
    try {
      const { deviceId } = req.params;
      const { type, startDate, endDate, limit = 100, page = 1 } = req.query;
      const userId = req.user.userId;

      const device = await Device.findOne({ _id: deviceId, owner: userId });
      if (!device) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thiết bị'
        });
      }

      const filter = { deviceId };
      
      if (type && ['rain', 'temperature', 'humidity', 'light', 'other'].includes(type)) {
        filter.type = type;
      }

      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
      }

      const skip = (page - 1) * limit;
      const sensorData = await Sensor.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('deviceId', 'name serial');

      const total = await Sensor.countDocuments(filter);

      res.status(200).json({
        success: true,
        data: {
          sensorData,
          pagination: {
            current: parseInt(page),
            total: Math.ceil(total / limit),
            count: sensorData.length,
            totalRecords: total
          }
        }
      });

    } catch (error) {
      console.error('Get sensor data error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy dữ liệu cảm biến',
        error: error.message
      });
    }
  }

  // Lấy dữ liệu cảm biến mới nhất
  async getLatestSensorData(req, res) {
    try {
      const { deviceId } = req.params;
      const userId = req.user.userId;

      const device = await Device.findOne({ _id: deviceId, owner: userId });
      if (!device) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thiết bị'
        });
      }

      const latestData = await Sensor.aggregate([
        { $match: { deviceId: device._id } },
        { $sort: { createdAt: -1 } },
        {
          $group: {
            _id: '$type',
            latestRecord: { $first: '$$ROOT' }
          }
        },
        { $replaceRoot: { newRoot: '$latestRecord' } },
        { $sort: { type: 1 } }
      ]);

      res.status(200).json({
        success: true,
        data: {
          device: {
            id: device._id,
            name: device.name,
            serial: device.serial
          },
          latestSensorData: latestData
        }
      });

    } catch (error) {
      console.error('Get latest sensor data error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy dữ liệu cảm biến mới nhất',
        error: error.message
      });
    }
  }

  // Thống kê dữ liệu cảm biến
  async getSensorStats(req, res) {
    try {
      const { deviceId } = req.params;
      const { type, startDate, endDate } = req.query;
      const userId = req.user.userId;

      const device = await Device.findOne({ _id: deviceId, owner: userId });
      if (!device) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thiết bị'
        });
      }

      const matchCondition = { deviceId: device._id };
      
      if (type) matchCondition.type = type;
      
      if (startDate || endDate) {
        matchCondition.createdAt = {};
        if (startDate) matchCondition.createdAt.$gte = new Date(startDate);
        if (endDate) matchCondition.createdAt.$lte = new Date(endDate);
      }

      const stats = await Sensor.aggregate([
        { $match: matchCondition },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
            avgValue: { $avg: '$value' },
            minValue: { $min: '$value' },
            maxValue: { $max: '$value' },
            latestValue: { $last: '$value' },
            latestTime: { $last: '$createdAt' }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      res.status(200).json({
        success: true,
        data: { stats }
      });

    } catch (error) {
      console.error('Get sensor stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy thống kê cảm biến',
        error: error.message
      });
    }
  }

  // Lấy dữ liệu cho chart (THÊM METHOD NÀY)
  async getSensorChart(req, res) {
    try {
      const { deviceId } = req.params;
      const { 
        type = 'temperature', 
        period = '24h', // 1h, 6h, 24h, 7d, 30d
        groupBy = 'hour' // minute, hour, day
      } = req.query;
      const userId = req.user.userId;

      // Kiểm tra quyền sở hữu device
      const device = await Device.findOne({ _id: deviceId, owner: userId });
      if (!device) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thiết bị'
        });
      }

      // Tính startDate dựa trên period
      const now = new Date();
      let startDate;
      
      switch (period) {
        case '1h': startDate = new Date(now - 1 * 60 * 60 * 1000); break;
        case '6h': startDate = new Date(now - 6 * 60 * 60 * 1000); break;
        case '24h': startDate = new Date(now - 24 * 60 * 60 * 1000); break;
        case '7d': startDate = new Date(now - 7 * 24 * 60 * 60 * 1000); break;
        case '30d': startDate = new Date(now - 30 * 24 * 60 * 60 * 1000); break;
        default: startDate = new Date(now - 24 * 60 * 60 * 1000);
      }

      // Tạo group format dựa trên groupBy
      let dateFormat;
      switch (groupBy) {
        case 'minute': 
          dateFormat = { $dateToString: { format: "%Y-%m-%d %H:%M", date: "$createdAt" } };
          break;
        case 'hour': 
          dateFormat = { $dateToString: { format: "%Y-%m-%d %H:00", date: "$createdAt" } };
          break;
        case 'day': 
          dateFormat = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
          break;
        default: 
          dateFormat = { $dateToString: { format: "%Y-%m-%d %H:00", date: "$createdAt" } };
      }

      const chartData = await Sensor.aggregate([
        {
          $match: {
            deviceId: device._id,
            type,
            createdAt: { $gte: startDate, $lte: now }
          }
        },
        {
          $group: {
            _id: dateFormat,
            avgValue: { $avg: '$value' },
            minValue: { $min: '$value' },
            maxValue: { $max: '$value' },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      res.status(200).json({
        success: true,
        data: {
          device: {
            id: device._id,
            name: device.name,
            serial: device.serial
          },
          chartData,
          meta: {
            type,
            period,
            groupBy,
            startDate,
            endDate: now
          }
        }
      });

    } catch (error) {
      console.error('Get sensor chart error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy dữ liệu chart',
        error: error.message
      });
    }
  }
}

export default new SensorController();