<template>
  <div
    class="flex-1 flex flex-col bg-chat border border-l-0 border-secondary-200 sm:rounded-e-3xl overflow-hidden"
  >
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
      <div class="bg-white border-b border-secondary-200 pr-2 md:px-6 py-3 md:py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
            <!-- Back Button (Mobile Only) -->
            <button
              class="md:hidden p-2 hover:bg-secondary-100 rounded-lg transition-colors flex-shrink-0"
              @click="handleBackToContacts"
            >
              <ChevronLeftIcon class="h-6 w-6 text-secondary-600" />
            </button>
            <Avatar
              :name="currentRoom.contact.NAME"
              :src="currentRoom.contact.picture_name"
              size="md"
              :status="isContactOnline ? 'online' : 'offline'"
              show-status
              class="flex-shrink-0"
            />
            <div class="min-w-0 flex-1">
              <h3 class="font-semibold text-secondary-900 truncate text-sm md:text-base">
                {{ currentRoom.contact.NAME }}
              </h3>
              <p class="text-xs md:text-sm text-secondary-600 truncate">
                #{{ currentRoom.contact.DRIVER_ID }}
                <span v-if="sessionId" class="hidden sm:inline ml-2">Session: {{ sessionId }}</span>
              </p>
            </div>
          </div>

          <div class="flex gap-2 items-center">
            <button
              class="p-2 bg-primary-50 hover:bg-primary-100 rounded-full transition-colors flex-shrink-0"
              @click="showDriverInformation = true"
            >
              <InformationCircleIcon class="h-6 w-6 text-primary-600" />
            </button>
            <button
              class="hidden md:block p-2 hover:bg-secondary-100 rounded-full transition-colors flex-shrink-0"
              @click="closeChatWindow"
            >
              <XMarkIcon class="h-6 w-6 text-secondary-600" />
            </button>
          </div>
        </div>
      </div>

      <!-- Messages Container -->
      <div
        ref="messagesContainer"
        class="flex-1 overflow-y-auto custom-scrollbar messages-container px-3 md:px-6 py-3 md:py-4"
      >
        <!-- Loading Messages (Initial Load) -->
        <div
          v-if="loadingMessages && currentMessages.length === 0"
          class="flex items-center justify-center py-8"
        >
          <LoadingSpinner size="md" text="Loading messages..." />
        </div>

        <!-- Messages -->
        <div v-else class="space-y-2">
          <!-- Loading More Messages Indicator (Top) -->
          <div
            v-if="loadingMessages && currentMessages.length > 0"
            class="flex items-center justify-center py-4"
          >
            <LoadingSpinner size="sm" text="Loading more messages..." />
          </div>

          <MessageBubble
            v-for="(message, index) in currentMessages"
            :key="message.id"
            :message="message"
            :is-own="message.user === authStore.user?.username"
            :is-last-own="isLastOwnMessage(index)"
            :is-editing="editingMessage?.id === message.id"
            @edit="handleEditMessage"
            @delete="handleDeleteMessage"
          />
          <!-- :is-online="isContactOnline" -->
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
      <div class="bg-white border-t border-secondary-200 px-3 md:px-6 py-3 md:py-4">
        <div class="flex items-end gap-2 md:gap-3">
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
          <div class="flex-1 flex flex-col justify-end">
            <div
              v-if="editingMessage"
              class="mb-2 flex items-center gap-2 text-sm text-secondary-600"
            >
              <span class="font-medium">Editing message</span>
              <button class="text-red-500 hover:text-red-700" @click="cancelEdit">Cancel</button>
            </div>
            <textarea
              ref="textareaRef"
              v-model="messageText"
              rows="1"
              class="w-full px-4 py-2 border border-secondary-300 rounded-lg resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent custom-scrollbar"
              :placeholder="editingMessage ? 'Edit your message...' : 'Type your message...'"
              :disabled="sending"
              @keydown.enter.exact.prevent="editingMessage ? handleUpdateMessage() : handleSend()"
              @keydown.esc="cancelEdit"
              @input="handleTyping"
            ></textarea>
          </div>

          <!-- Send/Update Button -->
          <button
            v-if="!editingMessage"
            class="btn btn-primary w-12 p-0 h-12 flex-shrink-0 rounded-full flex items-center justify-center"
            :disabled="!messageText.trim() || sending"
            @click="handleSend"
          >
            <PaperAirplaneIcon class="h-5 w-5" />
          </button>
          <button
            v-else
            class="btn btn-primary w-12 p-0 h-12 flex-shrink-0 rounded-full flex items-center justify-center"
            :disabled="!messageText.trim() || sending"
            @click="handleUpdateMessage"
          >
            <PencilIcon class="h-5 w-5" />
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
    <Modal v-model="showDriverInformation" title="Driver Information" size="xl">
      <DriverInformationModal />
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, useTemplateRef, onMounted, onUnmounted } from 'vue';
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

