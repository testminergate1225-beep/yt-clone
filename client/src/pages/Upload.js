import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import MenuItem from '@mui/material/MenuItem';
import Alert from '@mui/material/Alert';
import LinearProgress from '@mui/material/LinearProgress';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';

const ACCEPTED = {
  video: 'video/mp4,video/webm,video/quicktime',
  music: 'audio/mpeg,audio/wav,audio/ogg',
  image: 'image/jpeg,image/png,image/webp,image/gif',
  movie: 'video/mp4,video/webm,video/quicktime',
};

/**
 * Extract a single frame from a video File at a given time (seconds).
 * Returns a Blob (JPEG) via an offscreen <video> + <canvas>.
 */
function extractVideoFrame(file, timeSeconds = 1) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;

    const url = URL.createObjectURL(file);
    video.src = url;

    const cleanup = () => URL.revokeObjectURL(url);

    video.addEventListener('loadedmetadata', () => {
      // Clamp seek time to video duration
      const seekTo = Math.min(timeSeconds, video.duration * 0.1 || 1);
      video.currentTime = seekTo;
    });

    video.addEventListener('seeked', () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            cleanup();
            if (blob) resolve(blob);
            else reject(new Error('Canvas toBlob returned null'));
          },
          'image/jpeg',
          0.85
        );
      } catch (err) {
        cleanup();
        reject(err);
      }
    });

    video.addEventListener('error', () => {
      cleanup();
      reject(new Error('Could not load video for thumbnail extraction'));
    });
  });
}

