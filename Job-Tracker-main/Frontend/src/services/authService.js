import Cookies from 'js-cookie';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const isProduction = process.env.NODE_ENV === 'production';

export const setAuthCookie = (token, user) => {
  const cookieOptions = {
    expires: 7,
    sameSite: isProduction ? 'None' : 'Lax',
    secure: isProduction,
  };
  Cookies.set('ct_token', token, cookieOptions);
  Cookies.set('ct_user', JSON.stringify(user), cookieOptions);
};

export const clearAuthCookie = () => {
  const cookieOptions = {
    sameSite: isProduction ? 'None' : 'Lax',
    secure: isProduction,
  };
  Cookies.remove('ct_token', cookieOptions);
  Cookies.remove('ct_user', cookieOptions);
};

export const getAuthCookie = () => {
  const token = Cookies.get('ct_token');
  const userStr = Cookies.get('ct_user');
  try {
    return {
      token: token || null,
      user: userStr ? JSON.parse(userStr) : null,
    };
  } catch {
    return { token: token || null, user: null };
  }
};

export const login = async (email, password) => {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
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
    credentials: 'include',
    body: JSON.stringify({ name, email, password }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Registration failed');
  setAuthCookie(data.token, data.user);
  return data;
};
