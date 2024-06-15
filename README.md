# Website Regression Testing Tool

This tool helps you identify visual changes on a website between two points in time, making it useful for detecting regressions after updates or changes.

## Features

*   **Crawling and Screenshot Capture:** Crawls a website, extracts unique URLs, and captures full-page screenshots in a specified resolution.
*   **Image Comparison:** Compares new screenshots with previously captured versions to identify visual differences.
*   **Change Reporting:** Generates a detailed report highlighting the percentage of change for each page, along with difference images (blue pixels indicate changes).
*   **Customizable:**  Control viewport size, maximum URLs to crawl, and crawling depth.

## Requirements

*   **Node.js:** Make sure you have Node.js installed on your system. You can check by running `node -v`.
*   **ImageMagick:** You'll need ImageMagick installed on your system. You can check by running `compare -version`.

## Installation

1. **Clone the Repository:**
   ```bash
   git clone [https://github.com/](https://github.com/)<your-username>/<your-repository>.git
   cd <your-repository>
   ```

2. **Install Node.js Dependencies:**
    ```bash
    npm install
    ```
      This will install the necessary Node.js modules listed in `package.json` (Puppeteer and ImageMagick Node.js bindings).

3. **Install ImageMagick (if not already installed):**
    ```bash
    # For Debian/Ubuntu-based systems:
    sudo apt-get install imagemagick

    # For other systems, refer to ImageMagick installation instructions.
    ```

## Usage

### Phase 1: Initial Capture

1. **Run the Script**: Execute the following command, replacing the placeholders with your actual values:
    ```bash
    node crawl_and_capture.js <website_url> <viewport_width> <viewport_height> <max_urls> <max_depth>
    ```

    * `<website_url>`: The URL of the website you want to crawl.
    * `<viewport_width>`: The width of the browser viewport (e.g., 1920).
    * `<viewport_height>`: The height of the browser viewport (e.g., 1080).
    * `<max_urls>`: The maximum number of URLs to crawl (optional, defaults to unlimited).
    * `<max_depth>`: The maximum depth of the crawl (optional, defaults to unlimited).
    
2. **Output**: Screenshots will be saved in the `screenshots_<website_hostname>` directory, and the list of crawled URLs will be saved in `screenshots_<website_hostname>/urls.json`.


### Phase 2: Comparison and Report

1. **Make Changes**: After capturing the initial screenshots (Phase 1), make the desired changes to your website (e.g., software updates).
2. **Run the Script**: Execute the following command from the same directory where you ran Phase 1:
    ```bash
    node compare_and_report.js <website_url> <viewport_width> <viewport_height>
    ```

    * `<website_url>`: The URL of the website you want to crawl.
    * `<viewport_width>`: The width of the browser viewport (e.g., 1920).
    * `<viewport_height>`: The height of the browser viewport (e.g., 1080).

3. **Output**: A detailed report (`report.json`) will be generated in the `screenshots_<website_hostname>` directory. The report will be sorted by the percentage of difference and will include file paths for the original, new, and difference images (if applicable).

## Example

```bash
# Phase 1:
node crawl_and_capture.js https://www.example.com 1920 1080 50 2

# Phase 2 (after making changes):
node compare_and_report.js https://www.example.com 1920 1080
```

## License

This project is licensed under the MIT License.

