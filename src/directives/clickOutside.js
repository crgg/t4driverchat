/**
 * Click Outside Directive
 * Detects clicks outside of an element
 */

export default {
  mounted(el, binding) {
    el.clickOutsideEvent = (event) => {
      // Check if click is outside the element
      if (!(el === event.target || el.contains(event.target))) {
        // Call the provided method
        binding.value(event);
      }
    };

    // Add event listener with a slight delay to avoid immediate triggering
    setTimeout(() => {
      document.addEventListener('click', el.clickOutsideEvent);
    }, 0);
  },

  unmounted(el) {
    document.removeEventListener('click', el.clickOutsideEvent);
  },
};
