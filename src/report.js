const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function generatePdfReport(configFileName, compareDomain = null) {
  const outputDir = `./output_${configFileName}`;
  const reportPath = path.join(outputDir, 'report.json');

  if (!fs.existsSync(reportPath)) {
    console.error(`Report file not found: ${reportPath}`);
    return;
  }

  const reportData = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));

  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  const htmlContent = await generateHtmlForPdf(reportData, outputDir, compareDomain);

  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
  await page.pdf({
    path: path.join(outputDir, 'report.pdf'),
    format: 'A4',
    printBackground: true,
  });

  await browser.close();

  console.log(`PDF report generated: ${path.join(outputDir, 'report.pdf')}`);
}

async function generateHtmlForPdf(reportData, outputDir, compareDomain) {
  let html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Website Regression Report</title>
      <style>
        body { font-family: sans-serif; }
        .page { margin: 20px; page-break-after: always; }
        .page:last-child { page-break-after: avoid; }
        .url-info { margin-bottom: 10px; }
        .image-container { 
          display: flex; 
          flex-direction: row; /* Stack items vertically */
          align-items: flex-start; /* Align items to the start (left) */
          width: 300px; /* Fixed width for the container */
          min-height: 800px;
          margin: 10px; /* Add some spacing */
        }
        .thumbnail { 
          width: 100%; /* Fill the container width */
          height: auto; /* Adjust height based on content */
          object-fit: contain; /* Maintain aspect ratio */
        }
      </style>
    </head>
    <body>
  `;

  for (let item of reportData) {

    let newUrl = item.url;
    if (compareDomain) {
      const parsedUrl = new URL(item.url);
      newUrl = `${parsedUrl.protocol}//${compareDomain}${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
    }

    const originalBase64 = await imageToBase64(path.join(outputDir, item.originalImagePath), 300); // Resize
    const newBase64 = item.newImagePath ? await imageToBase64(path.join(outputDir, item.newImagePath), 300) : ''; // Resize
    const diffBase64 = item.diffImagePath ? await imageToBase64(path.join(outputDir, item.diffImagePath), 300) : ''; // Resize

    html += `
      <div class="page">
        <div class="url-info">
          <p><strong>Original URL:</strong> ${item.url}</p>
          ${item.newImagePath ? `<p><strong>Compared URL:</strong> ${newUrl}</p>` : ''}
          <p><strong>Difference:</strong> ${item.diff.toFixed(2)}%</p>
        </div>
        <div class="image-container">
          <img src="${originalBase64}" class="thumbnail">
          ${newBase64 ? `<img src="${newBase64}" class="thumbnail">` : ''}
          ${diffBase64 ? `<img src="${diffBase64}" class="thumbnail">` : ''}
        </div>
      </div>
    `;
  }

  html += `
    </body>
    </html>
  `;

  return html;
}

async function imageToBase64(imagePath, maxWidth) {
  try {
    const resizedImage = await sharp(imagePath)
      .resize({ width: maxWidth, fit: 'inside' })
      .toBuffer();

    const base64Image = resizedImage.toString('base64');
    const mimeType = path.extname(imagePath) === '.png' ? 'image/png' : 'image/jpeg';
    return `data:${mimeType};base64,${base64Image}`;
  } catch (error) {
    console.error(`Error processing image ${imagePath}: ${error.message}`);
    return ''; // Return an empty string in case of error
  }
}

module.exports = {
    generatePdfReport
};