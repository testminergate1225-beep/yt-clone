const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

// Local uploads directory (used when S3 is not configured)
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const isS3Configured =
  process.env.AWS_ACCESS_KEY_ID &&
  process.env.AWS_ACCESS_KEY_ID !== 'your_aws_key' &&
  process.env.S3_BUCKET_NAME &&
  process.env.S3_BUCKET_NAME !== 'your_bucket_name';

let s3;
if (isS3Configured) {
  s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1',
  });
}

/**
 * Upload file — uses S3 when configured, falls back to local disk.
 * Returns { Location, Key }
 */
exports.uploadFile = async (buffer, name, type) => {
  if (isS3Configured) {
    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: name,
      Body: buffer,
      ContentType: type,
      ACL: 'public-read',
    };
    return s3.upload(params).promise();
  }

  // --- Local fallback ---
  const filePath = path.join(UPLOADS_DIR, name);
  fs.writeFileSync(filePath, buffer);
  const port = process.env.PORT || 5000;
  return {
    Location: `http://localhost:${port}/uploads/${name}`,
    Key: name,
  };
};

exports.deleteFile = async (key) => {
  if (isS3Configured) {
    return s3
      .deleteObject({ Bucket: process.env.S3_BUCKET_NAME, Key: key })
      .promise();
  }
  // Local fallback
  const filePath = path.join(UPLOADS_DIR, key);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
};
