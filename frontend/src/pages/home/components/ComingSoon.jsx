import { useEffect, useState } from 'react';
import { Box, Typography, Grid, Card, CardMedia, CardContent, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from '../../../utils/axios';
import './ComingSoon.css';

const ComingSoon = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchComingSoon = async () => {
      try {
        const response = await axios.get('/cinema/api/movies');
        const comingSoonMovies = response.data.filter((movie) => movie.status === 'coming_soon');
        setMovies(comingSoonMovies);
        setLoading(false);
      } catch {
        setError('Failed to fetch coming soon movies');
        setLoading(false);
      }
    };

    fetchComingSoon();
  }, []);

  if (loading) {
    return (
      <Box className="section-container">
        <Typography variant="h5" className="section-title">Coming Soon</Typography>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box className="section-container">
        <Typography variant="h5" className="section-title">Coming Soon</Typography>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box className="section-container">
      <Typography variant="h4" className="section-title">Coming Soon</Typography>
      <Grid container className="movies-grid">
        {movies.map((movie) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={movie.id}>
            <Card className="movie-card" onClick={() => navigate(`/movie/${movie.id}`)} style={{ cursor: 'pointer' }}>
              <CardMedia
                component="img"
                height="300"
                image={movie.poster_url || 'https://via.placeholder.com/300x450?text=No+Poster'}
                alt={movie.title}
                className="movie-poster"
              />
              <CardContent>
                <Typography variant="h6" className="movie-title" noWrap>
                  {movie.title}
                </Typography>
                <Typography variant="body2" className="movie-genre" color="textSecondary">
                  {movie.genre}
                </Typography>
                <Box className="movie-info">
                  <Chip label={movie.release_date || 'TBA'} size="small" className="movie-chip" />
                  <Chip label={`${movie.duration} min`} size="small" className="movie-chip duration" />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default ComingSoon;
