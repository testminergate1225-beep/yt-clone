import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import MenuItem from '@mui/material/MenuItem';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Divider from '@mui/material/Divider';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Grid from '@mui/material/Grid';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import PaletteIcon from '@mui/icons-material/Palette';
import ImageIcon from '@mui/icons-material/Image';
import PersonIcon from '@mui/icons-material/Person';
import LinkIcon from '@mui/icons-material/Link';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import SettingsIcon from '@mui/icons-material/Settings';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import LanguageIcon from '@mui/icons-material/Language';
import GitHubIcon from '@mui/icons-material/GitHub';

/* ---- Preset banner gradients ---- */
const BANNER_PRESETS = [
  { label: 'Default', value: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)' },
  { label: 'Sunset', value: 'linear-gradient(135deg, #e65100, #ad1457, #4a148c)' },
  { label: 'Ocean', value: 'linear-gradient(135deg, #004d40, #00695c, #0097a7)' },
  { label: 'Forest', value: 'linear-gradient(135deg, #1b5e20, #2e7d32, #558b2f)' },
  { label: 'Midnight', value: 'linear-gradient(135deg, #0d0d0d, #1a237e, #311b92)' },
  { label: 'Fire', value: 'linear-gradient(135deg, #bf360c, #e65100, #ff6f00)' },
  { label: 'Purple', value: 'linear-gradient(135deg, #4a148c, #7b1fa2, #ab47bc)' },
  { label: 'Slate', value: 'linear-gradient(135deg, #263238, #37474f, #455a64)' },
];

const ACCENT_COLORS = [
  '#3ea6ff', '#ff0000', '#ff5722', '#e91e63', '#9c27b0',
  '#673ab7', '#2196f3', '#00bcd4', '#4caf50', '#ffc107',
];

