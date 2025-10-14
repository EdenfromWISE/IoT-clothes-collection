const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DeviceSchema = new Schema({
  name:     { type: String, required: true },
  owner:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
  serial:   { type: String, unique: true, required: true }, // ví dụ MAC hoặc ID thiết bị
  location: { type: String }, // mô tả vị trí
  status:   { type: String, enum: ['online','offline','unknown'], default: 'unknown' },
  meta:     { type: Schema.Types.Mixed }, // cấu hình thêm (maxLength, motor type...)
  lastSeen: { type: Date }, // thời điểm thiết bị báo về
  // Lưu trạng thái motor/relay hiện tại để tra cứu nhanh:
  motorState: { type: String, enum: ['idle','collecting','releasing','stopped'], default: 'idle' }
}, { timestamps: true });

// index để tra cứu nhanh theo owner và serial
DeviceSchema.index({ owner: 1 });
DeviceSchema.index({ serial: 1 });

export default mongoose.model('Device', DeviceSchema);
