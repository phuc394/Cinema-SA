import { useEffect, useState } from 'react';
import { Box, Typography, Button, Grid, Chip } from '@mui/material';
import axios from '../../../ultis/axios';
import Showtime from '../../showtime/Showtime';

const Movie = ({ movieId }) => {
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showtimeModalOpen, setShowtimeModalOpen] = useState(false);

  useEffect(() => {
    const fetchMovieDetails = async () => {
      try {
        const response = await axios.get(`/movies/${movieId}`);
        setMovie(response.data);
        setLoading(false);
      } catch {
        setError('Failed to fetch movie details');
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
            <strong>Thể loại:</strong> {movie.genre}
          </Typography>
          <Typography variant="body1" className="movie-release-date">
            <strong>Ngày chiếu:</strong> {movie.release_date || 'TBA'}
          </Typography>
          <Typography variant="body1" className="movie-duration">
            <strong>Thời lượng:</strong> {movie.duration} phút
          </Typography>
          {movie.description && (
            <Typography variant="body1" className="movie-description">
              <strong>Mô tả:</strong> {movie.description}
            </Typography>
          )}
          <Box className="movie-status">
            <Chip
              label={movie.status === 1 ? 'Đang chiếu' : movie.status === 0 ? 'Sắp chiếu' : 'Ngừng chiếu'}
              color={movie.status === 1 ? 'success' : movie.status === 0 ? 'info' : 'error'}
              size="medium"
            />
          </Box>
          {movie.status === 1 && (
            <Button
              variant="contained"
              color="primary"
              className="booking-button"
              size="large"
              onClick={() => setShowtimeModalOpen(true)}
            >
              Đặt Vé
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
