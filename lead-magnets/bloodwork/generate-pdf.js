import puppeteer from 'puppeteer';
import QRCode from 'qrcode';
import { fileURLToPath } from 'url';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

mkdirSync(path.join(__dirname, 'output'), { recursive: true });

const qrDataUri = await QRCode.toDataURL('https://www.range-medical.com/book-assessment', {
  errorCorrectionLevel: 'M',
  width: 300,
  margin: 1,
  color: { dark: '#0B1B2B', light: '#F7F4EE' }
});

let html = readFileSync(path.join(__dirname, 'lead-magnet.html'), 'utf-8');
html = html.replace('QR_CODE_DATA_URI_PLACEHOLDER', qrDataUri);

const tmpPath = path.join(__dirname, 'lead-magnet-rendered.html');
writeFileSync(tmpPath, html);

const browser = await puppeteer.launch({ headless: 'new' });
const page = await browser.newPage();

await page.goto(`file://${tmpPath}`, {
  waitUntil: 'networkidle0'
});

await page.pdf({
  path: path.join(__dirname, 'output', 'bloodwork-guide.pdf'),
  format: 'Letter',
  printBackground: true,
  margin: { top: '0.5in', bottom: '0.5in', left: '0.5in', right: '0.5in' },
  preferCSSPageSize: true
});

await browser.close();
console.log('PDF generated: output/bloodwork-guide.pdf');
