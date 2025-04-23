# Website Regression Testing Tool

This tool helps you identify visual changes on a website between two points in time, making it useful for detecting regressions after updates or changes.

## Features

*   **Crawling and Screenshot Capture:** Crawls a website, extracts unique URLs, and captures full-page screenshots in a specified resolution.
*   **Image Comparison:** Compares new screenshots with previously captured versions to identify visual differences.
*   **Change Reporting:** Generates a detailed report highlighting the percentage of change for each page, along with difference images (white pixels indicate changes).
*   **Customizable:**  Control viewport size, maximum URLs to crawl, crawling depth and many other options.

## Requirements

*   **Node.js:** Make sure you have Node.js installed on your system. You can check by running `node -v`.
*   **ImageMagick:** You'll need ImageMagick installed on your system. You can check by running `compare -version`.

## Installation

1. **Clone the Repository:**
   ```bash
   git clone git@github.com:thepearson/regress.git
   cd regress
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

### Config

The config folder allows you to create and store locally many configs for different sites, devices and environemtns, for example:

**conf/mysite-mobile.conf**
```
{
  "website": "https://www.mysite.com",
  "viewportWidth": 600,
  "viewportHeight": 800,
  "mobile": true
}
```

Will capture mobile screenshots in the folder `output_mysite-mobile/original`. Running a comparison will place screnshots from the comparison site in `output_mysite-mobile/compare` and comparison screenshots in `output_mysite-mobile/difference`.

You could have the same site and have multiple config files. For example `conf/mysite-prod-v-uat.conf`, `conf/mysite-prod-v-local.conf` ect.



There is an example config file in `conf/example.conf` the parameters are listed below.

example.conf
```
{
  "website": "https://www.example.com",
  "viewportWidth": 1920,
  "viewportHeight": 1080,
  "mobile": false,
  "maxUrls": 100,
  "maxDepth": 2,
  "ignore_patterns": [
    "^\.filter.*", 
    "exclude"
  ],
  "removeSelectors": [
    ".alert",
    ".alert-bubbles"
  ],
  "compareDomain": "uat.example.com",
  "username": "myuser",
  "password": "mypassword"
}
```

 * **website** - The base website to crawl and capture, this is considered the "correct" version, comparison scans will be run against this one.
 * **viewPortWidth** - The width of the screen
 * **viewPortHeight** - The height of the browser screen
 * **mobile** - If we want to capture as a mobile device.
 * **maxUrls** - How many URLs ot total to do, helps limit the amount of testing.
 * **maxDepth** - How deep in the site AI to crawl and capture.
 * **ignorePatterns** - An array of Regular Expressions to test against a URL, these URL'swill be ignored.
 * **removeSelectors** - An array of CSS selectors of elements to remove from the comparison site before taking a screenshot and comparing.
 * **compareDomain** - If the domain we want to compare is on a different host (ie Test or dev) we can run the coparison against this. This allows us to test before we deploy.
 * **username** - If the comparison domain is different from the one we want to compare it to and it has HTTP basic authentication, then this is the username.
 * **password** - If the comparison domain is different from the one we want to compare it to and it has HTTP basic authentication, then this is the password.


### Phase 1: Initial Capture

1. **Run the Script**: Execute the following command, replacing the placeholders with your actual values:
    ```bash
    npm run capture <config-path>
    ```

    * `<config-path>`: the path to the config file.

    
2. **Output**: Screenshots will be saved in the `output_config-filename/original` directory, and the list of crawled URLs will be saved in `output_config-filename/urls.json`.


### Phase 2: Comparison and Report

1. **Make Changes/Compare to other env**: After capturing the initial screenshots (Phase 1), make the desired changes to your website (e.g., software updates).
2. **Run the Script**: Execute the following command from the same directory where you ran Phase 1:
    ```bash
    npm run compare <config-path>
    ```

    * `<config-path>`: the path to the config file.


3. **Output**: A detailed report (`report.json`) will be generated in the `output_config-filename` directory. The report will be sorted by the percentage of difference and will include file paths for the original, new, and difference images (if applicable). An `index.html` file will be generated that displays a list of the URLs in order of most different to least different with a slider so you can see the differences overlaied. The comparison images will be located in `output_config-filename/compare` and the difference images will be located in `output_config-filename/difference`.


### Optional: Generate PDF report for sharing.

1. **Generate the report** - You can run the following to generate a PDF report for sharing.

    ```bash
    npm run report <config-path>
    ```

    * `<config-path>`: the path to the config file.

2. **Output** - A PDF file will be located in `output_config-filename/report.pdf` this report contains information of the comparison.

 * **Original URL** - The original url we captured
 * **Compared URL** - The url of the page we're comparing to the original
 * **Difference** - The percentage difference between the pages
 * **Image thumbnails** - Three thumbnails of the screenshots, Original, Comare and Difference.


## Example

```bash
# Phase 1:
npm run capture conf/exampe.conf

# Phase 2 (after making changes):
npm run compare conf/exampe.conf
```

## License

This project is licensed under the MIT License.

