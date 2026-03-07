import React, { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SettingsIcon from '@mui/icons-material/Settings';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import ImageIcon from '@mui/icons-material/Image';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import MovieIcon from '@mui/icons-material/Movie';
import LanguageIcon from '@mui/icons-material/Language';
import GitHubIcon from '@mui/icons-material/GitHub';
import LinkIcon from '@mui/icons-material/Link';
import MediaCard from '../components/MediaCard';

/* ------------------------------------------------------------------ */
/* Category config                                                     */
/* ------------------------------------------------------------------ */
const CATEGORIES = [
  { key: 'all', label: 'All', icon: null },
  { key: 'video', label: 'Videos', icon: <VideoLibraryIcon sx={{ fontSize: 18 }} /> },
  { key: 'image', label: 'Images', icon: <ImageIcon sx={{ fontSize: 18 }} /> },
  { key: 'music', label: 'Music', icon: <MusicNoteIcon sx={{ fontSize: 18 }} /> },
  { key: 'movie', label: 'Movies', icon: <MovieIcon sx={{ fontSize: 18 }} /> },
];

/* ------------------------------------------------------------------ */
/* OwnerMediaCard – wraps MediaCard with edit / delete controls        */
/* ------------------------------------------------------------------ */
const OwnerMediaCard = ({ media, onEdit, onDelete }) => {
  const [anchorEl, setAnchorEl] = useState(null);

  return (
    <Box sx={{ position: 'relative' }}>
      <MediaCard media={media} />

      {/* 3-dot menu in the top-right corner */}
      <IconButton
        size="small"
        onClick={(e) => {
          e.stopPropagation();
          setAnchorEl(e.currentTarget);
        }}
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          bgcolor: 'rgba(0,0,0,0.7)',
          color: '#fff',
          '&:hover': { bgcolor: 'rgba(0,0,0,0.9)' },
          zIndex: 2,
        }}
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        onClick={(e) => e.stopPropagation()}
        PaperProps={{ sx: { bgcolor: '#272727', color: '#fff' } }}
      >
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            onEdit(media);
          }}
        >
          <ListItemIcon><EditIcon sx={{ color: '#3ea6ff' }} /></ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            onDelete(media);
          }}
        >
          <ListItemIcon><DeleteIcon sx={{ color: '#f44336' }} /></ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

OwnerMediaCard.propTypes = {
  media: PropTypes.object.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

/* OwnerListActions – 3-dot menu for list layout items                 */
const OwnerListActions = ({ media, onEdit, onDelete }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  return (
    <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}>
      <IconButton
        size="small"
        onClick={(e) => { e.stopPropagation(); setAnchorEl(e.currentTarget); }}
        sx={{ bgcolor: 'rgba(0,0,0,0.7)', color: '#fff', '&:hover': { bgcolor: 'rgba(0,0,0,0.9)' } }}
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        onClick={(e) => e.stopPropagation()}
        PaperProps={{ sx: { bgcolor: '#272727', color: '#fff' } }}
      >
        <MenuItem onClick={() => { setAnchorEl(null); onEdit(media); }}>
          <ListItemIcon><EditIcon sx={{ color: '#3ea6ff' }} /></ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { setAnchorEl(null); onDelete(media); }}>
          <ListItemIcon><DeleteIcon sx={{ color: '#f44336' }} /></ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};