import Modal from '@/components/common/Modal.vue';
import DriverInformationModal from '@/components/chat/DriverInformationModal.vue';

import {
  ChatBubbleLeftRightIcon,
  XMarkIcon,
  PaperClipIcon,
  PaperAirplaneIcon,
  PencilIcon,
  ChevronLeftIcon,
  InformationCircleIcon,
} from '@heroicons/vue/24/outline';
import { INITIAL_STATE } from '@/components/chat/constants';

// Emit for mobile navigation
const emit = defineEmits(['close-chat']);

const authStore = useAuthStore();
const chatStore = useChatStore();
const contactsStore = useContactsStore();
const notificationsStore = useNotificationsStore();

const { currentRoom, currentMessages, loadingMessages } = storeToRefs(chatStore);
const { isContactOnline } = contactsStore;

const showDriverInformation = ref(INITIAL_STATE.modal.driverInformation);
const messagesContainer = ref(null);
const textareaRef = useTemplateRef('textareaRef');
const fileInput = ref(null);
const messageText = ref('');
const sending = ref(false);
const uploading = ref(false);
const uploadProgress = ref(0);
// const isTyping = ref(false);
const typingTimeout = ref(null);
const editingMessage = ref(null);

// Infinite scroll state
const infiniteScrollLimit = ref(50);
const infiniteScrollOffset = ref(0);
const thereMoreMessages = ref(true);
const endChat = ref(true);
const newMessage = ref(false);
const indexDriverLastMessage = ref(-1);

const sessionId = computed(() => currentRoom.value?.id);
const isTyping = computed(() =>
  chatStore.isUserTyping(currentRoom.value?.id, authStore.user?.username)
);

watch(messageText, () => adjustTextareaHeight(textareaRef.value));

// Watch for room changes
watch(currentRoom, async (newRoom, oldRoom) => {
  if (newRoom?.id !== oldRoom?.id) {
    if (!newRoom) {
      if (messagesContainer.value) {
        messagesContainer.value.removeEventListener('scroll', handleScroll);
      }
      return;
    }

    resetInfiniteScroll();

    const draft = chatStore.getDraft(newRoom.id);
    messageText.value = draft;

    await nextTick();

    if (messagesContainer.value) {
      messagesContainer.value.addEventListener('scroll', handleScroll);
    } else {
      console.warn('messagesContainer not available');
    }

    await nextTick();
    nextData(0);

    nextTick(() => {
      scrollToBottom(messagesContainer.value);
    });
  }
});

watch(
  () => currentMessages.value.length,
  () => {
    nextTick(() => {
      if (endChat.value) {
        scrollToBottom(messagesContainer.value);
      }
      updateDriverLastMessageIndex();
    });
  }
);

watch(
  currentMessages,
  () => {
    updateDriverLastMessageIndex();
  },
  { deep: true }
);

const messagesLengthBeforeLoad = ref(0);
const savedScrollHeight = ref(0);

watch(loadingMessages, async (isLoading, wasLoading) => {
  if (wasLoading && !isLoading) {
    await nextTick();

    const currentLength = currentMessages.value.length;
    const messagesAdded = currentLength > messagesLengthBeforeLoad.value;

    if (!messagesAdded && messagesLengthBeforeLoad.value > 0) {
      thereMoreMessages.value = false;
    }

    if (savedScrollHeight.value > 0 && messagesContainer.value && messagesAdded) {
      const oldScrollHeight = savedScrollHeight.value;
      const newScrollHeight = messagesContainer.value.scrollHeight;
      const heightDifference = newScrollHeight - oldScrollHeight;

      messagesContainer.value.scrollTop = heightDifference;

      savedScrollHeight.value = 0;
    } else if (messagesLengthBeforeLoad.value === 0) {
      scrollToBottom(messagesContainer.value);
    }

    messagesLengthBeforeLoad.value = 0;
  } else if (!wasLoading && isLoading) {
    messagesLengthBeforeLoad.value = currentMessages.value.length;
    if (messagesContainer.value) {
      savedScrollHeight.value = messagesContainer.value.scrollHeight;
    }
  }
});

