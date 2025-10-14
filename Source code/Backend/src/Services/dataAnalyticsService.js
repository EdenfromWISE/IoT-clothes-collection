import Sensor from '../Models/Sensors.js';
import Device from '../Models/Devices.js';

class DataAnalyticsService {
  // Phân tích xu hướng thời tiết
  async analyzeWeatherTrends(deviceId, days = 7) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const data = await Sensor.aggregate([
        {
          $match: {
            deviceId,
            type: { $in: ['temperature', 'humidity', 'rain'] },
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              type: '$type',
              date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
            },
            avgValue: { $avg: '$value' },
            maxValue: { $max: '$value' },
            minValue: { $min: '$value' }
          }
        },
        { $sort: { '_id.date': 1 } }
      ]);

      return this.formatTrendData(data);
    } catch (error) {
      console.error('Weather trends analysis error:', error);
      return null;
    }
  }

  // Tính toán hiệu quả thu gom
  async calculateCollectionEfficiency(deviceId, period = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - period);

      // Đếm số lần phát hiện mưa vs số lần thu gom
      const rainDetections = await Sensor.countDocuments({
        deviceId,
        type: 'rain',
        value: { $gt: 0 },
        createdAt: { $gte: startDate }
      });

      const collectionCommands = await Command.countDocuments({
        deviceId,
        command: 'collect',
        status: 'executed',
        createdAt: { $gte: startDate }
      });

      const efficiency = rainDetections > 0 ? (collectionCommands / rainDetections) * 100 : 0;

      return {
        rainDetections,
        collectionCommands,
        efficiency: Math.round(efficiency),
        period
      };
    } catch (error) {
      console.error('Collection efficiency error:', error);
      return null;
    }
  }

  // Format dữ liệu cho chart
  formatTrendData(rawData) {
    const result = {
      temperature: [],
      humidity: [],
      rain: []
    };

    rawData.forEach(item => {
      const type = item._id.type;
      const date = item._id.date;

      if (result[type]) {
        result[type].push({
          date,
          avg: Math.round(item.avgValue * 10) / 10,
          max: Math.round(item.maxValue * 10) / 10,
          min: Math.round(item.minValue * 10) / 10
        });
      }
    });

    return result;
  }
}

export default new DataAnalyticsService();