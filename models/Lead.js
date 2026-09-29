const mongoose = require('mongoose');
module.exports = mongoose.model('Lead', new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, match: /^\d{10}$/ },
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  postTitle: { type: String, required: true },
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  providerPhone: { type: String, required: true }, providerName: String,
  createdAt: { type: Date, default: Date.now }, status: { type: String, enum: ['new', 'contacted', 'closed'], default: 'new' }
}));
