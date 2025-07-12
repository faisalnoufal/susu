/**
 * Render Blocking Resource Optimizer for deTravelCafé
 * Reduces render-blocking resources to improve FCP and LCP metrics
 */

(function() {
  // Configuration
  const config = {
    // Resource types to optimize
    resources: {
      css: true,       // Optimize CSS loading
      fonts: true,     // Optimize font loading
      images: true,    // Optimize image loading
      scripts: true    // Optimize script loading
    },
    // Optimization techniques
    techniques: {
      inlineCSS: true,         // Inline critical CSS
      preloadFonts: true,      // Preload critical fonts
      lazyLoadImages: true,    // Lazy load non-critical images
      deferScripts: true,      // Defer non-critical scripts
      preconnect: true,        // Preconnect to important origins
      asyncStyles: true        // Load non-critical CSS asynchronously
    }
  };

  // Optimize CSS loading
  function optimizeCSSLoading() {
    if (!config.resources.css) return;
    
    // Find all stylesheets
    const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
    
    // Process each stylesheet
    stylesheets.forEach(stylesheet => {
      const href = stylesheet.getAttribute('href');
      
      // Skip if already optimized or critical
      if (stylesheet.hasAttribute('data-optimized') || 
          stylesheet.hasAttribute('data-critical')) {
        return;
      }
      
      // Mark as optimized
      stylesheet.setAttribute('data-optimized', 'true');
      
      // For non-critical stylesheets, load asynchronously
      if (config.techniques.asyncStyles && !isResourceCritical(href)) {
        // Remove the stylesheet temporarily
        const parentNode = stylesheet.parentNode;
        const nextSibling = stylesheet.nextSibling;
        parentNode.removeChild(stylesheet);
        
        // Change rel to preload to avoid blocking
        stylesheet.setAttribute('rel', 'preload');
        stylesheet.setAttribute('as', 'style');
        stylesheet.setAttribute('onload', "this.onload=null;this.rel='stylesheet'");
        
        // Add back to DOM
        if (nextSibling) {
          parentNode.insertBefore(stylesheet, nextSibling);
        } else {
          parentNode.appendChild(stylesheet);
        }
        
        // Add fallback for browsers that don't support onload
        const noscript = document.createElement('noscript');
        const fallbackLink = document.createElement('link');
        fallbackLink.setAttribute('rel', 'stylesheet');
        fallbackLink.setAttribute('href', href);
        noscript.appendChild(fallbackLink);
        parentNode.appendChild(noscript);
      }
    });
    
    // Extract and inline critical CSS if possible
    if (config.techniques.inlineCSS) {
      extractCriticalCSS();
    }
  }

  // Extract critical CSS for above-the-fold content
  function extractCriticalCSS() {
    // Get viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Get all elements within viewport
    const elementsInViewport = [];
    const allElements = document.body.getElementsByTagName('*');
    
    for (let i = 0; i < allElements.length; i++) {
      const element = allElements[i];
      const rect = element.getBoundingClientRect();
      
      // Check if element is in viewport
      if (rect.bottom >= 0 &&
          rect.right >= 0 &&
          rect.top <= viewportHeight &&
          rect.left <= viewportWidth) {
        elementsInViewport.push(element);
      }
    }
    
    // Get computed styles for elements in viewport
    const criticalStyles = new Set();
    elementsInViewport.forEach(element => {
      const computedStyle = window.getComputedStyle(element);
      const className = element.className;
      const tagName = element.tagName.toLowerCase();
      
      // Add tag and class selectors
      if (className && typeof className === 'string') {
        const classes = className.split(' ').filter(c => c.trim().length > 0);
        classes.forEach(cls => {
          criticalStyles.add(`.${cls} { display: ${computedStyle.display}; }`);
          
          // Add basic styling properties
          if (computedStyle.color !== 'rgb(0, 0, 0)') {
            criticalStyles.add(`.${cls} { color: ${computedStyle.color}; }`);
          }
          
          if (computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)') {
            criticalStyles.add(`.${cls} { background-color: ${computedStyle.backgroundColor}; }`);
          }
          
          if (computedStyle.fontSize !== '16px') {
            criticalStyles.add(`.${cls} { font-size: ${computedStyle.fontSize}; }`);
          }
        });
      }
      
      criticalStyles.add(`${tagName} { display: ${computedStyle.display}; }`);
    });
    
    // Create and inject critical CSS
    if (criticalStyles.size > 0) {
      const criticalCSS = Array.from(criticalStyles).join('\n');
      const styleElement = document.createElement('style');
      styleElement.setAttribute('id', 'critical-css');
      styleElement.textContent = criticalCSS;
      
      // Insert at the top of head
      document.head.insertBefore(styleElement, document.head.firstChild);
    }
  }

  // Optimize font loading
  function optimizeFontLoading() {
    if (!config.resources.fonts) return;
    
    // Find all font stylesheets
    const fontStylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
      .filter(link => {
        const href = link.getAttribute('href');
        return href && (href.includes('fonts.googleapis.com') || 
                        href.includes('font') || 
                        href.includes('.woff') || 
                        href.includes('.ttf'));
      });
    
    // Preload critical fonts
    if (config.techniques.preloadFonts) {
      fontStylesheets.forEach(stylesheet => {
        const href = stylesheet.getAttribute('href');
        
        // Skip if already preloaded
        if (document.querySelector(`link[rel="preload"][href="${href}"]`)) {
          return;
        }
        
        // Create preload link
        const preloadLink = document.createElement('link');
        preloadLink.setAttribute('rel', 'preload');
        preloadLink.setAttribute('href', href);
        preloadLink.setAttribute('as', 'style');
        preloadLink.setAttribute('crossorigin', 'anonymous');
        
        // Add to head
        document.head.appendChild(preloadLink);
      });
    }
    
    // Add font-display: swap to all @font-face rules
    const styleSheets = document.styleSheets;
    try {
      for (let i = 0; i < styleSheets.length; i++) {
        const styleSheet = styleSheets[i];
        
        try {
          const rules = styleSheet.cssRules || styleSheet.rules;
          
          if (!rules) continue;
          
          for (let j = 0; j < rules.length; j++) {
            const rule = rules[j];
            
            if (rule.type === CSSRule.FONT_FACE_RULE) {
              // Check if font-display is already set
              if (!rule.style.fontDisplay) {
                rule.style.fontDisplay = 'swap';
              }
            }
          }
        } catch (e) {
          // CORS error, skip this stylesheet
          console.warn('Could not access rules in stylesheet:', e);
        }
      }
    } catch (e) {
      console.error('Error optimizing fonts:', e);
    }
  }

  // Optimize image loading
  function optimizeImageLoading() {
    if (!config.resources.images) return;
    
    // Find all images
    const images = document.querySelectorAll('img:not([loading])');
    
    // Apply lazy loading to non-critical images
    if (config.techniques.lazyLoadImages) {
      images.forEach(img => {
        // Skip if already optimized
        if (img.hasAttribute('data-optimized')) return;
        
        // Mark as optimized
        img.setAttribute('data-optimized', 'true');
        
        // Check if image is critical (in viewport)
        if (!isElementInViewport(img)) {
          // Add loading="lazy" attribute
          img.loading = 'lazy';
          
          // If browser doesn't support loading="lazy", use data-src pattern
          if (!('loading' in HTMLImageElement.prototype)) {
            const src = img.getAttribute('src');
            img.setAttribute('data-src', src);
            img.setAttribute('src', 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3C/svg%3E');
            
            // Add to intersection observer
            if ('IntersectionObserver' in window) {
              lazyLoadObserver.observe(img);
            }
          }
        }
      });
    }
  }

  // Lazy load images with Intersection Observer
  let lazyLoadObserver;
  if ('IntersectionObserver' in window) {
    lazyLoadObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          const src = img.getAttribute('data-src');
          
          if (src) {
            img.setAttribute('src', src);
            img.removeAttribute('data-src');
          }
          
          lazyLoadObserver.unobserve(img);
        }
      });
    });
  }

  // Optimize script loading
  function optimizeScriptLoading() {
    if (!config.resources.scripts) return;
    
    // Find all scripts
    const scripts = document.querySelectorAll('script[src]:not([async]):not([defer])');
    
    // Defer non-critical scripts
    if (config.techniques.deferScripts) {
      scripts.forEach(script => {
        const src = script.getAttribute('src');
        
        // Skip if already optimized or critical
        if (script.hasAttribute('data-optimized') || 
            script.hasAttribute('data-critical') ||
            isResourceCritical(src)) {
          return;
        }
        
        // Mark as optimized
        script.setAttribute('data-optimized', 'true');
        
        // Add defer attribute
        script.defer = true;
      });
    }
  }

  // Add preconnect hints for important origins
  function addPreconnectHints() {
    if (!config.techniques.preconnect) return;
    
    // Common origins to preconnect to
    const origins = [
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
      'https://www.googletagmanager.com',
      'https://www.google-analytics.com'
    ];
    
    // Find all external resource URLs
    const resourceUrls = [
      ...Array.from(document.querySelectorAll('link[href]')).map(link => link.href),
      ...Array.from(document.querySelectorAll('script[src]')).map(script => script.src),
      ...Array.from(document.querySelectorAll('img[src]')).map(img => img.src)
    ];
    
    // Extract domains
    resourceUrls.forEach(url => {
      try {
        const domain = new URL(url).origin;
        if (domain !== window.location.origin && !origins.includes(domain)) {
          origins.push(domain);
        }
      } catch (e) {
        // Invalid URL, skip
      }
    });
    
    // Add preconnect hints
    origins.forEach(origin => {
      // Skip if already added
      if (document.querySelector(`link[rel="preconnect"][href="${origin}"]`)) {
        return;
      }
      
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = origin;
      link.crossOrigin = 'anonymous';
      
      document.head.appendChild(link);
    });
  }

  // Helper function to check if element is in viewport
  function isElementInViewport(el) {
    const rect = el.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  // Helper function to check if a resource is critical
  function isResourceCritical(url) {
    if (!url) return false;
    
    // List of critical resource patterns
    const criticalPatterns = [
      'logo-fix',
      'video-fix',
      'lcp-optimizer',
      'fid-optimizer',
      'cls-optimizer',
      'script-optimizer',
      'critical',
      'tailwind'
    ];
    
    return criticalPatterns.some(pattern => url.includes(pattern));
  }

  // Initialize optimizations
  function init() {
    // Add preconnect hints as early as possible
    addPreconnectHints();
    
    // Optimize CSS loading
    optimizeCSSLoading();
    
    // Optimize font loading
    optimizeFontLoading();
    
    // Wait for DOM content loaded for other optimizations
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        optimizeImageLoading();
        optimizeScriptLoading();
      });
    } else {
      optimizeImageLoading();
      optimizeScriptLoading();
    }
  }

  // Run initialization
  init();
})();
