<template>
  <div class="w-96 bg-white border-r border-secondary-200 flex flex-col">
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

      <!-- Search Input -->
      <div class="relative mb-3">
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
      <div class="flex items-center gap-2">
        <button
          class="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-secondary-100 hover:bg-secondary-200 rounded-lg transition-colors"
          :class="{ 'bg-primary-100 text-primary-700': activeFiltersCount > 0 }"
          @click="showFilters = !showFilters"
        >
          <FunnelIcon class="h-4 w-4" />
          <span class="text-sm font-medium">
            Filters
            <span v-if="activeFiltersCount > 0" class="ml-1"> ({{ activeFiltersCount }}) </span>
          </span>
        </button>
      </div>

      <!-- Filters Panel -->
      <transition name="slide-down">
        <div v-if="showFilters" class="mt-3 p-3 bg-secondary-50 rounded-lg space-y-3">
          <!-- Terminal Zones -->
          <div v-if="terminalZones.size > 0">
            <p class="text-xs font-medium text-secondary-700 mb-2">Terminal Zones</p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="zone in Array.from(terminalZones)"
                :key="zone"
                class="px-2 py-1 text-xs rounded"
                :class="
                  terminalZoneFilters.includes(zone)
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-secondary-700 border border-secondary-300'
                "
                @click="contactsStore.toggleTerminalZoneFilter(zone)"
              >
                {{ zone }}
              </button>
            </div>
          </div>

          <!-- Other Codes -->
          <div v-if="otherCodes.size > 0">
            <p class="text-xs font-medium text-secondary-700 mb-2">Other Codes</p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="code in Array.from(otherCodes)"
                :key="code"
                class="px-2 py-1 text-xs rounded"
                :class="
                  otherCodeFilters.includes(code)
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-secondary-700 border border-secondary-300'
                "
                @click="contactsStore.toggleOtherCodeFilter(code)"
              >
                {{ code }}
              </button>
            </div>
          </div>

          <button
            class="w-full text-xs text-primary-600 hover:text-primary-700 font-medium"
            @click="contactsStore.clearFilters"
          >
            Clear All Filters
          </button>
        </div>
      </transition>
    </div>

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
import { debounce } from '@/utils/helpers';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import ContactItem from '@/components/chat/ContactItem.vue';
import { useAuthStore } from '@/stores/auth';

const contactsStore = useContactsStore();
const chatStore = useChatStore();
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
const showFilters = ref(false);

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

  const roomPayload = {
    id: sessionId,
    user1_id: username.value,
    user2_id: contact.DRIVER_ID,
  };

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
</script>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
  max-height: 500px;
  overflow: hidden;
}

.slide-down-enter-from,
.slide-down-leave-to {
  max-height: 0;
  opacity: 0;
}
</style>
