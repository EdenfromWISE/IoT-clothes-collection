import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const NotificationSchema = new Schema({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    index: true 
  },
  deviceId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Device' // ESP32 device liên quan
  },
  title: { 
    type: String, 
    required: true 
  },
  message: { 
    type: String, 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['rain_alert', 'device_offline', 'motor_complete', 'system_alert', 'manual'],
    required: true 
  },
  priority: { 
    type: String, 
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal' 
  },
  data: { 
    type: Schema.Types.Mixed // Dữ liệu bổ sung (deviceSerial, sensorValues...)
  },
  sentTo: [{
    deviceToken: String,
    platform: String,
    sentAt: Date,
    status: { 
      type: String, 
      enum: ['pending', 'sent', 'delivered', 'failed'],
      default: 'pending' 
    },
    error: String
  }],
  isRead: { 
    type: Boolean, 
    default: false 
  },
  readAt: Date
}, { 
  timestamps: true 
});

// Index để query hiệu quả
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ type: 1, createdAt: -1 });
NotificationSchema.index({ isRead: 1, userId: 1 });

export default mongoose.model('Notification', NotificationSchema);