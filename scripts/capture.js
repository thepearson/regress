const { crawlAndCapture } = require('../src/crawl_and_capture');

// Get arguments from command line (including websiteUrl)
const websiteUrl = process.argv[2] || 'https://www.example.com';
const viewportWidth = parseInt(process.argv[3]) || 2560;
const viewportHeight = parseInt(process.argv[4]) || 1440;
const maxUrls = parseInt(process.argv[5]) || Infinity;
const maxDepth = parseInt(process.argv[6]) || Infinity;

// 
crawlAndCapture(websiteUrl, viewportWidth, viewportHeight, maxUrls, maxDepth);