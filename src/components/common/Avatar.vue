<template>
  <div class="relative inline-block">
    <div
      class="rounded-full overflow-hidden bg-secondary-200 flex items-center justify-center"
      :class="sizeClass"
    >
      <img
        v-if="src && !imageError"
        :src="src"
        :alt="alt"
        class="w-full h-full object-cover"
        @error="onImageError"
      />
      <img
        v-else-if="imageError"
        :src="defaultAvatar"
        :alt="alt"
        class="w-full h-full object-cover"
      />
      <span v-else class="font-medium text-secondary-600" :class="textSizeClass">
        {{ initials }}
      </span>
    </div>

    <!-- Status Indicator -->
    <span
      v-if="showStatus"
      class="absolute bottom-0 right-0 status-indicator"
      :class="statusClass"
    ></span>

    <!-- Badge -->
    <span v-if="badge" class="absolute -top-1 -right-1 badge badge-danger text-xs">
      {{ badge }}
    </span>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const defaultAvatar = '/images/user-avatar-black.png';

const props = defineProps({
  src: {
    type: String,
    default: defaultAvatar,
  },
  alt: {
    type: String,
    default: 'Avatar',
  },
  name: {
    type: String,
    default: '',
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['xs', 'sm', 'md', 'lg', 'xl'].includes(value),
  },
  status: {
    type: String,
    default: '',
    validator: (value) => ['', 'online', 'offline', 'busy'].includes(value),
  },
  showStatus: {
    type: Boolean,
    default: false,
  },
  badge: {
    type: [String, Number],
    default: '',
  },
});

const imageError = ref(false);

const sizeClass = computed(() => {
  const sizes = {
    xs: 'w-8 h-8',
    sm: 'w-10 h-10',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20',
  };
  return sizes[props.size];
});

const textSizeClass = computed(() => {
  const sizes = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  };
  return sizes[props.size];
});

const statusClass = computed(() => {
  const statuses = {
    online: 'status-online',
    offline: 'status-offline',
    busy: 'status-busy',
  };
  return statuses[props.status] || '';
});

const initials = computed(() => {
  if (!props.name) return '?';

  const parts = props.name.trim().split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return parts[0].substring(0, 2).toUpperCase();
});

const onImageError = () => {
  imageError.value = true;
};
</script>
