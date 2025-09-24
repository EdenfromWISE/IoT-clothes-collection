import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const UserDeviceSchema = new Schema({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    index: true 
  },
  deviceType: { 
    type: String, 
    enum: ['mobile', 'web', 'desktop'], 
    required: true 
  },
  platform: { 
    type: String, 
    enum: ['android', 'ios', 'web', 'windows', 'macos', 'linux'],
    required: true 
  },
  deviceToken: { 
    type: String, 
    required: true,
    unique: true // FCM token hoặc web push endpoint
  },
  deviceInfo: {
    name: String,        // "iPhone 13", "Chrome Browser"
    model: String,       // "iPhone13,2"
    os: String,          // "iOS 15.0", "Windows 11"
    appVersion: String,  // "1.0.0"
    browser: String      // "Chrome 91.0" (cho web)
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  lastSeen: { 
    type: Date, 
    default: Date.now 
  },
  notificationSettings: {
    enabled: { type: Boolean, default: true },
    rainAlert: { type: Boolean, default: true },
    deviceOffline: { type: Boolean, default: true },
    motorComplete: { type: Boolean, default: true },
    systemAlert: { type: Boolean, default: true }
  }
}, { 
  timestamps: true 
});

// Index để tìm kiếm nhanh
UserDeviceSchema.index({ userId: 1, isActive: 1 });
UserDeviceSchema.index({ deviceToken: 1 });

export default mongoose.model('UserDevice', UserDeviceSchema);