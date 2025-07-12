/**
 * Script Optimizer for deTravelCafé
 * Reduces JavaScript execution time and optimizes third-party script loading
 */

(function() {
  // Configuration
  const config = {
    // Script categories by impact on user experience
    scriptCategories: {
      critical: [],     // Scripts needed for core functionality
      functional: [],   // Scripts needed for important features
      enhancement: [],  // Scripts that enhance the experience but aren't essential
      analytics: [],    // Measurement and analytics scripts
      advertising: [],  // Ad-related scripts
      social: []        // Social media widgets
    },
    // Timing configuration (in milliseconds)
    timing: {
      functionalDelay: 1000,    // Delay for functional scripts
      enhancementDelay: 2000,   // Delay for enhancement scripts
      analyticsDelay: 3000,     // Delay for analytics scripts
      advertisingDelay: 4000,   // Delay for advertising scripts
      socialDelay: 5000         // Delay for social media scripts
    },
    // User interaction triggers
    triggers: {
      scroll: false,            // Load some scripts after first scroll
      click: false,             // Load some scripts after first click
      idle: true                // Load some scripts during browser idle time
    },
    // Script execution optimization
    execution: {
      useRequestIdleCallback: true,  // Use requestIdleCallback when available
      useDynamicImport: true,        // Use dynamic imports for modules when possible
      useWorkers: false              // Use Web Workers for heavy computation (advanced)
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

  // Load a script dynamically
  function loadScript(scriptInfo) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      
      if (scriptInfo.src) {
        script.src = scriptInfo.src;
        script.async = scriptInfo.async !== false;
        script.defer = scriptInfo.defer !== false;
        
        script.onload = () => resolve(script);
        script.onerror = () => reject(new Error(`Failed to load script: ${scriptInfo.src}`));
      } else if (scriptInfo.content) {
        script.textContent = scriptInfo.content;
        // For inline scripts, resolve immediately after appending
        setTimeout(resolve, 0);
      }
      
      // Insert at the original position if possible
      if (scriptInfo.parent) {
        if (scriptInfo.nextSibling) {
          scriptInfo.parent.insertBefore(script, scriptInfo.nextSibling);
        } else {
          scriptInfo.parent.appendChild(script);
        }
      } else {
        document.body.appendChild(script);
      }
      
      // If no src, resolve immediately
      if (!scriptInfo.src) {
        resolve(script);
      }
    });
  }

  // Schedule script loading based on priority
  function scheduleScriptLoading() {
    // Load critical scripts immediately
    Promise.all(config.scriptCategories.critical.map(loadScript))
      .catch(err => console.warn('Error loading critical scripts:', err));
    
    // Load functional scripts with a small delay
    setTimeout(() => {
      Promise.all(config.scriptCategories.functional.map(loadScript))
        .catch(err => console.warn('Error loading functional scripts:', err));
    }, config.timing.functionalDelay);
    
    // Load enhancement scripts after a longer delay
    setTimeout(() => {
      Promise.all(config.scriptCategories.enhancement.map(loadScript))
        .catch(err => console.warn('Error loading enhancement scripts:', err));
    }, config.timing.enhancementDelay);
    
    // Schedule remaining scripts based on triggers
    setupTriggers();
  }

  // Setup event triggers for delayed script loading
  function setupTriggers() {
    // Load analytics during idle time
    if (config.triggers.idle && config.execution.useRequestIdleCallback && 'requestIdleCallback' in window) {
      window.requestIdleCallback(() => {
        Promise.all(config.scriptCategories.analytics.map(loadScript))
          .catch(err => console.warn('Error loading analytics scripts:', err));
        userInteraction.isIdle = true;
      }, { timeout: config.timing.analyticsDelay });
    } else {
      // Fallback to timeout
      setTimeout(() => {
        Promise.all(config.scriptCategories.analytics.map(loadScript))
          .catch(err => console.warn('Error loading analytics scripts:', err));
      }, config.timing.analyticsDelay);
    }
    
    // Load advertising and social scripts after user interaction
    if (config.triggers.scroll) {
      const scrollHandler = () => {
        if (userInteraction.hasScrolled) return;
        userInteraction.hasScrolled = true;
        
        // Load advertising scripts
        Promise.all(config.scriptCategories.advertising.map(loadScript))
          .catch(err => console.warn('Error loading advertising scripts:', err));
        
        // Remove scroll listener after execution
        window.removeEventListener('scroll', scrollHandler);
      };
      
      window.addEventListener('scroll', scrollHandler, { passive: true });
    } else {
      // Fallback to timeout for advertising
      setTimeout(() => {
        Promise.all(config.scriptCategories.advertising.map(loadScript))
          .catch(err => console.warn('Error loading advertising scripts:', err));
      }, config.timing.advertisingDelay);
    }
    
    if (config.triggers.click) {
      const clickHandler = () => {
        if (userInteraction.hasClicked) return;
        userInteraction.hasClicked = true;
        
        // Load social scripts
        Promise.all(config.scriptCategories.social.map(loadScript))
          .catch(err => console.warn('Error loading social scripts:', err));
        
        // Remove click listener after execution
        document.removeEventListener('click', clickHandler);
      };
      
      document.addEventListener('click', clickHandler, { passive: true });
    } else {
      // Fallback to timeout for social
      setTimeout(() => {
        Promise.all(config.scriptCategories.social.map(loadScript))
          .catch(err => console.warn('Error loading social scripts:', err));
      }, config.timing.socialDelay);
    }
  }

  // Initialize script optimization
  function init() {
    categorizeScripts();
    scheduleScriptLoading();
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
