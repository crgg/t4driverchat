<template>
  <div class="h-screen flex flex-col bg-secondary-50">
    <!-- Header -->
    <ChatHeader />

    <!-- Main Content -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Contacts Sidebar -->
      <ContactList />

      <!-- Chat Window -->
      <ChatWindow />
    </div>

    <!-- Toast Notifications -->
    <Toast />
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useChatStore } from '@/stores/chat';
import { useContactsStore } from '@/stores/contacts';
import { useNotificationsStore } from '@/stores/notifications';
import socketService from '@/services/socket';
import ChatHeader from '@/components/chat/ChatHeader.vue';
import ContactList from '@/components/chat/ContactList.vue';
import ChatWindow from '@/components/chat/ChatWindow.vue';
import Toast from '@/components/common/Toast.vue';
import { useSocket } from '@/composables';

const authStore = useAuthStore();
const chatStore = useChatStore();
const contactsStore = useContactsStore();
const notificationsStore = useNotificationsStore();
const { emit } = useSocket();

onMounted(() => {
  initializeChat();
});

onBeforeUnmount(() => {
  cleanupChat();
});

const initializeChat = async () => {
  setupSocketListeners();

  // Load initial data
  await Promise.all([
    contactsStore.loadDrivers(),
    // chatStore.loadDeviceInformation(),
    notificationsStore.loadNotifications(),
  ]);

  // Setup socket listeners
};

const setupSocketListeners = () => {
  console.log('setupSocketListeners');

  // New message received
  socketService.on('message:new', (message) => {
    chatStore.receiveMessage(message);
    notificationsStore.showInfo(`New message from ${message.user_send}`);
  });

  // User connected
  socketService.on('user:connected', (user) => {
    contactsStore.addConnectedUser(user);
  });

  // User disconnected
  socketService.on('user:disconnected', (username) => {
    contactsStore.removeConnectedUser(username);
  });

  // Users list update
  socketService.on('users:list', (users) => {
    contactsStore.setConnectedUsers(users);
  });

  socketService.on('request-available-rooms', (rooms) => {
    console.log('request-available-rooms', rooms);
  });

  // Typing indicator
  socketService.on('user:typing', (data) => {
    chatStore.setUserTyping(data);
  });

  // Device information update
  socketService.on('device:update', (info) => {
    chatStore.setDeviceInfo(info.driver_id, info);
  });

  // Connection events
  socketService.on('socket:connected', () => {
    emit('setUser', {
      username: authStore.user.username,
      type: 'dispatch',
      token: authStore.token,
    });
    emit('request-available-rooms', {
      username: authStore.user.username,
      typeUser: 'DISPATCH',
    });
    chatStore.loadDeviceInformation();
    notificationsStore.showSuccess('Connected to chat server');
  });

  socketService.on('socket:disconnected', () => {
    notificationsStore.showWarning('Disconnected from chat server');
  });

  socketService.on('socket:reconnected', () => {
    notificationsStore.showSuccess('Reconnected to chat server');
  });
};

const cleanupChat = () => {
  // Disconnect socket
  socketService.disconnect();

  // Clear stores
  chatStore.clearChatData();
};
</script>
