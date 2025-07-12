// Script to combine and minify JavaScript files
const fs = require('fs');
const path = require('path');
const UglifyJS = require('uglify-js');

// Configuration
const config = {
  // Input files to combine (in order of dependency)
  inputFiles: [
    '../js/susu.js',
    // Add other JS files here that should be combined
  ],
  // Output file
  outputFile: '../js/susu.min.js',
  // Options for UglifyJS
  uglifyOptions: {
    compress: {
      drop_console: true,
      drop_debugger: true
    },
    mangle: true,
    output: {
      comments: 'some' // Preserve license comments
    }
  }
};

// Function to read and combine files
function combineFiles(files) {
  let combined = '';
  
  files.forEach(file => {
    try {
      const filePath = path.resolve(__dirname, file);
      const content = fs.readFileSync(filePath, 'utf8');
      combined += content + '\n';
      console.log(`✓ Added ${file}`);
    } catch (err) {
      console.error(`✗ Error reading ${file}: ${err.message}`);
    }
  });
  
  return combined;
}

// Main process
console.log('Starting script combination and minification...');

// Combine files
const combinedCode = combineFiles(config.inputFiles);

// Minify the combined code
const minified = UglifyJS.minify(combinedCode, config.uglifyOptions);

if (minified.error) {
  console.error('Error during minification:', minified.error);
  process.exit(1);
}

// Write the minified code to the output file
const outputPath = path.resolve(__dirname, config.outputFile);
fs.writeFileSync(outputPath, minified.code);

console.log(`✓ Successfully created ${config.outputFile}`);
console.log(`  Original size: ${combinedCode.length} bytes`);
console.log(`  Minified size: ${minified.code.length} bytes`);
console.log(`  Reduction: ${Math.round((1 - minified.code.length / combinedCode.length) * 100)}%`);
