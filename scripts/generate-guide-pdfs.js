#!/usr/bin/env node
// scripts/generate-guide-pdfs.js
// Generate printable PDF versions of all patient guides using Puppeteer
// Range Medical System

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'https://www.range-medical.com';
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'documents', 'guides');

// All guides from AVAILABLE_GUIDES in send-forms.js
const GUIDES = [
  { id: 'hrt-guide', name: 'HRT Guide', file: 'hrt_guide.pdf' },
  { id: 'tirzepatide-guide', name: 'Tirzepatide Guide', file: 'tirzepatide_guide.pdf' },
  { id: 'retatrutide-guide', name: 'Retatrutide Guide', file: 'retatrutide_guide.pdf' },
  { id: 'weight-loss-medication-guide-page', name: 'WL Medication Guide', file: 'weight_loss_medication_guide.pdf' },
  { id: 'bpc-tb4-guide', name: 'BPC/TB4 Guide', file: 'bpc_tb4_guide.pdf' },
  { id: 'glow-guide', name: 'GLOW Guide', file: 'glow_guide.pdf' },
  { id: 'ghk-cu-guide', name: 'GHK-Cu Guide', file: 'ghk_cu_guide.pdf' },
  { id: '3x-blend-guide', name: '3x Blend Guide', file: '3x_blend_guide.pdf' },
  { id: 'nad-guide', name: 'NAD+ Guide', file: 'nad_guide.pdf' },
  { id: 'methylene-blue-iv-guide', name: 'Methylene Blue Guide', file: 'methylene_blue_guide.pdf' },
  { id: 'methylene-blue-combo-iv-guide', name: 'MB+VitC Combo Guide', file: 'methylene_blue_combo_guide.pdf' },
  { id: 'glutathione-iv-guide', name: 'Glutathione Guide', file: 'glutathione_guide.pdf' },
  { id: 'vitamin-c-iv-guide', name: 'Vitamin C Guide', file: 'vitamin_c_guide.pdf' },
  { id: 'range-iv-guide', name: 'Range IV Guide', file: 'range_iv_guide.pdf' },
  { id: 'cellular-reset-guide', name: 'Cellular Reset Guide', file: 'cellular_reset_guide.pdf' },
  { id: 'hbot-guide', name: 'HBOT Guide', file: 'hbot_guide.pdf' },
  { id: 'red-light-guide', name: 'Red Light Guide', file: 'red_light_guide.pdf' },
  { id: 'combo-membership-guide', name: 'Combo Membership', file: 'combo_membership_guide.pdf' },
  { id: 'hbot-membership-guide', name: 'HBOT Membership', file: 'hbot_membership_guide.pdf' },
  { id: 'rlt-membership-guide', name: 'RLT Membership', file: 'rlt_membership_guide.pdf' },
  { id: 'essential-panel-male-guide', name: 'Essential Male Panel', file: 'essential_panel_male_guide.pdf' },
  { id: 'essential-panel-female-guide', name: 'Essential Female Panel', file: 'essential_panel_female_guide.pdf' },
  { id: 'elite-panel-male-guide', name: 'Elite Male Panel', file: 'elite_panel_male_guide.pdf' },
  { id: 'elite-panel-female-guide', name: 'Elite Female Panel', file: 'elite_panel_female_guide.pdf' },
  { id: 'the-blu-guide', name: 'The Blu', file: 'the_blu_guide.pdf' },
];

async function generatePDFs() {
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log(`Generating ${GUIDES.length} guide PDFs...`);
  console.log(`Output: ${OUTPUT_DIR}\n`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  let successCount = 0;
  let errorCount = 0;

  for (const guide of GUIDES) {
    const url = `${BASE_URL}/${guide.id}`;
    const outputPath = path.join(OUTPUT_DIR, guide.file);

    try {
      const page = await browser.newPage();

      // Set viewport for good rendering
      await page.setViewport({ width: 1200, height: 800 });

      // Navigate and wait for page to load
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Wait for content to render fully
      await new Promise(r => setTimeout(r, 1500));

      // Hide the sticky header, mobile menu, and footer for cleaner print
      await page.evaluate(() => {
        // Hide the sticky header (rm-header class)
        const header = document.querySelector('.rm-header') || document.querySelector('header');
        if (header) header.style.display = 'none';

        // Hide any nav elements
        document.querySelectorAll('nav').forEach(el => el.style.display = 'none');

        // Hide mobile menu button
        const mobileBtn = document.querySelector('.rm-mobile-toggle');
        if (mobileBtn) mobileBtn.style.display = 'none';

        // Hide any fixed/sticky positioned elements
        const allEls = document.querySelectorAll('*');
        allEls.forEach(el => {
          const style = window.getComputedStyle(el);
          if ((style.position === 'fixed' || style.position === 'sticky') && el.tagName !== 'SECTION') {
            el.style.display = 'none';
          }
        });

        // Hide site footer (the one with copyright/links, not guide CTA sections)
        const footer = document.querySelector('footer');
        if (footer) footer.style.display = 'none';

        // Remove top padding/margin that was for the sticky nav
        document.body.style.paddingTop = '0';
        document.body.style.marginTop = '0';
        const main = document.querySelector('main');
        if (main) main.style.paddingTop = '0';
      });

      // Generate PDF
      await page.pdf({
        path: outputPath,
        format: 'Letter',
        printBackground: true,
        margin: {
          top: '0.5in',
          right: '0.5in',
          bottom: '0.5in',
          left: '0.5in',
        },
      });

      await page.close();
      successCount++;
      console.log(`✓ ${guide.name} → ${guide.file}`);
    } catch (err) {
      errorCount++;
      console.error(`✗ ${guide.name}: ${err.message}`);
    }
  }

  await browser.close();

  console.log(`\nDone! ${successCount} generated, ${errorCount} errors.`);
}

generatePDFs().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
