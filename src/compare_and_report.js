const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const { createFilenameFromUrl, compareImages, createDiffImage } = require('./utils'); 


async function compareAndReport(configFileName, websiteUrl, viewportWidth, viewportHeight, mobile = false, newDomain = null, authUser = null, authPassword = null) {

  const screenshotDir = `./screenshots_${configFileName}`;
  const urlsFile = path.join(screenshotDir, 'urls.json');

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  if (mobile) {
    await page.emulate(puppeteer.devices['iPhone X']); // Emulate an iPhone X
  } else {
    await page.setViewport({ width: viewportWidth, height: viewportHeight });
  }

  const originalUrls = JSON.parse(fs.readFileSync(urlsFile, 'utf-8'));
  const report = [];

  for (const url of originalUrls) {
    const originalFilename = createFilenameFromUrl(url);
    const originalImagePath = path.join(screenshotDir, originalFilename);
    const newImagePath = path.join(screenshotDir, `new_${originalFilename}`);

    try {
      let newUrl = url;
      if (newDomain) {
        const parsedUrl = new URL(url);
        newUrl = `${parsedUrl.protocol}//${newDomain}${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
      }

      if (authUser && authPassword) {
        await page.authenticate({ username: authUser, password: authPassword });
      }

      await page.goto(newUrl, { waitUntil: 'networkidle0' });
      await page.screenshot({ path: newImagePath, fullPage: true });

      const diff = await compareImages(originalImagePath, newImagePath);
      report.push({ url, diff });
      if (diff > 0) {
        createDiffImage(originalImagePath, newImagePath, websiteUrl); 
      }

      console.log(`Processed: ${newUrl} (difference: ${diff.toFixed(2)}%)`);
    } catch (error) {
      console.error(`Error processing ${newUrl}: ${error.message}`);
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