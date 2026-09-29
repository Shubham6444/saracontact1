const mongoose = require('mongoose');
const dns = require('node:dns');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Category = require('../models/Category');

const defaultCategories = [
  ['प्लंबर', '🔧'], ['इलेक्ट्रिशियन', '⚡'], ['घर की सफ़ाई', '🧹'], ['ब्यूटी पार्लर', '💇'],
  ['पेंटर', '🎨'], ['AC सर्विस', '❄️'], ['कारपेंटर', '🪚'], ['बाइक/कार मैकेनिक', '🏍️'],
  ['कंप्यूटर/मोबाइल रिपेयर', '📱'], ['दुकान', '🏪'], ['टेंट/इवेंट', '🎪'], ['अन्य सेवा', '🧰']
];

async function provisionConfiguredAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.warn('ADMIN_EMAIL or ADMIN_PASSWORD is not configured; admin bootstrap skipped.');
    return;
  }
  const existing = await User.findOne({ email });
  if (existing && existing.role !== 'admin') {
    throw new Error(`ADMIN_EMAIL ${email} belongs to a non-admin account; choose another ADMIN_EMAIL.`);
  }
  await User.findOneAndUpdate({ email }, {
    $set: {
      name: 'Platform Administrator', email,
      passwordHash: await bcrypt.hash(password, 12), role: 'admin', status: 'active'
    }
  }, { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true });
  console.log(`Configured admin account is ready: ${email}`);
}

async function connectDatabase() {
  const dnsServers = process.env.MONGO_DNS_SERVERS?.split(',').map(value => value.trim()).filter(Boolean);
  if (dnsServers?.length) dns.setServers(dnsServers);
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGO_URI (or MONGODB_URI) is missing.');
  try {
    await mongoose.connect(uri, { family: 4, serverSelectionTimeoutMS: 10000 });
    console.log('MongoDB connected successfully');
    await provisionConfiguredAdmin();
    await Category.bulkWrite(defaultCategories.map(([name, icon]) => ({
      updateOne: { filter: { name }, update: { $setOnInsert: { name, icon } }, upsert: true }
    })));
  } catch (error) {
    console.error('MongoDB startup failed:', error.message);
    await mongoose.disconnect().catch(() => {});
    throw error;
  }
}

module.exports = connectDatabase;