const handleSend = async () => {
  const text = messageText.value.trim();
  if (!text || sending.value || !currentRoom.value) return;

  sending.value = true;

  try {
    const newMessagePayload = {
      session_id: currentRoom.value.id,
      type: 1,
      message: text,
      where: 'web',
      driver: currentRoom.value.contact.DRIVER_ID,
      user: authStore.user?.username || authStore.username,
      trip: currentRoom.value.contact.CURRENT_TRIP || '',
      content: 'text',
      uuid: crypto.randomUUID(),
    };

    await chatStore.sendMessage(newMessagePayload);

    messageText.value = '';
    chatStore.clearDraft(currentRoom.value.id);

    nextTick(() => {
      scrollToBottom(messagesContainer.value);
    });
  } catch (error) {
    notificationsStore.showError('Failed to send message');
  } finally {
    sending.value = false;
  }
};

const handleTyping = throttle(() => {
  if (currentRoom.value?.id) {
    chatStore.saveDraft(currentRoom.value.id, messageText.value);
  }

  if (messageText.value.trim()) {
    socketService.sendTyping({
      session_id: currentRoom.value.id,
      user: authStore.username,
      from: 'WEB',
    });

    if (typingTimeout.value) {
      clearTimeout(typingTimeout.value);
    }

    typingTimeout.value = setTimeout(() => {
      socketService.stopTyping({
        session_id: currentRoom.value.id,
        user: authStore.username,
        from: 'WEB',
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

  if (file.size > config.chat.maxFileSize) {
    notificationsStore.showError('File size exceeds 10MB limit');
    return;
  }

  const isImage = config.chat.allowedImageTypes.includes(file.type);
  const isPdf = config.chat.allowedPdfTypes.includes(file.type);

  if (!isImage && !isPdf) {
    notificationsStore.showError('Only images and PDFs are allowed');
    return;
  }

  uploading.value = true;
  uploadProgress.value = 0;

  try {
    const socketServerUrl =
      document.querySelector('meta[name="MIX_URL_CHAT_SERVER"]')?.content || config.socket.url;
    const uploadUrl = `${socketServerUrl}/upload-file`;

    const formData = new FormData();
    formData.append('content', isImage ? 'image' : 'pdf');
    formData.append('driver', currentRoom.value.contact.DRIVER_ID);
    formData.append('session_id', currentRoom.value.id);
    formData.append('where', 'WEB');
    formData.append('user', authStore.user.username);
    formData.append('trip', currentRoom.value.contact.CURRENT_TRIP || '');
    formData.append('image', file);
    formData.append('token', authStore.token || '');

    const axios = (await import('axios')).default;
    await axios.post(uploadUrl, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        uploadProgress.value = Math.round((progressEvent.loaded * 100) / progressEvent.total);
      },
    });

    notificationsStore.showSuccess('File uploaded successfully');
  } catch (error) {
    console.error('Upload error:', error);
    if (error.response?.status === 413) {
      notificationsStore.showError('File too large');
    } else {
      notificationsStore.showError('Failed to upload file');
    }
  } finally {
    uploading.value = false;
    uploadProgress.value = 0;

    if (fileInput.value) {
      fileInput.value.value = '';
    }
  }
};

const closeChatWindow = () => {
  chatStore.leaveCurrentRoom();
  emit('close-chat');
};

const handleBackToContacts = () => {
  emit('close-chat');
};

const isLastOwnMessage = (index) => {
  const username = authStore.user?.username;
  for (let i = currentMessages.value.length - 1; i >= 0; i--) {
    if (currentMessages.value[i].user === username) {
      return i === index;
    }
  }
  return false;
};

const handleEditMessage = (message) => {
  editingMessage.value = message;
  messageText.value = message.message;

  nextTick(() => {
    const textarea = textareaRef.value;
    if (textarea) {
      textarea.focus();
      textarea.setSelectionRange(messageText.value.length, messageText.value.length);
      adjustTextareaHeight(textarea);
    }
  });
};

const handleUpdateMessage = async () => {
  if (!messageText.value.trim() || !editingMessage.value) return;

  try {
    socketService.updateMessage({
      messageId: editingMessage.value.id,
      newText: messageText.value.trim(),
    });

    // Update locally
    const index = currentMessages.value.findIndex((m) => m.id === editingMessage.value.id);
    if (index !== -1) {
      currentMessages.value[index].message = messageText.value.trim();
    }

    messageText.value = '';
    editingMessage.value = null;

    notificationsStore.showSuccess('Message updated');
  } catch (error) {
    notificationsStore.showError('Failed to update message');
  }
};

const cancelEdit = () => {
  editingMessage.value = null;
  messageText.value = '';
  nextTick(() => {
    adjustTextareaHeight(textareaRef.value);
  });
};

const handleDeleteMessage = async (message) => {
  try {
    const confirm = await notificationsStore.showConfirm(
      'Are you sure you want to delete this message?',
      'Delete Message'
    );

    if (!confirm) return;

    socketService.destroyMessage({
      messageId: message.id,
      sessionId: message.session_id,
      withLastMessage: true,
      from: authStore.user.username,
      to: currentRoom.value.contact.DRIVER_ID,
    });

    // Remove locally
    const index = currentMessages.value.findIndex((m) => m.id === message.id);
    if (index !== -1) {
      currentMessages.value.splice(index, 1);
    }

    notificationsStore.showSuccess('Message deleted');
  } catch (error) {
    notificationsStore.showError('Failed to delete message');
  }
};

const adjustTextareaHeight = (textarea) => {
  if (!textarea) return;
  textarea.style.height = INITIAL_STATE.textarea.minHeight + 'px';

  const scrollHeight = textarea.scrollHeight;
  const maxHeight = parseInt(getComputedStyle(textarea).maxHeight);
  const newHeight = Math.min(scrollHeight, maxHeight);

  if (newHeight <= INITIAL_STATE.textarea.minHeight) {
    textarea.style.height = INITIAL_STATE.textarea.minHeight + 'px';
  } else {
    textarea.style.height = newHeight + 'px';
  }
};

// Infinite scroll functions
const resetInfiniteScroll = () => {
  infiniteScrollOffset.value = 1;
  thereMoreMessages.value = true;
  endChat.value = true;
  newMessage.value = false;
  indexDriverLastMessage.value = -1;
  messagesLengthBeforeLoad.value = 0;
  savedScrollHeight.value = 0;
};

const updateDriverLastMessageIndex = () => {
  indexDriverLastMessage.value = -1;
  const driverId = currentRoom.value?.contact?.DRIVER_ID;
  if (!driverId) return;

  for (let i = currentMessages.value.length - 1; i >= 0; i--) {
    const currMessage = currentMessages.value[i];
    if (currMessage.user === driverId) {
      indexDriverLastMessage.value = i;
      break;
    }
  }
};

const nextData = (offset = infiniteScrollOffset.value) => {
  if (!thereMoreMessages.value) {
    console.info('No more messages to load ✔');
    return;
  }
  if (!currentRoom.value?.id) {
    console.info('No current room');
    return;
  }
  if (loadingMessages.value) {
    console.info('Already loading messages');
    return;
  }

  if (!socketService.isConnected()) {
    console.error('Socket not connected, cannot load messages');
    notificationsStore.showError('Connection lost. Please refresh the page.');
    return;
  }

  try {
    infiniteScrollOffset.value = offset + 1;

    chatStore.loadMessages(currentRoom.value.id, offset, infiniteScrollLimit.value);
  } catch (error) {
    console.error('Error loading messages:', error);
    notificationsStore.showError('Failed to load messages');
    infiniteScrollOffset.value = offset;
    loadingMessages.value = false;
  }
};

const handleScroll = async (event) => {
  const scrollMessageRef = messagesContainer.value;
  await nextTick();

  if (loadingMessages.value) return;

  const scrollTop = event.target.scrollTop;
  const scrollThreshold = 50;

  if (scrollTop <= scrollThreshold && thereMoreMessages.value) {
    endChat.value = false;

    if (scrollMessageRef) {
      savedScrollHeight.value = scrollMessageRef.scrollHeight;
    }

    nextData(infiniteScrollOffset.value);
  }

  if (scrollMessageRef) {
    const scrollBottom = scrollMessageRef.scrollHeight - scrollMessageRef.clientHeight;
    if (scrollTop >= scrollBottom - 10) {
      if (indexDriverLastMessage.value !== -1) {
        const isLastMessageDriverMarkAsRead = !!(
          currentMessages.value[indexDriverLastMessage.value] &&
          currentMessages.value[indexDriverLastMessage.value].read_at
        );
        if (!isLastMessageDriverMarkAsRead) {
          socketService.readMessage({
            sessionId: currentRoom.value.id,
            username: authStore.user?.username || authStore.username,
          });
        }
      }
      endChat.value = true;
      newMessage.value = false;
    }
  }
};

const handleHistoryMessages = (historyMessages = []) => {
  const filteredMessages = historyMessages.filter(
    (msg) => msg.session_id === currentRoom.value?.id
  );

  if (filteredMessages.length === 0 && currentRoom.value?.id) {
    thereMoreMessages.value = false;
  }
};

onMounted(() => {
  socketService.on('history-messages', handleHistoryMessages);

  nextTick(() => {
    if (messagesContainer.value && currentRoom.value) {
      messagesContainer.value.addEventListener('scroll', handleScroll);
    }
  });
});

onUnmounted(() => {
  if (messagesContainer.value) {
    messagesContainer.value.removeEventListener('scroll', handleScroll);
  }

  socketService.off('history-messages', handleHistoryMessages);
});
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
  max-height: 300px;
}
</style>
