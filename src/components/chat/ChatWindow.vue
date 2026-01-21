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
            multiple
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
            <div
              :class="[
                'w-full px-4 py-2 border border-secondary-300 rounded-lg',
                thumbnailsFiles.length > 0 ? 'rounded-b-none border-b-0' : '',
              ]"
            >
              <textarea
                ref="textareaRef"
                v-model="messageText"
                rows="1"
                class="w-full resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent custom-scrollbar bg-transparent outline-none"
                :placeholder="editingMessage ? 'Edit your message...' : 'Type your message...'"
                :disabled="sending"
                @keydown.enter.exact.prevent="editingMessage ? handleUpdateMessage() : handleSend()"
                @keydown.esc="cancelEdit"
                @input="handleTyping"
              ></textarea>
            </div>

            <!-- File Preview -->
            <div
              v-if="thumbnailsFiles.length > 0"
              class="w-full bg-white border border-secondary-300 border-t-0 rounded-b-lg p-2"
            >
              <div class="flex gap-2 flex-wrap">
                <div
                  v-for="thumbnail in thumbnailsFiles"
                  :key="thumbnail.id"
                  class="relative group"
                >
                  <div
                    class="w-24 h-24 rounded-lg border border-secondary-200 bg-secondary-50 relative"
                  >
                    <button
                      type="button"
                      class="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      @click="removeThumbnail(thumbnail)"
                    >
                      <XMarkIcon class="h-4 w-4" />
                    </button>
                    <img
                      v-if="thumbnail.type !== 'application/pdf'"
                      :src="thumbnail.src"
                      :alt="thumbnail.name"
                      class="w-full h-full object-cover cursor-pointer rounded-lg"
                      @click="previewImage(thumbnail.src, thumbnail.name)"
                    />
                    <PdfThumbnail
                      v-else
                      :pdf-url="thumbnail.src"
                      :filename="thumbnail.name"
                      :thumbnail-size="96"
                      class="w-full h-full"
                      @click="previewPdf(thumbnail.src, thumbnail.name)"
                    />
                  </div>
                  <p class="text-xs text-secondary-600 mt-1 truncate w-24" :title="thumbnail.name">
                    {{ thumbnail.name }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Send/Update Button -->
          <button
            v-if="!editingMessage"
            class="btn btn-primary w-12 p-0 h-12 flex-shrink-0 rounded-full flex items-center justify-center"
            :disabled="
              (!messageText.trim() && thumbnailsFiles.length === 0) || sending || uploading
            "
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

    <!-- Image Preview Modal -->
    <ImagePreview
      v-model="showImagePreview"
      :image-url="previewImageUrl"
      :filename="previewFilename"
    />

    <!-- PDF Preview Modal -->
    <PdfPreview
      v-model="showPdfPreview"
      :pdf-url="previewPdfUrl"
      :filename="previewFilename"
      :is-base64="true"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, useTemplateRef, onMounted, onUnmounted } from 'vue';
import { storeToRefs } from 'pinia';
import {
  ChatBubbleLeftRightIcon,
  XMarkIcon,
  PaperClipIcon,
  PaperAirplaneIcon,
  PencilIcon,
  ChevronLeftIcon,
  InformationCircleIcon,
} from '@heroicons/vue/24/outline';

import DriverInformationModal from '@/components/chat/DriverInformationModal.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import MessageBubble from '@/components/chat/MessageBubble.vue';
import PdfThumbnail from '@/components/common/PdfThumbnail.vue';
import Avatar from '@/components/common/Avatar.vue';
import Modal from '@/components/common/Modal.vue';
import ImagePreview from '@/components/common/ImagePreview.vue';
import PdfPreview from '@/components/common/PdfPreview.vue';

import { useNotificationsStore } from '@/stores/notifications';
import { INITIAL_STATE } from '@/components/chat/constants';
import { scrollToBottom, throttle } from '@/utils/helpers';
import { useAuthStore } from '@/stores/auth';
import { useChatStore } from '@/stores/chat';
import socketService from '@/services/socket';
import config from '@/config';

const emit = defineEmits(['close-chat']);

const authStore = useAuthStore();
const chatStore = useChatStore();
const notificationsStore = useNotificationsStore();

const { currentRoom, currentMessages, loadingMessages } = storeToRefs(chatStore);

const showDriverInformation = ref(INITIAL_STATE.modal.driverInformation);
const messagesContainer = ref(null);
const textareaRef = useTemplateRef('textareaRef');
const fileInput = ref(null);
const messageText = ref('');
const sending = ref(false);
const uploading = ref(false);
const uploadProgress = ref(0);
const typingTimeout = ref(null);
const editingMessage = ref(null);

