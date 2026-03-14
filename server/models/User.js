const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profilePic: { type: String },
  bio: { type: String },
  subscribers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  subscriptions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now },

  // Dashboard customization
  dashboard: {
    channelName: { type: String, default: '' },
    bannerColor: { type: String, default: '' },
    bannerImage: { type: String, default: '' },
    accentColor: { type: String, default: '#3ea6ff' },
    layout: { type: String, enum: ['grid', 'list'], default: 'grid' },
    featuredVideo: { type: mongoose.Schema.Types.ObjectId, ref: 'Media', default: null },
    showSubscriberCount: { type: Boolean, default: true },
    defaultTab: { type: String, enum: ['uploads', 'about'], default: 'uploads' },
    socialLinks: {
      website: { type: String, default: '' },
      twitter: { type: String, default: '' },
      instagram: { type: String, default: '' },
      github: { type: String, default: '' },
    },
    sortOrder: { type: String, enum: ['newest', 'oldest', 'popular'], default: 'newest' },
  },
});

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
