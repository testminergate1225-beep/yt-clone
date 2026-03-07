import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate, useLocation } from 'react-router-dom';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import useMediaQuery from '@mui/material/useMediaQuery';
import HomeIcon from '@mui/icons-material/Home';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import SubscriptionsIcon from '@mui/icons-material/Subscriptions';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import HistoryIcon from '@mui/icons-material/History';
import ThumbUpAltOutlinedIcon from '@mui/icons-material/ThumbUpAltOutlined';
import SettingsIcon from '@mui/icons-material/Settings';
import { useAuth } from '../contexts/AuthContext';

const DRAWER_WIDTH = 240;
const MINI_WIDTH = 72;

const mainItems = [
  { label: 'Home', icon: <HomeIcon />, path: '/' },
  { label: 'Trending', icon: <WhatshotIcon />, path: '/trending' },
  { label: 'Subscriptions', icon: <SubscriptionsIcon />, path: '/' },
];

const libraryItems = [
  { label: 'Library', icon: <VideoLibraryIcon />, path: '/' },
  { label: 'History', icon: <HistoryIcon />, path: '/' },
  { label: 'Liked videos', icon: <ThumbUpAltOutlinedIcon />, path: '/' },
];

const Sidebar = ({ open, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery('(max-width:900px)');
  const { user } = useAuth();

  const content = (
    <Box sx={{ width: isMobile ? DRAWER_WIDTH : (open ? DRAWER_WIDTH : MINI_WIDTH), overflowX: 'hidden', pt: 1 }}>
      <List disablePadding>
        {mainItems.map((item) => (
          <ListItemButton
            key={item.label}
            selected={location.pathname === item.path && item.label === 'Home'}
            onClick={() => { navigate(item.path); if (isMobile) onClose(); }}
            sx={{
              flexDirection: !open && !isMobile ? 'column' : 'row',
              py: !open && !isMobile ? 1.5 : 0.8,
              px: !open && !isMobile ? 0.5 : 2.5,
              minHeight: 40,
              '&.Mui-selected': { bgcolor: 'rgba(255,255,255,0.08)' },
            }}
          >
            <ListItemIcon
              sx={{
                color: 'inherit',
                minWidth: !open && !isMobile ? 'unset' : 40,
                justifyContent: 'center',
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{
                fontSize: !open && !isMobile ? 10 : 14,
                textAlign: !open && !isMobile ? 'center' : 'left',
              }}
              sx={{ mt: !open && !isMobile ? 0.3 : 0 }}
            />
          </ListItemButton>
        ))}
      </List>
      {(open || isMobile) && (
        <>
          <Divider sx={{ borderColor: '#303030', my: 1 }} />
          <List disablePadding>
            {libraryItems.map((item) => (
              <ListItemButton
                key={item.label}
                onClick={() => { navigate(item.path); if (isMobile) onClose(); }}
                sx={{ py: 0.8, px: 2.5 }}
              >
                <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 14 }} />
              </ListItemButton>
            ))}
          </List>
          {user && (
            <>
              <Divider sx={{ borderColor: '#303030', my: 1 }} />
              <List disablePadding>
                <ListItemButton
                  selected={location.pathname === '/settings'}
                  onClick={() => { navigate('/settings'); if (isMobile) onClose(); }}
                  sx={{ py: 0.8, px: 2.5, '&.Mui-selected': { bgcolor: 'rgba(255,255,255,0.08)' } }}
                >
                  <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}><SettingsIcon /></ListItemIcon>
                  <ListItemText primary="Settings" primaryTypographyProps={{ fontSize: 14 }} />
                </ListItemButton>
              </List>
            </>
          )}
          <Divider sx={{ borderColor: '#303030', my: 1 }} />
          <Box sx={{ px: 2.5, py: 1 }}>
            <Typography variant="caption" color="text.secondary">
              &copy; {new Date().getFullYear()} YouClone
            </Typography>
          </Box>
        </>
      )}
    </Box>
  );

  if (isMobile) {
    return (
      <Drawer
        anchor="left"
        open={open}
        onClose={onClose}
        PaperProps={{ sx: { bgcolor: '#0f0f0f', color: '#fff', top: 64 } }}
      >
        {content}
      </Drawer>
    );
  }

  return (
    <Box
      sx={{
        width: open ? DRAWER_WIDTH : MINI_WIDTH,
        flexShrink: 0,
        transition: 'width 0.2s',
        bgcolor: '#0f0f0f',
        borderRight: '1px solid #303030',
        height: 'calc(100vh - 64px)',
        position: 'sticky',
        top: 64,
        overflowY: 'auto',
        overflowX: 'hidden',
        '&::-webkit-scrollbar': { width: 4 },
        '&::-webkit-scrollbar-thumb': { bgcolor: '#555' },
      }}
    >
      {content}
    </Box>
  );
};

Sidebar.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default Sidebar;
