import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  List,
  ListItemButton,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import HistoryIcon from '@mui/icons-material/History';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import EmailIcon from '@mui/icons-material/Email';
import LogoutIcon from '@mui/icons-material/Logout';
import PhoneIcon from '@mui/icons-material/Phone';
import PersonIcon from '@mui/icons-material/Person';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import axios from '../../utils/axios';
import { getUser, isAuthenticated, logout } from '../../utils/authUtils';
import './Profile.css';

const profileTabs = [
  { id: 'account', label: 'Account', icon: AccountCircleIcon },
  { id: 'history', label: 'History', icon: HistoryIcon },
];

const formatCurrency = (amount) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

const formatDateTime = (dateString) => {
  if (!dateString) {
    return '--';
  }

  const parsedDate = new Date(dateString);
  if (Number.isNaN(parsedDate.getTime())) {
    return dateString;
  }

  return parsedDate.toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

const getStatusLabel = (status) => {
  if (status === 1 || status === '1') {
    return 'Confirmed';
  }

  return 'Pending';
};

const Profile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('account');
  const [bookings, setBookings] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const user = getUser() || {};

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login', {
        state: { from: { pathname: location.pathname } },
        replace: true,
      });
    }
  }, [location.pathname, navigate]);

  useEffect(() => {
    const loadHistory = async () => {
      setHistoryLoading(true);
      setHistoryError('');

      try {
        const response = await axios.get('/order/bookings/history');
        setBookings(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        setHistoryError(error.response?.data?.message || 'Unable to load booking history.');
      } finally {
        setHistoryLoading(false);
      }
    };

    if (activeTab === 'history' && isAuthenticated()) {
      void loadHistory();
    }
  }, [activeTab]);

  const handleOpenDetails = async (booking) => {
    setSelectedBooking(booking);
    setDetailLoading(true);
    setDetailError('');

    try {
      const bookingResponse = await axios.get(`/order/bookings/${booking.booking_id}`);
      const bookingDetail = bookingResponse.data.booking || booking;
      let movieName = booking.movie_name || booking.movieName || '';

      if (bookingDetail.showtime_id) {
        const seatMapResponse = await axios.get(
          `/cinema/api/showtimes/${bookingDetail.showtime_id}/seats`
        );
        const movieId = seatMapResponse.data.movie_id;

        if (movieId) {
          const movieResponse = await axios.get(`/cinema/api/movies/${movieId}`);
          movieName = movieResponse.data.movie?.title || movieName;
        }
      }

      setSelectedBooking({
        ...bookingDetail,
        movie_name: movieName || `Showtime #${bookingDetail.showtime_id}`,
      });
    } catch (error) {
      setDetailError(error.response?.data?.message || 'Unable to load booking details.');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleCloseDetails = () => {
    setSelectedBooking(null);
    setDetailError('');
  };

  const accountFields = [
    {
      label: 'Full name',
      value: user.full_name || user.name || '--',
      icon: PersonIcon,
    },
    {
      label: 'Email',
      value: user.email || '--',
      icon: EmailIcon,
    },
    {
      label: 'Phone number',
      value: user.phone_number || user.phone || '--',
      icon: PhoneIcon,
    },
  ];

  return (
    <Box className="profile-page">
      <Header />
      <Box component="main" className="profile-page__body">
        <Container maxWidth="lg" className="profile-page__container">
          <Paper elevation={0} className="profile-shell">
            <Box className="profile-sidebar">
              {profileTabs.map((tab) => {
                const TabIcon = tab.icon;

                return (
                  <ListItemButton
                    key={tab.id}
                    selected={activeTab === tab.id}
                    className="profile-sidebar__item"
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <TabIcon className="profile-sidebar__icon" />
                    <Typography className="profile-sidebar__label">{tab.label}</Typography>
                  </ListItemButton>
                );
              })}
            </Box>

            <Box className="profile-content">
              {activeTab === 'account' ? (
                <Box>
                  <Typography variant="h4" className="profile-content__title">
                    Account
                  </Typography>
                  <Typography variant="body1" className="profile-content__subtitle">
                    Your saved account information.
                  </Typography>

                  <Stack spacing={2.5} className="profile-account">
                    {accountFields.map((field) => {
                      const FieldIcon = field.icon;

                      return (
                        <Box key={field.label} className="profile-info-row">
                          <Box className="profile-info-row__icon">
                            <FieldIcon fontSize="small" />
                          </Box>
                          <Box>
                            <Typography variant="body2" className="profile-info-row__label">
                              {field.label}
                            </Typography>
                            <Typography variant="h6" className="profile-info-row__value">
                              {field.value}
                            </Typography>
                          </Box>
                        </Box>
                      );
                    })}
                    <Button
                      variant="contained"
                      color="error"
                      startIcon={<LogoutIcon />}
                      className="profile-logout-button"
                      onClick={handleLogout}
                    >
                      LogOut
                    </Button>
                  </Stack>
                </Box>
              ) : (
                <Box>
                  <Typography variant="h4" className="profile-content__title">
                    History
                  </Typography>
                  <Typography variant="body1" className="profile-content__subtitle">
                    Tickets you have booked.
                  </Typography>

                  {historyLoading ? (
                    <Box className="profile-state">
                      <CircularProgress size={28} />
                      <Typography>Loading history...</Typography>
                    </Box>
                  ) : historyError ? (
                    <Alert severity="error">{historyError}</Alert>
                  ) : bookings.length === 0 ? (
                    <Box className="profile-empty">
                      <ConfirmationNumberIcon />
                      <Typography variant="h6">No bookings yet</Typography>
                      <Typography variant="body2">
                        Your booked tickets will appear here.
                      </Typography>
                    </Box>
                  ) : (
                    <List className="profile-history">
                      {bookings.map((booking) => (
                        <Paper
                          key={booking.booking_id}
                          elevation={0}
                          component="li"
                          className="profile-history__item"
                        >
                          <Box className="profile-history__main">
                            <Box className="profile-history__ticket-icon">
                              <ConfirmationNumberIcon />
                            </Box>
                            <Box>
                              <Typography variant="h6" className="profile-history__title">
                                Booking #{booking.booking_id}
                              </Typography>
                              <Typography variant="body2" className="profile-history__meta">
                                Showtime #{booking.showtime_id} | {formatDateTime(booking.created_at)}
                              </Typography>
                              <Typography variant="body2" className="profile-history__status">
                                {getStatusLabel(booking.status)}
                              </Typography>
                            </Box>
                          </Box>
                          <Box className="profile-history__side">
                            <Typography variant="h6" className="profile-history__price">
                              {formatCurrency(booking.total_amount)}
                            </Typography>
                            <Button variant="outlined" onClick={() => handleOpenDetails(booking)}>
                              Details
                            </Button>
                          </Box>
                        </Paper>
                      ))}
                    </List>
                  )}
                </Box>
              )}
            </Box>
          </Paper>
        </Container>
      </Box>
      <Footer />

      <Dialog open={Boolean(selectedBooking)} onClose={handleCloseDetails} fullWidth maxWidth="sm">
        <DialogTitle>Booking details</DialogTitle>
        <DialogContent>
          {detailLoading ? (
            <Box className="profile-state">
              <CircularProgress size={28} />
              <Typography>Loading details...</Typography>
            </Box>
          ) : detailError ? (
            <Alert severity="error">{detailError}</Alert>
          ) : selectedBooking ? (
            <Stack spacing={2}>
              <Box className="profile-detail-row">
                <Typography>Movie name</Typography>
                <Typography>{selectedBooking.movie_name || '--'}</Typography>
              </Box>
              <Box className="profile-detail-row">
                <Typography>Total amount</Typography>
                <Typography>{formatCurrency(selectedBooking.total_amount)}</Typography>
              </Box>
              {Array.isArray(selectedBooking.seats) && selectedBooking.seats.length > 0 && (
                <>
                  <Divider />
                  <Box>
                    <Typography variant="subtitle1" className="profile-detail__section-title">
                      Seats
                    </Typography>
                    <Stack spacing={1}>
                      {selectedBooking.seats.map((seat) => (
                        <Box key={seat.seat_code} className="profile-detail-row">
                          <Typography>Seat {seat.seat_code}</Typography>
                          <Typography>{formatCurrency(seat.price)}</Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                </>
              )}
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={handleCloseDetails}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Profile;
