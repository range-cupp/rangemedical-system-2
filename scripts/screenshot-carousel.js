const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// Configure which carousel to screenshot
const CAROUSEL = process.argv[2] || 'panel-quiz-v1';
const INSTAGRAM_DIR = path.join(__dirname, '..', 'instagram');
const OUTPUT_DIR = path.join(INSTAGRAM_DIR, `png-${CAROUSEL.replace('-v1', '').replace('-v2', '')}`);

async function run() {
  // Find all HTML files matching the carousel prefix
  const files = fs.readdirSync(INSTAGRAM_DIR)
    .filter(f => f.startsWith(CAROUSEL) && f.endsWith('.html'))
    .sort();

  if (files.length === 0) {
    console.error(`No files found matching "${CAROUSEL}*.html" in instagram/`);
    process.exit(1);
  }

  // Create output directory
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log(`Found ${files.length} slides. Screenshotting to ${path.basename(OUTPUT_DIR)}/\n`);

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 2 });

  for (const file of files) {
    const filePath = path.join(INSTAGRAM_DIR, file);
    const pngName = file.replace('.html', '.png');
    const outputPath = path.join(OUTPUT_DIR, pngName);

    await page.goto(`file://${filePath}`, { waitUntil: 'networkidle0' });
    // Wait for fonts to load
    await page.evaluate(() => document.fonts.ready);

    await page.screenshot({ path: outputPath, clip: { x: 0, y: 0, width: 1080, height: 1080 } });
    console.log(`  ✓ ${pngName}`);
  }

  await browser.close();
  console.log(`\nDone! ${files.length} images saved to instagram/${path.basename(OUTPUT_DIR)}/`);
}

run().catch(err => { console.error(err); process.exit(1); });
