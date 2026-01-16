/**
 * Chat Store
 * Manages chat state, messages, and real-time updates
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { chatApi } from '@/services/api';
import socketService from '@/services/socket';
import { scrollToBottom } from '@/utils/helpers';

export const useChatStore = defineStore('chat', () => {
  // State
  const messages = ref([]);
  const currentRoom = ref(null);
  const rooms = ref(new Map());
  const lastMessages = ref(new Map());
  const unreadMessages = ref(new Map());
  const usersTyping = ref(new Set());
  const sessionDrivers = ref(new Map());
  const deviceInformation = ref(new Map());
  const drafts = ref(new Map());
  const loading = ref(false);
  const loadingMessages = ref(false);

  // Getters
  const currentMessages = computed(() => messages.value);
  const currentRoomId = computed(() => currentRoom.value?.id);
  const hasUnread = computed(() => unreadMessages.value.size > 0);
  const totalUnread = computed(() => {
    let total = 0;
    unreadMessages.value.forEach((count) => (total += count));
    return total;
  });

  // Actions
  /**
   * Set current room/session
   * @param {Object} room
   */
  const setCurrentRoom = (room) => {
    currentRoom.value = room;
    if (room?.id) {
      socketService.joinRoom(room.id.toString());
    }
  };

  /**
   * Leave current room
   */
  const leaveCurrentRoom = () => {
    if (currentRoom.value?.id) {
      socketService.leaveRoom(currentRoom.value.id.toString());
    }
    currentRoom.value = null;
    messages.value = [];
  };

  /**
   * Load messages for a session
   * @param {number} sessionId
   * @param {number} page
   */
  const loadMessages = async (sessionId, page = 1) => {
    loadingMessages.value = true;

    try {
      const response = await chatApi.getMessages(sessionId, page);
      const newMessages = response.data.data || [];

      if (page === 1) {
        messages.value = newMessages;
      } else {
        messages.value = [...newMessages, ...messages.value];
      }

      return { success: true, data: newMessages, hasMore: response.data.hasMore };
    } catch (error) {
      console.error('Failed to load messages:', error);
      return { success: false, error };
    } finally {
      loadingMessages.value = false;
    }
  };

  /**
   * Send a message
   * @param {Object} messageData
   */
  const sendMessage = async (messageData) => {
    try {
      // Optimistically add message to UI
      const tempMessage = {
        ...messageData,
        id: `temp-${Date.now()}`,
        sending: true,
        created_at: new Date().toISOString(),
      };

      messages.value.push(tempMessage);

      // Send via socket
      socketService.sendMessage(messageData);

      return { success: true };
    } catch (error) {
      console.error('Failed to send message:', error);
      return { success: false, error };
    }
  };

  /**
   * Receive a new message
   * @param {Object} message
   */
  const receiveMessage = (message) => {
    // Remove temp message if exists
    const tempIndex = messages.value.findIndex((m) => m.sending && m.content === message.content);

    if (tempIndex > -1) {
      messages.value.splice(tempIndex, 1);
    }

    // Add new message
    messages.value.push(message);

    // Update last message
    if (message.session_id) {
      lastMessages.value.set(message.session_id, message);
    }

    // Increment unread count if not in current room
    if (currentRoom.value?.id !== message.session_id) {
      const currentCount = unreadMessages.value.get(message.session_id) || 0;
      unreadMessages.value.set(message.session_id, currentCount + 1);
    }

    // Scroll to bottom
    setTimeout(() => {
      const container = document.querySelector('.messages-container');
      scrollToBottom(container);
    }, 100);
  };

  /**
   * Mark messages as read
   * @param {number} sessionId
   */
  const markAsRead = async (sessionId) => {
    try {
      await chatApi.markAsRead(sessionId);
      unreadMessages.value.delete(sessionId);
      return { success: true };
    } catch (error) {
      console.error('Failed to mark as read:', error);
      return { success: false, error };
    }
  };

  /**
   * Upload file
   * @param {File} file
   * @param {Function} onProgress
   */
  const uploadFile = async (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);

    if (currentRoom.value?.id) {
      formData.append('session_id', currentRoom.value.id);
    }

    try {
      const response = await chatApi.uploadFile(formData, onProgress);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Failed to upload file:', error);
      return { success: false, error };
    }
  };

  /**
   * Save draft message
   * @param {number} sessionId
   * @param {string} content
   */
  const saveDraft = (sessionId, content) => {
    if (content.trim()) {
      drafts.value.set(sessionId, content);
    } else {
      drafts.value.delete(sessionId);
    }
  };

  /**
   * Get draft message
   * @param {number} sessionId
   */
  const getDraft = (sessionId) => {
    return drafts.value.get(sessionId) || '';
  };

  /**
   * Clear draft
   * @param {number} sessionId
   */
  const clearDraft = (sessionId) => {
    drafts.value.delete(sessionId);
  };

  /**
   * Set user typing status
   * @param {Object} data
   */
  const setUserTyping = (data) => {
    const key = `${data.sessionId}-${data.username}`;
    usersTyping.value.add(key);

    // Remove after timeout
    setTimeout(() => {
      usersTyping.value.delete(key);
    }, 3000);
  };

  /**
   * Check if user is typing
   * @param {number} sessionId
   * @param {string} username
   */
  const isUserTyping = (sessionId, username) => {
    const key = `${sessionId}-${username}`;
    return usersTyping.value.has(key);
  };

  /**
   * Set session for driver
   * @param {string} driverId
   * @param {number} sessionId
   */
  const setSessionDriver = (driverId, sessionId) => {
    sessionDrivers.value.set(driverId, sessionId);
  };

  /**
   * Get session for driver
   * @param {string} driverId
   */
  const getSessionDriver = (driverId) => {
    return sessionDrivers.value.get(driverId);
  };

  /**
   * Set device information
   * @param {string} driverId
   * @param {Object} info
   */
  const setDeviceInfo = (driverId, info) => {
    deviceInformation.value.set(driverId, info);
  };

  /**
   * Load device information
   */
  const loadDeviceInformation = async () => {
    try {
      const response = await chatApi.getDeviceInformation();
      const devices = response.data.data || [];

      devices.forEach((device) => {
        deviceInformation.value.set(device.driver_id, device);
      });
    } catch (error) {
      console.error('Failed to load device information:', error);
    }
  };

  /**
   * Clear all chat data
   */
  const clearChatData = () => {
    messages.value = [];
    currentRoom.value = null;
    lastMessages.value.clear();
    unreadMessages.value.clear();
    usersTyping.value.clear();
    drafts.value.clear();
  };

  return {
    // State
    messages,
    currentRoom,
    rooms,
    lastMessages,
    unreadMessages,
    usersTyping,
    sessionDrivers,
    deviceInformation,
    drafts,
    loading,
    loadingMessages,
    // Getters
    currentMessages,
    currentRoomId,
    hasUnread,
    totalUnread,
    // Actions
    setCurrentRoom,
    leaveCurrentRoom,
    loadMessages,
    sendMessage,
    receiveMessage,
    markAsRead,
    uploadFile,
    saveDraft,
    getDraft,
    clearDraft,
    setUserTyping,
    isUserTyping,
    setSessionDriver,
    getSessionDriver,
    setDeviceInfo,
    loadDeviceInformation,
    clearChatData,
  };
});
