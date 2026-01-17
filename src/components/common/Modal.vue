<template>
  <teleport to="body">
    <transition name="modal">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 overflow-y-auto"
        @click.self="onBackdropClick"
      >
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity"></div>

        <!-- Modal -->
        <div class="flex min-h-screen items-center justify-center p-4">
          <div
            class="relative bg-white rounded-lg shadow-xl transform transition-all w-full"
            :class="sizeClass"
          >
            <!-- Header -->
            <div
              v-if="showHeader"
              class="flex items-center justify-between px-5 py-4 border-b border-secondary-200"
            >
              <h3 class="text-lg font-semibold text-secondary-900">
                <slot name="header">{{ title }}</slot>
              </h3>
              <button
                v-if="showClose"
                class="text-secondary-400 hover:text-secondary-600 transition-colors"
                @click="close"
              >
                <XMarkIcon class="h-6 w-6" />
              </button>
            </div>

            <!-- Body -->
            <div class="p-5">
              <slot></slot>
            </div>

            <!-- Footer -->
            <div
              v-if="showFooter"
              class="flex items-center justify-end gap-3 p-5 border-t border-secondary-200"
            >
              <slot name="footer">
                <button class="btn btn-secondary" @click="close">Cancel</button>
                <button class="btn btn-primary" @click="confirm">Confirm</button>
              </slot>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
import { computed } from 'vue';
import { XMarkIcon } from '@heroicons/vue/24/outline';

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  title: {
    type: String,
    default: '',
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg', 'xl', 'full'].includes(value),
  },
  showHeader: {
    type: Boolean,
    default: true,
  },
  showFooter: {
    type: Boolean,
    default: false,
  },
  showClose: {
    type: Boolean,
    default: true,
  },
  closeOnBackdrop: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(['update:modelValue', 'close', 'confirm']);

const sizeClass = computed(() => {
  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full mx-4',
  };
  return sizes[props.size];
});

const close = () => {
  emit('update:modelValue', false);
  emit('close');
};

const confirm = () => {
  emit('confirm');
};

const onBackdropClick = () => {
  if (props.closeOnBackdrop) {
    close();
  }
};
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .relative,
.modal-leave-active .relative {
  transition: transform 0.3s ease;
}

.modal-enter-from .relative,
.modal-leave-to .relative {
  transform: scale(0.9);
}
</style>
