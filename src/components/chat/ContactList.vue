<template>
  <div class="bg-white border-r border-secondary-200 flex flex-col h-full">
    <!-- Search and Filters -->
    <div class="p-4 border-b border-secondary-200">
      <!-- Type Selector -->
      <select
        v-model="filterBy"
        class="w-full mb-3 px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        @change="handleFilterChange"
      >
        <option value="driver">Type Drivers</option>
        <option value="carrier">Type Carriers</option>
      </select>

      <div class="flex items-center gap-1 mb-2">
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
          {{ searchValue ? 'No results found' : 'Start Chatting' }}
        </p>
        <p v-if="searchValue" class="text-secondary-500 text-sm text-center mt-1">
          Try adjusting your search
        </p>
      </div>

      <!-- Contacts -->
      <div v-else>
        <ContactItem
          v-for="contact in currentContacts"
          :key="contact.DRIVER_ID"
          :contact="contact"
          @click="handleContactClick(contact)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { storeToRefs } from 'pinia';
import { MagnifyingGlassIcon, FunnelIcon, UserGroupIcon } from '@heroicons/vue/24/outline';

import { useContactsStore } from '@/stores/contacts';
import { useChatStore } from '@/stores/chat';
import { useAuthStore } from '@/stores/auth';
import { debounce } from '@/utils/helpers';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import ContactItem from '@/components/chat/ContactItem.vue';
import FilterModal from '@/components/chat/FilterModal.vue';

const contactsStore = useContactsStore();
const chatStore = useChatStore();
const { currentRoom, messages } = storeToRefs(chatStore);
const authStore = useAuthStore();

const {
  currentContacts,
  loading,
  filterBy,
  searchValue,
  terminalZones,
  otherCodes,
  terminalZoneFilters,
  otherCodeFilters,
  activeFiltersCount,
} = storeToRefs(contactsStore);

const { username } = storeToRefs(authStore);
const showFilterModal = ref(false);

// Emit for mobile navigation
const emit = defineEmits(['contact-selected']);

const handleFilterChange = () => {
  if (filterBy.value === 'carrier') {
    contactsStore.loadCarriers(searchValue.value);
  }
};

const handleSearch = debounce(() => {
  contactsStore.searchContacts(searchValue.value);
}, 500);

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
