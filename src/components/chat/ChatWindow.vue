<template>
  <div class="flex-1 flex flex-col bg-chat">
    <!-- No Chat Selected -->
    <div v-if="!currentRoom" class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <ChatBubbleLeftRightIcon class="h-24 w-24 text-slate-600 mx-auto mb-4" />
        <h2 class="text-2xl font-semibold text-secondary-700 mb-2">Start a conversation</h2>
        <p class="text-secondary-500">Select a contact from the list to begin chatting</p>
      </div>
    </div>

    <!-- Chat Active -->
    <template v-else>
      <!-- Chat Header -->
      <div class="bg-white border-b border-secondary-200 px-6 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <Avatar
              :name="currentRoom.contact.NAME"
              :src="currentRoom.contact.picture_name"
              size="md"
              :status="isContactOnline ? 'online' : 'offline'"
              show-status
            />
            <div>
              <h3 class="font-semibold text-secondary-900">
                {{ currentRoom.contact.NAME }}
              </h3>
              <p class="text-sm text-secondary-600">
                #{{ currentRoom.contact.DRIVER_ID }}
                <span v-if="sessionId" class="ml-2">Session: {{ sessionId }}</span>
              </p>
            </div>
          </div>

          <button
            class="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
            @click="closeChatWindow"
          >
            <XMarkIcon class="h-6 w-6 text-secondary-600" />
          </button>
        </div>
      </div>

      <!-- Messages Container -->
      <div
        ref="messagesContainer"
        class="flex-1 overflow-y-auto custom-scrollbar messages-container px-6 py-4"
      >
        <!-- Loading Messages -->
        <div v-if="loadingMessages" class="flex items-center justify-center py-8">
          <LoadingSpinner size="md" text="Loading messages..." />
        </div>

        <!-- Messages -->
        <div v-else class="space-y-4">
          <MessageBubble
            v-for="message in currentMessages"
            :key="message.id"
            :message="message"
            :is-own="message.user_send === authStore.username"
          />
        </div>

        <!-- Typing Indicator -->
        <div v-if="isTyping" class="flex items-center gap-2 text-sm text-secondary-500 mt-4">
          <span class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </span>
          <span>{{ currentRoom.contact.NAME }} is typing...</span>
        </div>
      </div>

      <!-- Message Input -->
      <div class="bg-white border-t border-secondary-200 px-6 py-4">
        <div class="flex items-end gap-3">
          <!-- File Upload Button -->
          <button
            class="p-2 hover:bg-secondary-100 rounded-lg transition-colors flex-shrink-0"
            :disabled="sending"
            @click="handleFileClick"
          >
            <PaperClipIcon class="h-6 w-6 text-secondary-600" />
          </button>
          <input
            ref="fileInput"
            type="file"
            class="hidden"
            accept="image/*,.pdf"
            @change="handleFileSelect"
          />

          <!-- Message Input -->
          <div class="flex-1">
            <textarea
              v-model="messageText"
              rows="1"
              class="w-full px-4 py-2 border border-secondary-300 rounded-lg resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent custom-scrollbar"
              placeholder="Type your message..."
              :disabled="sending"
              @keydown.enter.exact.prevent="handleSend"
              @keydown.shift.enter.exact="handleNewLine"
              @input="handleTyping"
            ></textarea>
          </div>

          <!-- Send Button -->
          <button
            class="btn btn-primary px-6 flex-shrink-0"
            :disabled="!messageText.trim() || sending"
            @click="handleSend"
          >
            <PaperAirplaneIcon class="h-5 w-5" />
          </button>
        </div>

        <!-- Upload Progress -->
        <div v-if="uploading" class="mt-3">
          <div class="flex items-center justify-between text-sm text-secondary-600 mb-1">
            <span>Uploading file...</span>
            <span>{{ uploadProgress }}%</span>
          </div>
          <div class="w-full bg-secondary-200 rounded-full h-2">
            <div
              class="bg-primary-600 h-2 rounded-full transition-all duration-300"
              :style="{ width: uploadProgress + '%' }"
            ></div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '@/stores/auth';
import { useChatStore } from '@/stores/chat';
import { useContactsStore } from '@/stores/contacts';
import { useNotificationsStore } from '@/stores/notifications';
import socketService from '@/services/socket';
import { scrollToBottom, throttle } from '@/utils/helpers';
import config from '@/config';
import Avatar from '@/components/common/Avatar.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import MessageBubble from '@/components/chat/MessageBubble.vue';
import {
  ChatBubbleLeftRightIcon,
  XMarkIcon,
  PaperClipIcon,
  PaperAirplaneIcon,
} from '@heroicons/vue/24/outline';

