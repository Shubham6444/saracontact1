const router = require('express').Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.get('/me', (req, res) => res.json({ user: req.session.user || null }));
router.get('/admin/users', requireAuth, requireAdmin, async (_req, res, next) => {
  try { res.json(await User.find().select('-passwordHash').sort({ createdAt: -1 })); } catch (error) { next(error); }
});
router.patch('/admin/users/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const updates = {};
    for (const key of ['name', 'phone', 'role', 'location']) if (req.body[key] !== undefined) updates[key] = req.body[key];
    if (updates.role && !['customer', 'provider'].includes(updates.role)) return res.status(400).json({ message: 'Invalid user role.' });
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).select('-passwordHash');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json(user);
  } catch (error) { next(error); }
});
router.delete('/admin/users/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try { const user = await User.findByIdAndDelete(req.params.id); if (!user) return res.status(404).json({ message: 'User not found.' }); await require('../models/Post').deleteMany({ owner: user._id }); res.json({ message: 'User and their posts deleted.' }); } catch (error) { next(error); }
});
router.post('/signup', async (req, res, next) => {
  try {
    const { name, phone, password, role = 'customer', city, state, pincode } = req.body || {};
    if (!name || !/^\d{10}$/.test(phone || '') || !password || password.length < 6) return res.status(400).json({ message: 'Name, 10 digit mobile number, and password (6+ characters) are required.' });
    if (!['customer', 'provider'].includes(role)) return res.status(400).json({ message: 'Choose customer or provider.' });
    const user = await User.create({ name, phone, passwordHash: await bcrypt.hash(password, 10), role, location: { city, state, pincode } });
    req.session.user = { id: user.id, name: user.name, phone: user.phone, role: user.role };
    res.status(201).json({ user: req.session.user });
  } catch (error) { if (error.code === 11000) return res.status(409).json({ message: 'This mobile number is already registered.' }); next(error); }
});
router.post('/login', async (req, res, next) => {
  try {
    const { phone, password, username } = req.body || {};
    const identity = String(username || phone || '').trim();
    const user = identity.includes('@')
      ? await User.findOne({ email: identity.toLowerCase() })
      : await User.findOne({ phone: identity });
    if (!user && !process.env.ADMIN_EMAIL && identity === (process.env.ADMIN_USERNAME || 'admin') && password === (process.env.ADMIN_PASSWORD || 'pass1234')) {
      req.session.user = { id: 'admin', name: 'Admin', role: 'admin' }; return res.json({ user: req.session.user });
    }
    if (!user || user.status === 'suspended' || !(await bcrypt.compare(password || '', user.passwordHash))) return res.status(401).json({ message: 'Mobile/email or password is incorrect.' });
    req.session.user = { id: user.id, name: user.name, phone: user.phone, email: user.email, role: user.role };
    res.json({ user: req.session.user });
  } catch (error) { next(error); }
});
router.post('/logout', (req, res) => req.session.destroy(() => res.json({ message: 'Signed out.' })));
router.patch('/profile', requireAuth, async (req, res, next) => {
  try {
    if (req.session.user.role === 'admin') return res.status(400).json({ message: 'Admin profile is managed through environment settings.' });
    const allowed = ['name', 'phone', 'location']; const updates = {};
    for (const key of allowed) if (req.body[key] !== undefined) updates[key] = req.body[key];
    const user = await User.findByIdAndUpdate(req.session.user.id, updates, { new: true, runValidators: true });
    req.session.user.name = user.name; req.session.user.phone = user.phone;
    res.json({ user: req.session.user });
  } catch (error) { next(error); }
});
router.delete('/profile', requireAuth, async (req, res, next) => {
  try {
    if (req.session.user.role === 'admin') return res.status(400).json({ message: 'Admin account cannot be deleted here.' });
    await User.findByIdAndDelete(req.session.user.id); req.session.destroy(() => res.json({ message: 'Account deleted.' }));
  } catch (error) { next(error); }
});
module.exports = router;
