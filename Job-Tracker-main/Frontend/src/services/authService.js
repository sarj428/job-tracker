import Cookies from 'js-cookie';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const setAuthCookie = (token, user) => {
  Cookies.set('ct_token', token, { expires: 7, sameSite: 'Lax' });
  Cookies.set('ct_user', JSON.stringify(user), { expires: 7, sameSite: 'Lax' });
};

export const clearAuthCookie = () => {
  Cookies.remove('ct_token');
  Cookies.remove('ct_user');
};

export const getAuthCookie = () => {
  const token = Cookies.get('ct_token');
  const userStr = Cookies.get('ct_user');
  return {
    token: token || null,
    user: userStr ? JSON.parse(userStr) : null,
  };
};

export const login = async (email, password) => {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Login failed');
  setAuthCookie(data.token, data.user);
  return data;
};

export const register = async (name, email, password) => {
  const response = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Registration failed');
  setAuthCookie(data.token, data.user);
  return data;
};
