const router = require('express').Router();
const Lead = require('../models/Lead');
const Post = require('../models/Post');
const { requireAuth, requireAdmin } = require('../middleware/auth');
router.post('/', async (req, res, next) => {
  try {
    const { name, phone, postId } = req.body || {};
    if (!name || !/^\d{10}$/.test(phone || '') || !postId) return res.status(400).json({ message: 'नाम, मोबाइल नंबर और सेवा पोस्ट ज़रूरी हैं।' });
    const post = await Post.findOne({ _id: postId, status: 'approved', expiresAt: { $gt: new Date() } });
    if (!post) return res.status(404).json({ message: 'यह पोस्ट अब उपलब्ध नहीं है।' });
    await Lead.create({ name, phone, post: post._id, postTitle: post.title, providerId: post.owner, providerPhone: post.phone, providerName: post.providerName });
    res.status(201).json({ message: 'आपकी callback request दर्ज हो गई है।' });
  } catch (error) { next(error); }
});
router.get('/admin', requireAuth, requireAdmin, async (_req, res, next) => {
  try { res.json(await Lead.find().sort({ createdAt: -1 }).limit(200)); } catch (error) { next(error); }
});
router.patch('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try { if (!['new', 'contacted', 'closed'].includes(req.body.status)) return res.status(400).json({ message: 'Invalid request status.' }); const item = await Lead.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true, runValidators: true }); if (!item) return res.status(404).json({ message: 'Request not found.' }); res.json(item); } catch (error) { next(error); }
});
module.exports = router;
