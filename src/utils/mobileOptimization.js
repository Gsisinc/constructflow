/**
 * Mobile Optimization Utilities
 * Provides utilities for responsive design and mobile-first development
 */

/**
 * Breakpoints for responsive design
 */
export const BREAKPOINTS = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
};

/**
 * Get current breakpoint
 * @returns {string} Current breakpoint name
 */
export function getCurrentBreakpoint() {
  const width = typeof window !== 'undefined' ? window.innerWidth : 0;
  
  if (width >= BREAKPOINTS['2xl']) return '2xl';
  if (width >= BREAKPOINTS.xl) return 'xl';
  if (width >= BREAKPOINTS.lg) return 'lg';
  if (width >= BREAKPOINTS.md) return 'md';
  if (width >= BREAKPOINTS.sm) return 'sm';
  return 'xs';
}

/**
 * Check if current viewport is mobile
 * @returns {boolean} True if viewport is mobile (< 768px)
 */
export function isMobile() {
  return typeof window !== 'undefined' && window.innerWidth < BREAKPOINTS.md;
}

/**
 * Check if current viewport is tablet
 * @returns {boolean} True if viewport is tablet (768px - 1024px)
 */
export function isTablet() {
  if (typeof window === 'undefined') return false;
  const width = window.innerWidth;
  return width >= BREAKPOINTS.md && width < BREAKPOINTS.lg;
}

/**
 * Check if current viewport is desktop
 * @returns {boolean} True if viewport is desktop (>= 1024px)
 */
export function isDesktop() {
  return typeof window !== 'undefined' && window.innerWidth >= BREAKPOINTS.lg;
}

/**
 * Use responsive hook for breakpoint changes
 * @param {Function} callback - Function to call on breakpoint change
 * @returns {void}
 */
export function useResponsive(callback) {
  if (typeof window === 'undefined') return;

  const handleResize = () => {
    callback(getCurrentBreakpoint());
  };

  window.addEventListener('resize', handleResize);
  
  return () => {
    window.removeEventListener('resize', handleResize);
  };
}

/**
 * Get responsive class names based on current breakpoint
 * @param {Object} classes - Object with breakpoint keys and class values
 * @returns {string} Appropriate class names for current breakpoint
 */
export function getResponsiveClasses(classes) {
  const breakpoint = getCurrentBreakpoint();
  
  // Find the best matching breakpoint
  const breakpointOrder = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
  const currentIndex = breakpointOrder.indexOf(breakpoint);
  
  for (let i = currentIndex; i >= 0; i--) {
    const bp = breakpointOrder[i];
    if (classes[bp]) {
      return classes[bp];
    }
  }
  
  return '';
}

/**
 * Get responsive grid columns
 * @param {Object} options - Options for grid configuration
 * @returns {Object} Grid configuration for current breakpoint
 */
export function getResponsiveGrid(options = {}) {
  const breakpoint = getCurrentBreakpoint();
  
  const defaults = {
    xs: 1,
    sm: 1,
    md: 2,
    lg: 3,
    xl: 4,
    '2xl': 4
  };
  
  const config = { ...defaults, ...options };
  
  return {
    cols: config[breakpoint],
    gap: options.gap || 'gap-4'
  };
}

/**
 * Optimize image for mobile
 * @param {string} src - Original image source
 * @param {Object} options - Image optimization options
 * @returns {Object} Optimized image configuration
 */
export function optimizeImageForMobile(src, options = {}) {
  const breakpoint = getCurrentBreakpoint();
  
  const defaults = {
    xs: { width: 320, quality: 70 },
    sm: { width: 480, quality: 75 },
    md: { width: 768, quality: 80 },
    lg: { width: 1024, quality: 85 },
    xl: { width: 1280, quality: 90 },
    '2xl': { width: 1536, quality: 95 }
  };
  
  const config = { ...defaults, ...options };
  const optimization = config[breakpoint];
  
  return {
    src,
    width: optimization.width,
    quality: optimization.quality,
    loading: 'lazy',
    decoding: 'async'
  };
}

/**
 * Get responsive padding
 * @returns {string} Padding classes for current breakpoint
 */
export function getResponsivePadding() {
  const breakpoint = getCurrentBreakpoint();
  
  const padding = {
    xs: 'p-3',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-8',
    '2xl': 'p-8'
  };
  
  return padding[breakpoint] || 'p-4';
}

/**
 * Get responsive font size
 * @returns {string} Font size classes for current breakpoint
 */
export function getResponsiveFontSize() {
  const breakpoint = getCurrentBreakpoint();
  
  const fontSize = {
    xs: 'text-sm',
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
    xl: 'text-2xl',
    '2xl': 'text-3xl'
  };
  
  return fontSize[breakpoint] || 'text-base';
}

/**
 * Get responsive heading size
 * @returns {string} Heading size classes for current breakpoint
 */
export function getResponsiveHeadingSize() {
  const breakpoint = getCurrentBreakpoint();
  
  const headingSize = {
    xs: 'text-lg',
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-4xl',
    '2xl': 'text-5xl'
  };
  
  return headingSize[breakpoint] || 'text-2xl';
}

/**
 * Get responsive container width
 * @returns {string} Container width classes for current breakpoint
 */
export function getResponsiveContainerWidth() {
  const breakpoint = getCurrentBreakpoint();
  
  const width = {
    xs: 'w-full px-3',
    sm: 'w-full px-4',
    md: 'w-full px-6',
    lg: 'max-w-7xl mx-auto px-8',
    xl: 'max-w-7xl mx-auto px-8',
    '2xl': 'max-w-7xl mx-auto px-8'
  };
  
  return width[breakpoint] || 'w-full px-4';
}

/**
 * Check if touch device
 * @returns {boolean} True if device supports touch
 */
export function isTouchDevice() {
  if (typeof window === 'undefined') return false;
  return (
    (typeof window !== 'undefined' && 'ontouchstart' in window) ||
    (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0) ||
    (typeof navigator !== 'undefined' && navigator.msMaxTouchPoints > 0)
  );
}

/**
 * Get optimal touch target size
 * @returns {number} Minimum touch target size in pixels (44px recommended)
 */
export function getOptimalTouchTargetSize() {
  return isTouchDevice() ? 44 : 32;
}

/**
 * Debounce function for resize events
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait = 250) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function for scroll events
 * @param {Function} func - Function to throttle
 * @param {number} limit - Throttle limit in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func, limit = 250) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export default {
  BREAKPOINTS,
  getCurrentBreakpoint,
  isMobile,
  isTablet,
  isDesktop,
  useResponsive,
  getResponsiveClasses,
  getResponsiveGrid,
  optimizeImageForMobile,
  getResponsivePadding,
  getResponsiveFontSize,
  getResponsiveHeadingSize,
  getResponsiveContainerWidth,
  isTouchDevice,
  getOptimalTouchTargetSize,
  debounce,
  throttle
};