const DashboardSettings = () => {
  const { user, loadUser } = useAuth();
  const navigate = useNavigate();
  const bannerInputRef = useRef();
  const avatarInputRef = useRef();

  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

  // Form state
  const [channelName, setChannelName] = useState('');
  const [bio, setBio] = useState('');
  const [bannerColor, setBannerColor] = useState('');
  const [bannerImage, setBannerImage] = useState('');
  const [accentColor, setAccentColor] = useState('#3ea6ff');
  const [layout, setLayout] = useState('grid');
  const [showSubscriberCount, setShowSubscriberCount] = useState(true);
  const [defaultTab, setDefaultTab] = useState('uploads');
  const [sortOrder, setSortOrder] = useState('newest');
  const [socialLinks, setSocialLinks] = useState({ website: '', twitter: '', instagram: '', github: '' });
  const [profilePic, setProfilePic] = useState('');

  // Load current settings
  const loadSettings = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get(`/users/${user._id}`);
      const u = res.data;
      const d = u.dashboard || {};
      setChannelName(d.channelName || '');
      setBio(u.bio || '');
      setBannerColor(d.bannerColor || '');
      setBannerImage(d.bannerImage || '');
      setAccentColor(d.accentColor || '#3ea6ff');
      setLayout(d.layout || 'grid');
      setShowSubscriberCount(d.showSubscriberCount !== false);
      setDefaultTab(d.defaultTab || 'uploads');
      setSortOrder(d.sortOrder || 'newest');
      setSocialLinks({
        website: d.socialLinks?.website || '',
        twitter: d.socialLinks?.twitter || '',
        instagram: d.socialLinks?.instagram || '',
        github: d.socialLinks?.github || '',
      });
      setProfilePic(u.profilePic || '');
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  if (!user) {
    return (
      <Box sx={{ textAlign: 'center', mt: 10 }}>
        <Typography variant="h6" color="text.secondary">Please sign in to customize your dashboard</Typography>
        <Button sx={{ mt: 2, color: '#3ea6ff' }} onClick={() => navigate('/login')}>Sign in</Button>
      </Box>
    );
  }

  /* ---- Save handler ---- */
  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/users/dashboard/customize', {
        channelName,
        bio,
        bannerColor,
        accentColor,
        layout,
        showSubscriberCount,
        defaultTab,
        sortOrder,
        socialLinks,
      });
      await loadUser();
      setSnack({ open: true, message: 'Settings saved!', severity: 'success' });
    } catch (err) {
      setSnack({ open: true, message: err.response?.data?.message || 'Save failed', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  /* ---- Banner upload ---- */
  const handleBannerUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('banner', file);
    try {
      const res = await api.post('/users/dashboard/banner', formData);
      setBannerImage(res.data.dashboard?.bannerImage || '');
      setSnack({ open: true, message: 'Banner updated!', severity: 'success' });
    } catch (err) {
      setSnack({ open: true, message: err.response?.data?.message || 'Banner upload failed', severity: 'error' });
    }
  };

  /* ---- Avatar upload ---- */
  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('avatar', file);
    try {
      const res = await api.post('/users/dashboard/avatar', formData);
      setProfilePic(res.data.profilePic || '');
      await loadUser();
      setSnack({ open: true, message: 'Profile picture updated!', severity: 'success' });
    } catch (err) {
      setSnack({ open: true, message: err.response?.data?.message || 'Avatar upload failed', severity: 'error' });
    }
  };

  const activeBanner = bannerImage
    ? `url(${bannerImage})`
    : bannerColor || BANNER_PRESETS[0].value;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress sx={{ color: '#3ea6ff' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto' }}>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
        <SettingsIcon /> Dashboard Customization
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Personalize how your channel looks to visitors
      </Typography>

      {/* ---- Live Banner Preview ---- */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: '12px',
          overflow: 'hidden',
          mb: 3,
          border: '1px solid #303030',
        }}
      >
        <Box
          sx={{
            height: 180,
            background: bannerImage ? 'none' : activeBanner,
            backgroundImage: bannerImage ? `url(${bannerImage})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative',
          }}
        >
          <Tooltip title="Change banner">
            <IconButton
              onClick={() => bannerInputRef.current?.click()}
              sx={{
                position: 'absolute', top: 8, right: 8,
                bgcolor: 'rgba(0,0,0,0.6)', color: '#fff',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
              }}
            >
              <CameraAltIcon />
            </IconButton>
          </Tooltip>
          <input type="file" ref={bannerInputRef} hidden accept="image/*" onChange={handleBannerUpload} />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: '#1a1a1a' }}>
          <Box sx={{ position: 'relative' }}>
            <Avatar
              src={profilePic}
              sx={{ width: 64, height: 64, bgcolor: accentColor, fontSize: 28, cursor: 'pointer' }}
              onClick={() => avatarInputRef.current?.click()}
            >
              {user.username?.[0]?.toUpperCase()}
            </Avatar>
            <Tooltip title="Change avatar">
              <IconButton
                onClick={() => avatarInputRef.current?.click()}
                size="small"
                sx={{
                  position: 'absolute', bottom: -4, right: -4,
                  bgcolor: '#272727', color: '#fff', p: 0.4,
                  '&:hover': { bgcolor: '#444' },
                }}
              >
                <CameraAltIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Tooltip>
            <input type="file" ref={avatarInputRef} hidden accept="image/*" onChange={handleAvatarUpload} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#fff' }}>
              {channelName || user.username}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              @{user.username?.toLowerCase()} &middot; Preview
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* ---- Settings Tabs ---- */}
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{
          borderBottom: '1px solid #303030', mb: 3,
          '& .MuiTab-root': { color: '#aaa', textTransform: 'none', fontWeight: 500 },
          '& .Mui-selected': { color: '#fff' },
        }}
      >
        <Tab icon={<PersonIcon />} iconPosition="start" label="Profile" />
        <Tab icon={<PaletteIcon />} iconPosition="start" label="Appearance" />
        <Tab icon={<ViewModuleIcon />} iconPosition="start" label="Layout" />
        <Tab icon={<LinkIcon />} iconPosition="start" label="Social Links" />
      </Tabs>

      {/* ==== Tab 0: Profile ==== */}
      {tab === 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <TextField
            label="Channel Name"
            value={channelName}
            onChange={(e) => setChannelName(e.target.value)}
            fullWidth
            placeholder={user.username}
            helperText="A custom display name for your channel (leave blank to use your username)"
            InputProps={{ sx: { color: '#fff' } }}
            InputLabelProps={{ sx: { color: '#aaa' } }}
          />
          <TextField
            label="Bio / About"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            fullWidth
            multiline
            rows={4}
            placeholder="Tell viewers about your channel..."
            InputProps={{ sx: { color: '#fff' } }}
            InputLabelProps={{ sx: { color: '#aaa' } }}
          />
        </Box>
      )}

      {/* ==== Tab 1: Appearance ==== */}
      {tab === 1 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Banner color presets */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
              <ImageIcon sx={{ fontSize: 18 }} /> Banner Style
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              Choose a gradient or upload a custom banner image above
            </Typography>
            <Grid container spacing={1}>
              {BANNER_PRESETS.map((preset) => (
                <Grid item key={preset.label}>
                  <Tooltip title={preset.label}>
                    <Box
                      onClick={() => { setBannerColor(preset.value); setBannerImage(''); }}
                      sx={{
                        width: 80, height: 45,
                        borderRadius: '8px',
                        background: preset.value,
                        cursor: 'pointer',
                        border: bannerColor === preset.value && !bannerImage
                          ? '2px solid #fff'
                          : '2px solid transparent',
                        transition: 'border 0.2s',
                        '&:hover': { opacity: 0.85 },
                      }}
                    />
                  </Tooltip>
                </Grid>
              ))}
            </Grid>
          </Box>

          <Divider sx={{ borderColor: '#303030' }} />

          {/* Accent color */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
              <PaletteIcon sx={{ fontSize: 18 }} /> Accent Color
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              Used for buttons, links, and highlights on your channel
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
              {ACCENT_COLORS.map((c) => (
                <Box
                  key={c}
                  onClick={() => setAccentColor(c)}
                  sx={{
                    width: 36, height: 36,
                    borderRadius: '50%',
                    bgcolor: c,
                    cursor: 'pointer',
                    border: accentColor === c ? '3px solid #fff' : '3px solid transparent',
                    transition: 'border 0.2s, transform 0.2s',
                    '&:hover': { transform: 'scale(1.15)' },
                  }}
                />
              ))}
              <TextField
                type="color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                size="small"
                sx={{
                  width: 50, ml: 1,
                  '& input': { cursor: 'pointer', p: 0.5, height: 36 },
                }}
              />
            </Box>
          </Box>
        </Box>
      )}

      {/* ==== Tab 2: Layout ==== */}
      {tab === 2 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <TextField
            label="Default View"
            select
            fullWidth
            value={layout}
            onChange={(e) => setLayout(e.target.value)}
            helperText="How your uploads are displayed to visitors"
            InputProps={{ sx: { color: '#fff' } }}
            InputLabelProps={{ sx: { color: '#aaa' } }}
          >
            <MenuItem value="grid">Grid (cards)</MenuItem>
            <MenuItem value="list">List (rows)</MenuItem>
          </TextField>

          <TextField
            label="Default Sort"
            select
            fullWidth
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            helperText="Default order for your uploads"
            InputProps={{ sx: { color: '#fff' } }}
            InputLabelProps={{ sx: { color: '#aaa' } }}
          >
            <MenuItem value="newest">Newest first</MenuItem>
            <MenuItem value="oldest">Oldest first</MenuItem>
            <MenuItem value="popular">Most popular</MenuItem>
          </TextField>

          <TextField
            label="Default Tab"
            select
            fullWidth
            value={defaultTab}
            onChange={(e) => setDefaultTab(e.target.value)}
            helperText="Which tab visitors see first"
            InputProps={{ sx: { color: '#fff' } }}
            InputLabelProps={{ sx: { color: '#aaa' } }}
          >
            <MenuItem value="uploads">Uploads</MenuItem>
            <MenuItem value="about">About</MenuItem>
          </TextField>

          <FormControlLabel
            control={
              <Switch
                checked={showSubscriberCount}
                onChange={(e) => setShowSubscriberCount(e.target.checked)}
                sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: accentColor } }}
              />
            }
            label="Show subscriber count on channel"
            sx={{ color: '#ccc' }}
          />
        </Box>
      )}

      {/* ==== Tab 3: Social Links ==== */}
      {tab === 3 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Add links that appear on your channel&apos;s About section
          </Typography>
          <TextField
            label="Website"
            value={socialLinks.website}
            onChange={(e) => setSocialLinks((p) => ({ ...p, website: e.target.value }))}
            fullWidth
            placeholder="https://yourwebsite.com"
            InputProps={{
              sx: { color: '#fff' },
              startAdornment: <LanguageIcon sx={{ color: '#888', mr: 1 }} />,
            }}
            InputLabelProps={{ sx: { color: '#aaa' } }}
          />
          <TextField
            label="Twitter / X"
            value={socialLinks.twitter}
            onChange={(e) => setSocialLinks((p) => ({ ...p, twitter: e.target.value }))}
            fullWidth
            placeholder="https://twitter.com/yourhandle"
            InputProps={{
              sx: { color: '#fff' },
              startAdornment: <Typography sx={{ color: '#888', mr: 1, fontWeight: 700 }}>𝕏</Typography>,
            }}
            InputLabelProps={{ sx: { color: '#aaa' } }}
          />
          <TextField
            label="Instagram"
            value={socialLinks.instagram}
            onChange={(e) => setSocialLinks((p) => ({ ...p, instagram: e.target.value }))}
            fullWidth
            placeholder="https://instagram.com/yourhandle"
            InputProps={{
              sx: { color: '#fff' },
              startAdornment: <Box component="span" sx={{ color: '#e1306c', mr: 1, fontWeight: 700 }}>&#x2767;</Box>,
            }}
            InputLabelProps={{ sx: { color: '#aaa' } }}
          />
          <TextField
            label="GitHub"
            value={socialLinks.github}
            onChange={(e) => setSocialLinks((p) => ({ ...p, github: e.target.value }))}
            fullWidth
            placeholder="https://github.com/yourusername"
            InputProps={{
              sx: { color: '#fff' },
              startAdornment: <GitHubIcon sx={{ color: '#888', mr: 1 }} />,
            }}
            InputLabelProps={{ sx: { color: '#aaa' } }}
          />
        </Box>
      )}

      {/* ---- Save / Cancel ---- */}
      <Divider sx={{ borderColor: '#303030', my: 3 }} />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button
          onClick={() => navigate(`/channel/${user._id}`)}
          sx={{ color: '#aaa' }}
        >
          View My Channel
        </Button>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button onClick={() => navigate(-1)} sx={{ color: '#aaa' }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            sx={{ px: 4, borderRadius: 20, bgcolor: accentColor, '&:hover': { filter: 'brightness(1.2)' } }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </Box>
      </Box>

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

export default DashboardSettings;
