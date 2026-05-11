import puppeteer from 'puppeteer';
import QRCode from 'qrcode';
import { readFile, stat } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PLACEHOLDER_URL = 'https://range-medical.com/book-assessment';
const OUTPUT_FILE = 'range-medical-methylene-blue-guide.pdf';

async function generatePDF() {
  const htmlPath = join(__dirname, 'lead-magnet.html');
  const cssPath = join(__dirname, 'styles.css');

  let html = await readFile(htmlPath, 'utf-8');
  const css = await readFile(cssPath, 'utf-8');

  const qrDataUrl = await QRCode.toDataURL(PLACEHOLDER_URL, {
    width: 200,
    margin: 1,
    color: { dark: '#0B1B2B', light: '#F7F4EE' },
  });

  html = html.replace('QR_CODE_DATA_URL', qrDataUrl);
  html = html.replace('</head>', `<style>${css}</style></head>`);

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.evaluateHandle('document.fonts.ready');

  const outputPath = join(__dirname, OUTPUT_FILE);
  await page.pdf({
    path: outputPath,
    format: 'Letter',
    printBackground: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
    preferCSSPageSize: false,
  });

  await browser.close();

  const fileInfo = await stat(outputPath);
  const sizeKB = (fileInfo.size / 1024).toFixed(0);
  console.log(`PDF generated: ${outputPath}`);
  console.log(`File size: ${sizeKB} KB`);
}

generatePDF().catch((err) => {
  console.error('PDF generation failed:', err);
  process.exit(1);
});
