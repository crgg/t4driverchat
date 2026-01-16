<template>
  <teleport to="body">
    <div class="fixed top-4 right-4 z-50 space-y-2">
      <transition-group name="toast">
        <div
          v-for="notification in notifications"
          :key="notification.id"
          class="card px-4 py-3 shadow-lg max-w-sm"
          :class="typeClass(notification.type)"
        >
          <div class="flex items-start gap-3">
            <component
              :is="iconComponent(notification.type)"
              class="h-5 w-5 flex-shrink-0 mt-0.5"
            />
            <div class="flex-1 min-w-0">
              <p v-if="notification.title" class="font-semibold text-sm">
                {{ notification.title }}
              </p>
              <p class="text-sm">
                {{ notification.message }}
              </p>
            </div>
            <button
              class="flex-shrink-0 text-secondary-400 hover:text-secondary-600"
              @click="removeNotification(notification.id)"
            >
              <XMarkIcon class="h-5 w-5" />
            </button>
          </div>
        </div>
      </transition-group>
    </div>
  </teleport>
</template>

<script setup>
import { storeToRefs } from 'pinia';
import { useNotificationsStore } from '@/stores/notifications';
import {
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
} from '@heroicons/vue/24/outline';

const notificationsStore = useNotificationsStore();
const { notifications } = storeToRefs(notificationsStore);
const { removeNotification } = notificationsStore;

const typeClass = (type) => {
  const classes = {
    success: 'bg-green-50 text-green-800 border-l-4 border-green-500',
    error: 'bg-red-50 text-red-800 border-l-4 border-red-500',
    warning: 'bg-yellow-50 text-yellow-800 border-l-4 border-yellow-500',
    info: 'bg-blue-50 text-blue-800 border-l-4 border-blue-500',
  };
  return classes[type] || classes.info;
};

const iconComponent = (type) => {
  const icons = {
    success: CheckCircleIcon,
    error: XCircleIcon,
    warning: ExclamationTriangleIcon,
    info: InformationCircleIcon,
  };
  return icons[type] || icons.info;
};
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.toast-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

.toast-move {
  transition: transform 0.3s ease;
}
</style>
