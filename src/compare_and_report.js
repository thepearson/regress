const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const { createFilenameFromUrl, getScreenshotDir, getUrlsFile, compareImages, createDiffImage } = require('./utils'); 


async function compareAndReport(websiteUrl, viewportWidth, viewportHeight) {

  const urlsFile = getUrlsFile(websiteUrl);
  const screenshotDir = getScreenshotDir(websiteUrl);

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
      report.push({ url, diff });
      if (diff > 0) {
        createDiffImage(originalImagePath, newImagePath, websiteUrl); 
      }

      console.log(`Processed: ${url} (difference: ${diff.toFixed(2)}%)`);
    } catch (error) {
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

module.exports = {
  compareAndReport
};