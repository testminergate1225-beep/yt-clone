const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require('../middleware/auth');
const {
  listMedia,
  uploadMedia,
  getMedia,
  searchMedia,
  incrementViews,
  likeMedia,
  dislikeMedia,
  addComment,
  getTrending,
  regenerateThumbnails,
  deleteMedia,
  updateMedia,
  getUserMedia,
} = require('../controllers/mediaController');

// Disk storage for large files (up to 1 GB) — avoids loading entire file into RAM
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}_${safeName}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 * 1024 } });

// Accept both the main file and an optional client-generated thumbnail
const uploadFields = upload.fields([
  { name: 'file', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 },
]);

// Multer error handler middleware
const handleUpload = (req, res, next) => {
  uploadFields(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File too large (max 1 GB)' });
      }
      return res.status(400).json({ message: err.message });
    }
    // Normalize: put the main file on req.file for backward compat
    if (req.files && req.files.file && req.files.file[0]) {
      req.file = req.files.file[0];
    }
    next();
  });
};

// Public routes
router.get('/feed', listMedia);
router.get('/search', searchMedia);
router.get('/trending', getTrending);
router.post('/regenerate-thumbnails', regenerateThumbnails);
router.get('/user/:userId', getUserMedia);
router.get('/:id', getMedia);
router.put('/:id/view', incrementViews);

// Protected routes
router.post('/upload', protect, handleUpload, uploadMedia);
router.put('/:id', protect, updateMedia);
router.delete('/:id', protect, deleteMedia);
router.put('/:id/like', protect, likeMedia);
router.put('/:id/dislike', protect, dislikeMedia);
router.post('/:id/comment', protect, addComment);

module.exports = router;
