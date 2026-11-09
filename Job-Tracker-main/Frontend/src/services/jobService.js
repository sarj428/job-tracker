import Cookies from 'js-cookie';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const getHeaders = () => {
  const token = Cookies.get('ct_token');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

const handleResponse = async (response) => {
  const data = await response.json();
  if (response.status === 401) {
    // Dispatch a global event so App.js can clear auth state
    window.dispatchEvent(new CustomEvent('auth:logout'));
    throw new Error(data.message || 'Session expired. Please log in again.');
  }
  if (!response.ok) throw new Error(data.message || 'Request failed');
  return data;
};

export const getAllJobs = async (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      query.append(key, val);
    }
  });
  const url = `${BASE_URL}/jobs${query.toString() ? `?${query}` : ''}`;
  const response = await fetch(url, { headers: getHeaders(), credentials: 'include' });
  return handleResponse(response);
};

export const getJobStats = async () => {
  const response = await fetch(`${BASE_URL}/jobs/stats`, { headers: getHeaders(), credentials: 'include' });
  return handleResponse(response);
};

export const getJobById = async (id) => {
  const response = await fetch(`${BASE_URL}/jobs/${id}`, { headers: getHeaders(), credentials: 'include' });
  return handleResponse(response);
};

export const createJob = async (jobData) => {
  const response = await fetch(`${BASE_URL}/jobs`, {
    method: 'POST',
    headers: getHeaders(),
    credentials: 'include',
    body: JSON.stringify(jobData),
  });
  return handleResponse(response);
};

export const updateJob = async (id, jobData) => {
  const response = await fetch(`${BASE_URL}/jobs/${id}`, {
    method: 'PATCH',
    headers: getHeaders(),
    credentials: 'include',
    body: JSON.stringify(jobData),
  });
  return handleResponse(response);
};

export const deleteJob = async (id) => {
  const response = await fetch(`${BASE_URL}/jobs/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
    credentials: 'include',
  });
  return handleResponse(response);
};
