/**
 * CLS Optimizer for deTravelCafé
 * Reduces Cumulative Layout Shift by pre-calculating image dimensions and reserving space
 */

(function() {
  // Configuration
  const config = {
    selectors: {
      images: 'img:not([width]):not([height])',
      heroImages: '.hero-bg, .featured-image',
      lazyImages: 'img[loading="lazy"], img[data-src]',
      iframes: 'iframe:not([width]):not([height])',
      dynamicContent: '.dynamic-content'
    },
    defaultAspectRatio: '16/9',
    placeholderColor: '#f0f0f0',
    reserveSpaceBeforeLoad: true
  };

  // Set dimensions for images to prevent layout shifts
  function setImageDimensions() {
    const images = document.querySelectorAll(config.selectors.images);
    
    images.forEach(img => {
      // Skip images that already have dimensions
      if (img.hasAttribute('width') && img.hasAttribute('height')) return;
      
      // If image is already loaded, use its natural dimensions
      if (img.complete && img.naturalWidth > 0) {
        img.setAttribute('width', img.naturalWidth);
        img.setAttribute('height', img.naturalHeight);
        return;
      }
      
      // For images that aren't loaded yet, set aspect ratio via CSS
      if (!img.style.aspectRatio) {
        img.style.aspectRatio = config.defaultAspectRatio;
      }
      
      // Reserve space for the image if configured
      if (config.reserveSpaceBeforeLoad) {
        // Store original display value
        const originalDisplay = window.getComputedStyle(img).display;
        
        // Set a minimum height to reserve space
        if (!img.style.minHeight) {
          img.style.minHeight = '10px';
        }
        
        // When the image loads, restore original display and remove min-height
        img.addEventListener('load', function() {
          if (this.hasAttribute('data-original-display')) {
            this.style.display = this.getAttribute('data-original-display');
            this.removeAttribute('data-original-display');
          }
          this.style.minHeight = '';
        });
        
        // Store original display value
        if (originalDisplay !== 'none') {
          img.setAttribute('data-original-display', originalDisplay);
        }
      }
    });
  }

  // Optimize hero images to reduce CLS
  function optimizeHeroImages() {
    const heroImages = document.querySelectorAll(config.selectors.heroImages);
    
    heroImages.forEach(img => {
      // Ensure hero images load with high priority
      img.setAttribute('fetchpriority', 'high');
      img.setAttribute('importance', 'high');
      
      // Remove lazy loading from hero images
      img.removeAttribute('loading');
      
      // If it's a background image in CSS, preload it
      if (window.getComputedStyle(img).backgroundImage !== 'none') {
        const bgUrl = window.getComputedStyle(img).backgroundImage.match(/url\(['"]?([^'"]+)['"]?\)/);
        if (bgUrl && bgUrl[1]) {
          const preloadLink = document.createElement('link');
          preloadLink.rel = 'preload';
          preloadLink.as = 'image';
          preloadLink.href = bgUrl[1];
          preloadLink.fetchpriority = 'high';
          document.head.appendChild(preloadLink);
        }
      }
    });
  }

  // Fix iframe dimensions to prevent layout shifts
  function setIframeDimensions() {
    const iframes = document.querySelectorAll(config.selectors.iframes);
    
    iframes.forEach(iframe => {
      // Skip iframes that already have dimensions
      if (iframe.hasAttribute('width') && iframe.hasAttribute('height')) return;
      
      // Set default dimensions if none are specified
      if (!iframe.style.width) iframe.style.width = '100%';
      if (!iframe.style.height) iframe.style.height = '400px';
      
      // Set aspect ratio for responsive scaling
      if (!iframe.style.aspectRatio) {
        iframe.style.aspectRatio = config.defaultAspectRatio;
      }
    });
  }

  // Handle dynamic content that might cause layout shifts
  function handleDynamicContent() {
    const dynamicElements = document.querySelectorAll(config.selectors.dynamicContent);
    
    dynamicElements.forEach(element => {
      // Set a min-height to reserve space
      if (!element.style.minHeight) {
        // Calculate a reasonable min-height based on content
        const computedStyle = window.getComputedStyle(element);
        const lineHeight = parseInt(computedStyle.lineHeight) || 20;
        const fontSize = parseInt(computedStyle.fontSize) || 16;
        
        // Estimate height based on expected content
        const estimatedLines = element.dataset.estimatedLines || 3;
        const minHeight = Math.max(lineHeight * estimatedLines, fontSize * 2);
        
        element.style.minHeight = `${minHeight}px`;
      }
    });
  }

  // Fix layout shifts caused by web fonts
  function handleFontLayoutShifts() {
    // Add a class to the document to indicate font loading status
    document.documentElement.classList.add('fonts-loading');
    
    // If Font Loading API is available, use it
    if ('fonts' in document) {
      document.fonts.ready.then(() => {
        document.documentElement.classList.remove('fonts-loading');
        document.documentElement.classList.add('fonts-loaded');
      }).catch(() => {
        document.documentElement.classList.remove('fonts-loading');
        document.documentElement.classList.add('fonts-failed');
      });
    } else {
      // Fallback for browsers without Font Loading API
      setTimeout(() => {
        document.documentElement.classList.remove('fonts-loading');
        document.documentElement.classList.add('fonts-loaded');
      }, 2000);
    }
  }

  // Initialize all optimizations
  function init() {
    // Run optimizations in order of importance for CLS
    handleFontLayoutShifts();
    setImageDimensions();
    optimizeHeroImages();
    setIframeDimensions();
    handleDynamicContent();
    
    // Re-run on window resize for responsive layouts
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        setImageDimensions();
        setIframeDimensions();
      }, 250);
    });
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
