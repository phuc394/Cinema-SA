import { useEffect, useState } from 'react';
import { Box, Typography, Button, Grid, Chip } from '@mui/material';
import axios from '../../../ultis/axios';
import Showtime from '../../showtime/Showtime';

const MOVIE_STATUS = {
  now_showing: {
    label: 'Dang chieu',
    color: 'success',
  },
  coming_soon: {
    label: 'Sap chieu',
    color: 'info',
  },
  stopped: {
    label: 'Ngung chieu',
    color: 'error',
  },
};

const Movie = ({ movieId }) => {
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showtimeModalOpen, setShowtimeModalOpen] = useState(false);

  useEffect(() => {
    const fetchMovieDetails = async () => {
      try {
        const response = await axios.get(`/cinema/api/movies/${movieId}`);
        setMovie(response.data.movie);
      } catch {
        setError('Failed to fetch movie details');
      } finally {
        setLoading(false);
      }
    };

    fetchMovieDetails();
  }, [movieId]);

  if (loading) {
    return (
      <Box className="movie-container">
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box className="movie-container">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!movie) {
    return (
      <Box className="movie-container">
        <Typography>Movie not found</Typography>
      </Box>
    );
  }

  const statusConfig = MOVIE_STATUS[movie.status] || {
    label: 'Khong ro',
    color: 'default',
  };

  return (
    <>
      <Grid container className="movie-container">
        <Grid item xs={12} md={5} className="movie-poster-container">
          <img
            src={movie.poster_url || null}
            alt={movie.title}
            className="movie-poster"
          />
        </Grid>
        <Grid item xs={12} md={7} className="movie-info-container">
          <Typography variant="h4" className="movie-title">
            {movie.title}
          </Typography>
          <Typography variant="body1" className="movie-genre">
            <strong>The loai:</strong> {movie.genre}
          </Typography>
          <Typography variant="body1" className="movie-release-date">
            <strong>Ngay chieu:</strong> {movie.release_date || 'TBA'}
          </Typography>
          <Typography variant="body1" className="movie-duration">
            <strong>Thoi luong:</strong> {movie.duration} phut
          </Typography>
          {movie.description && (
            <Typography variant="body1" className="movie-description">
              <strong>Mo ta:</strong> {movie.description}
            </Typography>
          )}
          <Box className="movie-status">
            <Chip
              label={statusConfig.label}
              color={statusConfig.color}
              size="medium"
            />
          </Box>
          {movie.status === 'now_showing' && (
            <Button
              variant="contained"
              color="primary"
              className="booking-button"
              size="large"
              onClick={() => setShowtimeModalOpen(true)}
            >
              Dat ve
            </Button>
          )}
        </Grid>
      </Grid>
      <Showtime
        open={showtimeModalOpen}
        onClose={() => setShowtimeModalOpen(false)}
        movieId={movieId}
      />
    </>
  );
};

export default Movie;
