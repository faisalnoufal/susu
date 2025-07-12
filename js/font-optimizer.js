/**
 * Font Optimizer for deTravelCafé
 * Improves performance by optimizing how fonts are loaded and displayed
 */

(function() {
  // Configuration
  const config = {
    fontDisplay: 'optional', // 'swap', 'optional', 'fallback', 'block'
    fontTimeoutMs: 2000,     // Time to wait before falling back to system fonts
    useSessionStorage: true, // Cache font loading status in session storage
    fontFamilies: {
      'Poppins': {
        weights: [400, 500, 600, 700],
        fallback: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif'
      },
      'Open Sans': {
        weights: [400, 600],
        fallback: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif'
      }
    }
  };

  // Check if fonts are already loaded from session storage
  function checkSessionStorage() {
    if (!config.useSessionStorage) return false;
    return sessionStorage.getItem('fontsLoaded') === 'true';
  }

  // Set fonts loaded in session storage
  function setFontsLoaded() {
    if (!config.useSessionStorage) return;
    try {
      sessionStorage.setItem('fontsLoaded', 'true');
    } catch (e) {
      // Session storage might be unavailable in some contexts
      console.warn('Could not save font loading status to sessionStorage');
    }
  }

  // Apply font styles based on loading status
  function applyFontStyles(loaded) {
    const html = document.documentElement;
    
    if (loaded) {
      // Fonts successfully loaded - use web fonts
      html.classList.add('fonts-loaded');
      html.classList.remove('fonts-failed');
      setFontsLoaded();
    } else {
      // Fonts failed to load - use fallback fonts
      html.classList.add('fonts-failed');
      html.classList.remove('fonts-loaded');
    }
    
    // Trigger layout recalculation to prevent FOUT
    document.body.offsetHeight;
  }

  // Generate font-face CSS for optimized loading
  function generateFontFaceCss() {
    let css = '';
    
    // For each font family in config
    Object.entries(config.fontFamilies).forEach(([family, options]) => {
      const { weights, fallback } = options;
      
      // For each weight, generate a font-face declaration
      weights.forEach(weight => {
        css += `
          @font-face {
            font-family: '${family}';
            font-style: normal;
            font-weight: ${weight};
            font-display: ${config.fontDisplay};
            src: local('${family}'), 
                 url('https://fonts.gstatic.com/s/${family.toLowerCase().replace(/\s+/g, '')}/v15/${family.toLowerCase().replace(/\s+/g, '')}-${weight}.woff2') format('woff2');
          }
        `;
      });
      
      // Generate CSS variables for fallback fonts
      css += `
        .fonts-failed {
          --font-family-${family.toLowerCase().replace(/\s+/g, '')}: ${fallback};
        }
        
        .fonts-loaded {
          --font-family-${family.toLowerCase().replace(/\s+/g, '')}: '${family}', ${fallback};
        }
      `;
    });
    
    return css;
  }

  // Use Font Loading API if available
  function loadFontsWithAPI() {
    if (!('FontFace' in window)) {
      console.warn('FontFace API not supported');
      return Promise.reject('FontFace API not supported');
    }
    
    const fontPromises = [];
    
    // For each font family in config
    Object.entries(config.fontFamilies).forEach(([family, options]) => {
      const { weights } = options;
      
      // For each weight, create a FontFace instance and load it
      weights.forEach(weight => {
        const fontUrl = `https://fonts.gstatic.com/s/${family.toLowerCase().replace(/\s+/g, '')}/v15/${family.toLowerCase().replace(/\s+/g, '')}-${weight}.woff2`;
        const font = new FontFace(family, `url(${fontUrl})`, { 
          weight: String(weight),
          display: config.fontDisplay
        });
        
        const fontPromise = font.load()
          .then(loadedFont => {
            document.fonts.add(loadedFont);
            return loadedFont;
          })
          .catch(err => {
            console.warn(`Failed to load font: ${family} ${weight}`, err);
            return Promise.reject(err);
          });
        
        fontPromises.push(fontPromise);
      });
    });
    
    // Return a promise that resolves when all fonts are loaded
    return Promise.all(fontPromises);
  }

  // Fallback method using timeout
  function loadFontsWithTimeout() {
    return new Promise((resolve, reject) => {
      // Set a timeout to resolve after fontTimeoutMs
      const timeout = setTimeout(() => {
        reject(new Error('Font loading timed out'));
      }, config.fontTimeoutMs);
      
      // If document.fonts is available, use it to check loading status
      if ('fonts' in document) {
        document.fonts.ready.then(() => {
          clearTimeout(timeout);
          resolve();
        }).catch(() => {
          clearTimeout(timeout);
          reject(new Error('Font loading failed'));
        });
      }
    });
  }

  // Initialize font optimization
  function init() {
    // Check if fonts are already loaded from a previous visit
    if (checkSessionStorage()) {
      applyFontStyles(true);
      return;
    }
    
    // Add font-face CSS to document
    const style = document.createElement('style');
    style.textContent = generateFontFaceCss();
    document.head.appendChild(style);
    
    // Set initial state to use fallback fonts
    document.documentElement.classList.add('fonts-loading');
    
    // Try to load fonts with FontFace API, fall back to timeout method
    loadFontsWithAPI()
      .then(() => {
        applyFontStyles(true);
      })
      .catch(() => {
        // If FontFace API fails, try timeout method
        return loadFontsWithTimeout()
          .then(() => {
            applyFontStyles(true);
          })
          .catch(() => {
            applyFontStyles(false);
          });
      })
      .finally(() => {
        document.documentElement.classList.remove('fonts-loading');
      });
  }

  // Run initialization when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
