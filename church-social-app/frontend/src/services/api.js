import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Remove Content-Type header for FormData to let axios set it with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data)
};

// User API
export const userAPI = {
  getUsers: (params) => api.get('/users', { params }),
  getUserById: (id) => api.get(`/users/${id}`),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  deleteUser: (id) => api.delete(`/users/${id}`),
  deleteProfilePicture: (id) => api.delete(`/users/${id}/profile-picture`)
};

// Post API
export const postAPI = {
  getPosts: (params) => api.get('/posts', { params }),
  getPost: (id) => api.get(`/posts/${id}`),
  createPost: (data) => api.post('/posts', data),
  updatePost: (id, data) => api.put(`/posts/${id}`, data),
  deletePost: (id) => api.delete(`/posts/${id}`),
  likePost: (id) => api.post(`/posts/${id}/like`),
  sharePost: (id) => api.post(`/posts/${id}/share`)
};

// Comment API
export const commentAPI = {
  createComment: (data) => api.post('/comments', data),
  deleteComment: (id) => api.delete(`/comments/${id}`),
  likeComment: (id) => api.post(`/comments/${id}/like`)
};

// Event API
export const eventAPI = {
  getEvents: (params) => api.get('/events', { params }),
  getEvent: (id) => api.get(`/events/${id}`),
  createEvent: (data) => api.post('/events', data),
  updateEvent: (id, data) => api.put(`/events/${id}`, data),
  deleteEvent: (id) => api.delete(`/events/${id}`),
  rsvpEvent: (id, data) => api.post(`/events/${id}/rsvp`, data)
};

// Group API
export const groupAPI = {
  getGroups: (params) => api.get('/groups', { params }),
  getGroup: (id) => api.get(`/groups/${id}`),
  createGroup: (data) => api.post('/groups', data),
  updateGroup: (id, data) => api.put(`/groups/${id}`, data),
  deleteGroup: (id) => api.delete(`/groups/${id}`),
  joinGroup: (id, data) => api.post(`/groups/${id}/join`, data),
  leaveGroup: (id) => api.post(`/groups/${id}/leave`)
};

// Prayer API
export const prayerAPI = {
  getPrayers: (params) => api.get('/prayers', { params }),
  getPrayer: (id) => api.get(`/prayers/${id}`),
  createPrayer: (data) => api.post('/prayers', data),
  updatePrayer: (id, data) => api.put(`/prayers/${id}`, data),
  deletePrayer: (id) => api.delete(`/prayers/${id}`),
  prayForRequest: (id) => api.post(`/prayers/${id}/pray`),
  addResponse: (id, data) => api.post(`/prayers/${id}/respond`, data)
};

// Sermon API
export const sermonAPI = {
  getSermons: (params) => api.get('/sermons', { params }),
  getSermon: (id) => api.get(`/sermons/${id}`),
  createSermon: (data) => api.post('/sermons', data),
  updateSermon: (id, data) => api.put(`/sermons/${id}`, data),
  deleteSermon: (id) => api.delete(`/sermons/${id}`),
  likeSermon: (id) => api.post(`/sermons/${id}/like`),
  addComment: (id, data) => api.post(`/sermons/${id}/comment`, data)
};

// Message API
export const messageAPI = {
  getConversations: () => api.get('/messages/conversations'),
  getConversation: (id) => api.get(`/messages/conversations/${id}`),
  getMessages: (conversationId, params) => api.get(`/messages/conversations/${conversationId}/messages`, { params }),
  createConversation: (data) => api.post('/messages/conversations', data),
  sendMessage: (data) => api.post('/messages', data),
  markAsRead: (conversationId) => api.put(`/messages/conversations/${conversationId}/read`)
};

// Notification API
export const notificationAPI = {
  getNotifications: (params) => api.get('/notifications', { params }),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  deleteNotification: (id) => api.delete(`/notifications/${id}`)
};

// Live Stream API
export const liveStreamAPI = {
  getLiveStreams: (params) => api.get('/live-streams', { params }),
  getLiveStream: (id) => api.get(`/live-streams/${id}`),
  getCurrentLiveStream: () => api.get('/live-streams/current'),
  createLiveStream: (data) => api.post('/live-streams', data),
  updateLiveStream: (id, data) => api.put(`/live-streams/${id}`, data),
  startLiveStream: (id) => api.post(`/live-streams/${id}/start`),
  endLiveStream: (id) => api.post(`/live-streams/${id}/end`),
  joinLiveStream: (id) => api.post(`/live-streams/${id}/join`),
  deleteLiveStream: (id) => api.delete(`/live-streams/${id}`)
};

export default api;
