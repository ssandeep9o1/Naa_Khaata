import React from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import {
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography,
} from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import BarChartIcon from '@mui/icons-material/BarChart';
import NotesIcon from '@mui/icons-material/Notes';
import { AllInbox } from '@mui/icons-material';
import './sidebar.css';


interface sidebarProps {
  open: boolean;
  onClose: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Customers', icon: <PeopleIcon />, path: '/customers' },
  { text: 'Chillar Khata', icon: <PeopleIcon />, path: '/chillar-khata' }, // Example path
  { text: 'Analytics', icon: <BarChartIcon />, path: '/analytics' },
  { text: 'Products', icon: <AllInbox />, path: '/products' },
  { text: 'Notes', icon: <NotesIcon />, path: '/notes' },
  { text: 'Profile', icon: <AccountCircleIcon />, path: '/profile' },
];


const sidebar: React.FC<sidebarProps> = ({ open, onClose, onMouseEnter, onMouseLeave }) => {

  const navigate = useNavigate();
  const location = useLocation(); // Get current location

  // 3. Handle logout functionality
  const handleLogout = async () => {
    onClose(); // Close the drawer first
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error logging out:', error.message);
    } else {
      navigate('/login');
    }
  };


  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      transitionDuration={{ enter: 400, exit: 250 }}
      ModalProps={{ hideBackdrop: true }}
      PaperProps={{
        sx: {
          backgroundColor: '#262626',
          color: '#fff',
          width: 230,
        },
        onMouseEnter: onMouseEnter,
        onMouseLeave: onMouseLeave,
      }}
    >
      <Box sx={{ width: 180, p: 1, pt: 6, overflowX: 'hidden' }} role="presentation">
        <Box sx={{ p: 6, mb: -1 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, fontFamily: 'Ponnala, sans-serif' }}>
            నా ఖాతా
          </Typography>
        </Box>
        <List onClick={onClose} onKeyDown={onClose}>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <Link to={item.path} style={{ textDecoration: 'none', color: 'inherit', width: '100%' }}>
                {/* Add 'active' class if the path matches the current location */}
                <ListItemButton className={location.pathname === item.path ? 'active' : ''}>
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </Link>
            </ListItem>
          ))}
        </List>
        {/* Logout button at the bottom */}
        <Box sx={{ p: 2 }}>
          <div style={{ position: 'absolute', bottom: '20px', left: '26px' }}>
            <button className="Btn" onClick={handleLogout}>
              <div className="sign">
                <svg viewBox="0 0 512 512">
                  <path
                    d="M377.9 105.9L500.7 228.7c7.2 7.2 11.3 17.1 11.3 27.3s-4.1 20.1-11.3 27.3L377.9 406.1c-6.4 6.4-15 9.9-24 9.9c-18.7 0-33.9-15.2-33.9-33.9l0-62.1-128 0c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32l128 0 0-62.1c0-18.7 15.2-33.9 33.9-33.9c9 0 17.6 3.6 24 9.9zM160 96L96 96c-17.7 0-32 14.3-32 32l0 256c0 17.7 14.3 32 32 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-64 0c-53 0-96-43-96-96L0 128C0 75 43 32 96 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32z"
                  ></path>
                </svg>
              </div>
              <div className="text">Logout</div>
            </button>
          </div>
        </Box>
      </Box>
    </Drawer>
  );
};

export default sidebar;