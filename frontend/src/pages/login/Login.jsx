import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Container, TextField, Button, Typography, Link, Paper } from '@mui/material';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import axios from '../../utils/axios';
import { getPendingShowtime, clearPendingShowtime, saveAuthSession } from '../../utils/authUtils';
import './Login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await axios.post('/auth/api/auth/login', {
        email: formData.identifier.includes('@') ? formData.identifier : undefined,
        phone_number: !formData.identifier.includes('@') ? formData.identifier : undefined,
        password: formData.password
      });

      const { token, user } = response.data;
      saveAuthSession(token, user);

      // Check for pending showtime
      const pendingShowtime = getPendingShowtime();
      if (pendingShowtime) {
        clearPendingShowtime();
        navigate(`/seat-map/${pendingShowtime.showtime_id}`, { 
          state: {
            showtime: pendingShowtime
          },
          replace: true 
        });
        return;
      }

      // Redirect to previous page or home
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng nhập thất bại');
    }
  };

  return (
    <div className="login-page">
      <Header />
      <Container component="main" maxWidth="xs" className="login-container">
        <Paper elevation={3} className="login-paper">
          <Typography component="h1" variant="h5" className="login-title">
            Đăng nhập
          </Typography>
          <Box component="form" onSubmit={handleSubmit} className="login-form">
            <TextField
              margin="normal"
              required
              fullWidth
              id="identifier"
              label="Số điện thoại hoặc Email"
              name="identifier"
              autoComplete="email phone"
              autoFocus
              value={formData.identifier}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Mật khẩu"
              type="password"
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
            />
            {error && (
              <Typography color="error" variant="body2" className="error-message">
                {error}
              </Typography>
            )}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              className="login-button"
            >
              Đăng nhập
            </Button>
            <Box className="signup-link">
              <Typography variant="body2">
                Chưa có tài khoản?{' '}
                <Link href="/signup" variant="body2">
                  Đăng ký
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Container>
      <Footer />
    </div>
  );
};

export default Login;
