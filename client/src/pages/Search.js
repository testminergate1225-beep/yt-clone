import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Skeleton from '@mui/material/Skeleton';
import Grid from '@mui/material/Grid';
import MediaCard from '../components/MediaCard';

const Search = () => {
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        const res = await api.get('/media/search', { params: { q } });
        setResults(res.data);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    };
    if (q) fetchResults();
    else { setResults([]); setLoading(false); }
  }, [q]);

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 500, color: '#aaa' }}>
        {q ? `Results for "${q}"` : 'Search for something'}
      </Typography>

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
      ) : results.length > 0 ? (
        <Grid container spacing={2}>
          {results.map((m) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={m._id}>
              <MediaCard media={m} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box sx={{ textAlign: 'center', mt: 8 }}>
          <Typography variant="h6" color="text.secondary">No results found</Typography>
          <Typography variant="body2" color="text.secondary">Try different search terms</Typography>
        </Box>
      )}
    </Box>
  );
};

export default Search;
