const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const { createFilenameFromUrl, isValidInternalLink, screenshotDir, urlsFile, websiteUrl } = require('./utils'); 


// Get arguments from command line (including websiteUrl)
const viewportWidth = parseInt(process.argv[3]) || 2560; 
const viewportHeight = parseInt(process.argv[4]) || 1440;
const maxUrls = parseInt(process.argv[5]) || Infinity; 
const maxDepth = parseInt(process.argv[6]) || Infinity; 

if (!websiteUrl) {
  console.error('Please provide a website URL as a command-line argument.');
  process.exit(1); 
}

async function crawlAndCapture() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const visitedUrls = new Set(); // Track visited URLs to avoid duplicates
  const urlsToCrawl = [{ url: websiteUrl, depth: 0 }]; // Queue with initial URL and depth
  const capturedUrls = []; // To store captured URLs in the JSON file

  // Set viewport size
  await page.setViewport({ width: viewportWidth, height: viewportHeight });

  async function crawl() {
    while (urlsToCrawl.length > 0 && capturedUrls.length < maxUrls) {
      const { url, depth } = urlsToCrawl.shift();

      if (visitedUrls.has(url) || depth > maxDepth) continue; // Skip if visited or depth exceeded
      visitedUrls.add(url);
      capturedUrls.push(url); // Add to the captured URLs list

      try {
        await page.goto(url, { waitUntil: 'networkidle0' }); 
        
        // Capture the screenshot
        const filename = createFilenameFromUrl(url);
        await page.screenshot({
          path: path.join(screenshotDir, filename),
          fullPage: true,
        });

        console.log(`Screenshot captured for: ${url}`);

        if (depth < maxDepth) {
          const links = await page.$$eval('a', (links) =>
            links.map((link) => link.href)
          );
          for (const link of links) {
            if (isValidInternalLink(link)) {
              urlsToCrawl.push({ url: link, depth: depth + 1 });
            }
          }
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

// Create the screenshot directory if it doesn't exist
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir);
}

crawlAndCapture();