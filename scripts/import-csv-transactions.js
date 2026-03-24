// scripts/import-csv-transactions.js
// Parse Mango Mint, GHL Invoice, and Zenoti CSV files
// and reconcile against purchases in Supabase
//
// Usage: node scripts/import-csv-transactions.js [--dry-run]

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load env from .env.local
try {
  const envPath = path.join(__dirname, '..', '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) process.env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
  }
} catch (e) { /* env might already be set */ }

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const DRY_RUN = process.argv.includes('--dry-run');
const CSV_DIR = '/Users/chriscupp/Desktop/transactions';

// ── CSV Parser (handles quoted fields with commas) ────────────────────
function parseCSV(content) {
  const lines = content.split('\n');
  if (lines.length < 2) return [];

  const parseRow = (line) => {
    const fields = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        fields.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    fields.push(current.trim());
    return fields;
  };

  const headers = parseRow(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = parseRow(line);
    if (values.length < headers.length / 2) continue; // skip junk rows
    const row = {};
    headers.forEach((h, idx) => { row[h.trim()] = (values[idx] || '').trim(); });
    rows.push(row);
  }
  return rows;
}

// ── Date parsers ──────────────────────────────────────────────────────
function parseMangoMintDate(str) {
  // "9-Jun-25" → "2025-06-09"
  if (!str) return null;
  const months = { Jan:'01',Feb:'02',Mar:'03',Apr:'04',May:'05',Jun:'06',Jul:'07',Aug:'08',Sep:'09',Oct:'10',Nov:'11',Dec:'12' };
  const parts = str.split('-');
  if (parts.length !== 3) return null;
  const day = parts[0].padStart(2, '0');
  const mon = months[parts[1]];
  const year = '20' + parts[2];
  if (!mon) return null;
  return `${year}-${mon}-${day}`;
}

function parseGHLDate(str) {
  // "7-Nov-25" → "2025-11-07"
  return parseMangoMintDate(str); // same format
}

function parseZenotiDate(str) {
  // "9/5/25" → "2025-09-05"
  if (!str) return null;
  const parts = str.split('/');
  if (parts.length !== 3) return null;
  const mon = parts[0].padStart(2, '0');
  const day = parts[1].padStart(2, '0');
  const year = parts[2].length === 2 ? '20' + parts[2] : parts[2];
  return `${year}-${mon}-${day}`;
}

// ── Amount parser ─────────────────────────────────────────────────────
function parseAmount(str) {
  if (!str) return 0;
  // Remove $, commas, spaces
  const cleaned = str.replace(/[$,\s]/g, '');
  const val = parseFloat(cleaned);
  return isNaN(val) ? 0 : val;
}

// ── Parse each file format ────────────────────────────────────────────
function parseMangoMint(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const rows = parseCSV(content);
  const transactions = [];

  for (const row of rows) {
    const name = row['Client'];
    const date = parseMangoMintDate(row['Payment Date']);
    const amount = parseAmount(row['Amount']);

    if (!name || !date || amount <= 0) continue;
    // Skip the "Generated:" footer row
    if (row['Sale #'] === 'Generated:') continue;

    transactions.push({
      customer_name: name,
      date,
      amount,
      description: [row['Services'], row['Products'], row['Packages']].filter(Boolean).join(', '),
      payment_method: row['Payment Method'] || '',
      source_ref: row['Sale #'],
    });
  }

  return transactions;
}

function parseGHLInvoices(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const rows = parseCSV(content);
  const transactions = [];

  // Group by invoice number since each line item is a separate row
  // but Invoice Total is the actual amount paid for the whole invoice
  const invoiceMap = {};

  for (const row of rows) {
    const invNum = row['Invoice number'];
    if (!invNum) continue;
    if (row['Status'] !== 'Paid') continue;

    if (!invoiceMap[invNum]) {
      invoiceMap[invNum] = {
        customer_name: row['Customer Name'],
        customer_email: row['Customer Email'] || null,
        date: parseGHLDate(row['Issue Date']),
        amount: parseAmount(row['Invoice Total']),
        items: [],
        source_ref: invNum,
      };
    }
    invoiceMap[invNum].items.push(row['Line Item Name']);
  }

  for (const inv of Object.values(invoiceMap)) {
    if (!inv.date || inv.amount <= 0) continue;
    transactions.push({
      customer_name: inv.customer_name,
      customer_email: inv.customer_email,
      date: inv.date,
      amount: inv.amount,
      description: inv.items.join(', '),
      source_ref: inv.source_ref,
    });
  }

  return transactions;
}

