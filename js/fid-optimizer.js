/**
 * FID Optimizer for deTravelCafé
 * Improves First Input Delay by optimizing JavaScript execution
 */

(function() {
  // Configuration
  const config = {
    // Maximum time to block the main thread (ms)
    maxBlockTime: 50,
    // Long tasks threshold (ms)
    longTaskThreshold: 50,
    // Chunk size for breaking up heavy operations
    chunkSize: 10,
    // Delay between chunks (ms)
    chunkDelay: 1,
    // Enable task scheduling
    enableTaskScheduling: true,
    // Enable long task monitoring
    enableLongTaskMonitoring: true
  };

  // Store deferred tasks
  const taskQueue = [];
  let isProcessingQueue = false;

  // Monitor long tasks
  function monitorLongTasks() {
    if (!('PerformanceObserver' in window)) return;
    
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          // Log long tasks for debugging
          console.warn(`Long task detected: ${entry.duration.toFixed(2)}ms`, entry);
          
          // If we have a very long task, break up subsequent operations
          if (entry.duration > config.longTaskThreshold * 2) {
            config.chunkSize = Math.max(1, config.chunkSize / 2);
            config.chunkDelay = Math.min(10, config.chunkDelay * 2);
          }
        }
      });
      
      observer.observe({ entryTypes: ['longtask'] });
    } catch (e) {
      console.warn('Long task monitoring not supported:', e);
    }
  }

  // Schedule a task to run when the browser is idle
  function scheduleTask(task, priority = 'normal') {
    return new Promise((resolve) => {
      const taskInfo = {
        task,
        priority,
        resolve
      };
      
      // Add task to queue based on priority
      if (priority === 'high') {
        taskQueue.unshift(taskInfo);
      } else {
        taskQueue.push(taskInfo);
      }
      
      // Start processing queue if not already running
      if (!isProcessingQueue) {
        processTaskQueue();
      }
    });
  }

  // Process tasks in the queue
  function processTaskQueue() {
    if (taskQueue.length === 0) {
      isProcessingQueue = false;
      return;
    }
    
    isProcessingQueue = true;
    const taskInfo = taskQueue.shift();
    
    // Use requestIdleCallback if available, otherwise use setTimeout
    const scheduleNextTask = () => {
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(
          (deadline) => {
            try {
              // Execute the task
              const result = taskInfo.task();
              taskInfo.resolve(result);
            } catch (e) {
              console.error('Error executing scheduled task:', e);
              taskInfo.resolve(null);
            }
            
            // Schedule next task with a small delay
            setTimeout(processTaskQueue, 0);
          },
          { timeout: 50 }
        );
      } else {
        setTimeout(() => {
          try {
            // Execute the task
            const result = taskInfo.task();
            taskInfo.resolve(result);
          } catch (e) {
            console.error('Error executing scheduled task:', e);
            taskInfo.resolve(null);
          }
          
          // Schedule next task
          setTimeout(processTaskQueue, 0);
        }, 0);
      }
    };
    
    scheduleNextTask();
  }

  // Process an array in chunks to avoid blocking the main thread
  function processInChunks(array, processFn) {
    return new Promise((resolve) => {
      const results = [];
      let index = 0;
      
      function processNextChunk() {
        // Process a chunk of items
        const end = Math.min(index + config.chunkSize, array.length);
        
        for (let i = index; i < end; i++) {
          try {
            const result = processFn(array[i], i);
            results.push(result);
          } catch (e) {
            console.error('Error processing item:', e);
          }
        }
        
        index = end;
        
        // If we're done, resolve the promise
        if (index >= array.length) {
          resolve(results);
          return;
        }
        
        // Schedule the next chunk
        setTimeout(processNextChunk, config.chunkDelay);
      }
      
      // Start processing
      processNextChunk();
    });
  }

  // Optimize event listeners to reduce main thread blocking
  function optimizeEventListeners() {
    // Store original addEventListener
    const originalAddEventListener = EventTarget.prototype.addEventListener;
    
    // Override addEventListener to optimize certain events
    EventTarget.prototype.addEventListener = function(type, listener, options) {
      // Events that can cause jank if not optimized
      const highFrequencyEvents = ['scroll', 'mousemove', 'touchmove', 'pointermove', 'resize'];
      
      if (highFrequencyEvents.includes(type)) {
        // Create a debounced/throttled version of the listener
        let lastExecution = 0;
        const throttleDelay = 100; // ms
        
        const optimizedListener = function(event) {
          const now = Date.now();
          
          // Throttle execution
          if (now - lastExecution >= throttleDelay) {
            lastExecution = now;
            listener.call(this, event);
          }
        };
        
        // Call the original addEventListener with our optimized listener
        return originalAddEventListener.call(
          this,
          type,
          optimizedListener,
          options
        );
      }
      
      // For other events, use the original behavior
      return originalAddEventListener.call(this, type, listener, options);
    };
  }

  // Optimize animations to reduce layout thrashing
  function optimizeAnimations() {
    // Check if we have requestAnimationFrame
    if (!('requestAnimationFrame' in window)) return;
    
    // Store pending layout reads and writes
    const layoutReads = [];
    const layoutWrites = [];
    
    // Batch DOM reads
    window.batchDomRead = function(readFn) {
      return new Promise((resolve) => {
        layoutReads.push(() => {
          const result = readFn();
          resolve(result);
        });
        
        scheduleLayoutFlush();
      });
    };
    
    // Batch DOM writes
    window.batchDomWrite = function(writeFn) {
      return new Promise((resolve) => {
        layoutWrites.push(() => {
          const result = writeFn();
          resolve(result);
        });
        
        scheduleLayoutFlush();
      });
    };
    
    let isFlushScheduled = false;
    
    // Schedule a layout flush
    function scheduleLayoutFlush() {
      if (isFlushScheduled) return;
      
      isFlushScheduled = true;
      
      requestAnimationFrame(() => {
        // First do all reads
        const reads = layoutReads.splice(0, layoutReads.length);
        reads.forEach((readFn) => readFn());
        
        // Then do all writes
        const writes = layoutWrites.splice(0, layoutWrites.length);
        writes.forEach((writeFn) => writeFn());
        
        isFlushScheduled = false;
        
        // If there are still pending operations, schedule another flush
        if (layoutReads.length > 0 || layoutWrites.length > 0) {
          scheduleLayoutFlush();
        }
      });
    }
  }

  // Expose API for other scripts
  window.fidOptimizer = {
    scheduleTask,
    processInChunks
  };

  // Initialize optimizations
  function init() {
    if (config.enableLongTaskMonitoring) {
      monitorLongTasks();
    }
    
    optimizeEventListeners();
    optimizeAnimations();
  }

  // Run as early as possible
  init();
})();
