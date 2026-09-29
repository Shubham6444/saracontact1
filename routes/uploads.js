const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { requireAuth } = require('../middleware/auth');
const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (_req, _file, done) => done(null, uploadDir),
  filename: (_req, file, done) => done(null, `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`)
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024, files: 8 }, fileFilter: (_req, file, done) => {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) return done(new Error('केवल JPG, PNG या WebP तस्वीरें अपलोड करें।'));
  done(null, true);
} });
router.post('/', requireAuth, upload.array('photos', 8), (req, res) => res.status(201).json({ images: req.files.map(file => `/uploads/${file.filename}`) }));
module.exports = router;
