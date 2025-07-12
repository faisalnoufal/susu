/**
 * Logo Fix for deTravelCafé
 * Ensures the logo maintains proper dimensions and doesn't get distorted
 */

(function() {
  // Configuration
  const config = {
    // Hero logo (main logo in hero section)
    heroLogo: {
      selector: '.logoimg',
      width: '250px',
      height: '126px'
    },
    // Navbar logo
    navbarLogo: {
      selector: 'img[src="assets/images/susu.png"]',
      height: '96px'
    }
  };

  // Fix all logos on the page
  function fixLogos() {
    // Fix hero logo
    const heroLogos = document.querySelectorAll(config.heroLogo.selector);
    heroLogos.forEach(logo => {
      // Set explicit dimensions
      logo.style.width = config.heroLogo.width;
      logo.style.height = config.heroLogo.height;
      logo.style.maxWidth = config.heroLogo.width;
      logo.style.objectFit = 'contain';
      
      // Remove any classes that might cause distortion
      logo.classList.remove('animate-fade-in');
      
      // Prevent any transitions or animations from affecting the logo
      logo.style.transition = 'none';
      logo.style.animation = 'none';
      
      // Force browser to respect dimensions
      logo.setAttribute('width', config.heroLogo.width.replace('px', ''));
      logo.setAttribute('height', config.heroLogo.height.replace('px', ''));
    });
    
    // Fix navbar logo - using more specific selector to avoid conflicts
    const navbarLogos = document.querySelectorAll('.flex.items-center ' + config.navbarLogo.selector);
    navbarLogos.forEach(navbarLogo => {
      navbarLogo.style.height = config.navbarLogo.height;
      navbarLogo.style.width = 'auto';
      navbarLogo.style.objectFit = 'contain';
      navbarLogo.style.maxWidth = 'none';
    });
  }

  // Run immediately
  fixLogos();
  
  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fixLogos);
  }
  
  // Also run after window load to catch any post-load changes
  window.addEventListener('load', function() {
    // Force logo dimensions after all resources have loaded
    setTimeout(fixLogos, 100);
    // Run again after a longer delay to catch any late changes
    setTimeout(fixLogos, 500);
  });
})();
