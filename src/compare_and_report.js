const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const { createFilenameFromUrl, compareImages, createDiffImage } = require('./utils'); 


async function compareAndReport(configFileName, viewportWidth, viewportHeight, mobile = false, newDomain = null, authUser = null, authPassword = null, removeSelectors = []) {

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

      // Remove elements before capturing screenshot
      if (removeSelectors.length > 0) {
        await removeElements(page, removeSelectors);
      }
      
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
      originalImagePath: path.relative(outputDir, path.join(originalDir, filename)), // Relative path
      newImagePath: path.relative(outputDir, path.join(compareDir, filename)),
      diffImagePath: item.diff > 0 ? path.relative(outputDir, path.join(differenceDir, `diff_${filename}`)) : null,
    };
  });

  const reportJson = JSON.stringify(reportWithFilePaths, null, 2); // Stringify the report
    // Generate HTML report
  const htmlReport = generateHtmlReport(reportJson);
  const htmlReportFile = path.join(outputDir, 'index.html');
  fs.writeFileSync(htmlReportFile, htmlReport);

  
  // Save the sorted report
  const reportFile = path.join(outputDir, 'report.json');
  fs.writeFileSync(reportFile, JSON.stringify(reportWithFilePaths, null, 2));
  console.log(`Report saved to: ${reportFile}`);
}

async function removeElements(page, selectors) {
  for (const selector of selectors) {
    try {
      await page.evaluate((sel) => {
        const elements = document.querySelectorAll(sel);
        elements.forEach((element) => element.remove());
      }, selector);
      console.log(`Removed elements matching selector: ${selector}`);
    } catch (error) {
      console.error(`Error removing elements matching selector ${selector}: ${error.message}`);
    }
  }
}

function generateHtmlReport(reportJson) {
  return `
  <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Website Regression Report</title>
      <style>
        body { font-family: sans-serif; }
        .section { margin-bottom: 20px; }
        .section-title { font-weight: bold; margin-bottom: 10px; }
        .report-item { cursor: pointer; padding: 10px; border-bottom: 1px solid #ddd; }
        .report-item:hover { background-color: #f9f9f9; }
        .details { display: none; }
        .image-container { 
          position: relative; 
          width: 100%; 
          max-width: 800px;
          margin: 10px auto; 
          overflow: hidden; /* Prevent scaling */
        }
        .original-image, .new-image { 
          position: absolute; 
          top: 0; 
          left: 0; 
          width: 100%; /* Match container width */
          height: auto; /* Allow height to adjust */
          object-fit: initial; /* No scaling */
        }
        .slider-container { 
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          width: 80%;
          text-align: center; 
          background-color: rgba(255, 255, 255, 0.8);
          padding: 10px;
          box-shadow: 0 -2px 5px rgba(0, 0, 0, 0.2);
          z-index: 1000; 
        }
        .slider { width: 80%; }
        .diff-image {
          max-width: 100%;
          max-height: 400px;
          object-fit: contain;
          display: block;
          margin: 10px auto;
        }
      </style>
    </head>
    <body>
      <h1>Website Regression Report</h1>

      <div id="changed" class="section">
        <div class="section-title">Large Changes</div>
        <div id="changed-list"></div>
      </div>

      <div id="minor-change" class="section">
        <div class="section-title">Minor Changes</div>
        <div id="minor-change-list"></div>
      </div>

      <div id="no-change" class="section">
        <div class="section-title">No Change</div>
        <div id="no-change-list"></div>
      </div>

      <script>
        const report = ${reportJson};

function loadReport() {
          const changedList = document.getElementById('changed-list');
          const minorChangeList = document.getElementById('minor-change-list');
          const noChangeList = document.getElementById('no-change-list');

          report.forEach(item => {
            const reportItem = document.createElement('div');
            reportItem.classList.add('report-item');

            const header = document.createElement('h3');
            header.innerText = \`
              \${item.url} - Difference: \${item.diff.toFixed(2)}%\`;
            reportItem.appendChild(header);

            const details = document.createElement('div');
            details.classList.add('details')
            details.innerHTML = \`
              <div class="image-container">
                <img src="\${item.originalImagePath}" class="original-image">
                <img src="\${item.newImagePath}" class="new-image" style="opacity: 0.5;">
              </div>
              <div class="slider-container">
                <input type="range" min="0" max="1" step="0.01" value="0.5" class="slider">
              </div>
              <img src="\${item.diffImagePath}" class="diff-image">
            \`;
            reportItem.appendChild(details);

            
            header.addEventListener('click', (clickEvent) => {
              const details = reportItem.querySelector('.details');
              details.style.display = details.style.display === 'block' ? 'none' : 'block';

              const slider = reportItem.querySelector('.slider');
              const newImage = reportItem.querySelector('.new-image');
              const originalImage = reportItem.querySelector('.original-image');
              const imageContainer = reportItem.querySelector('.image-container');

              if (slider && newImage && originalImage && imageContainer) {

                const originalHeight = originalImage.naturalHeight;
                const newHeight = newImage.naturalHeight;
                imageContainer.style.height = Math.max(originalHeight, newHeight) + 'px';

                slider.addEventListener('input', (event) => {
                  clickEvent.stopPropagation(); // Stop event propagation
                  newImage.style.opacity = slider.value;
                });
              }
            });

            if (item.diff >= 5) {
              changedList.appendChild(reportItem);
            } else if (item.diff > 0) {
              minorChangeList.appendChild(reportItem);
            } else {
              noChangeList.appendChild(reportItem);
            }
          });
        }

        loadReport();
      </script>
      </body>
    </html>
  `;
}

module.exports = {
  compareAndReport
};