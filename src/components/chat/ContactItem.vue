<template>
  <div
    class="flex items-center gap-3 p-4 hover:bg-secondary-50 cursor-pointer transition-colors border-b border-secondary-100"
    :class="{ 'bg-primary-50': isSelected }"
  >
    <!-- Avatar -->
    <Avatar
      :name="contact.NAME"
      :src="contact.picture_name"
      size="md"
      :status="isOnline ? 'online' : 'offline'"
      show-status
      :badge="unreadCount > 0 ? unreadCount : ''"
    />

    <!-- Contact Info -->
    <div class="flex-1 min-w-0">
      <!-- Driver ID and Session -->
      <div class="flex items-center gap-1 text-xs text-primary-600 mb-1">
        <span class="font-bold">{{ sessionId }}</span>
        <span>#{{ contact.DRIVER_ID }}</span>
      </div>

      <!-- Name -->
      <p class="font-medium text-secondary-900 truncate">
        {{ contact.NAME }}
      </p>

      <!-- Last Message -->
      <div v-if="lastMessage" class="flex items-center gap-1 text-sm text-secondary-600 truncate">
        <component :is="messageIcon" class="h-4 w-4 flex-shrink-0" />
        <span class="truncate">{{ messagePreview }}</span>
      </div>

      <!-- Device Info -->
      <div v-if="deviceInfo" class="flex items-center gap-2 text-xs text-secondary-500 mt-1">
        <span v-if="deviceInfo.allow_location">
          Allow: <strong>{{ deviceInfo.allow_location }}</strong>
        </span>
        <span v-if="deviceInfo.phone_version">
          Version: <strong>{{ deviceInfo.phone_version }}</strong>
        </span>
      </div>
    </div>

    <!-- Time -->
    <div v-if="lastMessage" class="text-xs text-secondary-500 flex-shrink-0">
      {{ formatTime(lastMessage.created_at) }}
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useChatStore } from '@/stores/chat';
import { useContactsStore } from '@/stores/contacts';
import { truncateText } from '@/utils/helpers';
import moment from 'moment';
import Avatar from '@/components/common/Avatar.vue';
import { PhotoIcon, DocumentIcon, VideoCameraIcon } from '@heroicons/vue/24/outline';

const props = defineProps({
  contact: {
    type: Object,
    required: true,
  },
});

const chatStore = useChatStore();
// const contactsStore = useContactsStore();

const { currentRoom, lastMessages, unreadMessages, sessionDrivers, deviceInformation } =
  storeToRefs(chatStore);
// const { isContactOnline } = contactsStore;

const isSelected = computed(() => {
  return currentRoom.value?.contact?.DRIVER_ID === props.contact.DRIVER_ID;
});

const isOnline = computed(() => {
  return true;
  // return isContactOnline.value(props.contact.DRIVER_ID);
});

const sessionId = computed(() => {
  return (
    sessionDrivers.value.get(props.contact.DRIVER_ID) ||
    props.contact.session?.id ||
    props.contact.DRIVER_ID
  );
});

const lastMessage = computed(() => {
  const sid = sessionDrivers.value.get(props.contact.DRIVER_ID) || props.contact.session?.id;
  return sid ? lastMessages.value.get(sid) : props.contact.lastMessage;
});

const unreadCount = computed(() => {
  const sid = sessionDrivers.value.get(props.contact.DRIVER_ID) || props.contact.session?.id;
  return sid ? unreadMessages.value.get(sid) || 0 : 0;
});

const deviceInfo = computed(() => {
  return deviceInformation.value.get(props.contact.DRIVER_ID);
});

const messageIcon = computed(() => {
  if (!lastMessage.value) return null;

  switch (lastMessage.value.content) {
    case 'image':
      return PhotoIcon;
    case 'pdf':
      return DocumentIcon;
    case 'video':
      return VideoCameraIcon;
    default:
      return null;
  }
});

const messagePreview = computed(() => {
  if (!lastMessage.value) return '';

  const { content, message } = lastMessage.value;

  switch (content) {
    case 'image':
      return 'Photo';
    case 'pdf':
      return 'PDF';
    case 'video':
      return 'Video';
    default:
      return truncateText(message, 40);
  }
});

const formatTime = (time) => {
  return moment(time).format('HH:mm');
};
</script>
