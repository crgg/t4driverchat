/**
 * Lazy Load Image Directive
 * Lazy loads images when they enter viewport
 */

const loadImage = (el, binding) => {
  const imageUrl = binding.value;

  if (!imageUrl) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = new Image();
        img.src = imageUrl;

        img.onload = () => {
          el.src = imageUrl;
          el.classList.remove('lazy-loading');
          el.classList.add('lazy-loaded');
        };

        img.onerror = () => {
          el.src = '/placeholder.png'; // Fallback image
          el.classList.add('lazy-error');
        };

        observer.unobserve(el);
      }
    });
  });

  observer.observe(el);
  el.classList.add('lazy-loading');
};

export default {
  mounted(el, binding) {
    loadImage(el, binding);
  },

  updated(el, binding) {
    if (binding.value !== binding.oldValue) {
      loadImage(el, binding);
    }
  },
};
