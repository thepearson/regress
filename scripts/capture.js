const { crawlAndCapture } = require('../src/crawl_and_capture');
const fs = require('fs');
const path = require('path');

// Get the config file path from command-line argument
const configFilePath = process.argv[2];

if (!configFilePath) {
  console.error('Please provide the path to the configuration file as a command-line argument.');
  process.exit(1);
}

// Load the configuration from the JSON file
const config = JSON.parse(fs.readFileSync(configFilePath, 'utf-8'));

// Extract parameters from the configuration
const {
  website = 'https://www.example.com',
  viewportWidth = 2560,
  viewportHeight = 1440,
  mobile = false,
  maxUrls = Infinity,
  maxDepth = Infinity,
  ignore_patterns = []
} = config;

const configFileName = path.parse(configFilePath).name;

// Call the crawlAndCapture function with the extracted parameters
crawlAndCapture(configFileName, website, viewportWidth, viewportHeight, mobile, ignore_patterns, maxUrls, maxDepth);