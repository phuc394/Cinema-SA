import { useState } from 'react';
import { AppBar, Toolbar, TextField, IconButton, Box } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import './Header.css';

const Header = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  return (
    <AppBar position="static" className="header">
      <Toolbar className="header-toolbar">
        <Box className="header-title">
          <h1>Cinema Booking</h1>
        </Box>
        <Box className="header-search">
          <TextField
            placeholder="Tìm kiếm phim..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={handleSearchChange}
            className="search-input"
            InputProps={{
              endAdornment: (
                <SearchIcon className="search-icon" />
              ),
            }}
          />
        </Box>
        <IconButton className="account-icon" color="inherit">
          <AccountCircleIcon fontSize="large" />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
