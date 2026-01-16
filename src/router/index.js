/**
 * Vue Router Configuration
 * Defines application routes and navigation guards
 */

import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import config from '@/config';
import { parseQueryString } from '@/utils/helpers';

const routes = [
  {
    path: '/',
    redirect: '/chat',
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: {
      requiresAuth: false,
      title: 'Login',
    },
  },
  {
    path: '/chat',
    name: 'Chat',
    component: () => import('@/views/Chat.vue'),
    meta: {
      requiresAuth: true,
      title: 'Chat',
    },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
    meta: {
      requiresAuth: false,
      title: '404 - Page Not Found',
    },
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

// Global navigation guard
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();

  // Set page title
  document.title = to.meta.title ? `${to.meta.title} - ${config.app.name}` : config.app.name;

  // Check for token in URL query
  const queryParams = parseQueryString(to.fullPath.split('?')[1]);

  if (queryParams.token && !authStore.isLoggedIn) {
    // Attempt to login with token
    const result = await authStore.loginWithToken(queryParams.token);

    if (result.success) {
      // Remove token from URL
      const cleanPath = to.path;
      next({ path: cleanPath, replace: true });
      return;
    } else {
      // Token login failed, redirect to login page
      next({ name: 'Login', replace: true });
      return;
    }
  }

  // Check authentication requirement
  if (to.meta.requiresAuth) {
    if (!authStore.isLoggedIn) {
      // Not authenticated, redirect to login
      next({
        name: 'Login',
        query: { redirect: to.fullPath },
      });
      return;
    }

    // Verify token validity periodically
    if (authStore.isLoggedIn && from.name !== 'Login') {
      // You can add token verification here if needed
      // const isValid = await authStore.verifyToken()
      // if (!isValid) {
      //   next({ name: 'Login' })
      //   return
      // }
    }
  } else {
    // Route doesn't require auth
    if (authStore.isLoggedIn && to.name === 'Login') {
      // Already logged in, redirect to chat
      next({ name: 'Chat', replace: true });
      return;
    }
  }

  next();
});

// Global after hook
// router.afterEach((to, from) => {
// You can add analytics tracking here
// console.log(`Navigated from ${from.path} to ${to.path}`)
// });

export default router;
