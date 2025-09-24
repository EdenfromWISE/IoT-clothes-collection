import Event from ('../Models/Events.js');
import Device from ('../Models/Devices.js');

class EventsController {
  // Tạo sự kiện mới (từ ESP32 hoặc hệ thống)
  async createEvent(req, res) {
    try {
      const { serial, eventType, message, payload, severity = 'info' } = req.body;

      if (!serial || !eventType) {
        return res.status(400).json({
          success: false,
          message: 'Serial và eventType là bắt buộc'
        });
      }

      const device = await Device.findOne({ serial });
      if (!device) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thiết bị'
        });
      }

      const newEvent = new Event({
        deviceId: device._id,
        eventType,
        message: message || '',
        payload: payload || {},
        severity
      });

      await newEvent.save();

      res.status(201).json({
        success: true,
        message: 'Tạo sự kiện thành công',
        data: { event: newEvent }
      });

    } catch (error) {
      console.error('Create event error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi tạo sự kiện',
        error: error.message
      });
    }
  }

  // Lấy danh sách sự kiện
  async getEvents(req, res) {
    try {
      const { deviceId } = req.params;
      const { 
        eventType, 
        severity, 
        startDate, 
        endDate, 
        limit = 50, 
        page = 1 
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

      const filter = { deviceId };

      if (eventType) filter.eventType = eventType;
      if (severity) filter.severity = severity;

      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
      }

      const skip = (page - 1) * limit;
      const events = await Event.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('deviceId', 'name serial');

      const total = await Event.countDocuments(filter);

      res.status(200).json({
        success: true,
        data: {
          events,
          pagination: {
            current: parseInt(page),
            total: Math.ceil(total / limit),
            count: events.length,
            totalEvents: total
          }
        }
      });

    } catch (error) {
      console.error('Get events error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy danh sách sự kiện',
        error: error.message
      });
    }
  }

  // Lấy sự kiện gần đây nhất
  async getRecentEvents(req, res) {
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

      const recentEvents = await Event.find({ deviceId })
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .populate('deviceId', 'name serial');

      res.status(200).json({
        success: true,
        data: { recentEvents }
      });

    } catch (error) {
      console.error('Get recent events error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy sự kiện gần đây',
        error: error.message
      });
    }
  }

  // Thống kê sự kiện
  async getEventStats(req, res) {
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

      const stats = await Event.aggregate([
        { $match: matchCondition },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            byEventType: {
              $push: {
                eventType: '$eventType',
                severity: '$severity'
              }
            },
            errorCount: { $sum: { $cond: [{ $eq: ['$severity', 'error'] }, 1, 0] } },
            warnCount: { $sum: { $cond: [{ $eq: ['$severity', 'warn'] }, 1, 0] } },
            infoCount: { $sum: { $cond: [{ $eq: ['$severity', 'info'] }, 1, 0] } }
          }
        },
        {
          $project: {
            total: 1,
            errorCount: 1,
            warnCount: 1,
            infoCount: 1,
            eventTypes: {
              $reduce: {
                input: '$byEventType',
                initialValue: {},
                in: {
                  $mergeObjects: [
                    '$$value',
                    {
                      $arrayToObject: [[{
                        k: '$$this.eventType',
                        v: { $add: [{ $ifNull: [{ $getField: { field: '$$this.eventType', input: '$$value' } }, 0] }, 1] }
                      }]]
                    }
                  ]
                }
              }
            }
          }
        }
      ]);

      const result = stats[0] || {
        total: 0,
        errorCount: 0,
        warnCount: 0,
        infoCount: 0,
        eventTypes: {}
      };

      res.status(200).json({
        success: true,
        data: { stats: result }
      });

    } catch (error) {
      console.error('Get event stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy thống kê sự kiện',
        error: error.message
      });
    }
  }

  // Xóa sự kiện cũ (cleanup)
  async deleteOldEvents(req, res) {
    try {
      const { days = 30 } = req.query;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));

      const result = await Event.deleteMany({
        createdAt: { $lt: cutoffDate }
      });

      res.status(200).json({
        success: true,
        message: `Đã xóa ${result.deletedCount} sự kiện cũ hơn ${days} ngày`,
        data: { deletedCount: result.deletedCount }
      });

    } catch (error) {
      console.error('Delete old events error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi xóa sự kiện cũ',
        error: error.message
      });
    }
  }
}

export default new EventsController();