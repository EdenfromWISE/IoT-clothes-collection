import Device from '../Models/Devices.js';

class DevicesController {
  // Lấy danh sách thiết bị của user
  async getDevices(req, res) {
    try {
      const userId = req.user.userId;
      const { page = 1, limit = 10, status, search } = req.query;

      const filter = { owner: userId };
      
      if (status && ['online', 'offline', 'unknown'].includes(status)) {
        filter.status = status;
      }

      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { serial: { $regex: search, $options: 'i' } },
          { location: { $regex: search, $options: 'i' } }
        ];
      }

      const skip = (page - 1) * limit;
      const devices = await Device.find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('owner', 'username fullName');

      const total = await Device.countDocuments(filter);

      res.status(200).json({
        success: true,
        data: {
          devices,
          pagination: {
            current: parseInt(page),
            total: Math.ceil(total / limit),
            count: devices.length,
            totalDevices: total
          }
        }
      });

    } catch (error) {
      console.error('Get devices error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy danh sách thiết bị',
        error: error.message
      });
    }
  }

  // Lấy thông tin chi tiết 1 thiết bị
  async getDevice(req, res) {
    try {
      const { deviceId } = req.params;
      const userId = req.user.userId;

      const device = await Device.findOne({ 
        _id: deviceId, 
        owner: userId 
      }).populate('owner', 'username fullName');

      if (!device) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thiết bị'
        });
      }

      res.status(200).json({
        success: true,
        data: { device }
      });

    } catch (error) {
      console.error('Get device error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy thông tin thiết bị',
        error: error.message
      });
    }
  }

  // Thêm thiết bị mới
  async addDevice(req, res) {
    try {
      const { name, serial, location, meta } = req.body;
      const userId = req.user.userId;

      if (!name || !serial) {
        return res.status(400).json({
          success: false,
          message: 'Tên thiết bị và serial là bắt buộc'
        });
      }

      const existingDevice = await Device.findOne({ serial });
      if (existingDevice) {
        return res.status(409).json({
          success: false,
          message: 'Serial thiết bị đã được sử dụng'
        });
      }

      const newDevice = new Device({
        name,
        owner: userId,
        serial,
        location: location || '',
        status: 'unknown',
        meta: meta || {},
        motorState: 'idle'
      });

      await newDevice.save();
      await newDevice.populate('owner', 'username fullName');

      res.status(201).json({
        success: true,
        message: 'Thêm thiết bị thành công',
        data: { device: newDevice }
      });

    } catch (error) {
      console.error('Add device error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi thêm thiết bị',
        error: error.message
      });
    }
  }

  // Cập nhật thông tin thiết bị
  async updateDevice(req, res) {
    try {
      const { deviceId } = req.params;
      const { name, location, meta } = req.body;
      const userId = req.user.userId;

      const device = await Device.findOne({ 
        _id: deviceId, 
        owner: userId 
      });

      if (!device) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thiết bị'
        });
      }

      if (name) device.name = name;
      if (location !== undefined) device.location = location;
      if (meta) device.meta = { ...device.meta, ...meta };

      await device.save();
      await device.populate('owner', 'username fullName');

      res.status(200).json({
        success: true,
        message: 'Cập nhật thiết bị thành công',
        data: { device }
      });

    } catch (error) {
      console.error('Update device error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi cập nhật thiết bị',
        error: error.message
      });
    }
  }

  // Xóa thiết bị
  async deleteDevice(req, res) {
    try {
      const { deviceId } = req.params;
      const userId = req.user.userId;

      const device = await Device.findOneAndDelete({ 
        _id: deviceId, 
        owner: userId 
      });

      if (!device) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thiết bị'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Xóa thiết bị thành công'
      });

    } catch (error) {
      console.error('Delete device error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi xóa thiết bị',
        error: error.message
      });
    }
  }

  // Cập nhật trạng thái thiết bị (heartbeat từ ESP32)
  async updateDeviceStatus(req, res) {
    try {
      const { serial } = req.params;
      const { status, motorState } = req.body;

      const device = await Device.findOne({ serial });

      if (!device) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thiết bị'
        });
      }

      if (status) device.status = status;
      if (motorState) device.motorState = motorState;
      device.lastSeen = new Date();

      await device.save();

      res.status(200).json({
        success: true,
        message: 'Cập nhật trạng thái thiết bị thành công',
        data: { 
          deviceId: device._id,
          status: device.status,
          motorState: device.motorState,
          lastSeen: device.lastSeen
        }
      });

    } catch (error) {
      console.error('Update device status error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi cập nhật trạng thái',
        error: error.message
      });
    }
  }

  // Thống kê thiết bị
  async getDeviceStats(req, res) {
    try {
      const userId = req.user.userId;

      const stats = await Device.aggregate([
        { $match: { owner: userId } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            online: { $sum: { $cond: [{ $eq: ['$status', 'online'] }, 1, 0] } },
            offline: { $sum: { $cond: [{ $eq: ['$status', 'offline'] }, 1, 0] } },
            unknown: { $sum: { $cond: [{ $eq: ['$status', 'unknown'] }, 1, 0] } },
            collecting: { $sum: { $cond: [{ $eq: ['$motorState', 'collecting'] }, 1, 0] } },
            idle: { $sum: { $cond: [{ $eq: ['$motorState', 'idle'] }, 1, 0] } }
          }
        }
      ]);

      const result = stats[0] || {
        total: 0, online: 0, offline: 0, unknown: 0, collecting: 0, idle: 0
      };

      res.status(200).json({
        success: true,
        data: { stats: result }
      });

    } catch (error) {
      console.error('Get device stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy thống kê',
        error: error.message
      });
    }
  }
}

export default new DevicesController();