const thumbnailsFiles = ref([]);
const MAX_FILES = 3;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Preview modal state
const showImagePreview = ref(false);
const showPdfPreview = ref(false);
const previewImageUrl = ref('');
const previewPdfUrl = ref('');
const previewFilename = ref('');

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

watch(currentRoom, async (newRoom, oldRoom) => {
  if (newRoom?.id !== oldRoom?.id) {
    if (!newRoom) {
      if (messagesContainer.value) {
        messagesContainer.value.removeEventListener('scroll', handleScroll);
      }
      thumbnailsFiles.value = [];
      return;
    }

    resetInfiniteScroll();

    const draft = chatStore.getDraft(newRoom.id);
    messageText.value = draft;

    thumbnailsFiles.value = [];

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
  const hasFiles = thumbnailsFiles.value.length > 0;

  if ((!text && !hasFiles) || sending.value || uploading.value || !currentRoom.value) return;

  sending.value = true;

  try {
    // Send text message if there is one
    if (text) {
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
    }

    // Upload files if there are any
    if (hasFiles) {
      await uploadFiles();
    }

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

const generateUniqueId = () => {
  return `thumbnail-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const handleFileSelect = async (event) => {
  const files = Array.from(event.target.files || []);
  if (!files.length) return;

  // Check if adding these files would exceed the limit
  const totalFiles = thumbnailsFiles.value.length + files.length;
  if (totalFiles > MAX_FILES) {
    notificationsStore.showError(`You can only upload a maximum of ${MAX_FILES} files.`);
    if (fileInput.value) {
      fileInput.value.value = '';
    }
    return;
  }

  // Process each file
  const promises = files.map((file) => {
    return new Promise((resolve) => {
      // Validate file size (10MB per file)
      if (file.size > MAX_FILE_SIZE) {
        notificationsStore.showError(`File "${file.name}" exceeds 10MB limit`);
        resolve(null);
        return;
      }

      // Validate file type
      const isImage = config.chat.allowedImageTypes.includes(file.type);
      const isPdf = config.chat.allowedPdfTypes.includes(file.type);

      if (!isImage && !isPdf) {
        notificationsStore.showError(`File "${file.name}" is not a valid image or PDF`);
        resolve(null);
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const thumbnailData = {
          id: generateUniqueId(),
          name: file.name,
          type: file.type,
          src: reader.result,
          file: file,
        };

        // Only add if we haven't exceeded the limit
        if (thumbnailsFiles.value.length < MAX_FILES) {
          thumbnailsFiles.value.push(thumbnailData);
          resolve(thumbnailData);
        } else {
          notificationsStore.showError(`You can only upload a maximum of ${MAX_FILES} files.`);
          resolve(null);
        }
      };
      reader.onerror = () => {
        notificationsStore.showError(`Failed to read file "${file.name}"`);
        resolve(null);
      };
    });
  });

  await Promise.allSettled(promises);

  // Clear input
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

const removeThumbnail = (thumbnail) => {
  thumbnailsFiles.value = thumbnailsFiles.value.filter((f) => f.id !== thumbnail.id);
};

const previewImage = (src, filename = '') => {
  previewImageUrl.value = src;
  previewFilename.value = filename;
  showImagePreview.value = true;
};

const previewPdf = (src, filename = '') => {
  previewPdfUrl.value = src;
  previewFilename.value = filename;
  showPdfPreview.value = true;
};

const uploadFiles = async () => {
  const files = thumbnailsFiles.value.map((thumb) => thumb.file);
  if (!files.length) return;

  uploading.value = true;
  uploadProgress.value = 0;

  try {
    const socketServerUrl =
      document.querySelector('meta[name="MIX_URL_CHAT_SERVER"]')?.content || config.socket.url;
    const uploadUrl = `${socketServerUrl}/upload-file`;

    // Upload each file
    for (const file of files) {
      const isImage = config.chat.allowedImageTypes.includes(file.type);
      // const isPdf = config.chat.allowedPdfTypes.includes(file.type);
      const content = isImage ? 'image' : 'pdf';

      const formData = new FormData();
      formData.append('content', content);
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
    }

    notificationsStore.showSuccess('Files uploaded successfully');

    // Clear thumbnails after successful upload
    thumbnailsFiles.value = [];
  } catch (error) {
    console.error('Upload error:', error);
    if (error.response?.status === 413) {
      notificationsStore.showError('File too large');
    } else {
      notificationsStore.showError('Failed to upload files');
    }
  } finally {
    uploading.value = false;
    uploadProgress.value = 0;
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
  thumbnailsFiles.value = [];
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
