import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const BACKEND_URL = API_URL.replace(/\/api\/?$/, '');

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach student token automatically if signed in
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cc_student_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-handle session expiration on 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && localStorage.getItem('cc_student_token')) {
      window.dispatchEvent(new CustomEvent('cc_auth_expired'));
    }
    return Promise.reject(error);
  }
);

// Student Two-Factor / Two-Step Auth API methods
export const studentLoginStep1 = async (email, password) => {
  const response = await api.post('/auth/login-step1', { email, password });
  return response.data;
};

export const studentRegisterStep1 = async ({ name, email, password }) => {
  const response = await api.post('/auth/register-step1', { name, email, password });
  return response.data;
};

export const studentVerifyOtp = async (email, otp) => {
  const response = await api.post('/auth/verify-otp', { email, otp });
  return response.data;
};

export const studentResendOtp = async (email) => {
  const response = await api.post('/auth/resend-otp', { email });
  return response.data;
};

// Sync Google user profile and session with backend User table
export const syncGoogleUser = async ({ id, email, name, avatarUrl }) => {
  const response = await api.post('/auth/google', { id, email, name, avatarUrl });
  return response.data;
};

export const studentGoogleLogin = syncGoogleUser;

// Google Authenticator (TOTP) Two-Factor Authentication methods
export const verify2FALogin = async ({ tempToken, code }) => {
  const response = await api.post('/auth/verify-2fa-login', { tempToken, code });
  return response.data;
};

export const setup2FA = async () => {
  const response = await api.post('/auth/2fa/setup');
  return response.data;
};

export const enable2FA = async ({ code }) => {
  const response = await api.post('/auth/2fa/enable', { code });
  return response.data;
};

export const disable2FA = async ({ password, code }) => {
  const response = await api.post('/auth/2fa/disable', { password, code });
  return response.data;
};

// Legacy fallback methods (retained)
export const studentLogin = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const studentRegister = async ({ name, email, password }) => {
  const response = await api.post('/auth/register', {
    name,
    email,
    password,
    role: 'student'
  });
  return response.data;
};

export const getStudentMe = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

// Submissions API methods
export const getSubmissions = async (params = {}) => {
  const response = await api.get('/submissions', { params });
  return response.data;
};

export const getSubmissionById = async (id) => {
  const response = await api.get(`/submissions/${id}`);
  return response.data;
};

export const createSubmission = async (formData) => {
  const response = await api.post('/submissions', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

export const getCategories = async () => {
  const response = await api.get('/meta/categories');
  return response.data;
};

export const getTags = async () => {
  const response = await api.get('/meta/tags');
  return response.data;
};

export const reportSubmission = async (submissionId, { reason, details, reporterEmail }) => {
  const response = await api.post(`/submissions/${submissionId}/report`, {
    reason,
    details,
    reporterEmail
  });
  return response.data;
};

export const submitGeneralFeedback = async ({ reason, subject, details, reporterEmail }) => {
  const response = await api.post('/reports/general', {
    reason,
    subject,
    details,
    reporterEmail
  });
  return response.data;
};

export const getFullMediaUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `${BACKEND_URL}${url}`;
};

export default api;
