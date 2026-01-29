<template>
  <div class="min-h-screen flex items-center justify-center bg-[#f1f1f1] px-4">
    <div class="max-w-md w-full">
      <!-- Logo/Brand -->
      <div class="text-center mb-8 text-gray-500 space-y-4">
        <h1 class="text-4xl font-bold mb-2">
          {{ config.app.name }}
        </h1>
        <LoadingSpinner size="sm" />
        <p>Loading...</p>
      </div>

      <!-- Login Form Card -->
      <!-- <div class="card p-8">
        <form class="space-y-6" @submit.prevent="handleSubmit">
          <div>
            <label for="email" class="block text-sm font-medium text-secondary-700 mb-2">
              Email
            </label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              required
              class="input-field"
              :class="{ 'border-red-500': errors.email }"
              placeholder="Enter your email"
              :disabled="loading"
            />
            <p v-if="errors.email" class="mt-1 text-sm text-red-600">
              {{ errors.email }}
            </p>
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-secondary-700 mb-2">
              Password
            </label>
            <div class="relative">
              <input
                id="password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                required
                class="input-field pr-10"
                :class="{ 'border-red-500': errors.password }"
                placeholder="Enter your password"
                :disabled="loading"
              />
              <button
                type="button"
                class="absolute inset-y-0 right-0 pr-3 flex items-center"
                :disabled="loading"
                @click="showPassword = !showPassword"
              >
                <EyeIcon v-if="!showPassword" class="h-5 w-5 text-secondary-400" />
                <EyeSlashIcon v-else class="h-5 w-5 text-secondary-400" />
              </button>
            </div>
            <p v-if="errors.password" class="mt-1 text-sm text-red-600">
              {{ errors.password }}
            </p>
          </div>

          <div v-if="errors.general" class="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p class="text-sm text-red-800">
              {{ errors.general }}
            </p>
          </div>

          <button type="submit" class="w-full btn btn-primary py-3 text-lg" :disabled="loading">
            <span v-if="!loading">Sign In</span>
            <span v-else class="flex items-center justify-center">
              <svg
                class="animate-spin h-5 w-5 mr-2"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Signing in...
            </span>
          </button>
        </form>
      </div> -->
    </div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount } from 'vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import config from '@/config';
// import { useRouter, useRoute } from 'vue-router';
// import { useAuthStore } from '@/stores/auth';
// import { EyeIcon, EyeSlashIcon } from '@heroicons/vue/24/outline';

// import gsap from 'gsap';

// const router = useRouter();
// const route = useRoute();
// const authStore = useAuthStore();

// const form = reactive({
//   email: '',
//   password: '',
// });

// const errors = reactive({
//   email: '',
//   password: '',
//   general: '',
// });

// const showPassword = ref(false);
// const loading = ref(false);

let redirectTimeout = null;

onMounted(() => {
  redirectTimeout = setTimeout(() => {
    window.location.href = `${config.api.baseUrl}/dashboard`;
  }, 3000);
});

onBeforeUnmount(() => {
  if (redirectTimeout) {
    clearTimeout(redirectTimeout);
  }
});
</script>
