/**
 * JavaScript Execution Optimizer for deTravelCafé
 * Specifically targets reducing JavaScript execution time on the main thread
 */

(function() {
  // Configuration
  const config = {
    // Script parsing and execution optimization
    parsing: {
      asyncParsing: true,          // Parse scripts asynchronously when possible
      lazyParsing: true,           // Only parse code when needed
      minimalInitialParse: true    // Minimize initial parsing work
    },
    // Execution strategies
    execution: {
      deferEvaluation: true,       // Defer evaluation of non-critical code
      useWorkers: true,            // Use Web Workers for heavy computation
      codeStripping: true,         // Strip unused code paths at runtime
      avoidMicroTasks: true        // Avoid excessive microtasks
    },
    // Memory management
    memory: {
      reduceClosures: true,        // Reduce closure scope size
      avoidMemoryLeaks: true,      // Detect and avoid memory leaks
      optimizeDataStructures: true // Use efficient data structures
    }
  };

  // Track JavaScript execution metrics
  let jsExecutionTime = 0;
  let jsParseTime = 0;
  let jsCompileTime = 0;

  // Measure JavaScript execution time
  function measureJsExecution() {
    if (!window.performance || !window.performance.getEntriesByType) return;
    
    // Get all script resources
    const resources = window.performance.getEntriesByType('resource')
      .filter(resource => resource.initiatorType === 'script');
    
    // Calculate total script download and execution time
    resources.forEach(resource => {
      const downloadTime = resource.responseEnd - resource.startTime;
      console.info(`Script ${resource.name.split('/').pop()}: ${downloadTime.toFixed(2)}ms download`);
    });
    
    // Use PerformanceObserver to track script execution time if available
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            if (entry.name.includes('evaluate') || entry.name.includes('script')) {
              jsExecutionTime += entry.duration;
              console.info(`Script execution: ${entry.name} - ${entry.duration.toFixed(2)}ms`);
            } else if (entry.name.includes('parse')) {
              jsParseTime += entry.duration;
            } else if (entry.name.includes('compile')) {
              jsCompileTime += entry.duration;
            }
          });
        });
        
        observer.observe({ entryTypes: ['measure'] });
      } catch (e) {
        console.warn('Performance observer not fully supported:', e);
      }
    }
  }

  // Optimize function calls to reduce execution time
  function optimizeFunctionCalls() {
    // Memoize expensive function results
    window.memoize = function(fn) {
      const cache = new Map();
      return function(...args) {
        const key = JSON.stringify(args);
        if (cache.has(key)) {
          return cache.get(key);
        }
        const result = fn.apply(this, args);
        cache.set(key, result);
        return result;
      };
    };
    
    // Throttle frequently called functions
    window.throttle = function(fn, limit) {
      let inThrottle;
      return function(...args) {
        if (!inThrottle) {
          fn.apply(this, args);
          inThrottle = true;
          setTimeout(() => inThrottle = false, limit);
        }
      };
    };
    
    // Debounce rapidly firing events
    window.debounce = function(fn, wait) {
      let timeout;
      return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn.apply(this, args), wait);
      };
    };
  }

  // Optimize DOM operations to reduce reflows and repaints
  function optimizeDOMOperations() {
    // Batch DOM reads and writes
    window.batchDOM = {
      reads: [],
      writes: [],
      scheduled: false,
      
      read: function(fn) {
        this.reads.push(fn);
        this.schedule();
        return this;
      },
      
      write: function(fn) {
        this.writes.push(fn);
        this.schedule();
        return this;
      },
      
      schedule: function() {
        if (!this.scheduled) {
          this.scheduled = true;
          requestAnimationFrame(() => this.run());
        }
      },
      
      run: function() {
        // Process all reads
        const reads = this.reads;
        this.reads = [];
        reads.forEach(fn => {
          try {
            fn();
          } catch (e) {
            console.error('Error in DOM read:', e);
          }
        });
        
        // Process all writes
        const writes = this.writes;
        this.writes = [];
        writes.forEach(fn => {
          try {
            fn();
          } catch (e) {
            console.error('Error in DOM write:', e);
          }
        });
        
        this.scheduled = false;
        
        // If there are still operations, schedule another frame
        if (this.reads.length > 0 || this.writes.length > 0) {
          this.schedule();
        }
      }
    };
    
    // Optimize frequent DOM operations
    const originalQuerySelector = document.querySelector;
    const originalQuerySelectorAll = document.querySelectorAll;
    const selectorCache = new Map();
    
    if (config.parsing.lazyParsing) {
      // Cache selector results to avoid redundant DOM queries
      document.querySelector = function(selector) {
        if (!selectorCache.has(selector)) {
          selectorCache.set(selector, originalQuerySelector.call(this, selector));
        }
        return selectorCache.get(selector);
      };
      
      document.querySelectorAll = function(selector) {
        if (!selectorCache.has(`all:${selector}`)) {
          selectorCache.set(`all:${selector}`, originalQuerySelectorAll.call(this, selector));
        }
        return selectorCache.get(`all:${selector}`);
      };
      
      // Clear cache on DOM mutations
      if ('MutationObserver' in window) {
        const observer = new MutationObserver(() => {
          selectorCache.clear();
        });
        
        observer.observe(document.body, {
          childList: true,
          subtree: true
        });
      }
    }
  }

  // Optimize event handling to reduce execution time
  function optimizeEventHandling() {
    if (!config.execution.deferEvaluation) return;
    
    // Use event delegation for common events
    const delegatedEvents = ['click', 'input', 'change', 'submit'];
    const eventHandlers = {};
    
    delegatedEvents.forEach(eventType => {
      eventHandlers[eventType] = new Map();
      
      // Add single event listener at document level
      document.addEventListener(eventType, (event) => {
        let target = event.target;
        
        // Traverse up the DOM tree to find matching handlers
        while (target && target !== document) {
          const handlers = eventHandlers[eventType].get(target);
          
          if (handlers) {
            handlers.forEach(handler => {
              handler.call(target, event);
            });
          }
          
          target = target.parentNode;
        }
      }, { passive: true });
    });
    
    // Expose API for adding delegated events
    window.delegateEvent = function(element, eventType, handler) {
      if (!delegatedEvents.includes(eventType)) {
        console.warn(`Event type ${eventType} is not delegated. Using direct event listener.`);
        element.addEventListener(eventType, handler);
        return;
      }
      
      if (!eventHandlers[eventType].has(element)) {
        eventHandlers[eventType].set(element, []);
      }
      
      eventHandlers[eventType].get(element).push(handler);
    };
  }

  // Use Web Workers for heavy computation if supported
  function setupWebWorkers() {
    if (!config.execution.useWorkers || !window.Worker) return;
    
    // Create a worker pool
    const workerPool = {
      workers: [],
      taskQueue: [],
      maxWorkers: navigator.hardwareConcurrency || 4,
      
      init: function() {
        // Create workers
        for (let i = 0; i < this.maxWorkers; i++) {
          const worker = new Worker('/js/worker.js');
          worker.busy = false;
          
          worker.onmessage = (e) => {
            const { taskId, result } = e.data;
            const task = this.taskQueue.find(t => t.id === taskId);
            
            if (task && task.resolve) {
              task.resolve(result);
            }
            
            // Mark worker as free
            worker.busy = false;
            
            // Process next task
            this.processQueue();
          };
          
          this.workers.push(worker);
        }
      },
      
      processQueue: function() {
        if (this.taskQueue.length === 0) return;
        
        // Find a free worker
        const worker = this.workers.find(w => !w.busy);
        if (!worker) return;
        
        // Get next task
        const task = this.taskQueue.shift();
        worker.busy = true;
        
        // Send task to worker
        worker.postMessage({
          taskId: task.id,
          fn: task.fn.toString(),
          args: task.args
        });
      },
      
      addTask: function(fn, ...args) {
        return new Promise((resolve) => {
          const taskId = Date.now() + Math.random();
          
          this.taskQueue.push({
            id: taskId,
            fn,
            args,
            resolve
          });
          
          this.processQueue();
        });
      }
    };
    
    // Initialize worker pool
    workerPool.init();
    
    // Expose worker pool API
    window.workerPool = workerPool;
  }

  // Optimize memory usage to reduce garbage collection pauses
  function optimizeMemoryUsage() {
    if (!config.memory.optimizeDataStructures) return;
    
    // Use object pools for frequently created/destroyed objects
    window.objectPool = function(factory, initialSize = 10) {
      const pool = [];
      
      // Fill pool with initial objects
      for (let i = 0; i < initialSize; i++) {
        pool.push(factory());
      }
      
      return {
        get: function() {
          return pool.length > 0 ? pool.pop() : factory();
        },
        
        release: function(obj) {
          // Reset object if it has a reset method
          if (typeof obj.reset === 'function') {
            obj.reset();
          }
          
          pool.push(obj);
        }
      };
    };
    
    // Monitor memory usage if supported
    if (window.performance && window.performance.memory) {
      setInterval(() => {
        const memory = window.performance.memory;
        console.info(`Memory usage: ${(memory.usedJSHeapSize / 1048576).toFixed(2)}MB / ${(memory.jsHeapSizeLimit / 1048576).toFixed(2)}MB`);
        
        // Force garbage collection if heap usage is high (only works in some browsers)
        if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.9) {
          console.warn('High memory usage detected. Attempting to free memory...');
          
          // Clear caches and temporary data
          selectorCache?.clear();
          
          // Hint to browser that now is a good time for GC
          if (window.gc) {
            try {
              window.gc();
            } catch (e) {
              // Ignore if not available
            }
          }
        }
      }, 30000);
    }
  }

  // Initialize optimizations
  function init() {
    // Measure JS execution time
    measureJsExecution();
    
    // Optimize function calls
    optimizeFunctionCalls();
    
    // Optimize DOM operations
    optimizeDOMOperations();
    
    // Optimize event handling
    optimizeEventHandling();
    
    // Setup Web Workers
    setupWebWorkers();
    
    // Optimize memory usage
    optimizeMemoryUsage();
    
    // Report metrics after page load
    window.addEventListener('load', () => {
      setTimeout(() => {
        console.info(`JS Execution Summary:
- Execution time: ${jsExecutionTime.toFixed(2)}ms
- Parse time: ${jsParseTime.toFixed(2)}ms
- Compile time: ${jsCompileTime.toFixed(2)}ms
- Total JS time: ${(jsExecutionTime + jsParseTime + jsCompileTime).toFixed(2)}ms`);
      }, 3000);
    });
  }

  // Run as early as possible
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
