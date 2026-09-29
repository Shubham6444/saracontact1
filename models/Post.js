const mongoose = require('mongoose');
const postSchema = new mongoose.Schema({
  type: { type: String, enum: ['service', 'job'], default: 'service' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  providerName: { type: String, required: true, trim: true }, businessName: String, category: { type: String, required: true },
  customCategory: String, title: { type: String, required: true, trim: true }, description: String,
  images: [{ type: String }], phone: { type: String, required: true }, whatsapp: String, alternatePhone: String,
  location: { address: String, city: String, state: String, pincode: String },
  available: { type: Boolean, default: true }, hoursMode: { type: String, enum: ['manual', 'schedule'], default: 'manual' },
  hours: String, listingKind: String, details: mongoose.Schema.Types.Mixed,
  status: { type: String, enum: ['pending', 'approved', 'held', 'rejected', 'expired'], default: 'approved' },
  approvedAt: Date, expiresAt: { type: Date, default: () => new Date(Date.now() + 10 * 86400000) }
}, { timestamps: true });
postSchema.index({ title: 'text', description: 'text', category: 'text', 'location.city': 'text' });
module.exports = mongoose.model('Post', postSchema);
