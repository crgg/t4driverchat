<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      @click.self="close"
    >
      <div class="relative w-full max-w-6xl h-[90vh] bg-white rounded-lg shadow-2xl flex flex-col">
        <button
          class="absolute -top-3 -right-3 w-10 h-10 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors z-10"
          @click="close"
        >
          <XMarkIcon class="h-6 w-6" />
        </button>

        <div v-if="filename" class="px-6 py-3 border-b border-secondary-200 bg-secondary-50">
          <h3 class="text-lg font-semibold text-secondary-900">{{ filename }}</h3>
        </div>

        <div class="flex-1 overflow-hidden relative bg-secondary-100">
          <div
            v-if="loading"
            class="absolute inset-0 flex items-center justify-center z-20 bg-secondary-100"
          >
            <div class="text-center">
              <div class="spinner mx-auto mb-3"></div>
              <p class="text-secondary-600">Loading PDF...</p>
            </div>
          </div>

          <iframe
            v-if="!loadError"
            :src="pdfBlobUrl"
            class="w-full h-full border-0"
            @load="onPdfLoad"
            @error="handleLoadError"
          ></iframe>

          <div v-if="loadError" class="absolute inset-0 flex items-center justify-center bg-white">
            <div class="text-center p-6">
              <p class="text-red-600 mb-4">There was an error loading the PDF.</p>
              <a
                :href="pdfBlobUrl"
                :download="filename"
                class="inline-block px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Download PDF
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue';
import { XMarkIcon } from '@heroicons/vue/24/outline';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  pdfUrl: {
    type: String,
    required: true,
  },
  filename: {
    type: String,
    default: 'Document.pdf',
  },
  isBase64: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(['update:modelValue']);

const loading = ref(true);
const loadError = ref(false);
const blobUrl = ref(null);
let loadingTimeout = null;

// Computed property without side effects
const pdfBlobUrl = computed(() => {
  if (!props.isBase64) {
    return props.pdfUrl;
  }
  return blobUrl.value || props.pdfUrl;
});

// Convert base64 to blob URL
const convertToBlob = () => {
  if (!props.isBase64 || !props.pdfUrl) {
    return;
  }

  try {
    let base64Data = props.pdfUrl;

    if (base64Data.startsWith('data:application/pdf;base64,')) {
      base64Data = base64Data.split(',')[1];
    }

    const binaryString = window.atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const blob = new Blob([bytes], { type: 'application/pdf' });
    blobUrl.value = URL.createObjectURL(blob);
  } catch (error) {
    console.error('Error converting PDF to blob URL:', error);
    loadError.value = true;
  }
};

const close = () => {
  emit('update:modelValue', false);
};

const onPdfLoad = () => {
  loading.value = false;
  if (loadingTimeout) {
    clearTimeout(loadingTimeout);
    loadingTimeout = null;
  }
};

const handleLoadError = () => {
  loading.value = false;
  loadError.value = true;
  console.error('Failed to load PDF');
  if (loadingTimeout) {
    clearTimeout(loadingTimeout);
    loadingTimeout = null;
  }
};

onBeforeUnmount(() => {
  if (blobUrl.value) {
    URL.revokeObjectURL(blobUrl.value);
  }
  if (loadingTimeout) {
    clearTimeout(loadingTimeout);
    loadingTimeout = null;
  }
});

// Watch for modal opening to convert PDF and setup loading timeout
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue) {
      loading.value = true;
      loadError.value = false;

      // Convert PDF to blob if needed
      convertToBlob();

      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
      }

      loadingTimeout = setTimeout(() => {
        loading.value = false;
        console.log('PDF loading timeout reached, hiding loader');
      }, 2000);
    } else {
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
        loadingTimeout = null;
      }
    }
  }
);

// Watch for PDF URL changes
watch(
  () => props.pdfUrl,
  () => {
    // Clean up old blob URL
    if (blobUrl.value) {
      URL.revokeObjectURL(blobUrl.value);
      blobUrl.value = null;
    }
    // Convert new PDF
    if (props.modelValue) {
      convertToBlob();
    }
  }
);
</script>

<style scoped>
.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