function parseZenoti(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const rows = parseCSV(content);
  const transactions = [];

  // Each row is a separate line item — match individually, not grouped
  for (const row of rows) {
    const name = row['Guest Name'];
    const date = parseZenotiDate(row['Sale Date']);
    const collected = parseAmount(row['Collected']);

    if (!name || !date) continue;
    // Skip zero/negative amounts (membership credits, refunds, etc.)
    if (collected <= 0) continue;

    transactions.push({
      customer_name: name,
      date,
      amount: Math.round(collected * 100) / 100,
      description: row['Item Name'] || '',
      payment_method: row['Payment Type'] || '',
      source_ref: row['Invoice No'] || '',
    });
  }

  return transactions;
}

// ── Matching logic (same as the API endpoint) ─────────────────────────
function normalizeName(name) {
  return (name || '').toLowerCase().trim().replace(/\s+/g, ' ');
}

function findBestMatch(candidates, amountCents, usedIds) {
  if (!candidates || candidates.length === 0) return null;
  const available = candidates.filter(p => !usedIds.has(p.id));
  if (available.length === 0) return null;

  // Prefer exact amount match
  const exact = available.find(p => {
    const pCents = Math.round((parseFloat(p.amount_paid || p.amount || 0)) * 100);
    return Math.abs(pCents - amountCents) <= 1;
  });
  if (exact) return exact;

  // Then unreconciled, closest amount
  const unreconciled = available.filter(p => !p.stripe_amount_cents);
  if (unreconciled.length > 0) {
    return unreconciled.reduce((best, p) => {
      const diff = Math.abs(Math.round((parseFloat(p.amount_paid || p.amount || 0)) * 100) - amountCents);
      const bestDiff = Math.abs(Math.round((parseFloat(best.amount_paid || best.amount || 0)) * 100) - amountCents);
      return diff < bestDiff ? p : best;
    });
  }

  return available[0];
}

