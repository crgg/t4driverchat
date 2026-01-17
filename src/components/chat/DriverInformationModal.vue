<template>
  <div v-if="!!information" class="text-sm space-y-3">
    <div v-if="information.DRIVER_ID">
      <span class="inline-block text-right" style="width: 100px">DRIVER ID: </span>
      <strong class="ml-2">{{ information.DRIVER_ID }}</strong>
    </div>
    <div v-if="information.NAME">
      <span class="inline-block text-right" style="width: 100px">Driver Name: </span>
      <strong class="ml-2">{{ information.NAME }}</strong>
    </div>
    <div>
      <span class="inline-block text-right" style="width: 100px">Terminal Zone: </span>
      <strong class="ml-2">{{ information.TERMINAL_ZONE || '-' }}</strong>
    </div>
    <div>
      <span class="inline-block text-right" style="width: 100px">Other Code: </span>
      <strong class="ml-2">{{ information.OTHER_CODE || '-' }}</strong>
    </div>
    <div>
      <span class="inline-block text-right" style="width: 100px">Status: </span>
      <strong class="ml-2">{{ information.STATUS || '-' }}</strong>
    </div>
    <div>
      <span class="inline-block text-right" style="width: 100px">Export Code: </span>
      <strong class="ml-2">{{ information.EXPORT_CODE || '-' }}</strong>
    </div>
    <div>
      <span class="inline-block text-right" style="width: 100px">Driver Type: </span>
      <strong class="ml-2">{{ information.DRIVER_TYPE || '-' }}</strong>
    </div>
    <div>
      <span class="inline-block text-right" style="width: 100px">Allow Loc.: </span>
      <strong class="ml-2">{{ information.device?.allow_location || '-' }}</strong>
    </div>
    <div>
      <span class="inline-block text-right" style="width: 100px">Allow Not.: </span>
      <strong class="ml-2">
        {{ information.device?.allow_notification || '-' }}
      </strong>
    </div>
    <div>
      <span class="inline-block text-right" style="width: 100px">Company ID: </span>
      <strong class="ml-2">{{ information.device?.company_id || '-' }}</strong>
    </div>
    <div>
      <span class="inline-block text-right" style="width: 100px">Version: </span>
      <strong class="ml-2">{{ information.device?.phone_version || '-' }}</strong>
    </div>
    <div class="flex items-center gap-2">
      <span class="inline-block text-right" style="width: 100px">Battery Level:</span>
      <template v-if="hasDevice">
        <component
          :is="getBatteryIcon(information.device?.battery_level)"
          class="ml-2 h-6 w-6"
          :class="batteryIconClass"
        />
        <strong>{{ information.device?.battery_level || '-' }}</strong>
      </template>
      <span v-else class="ml-2">-</span>
    </div>
    <div>
      <span class="inline-block text-right" style="width: 100px">Battery State:</span>
      <strong class="ml-2">
        {{ information.device?.battery_state || '-' }}
      </strong>
    </div>
    <div>
      <span class="inline-block text-right" style="width: 100px">Address: </span>
      <strong class="ml-2">{{ information.device?.address || '-' }}</strong>
    </div>
    <div>
      <span class="inline-block text-right" style="width: 100px">Latitude: </span>
      <strong class="ml-2">{{ information.device?.latitude || '-' }}</strong>
    </div>
    <div>
      <span class="inline-block text-right" style="width: 100px">Longitude: </span>
      <strong class="ml-2">{{ information.device?.longitud || '-' }}</strong>
    </div>
    <div v-if="information.CURRENT_TRIP">
      <span class="inline-block text-right" style="width: 100px">Curr. Trip: </span>
      <strong class="ml-2">{{ information.CURRENT_TRIP || '-' }}</strong>
    </div>
    <div v-if="information.NEXT_TRIP">
      <span class="inline-block text-right" style="width: 100px">Next Trip: </span>
      <strong class="ml-2">{{ information.NEXT_TRIP || '-' }}</strong>
    </div>
    <div>
      <span class="inline-block text-right" style="width: 100px">Session: </span>
      <strong class="ml-2">{{ information.session?.id || '-' }}</strong>
    </div>
    <div>
      <span class="inline-block text-right" style="width: 100px">GPS ZONE: </span>
      <strong class="ml-2">{{ information.device?.gps_zone || '-' }}</strong>
    </div>
    <div>
      <span class="inline-block text-right" style="width: 100px">Phone Date: </span>
      <strong class="ml-2">
        {{ formatDateWithMultipleFormats(information.device?.phonedata) }}
      </strong>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import moment from 'moment';
import { Battery100Icon, Battery50Icon, Battery0Icon } from '@heroicons/vue/24/solid';

import { useChatStore } from '@/stores/chat';
// const props = defineProps({
const chatStore = useChatStore();
const { currentRoom, deviceInformation } = storeToRefs(chatStore);

const information = computed(() => {
  if (!currentRoom.value?.contact) return null;
  const driverId = currentRoom.value.contact.DRIVER_ID;
  return {
    ...currentRoom.value.contact,
    device: deviceInformation.value.get(driverId),
  };
});

const hasDevice = computed(() => !!information.value?.device);

const formatDateWithMultipleFormats = (dateString) => {
  if (!dateString) return '-';
  const dateparse = moment.utc(dateString);
  if (dateparse.isValid()) {
    return moment.utc(dateString).format('ddd, D MMM YYYY hh:mm a');
  }
  return 'Date No valid!';
};

const getBatteryIcon = (batteryLevel) => {
  if (batteryLevel <= 20) {
    return Battery0Icon;
  } else if (batteryLevel <= 50) {
    return Battery50Icon;
  } else {
    return Battery100Icon;
  }
};

const batteryIconClass = computed(() => {
  const level = parseInt(information.value?.device?.battery_level);
  if (isNaN(level)) return 'text-secondary-500';

  if (level <= 20) {
    return 'text-red-500';
  } else if (level <= 50) {
    return 'text-yellow-500';
  } else {
    return 'text-green-500';
  }
});
</script>
