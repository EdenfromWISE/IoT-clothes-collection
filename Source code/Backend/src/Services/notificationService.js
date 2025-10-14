import admin from 'firebase-admin';
import UserDevice from '../Models/UserDevices.js';
import Notification from '../Models/Notifications.js';

class NotificationService {
  constructor() {
    // Initialize Firebase Admin (nếu cần FCM push notifications)
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }
  }

  // Gửi thông báo mưa
  async sendRainAlert(userId, deviceId, rainValue) {
    return this.sendNotification(userId, {
      title: '🌧️ Phát hiện mưa!',
      message: `Thiết bị phát hiện mưa (${rainValue}mm). Hệ thống sẽ thu gom quần áo.`,
      type: 'rain_alert',
      deviceId,
      priority: 'high',
      data: { rainValue }
    });
  }

  // Gửi thông báo thiết bị offline
  async sendDeviceOfflineAlert(userId, deviceId, deviceName) {
    return this.sendNotification(userId, {
      title: '📴 Thiết bị offline',
      message: `${deviceName} đã mất kết nối. Vui lòng kiểm tra.`,
      type: 'device_offline',
      deviceId,
      priority: 'normal'
    });
  }

  // Gửi thông báo hoàn thành thu gom
  async sendCollectionComplete(userId, deviceId, deviceName) {
    return this.sendNotification(userId, {
      title: '✅ Hoàn thành thu gom',
      message: `${deviceName} đã thu gom quần áo xong.`,
      type: 'motor_complete',
      deviceId,
      priority: 'normal'
    });
  }

  // Core method gửi thông báo
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

      // Lấy devices của user
      const userDevices = await UserDevice.find({
        userId,
        isActive: true,
        'notificationSettings.enabled': true,
        [`notificationSettings.${type}`]: true
      });

      if (userDevices.length === 0) {
        console.log(`No devices to send notification for user ${userId}`);
        return null;
      }

      // Gửi FCM (nếu có setup)
      if (admin.apps.length > 0) {
        const sendPromises = userDevices.map(async (device) => {
          try {
            const message = {
              token: device.deviceToken,
              notification: { title, body: message },
              data: { type, priority, ...data }
            };

            await admin.messaging().send(message);
            notification.sentTo.push({
              deviceToken: device.deviceToken,
              platform: device.platform,
              sentAt: new Date(),
              status: 'sent'
            });
          } catch (error) {
            notification.sentTo.push({
              deviceToken: device.deviceToken,
              platform: device.platform,
              sentAt: new Date(),
              status: 'failed',
              error: error.message
            });
          }
        });

        await Promise.all(sendPromises);
      }

      await notification.save();
      return notification;

    } catch (error) {
      console.error('Notification service error:', error);
      throw error;
    }
  }
}

export default new NotificationService();