// ── Main ──────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  CSV Transaction Import ${DRY_RUN ? '(DRY RUN)' : '(LIVE)'}`);
  console.log(`${'='.repeat(60)}\n`);

  // Parse all files
  const file1 = path.join(CSV_DIR, 'Payment 1.csv');
  const file2 = path.join(CSV_DIR, 'Payment 2.csv');
  const file3 = path.join(CSV_DIR, 'Payment 3.csv');

  const mangoMint = fs.existsSync(file1) ? parseMangoMint(file1) : [];
  const ghlInvoices = fs.existsSync(file2) ? parseGHLInvoices(file2) : [];
  const zenoti = fs.existsSync(file3) ? parseZenoti(file3) : [];

  console.log(`Parsed transactions:`);
  console.log(`  Payment 1 (Mango Mint):    ${mangoMint.length} transactions`);
  console.log(`  Payment 2 (GHL Invoices):  ${ghlInvoices.length} transactions`);
  console.log(`  Payment 3 (Zenoti):        ${zenoti.length} transactions`);

  const allTransactions = [
    ...mangoMint.map(t => ({ ...t, source: 'mango_mint' })),
    ...ghlInvoices.map(t => ({ ...t, source: 'ghl_invoice' })),
    ...zenoti.map(t => ({ ...t, source: 'zenoti' })),
  ];

  console.log(`  TOTAL:                     ${allTransactions.length} transactions\n`);

  // Get date range
  const dates = allTransactions.map(t => t.date).filter(Boolean).sort();
  const minDate = dates[0];
  const maxDate = dates[dates.length - 1];
  console.log(`Date range: ${minDate} to ${maxDate}\n`);

  // Fetch ALL purchases in that date range (paginate to get past 1000 limit)
  console.log('Fetching purchases from Supabase...');
  const purchases = [];
  let page = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('purchases')
      .select('id, patient_id, patient_name, patient_email, purchase_date, amount, amount_paid, item_name, category, stripe_amount_cents, stripe_status, stripe_payment_intent_id')
      .gte('purchase_date', minDate)
      .lte('purchase_date', maxDate)
      .order('purchase_date')
      .range(page * pageSize, (page + 1) * pageSize - 1);
    if (error) throw error;
    purchases.push(...(data || []));
    if (!data || data.length < pageSize) break;
    page++;
  }
  console.log(`Found ${purchases.length} purchases in date range\n`);

  // Build indexes
  const byEmail = {};
  const byName = {};
  for (const p of purchases) {
    if (p.patient_email) {
      const key = `${p.patient_email.toLowerCase()}|${p.purchase_date}`;
      if (!byEmail[key]) byEmail[key] = [];
      byEmail[key].push(p);
    }
    const nameKey = `${normalizeName(p.patient_name)}|${p.purchase_date}`;
    if (!byName[nameKey]) byName[nameKey] = [];
    byName[nameKey].push(p);
  }

  // Match transactions
  const usedIds = new Set();
  const results = { matched: 0, mismatches: 0, correct: 0, unmatched: 0, updated: 0 };
  const mismatchDetails = [];
  const unmatchedDetails = [];

  for (const txn of allTransactions) {
    const amountCents = Math.round(txn.amount * 100);
    const txnName = normalizeName(txn.customer_name);
    const txnEmail = (txn.customer_email || '').toLowerCase().trim();

    let match = null;
    let matchMethod = null;

    // Strategy 1: email + date
    if (txnEmail) {
      match = findBestMatch(byEmail[`${txnEmail}|${txn.date}`], amountCents, usedIds);
      if (match) matchMethod = 'email+date';
    }

    // Strategy 2: exact name + date
    if (!match) {
      match = findBestMatch(byName[`${txnName}|${txn.date}`], amountCents, usedIds);
      if (match) matchMethod = 'name+date';
    }

    // Strategy 3: fuzzy name + date (all name parts present)
    if (!match && txnName) {
      const parts = txnName.split(' ').filter(Boolean);
      if (parts.length >= 2) {
        for (const key of Object.keys(byName)) {
          if (!key.endsWith(`|${txn.date}`)) continue;
          const [pName] = key.split('|');
          if (parts.every(part => pName.includes(part))) {
            match = findBestMatch(byName[key], amountCents, usedIds);
            if (match) { matchMethod = 'fuzzy_name+date'; break; }
          }
        }
      }
    }

    if (match) {
      usedIds.add(match.id);
      const oldAmount = parseFloat(match.amount_paid || match.amount || 0);
      const oldCents = Math.round(oldAmount * 100);
      const mismatch = Math.abs(oldCents - amountCents) > 1;

      results.matched++;
      if (mismatch) {
        results.mismatches++;
        mismatchDetails.push({
          patient: match.patient_name,
          date: txn.date,
          was: oldAmount,
          now: txn.amount,
          diff: (txn.amount - oldAmount).toFixed(2),
          method: matchMethod,
          source: txn.source,
        });
      } else {
        results.correct++;
      }

      // Update the purchase
      if (!DRY_RUN) {
        const updateData = {
          stripe_amount_cents: amountCents,
          stripe_status: match.stripe_status || 'succeeded',
          stripe_verified_at: new Date().toISOString(),
        };
        if (mismatch) {
          updateData.amount = txn.amount;
          updateData.amount_paid = txn.amount;
        }
        const { error: uErr } = await supabase
          .from('purchases')
          .update(updateData)
          .eq('id', match.id);
        if (uErr) {
          console.error(`  Failed to update ${match.id}: ${uErr.message}`);
        } else {
          results.updated++;
        }
      }
    } else {
      results.unmatched++;
      unmatchedDetails.push({
        name: txn.customer_name,
        date: txn.date,
        amount: txn.amount,
        source: txn.source,
        description: (txn.description || '').slice(0, 60),
      });
    }
  }

  // Print results
  console.log(`${'─'.repeat(60)}`);
  console.log(`RESULTS ${DRY_RUN ? '(DRY RUN — no changes made)' : '(APPLIED)'}`);
  console.log(`${'─'.repeat(60)}`);
  console.log(`  Matched:        ${results.matched} / ${allTransactions.length}`);
  console.log(`  Amount correct:  ${results.correct}`);
  console.log(`  Amount fixed:    ${results.mismatches}`);
  console.log(`  Unmatched:       ${results.unmatched}`);
  if (!DRY_RUN) console.log(`  DB updated:      ${results.updated}`);

  if (mismatchDetails.length > 0) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`AMOUNT CORRECTIONS (showing first 30)`);
    console.log(`${'─'.repeat(60)}`);
    for (const m of mismatchDetails.slice(0, 30)) {
      const arrow = parseFloat(m.diff) > 0 ? '↑' : '↓';
      console.log(`  ${m.patient.padEnd(30)} ${m.date}  $${m.was.toFixed(2).padStart(8)} → $${m.now.toFixed(2).padStart(8)}  (${arrow}${m.diff})  [${m.source}/${m.method}]`);
    }
    if (mismatchDetails.length > 30) console.log(`  ... and ${mismatchDetails.length - 30} more`);
  }

  if (unmatchedDetails.length > 0) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`UNMATCHED TRANSACTIONS (showing first 20)`);
    console.log(`${'─'.repeat(60)}`);
    for (const u of unmatchedDetails.slice(0, 20)) {
      console.log(`  ${(u.name || '—').padEnd(30)} ${u.date}  $${u.amount.toFixed(2).padStart(8)}  [${u.source}] ${u.description}`);
    }
    if (unmatchedDetails.length > 20) console.log(`  ... and ${unmatchedDetails.length - 20} more`);
  }

  console.log(`\n${DRY_RUN ? 'Run without --dry-run to apply changes.' : 'Done! All changes applied.'}\n`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
