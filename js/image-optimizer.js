/**
 * Image Optimizer for deTravelCafé
 * Improves performance by optimizing how images are loaded and displayed
 */

document.addEventListener('DOMContentLoaded', function() {
  // Configuration
  const config = {
    lazyLoadThreshold: 0.01,
    lazyLoadMargin: '300px 0px',
    placeholderColor: '#e0e0e0',
    lowQualityPreview: true,
    prioritySelectors: ['.hero-bg', '.logo', '.featured-image']
  };

  // Set fetchpriority="high" for important above-the-fold images
  function setPriorityOnCriticalImages() {
    config.prioritySelectors.forEach(selector => {
      const images = document.querySelectorAll(`${selector} img, ${selector}`);
      images.forEach(img => {
        if (img.tagName === 'IMG') {
          img.setAttribute('fetchpriority', 'high');
          // Also ensure they're not lazy loaded
          img.removeAttribute('loading');
          img.removeAttribute('data-src');
          // If it was previously set up for lazy loading, restore the src
          if (img.dataset.src && !img.src) {
            img.src = img.dataset.src;
          }
        }
      });
    });
  }

  // Create low-quality image previews for better perceived performance
  function createLowQualityPreviews() {
    if (!config.lowQualityPreview) return;
    
    const images = document.querySelectorAll('img[data-src]:not([data-lqip])');
    images.forEach(img => {
      // Skip small images
      if (img.width < 100 || img.height < 100) return;
      
      // Create a canvas for the low-quality preview
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Set small dimensions for the preview
      canvas.width = 20;
      canvas.height = 20;
      
      // Fill with placeholder color
      ctx.fillStyle = config.placeholderColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Create a temporary image to generate the preview
      const tempImg = new Image();
      tempImg.crossOrigin = 'anonymous';
      tempImg.src = img.dataset.src;
      
      tempImg.onload = function() {
        // Draw the image at low resolution
        ctx.drawImage(tempImg, 0, 0, canvas.width, canvas.height);
        
        // Set the low-quality preview as the src
        try {
          const dataURL = canvas.toDataURL('image/jpeg', 0.1);
          img.src = dataURL;
          img.dataset.lqip = 'true';
          img.style.filter = 'blur(10px)';
          
          // When the full image loads, remove the blur
          img.onload = function() {
            if (this.src !== dataURL) {
              this.style.filter = 'none';
              this.style.transition = 'filter 0.3s ease-out';
            }
          };
        } catch (e) {
          // If CORS issues prevent canvas usage, use a simple color placeholder
          img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3Crect width="1" height="1" fill="%23e0e0e0"/%3E%3C/svg%3E';
        }
      };
      
      tempImg.onerror = function() {
        // If loading fails, use a simple color placeholder
        img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3Crect width="1" height="1" fill="%23e0e0e0"/%3E%3C/svg%3E';
      };
    });
  }

  // Enhanced lazy loading with IntersectionObserver
  function setupEnhancedLazyLoading() {
    if (!('IntersectionObserver' in window)) return;
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          
          if (img.dataset.src) {
            // Create a new image to preload
            const preloadImg = new Image();
            preloadImg.onload = function() {
              // Once preloaded, set the src on the actual image
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
              img.style.filter = 'none';
            };
            preloadImg.onerror = function() {
              // If loading fails, try a fallback or show error placeholder
              if (img.dataset.fallback) {
                img.src = img.dataset.fallback;
              } else {
                img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3Crect width="1" height="1" fill="%23f44336"/%3E%3C/svg%3E';
              }
              img.removeAttribute('data-src');
            };
            preloadImg.src = img.dataset.src;
            
            // Stop observing this image
            observer.unobserve(img);
          }
        }
      });
    }, {
      rootMargin: config.lazyLoadMargin,
      threshold: config.lazyLoadThreshold
    });
    
    // Observe all images with data-src
    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });
  }

  // Prevent layout shifts by setting dimensions on images
  function preventLayoutShifts() {
    const images = document.querySelectorAll('img:not([width]):not([height])');
    images.forEach(img => {
      // If the image is already loaded, use its natural dimensions
      if (img.complete && img.naturalWidth > 0) {
        img.setAttribute('width', img.naturalWidth);
        img.setAttribute('height', img.naturalHeight);
      } 
      // Otherwise, set a default aspect ratio using CSS
      else {
        img.style.aspectRatio = '16/9';
      }
    });
  }

  // Initialize all optimizations
  function init() {
    setPriorityOnCriticalImages();
    createLowQualityPreviews();
    setupEnhancedLazyLoading();
    preventLayoutShifts();
  }

  // Run optimizations
  init();
});
