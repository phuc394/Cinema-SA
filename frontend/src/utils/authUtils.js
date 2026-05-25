const PENDING_SHOWTIME_KEY = 'pendingShowtime';
const AUTH_TOKEN_KEY = 'token';
const AUTH_TOKEN_SAVED_AT_KEY = 'tokenSavedAt';
const AUTH_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

const decodeJwtPayload = (token) => {
  try {
    const payload = token.split('.')[1];
    if (!payload) {
      return null;
    }

    const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
    const paddedPayload = normalizedPayload.padEnd(
      normalizedPayload.length + ((4 - (normalizedPayload.length % 4)) % 4),
      '='
    );

    return JSON.parse(window.atob(paddedPayload));
  } catch {
    return null;
  }
};

export const isTokenExpired = (token) => {
  if (!token) {
    return true;
  }

  if (token.split('.').length !== 3) {
    const savedAt = Number(localStorage.getItem(AUTH_TOKEN_SAVED_AT_KEY));
    return !savedAt || Date.now() - savedAt >= AUTH_TOKEN_TTL_MS;
  }

  const payload = decodeJwtPayload(token);
  if (!payload?.exp) {
    return true;
  }

  return payload.exp * 1000 <= Date.now();
};

export const getToken = () => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (isTokenExpired(token)) {
    logout();
    return null;
  }

  return token;
};

export const saveAuthSession = (token, user) => {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_TOKEN_SAVED_AT_KEY, String(Date.now()));
  localStorage.setItem('user', JSON.stringify(user));
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
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_TOKEN_SAVED_AT_KEY);
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