const authStore = useAuthStore();
const chatStore = useChatStore();
const contactsStore = useContactsStore();
const notificationsStore = useNotificationsStore();

const { currentRoom, currentMessages, loadingMessages } = storeToRefs(chatStore);
const { isContactOnline } = contactsStore;

const messagesContainer = ref(null);
const fileInput = ref(null);
const messageText = ref('');
const sending = ref(false);
const uploading = ref(false);
const uploadProgress = ref(0);
const isTyping = ref(false);
const typingTimeout = ref(null);

const sessionId = computed(() => {
  return currentRoom.value?.id;
});

const isContactOnlineComputed = computed(() => {
  return currentRoom.value ? isContactOnline.value(currentRoom.value.contact.DRIVER_ID) : false;
});

// Watch for room changes
watch(currentRoom, (newRoom, oldRoom) => {
  if (newRoom?.id !== oldRoom?.id) {
    // Load draft message
    const draft = chatStore.getDraft(newRoom.id);
    messageText.value = draft;

    // Scroll to bottom
    nextTick(() => {
      scrollToBottom(messagesContainer.value);
    });
  }
});

// Watch for new messages
watch(
  () => currentMessages.value.length,
  () => {
    nextTick(() => {
      scrollToBottom(messagesContainer.value);
    });
  }
);

const handleSend = async () => {
  const text = messageText.value.trim();
  if (!text || sending.value) return;

  sending.value = true;

  try {
    await chatStore.sendMessage({
      session_id: currentRoom.value.id,
      user_send: authStore.username,
      user_receive: currentRoom.value.contact.DRIVER_ID,
      message: text,
      content: 'text',
    });

    // Clear input and draft
    messageText.value = '';
    chatStore.clearDraft(currentRoom.value.id);

    // Scroll to bottom
    nextTick(() => {
      scrollToBottom(messagesContainer.value);
    });
  } catch (error) {
    notificationsStore.showError('Failed to send message');
  } finally {
    sending.value = false;
  }
};

const handleNewLine = () => {
  messageText.value += '\n';
};

const handleTyping = throttle(() => {
  // Save draft
  if (currentRoom.value?.id) {
    chatStore.saveDraft(currentRoom.value.id, messageText.value);
  }

  // Send typing indicator
  if (messageText.value.trim()) {
    socketService.sendTyping({
      sessionId: currentRoom.value.id,
      username: authStore.username,
    });

    // Clear previous timeout
    if (typingTimeout.value) {
      clearTimeout(typingTimeout.value);
    }

    // Stop typing after 3 seconds
    typingTimeout.value = setTimeout(() => {
      socketService.stopTyping({
        sessionId: currentRoom.value.id,
        username: authStore.username,
      });
    }, 3000);
  }
}, 500);

const handleFileClick = () => {
  fileInput.value?.click();
};

const handleFileSelect = async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  // Validate file size
  if (file.size > config.chat.maxFileSize) {
    notificationsStore.showError('File size exceeds 10MB limit');
    return;
  }

  // Validate file type
  const isImage = config.chat.allowedImageTypes.includes(file.type);
  const isPdf = config.chat.allowedPdfTypes.includes(file.type);

  if (!isImage && !isPdf) {
    notificationsStore.showError('Only images and PDFs are allowed');
    return;
  }

  uploading.value = true;
  uploadProgress.value = 0;

  try {
    const result = await chatStore.uploadFile(file, (progressEvent) => {
      uploadProgress.value = Math.round((progressEvent.loaded * 100) / progressEvent.total);
    });

    if (result.success) {
      // Send file message
      await chatStore.sendMessage({
        session_id: currentRoom.value.id,
        user_send: authStore.username,
        user_receive: currentRoom.value.contact.DRIVER_ID,
        message: result.data.url,
        content: isImage ? 'image' : 'pdf',
      });

      notificationsStore.showSuccess('File uploaded successfully');
    } else {
      notificationsStore.showError('Failed to upload file');
    }
  } catch (error) {
    notificationsStore.showError('Failed to upload file');
  } finally {
    uploading.value = false;
    uploadProgress.value = 0;

    // Reset file input
    if (fileInput.value) {
      fileInput.value.value = '';
    }
  }
};

const closeChatWindow = () => {
  chatStore.leaveCurrentRoom();
};
</script>

<style scoped>
.typing-indicator {
  display: inline-flex;
  gap: 4px;
}

.typing-indicator span {
  display: inline-block;
  width: 6px;
  height: 6px;
  background-color: currentColor;
  border-radius: 50%;
  animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%,
  60%,
  100% {
    transform: translateY(0);
    opacity: 0.7;
  }
  30% {
    transform: translateY(-10px);
    opacity: 1;
  }
}

textarea {
  max-height: 120px;
}
</style>
