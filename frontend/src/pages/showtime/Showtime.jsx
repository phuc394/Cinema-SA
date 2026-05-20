import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  Chip,
  CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import axios from '../../ultis/axios';
import { isAuthenticated } from '../../utils/authUtils';
import './Showtime.css';

const Showtime = ({ open, onClose, movieId, movieTitle }) => {
  const [showtimes, setShowtimes] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchShowtimes = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`/cinema/api/movies/${movieId}/showtimes`);
        const showtimeList = response.data.showtimes || [];
        setShowtimes(showtimeList);
        // Select the first date by default
        if (showtimeList.length > 0) {
          const uniqueDates = [...new Set(showtimeList.map((s) => s.show_date))];
          setSelectedDate(uniqueDates[0]);
        } else {
          setSelectedDate(null);
        }
        setLoading(false);
      } catch {
        setError('Failed to fetch showtimes');
        setLoading(false);
      }
    };

    if (open && movieId) {
      fetchShowtimes();
    }
  }, [open, movieId]);

  const getUniqueDates = () => {
    if (!showtimes) return [];
    return [...new Set(showtimes.map(s => s.show_date))];
  };

  const getShowtimesForDate = (date) => {
    if (!showtimes) return [];
    return showtimes.filter(s => s.show_date === date);
  };

  const formatTime = (timeString) => {
    // Convert time string like "10:00:00" to "10:00"
    return timeString.substring(0, 5);
  };

  const formatDate = (dateString) => {
    // Convert date string like "2026-03-24" to a more readable format
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const handleShowtimeClick = (showtime) => {
    if (!isAuthenticated()) {
      // Store current location for redirect after login
      navigate('/login', { 
        state: { from: { pathname: window.location.pathname } } 
      });
      return;
    }
    onClose();
    navigate(`/seat-map/${showtime.showtime_id}`, {
      state: {
        movieId,
        movieTitle,
        showtime,
      },
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      className="showtime-modal"
      PaperProps={{
        className: 'showtime-modal-paper'
      }}
    >
      <DialogTitle className="showtime-modal-title">
        <Typography variant="h6" component="div" className="showtime-modal-title-text">
          Chọn suất chiếu
        </Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          className="showtime-close-button"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent className="showtime-modal-content">
        {loading ? (
          <Box className="showtime-loading">
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error" className="showtime-error">
            {error}
          </Typography>
        ) : showtimes && showtimes.length > 0 ? (
          <Box className="showtime-container">
            {/* Date Selection */}
            <Box className="showtime-dates-section">
              <Typography variant="subtitle1" className="showtime-section-title">
                Chọn ngày
              </Typography>
              <Box className="showtime-dates">
                {getUniqueDates().map((date) => (
                  <Chip
                    key={date}
                    label={formatDate(date)}
                    onClick={() => setSelectedDate(date)}
                    className={`showtime-date-chip ${selectedDate === date ? 'selected' : ''}`}
                    clickable
                  />
                ))}
              </Box>
            </Box>

            {/* Showtimes for selected date */}
            {selectedDate && (
              <Box className="showtime-times-section">
                <Typography variant="subtitle1" className="showtime-section-title">
                  Suất chiếu
                </Typography>
                <Box className="showtime-times">
                  {getShowtimesForDate(selectedDate).map((showtime) => (
                    <Chip
                      key={showtime.showtime_id}
                      label={formatTime(showtime.start_time)}
                      className="showtime-time-chip"
                      clickable
                      onClick={() => handleShowtimeClick(showtime)}
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        ) : (
          <Typography className="showtime-no-showtimes">
            Không có suất chiếu nào
          </Typography>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default Showtime;
