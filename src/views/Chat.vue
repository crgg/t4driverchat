<template>
  <div class="h-screen flex bg-[#f4f6f9]">
    <div class="bg-[#353a3f] w-20 hidden md:block">
      <div
        class="flex flex-col gap-2 items-center justify-center p-1 rounded-full mt-4 text-center w-full"
      >
        <div class="bg-white p-1 rounded-full">
          <a :href="`${config.api.baseUrl}/dashboard`">
            <span class="sr-only">Go Back to Dashboard</span>
            <img
              src="/images/logonewsmall.png"
              alt="App Logo"
              class="w-8 h-8 object-contain mx-auto"
            />
          </a>
        </div>
        <div class="flex flex-col">
          <span class="text-xs align-middle hidden md:block text-secondary-200 uppercase font-bold">
            {{ config.app.acronym }}
          </span>
          <span class="text-xs text-secondary-200 align-middle"> V {{ config.app.version }} </span>
        </div>
      </div>
    </div>
    <div class="flex flex-col flex-1">
      <!-- Header -->
      <ChatHeader />

      <!-- Main Content -->
      <div class="flex-1 flex overflow-hidden relative p-5">
        <!-- Contacts Sidebar -->
        <ContactList
          :class="[
            'transition-transform duration-300 ease-in-out',
            'absolute md:relative inset-y-0 left-0 z-20 w-full',
            'md:w-80 lg:w-96 xl:w-[32rem]',
            showMobileChat ? '-translate-x-full md:translate-x-0' : 'translate-x-0',
          ]"
          @contact-selected="handleContactSelected"
        />

        <!-- Chat Window -->
        <ChatWindow
          :class="[
            'transition-transform duration-300 ease-in-out',
            'absolute md:relative inset-0 z-10',
            'md:flex-1',
            showMobileChat ? 'translate-x-0' : 'translate-x-full md:translate-x-0',
          ]"
          @close-chat="handleCloseChat"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount } from 'vue';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useChatStore } from '@/stores/chat';
import { useContactsStore } from '@/stores/contacts';
import { useNotificationsStore } from '@/stores/notifications';
import socketService from '@/services/socket';
import SocketAdapter from '@/adapter/socket.adapter';
import ChatHeader from '@/components/chat/ChatHeader.vue';
import ContactList from '@/components/chat/ContactList.vue';
import ChatWindow from '@/components/chat/ChatWindow.vue';
import { useSocket } from '@/composables';
import { chatApi } from '@/services/api';
import config from '@/config';

const router = useRouter();
const authStore = useAuthStore();
const chatStore = useChatStore();
const contactsStore = useContactsStore();
const notificationsStore = useNotificationsStore();
const { emit } = useSocket();

// Responsive state
const { currentRoom } = storeToRefs(chatStore);
const showMobileChat = computed(() => currentRoom.value !== null);

// Mobile navigation handlers
const handleContactSelected = () => {
  // When a contact is selected, the chat will automatically show in mobile
  // because currentRoom will be set
};

const handleCloseChat = () => {
  chatStore.leaveCurrentRoom();
};

