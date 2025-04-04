const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const { createFilenameFromUrl, isValidInternalLink } = require('./utils'); 
const { exit } = require('process');

async function crawlAndCapture(configFileName, websiteUrl, viewportWidth, viewportHeight, mobile = false, ignorePatterns = [], maxUrls = Infinity, maxDepth = Infinity) {

  const outputDir = `./output_${configFileName}`;
  const originalDir = path.join(outputDir, 'original');
  const urlsFile = path.join(outputDir, 'urls.json');

  if (!fs.existsSync(originalDir)) {
    fs.mkdirSync(originalDir, { recursive: true });
  }

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const visitedUrls = new Set(); // Track visited URLs to avoid duplicates
  const urlsToCrawl = [{ url: websiteUrl, depth: 0 }]; // Queue with initial URL and depth
  const capturedUrls = []; // To store captured URLs in the JSON file

  if (mobile) {
    await page.emulate(puppeteer.KnownDevices['iPhone 15']); // Emulate an iPhone 15
  } else {
    await page.setViewport({ width: viewportWidth, height: viewportHeight });
  }

  async function crawl() {
    while (urlsToCrawl.length > 0 && capturedUrls.length < maxUrls) {
      const { url, depth } = urlsToCrawl.shift();

      if (visitedUrls.has(url) || depth > maxDepth || shouldIgnoreUrl(url, ignorePatterns)) continue; // Skip if visited or depth exceeded
      visitedUrls.add(url);
      capturedUrls.push(url); // Add to the captured URLs list

      try {
        await page.goto(url, { waitUntil: 'networkidle0' }); 
        
        // Capture the screenshot
        const filename = createFilenameFromUrl(url);
        await page.screenshot({
          path: path.join(originalDir, filename),
          fullPage: true,
        });

        console.log(`Screenshot captured for: ${url}`);

        if (depth < maxDepth) {
          const links = await page.$$eval('a', (links) =>
            links.map((link) => link.href)
          );
          for (const link of links) {
            if (isValidInternalLink(link, websiteUrl) && !shouldIgnoreUrl(link, ignorePatterns)) {
              urlsToCrawl.push({ url: link, depth: depth + 1 });
            }
          }
        } else {
          // do something different
        }
      } catch (error) {
        console.error(`Error processing ${url}: ${error.message}`);
      }
    }
  }

  // Start the crawl from the homepage
  await crawl();
  await browser.close();

  // Save captured URLs to JSON file
  fs.writeFileSync(urlsFile, JSON.stringify(capturedUrls, null, 2));
}

function shouldIgnoreUrl(url, ignorePatterns) {
  for (const pattern of ignorePatterns) {
    if (new RegExp(pattern).test(url)) {
      return true;
    }
  }
  return false;
}

module.exports = {
  crawlAndCapture
}