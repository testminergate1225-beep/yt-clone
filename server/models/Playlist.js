const mongoose = require('mongoose');

const PlaylistSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  media: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Media' }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Playlist', PlaylistSchema);
