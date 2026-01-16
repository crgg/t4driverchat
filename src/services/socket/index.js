/**
 * Socket.io Service
 * Manages WebSocket connection and events
 */

import io from 'socket.io-client';
import config from '@/config';
import storage from '@/utils/storage';

class SocketService {
  user = null;
  token = null;

  constructor() {
    this.socket = null;
    this.connected = false;
    this.listeners = new Map();
  }

  /**
   * Initialize socket connection
   * @param {string} username
   */
  connect(username, { user }) {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    this.user = user;

    const token = storage.get(config.storage.token);
    this.token = token;

    this.socket = io(config.socket.url, {
      ...config.socket.options,
      // auth: {
      //   token: 'VhCxBC3c1a9jSmoJAdhtvGj6lBtKfPGoXVGSTCMoYOzeEAkchbzjmvHxBQx6',
      //   username,
      // },
    });

    this.setupDefaultListeners();

    // Register any listeners that were added before socket was initialized
    // this.registerPendingListeners();

    this.socket.connect();
  }

  /**
   * Setup default socket listeners
   */
  setupDefaultListeners() {
    this.socket.on('connect', () => {
      this.connected = true;
      this.emit('socket:connected', this.socket.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.connected = false;
      this.emit('socket:disconnected', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.emit('socket:error', error);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts');
      this.emit('socket:reconnected', attemptNumber);
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('Socket reconnection error:', error);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('Socket reconnection failed');
    });
  }

  /**
   * Register listeners that were added before socket was initialized
   */
  registerPendingListeners() {
    // Local events (like 'socket:connected') don't need to be registered with Socket.IO
    const localEvents = [
      'socket:connected',
      'socket:disconnected',
      'socket:reconnected',
      'socket:error',
    ];

    this.listeners.forEach((callbacks, event) => {
      // Skip local-only events, they're handled by this.emit()
      if (localEvents.includes(event)) {
        return;
      }

      // Register each callback with Socket.IO for server events
      callbacks.forEach((callback) => {
        this.socket.on(event, callback);
      });
    });
  }

  /**
   * Disconnect socket
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      this.listeners.clear();
    }
  }

  /**
   * Listen to a socket event
   * @param {string} event
   * @param {Function} callback
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);

    if (this.socket) {
      this.socket.on(event, callback);
    }

    if (event === 'socket:connected' && this.connected && this.socket?.id) {
      callback(this.socket.id);
    }
  }

  /**
   * Remove listener for an event
   * @param {string} event
   * @param {Function} callback
   */
  off(event, callback) {
    if (!this.socket) return;

    this.socket.off(event, callback);

    // Remove from listeners map
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Emit an event to server
   * @param {string} event
   * @param {any} data
   */
  send(event, data, callback) {
    if (!this.socket?.connected) {
      console.warn('Socket not connected');
      return;
    }

    if (callback) {
      this.socket.emit(event, data, callback);
    } else {
      this.socket.emit(event, data);
    }
  }

  /**
   * Emit an event with acknowledgment
   * @param {string} event
   * @param {any} data
   * @returns {Promise}
   */
  sendWithAck(event, data) {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit(event, data, (response) => {
        if (response.error) {
          reject(response.error);
        } else {
          resolve(response);
        }
      });
    });
  }

  /**
   * Emit event to local listeners only (not to server)
   * @param {string} event
   * @param {any} data
   */
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((callback) => callback(data));
    }
  }

  /**
   * Join a room
   * @param {string} room
   */
  joinRoom(room) {
    this.send('join', room);
  }

  syncSession(roomData, callback) {
    this.send('sync-session', roomData, callback);
  }

  /**
   * Leave a room
   * @param {string} room
   */
  leaveRoom(room) {
    this.send('salir', room);
  }

  /**
   * Send a chat message
   * @param {Object} message
   */
  sendMessage(message) {
    this.send('chat', message);
  }

  /**
   * Update a message
   * @param {Object} data - { messageId, newText }
   */
  updateMessage(data) {
    this.send('update-message', data);
  }

  /**
   * Delete a message
   * @param {Object} data - { messageId, sessionId, withLastMessage, from, to }
   */
  destroyMessage(data) {
    this.send('destroy-message', data);
  }

  /**
   * Send typing indicator
   * @param {Object} data
   */
  sendTyping(data) {
    this.send('typing', data);
  }

  /**
   * Stop typing indicator
   * @param {Object} data
   */
  stopTyping(data) {
    this.send('typing', data);
  }

  /**
   * Emit read message event
   * @param {Object} data
   */
  readMessage(data) {
    this.send('read_message', data);
  }

  /**
   * Emit opened chat web event
   * @param {Object} data
   */
  openedChatWeb(data) {
    this.send('openchatweb', data);
  }

  /**
   * Request history messages
   * @param {Object} data - { sessionId, offset, limit }
   */
  requestHistoryMessages(data) {
    this.send('history-messages', data);
  }

  /**
   * Check if socket is connected
   * @returns {boolean}
   */
  isConnected() {
    return this.connected && this.socket?.connected;
  }

  /**
   * Get socket ID
   * @returns {string}
   */
  getSocketId() {
    return this.socket?.id;
  }
}

// Export singleton instance
export default new SocketService();
