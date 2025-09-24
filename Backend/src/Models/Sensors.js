const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SensorSchema = new Schema({
  deviceId: { type: Schema.Types.ObjectId, ref: 'Device', required: true, index: true },
  type:     { type: String, enum: ['rain','temperature','humidity','light','other'], required: true },
  value:    { type: Schema.Types.Mixed, required: true }, // có thể số, object...
  unit:     { type: String }, // ví dụ: 'mm', '°C', '%'
  meta:     { type: Schema.Types.Mixed }, // ví dụ: raw ADC, quality flags
  createdAt:{ type: Date, default: () => new Date(), index: true } // lưu explicit để dễ query theo thời gian
}, { versionKey: false });

// TTL option: nếu bạn muốn tự động xóa reading cũ (ví dụ > 90 ngày),
// uncomment và set index TTL (chú ý tạo index sau khi model tạo)
// SensorSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 3600 });

module.exports = mongoose.model('Sensor', SensorSchema);
