import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://campus-canvas-backend.onrender.com/api';
export const BACKEND_URL = API_URL.replace(/\/api\/?$/, '');

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach JWT token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cs_editor_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercept 401/403 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('cs_editor_token');
      localStorage.removeItem('cs_editor_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

export const getSubmissionsByStatus = async (status = 'pending', params = {}) => {
  const response = await api.get('/submissions', {
    params: { status, ...params }
  });
  return response.data;
};

export const reviewSubmission = async (id, status, editorComment) => {
  const response = await api.patch(`/submissions/${id}/review`, {
    status,
    editorComment
  });
  return response.data;
};

export const deleteSubmission = async (id) => {
  const response = await api.delete(`/submissions/${id}`);
  return response.data;
};

export const getStats = async () => {
  const response = await api.get('/meta/stats');
  return response.data;
};

export const getReports = async (status = 'pending') => {
  const response = await api.get('/reports', {
    params: { status }
  });
  return response.data;
};

export const getReportStats = async () => {
  const response = await api.get('/reports/stats');
  return response.data;
};

export const updateReportStatus = async (id, status) => {
  const response = await api.patch(`/reports/${id}`, { status });
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
