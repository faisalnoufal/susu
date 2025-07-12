/**
 * TBT Optimizer for deTravelCafé
 * Reduces Total Blocking Time by optimizing main-thread work and minimizing long tasks
 */

(function() {
  // Configuration
  const config = {
    // Timing thresholds in milliseconds
    timing: {
      longTaskThreshold: 50,     // Tasks longer than this are considered blocking
      taskBreakInterval: 5,      // Break up long tasks every X ms
      maxTaskDuration: 200,      // Maximum duration for any single task
      idleTimeout: 1000          // Timeout for requestIdleCallback
    },
    // Script execution settings
    execution: {
      breakLongTasks: true,      // Break up long-running tasks
      deferNonCritical: true,    // Defer non-critical script execution
      prioritizeUserInput: true  // Ensure user input handlers are not blocked
    },
    // Feature detection
    features: {
      supportsRAF: 'requestAnimationFrame' in window,
      supportsRIC: 'requestIdleCallback' in window,
      supportsPO: 'PerformanceObserver' in window,
      supportsWorkers: 'Worker' in window
    }
  };

  // Track main thread blocking
  let totalBlockingTime = 0;
  let longTaskCount = 0;

  // Monitor long tasks using PerformanceObserver
  function monitorLongTasks() {
    if (!config.features.supportsPO) return;
    
    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach(entry => {
          // Calculate blocking time (time beyond 50ms)
          const blockingTime = entry.duration - config.timing.longTaskThreshold;
          
          if (blockingTime > 0) {
            totalBlockingTime += blockingTime;
            longTaskCount++;
            
            console.warn(`Long task detected: ${entry.duration.toFixed(1)}ms (blocking: ${blockingTime.toFixed(1)}ms)`);
          }
        });
      });
      
      observer.observe({ entryTypes: ['longtask'] });
    } catch (e) {
      console.error('Error setting up long task observer:', e);
    }
  }

  // Break up long-running tasks into smaller chunks
  function breakUpTask(taskFn, data) {
    return new Promise((resolve) => {
      // If the task is a function that processes an array
      if (Array.isArray(data)) {
        const chunks = chunkArray(data, 10); // Process 10 items at a time
        let chunkIndex = 0;
        
        function processNextChunk() {
          if (chunkIndex >= chunks.length) {
            resolve();
            return;
          }
          
          const startTime = performance.now();
          
          // Process current chunk
          chunks[chunkIndex].forEach(item => taskFn(item));
          chunkIndex++;
          
          const elapsedTime = performance.now() - startTime;
          
          // If processing took too long, use timeout to break up work
          if (elapsedTime > config.timing.taskBreakInterval) {
            setTimeout(processNextChunk, 0);
          } else if (config.features.supportsRAF) {
            requestAnimationFrame(processNextChunk);
          } else {
            setTimeout(processNextChunk, 0);
          }
        }
        
        processNextChunk();
      } else {
        // For non-array tasks, execute with timeout if it might be long-running
        if (config.execution.breakLongTasks) {
          setTimeout(() => {
            taskFn(data);
            resolve();
          }, 0);
        } else {
          taskFn(data);
          resolve();
        }
      }
    });
  }

  // Helper function to chunk an array into smaller pieces
  function chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  // Optimize event handlers to prevent input delay
  function optimizeEventHandlers() {
    if (!config.execution.prioritizeUserInput) return;
    
    // Store original addEventListener
    const originalAddEventListener = EventTarget.prototype.addEventListener;
    
    // Override addEventListener to prioritize user input events
    EventTarget.prototype.addEventListener = function(type, listener, options) {
      // List of high-priority input events that should not be delayed
      const inputEvents = ['click', 'touchstart', 'touchend', 'keydown', 'keyup', 'input', 'change'];
      
      if (inputEvents.includes(type)) {
        // For input events, use the original listener without modification
        originalAddEventListener.call(this, type, listener, options);
      } else {
        // For non-input events, ensure they don't block the main thread
        const wrappedListener = function(event) {
          if (config.features.supportsRAF) {
            requestAnimationFrame(() => {
              listener.call(this, event);
            });
          } else {
            setTimeout(() => {
              listener.call(this, event);
            }, 0);
          }
        };
        
        originalAddEventListener.call(this, type, wrappedListener, options);
      }
    };
  }

  // Defer non-critical operations to idle time
  function deferToIdleTime(tasks) {
    if (!Array.isArray(tasks) || tasks.length === 0) return;
    
    function executeTask(task) {
      if (typeof task === 'function') {
        task();
      } else if (typeof task === 'object' && task.fn) {
        task.fn(...(task.args || []));
      }
    }
    
    if (config.features.supportsRIC) {
      // Use requestIdleCallback if available
      requestIdleCallback((deadline) => {
        let taskIndex = 0;
        
        while (deadline.timeRemaining() > 0 && taskIndex < tasks.length) {
          executeTask(tasks[taskIndex]);
          taskIndex++;
        }
        
        // If we have remaining tasks, schedule them for later
        if (taskIndex < tasks.length) {
          deferToIdleTime(tasks.slice(taskIndex));
        }
      }, { timeout: config.timing.idleTimeout });
    } else {
      // Fallback to setTimeout with a delay
      setTimeout(() => {
        tasks.forEach(task => executeTask(task));
      }, 100);
    }
  }

  // Optimize third-party scripts to reduce main thread blocking
  function optimizeThirdPartyScripts() {
    // Find all third-party scripts
    const scripts = Array.from(document.querySelectorAll('script[src]')).filter(script => {
      const src = script.src.toLowerCase();
      return !src.includes(window.location.hostname) && 
             !src.includes('localhost') && 
             !src.includes('127.0.0.1');
    });
    
    // Add async attribute to scripts without it
    scripts.forEach(script => {
      if (!script.async && !script.defer) {
        script.async = true;
      }
    });
  }

  // Report TBT metrics
  function reportTBTMetrics() {
    if (config.features.supportsPO) {
      // Wait for load + 5 seconds to report metrics
      window.addEventListener('load', () => {
        setTimeout(() => {
          console.info(`Total Blocking Time: ${totalBlockingTime.toFixed(1)}ms from ${longTaskCount} long tasks`);
          
          // Send to analytics if available
          if (window.gtag) {
            window.gtag('event', 'web_vitals', {
              event_category: 'Web Vitals',
              event_label: 'TBT',
              value: Math.round(totalBlockingTime),
              non_interaction: true
            });
          }
        }, 5000);
      });
    }
  }

  // Initialize TBT optimization
  function init() {
    // Start monitoring long tasks
    monitorLongTasks();
    
    // Optimize event handlers
    optimizeEventHandlers();
    
    // Optimize third-party scripts
    if (document.readyState !== 'complete') {
      window.addEventListener('load', optimizeThirdPartyScripts);
    } else {
      optimizeThirdPartyScripts();
    }
    
    // Report metrics
    reportTBTMetrics();
    
    // Expose API for other scripts
    window.tbtOptimizer = {
      breakUpTask: breakUpTask,
      deferToIdleTime: deferToIdleTime,
      getTotalBlockingTime: () => totalBlockingTime
    };
  }

  // Run initialization
  init();
})();
