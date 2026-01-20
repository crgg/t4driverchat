<template>
  <header class="bg-[#f6f8fa] border-b border-secondary-300 px-3 md:px-6 py-3 md:py-4">
    <div class="flex items-center justify-between">
      <!-- Logo/Title -->
      <div class="flex items-center gap-2 md:gap-3"></div>

      <!-- User Info & Actions -->
      <div class="flex items-center gap-2 md:gap-4">
        <!-- User Menu -->
        <div class="relative">
          <button
            class="flex items-center gap-1 md:gap-2 p-1.5 md:p-2 hover:bg-secondary-100 rounded-lg transition-colors"
            @click="showUserMenu = !showUserMenu"
          >
            <span
              class="hidden sm:block text-sm font-medium text-secondary-700 max-w-[120px] truncate"
            >
              {{ currentUser?.name || currentUser?.username }}
            </span>
            <Avatar
              :status="socketService.isConnected() ? 'online' : 'offline'"
              :name="currentUser?.name || currentUser?.username"
              :src="currentUser?.avatar"
              :show-status="false"
              size="xs"
            />
            <ChevronDownIcon class="hidden sm:block h-4 w-4 text-secondary-600" />
          </button>

          <!-- Dropdown Menu -->
          <transition name="fade">
            <!-- v-click-outside="() => showUserMenu && (showUserMenu = false)" -->
            <div
              v-if="showUserMenu"
              class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-secondary-200 py-1 z-50"
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
import { ChevronDownIcon, ArrowRightOnRectangleIcon } from '@heroicons/vue/24/outline';

import { useAuthStore } from '@/stores/auth';
import socketService from '@/services/socket';
import Avatar from '@/components/common/Avatar.vue';

const router = useRouter();
const authStore = useAuthStore();

const { currentUser } = storeToRefs(authStore);

const showUserMenu = ref(false);

const handleLogout = async () => {
  await authStore.logout();
  router.push('/login');
};

// Click outside directive would need to be registered globally
// For now, we'll use a simple approach
// const vClickOutside = {
//   mounted(el, binding) {
//     el.clickOutsideEvent = (event) => {
//       if (!(el === event.target || el.contains(event.target))) {
//         binding.value();
//       }
//     };
//     document.addEventListener('click', el.clickOutsideEvent);
//   },
//   unmounted(el) {
//     document.removeEventListener('click', el.clickOutsideEvent);
//   },
// };
</script>
