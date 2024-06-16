const { compareAndReport } = require('../src/compare_and_report');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

jest.mock('util'); // Mock the 'util' module

describe('compare_and_report.js', () => {
  test('compareAndReport function is defined', () => {
    expect(typeof compareAndReport).toBe('function');
  });
});