/**
 * Video Fix for deTravelCafé
 * Ensures videos play properly across all desktop browsers
 */

(function() {
  // Configuration
  const config = {
    videoSelector: '.showcase video',
    fallbackImageSelector: '.showcase img',
    checkInterval: 1000, // ms
    maxChecks: 5,
    forcePlayOnDesktop: true
  };

  // Detect if we're on desktop
  function isDesktop() {
    return window.innerWidth >= 1024;
  }

  // Check if video is actually playing
  function isVideoPlaying(video) {
    return !!(video.currentTime > 0 && !video.paused && !video.ended && video.readyState > 2);
  }

  // Try to play the video with various techniques
  function forcePlayVideo(video) {
    // Make sure video has proper attributes
    video.setAttribute('playsinline', '');
    video.setAttribute('muted', '');
    video.muted = true;
    video.volume = 0;
    
    // Try to play with a promise
    const playPromise = video.play();
    
    if (playPromise !== undefined) {
      playPromise.then(() => {
        // Video is playing successfully
        console.log('Video playing successfully');
      }).catch(error => {
        console.warn('Error playing video:', error);
        
        // If autoplay is prevented, show the fallback image
        showFallbackImage();
      });
    }
  }

  // Show the fallback image if video fails
  function showFallbackImage() {
    const fallbackImage = document.querySelector(config.fallbackImageSelector);
    const video = document.querySelector(config.videoSelector);
    
    if (fallbackImage && video) {
      // Hide video, show image
      video.style.display = 'none';
      fallbackImage.style.display = 'block';
    }
  }

  // Initialize video fix
  function init() {
    const video = document.querySelector(config.videoSelector);
    
    if (!video) return;
    
    // For desktop browsers, ensure video plays
    if (isDesktop() && config.forcePlayOnDesktop) {
      let checkCount = 0;
      
      // Check if video is playing, and if not, try to force play
      const checkVideoInterval = setInterval(() => {
        if (!isVideoPlaying(video)) {
          forcePlayVideo(video);
        } else {
          // Video is playing, clear interval
          clearInterval(checkVideoInterval);
        }
        
        // Stop checking after max attempts
        checkCount++;
        if (checkCount >= config.maxChecks) {
          clearInterval(checkVideoInterval);
        }
      }, config.checkInterval);
      
      // Also try to play on user interaction
      document.addEventListener('click', () => {
        if (!isVideoPlaying(video)) {
          forcePlayVideo(video);
        }
      }, { once: true });
    }
    
    // Handle video error events
    video.addEventListener('error', () => {
      console.warn('Video error detected');
      showFallbackImage();
    });
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
