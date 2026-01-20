<template>
  <div
    class="pdf-thumbnail-container"
    @click="$emit('click')"
    :style="{ width: '100%', minHeight: '100%' }"
  >
    <!-- Loading spinner overlay -->
    <div
      v-if="isLoading"
      class="loading-overlay"
      :style="{ width: '100%', minHeight: thumbnailSize + 'px', height: thumbnailSize + 'px' }"
    >
      <div class="spinner"></div>
      <div class="loading-text">Loading PDF...</div>
    </div>
    <canvas ref="pdfCanvas" class="thumbnail-canvas"></canvas>
    <div class="pdf-label">{{ filename }}</div>
  </div>
</template>

<script setup>
import { ref, shallowRef, onMounted, onBeforeUnmount } from 'vue';

const props = defineProps({
  pdfUrl: {
    type: String,
    required: true,
  },
  thumbnailSize: {
    type: Number,
    default: 110,
  },
  filename: {
    type: String,
    default: 'Document.pdf',
  },
});

const emit = defineEmits(['click']);

const pdfCanvas = ref(null);
const isLoading = ref(true);
const pdfDoc = shallowRef(null);
const blobUrl = ref(null);
let pdfjsLib = null;

onMounted(async () => {
  if (window.pdfjsLib) {
    pdfjsLib = window.pdfjsLib;
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
    }
    // Wait a bit to ensure worker is ready
    await new Promise((resolve) => setTimeout(resolve, 100));
    loadPdf();
  } else {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js';
    script.onload = async () => {
      pdfjsLib = window.pdfjsLib;
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
      // Wait a bit to ensure worker is ready
      await new Promise((resolve) => setTimeout(resolve, 100));
      loadPdf();
    };
    script.onerror = () => {
      console.error('Failed to load PDF.js library');
      isLoading.value = false;
    };
    document.head.appendChild(script);
  }
});

onBeforeUnmount(() => {
  // Clean up blob URL if created
  if (blobUrl.value) {
    URL.revokeObjectURL(blobUrl.value);
  }

  // Clean up PDF document
  if (pdfDoc.value) {
    pdfDoc.value.destroy();
  }
});

const loadPdf = async () => {
  if (!pdfjsLib) {
    console.error('PDF.js library not loaded');
    isLoading.value = false;
    return;
  }

  isLoading.value = true;
  try {
    const pdfUrl = props.pdfUrl;
    let finalUrl = pdfUrl;

    // Always convert data URLs to blob URLs for better compatibility with PDF.js
    if (pdfUrl.startsWith('data:')) {
      try {
        let blob;

        if (pdfUrl.startsWith('data:application/pdf;base64,')) {
          // Extract and convert base64 to blob
          const base64Data = pdfUrl.split(',')[1];
          const binaryString = window.atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          blob = new Blob([bytes], { type: 'application/pdf' });
        } else {
          // Fetch and convert other data URLs
          const response = await fetch(pdfUrl);
          blob = await response.blob();
        }

        // Create blob URL
        blobUrl.value = URL.createObjectURL(blob);
        finalUrl = blobUrl.value;
      } catch (error) {
        console.error('Error converting data URL to blob:', error);
        throw new Error('Failed to process PDF data');
      }
    }

    // Load PDF document using blob URL (more reliable)
    const loadingTask = pdfjsLib.getDocument({
      url: finalUrl,
      verbosity: 0, // Reduce console output
    });

    pdfDoc.value = await loadingTask.promise;

    // Verify document is loaded correctly
    if (!pdfDoc.value) {
      throw new Error('Failed to load PDF document');
    }

    // Small delay to ensure document is fully initialized
    await new Promise((resolve) => setTimeout(resolve, 50));

    await renderThumbnail();
  } catch (error) {
    console.error('Error loading PDF:', error);
    isLoading.value = false;
  } finally {
    isLoading.value = false;
  }
};

const renderThumbnail = async () => {
  const canvas = pdfCanvas.value;
  if (!canvas || !pdfDoc.value) {
    console.error('Canvas or PDF document not available');
    return;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    console.error('Could not get canvas context');
    return;
  }

  try {
    // Verify document has pages
    const numPages = pdfDoc.value.numPages;
    if (!numPages || numPages < 1) {
      throw new Error('PDF document has no pages');
    }

    // Always get the first page for thumbnail
    const page = await pdfDoc.value.getPage(1);

    if (!page) {
      throw new Error('Failed to get PDF page');
    }

    // Calculate scale to fit within thumbnail size
    const viewport = page.getViewport({ scale: 1.0 });
    const scaleFactor = props.thumbnailSize / Math.max(viewport.width, viewport.height);

    // Create a new viewport with the calculated scale
    const scaledViewport = page.getViewport({ scale: scaleFactor });

    // Set canvas dimensions to match the scaled viewport
    canvas.width = scaledViewport.width;
    canvas.height = scaledViewport.height;

    const renderContext = {
      canvasContext: ctx,
      viewport: scaledViewport,
    };

    // Render the page
    const renderTask = page.render(renderContext);
    await renderTask.promise;
  } catch (error) {
    console.error('Error rendering thumbnail:', error);
    // Show error state
    isLoading.value = false;
  }
};
</script>

<style scoped>
.pdf-thumbnail-container {
  display: inline-block;
  cursor: pointer;
  max-width: 150px;
  max-height: 150px;
  border-radius: 4px;
  overflow: hidden;
  background-color: #f5f5f5;
  position: relative;
}

.pdf-thumbnail-container:hover {
  filter: brightness(0.7);
}

.thumbnail-canvas {
  max-width: 100%;
  display: block;
  margin: 0 auto;
}

.pdf-label {
  font-size: 9px;
  text-align: center;
  margin-top: 5px;
  color: #333;
  background-color: #f5f5f5;
  padding: 5px;
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  font-weight: bold;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
}

/* Loading styles */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: rgba(245, 245, 245, 0.9);
  z-index: 10;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
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

.loading-text {
  margin-top: 8px;
  font-size: 10px;
  color: #666;
}
</style>
