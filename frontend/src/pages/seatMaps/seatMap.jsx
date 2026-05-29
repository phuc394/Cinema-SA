import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import axios from '../../utils/axios';
import { isAuthenticated } from '../../utils/authUtils';
import SeatMap from './components/SeatMap';
import './seatMap.css';

const DEFAULT_SEAT_PRICE = 75000;

const formatCurrency = (amount) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);

const formatDate = (dateString) => {
  if (!dateString) {
    return '--';
  }

  const parsedDate = new Date(dateString);
  if (Number.isNaN(parsedDate.getTime())) {
    return dateString;
  }

  return parsedDate.toLocaleDateString('en-US');
};

const formatTime = (timeString) => (timeString ? timeString.slice(0, 5) : '--');

const normalizeSeatCode = (seatCode) => String(seatCode || '').trim().toUpperCase();

const normalizeSeatCodes = (seatCodes = []) =>
  seatCodes.map(normalizeSeatCode).filter(Boolean);

const getReservedSeatCodes = (responseData) =>
  normalizeSeatCodes(
    responseData?.seat_codes ||
      responseData?.reserved_seats ||
      responseData?.data?.seat_codes ||
      responseData?.data?.reserved_seats ||
      []
  );

const SeatMapPage = () => {
  const { showtimeId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [seatData, setSeatData] = useState(null);
  const [reservedSeatCodes, setReservedSeatCodes] = useState([]);
  const [selectedSeatCodes, setSelectedSeatCodes] = useState([]);
  const [lockDeadline, setLockDeadline] = useState(null);
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const [loading, setLoading] = useState(true);
  const [seatActionCode, setSeatActionCode] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [pageError, setPageError] = useState('');
  const [feedback, setFeedback] = useState({ open: false, severity: 'success', message: '' });
  const [bookingResult, setBookingResult] = useState(null);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);

  const syncSeatMap = useCallback(async ({ suppressLoading = false, expectedSelectedSeats = null } = {}) => {
    if (!showtimeId) {
      return;
    }

    if (!suppressLoading) {
      setLoading(true);
    }

    try {
      const [seatMapResponse, reservedSeatsResponse] = await Promise.all([
        axios.get(`/cinema/api/showtimes/${showtimeId}/seats`),
        axios.get(`/order/bookings/showtimes/${showtimeId}/reserved-seats`),
      ]);

      const nextSeatData = seatMapResponse.data;
      const nextReservedSeatCodes = getReservedSeatCodes(reservedSeatsResponse.data);
      const nextReservedSeatSet = new Set(nextReservedSeatCodes);
      const lockedByCurrentUser = normalizeSeatCodes(
        (nextSeatData.seats || [])
          .filter((seat) => seat.locked_by_current_user)
          .map((seat) => seat.code)
      );
      const optimisticSelectedSeats = normalizeSeatCodes(expectedSelectedSeats || []);
      const nextSelectedSeats = Array.from(
        new Set([...lockedByCurrentUser, ...optimisticSelectedSeats])
      ).filter((seatCode) => !nextReservedSeatSet.has(seatCode));
      const deadlines = (nextSeatData.seats || [])
        .filter((seat) => nextSelectedSeats.includes(seat.code) && seat.lock_expires_at)
        .map((seat) => new Date(seat.lock_expires_at).getTime())
        .filter((timestamp) => Number.isFinite(timestamp));

      setSeatData(nextSeatData);
      setReservedSeatCodes(nextReservedSeatCodes);
      setSelectedSeatCodes(nextSelectedSeats);
      setLockDeadline(
        deadlines.length
          ? Math.min(...deadlines)
          : optimisticSelectedSeats.length
            ? Date.now() + 5 * 60 * 1000
            : null
      );
      setCurrentTime(Date.now());
      setPageError('');
    } catch (error) {
      setPageError(error.response?.data?.message || 'Unable to load the seat map.');
    } finally {
      setLoading(false);
    }
  }, [showtimeId]);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login', {
        state: { from: { pathname: location.pathname } },
        replace: true,
      });
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void syncSeatMap();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [location.pathname, navigate, syncSeatMap]);

  useEffect(() => {
    if (!lockDeadline) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [lockDeadline]);

  useEffect(() => {
    if (!lockDeadline || !selectedSeatCodes.length) {
      return undefined;
    }

    const timeout = lockDeadline - Date.now();
    if (timeout <= 0) {
      return undefined;
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        await axios.post(`/cinema/api/showtimes/${showtimeId}/seats/release`, {
          seat_codes: selectedSeatCodes,
        });
        await syncSeatMap({ suppressLoading: true });
        setFeedback({
          open: true,
          severity: 'warning',
          message: 'Your seat hold has expired and the seats were released.',
        });
      } catch {
        setFeedback({
          open: true,
          severity: 'error',
          message: 'Unable to release seats automatically. Please refresh the page.',
        });
      }
    }, timeout);

    return () => window.clearTimeout(timeoutId);
  }, [lockDeadline, selectedSeatCodes, showtimeId, syncSeatMap]);

  const seatLookup = new Map((seatData?.seats || []).map((seat) => [seat.code, seat]));
  const reservedSeatSet = new Set(reservedSeatCodes);
  const selectedSeatSet = new Set(selectedSeatCodes);

  const visualSeats = Array.from({ length: 10 }, (_, rowIndex) =>
    Array.from({ length: 10 }, (_, columnIndex) => {
      const rowLabel = String.fromCharCode(65 + rowIndex);
      const columnNumber = columnIndex + 1;
      const seatCode = `${rowLabel}${columnNumber}`;
      const sourceSeat = seatLookup.get(seatCode);
      const isSelected = selectedSeatSet.has(seatCode);
      const isReserved = reservedSeatSet.has(seatCode);
      const isLockedByOther =
        Boolean(sourceSeat) && !sourceSeat.is_available && !sourceSeat.locked_by_current_user;
      const isMissingSeat = seatData && seatData.seats && seatData.seats.length > 0 && !sourceSeat;

      let status = 'available';
      if (isSelected) {
        status = 'selected';
      } else if (isReserved || isLockedByOther || isMissingSeat) {
        status = 'unavailable';
      }

      return {
        code: seatCode,
        label: seatCode,
        row: rowLabel,
        column: columnNumber,
        price: sourceSeat?.price ?? DEFAULT_SEAT_PRICE,
        type: sourceSeat?.type ?? (rowLabel >= 'H' ? 'VIP' : 'STANDARD'),
        status,
        disabled: status === 'unavailable',
      };
    })
  ).flat();

  const selectedSeats = visualSeats.filter((seat) => selectedSeatSet.has(seat.code));
  const totalAmount = selectedSeats.reduce((total, seat) => total + (seat.price || 0), 0);
  const remainingSeconds = lockDeadline
    ? Math.max(0, Math.ceil((lockDeadline - currentTime) / 1000))
    : 0;
  const minutes = String(Math.floor(remainingSeconds / 60)).padStart(2, '0');
  const seconds = String(remainingSeconds % 60).padStart(2, '0');
  const pageMovieTitle = location.state?.movieTitle || `Showtime #${showtimeId}`;
  const showDate = seatData?.show_date || location.state?.showtime?.show_date;
  const startTime = seatData?.start_time || location.state?.showtime?.start_time;
  const roomName = seatData?.room || 'Updating';

  const handleSeatClick = async (seat) => {
    if (seat.disabled || seatActionCode || bookingLoading) {
      return;
    }

    const isCurrentlySelected = selectedSeatSet.has(seat.code);
    const previousSelectedSeatCodes = selectedSeatCodes;
    setSeatActionCode(seat.code);

    try {
      const nextSelectedSeatCodes = isCurrentlySelected
        ? selectedSeatCodes.filter((seatCode) => seatCode !== seat.code)
        : [...selectedSeatCodes, seat.code];

      setSelectedSeatCodes(normalizeSeatCodes(nextSelectedSeatCodes));

      if (isCurrentlySelected) {
        const remainingSeats = nextSelectedSeatCodes;
        await axios.post(`/cinema/api/showtimes/${showtimeId}/seats/release`, {
          seat_codes: [seat.code],
        });

        if (remainingSeats.length > 0) {
          await axios.post(`/cinema/api/showtimes/${showtimeId}/seats/lock`, {
            seat_codes: remainingSeats,
          });
        }
      } else {
        await axios.post(`/cinema/api/showtimes/${showtimeId}/seats/lock`, {
          seat_codes: nextSelectedSeatCodes,
        });
      }

      await syncSeatMap({
        suppressLoading: true,
        expectedSelectedSeats: nextSelectedSeatCodes,
      });
    } catch (error) {
      setSelectedSeatCodes(normalizeSeatCodes(previousSelectedSeatCodes));
      await syncSeatMap({ suppressLoading: true });
      setFeedback({
        open: true,
        severity: 'error',
        message: error.response?.data?.message || 'Unable to update seat status.',
      });
    } finally {
      setSeatActionCode('');
    }
  };

  const handleBooking = async () => {
    if (!selectedSeatCodes.length) {
      return;
    }

    setBookingLoading(true);

    try {
      const response = await axios.post('/order/bookings/create_booking', {
        showtime_id: Number(showtimeId),
        seat_codes: selectedSeatCodes,
      });

      setBookingResult(response.data.booking);
      setSelectedSeatCodes([]);
      setLockDeadline(null);
      await syncSeatMap({ suppressLoading: true });
      setSuccessDialogOpen(true);
    } catch (error) {
      await syncSeatMap({ suppressLoading: true });
      setFeedback({
        open: true,
        severity: 'error',
        message: error.response?.data?.message || 'Booking failed. Please try again.',
      });
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <Box className="seat-map-page">
      <Header />
      <Box component="main" className="seat-map-page__body">
        <Container maxWidth="lg" className="seat-map-page__container">
          <Paper elevation={0} className="seat-map-panel">
            <Stack spacing={3}>
              <Box className="seat-map-panel__header">
                <Typography variant="overline" className="seat-map-panel__eyebrow">
                  SEAT MAP
                </Typography>
                <Typography variant="h4" className="seat-map-panel__title">
                  {pageMovieTitle}
                </Typography>
                <Typography variant="body1" className="seat-map-panel__subtitle">
                  Room {roomName} | {formatDate(showDate)} | {formatTime(startTime)}
                </Typography>
              </Box>

              <Box className="seat-map-screen">SCREEN</Box>

              {loading ? (
                <Box className="seat-map-state">
                  <Typography>Loading seat map...</Typography>
                </Box>
              ) : pageError ? (
                <Box className="seat-map-state">
                  <Alert severity="error">{pageError}</Alert>
                </Box>
              ) : (
                <>
                  <Box className="seat-map-board__wrap">
                    <SeatMap
                      seats={visualSeats}
                      activeSeatCode={seatActionCode}
                      isBusy={Boolean(seatActionCode) || bookingLoading}
                      onSeatClick={handleSeatClick}
                    />
                  </Box>

                  <Stack
                    direction={{ xs: 'column', md: 'row' }}
                    spacing={1.5}
                    className="seat-map-legend"
                  >
                    <Chip label="Available" className="seat-map-legend__chip seat-map-legend__chip--available" />
                    <Chip label="Booked / locked" className="seat-map-legend__chip seat-map-legend__chip--unavailable" />
                    <Chip label="Selected" className="seat-map-legend__chip seat-map-legend__chip--selected" />
                    <Chip
                      label={
                        selectedSeatCodes.length
                          ? `Seat hold ends in ${minutes}:${seconds}`
                          : 'Select seats to start holding them'
                      }
                      color="info"
                      variant="outlined"
                    />
                  </Stack>

                  <Paper elevation={0} className="seat-map-summary">
                    <Box>
                      <Typography variant="h6">Booking details</Typography>
                      <Typography variant="body2" className="seat-map-summary__text">
                        Selected seats: {selectedSeatCodes.length ? selectedSeatCodes.join(', ') : 'None'}
                      </Typography>
                      <Typography variant="body2" className="seat-map-summary__text">
                        Estimated total: {formatCurrency(totalAmount)}
                      </Typography>
                    </Box>
                    <Button
                      variant="contained"
                      size="large"
                      className="seat-map-summary__button"
                      disabled={!selectedSeatCodes.length || bookingLoading}
                      onClick={handleBooking}
                    >
                      {bookingLoading ? 'Booking...' : 'Book tickets'}
                    </Button>
                  </Paper>
                </>
              )}
            </Stack>
          </Paper>
        </Container>
      </Box>
      <Footer />

      <Snackbar
        open={feedback.open}
        autoHideDuration={4000}
        onClose={() => setFeedback((current) => ({ ...current, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          severity={feedback.severity}
          variant="filled"
          onClose={() => setFeedback((current) => ({ ...current, open: false }))}
        >
          {feedback.message}
        </Alert>
      </Snackbar>

      <Dialog open={successDialogOpen} onClose={() => {}}>
        <DialogTitle>Booking successful</DialogTitle>
        <DialogContent>
          <Alert severity="success" sx={{ mb: 2 }}>
            Your booking was completed successfully
            {bookingResult?.booking_id ? `, booking ID #${bookingResult.booking_id}` : ''}.
          </Alert>
          <Typography variant="body2">
            Total paid: {formatCurrency(bookingResult?.total_amount || 0)}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => navigate('/', { replace: true })}>
            Back to home
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SeatMapPage;
