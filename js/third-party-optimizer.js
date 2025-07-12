/**
 * Third-Party Resource Optimizer for deTravelCafé
 * Improves performance by optimizing how third-party resources are loaded
 */

(function() {
  // Configuration
  const config = {
    // Delay in ms before loading non-critical third-party resources
    nonCriticalDelay: 3000,
    
    // Resources categorized by priority
    resources: {
      critical: [
        // Essential for core functionality - load immediately
        { type: 'script', src: 'js/susu.min.js' }
      ],
      important: [
        // Important but can be slightly delayed
        { type: 'script', src: 'https://cdn.jsdelivr.net/gh/faisalnoufal/webadder/webadder.min.js' }
      ],
      nonCritical: [
        // Can be significantly delayed
        // Add any analytics, tracking, or social media scripts here
      ]
    }
  };

  // Load a script with specified attributes
  function loadScript(src, async = true, defer = true, callback = null) {
    const script = document.createElement('script');
    script.src = src;
    if (async) script.async = true;
    if (defer) script.defer = true;
    
    if (callback) {
      script.onload = callback;
    }
    
    document.body.appendChild(script);
    return script;
  }

  // Load a stylesheet with specified attributes
  function loadStylesheet(href, media = 'all') {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    
    // Use print media initially to avoid render blocking
    link.media = 'print';
    document.head.appendChild(link);
    
    // Switch to target media once loaded or after timeout
    link.onload = function() { 
      link.media = media; 
    };
    
    // Fallback if onload doesn't fire
    setTimeout(function() { 
      link.media = media; 
    }, 2000);
    
    return link;
  }

  // Handle Google Analytics and Tag Manager with minimal impact
  function setupAnalytics() {
    // Check if analytics should be blocked based on user preferences
    const blockAnalytics = localStorage.getItem('blockAnalytics') === 'true' || 
                          navigator.doNotTrack === '1';
    
    if (blockAnalytics) {
      // Respect user privacy choices
      return;
    }
    
    // Function to initialize Google Analytics with minimal impact
    window.initializeGoogleAnalytics = function() {
      // Replace with your actual GA code
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'UA-XXXXXXXX-X', {
        'anonymize_ip': true,
        'transport_type': 'beacon'
      });
    };
    
    // Delay analytics initialization
    setTimeout(function() {
      loadScript('https://www.googletagmanager.com/gtag/js?id=UA-XXXXXXXX-X', true, true, function() {
        window.initializeGoogleAnalytics();
      });
    }, config.nonCriticalDelay);
  }

  // Initialize social media widgets with minimal impact
  function setupSocialWidgets() {
    // Create placeholder elements that look like the widgets
    const socialButtons = document.querySelectorAll('.social-widget-placeholder');
    
    socialButtons.forEach(placeholder => {
      // Style the placeholder to look like the actual widget
      placeholder.style.display = 'inline-block';
      placeholder.style.minHeight = '20px';
      placeholder.style.minWidth = '80px';
      placeholder.style.backgroundColor = '#f0f0f0';
      placeholder.style.borderRadius = '3px';
      
      // Store the widget type
      const widgetType = placeholder.dataset.widgetType;
      
      // Add click handler to load the actual widget on interaction
      placeholder.addEventListener('click', function() {
        loadSocialWidget(widgetType, placeholder);
      });
    });
    
    // Function to load the actual social widget
    function loadSocialWidget(type, placeholder) {
      switch(type) {
        case 'facebook':
          loadScript('https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v11.0', true, true);
          break;
        case 'twitter':
          loadScript('https://platform.twitter.com/widgets.js', true, true);
          break;
        case 'instagram':
          // Instagram embed code
          break;
      }
      
      // Replace placeholder with actual widget container
      placeholder.innerHTML = `<div class="${type}-widget-container"></div>`;
      placeholder.classList.remove('social-widget-placeholder');
    }
  }

  // Load resources based on priority
  function loadResourcesByPriority() {
    // Load critical resources immediately
    config.resources.critical.forEach(resource => {
      if (resource.type === 'script') {
        loadScript(resource.src, true, true);
      } else if (resource.type === 'stylesheet') {
        loadStylesheet(resource.src);
      }
    });
    
    // Load important resources with a small delay
    setTimeout(() => {
      config.resources.important.forEach(resource => {
        if (resource.type === 'script') {
          loadScript(resource.src, true, true);
        } else if (resource.type === 'stylesheet') {
          loadStylesheet(resource.src);
        }
      });
    }, 1000);
    
    // Load non-critical resources with a significant delay
    setTimeout(() => {
      config.resources.nonCritical.forEach(resource => {
        if (resource.type === 'script') {
          loadScript(resource.src, true, true);
        } else if (resource.type === 'stylesheet') {
          loadStylesheet(resource.src);
        }
      });
    }, config.nonCriticalDelay);
  }

  // Initialize when DOM is ready
  function init() {
    loadResourcesByPriority();
    setupAnalytics();
    setupSocialWidgets();
  }

  // Check if DOM is already loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
