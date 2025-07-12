/**
 * LCP Optimizer for deTravelCafé
 * Focuses on improving Largest Contentful Paint (LCP) metric
 */

(function() {
  // Configuration
  const config = {
    // Elements that are likely to be the LCP element
    lcpCandidateSelectors: [
      '.hero-bg',
      '.hero h1',
      '.hero-content',
      'header img',
      'main > section:first-of-type img',
      '.featured-image',
      'h1',
      'h2:first-of-type'
    ],
    // Threshold for considering an element as large (percentage of viewport)
    largeElementThreshold: 0.25,
    // Maximum time to wait for LCP (ms)
    maxWaitTime: 5000
  };

  // Find potential LCP elements
  function findLcpCandidates() {
    const candidates = [];
    
    // Check each selector
    config.lcpCandidateSelectors.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => candidates.push(element));
      } catch (e) {
        console.warn(`Error finding LCP candidates with selector ${selector}:`, e);
      }
    });
    
    return candidates;
  }

  // Calculate element size relative to viewport
  function getRelativeSize(element) {
    const rect = element.getBoundingClientRect();
    const viewportArea = window.innerWidth * window.innerHeight;
    const elementArea = rect.width * rect.height;
    
    return elementArea / viewportArea;
  }

  // Find the most likely LCP element based on size and position
  function findMostLikelyLcpElement() {
    const candidates = findLcpCandidates();
    let bestCandidate = null;
    let bestScore = 0;
    
    candidates.forEach(element => {
      // Skip hidden elements
      if (element.offsetParent === null) return;
      
      // Calculate score based on size and position
      const relativeSize = getRelativeSize(element);
      const verticalPosition = element.getBoundingClientRect().top;
      
      // Elements that are large and near the top get higher scores
      const score = relativeSize * (1 - Math.min(1, verticalPosition / window.innerHeight));
      
      if (score > bestScore) {
        bestScore = score;
        bestCandidate = element;
      }
    });
    
    return bestCandidate;
  }

  // Optimize an image element for LCP
  function optimizeImageElement(imgElement) {
    if (!imgElement) return;
    
    // Set fetchpriority to high
    imgElement.setAttribute('fetchpriority', 'high');
    
    // Remove lazy loading if it's set
    if (imgElement.hasAttribute('loading')) {
      imgElement.removeAttribute('loading');
    }
    
    // If it's using data-src (common lazy loading pattern), move to src
    if (imgElement.hasAttribute('data-src') && !imgElement.hasAttribute('src')) {
      imgElement.src = imgElement.getAttribute('data-src');
    }
    
    // Add decoding=async for better performance
    imgElement.setAttribute('decoding', 'async');
    
    // Ensure image has explicit dimensions
    if (!imgElement.hasAttribute('width') && !imgElement.hasAttribute('height')) {
      if (imgElement.naturalWidth > 0 && imgElement.naturalHeight > 0) {
        imgElement.setAttribute('width', imgElement.naturalWidth);
        imgElement.setAttribute('height', imgElement.naturalHeight);
      }
    }
    
    // If image is background image, try to preload it
    const parent = imgElement.parentElement;
    if (parent) {
      const style = window.getComputedStyle(parent);
      if (style.backgroundImage && style.backgroundImage !== 'none') {
        const match = style.backgroundImage.match(/url\(['"]?([^'"]+)['"]?\)/);
        if (match && match[1]) {
          const link = document.createElement('link');
          link.rel = 'preload';
          link.as = 'image';
          link.href = match[1];
          link.fetchpriority = 'high';
          document.head.appendChild(link);
        }
      }
    }
  }

  // Optimize text element for LCP
  function optimizeTextElement(textElement) {
    if (!textElement) return;
    
    // Ensure text is visible immediately (no opacity transitions)
    textElement.style.opacity = '1';
    
    // Remove any animations that might delay visibility
    textElement.style.animation = 'none';
    
    // Ensure font is loaded
    if ('fonts' in document) {
      document.fonts.ready.then(() => {
        // Force a reflow to ensure the text is rendered
        textElement.style.opacity = '0.99';
        setTimeout(() => {
          textElement.style.opacity = '1';
        }, 0);
      });
    }
  }

  // Use PerformanceObserver to identify actual LCP element if available
  function observeLcp() {
    if (!('PerformanceObserver' in window)) return;
    
    try {
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        
        // LCP entry found, get the element
        if (lastEntry && lastEntry.element) {
          const lcpElement = lastEntry.element;
          
          // Optimize based on element type
          if (lcpElement.tagName.toLowerCase() === 'img') {
            optimizeImageElement(lcpElement);
          } else {
            optimizeTextElement(lcpElement);
          }
          
          // Disconnect observer after finding LCP
          lcpObserver.disconnect();
        }
      });
      
      // Start observing LCP
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      
      // Set timeout to disconnect observer
      setTimeout(() => {
        lcpObserver.disconnect();
      }, config.maxWaitTime);
    } catch (e) {
      console.warn('Error setting up LCP observer:', e);
    }
  }

  // Initialize LCP optimization
  function init() {
    // Start observing for actual LCP element
    observeLcp();
    
    // Meanwhile, optimize likely LCP elements
    const likelyLcpElement = findMostLikelyLcpElement();
    
    if (likelyLcpElement) {
      if (likelyLcpElement.tagName.toLowerCase() === 'img') {
        optimizeImageElement(likelyLcpElement);
      } else {
        optimizeTextElement(likelyLcpElement);
      }
    }
    
    // Also optimize any hero images as they're commonly the LCP
    document.querySelectorAll('.hero img, .hero-bg').forEach(img => {
      optimizeImageElement(img);
    });
  }

  // Run as early as possible
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
