/**
 * Authentication Store
 * Manages user authentication state and operations
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authApi } from '@/services/api';
import storage from '@/utils/storage';
import config from '@/config';
import socketService from '@/services/socket';

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref(null);
  const token = ref(null);
  const isAuthenticated = ref(false);
  const loading = ref(false);
  const error = ref(null);

  // Getters
  const currentUser = computed(() => user.value);
  const isLoggedIn = computed(() => isAuthenticated.value && !!token.value);
  const username = computed(() => user.value?.username || '');

  // Actions
  /**
   * Initialize authentication from storage
   */
  const initializeAuth = () => {
    const storedToken = storage.get(config.storage.token);
    const storedUser = storage.get(config.storage.user);

    if (storedToken && storedUser) {
      token.value = storedToken;
      user.value = storedUser;
      isAuthenticated.value = true;

      // Connect socket if user is authenticated
      if (storedUser.username) {
        socketService.connect(storedUser.username, {
          user: storedUser,
        });
      }
    } else {
      console.log('Redirect to other web @initializeAuth');
      // redirect to other web
      // window.location.href = `${config.api.baseUrl}/dashboard`;
      return;
    }
  };

  /**
   * Login with email and password
   * @param {Object} credentials
   */
  const login = async (credentials) => {
    credentials;
    loading.value = true;
    error.value = null;

    try {
      // const response = await authApi.login(credentials)
      // const { token: authToken, user: userData } = response.data
      const authToken = '1234567890';
      const userData = {
        id: 1,
        name: 'RAMON',
        email: 'john.doe@example.com',
        username: 'RAMON',
      };

      // Store in state
      token.value = authToken;
      user.value = userData;
      isAuthenticated.value = true;

      // Persist to storage
      storage.set(config.storage.token, authToken);
      storage.set(config.storage.user, userData);

      // Connect socket
      if (userData.username) {
        socketService.connect(userData.username, {
          user: userData,
          token: authToken,
        });
      }

      return { success: true, data: {} };
    } catch (err) {
      error.value = err.response?.data?.message || 'Login failed';
      return { success: false, error: error.value };
    } finally {
      loading.value = false;
    }
  };

  /**
   * Login with token from URL
   * @param {string} urlToken
   */
  const loginWithToken = async (urlToken) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await authApi.loginWithToken(urlToken);
      const { token: authToken, user: userData } = response.data;

      // Store in state
      token.value = authToken;
      user.value = userData;
      isAuthenticated.value = true;

      // Persist to storage
      storage.set(config.storage.token, authToken);
      storage.set(config.storage.user, userData);

      // Connect socket
      if (userData.username) {
        socketService.connect(userData.username, {
          user: userData,
        });
      }

      return { success: true, data: response.data };
    } catch (err) {
      error.value = err.response?.data?.message || 'Token authentication failed';
      return { success: false, error: error.value };
    } finally {
      loading.value = false;
    }
  };

  /**
   * Login with session token and validate
   * @param {string} sessionToken
   * @param {Function} checkSessionFn - Function to check session validity
   */
  const loginWithSession = async (sessionToken, checkSessionFn) => {
    loading.value = true;
    error.value = null;

    try {
      // Store token first
      token.value = sessionToken;
      storage.set(config.storage.token, sessionToken);

      // Validate session
      const response = await checkSessionFn();

      // Check if authenticated
      if (response.data && response.data.authenticated) {
        // Map response data to user format
        const userData = {
          id: response.data.user_id,
          name: response.data.name,
          email: response.data.email,
          username: response.data.username,
          role: response.data.role,
        };

        // Store in state
        user.value = userData;
        isAuthenticated.value = true;

        // Persist to storage
        storage.set(config.storage.user, userData);

        // Connect socket
        if (userData.username) {
          socketService.connect(userData.username, {
            user: userData,
            token: sessionToken,
          });
        }

        return { success: true, data: userData };
      } else {
        throw new Error('Session not authenticated');
      }
    } catch (err) {
      // Clear token on error
      token.value = null;
      storage.remove(config.storage.token);
      error.value = err.response?.data?.message || 'Session authentication failed';
      return { success: false, error: error.value };
    } finally {
      loading.value = false;
    }
  };

  /**
   * Logout user
   */
  const logout = async () => {
    try {
      // await authApi.logout();
      console.log('Logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      // Clear state
      user.value = null;
      token.value = null;
      isAuthenticated.value = false;
      error.value = null;

      // Clear storage
      storage.remove(config.storage.token);
      storage.remove(config.storage.user);

      // Disconnect socket
      socketService.disconnect();
    }
  };

  /**
   * Verify token validity
   */
  const verifyToken = async () => {
    try {
      const response = await authApi.verifyToken();
      return response.data.valid;
    } catch (err) {
      console.error('Token verification failed:', err);
      await logout();
      return false;
    }
  };

  /**
   * Refresh user data
   */
  const refreshUser = async () => {
    try {
      const response = await authApi.me();
      user.value = response.data;
      storage.set(config.storage.user, response.data);
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }
  };

  /**
   * Clear error
   */
  const clearError = () => {
    error.value = null;
  };

  return {
    // State
    user,
    token,
    isAuthenticated,
    loading,
    error,
    // Getters
    currentUser,
    isLoggedIn,
    username,
    // Actions
    initializeAuth,
    login,
    loginWithToken,
    loginWithSession,
    logout,
    verifyToken,
    refreshUser,
    clearError,
  };
});
