/**
 * Application configuration
 * Centralizes all environment variables and configuration settings
 */

export const config = {
  // API Configuration
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
    timeout: 30000,
  },

  // Socket.io Configuration
  socket: {
    url: import.meta.env.VITE_CHAT_SERVER_URL || 'http://localhost:3001',
    options: {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling'],
      autoConnect: false,
    },
    apiUrl: import.meta.env.VITE_CHAT_API_URL || 'http://localhost:4000',
    timeout: 30000,
  },

  // Application Configuration
  app: {
    name: import.meta.env.VITE_APP_NAME || 'Chat Microservice',
    version: '1.0.0',
  },

  // Storage Keys
  storage: {
    token: 'chat_auth_token',
    user: 'chat_user',
    theme: 'chat_theme',
    drafts: 'chat_drafts',
  },

  // Chat Configuration
  chat: {
    maxCharacters: 60,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    allowedPdfTypes: ['application/pdf'],
    messageLoadLimit: 50,
  },

  // Routes
  routes: {
    login: '/login',
    chat: '/chat',
    home: '/',
  },
};

export default config;
