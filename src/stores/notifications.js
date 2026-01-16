/**
 * Notifications Store
 * Manages in-app notifications and alerts
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { chatApi } from '@/services/api';

export const useNotificationsStore = defineStore('notifications', () => {
  // State
  const notifications = ref([]);
  const unreadCount = ref(0);
  const loading = ref(false);

  // Getters
  const hasUnread = computed(() => unreadCount.value > 0);
  const unreadNotifications = computed(() => notifications.value.filter((n) => !n.read));

  // Actions
  /**
   * Load notifications
   */
  const loadNotifications = async () => {
    loading.value = true;

    try {
      // const response = await chatApi.getNotifications();
      // const data = response.data.data || [];
      const data = [];

      notifications.value = data;
      unreadCount.value = data.filter((n) => !n.read).length;

      return { success: true, data };
    } catch (error) {
      console.error('Failed to load notifications:', error);
      return { success: false, error };
    } finally {
      loading.value = false;
    }
  };

  /**
   * Add a new notification
   * @param {Object} notification
   */
  const addNotification = (notification) => {
    notifications.value.unshift(notification);
    if (!notification.read) {
      unreadCount.value++;
    }
  };

  /**
   * Mark notification as read
   * @param {number} notificationId
   */
  const markAsRead = (notificationId) => {
    const notification = notifications.value.find((n) => n.id === notificationId);
    if (notification && !notification.read) {
      notification.read = true;
      unreadCount.value = Math.max(0, unreadCount.value - 1);
    }
  };

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = () => {
    notifications.value.forEach((n) => {
      n.read = true;
    });
    unreadCount.value = 0;
  };

  /**
   * Remove notification
   * @param {number} notificationId
   */
  const removeNotification = (notificationId) => {
    const index = notifications.value.findIndex((n) => n.id === notificationId);
    if (index > -1) {
      const notification = notifications.value[index];
      if (!notification.read) {
        unreadCount.value = Math.max(0, unreadCount.value - 1);
      }
      notifications.value.splice(index, 1);
    }
  };

  /**
   * Clear all notifications
   */
  const clearNotifications = () => {
    notifications.value = [];
    unreadCount.value = 0;
  };

  /**
   * Show toast notification
   * @param {Object} options
   */
  const showToast = (options) => {
    const notification = {
      id: Date.now(),
      type: options.type || 'info',
      title: options.title || '',
      message: options.message || '',
      duration: options.duration || 3000,
      read: false,
      createdAt: new Date().toISOString(),
    };

    addNotification(notification);

    // Auto remove after duration
    if (notification.duration > 0) {
      setTimeout(() => {
        removeNotification(notification.id);
      }, notification.duration);
    }

    return notification.id;
  };

  /**
   * Show success toast
   * @param {string} message
   * @param {string} title
   */
  const showSuccess = (message, title = 'Success') => {
    return showToast({ type: 'success', title, message });
  };

  /**
   * Show error toast
   * @param {string} message
   * @param {string} title
   */
  const showError = (message, title = 'Error') => {
    return showToast({ type: 'error', title, message });
  };

  /**
   * Show info toast
   * @param {string} message
   * @param {string} title
   */
  const showInfo = (message, title = 'Info') => {
    return showToast({ type: 'info', title, message });
  };

  /**
   * Show warning toast
   * @param {string} message
   * @param {string} title
   */
  const showWarning = (message, title = 'Warning') => {
    return showToast({ type: 'warning', title, message });
  };

  return {
    // State
    notifications,
    unreadCount,
    loading,
    // Getters
    hasUnread,
    unreadNotifications,
    // Actions
    loadNotifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearNotifications,
    showToast,
    showSuccess,
    showError,
    showInfo,
    showWarning,
  };
});
