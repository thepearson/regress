// Test the crawlAndCapture function
// This would typically involve mocking Puppeteer interactions and file system operations
// For now, we'll just test if the function is defined
const { crawlAndCapture } = require('../src/crawl_and_capture');

describe('crawl_and_capture.js', () => {
  test('crawlAndCapture function is defined', () => {
    expect(typeof crawlAndCapture).toBe('function');
  });
});

