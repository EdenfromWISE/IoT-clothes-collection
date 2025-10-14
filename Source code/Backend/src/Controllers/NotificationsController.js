import UserDevice from '../Models/UserDevices.js';
import Notification from '../Models/Notifications.js';
import Device from '../Models/Devices.js';
import admin from 'firebase-admin'; // Firebase Admin SDK cho FCM

class NotificationsController {
  // Đăng ký thiết bị của user để nhận thông báo
  async registerDevice(req, res) {
    try {
      const { deviceToken, deviceType, platform, deviceInfo } = req.body;
      const userId = req.user.userId;

      if (!deviceToken || !deviceType || !platform) {
        return res.status(400).json({
          success: false,
          message: 'deviceToken, deviceType và platform là bắt buộc'
        });
      }

      // Kiểm tra device đã tồn tại chưa
      let userDevice = await UserDevice.findOne({ deviceToken });
      
      if (userDevice) {
        // Cập nhật thông tin device
        userDevice.userId = userId;
        userDevice.deviceType = deviceType;
        userDevice.platform = platform;
        userDevice.deviceInfo = deviceInfo || {};
        userDevice.isActive = true;
        userDevice.lastSeen = new Date();
      } else {
        // Tạo device mới
        userDevice = new UserDevice({
          userId,
          deviceToken,
          deviceType,
          platform,
          deviceInfo: deviceInfo || {},
          isActive: true
        });
      }

      await userDevice.save();

      res.status(201).json({
        success: true,
        message: 'Đăng ký thiết bị thành công',
        data: { deviceId: userDevice._id }
      });

    } catch (error) {
      console.error('Register device error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi đăng ký thiết bị',
        error: error.message
      });
    }
  }

  // Cập nhật cài đặt thông báo
  async updateNotificationSettings(req, res) {
    try {
      const { deviceId } = req.params;
      const { notificationSettings } = req.body;
      const userId = req.user.userId;

      const userDevice = await UserDevice.findOne({ 
        _id: deviceId, 
        userId 
      });

      if (!userDevice) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thiết bị'
        });
      }

      userDevice.notificationSettings = {
        ...userDevice.notificationSettings,
        ...notificationSettings
      };

      await userDevice.save();

      res.status(200).json({
        success: true,
        message: 'Cập nhật cài đặt thông báo thành công',
        data: { notificationSettings: userDevice.notificationSettings }
      });

    } catch (error) {
      console.error('Update notification settings error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi cập nhật cài đặt',
        error: error.message
      });
    }
  }

  // Gửi thông báo tới user
  async sendNotification(userId, notificationData) {
    try {
      const { title, message, type, deviceId, priority = 'normal', data = {} } = notificationData;

      // Lưu notification vào database
      const notification = new Notification({
        userId,
        deviceId,
        title,
        message,
        type,
        priority,
        data
      });

      // Lấy danh sách thiết bị của user
      const userDevices = await UserDevice.find({ 
        userId, 
        isActive: true,
        'notificationSettings.enabled': true,
        [`notificationSettings.${type}`]: true
      });

      if (userDevices.length === 0) {
        console.log(`No active devices found for user ${userId}`);
        return;
      }

      // Gửi FCM notification
      const sendPromises = userDevices.map(async (device) => {
        try {
          const fcmMessage = {
            token: device.deviceToken,
            notification: {
              title,
              body: message
            },
            data: {
              type,
              priority,
              deviceId: deviceId?.toString() || '',
              ...data
            },
            android: {
              priority: priority === 'urgent' ? 'high' : 'normal',
              notification: {
                sound: 'default',
                channelId: type
              }
            },
            apns: {
              payload: {
                aps: {
                  sound: 'default',
                  badge: 1
                }
              }
            }
          };

          const response = await admin.messaging().send(fcmMessage);
          
          // Cập nhật trạng thái gửi thành công
          notification.sentTo.push({
            deviceToken: device.deviceToken,
            platform: device.platform,
            sentAt: new Date(),
            status: 'sent'
          });

          console.log(`✅ Notification sent to ${device.platform}: ${response}`);

        } catch (error) {
          // Cập nhật trạng thái gửi thất bại
          notification.sentTo.push({
            deviceToken: device.deviceToken,
            platform: device.platform,
            sentAt: new Date(),
            status: 'failed',
            error: error.message
          });

          console.error(`❌ Failed to send notification to ${device.deviceToken}:`, error.message);

          // Nếu token không hợp lệ, vô hiệu hóa device
          if (error.code === 'messaging/registration-token-not-registered') {
            device.isActive = false;
            await device.save();
          }
        }
      });

      await Promise.all(sendPromises);
      await notification.save();

      return notification;

    } catch (error) {
      console.error('Send notification error:', error);
      throw error;
    }
  }

  // Lấy danh sách thông báo của user
  async getNotifications(req, res) {
    try {
      const userId = req.user.userId;
      const { page = 1, limit = 20, type, isRead } = req.query;

      const filter = { userId };
      
      if (type) filter.type = type;
      if (isRead !== undefined) filter.isRead = isRead === 'true';

      const skip = (page - 1) * limit;
      const notifications = await Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('deviceId', 'name serial');

      const total = await Notification.countDocuments(filter);
      const unreadCount = await Notification.countDocuments({ 
        userId, 
        isRead: false 
      });

      res.status(200).json({
        success: true,
        data: {
          notifications,
          pagination: {
            current: parseInt(page),
            total: Math.ceil(total / limit),
            count: notifications.length,
            totalNotifications: total
          },
          unreadCount
        }
      });

    } catch (error) {
      console.error('Get notifications error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy danh sách thông báo',
        error: error.message
      });
    }
  }

  // Đánh dấu thông báo đã đọc
  async markAsRead(req, res) {
    try {
      const { notificationId } = req.params;
      const userId = req.user.userId;

      const notification = await Notification.findOne({
        _id: notificationId,
        userId
      });

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thông báo'
        });
      }

      notification.isRead = true;
      notification.readAt = new Date();
      await notification.save();

      res.status(200).json({
        success: true,
        message: 'Đánh dấu đã đọc thành công'
      });

    } catch (error) {
      console.error('Mark as read error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi đánh dấu đã đọc',
        error: error.message
      });
    }
  }

  // Đánh dấu tất cả thông báo đã đọc
  async markAllAsRead(req, res) {
    try {
      const userId = req.user.userId;

      const result = await Notification.updateMany(
        { userId, isRead: false },
        { 
          isRead: true, 
          readAt: new Date() 
        }
      );

      res.status(200).json({
        success: true,
        message: `Đã đánh dấu ${result.modifiedCount} thông báo là đã đọc`
      });

    } catch (error) {
      console.error('Mark all as read error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi đánh dấu tất cả đã đọc',
        error: error.message
      });
    }
  }
}

export default new NotificationsController();