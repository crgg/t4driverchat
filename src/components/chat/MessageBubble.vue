<template>
  <div
    ref="messageRef"
    class="message-container flex gap-3 mb-4 group"
    :class="isOwn ? 'justify-end' : 'justify-start'"
  >
    <!-- Message Content -->
    <div class="flex flex-col max-w-[75%] sm:max-w-md lg:max-w-lg">
      <!-- Message Bubble -->
      <div
        class="message-bubble relative group/bubble"
        :class="[
          isOwn ? 'bubble-sent' : 'bubble-received',
          message.sending ? 'bubble-sending' : '',
          message.error ? 'bubble-error' : '',
          isEditing ? 'bubble-editing' : '',
        ]"
      >
        <!-- Edit/Delete Actions (only for last own message and text content) -->
        <div
          v-if="isOwn && isLastOwn && !message.sending"
          class="message-actions absolute left-0 top-1/2 -translate-y-1/2 -translate-x-14 flex items-center gap-2 opacity-0 group-hover/bubble:opacity-100 transition-opacity duration-200"
        >
          <button
            v-if="isTextMessage"
            class="p-1.5 rounded-full bg-white dark:bg-secondary-800 shadow-md hover:bg-primary-50 dark:hover:bg-primary-900 transition-colors duration-200"
            title="Edit message"
            @click="emit('edit', message)"
          >
            <PencilSquareIcon class="h-4 w-4 text-primary-600 dark:text-primary-400" />
          </button>
          <button
            class="p-1.5 rounded-full bg-white dark:bg-secondary-800 shadow-md hover:bg-red-50 dark:hover:bg-red-900 transition-colors duration-200"
            title="Delete message"
            @click="emit('delete', message)"
          >
            <TrashIcon class="h-4 w-4 text-red-600 dark:text-red-400" />
          </button>
        </div>
        <!-- Text Message -->
        <div v-if="isTextMessage" class="message-text">
          <p class="whitespace-pre-wrap break-words leading-relaxed">
            {{ message.message }}
          </p>
        </div>

        <!-- Image Message -->
        <div v-else-if="message.content === 'image'" class="message-media">
          <div class="relative group/image cursor-pointer" @click="handleImageClick">
            <img
              :src="message.message"
              alt="Image"
              class="rounded-xl w-40 object-cover object-top h-40 transition-transform duration-300 group-hover/image:scale-[1.02]"
              loading="lazy"
            />
            <div
              class="absolute inset-0 bg-black/0 group-hover/image:bg-black/10 transition-all duration-300 rounded-xl flex items-center justify-center"
            >
              <div
                class="opacity-0 group-hover/image:opacity-100 transition-opacity duration-300 bg-black/50 backdrop-blur-sm rounded-full p-3"
              >
                <MagnifyingGlassIcon class="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        <!-- PDF Message -->
        <div v-else-if="message.content === 'pdf'" class="message-file">
          <a
            :href="message.message"
            target="_blank"
            class="flex items-center gap-3 p-3 rounded-xl bg-white/50 hover:bg-white/80 transition-all duration-200 group/file"
          >
            <div
              class="flex-shrink-0 p-2 rounded-lg bg-red-100 group-hover/file:scale-110 transition-transform duration-200"
            >
              <DocumentIcon class="h-6 w-6 text-red-600" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-medium text-sm truncate text-secondary-900">PDF Document</p>
              <p class="text-xs text-secondary-500">Click to view</p>
            </div>
            <ArrowDownTrayIcon
              class="h-5 w-5 text-secondary-400 group-hover/file:text-primary-600 transition-colors duration-200"
            />
          </a>
        </div>

        <!-- Video Message -->
        <div v-else-if="message.content === 'video'" class="message-file">
          <a
            :href="message.message"
            target="_blank"
            class="flex items-center gap-3 p-3 rounded-xl bg-white/50 hover:bg-white/80 transition-all duration-200 group/file"
          >
            <div
              class="flex-shrink-0 p-2 rounded-lg bg-purple-100 group-hover/file:scale-110 transition-transform duration-200"
            >
              <VideoCameraIcon class="h-6 w-6 text-purple-600" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-medium text-sm truncate text-secondary-900">Video</p>
              <p class="text-xs text-secondary-500">Click to play</p>
            </div>
            <PlayIcon
              class="h-5 w-5 text-secondary-400 group-hover/file:text-primary-600 transition-colors duration-200"
            />
          </a>
        </div>

        <!-- Loading overlay -->
        <div
          v-if="message.sending"
          class="absolute inset-0 bg-white/50 backdrop-blur-[1px] rounded-2xl flex items-center justify-center"
        >
          <div class="flex items-center gap-2 text-secondary-600">
            <ArrowPathIcon class="h-4 w-4 animate-spin" />
            <span class="text-xs font-medium">Sending...</span>
          </div>
        </div>
      </div>

      <!-- Message Footer -->
      <div
        class="flex items-center gap-2 mt-1 px-1"
        :class="isOwn ? 'justify-end' : 'justify-start'"
      >
        <!-- Time -->
        <span class="text-xs text-secondary-500 font-medium">
          {{ formatTime(message.created_at) }}
        </span>

        <!-- Status indicators for own messages -->
        <div v-if="isOwn" class="flex items-center gap-1">
          <!-- Sending -->
          <div v-if="message.sending" class="flex items-center gap-1 text-secondary-400">
            <ArrowPathIcon class="h-3.5 w-3.5 animate-spin" />
            <span class="text-xs">Sending</span>
          </div>

          <!-- Error -->
          <div v-else-if="message.error" class="flex items-center gap-1 text-red-500">
            <ExclamationCircleIcon class="h-3.5 w-3.5" />
            <span class="text-xs">Failed</span>
          </div>

          <!-- Read (double check) -->
          <div v-else-if="message.read_at" class="flex items-center text-primary-600">
            <CheckIcon style="stroke-width: 3" class="h-3.5 w-3.5 -mr-1.5" />
            <CheckIcon style="stroke-width: 3" class="h-3.5 w-3.5" />
          </div>

          <!-- Delivered (single check) -->
          <div v-else class="flex items-center text-secondary-400">
            <CheckIcon style="stroke-width: 3" class="h-3.5 w-3.5" />
          </div>
        </div>
      </div>

      <!-- Reactions (placeholder for future feature) -->
      <div v-if="false" class="flex items-center gap-1 mt-1 px-1">
        <button class="reaction-btn">👍 2</button>
        <button class="reaction-btn">❤️ 1</button>
      </div>
    </div>
  </div>

  <!-- Image Preview Modal -->
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="showImagePreview"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
        @click="showImagePreview = false"
      >
        <div class="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center">
          <!-- Close button -->
          <button
            class="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-colors duration-200 z-10"
            @click.stop="showImagePreview = false"
          >
            <XMarkIcon class="h-6 w-6 text-white" />
          </button>

          <!-- Image -->
          <img
            :src="message.message"
            alt="Image Preview"
            class="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            @click.stop
          />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import moment from 'moment';
