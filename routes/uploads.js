const router = require('express').Router();
const multer = require('multer');
const { requireAuth } = require('../middleware/auth');

const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1024 * 1024, files: 8 },
  fileFilter: (_req, file, done) => {
    if (!allowedTypes.has(file.mimetype)) return done(new Error('Only JPG, PNG, or WebP images are allowed.'));
    done(null, true);
  }
});

// Keep uploads in memory and return data URLs; the post API stores these strings in MongoDB.
router.post('/', requireAuth, upload.array('photos', 8), (req, res) => {
  const images = req.files.map(file => `data:${file.mimetype};base64,${file.buffer.toString('base64')}`);
  res.status(201).json({ images });
});

module.exports = router;
