/**
 * Resource Loader - Optimizes loading of CSS and JavaScript resources
 * Improves performance by deferring non-critical resources
 */

// Function to load CSS asynchronously
function loadCSS(href, media = 'all') {
  // Create link element
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  link.media = 'print'; // Initially set to print to avoid render blocking
  
  // Add to document head
  document.head.appendChild(link);
  
  // Set onload handler to switch media type
  link.onload = function() {
    link.media = media;
  };
  
  // Fallback for browsers that don't support onload for link elements
  setTimeout(function() {
    link.media = media;
  }, 3000);
}

// Function to preload resources
function preloadResource(href, as) {
  const preload = document.createElement('link');
  preload.rel = 'preload';
  preload.href = href;
  preload.as = as;
  document.head.appendChild(preload);
}

// Function to load JavaScript asynchronously
function loadScript(src, async = true, defer = true) {
  const script = document.createElement('script');
  script.src = src;
  if (async) script.async = true;
  if (defer) script.defer = true;
  document.body.appendChild(script);
  return script;
}

// Preconnect to external domains
function preconnect(url, crossorigin = true) {
  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = url;
  if (crossorigin) link.crossOrigin = 'anonymous';
  document.head.appendChild(link);
}

// Load resources after page load
window.addEventListener('load', function() {
  // Preconnect to external domains
  preconnect('https://cdn.tailwindcss.com');
  preconnect('https://fonts.googleapis.com');
  preconnect('https://fonts.gstatic.com', true);
  preconnect('https://cdn.jsdelivr.net');
  preconnect('https://images.pexels.com');
  
  // Load non-critical CSS
  loadCSS('/css/susu.min.css');
  
  // Load third-party scripts with delay
  setTimeout(function() {
    // Load analytics and other non-essential scripts
    loadScript('https://www.googletagmanager.com/gtag/js?id=G-PXBN3X47W0', true, true);
    
    // Initialize analytics
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-PXBN3X47W0');
  }, 3000); // 3 second delay
});

// Detect when fonts are loaded to prevent layout shifts
if ('fonts' in document) {
  document.fonts.ready.then(function() {
    document.documentElement.classList.add('fonts-loaded');
  });
}
