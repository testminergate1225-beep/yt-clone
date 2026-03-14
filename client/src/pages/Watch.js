import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import ReactPlayer from 'react-player';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Skeleton from '@mui/material/Skeleton';
import Chip from '@mui/material/Chip';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import ThumbDownOutlinedIcon from '@mui/icons-material/ThumbDownOutlined';
import ShareIcon from '@mui/icons-material/Share';
import Grid from '@mui/material/Grid';
import MediaCard from '../components/MediaCard';

function formatViews(n) {
  if (!n) return '0 views';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M views`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K views`;
  return `${n} views`;
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

const Watch = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [media, setMedia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [related, setRelated] = useState([]);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  // eslint-disable-next-line no-unused-vars
  const [dislikeCount, setDislikeCount] = useState(0);
  const [descExpanded, setDescExpanded] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subCount, setSubCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMedia = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/media/${id}`);
        setMedia(res.data);
        setLikeCount(res.data.likes?.length || 0);
        setDislikeCount(res.data.dislikes?.length || 0);
        setSubCount(res.data.uploader?.subscribers?.length || 0);
        if (user) {
          setLiked(res.data.likes?.some((lid) => lid === user._id));
          setDisliked(res.data.dislikes?.some((did) => did === user._id));
          setIsSubscribed(res.data.uploader?.subscribers?.includes(user._id) || false);
        }
        // Track view
        api.put(`/media/${id}/view`).catch(() => {});
        // Load related
        const feed = await api.get('/media/feed', { params: { limit: 10 } });
        setRelated((feed.data.items || []).filter((m) => m._id !== id));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMedia();
  }, [id, user]);

  const handleLike = async () => {
    if (!user) return;
    try {
      const res = await api.put(`/media/${id}/like`);
      setLikeCount(res.data.likes);
      setDislikeCount(res.data.dislikes);
      setLiked(!liked);
      setDisliked(false);
    } catch (err) {
      console.error('Like failed:', err);
    }
  };

  const handleDislike = async () => {
    if (!user) return;
    try {
      const res = await api.put(`/media/${id}/dislike`);
      setLikeCount(res.data.likes);
      setDislikeCount(res.data.dislikes);
      setDisliked(!disliked);
      setLiked(false);
    } catch (err) {
      console.error('Dislike failed:', err);
    }
  };

  const handleSubscribe = async () => {
    if (!user || !media?.uploader?._id) return;
    try {
      await api.post(`/users/${media.uploader._id}/subscribe`);
      setIsSubscribed((prev) => !prev);
      setSubCount((prev) => (isSubscribed ? prev - 1 : prev + 1));
    } catch (err) {
      console.error('Subscribe failed:', err);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !user) return;
    try {
      const res = await api.post(`/media/${id}/comment`, { text: commentText });
      setMedia((prev) => ({ ...prev, comments: res.data }));
      setCommentText('');
    } catch (err) {
      console.error('Comment failed:', err);
    }
  };

  if (loading) {
    return (
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        <Skeleton variant="rounded" sx={{ width: '100%', aspectRatio: '16/9', borderRadius: '12px', mb: 2 }} />
        <Skeleton width="70%" height={32} />
        <Skeleton width="40%" height={24} />
      </Box>
    );
  }

  if (!media) {
    return <Typography sx={{ textAlign: 'center', mt: 8 }}>Media not found</Typography>;
  }

  const isVideo = media.type === 'video' || media.type === 'movie';
  const isAudio = media.type === 'music';
  const isImage = media.type === 'image';

  return (
    <Grid container spacing={3} sx={{ maxWidth: 1400, mx: 'auto' }}>
      {/* Main content */}
      <Grid item xs={12} md={8}>
        {/* Player / Image viewer */}
        <Box sx={{ bgcolor: '#000', borderRadius: '12px', overflow: 'hidden', mb: 2 }}>
          {isVideo && (
            <ReactPlayer url={media.fileURL} controls width="100%" height="auto" style={{ aspectRatio: '16/9' }} />
          )}
          {isAudio && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 8, px: 3 }}>
              <audio controls style={{ width: '100%' }} src={media.fileURL} />
            </Box>
          )}
          {isImage && (
            <Box
              component="img"
              src={media.fileURL}
              alt={media.title}
              sx={{ width: '100%', maxHeight: '70vh', objectFit: 'contain' }}
            />
          )}
        </Box>

        {/* Title */}
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>{media.title}</Typography>

        {/* Meta row */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography variant="body2" color="text.secondary">
            {formatViews(media.views)} &middot; {formatDate(media.uploadDate)}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                bgcolor: '#272727',
                borderRadius: 20,
                overflow: 'hidden',
              }}
            >
              <IconButton onClick={handleLike} sx={{ color: liked ? '#3ea6ff' : '#fff', px: 2 }}>
                {liked ? <ThumbUpIcon fontSize="small" /> : <ThumbUpOutlinedIcon fontSize="small" />}
                <Typography sx={{ ml: 0.5, fontSize: 14 }}>{likeCount}</Typography>
              </IconButton>
              <Divider orientation="vertical" flexItem sx={{ borderColor: '#444' }} />
              <IconButton onClick={handleDislike} sx={{ color: disliked ? '#3ea6ff' : '#fff', px: 2 }}>
                {disliked ? <ThumbDownIcon fontSize="small" /> : <ThumbDownOutlinedIcon fontSize="small" />}
              </IconButton>
            </Box>
            <Chip
              icon={<ShareIcon sx={{ fontSize: 16, color: '#fff !important' }} />}
              label="Share"
              sx={{ bgcolor: '#272727', color: '#fff', fontWeight: 500, ml: 1 }}
              onClick={() => navigator.clipboard.writeText(window.location.href)}
            />
          </Box>
        </Box>

        {/* Channel info */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <Avatar
            src={media.uploader?.profilePic}
            sx={{ width: 40, height: 40, bgcolor: '#c4302b', cursor: 'pointer' }}
            onClick={() => navigate(`/channel/${media.uploader?._id}`)}
          >
            {media.uploader?.username?.[0]?.toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1, cursor: 'pointer' }} onClick={() => navigate(`/channel/${media.uploader?._id}`)}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{media.uploader?.username}</Typography>
            <Typography variant="caption" color="text.secondary">
              {subCount} subscribers
            </Typography>
          </Box>
          {user && user._id !== media.uploader?._id && (
            <Button
              variant="contained"
              onClick={handleSubscribe}
              sx={{
                borderRadius: 20,
                bgcolor: isSubscribed ? '#272727' : '#fff',
                color: isSubscribed ? '#fff' : '#000',
                fontWeight: 600,
                '&:hover': { bgcolor: isSubscribed ? '#333' : '#e0e0e0' },
              }}
            >
              {isSubscribed ? 'Subscribed' : 'Subscribe'}
            </Button>
          )}
        </Box>

        {/* Description */}
        <Box
          sx={{
            bgcolor: '#272727',
            borderRadius: 2,
            p: 2,
            mb: 3,
            cursor: 'pointer',
          }}
          onClick={() => setDescExpanded(!descExpanded)}
        >
          <Typography
            variant="body2"
            sx={{
              whiteSpace: 'pre-wrap',
              display: '-webkit-box',
              WebkitLineClamp: descExpanded ? 'unset' : 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {media.description || 'No description'}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
            {descExpanded ? 'Show less' : 'Show more'}
          </Typography>
        </Box>

        {/* Comments */}
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
          {media.comments?.length || 0} Comments
        </Typography>

        {user && (
          <Box component="form" onSubmit={handleComment} sx={{ display: 'flex', gap: 1.5, mb: 3 }}>
            <Avatar sx={{ width: 36, height: 36, bgcolor: '#c4302b' }}>
              {user.username?.[0]?.toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <TextField
                fullWidth
                variant="standard"
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                sx={{ mb: 1 }}
              />
              {commentText && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                  <Button size="small" onClick={() => setCommentText('')}>Cancel</Button>
                  <Button
                    size="small"
                    variant="contained"
                    type="submit"
                    sx={{ borderRadius: 20, bgcolor: '#3ea6ff', '&:hover': { bgcolor: '#65b8ff' } }}
                  >
                    Comment
                  </Button>
                </Box>
              )}
            </Box>
          </Box>
        )}

        {media.comments?.slice().reverse().map((c, i) => (
          <Box key={i} sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
            <Avatar sx={{ width: 36, height: 36, bgcolor: '#555' }}>
              {c.user?.username?.[0]?.toUpperCase() || '?'}
            </Avatar>
            <Box>
              <Typography variant="body2">
                <strong>{c.user?.username || 'User'}</strong>
                <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                  {formatDate(c.timestamp)}
                </Typography>
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.3 }}>{c.text}</Typography>
            </Box>
          </Box>
        ))}
      </Grid>

      {/* Related sidebar */}
      <Grid item xs={12} md={4}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: '#aaa' }}>
          Related
        </Typography>
        {related.map((m) => (
          <Box key={m._id} sx={{ mb: 1.5 }}>
            <MediaCard media={m} />
          </Box>
        ))}
      </Grid>
    </Grid>
  );
};

export default Watch;
