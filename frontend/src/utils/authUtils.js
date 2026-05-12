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
