const API_BASE = 'https://codsoft-task1-ry7t.onrender.com/api';

function getToken() {
  return localStorage.getItem('jobBoardToken');
}

async function apiRequest(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
  return data;
}

// Separate helper for the one request that needs file upload (multipart, not JSON)
async function apiUpload(path, formData) {
  const headers = {};
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers, // NOTE: don't set Content-Type manually - browser sets it with the correct boundary for FormData
    body: formData
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
  return data;
}

export const api = {
  register: (name, email, password, role, company_name) =>
    apiRequest('/auth/register', { method: 'POST', body: { name, email, password, role, company_name } }),

  login: (email, password) =>
    apiRequest('/auth/login', { method: 'POST', body: { email, password } }),

  listJobs: (search, location) => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (location) params.set('location', location);
    const qs = params.toString();
    return apiRequest(`/jobs${qs ? `?${qs}` : ''}`);
  },

  getJob: (id) => apiRequest(`/jobs/${id}`),

  postJob: (job) => apiRequest('/jobs', { method: 'POST', body: job }),

  myJobs: () => apiRequest('/jobs/mine/list'),

  applyToJob: (jobId, resumeFile, coverLetter) => {
    const formData = new FormData();
    formData.append('resume', resumeFile);
    if (coverLetter) formData.append('cover_letter', coverLetter);
    return apiUpload(`/applications/${jobId}`, formData);
  },

  jobApplicants: (jobId) => apiRequest(`/applications/job/${jobId}`),

  myApplications: () => apiRequest('/applications/mine/list'),

  updateApplicationStatus: (id, status) =>
    apiRequest(`/applications/${id}/status`, { method: 'PATCH', body: { status } }),

  getNotifications: () => apiRequest('/notifications'),

  markNotificationRead: (id) => apiRequest(`/notifications/${id}/read`, { method: 'PATCH' })
};

export function saveToken(token) {
  localStorage.setItem('jobBoardToken', token);
}

export function saveUser(user) {
  localStorage.setItem('jobBoardUser', JSON.stringify(user));
}

export function getUser() {
  const raw = localStorage.getItem('jobBoardUser');
  return raw ? JSON.parse(raw) : null;
}

export function logout() {
  localStorage.removeItem('jobBoardToken');
  localStorage.removeItem('jobBoardUser');
}

export function isLoggedIn() {
  return !!getToken();
}

export const RESUME_BASE = 'http://localhost:5001';
