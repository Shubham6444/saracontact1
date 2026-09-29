const router = require('express').Router();
const Post = require('../models/Post');
const { requireAuth, requireAdmin } = require('../middleware/auth');
router.get('/', async (req, res, next) => {
  try {
    const query = { status: 'approved', expiresAt: { $gt: new Date() } };
    if (req.query.type) query.type = req.query.type;
    if (req.query.category) query.category = new RegExp(req.query.category, 'i');
    for (const field of ['city', 'state', 'pincode']) if (req.query[field]) query[`location.${field}`] = new RegExp(`^${req.query[field]}`, 'i');
    if (req.query.location) {
      const term = String(req.query.location).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = ['address', 'city', 'state', 'pincode'].map(field => ({ [`location.${field}`]: new RegExp(term, 'i') }));
    }
    if (req.query.available === 'true' || req.query.available === 'false') query.available = req.query.available === 'true';
    if (req.query.q) query.$text = { $search: req.query.q };
    res.json(await Post.find(query).sort({ createdAt: -1 }).limit(100));
  } catch (error) { next(error); }
});
router.get('/mine', requireAuth, async (req, res, next) => {
  try { await Post.updateMany({ status: { $in: ['approved', 'pending'] }, expiresAt: { $lte: new Date() } }, { status: 'expired' }); const filter = req.session.user.role === 'admin' ? {} : { owner: req.session.user.id }; res.json(await Post.find(filter).sort({ createdAt: -1 })); } catch (error) { next(error); }
});
router.get('/admin/all', requireAuth, requireAdmin, async (_req, res, next) => { try { await Post.updateMany({ status: { $in: ['approved', 'pending'] }, expiresAt: { $lte: new Date() } }, { status: 'expired' }); res.json(await Post.find().sort({ createdAt: -1 })); } catch (error) { next(error); } });
router.get('/:id', async (req, res, next) => {
  try {
    const post = await Post.findOne({ _id: req.params.id, status: 'approved', expiresAt: { $gt: new Date() } });
    if (!post) return res.status(404).json({ message: 'यह पोस्ट अब उपलब्ध नहीं है।' });
    res.json(post);
  } catch (error) { next(error); }
});
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const data = { ...req.body, owner: req.session.user.role === 'admin' ? undefined : req.session.user.id, providerName: req.body.providerName || req.session.user.name };
    if (!data.title || !data.category || !data.phone) return res.status(400).json({ message: 'Title, category and contact number are required.' });
    if (!/^\d{10}$/.test(String(data.phone))) return res.status(400).json({ message: 'संपर्क नंबर 10 अंकों का होना चाहिए।' });
    const waNumber = String(data.whatsapp || data.phone).replace(/\D/g, '');
    if (waNumber.length === 10) data.whatsapp = `91${waNumber}`;
    else if (waNumber.length === 12 && waNumber.startsWith('91')) data.whatsapp = waNumber;
    else return res.status(400).json({ message: 'WhatsApp नंबर 10 अंकों का भारतीय नंबर या 91 के साथ 12 अंक होना चाहिए।' });
    data.images = Array.isArray(data.images) ? data.images.slice(0, 8) : [];
    if (data.type !== 'job' && data.images.length < 3) return res.status(400).json({ message: 'सेवा पोस्ट के लिए कम से कम 3 तस्वीरें अपलोड करें।' });
    data.status = 'approved';
    data.approvedAt = new Date();
    if (data.type === 'job') data.expiresAt = new Date(Date.now() + 7 * 86400000);
    const post = await Post.create(data); res.status(201).json(post);
  } catch (error) { next(error); }
});
router.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id); if (!post) return res.status(404).json({ message: 'Post not found.' });
    if (req.session.user.role !== 'admin' && String(post.owner) !== req.session.user.id) return res.status(403).json({ message: 'You can edit your own posts only.' });
    const updates = { ...req.body }; delete updates.owner; delete updates.status;
    if (updates.phone !== undefined && !/^\d{10}$/.test(String(updates.phone))) return res.status(400).json({ message: 'संपर्क नंबर 10 अंकों का होना चाहिए।' });
    if (updates.whatsapp !== undefined) {
      const waNumber = String(updates.whatsapp || updates.phone || post.phone).replace(/\D/g, '');
      if (waNumber.length === 10) updates.whatsapp = `91${waNumber}`;
      else if (waNumber.length === 12 && waNumber.startsWith('91')) updates.whatsapp = waNumber;
      else return res.status(400).json({ message: 'WhatsApp नंबर 10 अंकों का भारतीय नंबर या 91 के साथ 12 अंक होना चाहिए।' });
    }
    if (req.session.user.role === 'admin' && req.body.status) {
      if (!['pending', 'approved', 'held', 'rejected', 'expired'].includes(req.body.status)) return res.status(400).json({ message: 'Invalid post status.' });
      updates.status = req.body.status; if (updates.status === 'approved') updates.approvedAt = new Date();
    }
    Object.assign(post, updates); await post.save(); res.json(post);
  } catch (error) { next(error); }
});
router.patch('/:id/review', requireAuth, requireAdmin, async (req, res, next) => {
  try { const status = req.body.status; if (!['approved', 'held', 'rejected', 'pending'].includes(status)) return res.status(400).json({ message: 'Invalid review status.' }); const post = await Post.findByIdAndUpdate(req.params.id, { status, ...(status === 'approved' ? { approvedAt: new Date() } : {}) }, { new: true }); if (!post) return res.status(404).json({ message: 'Post not found.' }); res.json(post); } catch (error) { next(error); }
});
router.delete('/:id', requireAuth, async (req, res, next) => {
  try { const post = await Post.findById(req.params.id); if (!post) return res.status(404).json({ message: 'Post not found.' }); if (req.session.user.role !== 'admin' && String(post.owner) !== req.session.user.id) return res.status(403).json({ message: 'You can delete your own posts only.' }); await post.deleteOne(); res.json({ message: 'Post deleted.' }); } catch (error) { next(error); }
});
module.exports = router;
