import api from './api';

export const authService = {
  async register(data) {
    const res = await api.post('/auth/register', data);
    if (res.data && res.data.token) {
      localStorage.setItem('kc_auth_token', res.data.token);
      localStorage.setItem('kc_auth_user', JSON.stringify(res.data.user));
    }
    return res.data;
  },

  async login(data) {
    const res = await api.post('/auth/login', data);
    if (res.data && res.data.token) {
      localStorage.setItem('kc_auth_token', res.data.token);
      localStorage.setItem('kc_auth_user', JSON.stringify(res.data.user));
    }
    return res.data;
  },

  async getCurrentUser() {
    const res = await api.get('/auth/me');
    return res.data;
  },

  logout() {
    localStorage.removeItem('kc_auth_token');
    localStorage.removeItem('kc_auth_user');
  },

  getToken() {
    return localStorage.getItem('kc_auth_token');
  },

  getStoredUser() {
    const user = localStorage.getItem('kc_auth_user');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated() {
    return !!localStorage.getItem('kc_auth_token');
  }
};
