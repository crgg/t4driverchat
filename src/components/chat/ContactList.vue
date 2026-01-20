<template>
  <div
    class="bg-white border-r-0 border-secondary-200 flex flex-col h-full sm:rounded-s-3xl border"
  >
    <!-- Search and Filters -->
    <div class="p-4 border-b border-secondary-200">
      <!-- Type Selector -->
      <!-- <select
        v-model="filterBy"
        class="w-full mb-3 px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        @change="handleFilterChange"
      >
        <option value="driver">Type Drivers</option>
        <option value="carrier">Type Carriers</option>
      </select> -->

      <div class="flex items-center gap-1">
        <!-- Search Input -->
        <div class="relative flex-1">
          <MagnifyingGlassIcon
            class="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-secondary-400"
          />
          <input
            v-model="searchValue"
            type="text"
            placeholder="Type to search"
            class="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            @input="handleSearch"
          />
        </div>

        <!-- Action Buttons -->
        <div class="flex items-cente relative gap-2">
          <button
            class="flex-1 flex border items-center justify-center gap-2 bg-secondary-100 hover:bg-secondary-200 rounded-lg transition-colors h-[42px] w-[42px]"
            :class="{
              'bg-primary-200 text-primary-700 hover:bg-primary-300': activeFiltersCount > 0,
            }"
            @click="showFilterModal = true"
          >
            <FunnelIcon class="h-5 w-5" />
            <span
              v-if="activeFiltersCount > 0"
              class="text-sm absolute -top-3 -right-2 p-1 text-primary-700 font-bold"
            >
              {{ activeFiltersCount }}
            </span>
          </button>
          <button
            class="flex-1 flex border items-center justify-center gap-2 rounded-lg transition-colors h-[42px] w-[42px]"
            :class="{
              'bg-primary-700 text-white hover:bg-primary-600': enabledSelectContacts,
              'bg-secondary-100 hover:bg-secondary-200': !enabledSelectContacts,
            }"
            @click="handleEnableSelectContacts"
          >
            <RectangleGroupIcon class="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>

    <!-- Filter Modal -->
    <FilterModal
      :is-open="showFilterModal"
      :terminal-zones="Array.from(terminalZones)"
      :other-codes="Array.from(otherCodes)"
      :current-terminal-zone-filters="terminalZoneFilters"
      :current-other-code-filters="otherCodeFilters"
      @close="showFilterModal = false"
      @apply-filters="handleApplyFilters"
      @clear-filters="handleClearFilters"
    />

    <!-- Contacts List -->
    <div class="flex-1 overflow-y-auto custom-scrollbar">
      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-8">
        <LoadingSpinner size="md" text="Loading contacts..." />
      </div>

      <!-- Empty State -->
      <div
        v-else-if="currentContacts.length === 0"
        class="flex flex-col items-center justify-center py-12 px-4"
      >
        <UserGroupIcon class="h-16 w-16 text-secondary-300 mb-4" />
        <p class="text-secondary-600 text-center">
          {{ hasActiveFilters ? 'No results found' : 'Start Chatting' }}
        </p>
        <div v-if="hasActiveFilters" class="text-secondary-500 text-sm text-center mt-1 space-y-4">
          <p>Try adjusting your filters</p>
          <button
            class="bg-primary-700 text-white text-sm px-4 py-2 rounded-md"
            @click="handleClearFilters"
          >
            Clear Filters
          </button>
        </div>
      </div>

      <!-- Contacts -->
      <div v-else>
        <ContactItem
          v-for="contact in currentContacts"
          :key="contact.DRIVER_ID"
          :selected="selectedContacts.has(contact.DRIVER_ID)"
          :show-checkbox="enabledSelectContacts"
          :contact="contact"
          @click="onSelectContactHandler(contact)"
        />
      </div>

      <div
        v-if="selectedContacts.size > 0 && enabledSelectContacts"
        class="sticky bottom-0 left-0 right-0 bg-white p-2 border-t border-secondary-200"
      >
        <button
          class="flex items-center justify-center gap-2 bg-primary-700 hover:bg-primary-800 text-white px-4 py-3 rounded-md w-full"
          @click="sendBulkMessagesHandleClick"
        >
          {{ selectedContacts.size }} {{ selectedContacts.size === 1 ? 'Contact' : 'Contacts' }}
          <PaperAirplaneIcon class="h-5 w-5" style="stroke-width: 2" />
        </button>
      </div>
    </div>

    <Modal
      v-model="showSendBulkMessagesModal"
      :close-on-backdrop="false"
      title="Send Bulk Messages"
      size="xxl"
    >
      <SenBulkMessageModal @close="showSendBulkMessagesModal = false" />
    </Modal>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { storeToRefs } from 'pinia';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  UserGroupIcon,
  RectangleGroupIcon,
  PaperAirplaneIcon,
} from '@heroicons/vue/24/outline';

