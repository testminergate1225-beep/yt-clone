import React, { useEffect, useState, useCallback, useRef } from 'react';
import api from '../utils/api';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import MediaCard from '../components/MediaCard';

const FILTERS = ['All', 'Videos', 'Music', 'Movies', 'Images'];
const typeMap = { Videos: 'video', Music: 'music', Movies: 'movie', Images: 'image' };

const Home = () => {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const pageRef = useRef(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchMedia = useCallback(async (pageNum, type) => {
    try {
      setLoading(true);
      const params = { page: pageNum, limit: 20 };
      if (type && type !== 'All') params.type = typeMap[type];
      const res = await api.get('/media/feed', { params });
      if (pageNum === 1) {
        setMedia(res.data.items || []);
      } else {
        setMedia((prev) => [...prev, ...(res.data.items || [])]);
      }
      setHasMore(res.data.page < res.data.pages);
    } catch (err) {
      console.error('Failed to load media:', err);
      setMedia([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    pageRef.current = 1;
    fetchMedia(1, filter);
  }, [filter, fetchMedia]);

  // Infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 500
      ) {
        if (!loading && hasMore) {
          pageRef.current += 1;
          fetchMedia(pageRef.current, filter);
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading, hasMore, filter, fetchMedia]);

  return (
    <Box>
      {/* Filter chips */}
      <Box
        sx={{
          display: 'flex',
          gap: 1,
          mb: 3,
          overflowX: 'auto',
          pb: 1,
          '&::-webkit-scrollbar': { height: 0 },
        }}
      >
        {FILTERS.map((f) => (
          <Chip
            key={f}
            label={f}
            onClick={() => setFilter(f)}
            sx={{
              bgcolor: filter === f ? '#fff' : '#272727',
              color: filter === f ? '#000' : '#fff',
              fontWeight: 500,
              '&:hover': { bgcolor: filter === f ? '#e0e0e0' : '#3a3a3a' },
              borderRadius: '8px',
              px: 1,
            }}
          />
        ))}
      </Box>

      {/* Grid of media cards */}
      <Grid container spacing={2}>
        {loading && media.length === 0
          ? Array.from({ length: 12 }).map((_, i) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
                <Skeleton variant="rounded" sx={{ aspectRatio: '16/9', borderRadius: '12px' }} />
                <Box sx={{ display: 'flex', gap: 1.5, mt: 1 }}>
                  <Skeleton variant="circular" width={36} height={36} />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton width="90%" />
                    <Skeleton width="60%" />
                  </Box>
                </Box>
              </Grid>
            ))
          : media.map((m) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={m._id}>
                <MediaCard media={m} />
              </Grid>
            ))}
      </Grid>

      {!loading && media.length === 0 && (
        <Box sx={{ textAlign: 'center', mt: 8 }}>
          <Typography variant="h6" color="text.secondary">No content yet</Typography>
          <Typography variant="body2" color="text.secondary">Be the first to upload!</Typography>
        </Box>
      )}
    </Box>
  );
};

export default Home;