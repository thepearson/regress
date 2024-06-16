const { compareAndReport } = require('../src/compare_and_report');

// Get arguments from command line (including websiteUrl)
const websiteUrl = process.argv[2] || 'https://www.example.com';
const viewportWidth = parseInt(process.argv[3]) || 2560;
const viewportHeight = parseInt(process.argv[4]) || 1440;
// 
compareAndReport(websiteUrl, viewportWidth, viewportHeight);