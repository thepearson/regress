const { generatePdfReport } = require('../src/report');
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
  compareDomain,
  username,
  password,
  removeSelectors = [] // Add removeSelectors from config
} = config;

// Extract config file name without extension
const configFileName = path.parse(configFilePath).name;

generatePdfReport(configFileName, compareDomain);