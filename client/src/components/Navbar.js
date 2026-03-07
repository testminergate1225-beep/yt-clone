import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import InputBase from '@mui/material/InputBase';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import { alpha, styled } from '@mui/material/styles';

const SearchWrapper = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: 20,
  border: `1px solid ${alpha(theme.palette.common.white, 0.15)}`,
  backgroundColor: alpha(theme.palette.common.white, 0.05),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.08),
  },
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  maxWidth: 560,
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  flex: 1,
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 2),
    width: '100%',
  },
}));

const SearchButton = styled(IconButton)(({ theme }) => ({
  borderRadius: '0 20px 20px 0',
  backgroundColor: alpha(theme.palette.common.white, 0.08),
  padding: theme.spacing(0.8, 2),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.15),
  },
}));

const Navbar = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [query, setQuery] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <AppBar
      position="fixed"
      sx={{ bgcolor: '#0f0f0f', boxShadow: 'none', borderBottom: '1px solid #303030', zIndex: 1201 }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        {/* Left */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton color="inherit" onClick={onMenuClick} edge="start">
            <MenuIcon />
          </IconButton>
          <Box
            onClick={() => navigate('/')}
            sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 0.5 }}
          >
            <Box
              sx={{
                bgcolor: 'red',
                borderRadius: '4px',
                width: 28,
                height: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography sx={{ fontSize: 11, fontWeight: 'bold', color: '#fff' }}>▶</Typography>
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold', letterSpacing: -1, display: { xs: 'none', sm: 'block' } }}>
              YouClone
            </Typography>
          </Box>
        </Box>

        {/* Center – search */}
        <Box
          component="form"
          onSubmit={handleSearch}
          sx={{ display: { xs: 'none', sm: 'flex' }, flex: 1, justifyContent: 'center', mx: 4 }}
        >
          <SearchWrapper>
            <StyledInputBase
              placeholder="Search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <SearchButton type="submit" aria-label="search">
              <SearchIcon fontSize="small" />
            </SearchButton>
          </SearchWrapper>
        </Box>

        {/* Right */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {user ? (
            <>
              <IconButton color="inherit" onClick={() => navigate('/upload')}>
                <VideoCallIcon />
              </IconButton>
              <IconButton color="inherit">
                <NotificationsNoneIcon />
              </IconButton>
              <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
                <Avatar
                  src={user.profilePic}
                  sx={{ width: 32, height: 32, bgcolor: '#c4302b' }}
                >
                  {user.username?.[0]?.toUpperCase()}
                </Avatar>
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
                PaperProps={{ sx: { bgcolor: '#282828', color: '#fff', mt: 1 } }}
              >
                <MenuItem onClick={() => { setAnchorEl(null); navigate(`/channel/${user._id}`); }}>
                  My Channel
                </MenuItem>
                <MenuItem onClick={() => { setAnchorEl(null); logout(); navigate('/'); }}>
                  Sign Out
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Button
              variant="outlined"
              startIcon={<Avatar sx={{ width: 24, height: 24, bgcolor: 'transparent', border: '1px solid #3ea6ff' }}><Typography sx={{ fontSize: 12, color: '#3ea6ff' }}>👤</Typography></Avatar>}
              onClick={() => navigate('/login')}
              sx={{
                color: '#3ea6ff',
                borderColor: alpha('#3ea6ff', 0.5),
                '&:hover': { borderColor: '#3ea6ff', bgcolor: alpha('#3ea6ff', 0.08) },
              }}
            >
              Sign in
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

Navbar.propTypes = {
  onMenuClick: PropTypes.func.isRequired,
};

export default Navbar;
