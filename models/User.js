const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, unique: true, trim: true },
  email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true }, role: { type: String, enum: ['customer', 'provider', 'admin'], default: 'customer' },
  status: { type: String, enum: ['active', 'suspended'], default: 'active' },
  location: { city: String, state: String, pincode: String },
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('User', userSchema);
