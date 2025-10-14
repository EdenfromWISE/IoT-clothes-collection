import mqtt from 'mqtt';
import dotenv from 'dotenv';
import Device from '../src/Models/Devices.js';
import Sensor from '../src/Models/Sensors.js';
import Event from '../src/Models/Events.js';
import Command from '../src/Models/Commands.js';

// Load environment variables
dotenv.config();

class MQTTManager {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  // Kết nối MQTT
  connect() {
    try {
      const options = {
        host: process.env.MQTT_HOST || 'localhost',
        port: process.env.MQTT_PORT || 1883,
        username: process.env.MQTT_USERNAME || '',
        password: process.env.MQTT_PASSWORD || '',
        clientId: `iot_backend_${Date.now()}`,
        clean: true,
        connectTimeout: 4000,
        reconnectPeriod: 1000,
        keepalive: 60
      };

      // Kết nối MQTT
      this.client = mqtt.connect(options);

      // Xử lý các sự kiện
      this.handleEvents();

      console.log('🔄 Đang kết nối MQTT...');
      
    } catch (error) {
      console.error('❌ MQTT Connection Error:', error.message);
    }
  }

  // Xử lý các sự kiện MQTT
  handleEvents() {
    // Khi kết nối thành công
    this.client.on('connect', () => {
      console.log('✅ MQTT Connected to Mosquitto broker');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      // Subscribe các topic cần thiết
      this.subscribeTopics();
    });

    // Khi nhận message
    this.client.on('message', async (topic, message) => {
      try {
        await this.handleMessage(topic, message.toString());
      } catch (error) {
        console.error('Error handling MQTT message:', error);
      }
    });

    // Khi mất kết nối
    this.client.on('close', () => {
      console.log('🔴 MQTT Disconnected');
      this.isConnected = false;
    });

    // Khi có lỗi
    this.client.on('error', (error) => {
      console.error('💥 MQTT Error:', error.message);
      this.isConnected = false;
    });

    // Khi reconnect
    this.client.on('reconnect', () => {
      this.reconnectAttempts++;
      console.log(`🔄 MQTT Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.log('❌ Max reconnect attempts reached. Stopping...');
        this.client.end();
      }
    });

    // Khi offline
    this.client.on('offline', () => {
      console.log('📴 MQTT Client offline');
      this.isConnected = false;
    });
  }

  // Subscribe các topic
  subscribeTopics() {
    const topics = [
      'device/+/heartbeat',     // Nhận heartbeat từ các device
      'device/+/sensor',        // Nhận dữ liệu cảm biến
      'device/+/event',         // Nhận sự kiện từ device
      'device/+/command/result' // Nhận kết quả lệnh
    ];

    topics.forEach(topic => {
      this.client.subscribe(topic, { qos: 1 }, (err) => {
        if (err) {
          console.error(`❌ Failed to subscribe ${topic}:`, err.message);
        } else {
          console.log(`📡 Subscribed to: ${topic}`);
        }
      });
    });
  }

  // Xử lý message nhận được
  async handleMessage(topic, message) {
    try {
      const data = JSON.parse(message);
      const topicParts = topic.split('/');
      const deviceSerial = topicParts[1];
      const messageType = topicParts[2];

      console.log(`📨 Received ${messageType} from ${deviceSerial}`);

      switch (messageType) {
        case 'heartbeat':
          await this.handleHeartbeat(deviceSerial, data);
          break;
        case 'sensor':
          await this.handleSensorData(deviceSerial, data);
          break;
        case 'event':
          await this.handleEvent(deviceSerial, data);
          break;
        case 'command':
          if (topicParts[3] === 'result') {
            await this.handleCommandResult(deviceSerial, data);
          }
          break;
        default:
          console.log(`Unknown message type: ${messageType}`);
      }
    } catch (error) {
      console.error('Error parsing MQTT message:', error.message);
    }
  }

  // Xử lý heartbeat từ device
  async handleHeartbeat(serial, data) {
    try {
      const device = await Device.findOne({ serial });
      if (device) {
        device.status = 'online';
        device.lastSeen = new Date();
        if (data.motorState) device.motorState = data.motorState;
        await device.save();
        
        console.log(`💓 Heartbeat from ${device.name} (${serial})`);
      }
    } catch (error) {
      console.error('Error handling heartbeat:', error.message);
    }
  }

  // Xử lý dữ liệu cảm biến
  async handleSensorData(serial, data) {
    try {
      const device = await Device.findOne({ serial });
      if (!device) return;

      // Cập nhật device status
      device.status = 'online';
      device.lastSeen = new Date();
      await device.save();

      // Lưu dữ liệu cảm biến
      if (data.sensors && Array.isArray(data.sensors)) {
        const sensorRecords = data.sensors.map(sensor => ({
          deviceId: device._id,
          type: sensor.type,
          value: sensor.value,
          unit: sensor.unit || '',
          meta: sensor.meta || {}
        }));

        await Sensor.insertMany(sensorRecords);
        console.log(`📊 Saved ${sensorRecords.length} sensor readings from ${device.name}`);
      }
    } catch (error) {
      console.error('Error handling sensor data:', error.message);
    }
  }

  // Xử lý sự kiện từ device
  async handleEvent(serial, data) {
    try {
      const device = await Device.findOne({ serial });
      if (!device) return;

      const newEvent = new Event({
        deviceId: device._id,
        eventType: data.eventType,
        message: data.message || '',
        payload: data.payload || {},
        severity: data.severity || 'info'
      });

      await newEvent.save();
      console.log(`📝 Event logged: ${data.eventType} from ${device.name}`);
    } catch (error) {
      console.error('Error handling event:', error.message);
    }
  }

  // Xử lý kết quả lệnh
  async handleCommandResult(serial, data) {
    try {
      const { commandId, status, result } = data;
      
      const command = await Command.findById(commandId);
      if (command) {
        command.status = status;
        command.result = result || {};
        command.updatedAt = new Date();
        await command.save();
        
        console.log(`⚡ Command ${commandId} ${status}`);
      }
    } catch (error) {
      console.error('Error handling command result:', error.message);
    }
  }

  // Gửi lệnh tới device
  publishCommand(deviceSerial, command) {
    if (!this.isConnected) {
      console.error('MQTT not connected. Cannot send command.');
      return false;
    }

    const topic = `device/${deviceSerial}/command`;
    const payload = JSON.stringify(command);

    this.client.publish(topic, payload, { qos: 1 }, (err) => {
      if (err) {
        console.error(`❌ Failed to send command to ${deviceSerial}:`, err.message);
      } else {
        console.log(`📤 Command sent to ${deviceSerial}: ${command.command}`);
      }
    });

    return true;
  }

  // Gửi message tùy chỉnh
  publish(topic, message, options = { qos: 0 }) {
    if (!this.isConnected) {
      console.error('MQTT not connected. Cannot publish message.');
      return false;
    }

    const payload = typeof message === 'object' ? JSON.stringify(message) : message;
    
    this.client.publish(topic, payload, options, (err) => {
      if (err) {
        console.error(`❌ Failed to publish to ${topic}:`, err.message);
      } else {
        console.log(`📤 Published to ${topic}`);
      }
    });

    return true;
  }

  // Đóng kết nối
  disconnect() {
    if (this.client) {
      this.client.end();
      console.log('✅ MQTT Disconnected');
    }
  }

  // Kiểm tra trạng thái kết nối
  getStatus() {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts
    };
  }

  // Set device offline sau thời gian không có heartbeat
  async checkOfflineDevices() {
    try {
      const offlineThreshold = new Date(Date.now() - 5 * 60 * 1000); // 5 phút
      
      const result = await Device.updateMany(
        { 
          lastSeen: { $lt: offlineThreshold },
          status: { $ne: 'offline' }
        },
        { status: 'offline' }
      );

      if (result.modifiedCount > 0) {
        console.log(`📴 Set ${result.modifiedCount} devices offline`);
      }
    } catch (error) {
      console.error('Error checking offline devices:', error.message);
    }
  }
}

// Tạo instance singleton
const mqttManager = new MQTTManager();

export default mqttManager;

// Export các hàm tiện ích
export const connectMQTT = () => mqttManager.connect();
export const disconnectMQTT = () => mqttManager.disconnect();
export const publishCommand = (serial, command) => mqttManager.publishCommand(serial, command);
export const publishMessage = (topic, message, options) => mqttManager.publish(topic, message, options);
export const getMQTTStatus = () => mqttManager.getStatus();

// Chạy check offline devices mỗi 2 phút
setInterval(() => {
  mqttManager.checkOfflineDevices();
}, 2 * 60 * 1000);