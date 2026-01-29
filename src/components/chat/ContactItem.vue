<template>
  <div
    class="flex items-center relative gap-2 md:gap-3 p-3 md:p-4 hover:bg-secondary-50 active:bg-secondary-100 cursor-pointer transition-colors border-b border-secondary-100"
    :class="{ 'bg-primary-50': isSelected }"
  >
    <div v-if="showCheckbox" class="w-10 flex items-center justify-center">
      <CheckCircleIcon
        v-if="selected"
        class="text-emerald-600 bg-emerald-100 rounded-full w-8 h-8"
      />
      <div v-else class="w-[27px] h-[27px] border-[3px] border-gray-400 rounded-full"></div>
    </div>
    <template v-else>
      <!-- Avatar -->
      <Avatar
        :name="contact.NAME"
        :src="contact.picture_name"
        size="sm"
        :status="isOnline ? 'online' : 'offline'"
        show-status
      />
    </template>

    <div
      v-if="lastMessage"
      class="text-[10px] md:text-xs text-secondary-400 flex-shrink-0 text-right absolute top-3 right-3"
    >
      {{ formatTime(lastMessage.created_at) }}
    </div>

    <span
      v-if="unreadCount > 0"
      class="absolute bottom-3.5 right-3.5 w-6 h-6 flex items-center justify-center badge badge-danger text-xs font-bold"
    >
      {{ unreadCount > 9 ? '+9' : unreadCount }}
    </span>

    <!-- Contact Info -->
    <div class="flex-1 min-w-0">
      <!-- Driver ID and Session -->
      <div class="flex items-center gap-1 text-[11px] text-primary-500 mb-0">
        <span>{{ sessionId }}</span>
        <span>#{{ contact.DRIVER_ID }}</span>
      </div>

      <!-- Name -->
      <p class="text-xs md:text-sm uppercase font-medium text-secondary-700 truncate">
        {{ contact.NAME }}
      </p>

      <!-- Last Message -->
      <div
        v-if="lastMessage"
        class="flex items-center gap-1 text-sm text-secondary-400 ms-2 truncate"
      >
        <component :is="messageIcon" class="h-4 w-4 flex-shrink-0" />
        <span class="truncate">{{ messagePreview }}</span>
      </div>

      <div class="mt-3">
        <!-- Device Info -->
        <div
          v-if="deviceInfo"
          class="flex items-center gap-2 gap-y-0 md:gap-4 text-xs text-secondary-500 flex-wrap"
        >
          <span v-if="deviceInfo.phonefrom" class="inline-flex items-center gap-1">
            <img
              :src="deviceInfo.phonefrom === 'ANDROID' ? DeviceIconAndroid : DeviceIconApple"
              class="h-4 w-4"
              alt="Device Icon"
            />
          </span>
          <span v-if="deviceInfo.allow_location">
            Allow: <strong>{{ deviceInfo.allow_location }}</strong>
          </span>
          <span v-if="deviceInfo.phone_version">
            Version: <strong>{{ deviceInfo.phone_version }}</strong>
          </span>
          <span v-if="deviceInfo.battery_level" class="flex items-center gap-x-1">
            <component :is="batteryIcon" class="h-5 w-5" :class="batteryIconClass" />
            <strong>{{ deviceInfo.battery_level }}</strong>
            <span v-if="deviceInfo.battery_state" class="text-xs hidden sm:block">
              {{ deviceInfo.battery_state }}
            </span>
          </span>
        </div>

        <!-- Driver Info (Terminal Zone, Other Code, Status) -->
        <div
          v-if="showDriverInfo"
          class="flex items-center gap-4 text-xs text-secondary-500 flex-wrap"
        >
          <span v-if="contact.TERMINAL_ZONE">
            <strong>T. Zone</strong> {{ contact.TERMINAL_ZONE }}
          </span>
          <span v-if="contact.OTHER_CODE"> <strong>O. Code</strong> {{ contact.OTHER_CODE }} </span>
          <span v-if="contact.STATUS"> <strong>Status</strong> {{ contact.STATUS }} </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { storeToRefs } from 'pinia';

import {
  PhotoIcon,
  DocumentIcon,
  VideoCameraIcon,
  CheckCircleIcon,
} from '@heroicons/vue/24/outline';
import { Battery100Icon, Battery50Icon, Battery0Icon } from '@heroicons/vue/24/solid';
import moment from 'moment';

import DeviceIconAndroid from '@/assets/images/devicon_android.png';
import DeviceIconApple from '@/assets/images/devicon_apple.png';
import Avatar from '@/components/common/Avatar.vue';
import { useContactsStore } from '@/stores/contacts';
import { truncateText } from '@/utils/helpers';
import { useChatStore } from '@/stores/chat';

const props = defineProps({
  contact: {
    type: Object,
    required: true,
  },
  showCheckbox: {
    type: Boolean,
    default: true,
  },
  selected: {
    type: Boolean,
    default: false,
  },
});

const chatStore = useChatStore();
const contactsStore = useContactsStore();

const { currentRoom, lastMessages, unreadMessages, sessionDrivers, deviceInformation } =
  storeToRefs(chatStore);
const { isContactOnline } = contactsStore;

const isSelected = computed(() => {
  return currentRoom.value?.contact?.DRIVER_ID === props.contact.DRIVER_ID;
});

const isOnline = computed(() => {
  return isContactOnline(props.contact.DRIVER_ID);
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

const showDriverInfo = computed(() => {
  return props.contact.TERMINAL_ZONE || props.contact.OTHER_CODE || props.contact.STATUS;
});

const batteryLevel = computed(() => {
  if (!deviceInfo.value?.battery_level) return 0;
  return parseInt(deviceInfo.value.battery_level) || 0;
});

const batteryIcon = computed(() => {
  const level = batteryLevel.value;

  if (level <= 20) {
    return Battery0Icon;
  } else if (level <= 50) {
    return Battery50Icon;
  } else {
    return Battery100Icon;
  }
});

const batteryIconClass = computed(() => {
  const level = batteryLevel.value;

  if (level <= 20) {
    return 'text-red-500';
  } else if (level <= 50) {
    return 'text-yellow-500';
  } else {
    return 'text-green-500';
  }
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
  if (!time) return '';

  const messageTime = moment(time);
  const now = moment();

  // If today, show only time
  if (now.isSame(messageTime, 'day')) {
    return messageTime.format('h:mm A');
  }

  // If yesterday
  const yesterday = moment().subtract(1, 'days');
  if (yesterday.isSame(messageTime, 'day')) {
    return 'Yesterday';
  }

  // If within this week, show day name
  const daysAgo = now.diff(messageTime, 'days');
  if (daysAgo < 7) {
    return messageTime.format('ddd'); // Mon, Tue, etc.
  }

  // If within this year, show month and day
  if (now.isSame(messageTime, 'year')) {
    return messageTime.format('MM/DD');
  }

  // Otherwise show full date
  return messageTime.format('MM/DD/YYYY');
};
</script>
