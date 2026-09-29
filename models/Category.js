const mongoose = require('mongoose');
module.exports = mongoose.model('Category', new mongoose.Schema({
  name: { type: String, required: true, trim: true, unique: true }, icon: { type: String, default: '🧰' },
  active: { type: Boolean, default: true }
}, { timestamps: true }));
