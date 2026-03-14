const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * Generate a thumbnail for an image buffer using sharp.
 * Returns the thumbnail buffer (JPEG, 320px wide).
 */
async function generateImageThumbnail(buffer) {
  return sharp(buffer)
    .resize(320, 180, { fit: 'cover' })
    .jpeg({ quality: 80 })
    .toBuffer();
}

/**
 * Create a visually distinct video placeholder thumbnail using sharp (no ffmpeg needed).
 * Uses the video filename to generate a unique gradient color.
 */
async function generateVideoPlaceholder(filename) {
  // Simple hash from filename to pick a gradient color
  let hash = 0;
  for (let i = 0; i < (filename || '').length; i++) {
    hash = ((hash << 5) - hash + filename.charCodeAt(i)) | 0;
  }
  const hue = Math.abs(hash) % 360;

  const svg = `
    <svg width="320" height="180" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:hsl(${hue},30%,15%)"/>
          <stop offset="100%" style="stop-color:hsl(${(hue + 40) % 360},40%,10%)"/>
        </linearGradient>
      </defs>
      <rect width="320" height="180" fill="url(#bg)"/>
      <circle cx="160" cy="90" r="30" fill="rgba(255,255,255,0.15)"/>
      <polygon points="150,74 150,106 178,90" fill="rgba(255,255,255,0.9)"/>
    </svg>`;

  return sharp(Buffer.from(svg))
    .jpeg({ quality: 85 })
    .toBuffer();
}

/**
 * Generate a music-themed placeholder thumbnail.
 */
async function generateMusicPlaceholder() {
  const svg = `
    <svg width="320" height="180" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="mbg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#1a1a2e"/>
          <stop offset="100%" style="stop-color:#16213e"/>
        </linearGradient>
      </defs>
      <rect width="320" height="180" fill="url(#mbg)"/>
      <circle cx="160" cy="90" r="40" fill="none" stroke="#3ea6ff" stroke-width="2.5"/>
      <circle cx="160" cy="90" r="15" fill="#3ea6ff" opacity="0.3"/>
      <text x="160" y="100" text-anchor="middle" font-size="32" fill="#3ea6ff" font-family="Arial">&#9835;</text>
    </svg>`;

  return sharp(Buffer.from(svg))
    .jpeg({ quality: 85 })
    .toBuffer();
}

/**
 * Generate a default dark placeholder.
 */
async function generateDefaultPlaceholder() {
  const svg = `
    <svg width="320" height="180" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="180" fill="#1a1a1a"/>
      <circle cx="160" cy="90" r="28" fill="rgba(255,255,255,0.1)"/>
      <polygon points="150,74 150,106 178,90" fill="rgba(255,255,255,0.5)"/>
    </svg>`;

  return sharp(Buffer.from(svg))
    .jpeg({ quality: 80 })
    .toBuffer();
}

/**
 * Main entry point: generate thumbnail based on media type.
 * @param {Buffer} fileBuffer - The original file buffer
 * @param {string} mediaType - 'video' | 'movie' | 'image' | 'music'
 * @param {string} filename - Original filename
 * @returns {Buffer} - JPEG thumbnail buffer
 */
async function generateThumbnail(fileBuffer, mediaType, filename) {
  try {
    switch (mediaType) {
      case 'image':
        if (fileBuffer) return await generateImageThumbnail(fileBuffer);
        return await generateDefaultPlaceholder();
      case 'video':
      case 'movie':
        return await generateVideoPlaceholder(filename);
      case 'music':
        return await generateMusicPlaceholder();
      default:
        return await generateDefaultPlaceholder();
    }
  } catch (err) {
    console.warn('Thumbnail generation error, using fallback:', err.message);
    return await generateDefaultPlaceholder();
  }
}

module.exports = { generateThumbnail };
