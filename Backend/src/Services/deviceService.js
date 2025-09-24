import Device from '../Models/Devices.js';
import mqttManager from '../../config/mqtt.js';
import notificationService from './notificationService.js';

class DeviceService {
  // Kiểm tra thiết bị offline
  async checkOfflineDevices() {
    try {
      const offlineThreshold = new Date(Date.now() - 5 * 60 * 1000); // 5 phút
      
      const offlineDevices = await Device.find({
        lastSeen: { $lt: offlineThreshold },
        status: { $ne: 'offline' }
      }).populate('owner', 'username');

      // Cập nhật status và gửi thông báo
      for (const device of offlineDevices) {
        device.status = 'offline';
        await device.save();

        // Gửi thông báo offline
        await notificationService.sendDeviceOfflineAlert(
          device.owner._id,
          device._id,
          device.name
        );

        console.log(`📴 Device ${device.name} went offline`);
      }

      return offlineDevices.length;
    } catch (error) {
      console.error('Check offline devices error:', error);
      return 0;
    }
  }

  // Tự động thu gom khi có mưa
  async autoCollectOnRain(deviceId, rainValue) {
    try {
      const device = await Device.findById(deviceId).populate('owner');
      if (!device || device.motorState !== 'idle') {
        return false;
      }

      // Gửi lệnh thu gom
      const success = mqttManager.publishCommand(device.serial, {
        command: 'collect',
        params: { auto: true, reason: 'rain_detected' },
        timestamp: new Date().toISOString()
      });

      if (success) {
        device.motorState = 'collecting';
        await device.save();

        // Gửi thông báo
        await notificationService.sendRainAlert(
          device.owner._id,
          device._id,
          rainValue
        );

        console.log(`🌧️ Auto collect triggered for ${device.name}`);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Auto collect error:', error);
      return false;
    }
  }

  // Thống kê tổng quan
  async getSystemStats() {
    try {
      const stats = await Device.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            online: { $sum: { $cond: [{ $eq: ['$status', 'online'] }, 1, 0] } },
            offline: { $sum: { $cond: [{ $eq: ['$status', 'offline'] }, 1, 0] } },
            collecting: { $sum: { $cond: [{ $eq: ['$motorState', 'collecting'] }, 1, 0] } }
          }
        }
      ]);

      return stats[0] || { total: 0, online: 0, offline: 0, collecting: 0 };
    } catch (error) {
      console.error('Get system stats error:', error);
      return { total: 0, online: 0, offline: 0, collecting: 0 };
    }
  }

  // Reset thiết bị
  async resetDevice(deviceId, userId) {
    try {
      const device = await Device.findOne({ _id: deviceId, owner: userId });
      if (!device) return false;

      // Gửi lệnh reset
      const success = mqttManager.publishCommand(device.serial, {
        command: 'calibrate',
        params: { reset: true }
      });

      if (success) {
        device.motorState = 'idle';
        await device.save();
        return true;
      }

      return false;
    } catch (error) {
      console.error('Reset device error:', error);
      return false;
    }
  }
}

export default new DeviceService();