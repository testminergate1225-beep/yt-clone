import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import ImageIcon from '@mui/icons-material/Image';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

function formatViews(n) {
  if (!n) return '0 views';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M views`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K views`;
  return `${n} views`;
}

function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
  if (seconds < 60) return 'just now';
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return `${months} months ago`;
}

const typeIcon = {
  music: <MusicNoteIcon sx={{ fontSize: 16 }} />,
  image: <ImageIcon sx={{ fontSize: 16 }} />,
  video: <PlayArrowIcon sx={{ fontSize: 16 }} />,
  movie: <PlayArrowIcon sx={{ fontSize: 16 }} />,
};

const MediaCard = ({ media }) => {
  const navigate = useNavigate();

  // Inline SVG data URI fallback — no external dependency
  const fallbackThumb =
    'data:image/svg+xml,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="360" height="200">' +
        '<rect width="360" height="200" fill="#1a1a1a"/>' +
        '<polygon points="165,80 165,120 195,100" fill="#555"/>' +
        '</svg>'
    );

  const thumbUrl = media.thumbnailURL || fallbackThumb;

  return (
    <Card
      onClick={() => navigate(`/watch/${media._id}`)}
      sx={{
        cursor: 'pointer',
        '&:hover .thumb': { transform: 'scale(1.02)' },
        transition: 'all 0.2s',
      }}
    >
      <Box sx={{ position: 'relative', overflow: 'hidden', borderRadius: '12px', bgcolor: '#1a1a1a' }}>
        <CardMedia
          component="img"
          className="thumb"
          image={thumbUrl}
          alt={media.title}
          sx={{
            aspectRatio: '16/9',
            objectFit: 'cover',
            transition: 'transform 0.2s',
          }}
        />
        {/* Duration badge placeholder */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 4,
            right: 4,
            bgcolor: 'rgba(0,0,0,0.8)',
            color: '#fff',
            fontSize: 12,
            px: 0.6,
            py: 0.2,
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: 0.3,
          }}
        >
          {typeIcon[media.type]}
          {media.type}
        </Box>
      </Box>
      <CardContent sx={{ px: 0, pt: 1.2, pb: '8px !important', display: 'flex', gap: 1.5 }}>
        <Avatar
          src={media.uploader?.profilePic}
          sx={{ width: 36, height: 36, mt: 0.3, bgcolor: '#c4302b', flexShrink: 0 }}
        >
          {media.uploader?.username?.[0]?.toUpperCase() || '?'}
        </Avatar>
        <Box sx={{ overflow: 'hidden' }}>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 500,
              lineHeight: 1.3,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              color: '#fff',
            }}
          >
            {media.title}
          </Typography>
          <Typography variant="body2" sx={{ fontSize: 12, mt: 0.3, color: '#aaa' }}>
            {media.uploader?.username || 'Unknown'}
          </Typography>
          <Typography variant="body2" sx={{ fontSize: 12, color: '#aaa' }}>
            {formatViews(media.views)} &middot; {timeAgo(media.uploadDate)}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

MediaCard.propTypes = {
  media: PropTypes.shape({
    _id: PropTypes.string,
    title: PropTypes.string,
    thumbnailURL: PropTypes.string,
    type: PropTypes.string,
    views: PropTypes.number,
    uploadDate: PropTypes.string,
    uploader: PropTypes.shape({
      profilePic: PropTypes.string,
      username: PropTypes.string,
    }),
  }).isRequired,
};

export default MediaCard;
