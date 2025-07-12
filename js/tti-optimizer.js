/**
 * TTI Optimizer for deTravelCafé
 * Reduces Time to Interactive by optimizing main-thread work and deferring non-critical tasks
 */

(function() {
  // Configuration
  const config = {
    // Task priority levels
    priority: {
      critical: 1,   // Must execute immediately (UI rendering, user input)
      high: 2,       // Should execute soon (visible content updates)
      medium: 3,     // Can be slightly delayed (analytics, non-visible updates)
      low: 4,        // Can be significantly delayed (background tasks)
      idle: 5        // Only execute during idle time
    },
    // Timing thresholds in milliseconds
    timing: {
      longTask: 50,           // Tasks longer than this are considered "long tasks"
      interactionDelay: 100,  // Maximum delay for responding to user interaction
      idleTimeout: 2000       // Maximum time to wait for idle callback
    },
    // Feature detection and capabilities
    features: {
      supportsRequestIdleCallback: 'requestIdleCallback' in window,
      supportsRequestAnimationFrame: 'requestAnimationFrame' in window,
      supportsMutationObserver: 'MutationObserver' in window,
      supportsPerformanceObserver: 'PerformanceObserver' in window
    }
  };

  // Task queue for managing work
  const taskQueue = {
    tasks: {
      critical: [],
      high: [],
      medium: [],
      low: [],
      idle: []
    },
    
    // Add a task to the queue
    add: function(callback, priority = 'medium') {
      if (this.tasks[priority]) {
        this.tasks[priority].push(callback);
        this.process();
      } else {
        console.warn(`Invalid priority: ${priority}`);
      }
    },
    
    // Process tasks based on priority
    process: function() {
      // Process critical tasks immediately
      if (this.tasks.critical.length > 0) {
        const criticalTasks = this.tasks.critical.splice(0, this.tasks.critical.length);
        criticalTasks.forEach(task => {
          try {
            task();
          } catch (e) {
            console.error('Error in critical task:', e);
          }
        });
      }
      
      // Process high priority tasks with minimal delay
      if (this.tasks.high.length > 0) {
        const highTasks = this.tasks.high.splice(0, this.tasks.high.length);
        setTimeout(() => {
          highTasks.forEach(task => {
            try {
              task();
            } catch (e) {
              console.error('Error in high priority task:', e);
            }
          });
        }, 0);
      }
      
      // Process medium priority tasks with requestAnimationFrame
      if (this.tasks.medium.length > 0 && config.features.supportsRequestAnimationFrame) {
        const mediumTasks = this.tasks.medium.splice(0, this.tasks.medium.length);
        requestAnimationFrame(() => {
          mediumTasks.forEach(task => {
            try {
              task();
            } catch (e) {
              console.error('Error in medium priority task:', e);
            }
          });
        });
      }
      
      // Process low priority tasks with setTimeout
      if (this.tasks.low.length > 0) {
        const lowTasks = this.tasks.low.splice(0, this.tasks.low.length);
        setTimeout(() => {
          lowTasks.forEach(task => {
            try {
              task();
            } catch (e) {
              console.error('Error in low priority task:', e);
            }
          });
        }, 100);
      }
      
      // Process idle tasks with requestIdleCallback or fallback
      if (this.tasks.idle.length > 0) {
        const idleTasks = this.tasks.idle.splice(0, this.tasks.idle.length);
        if (config.features.supportsRequestIdleCallback) {
          requestIdleCallback(deadline => {
            let taskIndex = 0;
            
            // Process tasks until we run out of time or tasks
            while (deadline.timeRemaining() > 0 && taskIndex < idleTasks.length) {
              try {
                idleTasks[taskIndex]();
              } catch (e) {
                console.error('Error in idle task:', e);
              }
              taskIndex++;
            }
            
            // If we have remaining tasks, re-add them to the queue
            if (taskIndex < idleTasks.length) {
              const remainingTasks = idleTasks.slice(taskIndex);
              remainingTasks.forEach(task => this.tasks.idle.push(task));
              this.process();
            }
          }, { timeout: config.timing.idleTimeout });
        } else {
          // Fallback for browsers without requestIdleCallback
          setTimeout(() => {
            idleTasks.forEach(task => {
              try {
                task();
              } catch (e) {
                console.error('Error in idle task (fallback):', e);
              }
            });
          }, 300);
        }
      }
    }
  };

  // Monitor long tasks to detect main thread blocking
  function setupLongTaskObserver() {
    if (!config.features.supportsPerformanceObserver) return;
    
    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach(entry => {
          // Log long tasks for debugging
          console.warn('Long task detected:', {
            duration: entry.duration.toFixed(2) + 'ms',
            name: entry.name,
            startTime: entry.startTime.toFixed(2) + 'ms'
          });
        });
      });
      
      observer.observe({ entryTypes: ['longtask'] });
    } catch (e) {
      console.error('Long task observer setup failed:', e);
    }
  }

  // Optimize event listeners to reduce main thread work
  function optimizeEventListeners() {
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
    
    // Optimize scroll event listeners
    const originalAddEventListener = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function(type, listener, options) {
      if (type === 'scroll') {
        // Throttle scroll events
        const throttledListener = throttle(listener, 100);
        originalAddEventListener.call(this, type, throttledListener, options);
      } else if (type === 'resize') {
        // Debounce resize events
        const debouncedListener = debounce(listener, 150);
        originalAddEventListener.call(this, type, debouncedListener, options);
      } else if (type === 'mousemove' || type === 'mouseover' || type === 'mouseout') {
        // Throttle mouse movement events
        const throttledListener = throttle(listener, 50);
        originalAddEventListener.call(this, type, throttledListener, options);
      } else {
        // Use original listener for other events
        originalAddEventListener.call(this, type, listener, options);
      }
    };
  }

  // Optimize animations to reduce main thread work
  function optimizeAnimations() {
    // Use CSS animations instead of JS where possible
    document.querySelectorAll('[data-animate]').forEach(element => {
      const animationType = element.getAttribute('data-animate');
      if (animationType) {
        element.classList.add(`animate-${animationType}`);
        element.removeAttribute('data-animate');
      }
    });
    
    // Ensure animations don't block interactivity
    if (config.features.supportsMutationObserver) {
      const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
            const element = mutation.target;
            const classList = element.classList;
            
            // Check if animation classes were added
            if (Array.from(classList).some(cls => cls.startsWith('animate-'))) {
              // Add will-change to optimize rendering
              element.style.willChange = 'transform, opacity';
              
              // Remove will-change after animation completes
              element.addEventListener('animationend', () => {
                element.style.willChange = 'auto';
              }, { once: true });
            }
          }
        });
      });
      
      observer.observe(document.body, {
        attributes: true,
        attributeFilter: ['class'],
        subtree: true
      });
    }
  }

  // Defer non-critical operations
  function deferNonCriticalOperations() {
    // Defer image loading for non-visible images
    document.querySelectorAll('img:not([loading])').forEach(img => {
      if (!isElementInViewport(img)) {
        img.loading = 'lazy';
      }
    });
    
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
    
    // Defer non-critical CSS
    document.querySelectorAll('link[rel="stylesheet"]:not([data-critical="true"])').forEach(link => {
      link.media = 'print';
      taskQueue.add(() => {
        link.media = 'all';
      }, 'low');
    });
  }

  // Initialize TTI optimization
  function init() {
    // Setup long task observer
    setupLongTaskObserver();
    
    // Optimize event listeners
    taskQueue.add(() => optimizeEventListeners(), 'high');
    
    // Optimize animations
    taskQueue.add(() => optimizeAnimations(), 'medium');
    
    // Defer non-critical operations
    taskQueue.add(() => deferNonCriticalOperations(), 'low');
    
    // Expose task queue API for other scripts to use
    window.ttiOptimizer = {
      addTask: taskQueue.add.bind(taskQueue),
      priority: config.priority
    };
  }

  // Run as early as possible
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