onMounted(async () => {
  try {
    const response = await chatApi.checkSession();

    if (!response.data || !response.data.authenticated) {
      console.warn('Session validation failed: Not authenticated');
      window.location.href = `${config.api.baseUrl}/dashboard`;
      return;
    }

    router.push({ path: '/chat', replace: true });
    initializeChat();
  } catch (error) {
    console.error('Session validation error:', error);
    window.location.href = `${config.api.baseUrl}/dashboard`;
  }
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
  socketService.on('chat', (msg) => {
    if (msg.where === 'PHONE' || msg.wherefrom === 'PHONE') {
      // Emit read message if from phone
      if (msg.user_send === chatStore.currentRoom?.user2_id) {
        socketService.readMessage({
          session_id: msg.session_id,
          type: 1,
          wherefrom: 'web',
          user: authStore.user.username,
          message_id: msg.id,
          uuid: msg.UUID,
          sessionId: msg.session_id,
          username: authStore.user.username,
        });
      }
      // Add message if from current driver
      if (msg.user_send === chatStore.currentRoom?.user2_id) {
        chatStore.receiveMessage(msg);
      }
    } else {
      chatStore.receiveMessage(msg);
    }

    // Update last message in contacts
    if (msg.session_id) {
      contactsStore.updateLastMessage(msg.session_id, msg);
    }
  });

  // Global message received (for notifications)
  socketService.on('receive-global-message', (message) => {
    const currentUser = authStore.user.username;

    // Determine which driver to associate with
    const selectedDriverId =
      String(currentUser).toLowerCase() === String(message.forUser).toLowerCase()
        ? message.user
        : message.forUser;

    // Store session for driver
    chatStore.setSessionDriver(selectedDriverId, message.session_id);

    // Update contact's session
    contactsStore.setContactSession(selectedDriverId, message.session_id);

    // Update last message
    contactsStore.updateLastMessage(message.session_id, message);

    // If not in current room and message is not from current user, increment unread
    if (chatStore.currentRoom?.id !== message.session_id && message.user !== currentUser) {
      chatStore.incrementUnreadCount(message.session_id);
    }
  });

  // New message received (modern event)
  socketService.on('message:new', (message) => {
    chatStore.receiveMessage(message);
    notificationsStore.showInfo(`New message from ${message.user_send}`);
  });

  // Update existing message
  socketService.on('update-message', (payload) => {
    chatStore.updateMessage(payload);

    // Also update last message if it was updated
    if (payload.session_id) {
      contactsStore.updateLastMessage(payload.session_id, payload);
    }
  });

  // Delete message
  socketService.on('destroy-message', (payload) => {
    chatStore.deleteMessage(payload.id);

    // Update last message after deletion
    const { lastMessage, sessionId } = payload;
    if (lastMessage && sessionId) {
      contactsStore.updateLastMessage(sessionId, lastMessage);
    } else if (sessionId) {
      contactsStore.removeLastMessage(sessionId);
    }
  });

  // Message read confirmation
  socketService.on('readMessage', (message) => {
    if (chatStore.currentRoom?.id === message.session_id) {
      chatStore.markMessageAsRead(message);
    }
  });

  // History messages (for pagination)
  socketService.on('history-messages', (historyMessages = []) => {
    chatStore.loadHistoryMessages(historyMessages);
  });

  // New message ID assigned (confirmation)
  socketService.on('newIdMessage', (msg) => {
    // Message was successfully saved and got an ID
    chatStore.updateMessageId(msg);
  });

  // ===== TYPING EVENTS =====

  // Typing indicator (old format)
  socketService.on('typing', (msg) => {
    if (msg.from === 'WEB') {
      return;
    }

    chatStore.setUserTyping({
      sessionId: msg.session_id,
      username: msg.toUser || msg.user,
      newState: msg.newState,
    });
  });

  // Typing indicator (modern format)
  socketService.on('user:typing', (data) => {
    chatStore.setUserTyping(data);
  });

  // ===== CHAT SESSION EVENTS =====

  // Chat opened event
  socketService.on('openedchat', (info) => {
    if (chatStore.currentRoom?.id === info.session_id) {
      // Mark messages as read when chat is opened
      socketService.readMessage({
        sessionId: info.session_id,
        username: authStore.user.username,
      });
    }
  });

  // ===== USER EVENTS =====

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

  // Users connected (legacy format)
  socketService.on('getUsersConnected', (payload) => {
    if (payload.clientsDriver) {
      contactsStore.setConnectedUsers(payload.clientsDriver);
    }
  });

  socketService.on('request-available-rooms', (rooms = []) => {
    rooms.forEach((room) => {
      const driverId = authStore.user.username === room.user2_id ? room.user1_id : room.user2_id;
      chatStore.setSessionDriver(driverId, room.id);
      contactsStore.setContactSession(driverId, room.id);
    });

    chatStore.indexLastMessages(rooms);
  });

  socketService.on('number-unread-messages', (rooms) => {
    chatStore.indexUnreadMessages(rooms);
  });

  // ===== DEVICE EVENTS =====

  socketService.on('device:update', (info) => {
    chatStore.setDeviceInfo(info.driver_id, info);
  });

  socketService.on('device-information', (payload) => {
    if (payload.driver_id) {
      chatStore.setDeviceInfo(payload.driver_id, payload);
    }
  });

  // ===== CONNECTION EVENTS =====

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

    emit('number-unread-messages', {
      username: authStore.user.username,
    });

    if (
      chatStore.currentRoom?.id &&
      chatStore.currentRoom?.user1_id &&
      chatStore.currentRoom?.user2_id
    ) {
      try {
        const roomPayload = SocketAdapter.roomToEmitJoinEvent(chatStore.currentRoom);
        socketService.joinRoom(roomPayload);
      } catch (error) {
        console.error('Failed to rejoin room on connect:', error);
      }
    }

    setTimeout(() => {
      chatStore.loadDeviceInformation();
    }, 500);

    notificationsStore.showSuccess('Connected to chat server');
  });

  socketService.on('socket:disconnected', () => {
    notificationsStore.showWarning('Disconnected from chat server');
  });

  socketService.on('socket:reconnected', () => {
    emit('setUser', {
      username: authStore.user.username,
      type: 'dispatch',
      token: authStore.token,
    });

    emit('request-available-rooms', {
      username: authStore.user.username,
      typeUser: 'DISPATCH',
    });

    emit('number-unread-messages', {
      username: authStore.user.username,
    });

    if (
      chatStore.currentRoom?.id &&
      chatStore.currentRoom?.user1_id &&
      chatStore.currentRoom?.user2_id
    ) {
      try {
        const roomPayload = SocketAdapter.roomToEmitJoinEvent(chatStore.currentRoom);
        socketService.joinRoom(roomPayload);
      } catch (error) {
        console.error('Failed to rejoin room on reconnect:', error);
      }
    }

    notificationsStore.showSuccess('Reconnected to chat server');
  });

  // ===== ERROR EVENTS =====

  socketService.on('error', (err) => {
    console.error('Socket error:', err);
    if (err.description) {
      notificationsStore.showError(err.description);
    }
  });

  socketService.on('connect_error', (err) => {
    console.error('Connection error:', err);
  });

  socketService.on('reconnect_error', (err) => {
    console.error('Reconnection error:', err);
  });

  socketService.on('reconnect_failed', () => {
    console.error('Reconnection failed');
    notificationsStore.showError('Failed to reconnect to chat server');
  });
};

const cleanupChat = () => {
  // Disconnect socket
  socketService.disconnect();

  // Clear stores
  chatStore.clearChatData();
};
</script>
