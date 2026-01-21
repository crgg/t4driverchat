import moment from 'moment';
/**
 * General utility helper functions
 */

/**
 * Format a date using moment or native Date
 * @param {Date|string} date
 * @param {string} format
 * @returns {string}
 */

export const cn = (...classes) => {
  return classes.join(' ');
};

// format = 'YYYY-MM-DD HH:mm:ss'
export const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleString();
};

export const formatHour = (date) => {
  if (!date) return '';
  const time = moment(date);
  return time.format('h:mm A');
};

/**
 * Truncate text to a specific length
 * @param {string} text
 * @param {number} maxLength
 * @returns {string}
 */
export const truncateText = (text, maxLength = 60) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Debounce function to limit execution rate
 * @param {Function} func
 * @param {number} wait
 * @returns {Function}
 */
export const debounce = (func, wait = 300) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle function to limit execution rate
 * @param {Function} func
 * @param {number} limit
 * @returns {Function}
 */
export const throttle = (func, limit = 300) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Generate a unique ID
 * @returns {string}
 */
export const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Check if a value is empty
 * @param {any} value
 * @returns {boolean}
 */
export const isEmpty = (value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

/**
 * Deep clone an object
 * @param {any} obj
 * @returns {any}
 */
export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Format file size
 * @param {number} bytes
 * @returns {string}
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Get file extension from filename
 * @param {string} filename
 * @returns {string}
 */
export const getFileExtension = (filename) => {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2);
};

/**
 * Check if file is an image
 * @param {string} filename
 * @returns {boolean}
 */
export const isImage = (filename) => {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
  const ext = getFileExtension(filename).toLowerCase();
  return imageExtensions.includes(ext);
};

/**
 * Check if file is a PDF
 * @param {string} filename
 * @returns {boolean}
 */
export const isPdf = (filename) => {
  return getFileExtension(filename).toLowerCase() === 'pdf';
};

/**
 * Sanitize HTML to prevent XSS
 * @param {string} html
 * @returns {string}
 */
export const sanitizeHtml = (html) => {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
};

/**
 * Parse query string from URL
 * @param {string} search
 * @returns {Object}
 */
export const parseQueryString = (search = window.location.search) => {
  const params = new URLSearchParams(search);
  const result = {};
  for (const [key, value] of params) {
    result[key] = value;
  }
  return result;
};

/**
 * Build query string from object
 * @param {Object} params
 * @returns {string}
 */
export const buildQueryString = (params) => {
  const searchParams = new URLSearchParams();
  Object.keys(params).forEach((key) => {
    if (params[key] !== null && params[key] !== undefined) {
      searchParams.append(key, params[key]);
    }
  });
  return searchParams.toString();
};

/**
 * Scroll element to bottom
 * @param {HTMLElement} element
 * @param {boolean} smooth
 */
export const scrollToBottom = (element, smooth = true) => {
  if (!element) return;
  element.scrollTo({
    top: element.scrollHeight,
    behavior: smooth ? 'smooth' : 'auto',
  });
};

/**
 * Copy text to clipboard
 * @param {string} text
 * @returns {Promise<boolean>}
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

/**
 * Cookie utilities
 */
export const cookies = {
  /**
   * Set a cookie
   * @param {string} name - Cookie name
   * @param {string} value - Cookie value
   * @param {number} days - Days until expiration (optional)
   * @param {string} path - Cookie path (default: '/')
   */
  set(name, value, days = 365, path = '/') {
    let expires = '';
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
      expires = '; expires=' + date.toUTCString();
    }
    document.cookie = name + '=' + (value || '') + expires + '; path=' + path;
  },

  /**
   * Get a cookie value
   * @param {string} name - Cookie name
   * @returns {string|null} Cookie value or null if not found
   */
  get(name) {
    const nameEQ = name + '=';
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  },

  /**
   * Delete a cookie
   * @param {string} name - Cookie name
   * @param {string} path - Cookie path (default: '/')
   */
  remove(name, path = '/') {
    document.cookie = name + '=; Max-Age=-99999999; path=' + path;
  },

  /**
   * Check if a cookie exists
   * @param {string} name - Cookie name
   * @returns {boolean}
   */
  has(name) {
    return this.get(name) !== null;
  },
};

export const formatTime = (time) => {
  if (!time) return '';

  const messageTime = moment(time);
  const now = moment();

  // If today, show only time
  if (now.isSame(messageTime, 'day')) {
    return messageTime.format('h:mm A');
  }

  // If yesterday
  const yesterday = moment().subtract(1, 'days');
  if (yesterday.isSame(messageTime, 'day')) {
    return 'Yesterday';
  }

  // If within this week, show day name
  const daysAgo = now.diff(messageTime, 'days');
  if (daysAgo < 7) {
    return messageTime.format('ddd'); // Mon, Tue, etc.
  }

  // If within this year, show month and day
  if (now.isSame(messageTime, 'year')) {
    return messageTime.format('MM/DD');
  }

  // Otherwise show full date
  return messageTime.format('MM/DD/YYYY');
};
