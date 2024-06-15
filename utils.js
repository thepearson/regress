const path = require('path');
const { URL } = require('url');

// Get website URL from command-line arguments
const websiteUrl = process.argv[2]; 
if (!websiteUrl) {
  console.error('Please provide a website URL as a command-line argument.');
  process.exit(1); 
}

// Define screenshotDir and urlsFile *after* websiteUrl is available
const screenshotDir = `./screenshots_${new URL(websiteUrl).hostname}`; // Unique directory per website
const urlsFile = path.join(screenshotDir, 'urls.json');

const viewportWidth = parseInt(process.argv[3]) || 2560; 
const viewportHeight = parseInt(process.argv[4]) || 1440;

function createFilenameFromUrl(input) {
  try {
    // Try to parse as a URL first
    const parsedUrl = new URL(input);
    return `${parsedUrl.pathname.replace(/\//g, '_')}.png`;
  } catch (error) {
    // If not a URL, assume it's a filename
    return input; 
  }
}

function isValidInternalLink(link) {
  try {
    const parsedLink = new URL(link);
    return parsedLink.origin === new URL(websiteUrl).origin; // Check same origin
  } catch (error) {
    return false; // Invalid URL
  }
}

module.exports = {
  createFilenameFromUrl,
  isValidInternalLink,
  viewportWidth,
  viewportHeight,
  screenshotDir,
  urlsFile,
  websiteUrl // Export the websiteUrl variable
};