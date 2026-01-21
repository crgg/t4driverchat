<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      @click.self="close"
    >
      <div class="relative max-w-7xl max-h-[90vh] bg-white rounded-lg shadow-2xl">
        <button
          class="absolute -top-3 -right-3 w-10 h-10 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors z-10"
          @click="close"
        >
          <XMarkIcon class="h-6 w-6" />
        </button>
        <div class="p-4">
          <img
            :src="imageUrl"
            :alt="filename"
            class="max-w-full max-h-[85vh] object-contain mx-auto"
            @load="onImageLoad"
          />
        </div>
        <div v-if="filename" class="px-4 pb-3 text-center text-sm text-secondary-600">
          {{ filename }}
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { XMarkIcon } from '@heroicons/vue/24/outline';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  filename: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['update:modelValue']);

const close = () => {
  emit('update:modelValue', false);
};

const onImageLoad = (event) => {
  console.log('Props', props);
  console.log('Image loaded:', event.target.naturalWidth, 'x', event.target.naturalHeight);
};
</script>
