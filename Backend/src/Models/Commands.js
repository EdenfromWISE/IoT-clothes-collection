const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CommandSchema = new Schema({
  deviceId: { type: Schema.Types.ObjectId, ref: 'Device', required: true, index: true },
  issuedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  command:  { type: String, enum: ['collect','release','stop','calibrate'], required: true },
  params:   { type: Schema.Types.Mixed }, // param động
  status:   { type: String, enum: ['pending','sent','executed','failed'], default: 'pending' },
  result:   { type: Schema.Types.Mixed }, // phản hồi từ thiết bị
  createdAt:{ type: Date, default: () => new Date(), index: true },
  updatedAt:{ type: Date }
}, { versionKey: false });

// khi device trả kết quả, update status và updatedAt

export default mongoose.model('Command', CommandSchema);
