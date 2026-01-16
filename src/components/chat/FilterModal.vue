<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 bg-black/50 backdrop-blur-sm"
        @click.self="handleCancel"
      >
        <div
          class="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[85vh] md:max-h-[80vh] flex flex-col"
          @click.stop
        >
          <!-- Header -->
          <div class="flex items-center justify-between p-4 md:p-6 border-b border-secondary-200">
            <div class="flex items-center gap-3">
              <FunnelIcon class="h-6 w-6 text-primary-600" />
              <h2 class="text-xl font-semibold text-secondary-900">Filter Contacts</h2>
            </div>
            <button
              class="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
              @click="handleCancel"
            >
              <XMarkIcon class="h-5 w-5 text-secondary-600" />
            </button>
          </div>

          <!-- Content -->
          <div class="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6">
            <!-- Terminal Zones -->
            <div v-if="terminalZones.length > 0">
              <h3 class="text-sm font-semibold text-secondary-700 mb-3 flex items-center gap-2">
                <BuildingOfficeIcon class="h-4 w-4" />
                Terminal Zones
                <span
                  v-if="selectedTerminalZones.length > 0"
                  class="ml-auto text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full"
                >
                  {{ selectedTerminalZones.length }} selected
                </span>
              </h3>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="zone in terminalZones"
                  :key="zone"
                  class="px-3 py-2 text-sm rounded-lg transition-all duration-200 font-medium border"
                  :class="
                    selectedTerminalZones.includes(zone)
                      ? 'bg-primary-600 text-white shadow-md hover:bg-primary-700'
                      : 'bg-secondary-100 text-secondary-700 border-secondary-300 hover:bg-secondary-200 hover:border-secondary-400'
                  "
                  @click="toggleTerminalZone(zone)"
                >
                  {{ zone }}
                </button>
              </div>
            </div>

            <!-- Other Codes -->
            <div v-if="otherCodes.length > 0">
              <h3 class="text-sm font-semibold text-secondary-700 mb-3 flex items-center gap-2">
                <TagIcon class="h-4 w-4" />
                Other Codes
                <span
                  v-if="selectedOtherCodes.length > 0"
                  class="ml-auto text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full"
                >
                  {{ selectedOtherCodes.length }} selected
                </span>
              </h3>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="code in otherCodes"
                  :key="code"
                  class="px-3 py-2 text-sm rounded-lg transition-all duration-200 font-medium border"
                  :class="
                    selectedOtherCodes.includes(code)
                      ? 'bg-primary-600 text-white shadow-md hover:bg-primary-700'
                      : 'bg-secondary-100 text-secondary-700 border-secondary-300 hover:bg-secondary-200 hover:border-secondary-400'
                  "
                  @click="toggleOtherCode(code)"
                >
                  {{ code }}
                </button>
              </div>
            </div>

            <!-- Empty State -->
            <div
              v-if="terminalZones.length === 0 && otherCodes.length === 0"
              class="text-center py-12"
            >
              <FunnelIcon class="h-12 w-12 text-secondary-300 mx-auto mb-3" />
              <p class="text-secondary-500">No filters available</p>
            </div>
          </div>

          <!-- Footer -->
          <div
            class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 md:p-6 border-t border-secondary-200"
          >
            <!-- Clear Filters Button -->
            <button
              class="px-3 md:px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 active:bg-red-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
              :disabled="!hasSelections"
              @click="handleClearFilters"
            >
              Clear Filters
            </button>

            <!-- Action Buttons -->
            <div class="flex gap-2 md:gap-3">
              <button
                class="px-4 md:px-6 py-2 text-sm font-medium text-secondary-700 bg-secondary-100 hover:bg-secondary-200 active:bg-secondary-300 rounded-lg transition-colors flex-1 sm:flex-none"
                @click="handleCancel"
              >
                Cancel
              </button>
              <button
                class="px-4 md:px-6 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 active:bg-primary-800 rounded-lg transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-none"
                :disabled="!hasSelections"
                @click="handleApplyFilters"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { XMarkIcon, FunnelIcon, BuildingOfficeIcon, TagIcon } from '@heroicons/vue/24/outline';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  terminalZones: {
    type: Array,
    default: () => [],
  },
  otherCodes: {
    type: Array,
    default: () => [],
  },
  currentTerminalZoneFilters: {
    type: Array,
    default: () => [],
  },
  currentOtherCodeFilters: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['close', 'apply-filters', 'clear-filters']);

// Local state for temporary selections
const selectedTerminalZones = ref([]);
const selectedOtherCodes = ref([]);

// Watch for changes in current filters when modal opens
watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      // Initialize with current filters
      selectedTerminalZones.value = [...props.currentTerminalZoneFilters];
      selectedOtherCodes.value = [...props.currentOtherCodeFilters];
    }
  }
);

const hasSelections = computed(() => {
  return selectedTerminalZones.value.length > 0 || selectedOtherCodes.value.length > 0;
});

const toggleTerminalZone = (zone) => {
  const index = selectedTerminalZones.value.indexOf(zone);
  if (index > -1) {
    selectedTerminalZones.value.splice(index, 1);
  } else {
    selectedTerminalZones.value.push(zone);
  }
};

const toggleOtherCode = (code) => {
  const index = selectedOtherCodes.value.indexOf(code);
  if (index > -1) {
    selectedOtherCodes.value.splice(index, 1);
  } else {
    selectedOtherCodes.value.push(code);
  }
};

const handleApplyFilters = () => {
  emit('apply-filters', {
    terminalZones: [...selectedTerminalZones.value],
    otherCodes: [...selectedOtherCodes.value],
  });
  emit('close');
};

const handleClearFilters = () => {
  selectedTerminalZones.value = [];
  selectedOtherCodes.value = [];
  emit('clear-filters');
  emit('close');
};

const handleCancel = () => {
  // Reset to current filters without applying
  selectedTerminalZones.value = [...props.currentTerminalZoneFilters];
  selectedOtherCodes.value = [...props.currentOtherCodeFilters];
  emit('close');
};
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .bg-white,
.modal-leave-to .bg-white {
  transform: scale(0.9);
  opacity: 0;
}

.modal-enter-active .bg-white,
.modal-leave-active .bg-white {
  transition: all 0.3s ease;
}
</style>
