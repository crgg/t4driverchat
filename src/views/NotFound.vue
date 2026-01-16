<template>
  <div class="min-h-screen flex items-center justify-center bg-secondary-50">
    <div class="text-center">
      <h1 class="text-9xl font-bold text-primary-600">404</h1>
      <h2 class="text-3xl font-semibold text-secondary-900 mt-4">Page Not Found</h2>
      <p class="text-secondary-600 mt-2 mb-8">The page you're looking for doesn't exist.</p>
      <router-link to="/chat" class="btn btn-primary"> Go to Chat </router-link>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import gsap from 'gsap';

onMounted(() => {
  gsap.from('h1', {
    duration: 0.8,
    scale: 0.5,
    opacity: 0,
    ease: 'back.out(1.7)',
  });

  gsap.from('h2, p, a', {
    duration: 0.6,
    y: 20,
    opacity: 0,
    stagger: 0.1,
    delay: 0.3,
    ease: 'power3.out',
  });
});
</script>
