import { useNavigate } from 'react-router-dom';
import { AppBar, Toolbar, IconButton, Box } from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { isAuthenticated } from '../utils/authUtils';
import './Header.css';

const Header = () => {
  const navigate = useNavigate();

  const handleAccountClick = () => {
    if (!isAuthenticated()) {
      navigate('/login', {
        state: { from: { pathname: window.location.pathname } }
      });
      return;
    }

    navigate('/profile');
  };

  return (
    <AppBar position="static" className="header">
      <Toolbar className="header-toolbar">
        <Box className="header-title">
          <h1>Cinema Booking</h1>
        </Box>
        <IconButton className="account-icon" color="inherit" onClick={handleAccountClick}>
          <AccountCircleIcon fontSize="large" />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
