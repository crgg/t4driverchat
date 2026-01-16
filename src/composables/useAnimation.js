/**
 * Animation Composable
 * Provides reusable GSAP animations
 */

import gsap from 'gsap';

export function useAnimation() {
  /**
   * Fade in animation
   * @param {HTMLElement|string} target
   * @param {Object} options
   */
  const fadeIn = (target, options = {}) => {
    return gsap.from(target, {
      duration: 0.5,
      opacity: 0,
      ease: 'power2.out',
      ...options,
    });
  };

  /**
   * Fade out animation
   * @param {HTMLElement|string} target
   * @param {Object} options
   */
  const fadeOut = (target, options = {}) => {
    return gsap.to(target, {
      duration: 0.5,
      opacity: 0,
      ease: 'power2.in',
      ...options,
    });
  };

  /**
   * Slide in from left
   * @param {HTMLElement|string} target
   * @param {Object} options
   */
  const slideInLeft = (target, options = {}) => {
    return gsap.from(target, {
      duration: 0.6,
      x: -100,
      opacity: 0,
      ease: 'power3.out',
      ...options,
    });
  };

  /**
   * Slide in from right
   * @param {HTMLElement|string} target
   * @param {Object} options
   */
  const slideInRight = (target, options = {}) => {
    return gsap.from(target, {
      duration: 0.6,
      x: 100,
      opacity: 0,
      ease: 'power3.out',
      ...options,
    });
  };

  /**
   * Slide in from top
   * @param {HTMLElement|string} target
   * @param {Object} options
   */
  const slideInTop = (target, options = {}) => {
    return gsap.from(target, {
      duration: 0.6,
      y: -100,
      opacity: 0,
      ease: 'power3.out',
      ...options,
    });
  };

  /**
   * Slide in from bottom
   * @param {HTMLElement|string} target
   * @param {Object} options
   */
  const slideInBottom = (target, options = {}) => {
    return gsap.from(target, {
      duration: 0.6,
      y: 100,
      opacity: 0,
      ease: 'power3.out',
      ...options,
    });
  };

  /**
   * Scale in animation
   * @param {HTMLElement|string} target
   * @param {Object} options
   */
  const scaleIn = (target, options = {}) => {
    return gsap.from(target, {
      duration: 0.5,
      scale: 0,
      opacity: 0,
      ease: 'back.out(1.7)',
      ...options,
    });
  };

  /**
   * Bounce in animation
   * @param {HTMLElement|string} target
   * @param {Object} options
   */
  const bounceIn = (target, options = {}) => {
    return gsap.from(target, {
      duration: 0.8,
      scale: 0.3,
      opacity: 0,
      ease: 'elastic.out(1, 0.5)',
      ...options,
    });
  };

  /**
   * Stagger animation for lists
   * @param {string} selector
   * @param {Object} options
   */
  const staggerIn = (selector, options = {}) => {
    return gsap.from(selector, {
      duration: 0.5,
      y: 50,
      opacity: 0,
      stagger: 0.1,
      ease: 'power3.out',
      ...options,
    });
  };

  /**
   * Pulse animation
   * @param {HTMLElement|string} target
   * @param {Object} options
   */
  const pulse = (target, options = {}) => {
    return gsap.to(target, {
      duration: 0.3,
      scale: 1.1,
      repeat: 1,
      yoyo: true,
      ease: 'power2.inOut',
      ...options,
    });
  };

  /**
   * Shake animation
   * @param {HTMLElement|string} target
   * @param {Object} options
   */
  const shake = (target, options = {}) => {
    return gsap.to(target, {
      duration: 0.1,
      x: -10,
      repeat: 5,
      yoyo: true,
      ease: 'power2.inOut',
      ...options,
    });
  };

  /**
   * Rotate animation
   * @param {HTMLElement|string} target
   * @param {Object} options
   */
  const rotate = (target, options = {}) => {
    return gsap.to(target, {
      duration: 0.5,
      rotation: 360,
      ease: 'power2.inOut',
      ...options,
    });
  };

  /**
   * Create a timeline
   */
  const timeline = (options = {}) => {
    return gsap.timeline(options);
  };

  return {
    fadeIn,
    fadeOut,
    slideInLeft,
    slideInRight,
    slideInTop,
    slideInBottom,
    scaleIn,
    bounceIn,
    staggerIn,
    pulse,
    shake,
    rotate,
    timeline,
  };
}