import gsap from 'gsap';

import {
  DocumentIcon,
  VideoCameraIcon,
  CheckIcon,
  ArrowPathIcon,
  ExclamationCircleIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ArrowDownTrayIcon,
  PlayIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/vue/24/outline';

const props = defineProps({
  message: {
    type: Object,
    required: true,
  },
  isOwn: {
    type: Boolean,
    default: false,
  },
  isLastOwn: {
    type: Boolean,
    default: false,
  },
  isEditing: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['edit', 'delete']);

const messageRef = ref(null);
const showImagePreview = ref(false);

const isTextMessage = computed(() => {
  return !props.message.content || props.message.content === 'text';
});

const formatTime = (time) => {
  if (!time) return '';
  const messageTime = moment(time);
  const now = moment();

  if (now.diff(messageTime, 'hours') < 24) {
    return messageTime.format('HH:mm');
  } else if (now.diff(messageTime, 'days') < 7) {
    return messageTime.format('ddd HH:mm');
  } else {
    return messageTime.format('MMM DD, HH:mm');
  }
};

const handleImageClick = () => {
  showImagePreview.value = true;
};

onMounted(async () => {
  await nextTick();

  if (!messageRef.value) return;

  // Staggered animation for message elements
  const bubble = messageRef.value.querySelector('.message-bubble');

  if (props.isOwn) {
    // Slide in from right for sent messages
    gsap.from(bubble, {
      duration: 0.4,
      x: 50,
      opacity: 0,
      scale: 0.95,
      ease: 'power2.out',
    });
  } else {
    // Slide in from left for received messages
    gsap.from(bubble, {
      duration: 0.4,
      x: -50,
      opacity: 0,
      scale: 0.95,
      ease: 'power2.out',
    });
  }

  // Subtle bounce effect for text content
  const textContent = bubble.querySelector('.message-text, .message-media, .message-file');
  if (textContent) {
    gsap.from(textContent, {
      duration: 0.3,
      scale: 0.98,
      ease: 'back.out(2)',
      delay: 0.15,
    });
  }
});
</script>

<style scoped>
/* Message Bubble Styles */
.message-bubble {
  @apply relative rounded-2xl transition-all duration-300;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.bubble-sent {
  /* #dafbea */
  @apply bg-[#dafbea] text-slate-800 shadow text-sm;
}

/* .bubble-sent:hover {
  @apply shadow-xl bg-white;
} */

.bubble-received {
  @apply bg-white text-slate-800 shadow text-sm;
}

/* .bubble-received:hover {
  @apply shadow-lg border-secondary-200 dark:border-secondary-600;
} */

.bubble-sending {
  @apply opacity-70;
}

.bubble-error {
  @apply border-2 border-red-300 dark:border-red-700;
}

.bubble-editing {
  @apply ring-2 ring-yellow-400 dark:ring-yellow-500;
}

/* Message Content */
.message-text {
  @apply px-4 py-3;
}

.message-media {
  @apply p-1;
}

.message-file {
  @apply p-2;
}

/* Reaction Button */
.reaction-btn {
  @apply px-2 py-1 text-xs rounded-full bg-secondary-100 dark:bg-secondary-700 hover:bg-secondary-200 dark:hover:bg-secondary-600 transition-colors duration-200;
}

/* Modal Transitions */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

/* Smooth appearance animation */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-container {
  animation: slideIn 0.3s ease-out;
}

/* Hover effects for interactive elements */
.message-bubble a {
  @apply transition-colors duration-200;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .message-container {
    @apply gap-2;
  }

  .message-text {
    @apply px-3 py-2.5;
  }
}
</style>
