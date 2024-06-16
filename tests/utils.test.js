const path = require('path');
const { URL } = require('url');

// Now require 'utils' after mocking the arguments
const { 
  createFilenameFromUrl, 
  isValidInternalLink,
  compareImages
} = require('../src/utils');

describe('utils.js', () => {

  describe('compareImages', () => {
    test('ensure images the same have no difference', async () =>  {
      expect(await compareImages('tests/assets/image1.png', 'tests/assets/image1a.png')).toBe(0);
      expect(await compareImages('tests/assets/image1.png', 'tests/assets/image2.png')).not.toBe(0);
      expect(await compareImages('tests/assets/image1.png', 'tests/assets/image3.png')).toBe(50);
    })
  });

  describe('createFilenameFromUrl', () => {
    test('generates filename from URL', () => {
      expect(createFilenameFromUrl('https://www.example.com/about/us')).toBe('_about_us.png');
      expect(createFilenameFromUrl('https://www.example.com/')).toBe('_.png'); // Homepage
      expect(createFilenameFromUrl('https://www.example.com/products/123')).toBe('_products_123.png');
    });

    test('handles filenames directly', () => {
      expect(createFilenameFromUrl('image.jpg')).toBe('image.jpg');
      expect(createFilenameFromUrl('another_image.png')).toBe('another_image.png');
    });
  });



  describe('isValidInternalLink', () => {
    test('identifies internal links correctly', () => {
      expect(isValidInternalLink('https://www.example.com/contact', 'https://www.example.com/')).toBe(true);
      expect(isValidInternalLink('https://www.example.com/blog/article', 'https://www.example.com/')).toBe(true);
      expect(isValidInternalLink('/relative/path', 'https://www.example.com/')).toBeFalsy();
    });

    test('rejects external links', () => {
      expect(isValidInternalLink('https://www.google.com', 'https://www.example.com/')).toBe(false);
      expect(isValidInternalLink('https://www.othersite.net/page', 'https://www.example.com/')).toBe(false);
    });

    test('handles invalid links', () => {
      expect(isValidInternalLink('invalid-link', 'https://www.example.com/')).toBe(false);
      expect(isValidInternalLink('#fragment', 'https://www.example.com/')).toBe(false);
    });
  });
});