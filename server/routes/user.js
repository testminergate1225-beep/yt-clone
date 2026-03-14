const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require('../middleware/auth');
const User = require('../models/User');

// Multer for banner image upload
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
const bannerStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `banner_${Date.now()}${ext}`);
  },
});
const bannerUpload = multer({
  storage: bannerStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

// ---- Dashboard customization routes (before /:id catch-all) ----

// Update dashboard customization
router.put('/dashboard/customize', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const {
      channelName, bannerColor, accentColor, layout,
      featuredVideo, showSubscriberCount, defaultTab,
      socialLinks, sortOrder, bio,
    } = req.body;

    // Update bio at top level
    if (bio !== undefined) user.bio = bio;

    // Ensure dashboard sub-doc exists
    if (!user.dashboard) user.dashboard = {};

    if (channelName !== undefined) user.dashboard.channelName = channelName;
    if (bannerColor !== undefined) user.dashboard.bannerColor = bannerColor;
    if (accentColor !== undefined) user.dashboard.accentColor = accentColor;
    if (layout !== undefined) user.dashboard.layout = layout;
    if (featuredVideo !== undefined) user.dashboard.featuredVideo = featuredVideo || null;
    if (showSubscriberCount !== undefined) user.dashboard.showSubscriberCount = showSubscriberCount;
    if (defaultTab !== undefined) user.dashboard.defaultTab = defaultTab;
    if (sortOrder !== undefined) user.dashboard.sortOrder = sortOrder;
    if (socialLinks !== undefined) {
      if (!user.dashboard.socialLinks) user.dashboard.socialLinks = {};
      if (socialLinks.website !== undefined) user.dashboard.socialLinks.website = socialLinks.website;
      if (socialLinks.twitter !== undefined) user.dashboard.socialLinks.twitter = socialLinks.twitter;
      if (socialLinks.instagram !== undefined) user.dashboard.socialLinks.instagram = socialLinks.instagram;
      if (socialLinks.github !== undefined) user.dashboard.socialLinks.github = socialLinks.github;
    }

    await user.save();
    const updated = await User.findById(req.user._id).select('-password');
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload banner image
router.post('/dashboard/banner', protect, (req, res) => {
  bannerUpload.single('banner')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    try {
      const port = process.env.PORT || 5000;
      const bannerURL = `http://localhost:${port}/uploads/${req.file.filename}`;

      const user = await User.findById(req.user._id);
      if (!user.dashboard) user.dashboard = {};

      // Delete old banner file if it exists
      if (user.dashboard.bannerImage) {
        const oldFile = user.dashboard.bannerImage.split('/').pop();
        const oldPath = path.join(uploadsDir, oldFile);
        try { if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath); } catch (_e) { /* ignore */ }
      }

      user.dashboard.bannerImage = bannerURL;
      await user.save();

      const updated = await User.findById(req.user._id).select('-password');
      res.json(updated);
    } catch (saveErr) {
      console.error(saveErr);
      res.status(500).json({ message: 'Server error' });
    }
  });
});

// Upload profile picture
router.post('/dashboard/avatar', protect, (req, res) => {
  bannerUpload.single('avatar')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    try {
      const port = process.env.PORT || 5000;
      const avatarURL = `http://localhost:${port}/uploads/${req.file.filename}`;

      const user = await User.findById(req.user._id);

      // Delete old avatar file if it exists
      if (user.profilePic) {
        const oldFile = user.profilePic.split('/').pop();
        const oldPath = path.join(uploadsDir, oldFile);
        try { if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath); } catch (_e) { /* ignore */ }
      }

      user.profilePic = avatarURL;
      await user.save();

      const updated = await User.findById(req.user._id).select('-password');
      res.json(updated);
    } catch (saveErr) {
      console.error(saveErr);
      res.status(500).json({ message: 'Server error' });
    }
  });
});

// ---- Parameterized routes (must come after static routes) ----

// get user by id
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// subscribe/unsubscribe
router.post('/:id/subscribe', protect, async (req, res) => {
  try {
    const target = await User.findById(req.params.id);
    const me = await User.findById(req.user._id);
    if (!target) return res.status(404).json({ message: 'User not found' });
    if (me.subscriptions.includes(target._id)) {
      me.subscriptions.pull(target._id);
      target.subscribers.pull(me._id);
    } else {
      me.subscriptions.push(target._id);
      target.subscribers.push(me._id);
    }
    await me.save();
    await target.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
