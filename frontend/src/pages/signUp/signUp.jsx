import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Container, TextField, Button, Typography, Link, Paper } from '@mui/material';
import Footer from '../../components/Footer';
import axios from '../../utils/axios';
import './SignUp.css';

const SignUp = () => {
  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    email: '',
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
      const response = await axios.post('/auth/api/auth/register', formData);
      const { user } = response.data;
      localStorage.setItem('pendingUser', JSON.stringify(user));

      const from = location.state?.from?.pathname;
      navigate('/login', { replace: true, state: from ? { from: { pathname: from } } : undefined });
    } catch (err) {
      setError(err.response?.data?.message || 'Account creation failed');
    }
  };

  return (
    <div className="signup-page">
      <Container component="main" maxWidth="xs" className="signup-container">
        <Paper elevation={3} className="signup-paper">
          <Typography component="h1" variant="h5" className="signup-title">
            Sign up
          </Typography>
          <Box component="form" onSubmit={handleSubmit} className="signup-form">
            <TextField
              margin="normal"
              required
              fullWidth
              id="full_name"
              label="Full name"
              name="full_name"
              autoComplete="name"
              autoFocus
              value={formData.full_name}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="phone_number"
              label="Phone number"
              name="phone_number"
              autoComplete="phone"
              value={formData.phone_number}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email"
              name="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="new-password"
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
              className="signup-button"
            >
              Create account
            </Button>
            <Box className="login-link">
              <Typography variant="body2">
                Already have an account?{' '}
                <Link href="/login" variant="body2">
                  Login
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

export default SignUp;