OwnerListActions.propTypes = {
  media: PropTypes.object.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

/* ------------------------------------------------------------------ */
/* Channel Page                                                        */
/* ------------------------------------------------------------------ */
const Channel = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isOwner = user && user._id === id;

  const [channel, setChannel] = useState(null);
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const [category, setCategory] = useState('all');
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Dashboard prefs (populated from channel data)
  const dash = channel?.dashboard || {};
  const accent = dash.accentColor || '#3ea6ff';
  const channelLayout = dash.layout || 'grid';
  const sortOrder = dash.sortOrder || 'newest';
  const showSubs = dash.showSubscriberCount !== false;
  const displayName = dash.channelName || channel?.username || '';
  const social = dash.socialLinks || {};

  // Edit dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPrivacy, setEditPrivacy] = useState('public');
  const [saving, setSaving] = useState(false);

  // Delete dialog state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Snackbar
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

  /* ---- Fetch channel data ---- */
  const fetchMedia = useCallback(async () => {
    try {
      const [channelRes, mediaRes] = await Promise.all([
        api.get(`/users/${id}`),
        api.get(`/media/user/${id}`),
      ]);
      setChannel(channelRes.data);
      setMedia(mediaRes.data || []);
      if (channelRes.data.dashboard?.defaultTab === 'about') {
        setTab(1);
      }
      if (user) {
        setIsSubscribed(channelRes.data.subscribers?.includes(user._id));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  /* ---- Subscribe ---- */
  const handleSubscribe = async () => {
    if (!user) return;
    try {
      await api.post(`/users/${id}/subscribe`);
      setIsSubscribed(!isSubscribed);
      setChannel((prev) => ({
        ...prev,
        subscribers: isSubscribed
          ? prev.subscribers.filter((s) => s !== user._id)
          : [...prev.subscribers, user._id],
      }));
    } catch (err) {
      console.error('Subscribe failed:', err);
    }
  };

  /* ---- Edit handlers ---- */
  const openEdit = (item) => {
    setEditItem(item);
    setEditTitle(item.title);
    setEditDescription(item.description || '');
    setEditPrivacy(item.privacy || 'public');
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editItem) return;
    setSaving(true);
    try {
      const res = await api.put(`/media/${editItem._id}`, {
        title: editTitle,
        description: editDescription,
        privacy: editPrivacy,
      });
      setMedia((prev) => prev.map((m) => (m._id === editItem._id ? res.data : m)));
      setSnack({ open: true, message: 'Updated successfully', severity: 'success' });
      setEditOpen(false);
    } catch (err) {
      setSnack({ open: true, message: err.response?.data?.message || 'Update failed', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  /* ---- Delete handlers ---- */
  const openDelete = (item) => {
    setDeleteItem(item);
    setDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteItem) return;
    setDeleting(true);
    try {
      await api.delete(`/media/${deleteItem._id}`);
      setMedia((prev) => prev.filter((m) => m._id !== deleteItem._id));
      setSnack({ open: true, message: 'Deleted successfully', severity: 'success' });
      setDeleteOpen(false);
    } catch (err) {
      setSnack({ open: true, message: err.response?.data?.message || 'Delete failed', severity: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  /* ---- Filtered media by category ---- */
  const filtered = (() => {
    let items = category === 'all' ? media : media.filter((m) => m.type === category);
    if (sortOrder === 'oldest') items = [...items].sort((a, b) => new Date(a.uploadDate) - new Date(b.uploadDate));
    else if (sortOrder === 'popular') items = [...items].sort((a, b) => (b.views || 0) - (a.views || 0));
    // newest is default (already sorted by API)
    return items;
  })();

  /* ---- Category counts ---- */
  const counts = {
    all: media.length,
    video: media.filter((m) => m.type === 'video').length,
    image: media.filter((m) => m.type === 'image').length,
    music: media.filter((m) => m.type === 'music').length,
    movie: media.filter((m) => m.type === 'movie').length,
  };

  /* ---- Loading skeleton ---- */
  if (loading) {
    return (
      <Box>
        <Skeleton variant="rounded" height={200} sx={{ borderRadius: '12px', mb: 3 }} />
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Skeleton variant="circular" width={80} height={80} />
          <Box sx={{ flex: 1 }}>
            <Skeleton width="30%" height={32} />
            <Skeleton width="15%" />
          </Box>
        </Box>
      </Box>
    );
  }

  if (!channel) {
    return <Typography sx={{ textAlign: 'center', mt: 8 }}>Channel not found</Typography>;
  }

  return (
    <Box>
      {/* Banner — uses custom image, gradient, or default */}
      <Box
        sx={{
          height: 200,
          borderRadius: '12px',
          background: dash.bannerImage
            ? `url(${dash.bannerImage}) center/cover no-repeat`
            : dash.bannerColor || 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)',
          mb: 3,
          position: 'relative',
        }}
      >
        {isOwner && (
          <Button
            size="small"
            startIcon={<SettingsIcon />}
            onClick={() => navigate('/settings')}
            sx={{
              position: 'absolute', top: 12, right: 12,
              bgcolor: 'rgba(0,0,0,0.6)', color: '#fff',
              borderRadius: 20, textTransform: 'none',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
            }}
          >
            Customize
          </Button>
        )}
      </Box>

      {/* Channel header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Avatar
          src={channel.profilePic}
          sx={{ width: 80, height: 80, bgcolor: accent, fontSize: 32 }}
        >
          {channel.username?.[0]?.toUpperCase()}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>{displayName}</Typography>
          <Typography variant="body2" color="text.secondary">
            @{channel.username?.toLowerCase()}
            {showSubs && <> &middot; {channel.subscribers?.length || 0} subscribers</>}
            {' '}&middot; {media.length} uploads
          </Typography>
          {channel.bio && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{channel.bio}</Typography>
          )}
        </Box>
        {isOwner ? (
          <Button
            variant="outlined"
            startIcon={<SettingsIcon />}
            onClick={() => navigate('/settings')}
            sx={{ borderRadius: 20, borderColor: accent, color: accent, textTransform: 'none' }}
          >
            Edit Channel
          </Button>
        ) : user && user._id !== id ? (
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
        ) : null}
      </Box>

      {/* Tabs */}
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{
          borderBottom: '1px solid #303030',
          mb: 2,
          '& .MuiTab-root': { color: '#aaa', textTransform: 'none', fontWeight: 500 },
          '& .Mui-selected': { color: '#fff' },
        }}
      >
        <Tab label="Uploads" />
        <Tab label="About" />
      </Tabs>

      {/* ---- Uploads tab ---- */}
      {tab === 0 && (
        <>
          {/* Category filter chips */}
          <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
            {CATEGORIES.map((cat) =>
              counts[cat.key] > 0 || cat.key === 'all' ? (
                <Chip
                  key={cat.key}
                  icon={cat.icon}
                  label={`${cat.label} (${counts[cat.key]})`}
                  onClick={() => setCategory(cat.key)}
                  variant={category === cat.key ? 'filled' : 'outlined'}
                  sx={{
                    borderColor: '#444',
                    color: category === cat.key ? '#fff' : '#aaa',
                    bgcolor: category === cat.key ? '#272727' : 'transparent',
                    fontWeight: category === cat.key ? 600 : 400,
                    '&:hover': { bgcolor: '#333' },
                    '& .MuiChip-icon': { color: category === cat.key ? '#3ea6ff' : '#888' },
                  }}
                />
              ) : null
            )}
          </Box>

          {/* Section header */}
          {category !== 'all' && (
            <Box sx={{ mb: 2 }}>
              <Divider sx={{ borderColor: '#303030', mb: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                {CATEGORIES.find((c) => c.key === category)?.icon}
                {CATEGORIES.find((c) => c.key === category)?.label}
                <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                  {counts[category]} item{counts[category] !== 1 ? 's' : ''}
                </Typography>
              </Typography>
            </Box>
          )}

          {/* Media grid or list */}
          {channelLayout === 'list' ? (
            /* ---- List layout ---- */
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {filtered.length > 0 ? (
                filtered.map((m) => (
                  <Box key={m._id} sx={{ position: 'relative' }}>
                    <Card
                      onClick={() => navigate(`/watch/${m._id}`)}
                      sx={{
                        display: 'flex', cursor: 'pointer', bgcolor: '#1a1a1a',
                        '&:hover': { bgcolor: '#222' }, transition: 'background 0.2s',
                      }}
                    >
                      <Box
                        component="img"
                        src={m.thumbnailURL || ''}
                        alt={m.title}
                        sx={{ width: 200, height: 112, objectFit: 'cover', flexShrink: 0, borderRadius: '8px 0 0 8px' }}
                      />
                      <CardContent sx={{ flex: 1, py: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 500, color: '#fff' }}>
                          {m.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          {m.views || 0} views &middot; {new Date(m.uploadDate).toLocaleDateString()}
                        </Typography>
                        {m.description && (
                          <Typography variant="body2" color="text.secondary" sx={{
                            mt: 0.5, display: '-webkit-box', WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical', overflow: 'hidden',
                          }}>
                            {m.description}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                    {isOwner && (
                      <OwnerListActions media={m} onEdit={openEdit} onDelete={openDelete} />
                    )}
                  </Box>
                ))
              ) : (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Typography variant="h6" color="text.secondary">
                    {category === 'all' ? 'No uploads yet' : `No ${CATEGORIES.find((c) => c.key === category)?.label.toLowerCase()} uploaded yet`}
                  </Typography>
                </Box>
              )}
            </Box>
          ) : (
            /* ---- Grid layout ---- */
            <Grid container spacing={2}>
              {filtered.length > 0 ? (
                filtered.map((m) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={m._id}>
                    {isOwner ? (
                      <OwnerMediaCard media={m} onEdit={openEdit} onDelete={openDelete} />
                    ) : (
                      <MediaCard media={m} />
                    )}
                  </Grid>
                ))
              ) : (
                <Grid item xs={12}>
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Typography variant="h6" color="text.secondary">
                      {category === 'all'
                        ? 'No uploads yet'
                        : `No ${CATEGORIES.find((c) => c.key === category)?.label.toLowerCase()} uploaded yet`}
                    </Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          )}
        </>
      )}

      {/* ---- About tab ---- */}
      {tab === 1 && (
        <Box sx={{ maxWidth: 600 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Description</Typography>
          <Typography variant="body2" color="text.secondary">{channel.bio || 'No description'}</Typography>

          {/* Social links */}
          {(social.website || social.twitter || social.instagram || social.github) && (
            <>
              <Typography variant="subtitle2" sx={{ mt: 3, mb: 1.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                <LinkIcon sx={{ fontSize: 18 }} /> Links
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {social.website && (
                  <Box component="a" href={social.website} target="_blank" rel="noopener noreferrer"
                    sx={{ color: accent, display: 'flex', alignItems: 'center', gap: 1, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                    <LanguageIcon sx={{ fontSize: 18 }} /> {social.website}
                  </Box>
                )}
                {social.twitter && (
                  <Box component="a" href={social.twitter} target="_blank" rel="noopener noreferrer"
                    sx={{ color: accent, display: 'flex', alignItems: 'center', gap: 1, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                    <Typography sx={{ fontWeight: 700, fontSize: 16 }}>𝕏</Typography> {social.twitter}
                  </Box>
                )}
                {social.instagram && (
                  <Box component="a" href={social.instagram} target="_blank" rel="noopener noreferrer"
                    sx={{ color: accent, display: 'flex', alignItems: 'center', gap: 1, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                    <Box component="span" sx={{ fontWeight: 700, color: '#e1306c' }}>&#x2767;</Box> {social.instagram}
                  </Box>
                )}
                {social.github && (
                  <Box component="a" href={social.github} target="_blank" rel="noopener noreferrer"
                    sx={{ color: accent, display: 'flex', alignItems: 'center', gap: 1, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                    <GitHubIcon sx={{ fontSize: 18 }} /> {social.github}
                  </Box>
                )}
              </Box>
            </>
          )}

          <Typography variant="subtitle2" sx={{ mt: 3, mb: 1, fontWeight: 600 }}>Stats</Typography>
          <Typography variant="body2" color="text.secondary">
            Joined {new Date(channel.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {counts.video} video{counts.video !== 1 ? 's' : ''} &middot;{' '}
            {counts.image} image{counts.image !== 1 ? 's' : ''} &middot;{' '}
            {counts.music} music track{counts.music !== 1 ? 's' : ''} &middot;{' '}
            {counts.movie} movie{counts.movie !== 1 ? 's' : ''}
          </Typography>
        </Box>
      )}

      {/* ---- Edit Dialog ---- */}
      <Dialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { bgcolor: '#1e1e1e', color: '#fff', borderRadius: '12px' } }}
      >
        <DialogTitle>Edit Media</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Title"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            fullWidth
            variant="outlined"
            sx={{ mt: 1 }}
            InputProps={{ sx: { color: '#fff' } }}
            InputLabelProps={{ sx: { color: '#aaa' } }}
          />
          <TextField
            label="Description"
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            InputProps={{ sx: { color: '#fff' } }}
            InputLabelProps={{ sx: { color: '#aaa' } }}
          />
          <FormControl fullWidth>
            <InputLabel sx={{ color: '#aaa' }}>Privacy</InputLabel>
            <Select
              value={editPrivacy}
              label="Privacy"
              onChange={(e) => setEditPrivacy(e.target.value)}
              sx={{ color: '#fff' }}
            >
              <MenuItem value="public">Public</MenuItem>
              <MenuItem value="private">Private</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditOpen(false)} sx={{ color: '#aaa' }}>Cancel</Button>
          <Button
            onClick={handleSaveEdit}
            variant="contained"
            disabled={saving || !editTitle.trim()}
            sx={{ borderRadius: 20 }}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ---- Delete Confirmation Dialog ---- */}
      <Dialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        PaperProps={{ sx: { bgcolor: '#1e1e1e', color: '#fff', borderRadius: '12px' } }}
      >
        <DialogTitle>Delete Media</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to permanently delete <strong>&quot;{deleteItem?.title}&quot;</strong>?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteOpen(false)} sx={{ color: '#aaa' }}>Cancel</Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
            disabled={deleting}
            sx={{ borderRadius: 20 }}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ---- Snackbar ---- */}
      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snack.severity}
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          sx={{ bgcolor: snack.severity === 'success' ? '#1b5e20' : '#b71c1c', color: '#fff' }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Channel;
