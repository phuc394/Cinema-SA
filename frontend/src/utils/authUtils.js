const PENDING_SHOWTIME_KEY = 'pendingShowtime';

export const getToken = () => {
  return localStorage.getItem('token');
};

export const isAuthenticated = () => {
  const token = getToken();
  return !!token;
};

export const getUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const savePendingShowtime = (showtime) => {
  localStorage.setItem(PENDING_SHOWTIME_KEY, JSON.stringify(showtime));
};

export const getPendingShowtime = () => {
  const showtimeStr = localStorage.getItem(PENDING_SHOWTIME_KEY);
  return showtimeStr ? JSON.parse(showtimeStr) : null;
};

export const clearPendingShowtime = () => {
  localStorage.removeItem(PENDING_SHOWTIME_KEY);
};
