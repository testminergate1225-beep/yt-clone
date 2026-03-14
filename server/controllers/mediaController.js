const Media = require('../models/Media');
const fs = require('fs');
const path = require('path');
const { uploadFile } = require('../utils/s3');
const { generateThumbnail } = require('../utils/thumbnail');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

// List public media for home feed (with pagination)
exports.listMedia = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const type = req.query.type; // optional filter

    const filter = { privacy: 'public' };
    if (type) filter.type = type;

    const total = await Media.countDocuments(filter);
    const items = await Media.find(filter)
      .populate('uploader', 'username profilePic')
      .sort({ uploadDate: -1 })
      .skip(skip)
      .limit(limit);

    res.json({ items, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Upload media
exports.uploadMedia = async (req, res) => {
  try {
    const { title, description, type, privacy } = req.body;
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Validate file size (2 GB limit)
    if (req.file.size > 2 * 1024 * 1024 * 1024) {
      return res.status(400).json({ message: 'File too large (max 2GB)' });
    }

    const timestamp = Date.now();
    const safeName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');

    // File is already saved to disk by multer diskStorage
    // Build the public URL from the filename
    const port = process.env.PORT || 5000;
    const fileURL = `http://localhost:${port}/uploads/${req.file.filename}`;

    // Generate and upload thumbnail
    // Prefer client-provided thumbnail (extracted video frame) over server placeholder
    let thumbnailURL = '';
    try {
      let thumbBuffer;
      const clientThumb = req.files && req.files.thumbnail && req.files.thumbnail[0];
      if (clientThumb) {
        // Client thumbnail is also on disk — read it, resize, then save
        const sharp = require('sharp');
        const clientThumbData = fs.readFileSync(clientThumb.path);
        thumbBuffer = await sharp(clientThumbData)
          .resize(640, 360, { fit: 'cover' })
          .jpeg({ quality: 85 })
          .toBuffer();
        // Remove the raw client thumbnail file from disk
        try { fs.unlinkSync(clientThumb.path); } catch (_e) { /* ignore */ }
      } else {
        // Read a small portion of the file for server-side thumbnail generation
        // For images, read the full file; for video/music, just generate a placeholder
        let fileBuffer = null;
        if (type === 'image') {
          fileBuffer = fs.readFileSync(req.file.path);
        }
        thumbBuffer = await generateThumbnail(fileBuffer, type, safeName);
      }
      const thumbName = `thumb_${timestamp}_${safeName}.jpg`;
      const thumbPath = path.join(UPLOADS_DIR, thumbName);
      fs.writeFileSync(thumbPath, thumbBuffer);
      thumbnailURL = `http://localhost:${port}/uploads/${thumbName}`;
    } catch (thumbErr) {
      console.warn('Thumbnail generation failed, continuing without:', thumbErr.message);
    }

    const media = await Media.create({
      title,
      description,
      type,
      fileURL,
      thumbnailURL,
      uploader: req.user._id,
      privacy: privacy || 'public',
    });
    res.status(201).json(media);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get single media by ID
exports.getMedia = async (req, res) => {
  try {
    const media = await Media.findById(req.params.id)
      .populate('uploader', 'username profilePic subscribers')
      .populate('comments.user', 'username profilePic');
    if (!media) return res.status(404).json({ message: 'Not found' });
    res.json(media);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Search media
exports.searchMedia = async (req, res) => {
  const { q } = req.query;
  if (!q || !q.trim()) {
    return res.json([]);
  }
  try {
    const regex = new RegExp(q, 'i');
    const results = await Media.find({
      $or: [{ title: regex }, { description: regex }],
      privacy: 'public',
    })
      .populate('uploader', 'username profilePic')
      .sort({ uploadDate: -1 })
      .limit(50);
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Increment views
exports.incrementViews = async (req, res) => {
  try {
    const media = await Media.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );
    if (!media) return res.status(404).json({ message: 'Not found' });
    res.json({ views: media.views });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Like media
exports.likeMedia = async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);
    if (!media) return res.status(404).json({ message: 'Not found' });

    const userId = req.user._id;
    // Remove from dislikes if present
    media.dislikes = media.dislikes.filter((id) => !id.equals(userId));

    if (media.likes.some((id) => id.equals(userId))) {
      media.likes = media.likes.filter((id) => !id.equals(userId));
    } else {
      media.likes.push(userId);
    }
    await media.save();
    res.json({ likes: media.likes.length, dislikes: media.dislikes.length });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Dislike media
exports.dislikeMedia = async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);
    if (!media) return res.status(404).json({ message: 'Not found' });

    const userId = req.user._id;
    media.likes = media.likes.filter((id) => !id.equals(userId));

    if (media.dislikes.some((id) => id.equals(userId))) {
      media.dislikes = media.dislikes.filter((id) => !id.equals(userId));
    } else {
      media.dislikes.push(userId);
    }
    await media.save();
    res.json({ likes: media.likes.length, dislikes: media.dislikes.length });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Add comment
exports.addComment = async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);
    if (!media) return res.status(404).json({ message: 'Not found' });

    media.comments.push({ user: req.user._id, text: req.body.text });
    await media.save();

    const updated = await Media.findById(req.params.id)
      .populate('comments.user', 'username profilePic');
    res.json(updated.comments);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Trending: top viewed in last 24 hours
exports.getTrending = async (req, res) => {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const items = await Media.find({
      privacy: 'public',
      uploadDate: { $gte: oneDayAgo },
    })
      .populate('uploader', 'username profilePic')
      .sort({ views: -1 })
      .limit(20);
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Regenerate thumbnails for all media that have empty thumbnailURL
exports.regenerateThumbnails = async (req, res) => {
  try {
    const mediaList = await Media.find({
      $or: [{ thumbnailURL: '' }, { thumbnailURL: { $exists: false } }, { thumbnailURL: null }],
    });

    if (mediaList.length === 0) {
      return res.json({ message: 'All media already have thumbnails', updated: 0 });
    }

    let updated = 0;
    const errors = [];

    for (const media of mediaList) {
      try {
        // Extract filename from fileURL (e.g., http://localhost:5000/uploads/123_file.mp4 → 123_file.mp4)
        const urlParts = media.fileURL.split('/');
        const filename = urlParts[urlParts.length - 1];
        const filePath = path.join(UPLOADS_DIR, filename);

        let fileBuffer;
        if (fs.existsSync(filePath)) {
          fileBuffer = fs.readFileSync(filePath);
        } else {
          // File not on disk, generate a placeholder based on type
          fileBuffer = null;
        }

        const thumbBuffer = await generateThumbnail(fileBuffer, media.type, filename);
        const timestamp = Date.now();
        const thumbResult = await uploadFile(
          thumbBuffer,
          `thumb_${timestamp}_${filename}.jpg`,
          'image/jpeg'
        );

        media.thumbnailURL = thumbResult.Location;
        await media.save();
        updated++;
      } catch (err) {
        errors.push({ id: media._id, title: media.title, error: err.message });
      }
    }

    res.json({ message: `Regenerated ${updated} thumbnails`, updated, errors });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete media (owner only)
exports.deleteMedia = async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);
    if (!media) return res.status(404).json({ message: 'Not found' });

    // Only the uploader can delete
    if (!media.uploader.equals(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Delete files from disk/S3
    const { deleteFile } = require('../utils/s3');
    try {
      const fileKey = media.fileURL.split('/').pop();
      await deleteFile(fileKey);
    } catch (fileErr) {
      console.warn('Could not delete media file:', fileErr.message);
    }
    if (media.thumbnailURL) {
      try {
        const thumbKey = media.thumbnailURL.split('/').pop();
        await deleteFile(thumbKey);
      } catch (thumbErr) {
        console.warn('Could not delete thumbnail:', thumbErr.message);
      }
    }

    await Media.findByIdAndDelete(req.params.id);
    res.json({ message: 'Media deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update media title/description (owner only)
exports.updateMedia = async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);
    if (!media) return res.status(404).json({ message: 'Not found' });

    if (!media.uploader.equals(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { title, description, privacy } = req.body;
    if (title !== undefined) media.title = title;
    if (description !== undefined) media.description = description;
    if (privacy !== undefined) media.privacy = privacy;

    await media.save();
    const updated = await Media.findById(req.params.id)
      .populate('uploader', 'username profilePic');
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get media uploaded by a specific user
exports.getUserMedia = async (req, res) => {
  try {
    const items = await Media.find({ uploader: req.params.userId })
      .populate('uploader', 'username profilePic')
      .sort({ uploadDate: -1 });
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
