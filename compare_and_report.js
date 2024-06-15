const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const util = require('util'); // For promisifying exec
const exec = util.promisify(require('child_process').exec);
const { createFilenameFromUrl, viewportWidth, viewportHeight, screenshotDir, urlsFile } = require('./utils'); 

const websiteUrl = require('./utils').websiteUrl;


async function compareAndReport() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: viewportWidth, height: viewportHeight });

  const originalUrls = JSON.parse(fs.readFileSync(urlsFile, 'utf-8'));
  const report = [];

  for (const url of originalUrls) {
    const originalFilename = createFilenameFromUrl(url);
    const originalImagePath = path.join(screenshotDir, originalFilename);
    const newImagePath = path.join(screenshotDir, `new_${originalFilename}`);

    try {
      await page.goto(url, { waitUntil: 'networkidle0' });
      await page.screenshot({ path: newImagePath, fullPage: true });

      const diff = await compareImages(originalImagePath, newImagePath);
      console.log(diff)
      report.push({ url, diff });
      if (diff > 0) {
        createDiffImage(originalImagePath, newImagePath); 
      }

      console.log(`Processed: ${url} (difference: ${diff.toFixed(2)}%)`);
    } catch (error) {
      console.log(error)
      console.error(`Error processing ${url}: ${error.message}`);
      report.push({ url, error: error.message });
    }
  }

  await browser.close();

  // Sort the report by difference percentage (descending)
  report.sort((a, b) => b.diff - a.diff);

  // Add file paths to the report
  const reportWithFilePaths = report.map((item) => {
    const filename = createFilenameFromUrl(item.url);
    return {
      url: item.url,
      diff: item.diff,
      originalImagePath: path.join(screenshotDir, filename),
      newImagePath: path.join(screenshotDir, `new_${filename}`),
      diffImagePath: item.diff > 0 ? path.join(screenshotDir, `diff_${filename}`) : null,
    };
  });

  // Save the sorted report
  const reportFile = path.join(screenshotDir, 'report.json');
  fs.writeFileSync(reportFile, JSON.stringify(reportWithFilePaths, null, 2));
  console.log(`Report saved to: ${reportFile}`);
}


async function compareImages(original, newImage) {
  try {
    const command = `compare -metric AE "${original}" "${newImage}" null: 2>&1 || true`; // Added || true
    console.log(`Executing command: ${command}`);
    const { stdout, stderr } = await exec(command); 

    console.log(`ImageMagick output: ${stdout}`);
    console.log(`ImageMagick stderr: ${stderr}`); 

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

function createDiffImage(original, newImage) {
  const originalFilename = path.basename(original);
  const diffImagePath = path.join(screenshotDir, `diff_${createFilenameFromUrl(originalFilename)}`); 

  exec(`convert "${original}" "${newImage}" -compose difference -composite -threshold 1% "${diffImagePath}"`) // Use 'convert'
    .catch((err) => {
      console.error(`Error creating diff image for ${newImage}: ${err.message}`);
    });
}

compareAndReport();