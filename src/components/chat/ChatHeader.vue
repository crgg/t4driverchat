<template>
  <header class="bg-white border-b border-secondary-200 px-3 md:px-6 py-3 md:py-4">
    <div class="flex items-center justify-between">
      <!-- Logo/Title -->
      <div class="flex items-center gap-2 md:gap-3">
        <ChatBubbleLeftRightIcon class="h-6 md:h-8 w-6 md:w-8 text-primary-600" />
        <h1 class="text-base md:text-xl font-semibold text-secondary-900 truncate">
          {{ config.app.name }}
        </h1>
      </div>

      <!-- User Info & Actions -->
      <div class="flex items-center gap-2 md:gap-4">
        <!-- Unread Count -->
        <button
          v-if="hasUnread"
          class="relative p-1.5 md:p-2 hover:bg-secondary-100 rounded-lg transition-colors"
          @click="showNotifications = true"
        >
          <BellIcon class="h-5 md:h-6 w-5 md:w-6 text-secondary-600" />
          <span
            class="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center"
          >
            {{ totalUnread > 99 ? '99+' : totalUnread }}
          </span>
        </button>

        <!-- User Menu -->
        <div class="relative">
          <button
            class="flex items-center gap-1 md:gap-2 p-1.5 md:p-2 hover:bg-secondary-100 rounded-lg transition-colors"
            @click="showUserMenu = !showUserMenu"
          >
            <Avatar
              :status="socketService.isConnected() ? 'online' : 'offline'"
              :name="currentUser?.name || currentUser?.username"
              :src="currentUser?.avatar"
              :show-status="false"
              size="sm"
            />
            <span
              class="hidden sm:block text-sm font-medium text-secondary-700 max-w-[120px] truncate"
            >
              {{ currentUser?.name || currentUser?.username }}
            </span>
            <ChevronDownIcon class="hidden sm:block h-4 w-4 text-secondary-600" />
          </button>

          <!-- Dropdown Menu -->
          <transition name="fade">
            <div
              v-if="showUserMenu"
              v-click-outside="() => (showUserMenu = false)"
              class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-secondary-200 py-1 z-10"
            >
              <button
                class="w-full text-left px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-100 flex items-center gap-2"
                @click="handleLogout"
              >
                <ArrowRightOnRectangleIcon class="h-4 w-4" />
                Logout
              </button>
            </div>
          </transition>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';

import { useAuthStore } from '@/stores/auth';
import { useChatStore } from '@/stores/chat';
import socketService from '@/services/socket';
import config from '@/config';
import Avatar from '@/components/common/Avatar.vue';
import {
  ChatBubbleLeftRightIcon,
  BellIcon,
  ChevronDownIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/vue/24/outline';

const router = useRouter();
const authStore = useAuthStore();
const chatStore = useChatStore();

const { currentUser } = storeToRefs(authStore);
const { hasUnread, totalUnread } = storeToRefs(chatStore);

const showUserMenu = ref(false);
const showNotifications = ref(false);

const handleLogout = async () => {
  await authStore.logout();
  router.push('/login');
};

// Click outside directive would need to be registered globally
// For now, we'll use a simple approach
const vClickOutside = {
  mounted(el, binding) {
    el.clickOutsideEvent = (event) => {
      if (!(el === event.target || el.contains(event.target))) {
        binding.value();
      }
    };
    document.addEventListener('click', el.clickOutsideEvent);
  },
  unmounted(el) {
    document.removeEventListener('click', el.clickOutsideEvent);
  },
};
</script>
