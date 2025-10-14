const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true }, // lưu bcrypt hash
  fullName: { type: String },
  role:     { type: String, enum: ['admin', 'user'], default: 'user' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// index tìm kiếm
UserSchema.index({ username: 1 });
UserSchema.index({ email: 1 });

export default mongoose.model('User', UserSchema);
