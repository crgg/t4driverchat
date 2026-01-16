<template>
  <div class="flex" :class="isOwn ? 'justify-end' : 'justify-start'">
    <div class="max-w-lg">
      <!-- Message Bubble -->
      <div class="chat-bubble" :class="isOwn ? 'chat-bubble-sent' : 'chat-bubble-received'">
        <!-- Text Message -->
        <p v-if="message.content === 'text'" class="whitespace-pre-wrap break-words">
          {{ message.message }}
        </p>

        <!-- Image Message -->
        <div v-else-if="message.content === 'image'" class="space-y-2">
          <img
            :src="message.message"
            alt="Image"
            class="rounded-lg cursor-pointer max-w-sm"
            @click="handleImageClick"
          />
        </div>

        <!-- PDF Message -->
        <div v-else-if="message.content === 'pdf'" class="flex items-center gap-2">
          <DocumentIcon class="h-8 w-8 flex-shrink-0" />
          <div class="flex-1 min-w-0">
            <p class="font-medium truncate">PDF Document</p>
            <a :href="message.message" target="_blank" class="text-sm underline hover:no-underline">
              View PDF
            </a>
          </div>
        </div>

        <!-- Video Message -->
        <div v-else-if="message.content === 'video'" class="flex items-center gap-2">
          <VideoCameraIcon class="h-8 w-8 flex-shrink-0" />
          <div class="flex-1 min-w-0">
            <p class="font-medium truncate">Video</p>
            <a :href="message.message" target="_blank" class="text-sm underline hover:no-underline">
              View Video
            </a>
          </div>
        </div>
      </div>

      <!-- Message Info -->
      <div
        class="flex items-center gap-2 mt-1 px-2"
        :class="isOwn ? 'justify-end' : 'justify-start'"
      >
        <span class="text-xs text-secondary-500">
          {{ formatTime(message.created_at) }}
        </span>

        <!-- Sending indicator -->
        <span v-if="message.sending" class="text-xs text-secondary-400">
          <ArrowPathIcon class="h-3 w-3 inline animate-spin" />
        </span>

        <!-- Read status for own messages -->
        <CheckIcon v-else-if="isOwn && message.read" class="h-4 w-4 text-primary-600" />
      </div>
    </div>
  </div>

  <!-- Image Preview Modal -->
  <Modal v-model="showImagePreview" size="xl" :show-header="false" :show-footer="false">
    <img :src="message.message" alt="Image Preview" class="w-full rounded-lg" />
  </Modal>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import moment from 'moment';
import gsap from 'gsap';
import Modal from '@/components/common/Modal.vue';
import { DocumentIcon, VideoCameraIcon, CheckIcon, ArrowPathIcon } from '@heroicons/vue/24/outline';

const props = defineProps({
  message: {
    type: Object,
    required: true,
  },
  isOwn: {
    type: Boolean,
    default: false,
  },
});

const showImagePreview = ref(false);

const formatTime = (time) => {
  return moment(time).format('HH:mm');
};

const handleImageClick = () => {
  showImagePreview.value = true;
};

onMounted(() => {
  // Animate message on mount
  gsap.from('.chat-bubble', {
    duration: 0.3,
    scale: 0.8,
    opacity: 0,
    ease: 'back.out(1.7)',
  });
});
</script>
