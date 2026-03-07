import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import MediaCard from '../components/MediaCard';

const Trending = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/media/trending');
        setItems(res.data);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <WhatshotIcon sx={{ color: '#ff4444', fontSize: 28 }} />
        <Typography variant="h5" sx={{ fontWeight: 600 }}>Trending</Typography>
      </Box>

      {loading ? (
        <Grid container spacing={2}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
              <Skeleton variant="rounded" sx={{ aspectRatio: '16/9', borderRadius: '12px' }} />
              <Box sx={{ display: 'flex', gap: 1.5, mt: 1 }}>
                <Skeleton variant="circular" width={36} height={36} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton width="80%" />
                  <Skeleton width="50%" />
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      ) : items.length > 0 ? (
        <Grid container spacing={2}>
          {items.map((m) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={m._id}>
              <MediaCard media={m} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box sx={{ textAlign: 'center', mt: 8 }}>
          <Typography variant="h6" color="text.secondary">Nothing trending right now</Typography>
          <Typography variant="body2" color="text.secondary">Check back later</Typography>
        </Box>
      )}
    </Box>
  );
};

export default Trending;
