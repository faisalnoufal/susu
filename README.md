# deTravelCafé Website

## Overview
deTravelCafé is a premium travel website specializing in Kerala holiday packages, luxury houseboat cruises, and adventure tours. This repository contains the website code with SEO optimizations and performance enhancements.

## SEO Features

### Structured Data
- **FAQ Schema**: Implemented structured FAQ data using Schema.org markup to help search engines understand the content and potentially display rich results in search.
- **Business Schema**: Added TravelAgency structured data to provide search engines with detailed information about the business.

### Meta Information
- **Optimized Meta Tags**: Concise meta description (140 characters) with relevant keywords.
- **Enhanced Page Title**: Updated with relevant keywords "Kerala Holiday Packages & Tours | deTravelCafé".
- **Open Graph Tags**: Removed duplicate Open Graph tags for better social media sharing.

### SEO Files
- **robots.txt**: Configured with proper crawl directives and sitemap reference.
- **sitemap.xml**: Enhanced with semantic metadata and AI-optimized content attributes.
- **.htaccess**: Implemented expires headers for better caching and performance.

## Performance Optimizations

### Image Handling
- **Lazy Loading**: Images are now lazy-loaded to improve initial page load time.
- **Loading Attribute**: Added native browser lazy loading support with the `loading="lazy"` attribute.
- **Error Handling**: All images have fallback sources in case the primary source fails to load.

### Resource Optimization
- **JavaScript Combination**: Added script to combine and minify JavaScript files.
- **GZIP Compression**: Enabled in .htaccess for faster resource delivery.
- **Browser Caching**: Implemented with appropriate cache durations for different file types.

## Responsive Design
- **Mobile-First Approach**: All components designed with mobile users in mind.
- **Hamburger Menu**: Responsive navigation with hamburger menu below 1024px.
- **Flexible Card Layout**: Hero card and content cards adjust width based on screen size.

## Usage

### Running the JavaScript Combiner
To combine and minify JavaScript files:

1. Install dependencies:
   ```
   npm install uglify-js
   ```

2. Run the combiner script:
   ```
   node js/combine-scripts.js
   ```

### Updating FAQ Content
The FAQ section is linked to structured data. When updating FAQ questions/answers, make sure to:

1. Update the visible FAQ section in the HTML.
2. Update the corresponding structured data in the `<script type="application/ld+json">` section.

## Contact
For questions or support, contact the deTravelCafé team.
