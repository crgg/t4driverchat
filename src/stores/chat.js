/**
 * Chat Store
 * Manages chat state, messages, and real-time updates
 *
 * NOTE: Chat functionality uses ONLY socket events, NOT APIs
 * APIs are only used for loading static data (devices, drivers, etc.)
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { chatApi } from '@/services/api';
import socketService from '@/services/socket';
import { scrollToBottom } from '@/utils/helpers';
import SocketAdapter from '@/adapter/socket.adapter';

export const useChatStore = defineStore('chat', () => {
  // State
  const messages = ref([]);
  const currentRoom = ref(null);
  const rooms = ref(new Map());
  const lastMessages = ref(new Map());
  const unreadMessages = ref(new Map());
  const usersTyping = ref(new Set());
  const typingTimeouts = ref(new Map()); // Map to store typing timeouts
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
    try {
      currentRoom.value = room;
      socketService.joinRoom(SocketAdapter.roomToEmitJoinEvent(room));
    } catch (error) {
      console.error('Failed to set current room:', error);
    }
  };

  const setSyncSession = async (room, callback) => {
    try {
      const payload = SocketAdapter.roomToEmitSyncSessionEvent(room);
      socketService.syncSession(payload, (newRoomData) => {
        try {
          const normalizedRoom = SocketAdapter.syncSessionResponseToRoom(newRoomData);
          callback(normalizedRoom);
        } catch (error) {
          console.error('Failed to normalize sync session response to room:', error);
        }
      });
    } catch (error) {
      console.error('Failed to set sync session:', error);
    }
  };

  const openedChatWeb = (room) => {
    try {
      socketService.openedChatWeb(SocketAdapter.openedChatWebToEmitEvent(room));
    } catch (error) {
      console.error('Failed to opened chat web:', error);
    }
  };

  /**
   * Leave current room
   */
  const leaveCurrentRoom = () => {
    if (currentRoom.value?.id) {
      socketService.leaveRoom(currentRoom.value.id.toString());

      // Clear all typing timeouts for this session
      const sessionId = currentRoom.value.id;
      typingTimeouts.value.forEach((timeout, key) => {
        if (key.startsWith(`${sessionId}-`)) {
          clearTimeout(timeout);
          typingTimeouts.value.delete(key);
          usersTyping.value.delete(key);
        }
      });
    }
    currentRoom.value = null;
    messages.value = [];
  };

  /**
   * Load messages for a session via socket
   * @param {number} sessionId
   * @param {number} offset
   * @param {number} limit
   */
  const loadMessages = (sessionId, offset = 0, limit = 50) => {
    loadingMessages.value = true;

    // Request history via socket
    socketService.requestHistoryMessages({
      sessionId: sessionId,
      offset: offset,
      limit: limit,
    });

    // The response will be handled by the 'history-messages' socket event listener
    return { success: true };
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

  const sendBulkChat = async (data) => {
    try {
      socketService.sendBulkChat(data);
    } catch (error) {
      console.error('Failed to send bulk chat:', error);
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
   * Update an existing message
   * @param {Object} updatedMessage
   */
  const updateMessage = (updatedMessage) => {
    const index = messages.value.findIndex((m) => m.id === updatedMessage.id);
    if (index !== -1) {
      messages.value.splice(index, 1, updatedMessage);
    }

    // Update last message if it's the latest
    if (updatedMessage.session_id) {
      const lastMsg = lastMessages.value.get(updatedMessage.session_id);
      if (lastMsg?.id === updatedMessage.id) {
        lastMessages.value.set(updatedMessage.session_id, updatedMessage);
      }
    }
  };

  /**
   * Delete a message
   * @param {number|string} messageId
   */
  const deleteMessage = (messageId) => {
    const index = messages.value.findIndex((m) => m.id === messageId);
    if (index !== -1) {
      const deletedMessage = messages.value[index];
      messages.value.splice(index, 1);

      // Update last message if it was the deleted one
      if (deletedMessage.session_id) {
        const lastMsg = lastMessages.value.get(deletedMessage.session_id);
        if (lastMsg?.id === messageId) {
          // Get the new last message
          const newLastMessage = messages.value
            .filter((m) => m.session_id === deletedMessage.session_id)
            .pop();
          if (newLastMessage) {
            lastMessages.value.set(deletedMessage.session_id, newLastMessage);
          } else {
            lastMessages.value.delete(deletedMessage.session_id);
          }
        }
      }
    }
  };

  /**
   * Mark specific message as read
   * @param {Object} message
   */
  const markMessageAsRead = (message) => {
    if (currentRoom.value?.id === message.session_id) {
      messages.value.forEach((msg) => {
        if (msg.session_id === message.session_id && !msg.read_at) {
          msg.read_at = message.read_at || new Date().toISOString();
        }
      });
    }
  };

  /**
   * Load history messages (for pagination/scroll)
   * @param {Array} historyMessages
   */
  const loadHistoryMessages = (historyMessages) => {
    if (historyMessages && historyMessages.length) {
      messages.value = [...historyMessages.reverse(), ...messages.value];
    }
    // Stop loading indicator
    loadingMessages.value = false;
  };

  /**
   * Update message ID after server confirmation
   * @param {Object} msg
   */
  const updateMessageId = (msg) => {
    // Find temp message and update with real ID
    const tempIndex = messages.value.findIndex((m) => m.sending && !m.id);
    if (tempIndex > -1 && msg.id) {
      messages.value[tempIndex].id = msg.id;
      messages.value[tempIndex].sending = false;
    }
  };

  /**
   * Increment unread count for a session
   * @param {number} sessionId
   */
  const incrementUnreadCount = (sessionId) => {
    const currentCount = unreadMessages.value.get(sessionId) || 0;
    unreadMessages.value.set(sessionId, currentCount + 1);
  };

  /**
   * Index last messages from rooms
   * @param {Array} rooms
   */
  const indexLastMessages = (rooms) => {
    if (!rooms || !Array.isArray(rooms)) return;

    rooms.forEach((room) => {
      if (room.lastMessage && room.id) {
        lastMessages.value.set(room.id, room.lastMessage);
      }
    });
  };

  /**
   * Index unread messages from rooms
   * @param {Array} rooms
   */
  const indexUnreadMessages = (rooms) => {
    if (!rooms || !Array.isArray(rooms)) return;

    // Clear current unread messages
    unreadMessages.value.clear();

    rooms.forEach((room) => {
      if (room.count && room.count > 0) {
        unreadMessages.value.set(room._id, room.count);
      }
    });
  };

  /**
   * Mark messages as read via socket
   * @param {number} sessionId
   */
  const markAsRead = (sessionId, username) => {
    // Emit via socket
    socketService.readMessage({
      sessionId: sessionId,
      username: username,
    });

    // Clear unread count locally
    unreadMessages.value.delete(sessionId);

    return { success: true };
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

    // Clear existing timeout if it exists
    const existingTimeout = typingTimeouts.value.get(key);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Add user to typing set
    usersTyping.value.add(key);

    // Create new timeout and store reference
    const timeout = setTimeout(() => {
      usersTyping.value.delete(key);
      typingTimeouts.value.delete(key);
    }, 3000);

    typingTimeouts.value.set(key, timeout);
  };

  /**
   * Clear user typing status
   * @param {Object} data
   */
  const clearUserTyping = (data) => {
    const key = `${data.sessionId}-${data.username}`;

    // Clear timeout if exists
    const existingTimeout = typingTimeouts.value.get(key);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      typingTimeouts.value.delete(key);
    }

    // Remove from typing set
    usersTyping.value.delete(key);
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

    // Clear all typing timeouts
    typingTimeouts.value.forEach((timeout) => {
      clearTimeout(timeout);
    });
    typingTimeouts.value.clear();

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
    updateMessage,
    deleteMessage,
    updateMessageId,
    markAsRead,
    markMessageAsRead,
    loadHistoryMessages,
    incrementUnreadCount,
    indexLastMessages,
    indexUnreadMessages,
    uploadFile,
    saveDraft,
    getDraft,
    clearDraft,
    setUserTyping,
    clearUserTyping,
    isUserTyping,
    setSessionDriver,
    getSessionDriver,
    setDeviceInfo,
    loadDeviceInformation,
    clearChatData,
    openedChatWeb,
    setSyncSession,
    sendBulkChat,
  };
});
