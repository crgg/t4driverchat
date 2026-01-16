/**
 * Socket Composable
 * Provides reactive socket functionality
 */

import { ref, onMounted, onBeforeUnmount } from 'vue';
import socketService from '@/services/socket';

export function useSocket() {
  const isConnected = ref(false);
  const socketId = ref('');

  const listeners = [];

  /**
   * Register event listener
   * @param {string} event
   * @param {Function} callback
   */
  const on = (event, callback) => {
    socketService.on(event, callback);
    listeners.push({ event, callback });
  };

  /**
   * Remove event listener
   * @param {string} event
   * @param {Function} callback
   */
  const off = (event, callback) => {
    socketService.off(event, callback);
    const index = listeners.findIndex((l) => l.event === event && l.callback === callback);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  };

  /**
   * Emit event
   * @param {string} event
   * @param {any} data
   */
  const emit = (event, data) => {
    socketService.send(event, data);
  };

  /**
   * Emit with acknowledgment
   * @param {string} event
   * @param {any} data
   */
  const emitWithAck = async (event, data) => {
    return await socketService.sendWithAck(event, data);
  };

  /**
   * Update connection status
   */
  const updateStatus = () => {
    isConnected.value = socketService.isConnected();
    socketId.value = socketService.getSocketId() || '';
  };

  onMounted(() => {
    // Setup connection status listeners
    on('socket:connected', (id) => {
      socketId.value = id;
      isConnected.value = true;
    });

    on('socket:disconnected', () => {
      isConnected.value = false;
      socketId.value = '';
    });

    on('socket:reconnected', () => {
      isConnected.value = true;
      socketId.value = socketService.getSocketId() || '';
    });

    // Initial status update
    updateStatus();
  });

  onBeforeUnmount(() => {
    // Clean up all listeners
    listeners.forEach(({ event, callback }) => {
      socketService.off(event, callback);
    });
    listeners.length = 0;
  });

  return {
    isConnected,
    socketId,
    on,
    off,
    emit,
    emitWithAck,
  };
}
