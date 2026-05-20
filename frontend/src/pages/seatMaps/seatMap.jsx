import { useCallback, useEffect, useRef, useState } from 'react';
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
import axios from '../../ultis/axios';
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

  return parsedDate.toLocaleDateString('vi-VN');
};

const formatTime = (timeString) => (timeString ? timeString.slice(0, 5) : '--');

const SeatMapPage = () => {
  const { showtimeId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const redirectTimerRef = useRef(null);

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

  const syncSeatMap = useCallback(async ({ suppressLoading = false } = {}) => {
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
      const nextReservedSeatCodes = reservedSeatsResponse.data.seat_codes || [];
      const nextSelectedSeats = (nextSeatData.seats || [])
        .filter(
          (seat) => seat.locked_by_current_user && !nextReservedSeatCodes.includes(seat.code)
        )
        .map((seat) => seat.code);
      const deadlines = (nextSeatData.seats || [])
        .filter((seat) => nextSelectedSeats.includes(seat.code) && seat.lock_expires_at)
        .map((seat) => new Date(seat.lock_expires_at).getTime())
        .filter((timestamp) => Number.isFinite(timestamp));

      setSeatData(nextSeatData);
      setReservedSeatCodes(nextReservedSeatCodes);
      setSelectedSeatCodes(nextSelectedSeats);
      setLockDeadline(deadlines.length ? Math.min(...deadlines) : null);
      setCurrentTime(Date.now());
      setPageError('');
    } catch (error) {
      setPageError(error.response?.data?.message || 'Khong the tai so do ghe.');
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
          message: 'Ghe da het thoi gian giu va duoc mo khoa.',
        });
      } catch {
        setFeedback({
          open: true,
          severity: 'error',
          message: 'Khong the tu dong mo khoa ghe. Vui long tai lai trang.',
        });
      }
    }, timeout);

    return () => window.clearTimeout(timeoutId);
  }, [lockDeadline, selectedSeatCodes, showtimeId, syncSeatMap]);

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        window.clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

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
  const pageMovieTitle = location.state?.movieTitle || `Suat chieu #${showtimeId}`;
  const showDate = seatData?.show_date || location.state?.showtime?.show_date;
  const startTime = seatData?.start_time || location.state?.showtime?.start_time;
  const roomName = seatData?.room || 'Dang cap nhat';

  const handleSeatClick = async (seat) => {
    if (seat.disabled || seatActionCode || bookingLoading) {
      return;
    }

    const isCurrentlySelected = selectedSeatSet.has(seat.code);
    setSeatActionCode(seat.code);

    try {
      if (isCurrentlySelected) {
        const remainingSeats = selectedSeatCodes.filter((seatCode) => seatCode !== seat.code);
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
          seat_codes: [...selectedSeatCodes, seat.code],
        });
      }

      await syncSeatMap({ suppressLoading: true });
    } catch (error) {
      await syncSeatMap({ suppressLoading: true });
      setFeedback({
        open: true,
        severity: 'error',
        message: error.response?.data?.message || 'Khong the cap nhat trang thai ghe.',
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
      const response = await axios.post('/order/bookings', {
        showtime_id: Number(showtimeId),
        seat_codes: selectedSeatCodes,
      });

      setBookingResult(response.data.booking);
      setSelectedSeatCodes([]);
      setLockDeadline(null);
      setSuccessDialogOpen(true);
      redirectTimerRef.current = window.setTimeout(() => {
        navigate('/', { replace: true });
      }, 1800);
    } catch (error) {
      await syncSeatMap({ suppressLoading: true });
      setFeedback({
        open: true,
        severity: 'error',
        message: error.response?.data?.message || 'Dat ve that bai. Vui long thu lai.',
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
                  Phong {roomName} | {formatDate(showDate)} | {formatTime(startTime)}
                </Typography>
              </Box>

              <Box className="seat-map-screen">MAN HINH</Box>

              {loading ? (
                <Box className="seat-map-state">
                  <Typography>Dang tai so do ghe...</Typography>
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
                    <Chip label="Trong" className="seat-map-legend__chip seat-map-legend__chip--available" />
                    <Chip label="Da dat / dang khoa" className="seat-map-legend__chip seat-map-legend__chip--unavailable" />
                    <Chip label="Dang chon" className="seat-map-legend__chip seat-map-legend__chip--selected" />
                    <Chip
                      label={
                        selectedSeatCodes.length
                          ? `Giu ghe con ${minutes}:${seconds}`
                          : 'Chon ghe de bat dau giu cho'
                      }
                      color="info"
                      variant="outlined"
                    />
                  </Stack>

                  <Paper elevation={0} className="seat-map-summary">
                    <Box>
                      <Typography variant="h6">Thong tin dat ve</Typography>
                      <Typography variant="body2" className="seat-map-summary__text">
                        Ghe da chon: {selectedSeatCodes.length ? selectedSeatCodes.join(', ') : 'Chua co'}
                      </Typography>
                      <Typography variant="body2" className="seat-map-summary__text">
                        Tong tien tam tinh: {formatCurrency(totalAmount)}
                      </Typography>
                    </Box>
                    <Button
                      variant="contained"
                      size="large"
                      className="seat-map-summary__button"
                      disabled={!selectedSeatCodes.length || bookingLoading}
                      onClick={handleBooking}
                    >
                      {bookingLoading ? 'Dang dat ve...' : 'Dat ve'}
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

      <Dialog open={successDialogOpen} onClose={() => navigate('/', { replace: true })}>
        <DialogTitle>Dat ve thanh cong</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Ban da dat thanh cong {bookingResult?.booking_id ? `ma don #${bookingResult.booking_id}` : 've xem phim'}.
          </Typography>
          <Typography variant="body2">
            Tong thanh toan: {formatCurrency(bookingResult?.total_amount || totalAmount)}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => navigate('/', { replace: true })}>Ve trang chu</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SeatMapPage;
