<template>
  <div class="tooltip-wrapper" @mouseenter="show = true" @mouseleave="show = false">
    <!-- Trigger content (slot) -->
    <slot></slot>

    <!-- Tooltip content -->
    <Teleport to="body">
      <Transition name="tooltip-fade">
        <div
          v-if="show && text"
          ref="tooltipRef"
          class="tooltip-content"
          :class="[`tooltip-${position}`, tooltipClass]"
          :style="tooltipStyle"
          role="tooltip"
        >
          {{ text }}
          <div class="tooltip-arrow" :class="`arrow-${position}`"></div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue';

const props = defineProps({
  text: {
    type: String,
    default: '',
  },
  position: {
    type: String,
    default: 'top',
    validator: (value) => ['top', 'bottom', 'left', 'right'].includes(value),
  },
  tooltipClass: {
    type: String,
    default: '',
  },
  delay: {
    type: Number,
    default: 0,
  },
});

const show = ref(false);
const tooltipRef = ref(null);
const tooltipStyle = ref({});

const updatePosition = async () => {
  if (!show.value) return;

  await nextTick();

  const wrapper = tooltipRef.value?.parentElement?.parentElement?.querySelector('.tooltip-wrapper');
  if (!wrapper || !tooltipRef.value) return;

  const rect = wrapper.getBoundingClientRect();
  const tooltipRect = tooltipRef.value.getBoundingClientRect();
  const gap = 8; // Distance from trigger

  let top = 0;
  let left = 0;

  switch (props.position) {
    case 'top':
      top = rect.top - tooltipRect.height - gap;
      left = rect.left + rect.width / 2 - tooltipRect.width / 2;
      break;
    case 'bottom':
      top = rect.bottom + gap;
      left = rect.left + rect.width / 2 - tooltipRect.width / 2;
      break;
    case 'left':
      top = rect.top + rect.height / 2 - tooltipRect.height / 2;
      left = rect.left - tooltipRect.width - gap;
      break;
    case 'right':
      top = rect.top + rect.height / 2 - tooltipRect.height / 2;
      left = rect.right + gap;
      break;
  }

  // Keep tooltip within viewport
  const padding = 8;
  if (left < padding) left = padding;
  if (left + tooltipRect.width > window.innerWidth - padding) {
    left = window.innerWidth - tooltipRect.width - padding;
  }
  if (top < padding) top = padding;
  if (top + tooltipRect.height > window.innerHeight - padding) {
    top = window.innerHeight - tooltipRect.height - padding;
  }

  tooltipStyle.value = {
    position: 'fixed',
    top: `${top}px`,
    left: `${left}px`,
    zIndex: 9999,
  };
};

watch(show, async (newVal) => {
  if (newVal) {
    await nextTick();
    updatePosition();
  }
});
</script>

<style scoped>
.tooltip-wrapper {
  display: inline-block;
  position: relative;
}

.tooltip-content {
  @apply bg-secondary-800 text-white text-xs font-medium px-3 py-2 rounded-lg shadow-lg;
  max-width: 200px;
  word-wrap: break-word;
  pointer-events: none;
  white-space: nowrap;
}

.tooltip-arrow {
  position: absolute;
  width: 0;
  height: 0;
  border-style: solid;
}

/* Arrow positions */
.arrow-top {
  bottom: -4px;
  left: 50%;
  transform: translateX(-50%);
  border-width: 4px 4px 0 4px;
  border-color: theme('colors.secondary.800') transparent transparent transparent;
}

.arrow-bottom {
  top: -4px;
  left: 50%;
  transform: translateX(-50%);
  border-width: 0 4px 4px 4px;
  border-color: transparent transparent theme('colors.secondary.800') transparent;
}

.arrow-left {
  right: -4px;
  top: 50%;
  transform: translateY(-50%);
  border-width: 4px 0 4px 4px;
  border-color: transparent transparent transparent theme('colors.secondary.800');
}

.arrow-right {
  left: -4px;
  top: 50%;
  transform: translateY(-50%);
  border-width: 4px 4px 4px 0;
  border-color: transparent theme('colors.secondary.800') transparent transparent;
}

/* Fade transition */
.tooltip-fade-enter-active,
.tooltip-fade-leave-active {
  transition: opacity 0.2s ease;
}

.tooltip-fade-enter-from,
.tooltip-fade-leave-to {
  opacity: 0;
}
</style>
