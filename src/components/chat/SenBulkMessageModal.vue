<template>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
    <div
      v-for="contact in contacts"
      :key="contact.DRIVER_ID"
      class="flex items-center gap-1 rounded-lg overflow-hidden border"
    >
      <div class="flex flex-1 gap-2 overflow-hidden px-2">
        <Avatar :src="contact.picture_name" size="sm" :alt="contact.NAME" />
        <div>
          <p class="text-[11px] text-primary-700">#{{ contact.DRIVER_ID }}</p>
          <h3
            class="text-sm font-semibold text-secondary-900 truncate overflow-hidden text-ellipsis"
          >
            {{ contact.NAME }}
          </h3>
        </div>
      </div>
      <button
        class="ml-auto w-11 h-16 bg-gray-100 hover:bg-red-100 text-gray-600 hover:text-red-600 flex items-center justify-center"
      >
        <UserMinusIcon class="h-5 w-5" />
      </button>
    </div>
  </div>
  <form class="mt-4" @submit.prevent="sendMessage">
    <div
      v-if="error"
      class="px-3 py-4 bg-red-50 border border-red-200 rounded-lg text-red-500 text-sm mb-2"
    >
      {{ error }}
    </div>

    <div>
      <label for="message" class="text-sm font-medium text-secondary-900 mb-1">Message</label>
      <textarea
        id="message"
        v-model="message"
        class="w-full h-24 p-2 rounded-lg border"
        placeholder="Enter your message"
      ></textarea>
      <div>{{ message.length }} / {{ MAX_MESSAGE_LENGTH }}</div>
    </div>
    <div class="flex justify-end gap-2 mt-4">
      <button
        type="button"
        class="btn btn-secondary w-24"
        :disabled="loading"
        @click="onCancelHandler"
      >
        Cancel
      </button>
      <button type="submit" class="btn btn-primary w-40 gap-2" :disabled="loading">
        <div v-if="loading" class="text-sm flex gap-2 items-center justify-center">
          <LoadingSpinner size="sm" />
          Sending
        </div>
        <span v-else>Send</span>
      </button>
    </div>
  </form>
</template>

<script setup>
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';
import { UserMinusIcon } from '@heroicons/vue/24/outline';

import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import Avatar from '@/components/common/Avatar.vue';
import { useContactsStore } from '@/stores/contacts';

const emit = defineEmits(['close']);
const contactsStore = useContactsStore();

const { selectedContacts } = storeToRefs(contactsStore);
const MAX_MESSAGE_LENGTH = 500;
const message = ref('');
const error = ref(null);
const loading = ref(true);
const contacts = computed(() => Array.from(selectedContacts.value.values()));

const onCancelHandler = () => {
  emit('close');
};

const sendMessage = () => {
  error.value = null;
  const text = message.value.trim();
  if (text.length === 0) {
    error.value = 'Message is required';
    return;
  }
  if (text.length > MAX_MESSAGE_LENGTH) {
    error.value = `Message must be less than ${MAX_MESSAGE_LENGTH} characters`;
    return;
  }
  console.log(text);
};
</script>
