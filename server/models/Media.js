const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  replies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
});

const MediaSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  uploader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['video', 'music', 'movie', 'image'], required: true },
  fileURL: { type: String, required: true },
  thumbnailURL: { type: String },
  views: { type: Number, default: 0 },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  dislikes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [CommentSchema],
  privacy: { type: String, enum: ['public', 'private'], default: 'public' },
  uploadDate: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Media', MediaSchema);
