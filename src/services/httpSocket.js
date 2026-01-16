/**
 * HTTP Service
 * Axios instance with interceptors for authentication and error handling
 */

import axios from 'axios';
import configApp from '@/config';
import storage from '@/utils/storage';

// Create axios instance
const httpSocket = axios.create({
  baseURL: configApp.socket.apiUrl,
  timeout: configApp.socket.timeout,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor
httpSocket.interceptors.request.use(
  (config) => {
    // Add authorization token if available
    const token = storage.get(configApp.storage.token);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
// httpSocket.interceptors.response.use(
//   (response) => {
//     return response;
//   },
//   (error) => {
//     // Handle different error scenarios
//     if (error.response) {
//       const { status } = error.response;

//       switch (status) {
//         case 401:
//           // Unauthorized - clear storage and redirect to login
//           storage.remove(configApp.storage.token);
//           storage.remove(configApp.storage.user);
//           router.push(configApp.routes.login);
//           break;

//         case 403:
//           // Forbidden
//           console.error('Access forbidden');
//           break;

//         case 404:
//           // Not found
//           console.error('Resource not found');
//           break;

//         case 500:
//           // Server error
//           console.error('Internal server error');
//           break;

//         default:
//           console.error('An error occurred:', error.response.data);
//       }
//     } else if (error.request) {
//       // Request was made but no response received
//       console.error('No response from server');
//     } else {
//       // Something else happened
//       console.error('Error:', error.message);
//     }

//     return Promise.reject(error);
//   }
// );

export default httpSocket;
