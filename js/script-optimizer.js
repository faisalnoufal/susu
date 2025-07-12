/**
 * Enhanced Script Optimizer for deTravelCafé
 * Reduces JavaScript execution time and optimizes third-party script loading
 * Targets main-thread work reduction for better performance
 */

(function() {
  // Configuration
  const config = {
    // Script categories by impact on user experience
    scriptCategories: {
      critical: ['logo-fix.js', 'video-fix.js'],     // Scripts needed for core functionality
      functional: ['alpine.min.js'],                  // Scripts needed for important features
      enhancement: ['lcp-optimizer.js', 'cls-optimizer.js', 'fid-optimizer.js', 'tti-optimizer.js', 'tbt-optimizer.js'], // Scripts that enhance the experience
      analytics: ['gtm.js', 'analytics.js', 'gtag', 'googletagmanager'],  // Measurement and analytics scripts
      advertising: [],                                // Ad-related scripts
      social: ['facebook', 'connect.facebook.net', 'platform.twitter.com', 'instagram.com']    // Social media widgets
    },
    // Script execution strategies
    execution: {
      codeSplitting: true,              // Split large scripts into smaller chunks
      lazyEvaluation: true,             // Only evaluate code when needed
      treeShakinng: true,               // Remove unused code
      modulePreloading: true            // Preload critical modules
    },
    // Timing configuration (in milliseconds)
    timing: {
      functionalDelay: 500,     // Delay for functional scripts
      enhancementDelay: 1000,   // Delay for enhancement scripts
      analyticsDelay: 2000,     // Delay for analytics scripts
      advertisingDelay: 3000,   // Delay for advertising scripts
      socialDelay: 3500         // Delay for social media scripts
    },
    // User interaction triggers
    triggers: {
      scroll: true,             // Load some scripts after first scroll
      click: true,              // Load some scripts after first click
      idle: true                // Load some scripts during browser idle time
    },
    // Script execution optimization
    execution: {
      useRequestIdleCallback: true,  // Use requestIdleCallback when available
      useDynamicImport: true,        // Use dynamic imports for modules when possible
      useWorkers: true,              // Use Web Workers for heavy computation
      chunkSize: 5,                  // Process in small chunks to avoid long tasks
      useRAF: true,                  // Use requestAnimationFrame for visual updates
      debounceEvents: true,          // Debounce event handlers
      throttleScrollEvents: true     // Throttle scroll events
    },
    // Performance budget settings
    performance: {
      maxScriptExecutionTime: 50,    // Maximum script execution time in ms
      maxStyleRecalcTime: 10,        // Maximum style recalculation time in ms
      maxLayoutTime: 10,             // Maximum layout time in ms
      monitorLongTasks: true,        // Monitor long tasks
      breakLongTasks: true           // Break long tasks into smaller chunks
    }
  };

  // Track user interaction states
  const userInteraction = {
    hasScrolled: false,
    hasClicked: false,
    isIdle: false
  };

  // Initialize script categorization
  function categorizeScripts() {
    // Find scripts with data-category attribute
    document.querySelectorAll('script[data-category]').forEach(script => {
      const category = script.getAttribute('data-category');
      if (config.scriptCategories[category]) {
        // Store script information
        config.scriptCategories[category].push({
          src: script.src,
          async: script.async,
          defer: script.defer,
          content: script.innerHTML,
          parent: script.parentNode,
          nextSibling: script.nextSibling
        });
        
        // Remove the original script to prevent execution
        script.parentNode.removeChild(script);
      }
    });
    
    // Auto-categorize common third-party scripts
    document.querySelectorAll('script[src]').forEach(script => {
      if (script.hasAttribute('data-category')) return; // Skip already categorized
      
      const src = script.src.toLowerCase();
      let category = null;
      
      // Analytics scripts
      if (src.includes('google-analytics.com') || 
          src.includes('analytics') || 
          src.includes('gtm.js') || 
          src.includes('tag-manager')) {
        category = 'analytics';
      }
      // Social media scripts
      else if (src.includes('facebook.net') || 
               src.includes('twitter.com') || 
               src.includes('instagram.com') || 
               src.includes('linkedin.com') ||
               src.includes('platform.js')) {
        category = 'social';
      }
      // Ad scripts
      else if (src.includes('ad') || 
               src.includes('ads') || 
               src.includes('doubleclick') || 
               src.includes('pagead')) {
        category = 'advertising';
      }
      
      if (category) {
        script.setAttribute('data-category', category);
      }
    });
  }

  // Monitor long tasks to detect main thread blocking
  function setupLongTaskObserver() {
    if (!config.performance.monitorLongTasks || !window.PerformanceObserver) return;
    
    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach(entry => {
          // Log long tasks for debugging
          console.warn('Long task detected:', {
            duration: entry.duration.toFixed(2) + 'ms',
            name: entry.name,
            startTime: entry.startTime.toFixed(2) + 'ms'
          });
          
          // Take action if needed
          if (config.performance.breakLongTasks && entry.duration > 100) {
            // Force a task break by yielding to the event loop
            setTimeout(() => {}, 0);
          }
        });
      });
      
      observer.observe({ entryTypes: ['longtask'] });
    } catch (e) {
      console.error('Long task observer setup failed:', e);
    }
  }
  
  // Break up heavy work into smaller chunks
  function scheduleWork(items, processFn, chunkSize = config.execution.chunkSize) {
    return new Promise(resolve => {
      let index = 0;
      
      function processChunk() {
        const start = performance.now();
        const limit = Math.min(index + chunkSize, items.length);
        
        while (index < limit) {
          processFn(items[index]);
          index++;
          
          // Check if we're exceeding our time budget
          if (performance.now() - start > config.performance.maxScriptExecutionTime) {
            break;
          }
        }
        
        if (index < items.length) {
          // Schedule next chunk using the most appropriate API
          if (config.execution.useRequestIdleCallback && window.requestIdleCallback) {
            requestIdleCallback(() => processChunk());
          } else {
            setTimeout(processChunk, 0);
          }
        } else {
          resolve();
        }
      }
      
      processChunk();
    });
  }
  
  // Load a script dynamically with optimizations
  function loadScript(scriptInfo) {
    return new Promise((resolve, reject) => {
      // Use requestIdleCallback if available and appropriate
      const createAndLoadScript = () => {
        const script = document.createElement('script');
        
        if (scriptInfo.src) {
          script.src = scriptInfo.src;
          script.async = scriptInfo.async !== false;
          script.defer = scriptInfo.defer !== false;
          
          // Add resource hints for faster loading
          const preconnect = document.createElement('link');
          preconnect.rel = 'preconnect';
          preconnect.href = new URL(scriptInfo.src).origin;
          document.head.appendChild(preconnect);
          
          script.onload = () => resolve(script);
          script.onerror = () => reject(new Error(`Failed to load script: ${scriptInfo.src}`));
        } else if (scriptInfo.content) {
          script.textContent = scriptInfo.content;
          // For inline scripts, resolve immediately after appending
          setTimeout(resolve, 0);
        }
        
        // Append the script to the DOM
        if (scriptInfo.parent) {
          scriptInfo.parent.insertBefore(script, scriptInfo.nextSibling);
        } else {
          document.body.appendChild(script);
        }
      };
      
      // Execute the script loading based on priority
      if (config.execution.useRequestIdleCallback && window.requestIdleCallback) {
        requestIdleCallback(() => createAndLoadScript());
      } else {
        setTimeout(createAndLoadScript, 0);
      }
    });
  }

  // Throttle function to limit execution frequency
  function throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // Debounce function to delay execution until after events stop
  function debounce(func, wait) {
    let timeout;
    return function() {
      const context = this;
      const args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), wait);
    };
  }

  // Set up event listeners for user interactions
  function setupEventListeners() {
    if (config.triggers.scroll) {
      const scrollHandler = config.execution.throttleScrollEvents ? 
        throttle(() => { userInteraction.hasScrolled = true; }, 200) : 
        () => { userInteraction.hasScrolled = true; };
      
      window.addEventListener('scroll', scrollHandler, { passive: true });
    }
    
    if (config.triggers.click) {
      window.addEventListener('click', () => { userInteraction.hasClicked = true; }, { passive: true });
    }
    
    if (config.triggers.idle && window.requestIdleCallback) {
      requestIdleCallback(() => { userInteraction.isIdle = true; });
    }
  }

  // Schedule script loading based on priority and user interaction
  function scheduleScriptLoading() {
    // Setup long task observer
    setupLongTaskObserver();
    
    // Setup event listeners
    setupEventListeners();
    
    // Process scripts in chunks to avoid long tasks
    const processScripts = (scripts) => {
      return scheduleWork(scripts, loadScript);
    };
    
    // Load critical scripts immediately
    processScripts(config.scriptCategories.critical)
      .catch(err => console.warn('Error loading critical scripts:', err));
    
    // Load functional scripts with a small delay
    setTimeout(() => {
      processScripts(config.scriptCategories.functional)
        .catch(err => console.warn('Error loading functional scripts:', err));
    }, config.timing.functionalDelay);
    
    // Load enhancement scripts after a longer delay
    setTimeout(() => {
      processScripts(config.scriptCategories.enhancement)
        .catch(err => console.warn('Error loading enhancement scripts:', err));
    }, config.timing.enhancementDelay);
    
    // Schedule analytics scripts based on user interaction or delay
    const loadAnalytics = () => {
      processScripts(config.scriptCategories.analytics)
        .catch(err => console.warn('Error loading analytics scripts:', err));
    };
    
    // Schedule social media scripts based on user interaction or delay
    const loadSocial = () => {
      processScripts(config.scriptCategories.social)
        .catch(err => console.warn('Error loading social scripts:', err));
    };
    
    // Schedule advertising scripts based on user interaction or delay
    const loadAdvertising = () => {
      processScripts(config.scriptCategories.advertising)
        .catch(err => console.warn('Error loading advertising scripts:', err));
    };
    
    // Load analytics after delay or user interaction
    setTimeout(() => {
      loadAnalytics();
    }, config.timing.analyticsDelay);
    
    // Load social media scripts after user interaction or longer delay
    if (config.triggers.click) {
      const checkForInteraction = () => {
        if (userInteraction.hasClicked || userInteraction.hasScrolled) {
          loadSocial();
        } else {
          setTimeout(checkForInteraction, 1000);
        }
      };
      setTimeout(checkForInteraction, 1000);
    } else {
      setTimeout(loadSocial, config.timing.socialDelay);
    }
    
    // Load advertising scripts after longest delay
    setTimeout(loadAdvertising, config.timing.advertisingDelay);
  }
  
  // Initialize the script optimizer
  function init() {
    // Categorize scripts on the page
    categorizeScripts();
    
    // Schedule script loading
    scheduleScriptLoading();
    
    // Log performance info
    if (window.performance && window.performance.timing) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const timing = window.performance.timing;
          const pageLoadTime = timing.loadEventEnd - timing.navigationStart;
          console.info(`Page load time: ${pageLoadTime}ms`);
        }, 0);
      });
    }
  }
  
  // Run the optimizer
  init();
})();