import { useContactsStore } from '@/stores/contacts';
import { useChatStore } from '@/stores/chat';
import { useAuthStore } from '@/stores/auth';
import { debounce } from '@/utils/helpers';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import ContactItem from '@/components/chat/ContactItem.vue';
import FilterModal from '@/components/chat/FilterModal.vue';
import Modal from '@/components/common/Modal.vue';
import SenBulkMessageModal from '@/components/chat/SenBulkMessageModal.vue';

const contactsStore = useContactsStore();
const chatStore = useChatStore();
const { currentRoom, messages } = storeToRefs(chatStore);
const authStore = useAuthStore();

const {
  currentContacts,
  loading,
  searchValue,
  terminalZones,
  otherCodes,
  terminalZoneFilters,
  otherCodeFilters,
  activeFiltersCount,
  hasActiveFilters,
  selectedContacts,
} = storeToRefs(contactsStore);

const { username } = storeToRefs(authStore);
const showFilterModal = ref(false);
const enabledSelectContacts = ref(false);
const showSendBulkMessagesModal = ref(false);

const onSelectContactHandler = (contact) => {
  if (enabledSelectContacts.value) {
    handleSelectContact(contact);
  } else {
    handleContactClick(contact);
  }
};

const handleEnableSelectContacts = () => {
  if (enabledSelectContacts.value) {
    enabledSelectContacts.value = false;
    selectedContacts.value.clear();
  } else {
    enabledSelectContacts.value = true;
  }
};

const sendBulkMessagesHandleClick = () => {
  showSendBulkMessagesModal.value = true;
};

// Emit for mobile navigation
const emit = defineEmits(['contact-selected']);

const handleSearch = debounce(() => {
  contactsStore.searchContacts(searchValue.value);
}, 500);

const handleSelectContact = (contact) => {
  contactsStore.toggleSelectedContact(contact);
};

const handleContactClick = async (contact) => {
  // Get or create session
  let sessionId = chatStore.getSessionDriver(contact.DRIVER_ID);

  if (!sessionId && contact.session?.id) {
    sessionId = contact.session.id;
    chatStore.setSessionDriver(contact.DRIVER_ID, sessionId);
  }

  if (!!currentRoom.value?.id && currentRoom.value.id === sessionId) return;

  const roomPayload = {
    id: sessionId,
    user1_id: username.value,
    user2_id: contact.DRIVER_ID,
  };

  // Emit event for mobile navigation
  emit('contact-selected');
  messages.value = [];

  // Load messages
  if (sessionId) {
    chatStore.setCurrentRoom({ ...roomPayload, contact });
    chatStore.openedChatWeb(roomPayload);
    chatStore.loadMessages(sessionId);
    chatStore.markAsRead(sessionId, roomPayload.user1_id);
  } else {
    chatStore.setSyncSession(roomPayload, (newRoom) => {
      chatStore.setCurrentRoom({ ...newRoom, contact });
      chatStore.openedChatWeb(newRoom);
      chatStore.loadMessages(newRoom.id);
      chatStore.markAsRead(newRoom.id, newRoom.user1_id);
      chatStore.setSessionDriver(contact.DRIVER_ID, newRoom.id);
    });
  }
};

const handleApplyFilters = (filters) => {
  contactsStore.setFilters(filters);
};

const handleClearFilters = () => {
  contactsStore.clearFilters();
};
</script>
