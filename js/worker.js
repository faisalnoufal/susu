/**
 * Web Worker for deTravelCafé
 * Handles CPU-intensive tasks off the main thread
 */

// Handle messages from main thread
self.onmessage = function(e) {
  const { taskId, fn, args } = e.data;
  
  try {
    // Convert function string to actual function
    const taskFn = new Function('return ' + fn)();
    
    // Execute function with provided arguments
    const result = taskFn.apply(null, args);
    
    // Send result back to main thread
    self.postMessage({
      taskId,
      result,
      error: null
    });
  } catch (error) {
    // Send error back to main thread
    self.postMessage({
      taskId,
      result: null,
      error: error.message
    });
  }
};

// Common CPU-intensive functions that can be used by the main thread

// Image processing
function processImage(imageData, options) {
  // Simple image processing example (grayscale conversion)
  if (options.filter === 'grayscale') {
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      data[i] = avg;     // R
      data[i + 1] = avg; // G
      data[i + 2] = avg; // B
    }
  }
  
  return imageData;
}

// Data sorting and filtering
function sortAndFilter(data, options) {
  let result = [...data];
  
  // Apply filters
  if (options.filters) {
    for (const filter of options.filters) {
      const { field, operator, value } = filter;
      
      result = result.filter(item => {
        switch (operator) {
          case '==': return item[field] == value;
          case '===': return item[field] === value;
          case '!=': return item[field] != value;
          case '!==': return item[field] !== value;
          case '>': return item[field] > value;
          case '>=': return item[field] >= value;
          case '<': return item[field] < value;
          case '<=': return item[field] <= value;
          case 'contains': return String(item[field]).includes(value);
          case 'startsWith': return String(item[field]).startsWith(value);
          case 'endsWith': return String(item[field]).endsWith(value);
          default: return true;
        }
      });
    }
  }
  
  // Apply sorting
  if (options.sort) {
    const { field, direction } = options.sort;
    result.sort((a, b) => {
      if (direction === 'asc') {
        return a[field] < b[field] ? -1 : a[field] > b[field] ? 1 : 0;
      } else {
        return a[field] > b[field] ? -1 : a[field] < b[field] ? 1 : 0;
      }
    });
  }
  
  return result;
}

// Complex calculations
function performCalculations(data, operations) {
  const results = {};
  
  for (const [key, operation] of Object.entries(operations)) {
    switch (operation.type) {
      case 'sum':
        results[key] = data.reduce((sum, item) => sum + (item[operation.field] || 0), 0);
        break;
      case 'average':
        results[key] = data.reduce((sum, item) => sum + (item[operation.field] || 0), 0) / (data.length || 1);
        break;
      case 'min':
        results[key] = Math.min(...data.map(item => item[operation.field] || 0));
        break;
      case 'max':
        results[key] = Math.max(...data.map(item => item[operation.field] || 0));
        break;
      case 'count':
        results[key] = data.length;
        break;
      case 'custom':
        if (operation.formula) {
          const formulaFn = new Function('data', 'return ' + operation.formula);
          results[key] = formulaFn(data);
        }
        break;
    }
  }
  
  return results;
}

// Text processing
function processText(text, options) {
  let result = text;
  
  if (options.toLowerCase) {
    result = result.toLowerCase();
  }
  
  if (options.toUpperCase) {
    result = result.toUpperCase();
  }
  
  if (options.trim) {
    result = result.trim();
  }
  
  if (options.replace) {
    for (const replacement of options.replace) {
      result = result.replace(
        new RegExp(replacement.pattern, replacement.flags || 'g'),
        replacement.replacement
      );
    }
  }
  
  if (options.split) {
    result = result.split(options.split);
  }
  
  return result;
}

// Export functions for use in worker
self.processImage = processImage;
self.sortAndFilter = sortAndFilter;
self.performCalculations = performCalculations;
self.processText = processText;
