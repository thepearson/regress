const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const { createFilenameFromUrl, compareImages, createDiffImage } = require('./utils'); 


async function compareAndReport(configFileName, viewportWidth, viewportHeight, mobile = false, newDomain = null, authUser = null, authPassword = null) {

  const outputDir = `./output_${configFileName}`;

  const originalDir = path.join(outputDir, 'original');
  const compareDir = path.join(outputDir, 'compare');
  const differenceDir = path.join(outputDir, 'difference');
  
  const urlsFile = path.join(outputDir, 'urls.json');

  if (!fs.existsSync(compareDir)) {
    fs.mkdirSync(compareDir, { recursive: true });
  }

  if (!fs.existsSync(differenceDir)) {
    fs.mkdirSync(differenceDir, { recursive: true });
  }

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  if (mobile) {
    await page.emulate(puppeteer.KnownDevices['iPhone 15']); // Emulate an iPhone X
  } else {
    await page.setViewport({ width: viewportWidth, height: viewportHeight });
  }

  const originalUrls = JSON.parse(fs.readFileSync(urlsFile, 'utf-8'));
  const report = [];

  for (const url of originalUrls) {
    const originalFilename = createFilenameFromUrl(url);
    const originalImagePath = path.join(originalDir, originalFilename);
    const newImagePath = path.join(compareDir, originalFilename);
    const diffImagePath = path.join(differenceDir, `diff_${originalFilename}`)

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
        createDiffImage(originalImagePath, newImagePath, diffImagePath);
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

  const reportWithFilePaths = report.map((item) => {
    const filename = createFilenameFromUrl(item.url);
    return {
      url: item.url,
      diff: item.diff,
      originalImagePath: path.join(originalDir, filename),
      newImagePath: path.join(compareDir, filename),
      diffImagePath: item.diff > 0 ? path.join(differenceDir, `diff_${filename}`) : null,
    };
  });

  // Save the sorted report
  const reportFile = path.join(outputDir, 'report.json');
  fs.writeFileSync(reportFile, JSON.stringify(reportWithFilePaths, null, 2));
  console.log(`Report saved to: ${reportFile}`);
}

module.exports = {
  compareAndReport
};