/**
 * Chat API Service
 */

import http from '../http';
import httpSocket from '../httpSocket';

export const chatApi = {
  /**
   * Get drivers list
   * @param {string} search - Search query
   * @returns {Promise}
   */
  getDrivers(search = '') {
    console.log('getDrivers', search);
    return http.get('/DriverTripListComplete', {
      params: { search },
      maxBodyLength: Infinity,
      withCredentials: true,
    });
  },

  checkSession() {
    // /api/auth/session-check
    return http.get('/api/auth/session-check', {
      withCredentials: true,
      maxBodyLength: Infinity,
    });
  },

  /**
   * Get carriers list
   * @param {string} search - Search query
   * @returns {Promise}
   */
  getCarriers(search = '') {
    return http.get('/chat/carriers', { params: { search } });
  },

  /**
   * Get users by driver IDs
   * @param {Array} driverIds
   * @returns {Promise}
   */
  getUsersByDriverIds(driverIds) {
    return http.post('/chat/users/by-ids', { driver_ids: driverIds });
  },

  /**
   * Get messages for a session
   * @param {number} sessionId
   * @param {number} page
   * @param {number} limit
   * @returns {Promise}
   */
  getMessages(sessionId, page = 1, limit = 50) {
    return http.get(`/chat/messages/${sessionId}`, {
      params: { page, limit },
    });
  },

  /**
   * Send a message
   * @param {Object} message
   * @returns {Promise}
   */
  sendMessage(message) {
    return http.post('/chat/messages', message);
  },

  /**
   * Mark messages as read
   * @param {number} sessionId
   * @returns {Promise}
   */
  markAsRead(sessionId) {
    return http.post(`/chat/messages/${sessionId}/read`);
  },

  /**
   * Upload file
   * @param {FormData} formData
   * @param {Function} onUploadProgress
   * @returns {Promise}
   */
  uploadFile(formData, onUploadProgress) {
    return http.post('/chat/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
  },

  /**
   * Get unread notifications
   * @returns {Promise}
   */
  getNotifications() {
    return http.get('/chat/notifications');
  },

  /**
   * Get rooms/sessions
   * @returns {Promise}
   */
  getRooms() {
    return http.get('/chat/rooms');
  },

  /**
   * Create a new room/session
   * @param {Object} data
   * @returns {Promise}
   */
  createRoom(data) {
    return http.post('/chat/rooms', data);
  },

  /**
   * Get device information
   * @returns {Promise}
   */
  getDeviceInformation() {
    return httpSocket.get('/devices/information');
  },
};

export default chatApi;
