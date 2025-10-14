const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const EventSchema = new Schema({
  deviceId: { type: Schema.Types.ObjectId, ref: 'Device', required: true, index: true },
  eventType:{ type: String, required: true }, // e.g. 'rain_detected', 'manual_collect', 'motor_error'
  message:  { type: String },
  payload:  { type: Schema.Types.Mixed }, // thêm dữ liệu chi tiết
  severity: { type: String, enum: ['info','warn','error'], default: 'info' },
  createdAt:{ type: Date, default: () => new Date(), index: true }
}, { versionKey: false });

export default mongoose.model('Event', EventSchema);