const Upload = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef();
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('video');
  const [privacy, setPrivacy] = useState('public');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  // Video thumbnail preview state
  const [thumbnailBlob, setThumbnailBlob] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [thumbGenerating, setThumbGenerating] = useState(false);

  // Auto-extract a frame when a video file is selected
  const generatePreview = useCallback(async (videoFile) => {
    setThumbGenerating(true);
    try {
      const blob = await extractVideoFrame(videoFile, 1);
      setThumbnailBlob(blob);
      setThumbnailPreview(URL.createObjectURL(blob));
    } catch (err) {
      console.warn('Could not extract video frame:', err.message);
      setThumbnailBlob(null);
      setThumbnailPreview(null);
    } finally {
      setThumbGenerating(false);
    }
  }, []);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    };
  }, [thumbnailPreview]);

  if (!user) {
    return (
      <Box sx={{ textAlign: 'center', mt: 10 }}>
        <Typography variant="h6" color="text.secondary">Please sign in to upload</Typography>
        <Button sx={{ mt: 2, color: '#3ea6ff' }} onClick={() => navigate('/login')}>Sign in</Button>
      </Box>
    );
  }

  const isVideo = (f) => f && f.type && f.type.startsWith('video/');

  const handleFileSelect = (e) => {
    const f = e.target.files[0];
    if (f) {
      if (f.size > 2 * 1024 * 1024 * 1024) {
        setError('File size exceeds 2 GB limit');
        return;
      }
      setFile(f);
      setError('');
      if (!title) setTitle(f.name.replace(/\.[^/.]+$/, ''));

      // Clear old thumbnail
      setThumbnailBlob(null);
      if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
      setThumbnailPreview(null);

      // Auto-extract frame for video files
      if (isVideo(f)) {
        generatePreview(f);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) { setError('Please select a file'); return; }
    setError('');
    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('type', type);
    formData.append('privacy', privacy);

    // Attach extracted video thumbnail if available
    if (thumbnailBlob) {
      formData.append('thumbnail', thumbnailBlob, 'thumbnail.jpg');
    }

    try {
      await api.post('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => setProgress(Math.round((e.loaded * 100) / e.total)),
      });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto' }}>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>Upload media</Typography>

      {!file ? (
        <Paper
          elevation={0}
          onClick={() => fileInputRef.current?.click()}
          sx={{
            border: '2px dashed #303030',
            borderRadius: 3,
            bgcolor: '#1a1a1a',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            py: 8,
            cursor: 'pointer',
            transition: 'border-color 0.2s',
            '&:hover': { borderColor: '#555' },
          }}
        >
          <CloudUploadIcon sx={{ fontSize: 64, color: '#555', mb: 2 }} />
          <Typography variant="body1" sx={{ mb: 1 }}>Drag and drop or click to upload</Typography>
          <Typography variant="body2" color="text.secondary">
            Videos, music, images up to 2 GB
          </Typography>
          <input
            type="file"
            ref={fileInputRef}
            hidden
            accept={Object.values(ACCEPTED).join(',')}
            onChange={handleFileSelect}
          />
        </Paper>
      ) : (
        <Box component="form" onSubmit={handleSubmit}>
          {/* Selected file indicator */}
          <Paper
            elevation={0}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              p: 2,
              mb: 3,
              bgcolor: '#1a1a1a',
              border: '1px solid #303030',
              borderRadius: 2,
            }}
          >
            <InsertDriveFileIcon sx={{ color: '#3ea6ff' }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>{file.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </Typography>
            </Box>
            <Button size="small" onClick={() => { setFile(null); setProgress(0); setThumbnailBlob(null); setThumbnailPreview(null); }}>Change</Button>
          </Paper>

          {/* Video thumbnail preview */}
          {isVideo(file) && (
            <Paper
              elevation={0}
              sx={{
                mb: 3,
                bgcolor: '#1a1a1a',
                border: '1px solid #303030',
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #303030', display: 'flex', alignItems: 'center', gap: 1 }}>
                <PlayCircleOutlineIcon sx={{ color: '#3ea6ff', fontSize: 20 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Video Thumbnail Preview</Typography>
                {thumbGenerating && (
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                    Extracting frame...
                  </Typography>
                )}
              </Box>
              {thumbGenerating && <LinearProgress sx={{ height: 2 }} />}
              {thumbnailPreview ? (
                <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'center', bgcolor: '#000', p: 1 }}>
                  <Box
                    component="img"
                    src={thumbnailPreview}
                    alt="Video thumbnail"
                    sx={{
                      maxWidth: '100%',
                      maxHeight: 280,
                      borderRadius: 1,
                      objectFit: 'contain',
                    }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 12,
                      right: 12,
                      bgcolor: 'rgba(0,0,0,0.75)',
                      color: '#fff',
                      fontSize: 11,
                      px: 1,
                      py: 0.3,
                      borderRadius: '4px',
                    }}
                  >
                    Thumbnail
                  </Box>
                </Box>
              ) : !thumbGenerating ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    Could not extract preview frame. A placeholder will be used.
                  </Typography>
                </Box>
              ) : null}
            </Paper>
          )}

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField label="Title" fullWidth required value={title} onChange={(e) => setTitle(e.target.value)} />
            <TextField label="Description" fullWidth multiline rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Type"
                select
                fullWidth
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <MenuItem value="video">Video</MenuItem>
                <MenuItem value="music">Music</MenuItem>
                <MenuItem value="movie">Movie</MenuItem>
                <MenuItem value="image">Image</MenuItem>
              </TextField>
              <TextField
                label="Visibility"
                select
                fullWidth
                value={privacy}
                onChange={(e) => setPrivacy(e.target.value)}
              >
                <MenuItem value="public">Public</MenuItem>
                <MenuItem value="private">Private</MenuItem>
              </TextField>
            </Box>

            {uploading && <LinearProgress variant="determinate" value={progress} sx={{ borderRadius: 4 }} />}

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button onClick={() => navigate('/')} disabled={uploading}>Cancel</Button>
              <Button
                type="submit"
                variant="contained"
                disabled={uploading}
                sx={{ px: 4, bgcolor: '#3ea6ff', '&:hover': { bgcolor: '#65b8ff' } }}
              >
                {uploading ? `Uploading ${progress}%` : 'Upload'}
              </Button>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default Upload;