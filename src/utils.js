const path = require('path');
const { URL } = require('url');
const util = require('util'); // For promisifying exec
const exec = util.promisify(require('child_process').exec);

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

function isValidInternalLink(link, internalUrl) {
  try {
    const parsedLink = new URL(link);
    return parsedLink.origin === new URL(internalUrl).origin; // Check same origin  
  } catch (error) {
    return false; // Invalid URL
  }
}

async function compareImages(original, newImage) {
  try {

    const command = `compare -metric AE "${original}" "${newImage}" null: 2>&1 || true`; // Added || true
    const { stdout, stderr } = await exec(command); 

    // Check if images are identical (no difference)
    if (stdout.trim() === '0') {
      return 0;
    }

    // Handle the case where there is a difference (exit code may be 0 or 1)
    const errorCountMatch = stdout.match(/(\d+(?:\.\d+)?(?:e[+-]\d+)?)/);

    // Handle cases where the command fails or returns unexpected output
    if (!errorCountMatch) {
      throw new Error(`Unexpected ImageMagick output: ${stdout}`);
    }

    const errorCount = parseFloat(errorCountMatch[1]); 
    const { stdout: identifyOutput } = await exec(`identify -format "%w %h" "${newImage}"`); 
    const [width, height] = identifyOutput.trim().split(' ').map(Number);

    const totalPixels = width * height;
    const diffPercentage = (errorCount / totalPixels) * 100;
    return diffPercentage;

  } catch (error) {
    console.error(`Error comparing images: ${error.message}`); 
    return 100; // Assume 100% difference on error
  }
}

function createDiffImage(original, newImage, diffImagePath) {
  exec(`convert "${original}" "${newImage}" -compose difference -composite -threshold 1% "${diffImagePath}"`)
    .catch((err) => {
      console.error(`Error creating diff image for ${newImage}: ${err.message}`);
    });
}

module.exports = {
  createFilenameFromUrl,
  isValidInternalLink,
  createDiffImage,
  compareImages
};