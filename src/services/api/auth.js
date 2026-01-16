/**
 * Authentication API Service
 */

import http from '../http';

export const authApi = {
  /**
   * Login with email and password
   * @param {Object} credentials - { email, password }
   * @returns {Promise}
   */
  login(credentials) {
    return http.post('/auth/login', credentials);
  },

  /**
   * Login with token from URL
   * @param {string} token
   * @returns {Promise}
   */
  loginWithToken(token) {
    return http.post('/auth/token-login', { token });
  },

  /**
   * Logout
   * @returns {Promise}
   */
  logout() {
    return http.post('/auth/logout');
  },

  /**
   * Get current user
   * @returns {Promise}
   */
  me() {
    return http.get('/auth/me');
  },

  /**
   * Refresh token
   * @returns {Promise}
   */
  refresh() {
    return http.post('/auth/refresh');
  },

  /**
   * Verify token validity
   * @returns {Promise}
   */
  verifyToken() {
    return http.get('/auth/verify');
  },
};

export default authApi;
