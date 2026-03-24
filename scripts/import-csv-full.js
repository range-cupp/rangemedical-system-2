// scripts/import-csv-full.js
// Full CSV import — matches to patients (not just existing purchases),
// creates missing purchase records, handles name variations.
//
// Usage: node scripts/import-csv-full.js [--dry-run]

const fs = require('fs');
const path = require('path');

// Load env
try {
  const envContent = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
  for (const line of envContent.split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
  }
} catch (e) {}

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const DRY_RUN = process.argv.includes('--dry-run');
const CSV_DIR = '/Users/chriscupp/Desktop/transactions';

// ── Nickname / alias map for common variations ────────────────────────
const NICKNAMES = {
  'chris': ['christopher','cristopher'],
  'christopher': ['chris'],
  'mike': ['michael'],
  'michael': ['mike'],
  'bob': ['robert','bobby'],
  'robert': ['bob','bobby','rob'],
  'bobby': ['robert','bob'],
  'rob': ['robert'],
  'jim': ['james','jimmy'],
  'james': ['jim','jimmy'],
  'jimmy': ['james','jim'],
  'bill': ['william','billy','will'],
  'william': ['bill','billy','will'],
  'billy': ['william','bill'],
  'will': ['william','bill'],
  'dave': ['david'],
  'david': ['dave'],
  'dan': ['daniel','danny'],
  'daniel': ['dan','danny'],
  'danny': ['daniel','dan'],
  'tom': ['thomas','tommy'],
  'thomas': ['tom','tommy'],
  'tommy': ['thomas','tom'],
  'joe': ['joseph','joey'],
  'joseph': ['joe','joey'],
  'joey': ['joseph','joe'],
  'ben': ['benjamin'],
  'benjamin': ['ben'],
  'matt': ['matthew'],
  'matthew': ['matt'],
  'nick': ['nicholas','nicolas'],
  'nicholas': ['nick'],
  'nicolas': ['nick'],
  'alex': ['alexander','alexandra'],
  'alexander': ['alex','sandy'],
  'alexandra': ['alex'],
  'sandy': ['alexander'],
  'ed': ['edward','eddie'],
  'edward': ['ed','eddie'],
  'eddie': ['ed','edward'],
  'sam': ['samuel','samantha'],
  'samuel': ['sam'],
  'samantha': ['sam'],
  'pat': ['patrick','patricia'],
  'patrick': ['pat'],
  'patricia': ['pat'],
  'jen': ['jennifer','jenny'],
  'jennifer': ['jen','jenny'],
  'jenny': ['jennifer','jen'],
  'liz': ['elizabeth','beth','lizzy'],
  'elizabeth': ['liz','beth','lizzy'],
  'beth': ['elizabeth','liz'],
  'kate': ['katherine','kathryn','kathy','katie'],
  'katherine': ['kate','kathy','katie'],
  'kathryn': ['kate','kathy','katie'],
  'kathy': ['katherine','kathryn','kate'],
  'katie': ['katherine','kathryn','kate'],
  'steve': ['steven','stephen'],
  'steven': ['steve','stephen'],
  'stephen': ['steve','steven'],
  'tony': ['anthony'],
  'anthony': ['tony'],
  'rick': ['richard','ricky','dick'],
  'richard': ['rick','ricky','dick'],
  'dick': ['richard','rick'],
  'andy': ['andrew'],
  'andrew': ['andy'],
  'jeff': ['jeffrey','geoffrey'],
  'jeffrey': ['jeff'],
  'geoffrey': ['jeff'],
  'jon': ['jonathan','johnathan'],
  'jonathan': ['jon','john'],
  'johnathan': ['jon','john'],
  'john': ['jonathan','johnathan','johnny'],
  'johnny': ['john'],
  'missy': ['melissa'],
  'melissa': ['missy'],
  'stacy': ['stacey'],
  'stacey': ['stacy'],
  'rj': [],
  'tj': [],
};

// ── CSV Parser ────────────────────────────────────────────────────────
function parseCSV(content) {
  const lines = content.split('\n');
  if (lines.length < 2) return [];
  const parseRow = (line) => {
    const fields = []; let current = ''; let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') inQuotes = !inQuotes;
      else if (ch === ',' && !inQuotes) { fields.push(current.trim()); current = ''; }
      else current += ch;
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
    if (values.length < headers.length / 2) continue;
    const row = {};
    headers.forEach((h, idx) => { row[h.trim()] = (values[idx] || '').trim(); });
    rows.push(row);
  }
  return rows;
}

function parseMangoMintDate(str) {
  if (!str) return null;
  const months = {Jan:'01',Feb:'02',Mar:'03',Apr:'04',May:'05',Jun:'06',Jul:'07',Aug:'08',Sep:'09',Oct:'10',Nov:'11',Dec:'12'};
  const p = str.split('-'); if (p.length !== 3) return null;
  const mon = months[p[1]]; if (!mon) return null;
  return '20' + p[2] + '-' + mon + '-' + p[0].padStart(2, '0');
}
function parseZenotiDate(str) {
  if (!str) return null;
  const p = str.split('/'); if (p.length !== 3) return null;
  return (p[2].length === 2 ? '20'+p[2] : p[2]) + '-' + p[0].padStart(2,'0') + '-' + p[1].padStart(2,'0');
}
function parseAmount(str) {
  if (!str) return 0;
  const val = parseFloat(str.replace(/[$,\s]/g, ''));
  return isNaN(val) ? 0 : val;
}

// ── Categorize based on description ───────────────────────────────────
function guessCategory(desc) {
  const d = (desc || '').toLowerCase();
  if (d.includes('weight loss') || d.includes('skinny shot') || d.includes('semaglutide') || d.includes('tirzepatide') || d.includes('retatrutide')) return 'weight_loss';
  if (d.includes('peptide') || d.includes('bpc') || d.includes('tb-500') || d.includes('tb500')) return 'peptide';
  if (d.includes('iv ') || d.includes('iv,') || d.includes('hydration') || d.includes('myers') || d.includes('methylene') || d.includes('nad+') || d.includes('nad ') || d.includes('immune')) return 'iv_therapy';
  if (d.includes('hrt') || d.includes('testosterone') || d.includes('trt')) return 'hrt';
  if (d.includes('blood draw') || d.includes('lab')) return 'labs';
  if (d.includes('red light')) return 'red_light';
  if (d.includes('hyperbaric') || d.includes('hbot')) return 'hbot';
  if (d.includes('injection')) return 'injection';
  if (d.includes('consult')) return 'consultation';
  if (d.includes('shipping')) return 'other';
  return 'other';
}

function guessPHIDescription(category) {
  const map = {
    weight_loss: 'Weight Loss Program',
    peptide: 'Peptide Therapy',
    iv_therapy: 'IV Therapy',
    hrt: 'HRT Program',
    labs: 'Lab Work',
    red_light: 'Red Light Therapy',
    hbot: 'Hyperbaric Therapy',
    injection: 'Injection',
    consultation: 'Consultation',
    other: 'Service',
  };
  return map[category] || 'Service';
}

// ── Name matching helpers ─────────────────────────────────────────────
function normalize(s) { return (s || '').toLowerCase().trim().replace(/[^a-z\s]/g, '').replace(/\s+/g, ' '); }

function getNameVariations(firstName) {
  const fn = firstName.toLowerCase();
  const variations = [fn];
  if (NICKNAMES[fn]) variations.push(...NICKNAMES[fn]);
  return variations;
}

function namesMatch(csvName, dbName) {
  const a = normalize(csvName);
  const b = normalize(dbName);
  if (a === b) return true;

  const aParts = a.split(' ').filter(Boolean);
  const bParts = b.split(' ').filter(Boolean);
  if (aParts.length < 2 || bParts.length < 2) return false;

  const aFirst = aParts[0];
  const aLast = aParts[aParts.length - 1];
  const bFirst = bParts[0];
  const bLast = bParts[bParts.length - 1];

  // Last names must match
  if (aLast !== bLast) return false;

  // First names: direct or nickname match
  if (aFirst === bFirst) return true;
  const aVars = getNameVariations(aFirst);
  if (aVars.includes(bFirst)) return true;
  const bVars = getNameVariations(bFirst);
  if (bVars.includes(aFirst)) return true;

  // Check if first name of one is contained in a parenthetical in the other
  // e.g., "Alexander (Sandy) Schwarzenbach"
  if (b.includes(aFirst) || a.includes(bFirst)) return true;

  return false;
}

// ══════════════════════════════════════════════════════════════════════
async function main() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  Full CSV Import ${DRY_RUN ? '(DRY RUN)' : '(LIVE)'}`);
  console.log(`${'='.repeat(60)}\n`);

  // ── Parse CSVs ────────────────────────────────────────────────────
  const file1 = path.join(CSV_DIR, 'Payment 1.csv');
  const file2 = path.join(CSV_DIR, 'Payment 2.csv');
  const file3 = path.join(CSV_DIR, 'Payment 3.csv');

  const allTxns = [];

  // Mango Mint
  if (fs.existsSync(file1)) {
    for (const r of parseCSV(fs.readFileSync(file1, 'utf8'))) {
      const name = r['Client']; const date = parseMangoMintDate(r['Payment Date']); const amount = parseAmount(r['Amount']);
      if (!name || !date || amount <= 0) continue;
      allTxns.push({ name, date, amount, source: 'mango_mint', desc: [r['Services'],r['Products'],r['Packages']].filter(Boolean).join(', '), payMethod: r['Payment Method'] || '' });
    }
  }

  // GHL Invoices (group by invoice #)
  if (fs.existsSync(file2)) {
    const invMap = {};
    for (const r of parseCSV(fs.readFileSync(file2, 'utf8'))) {
      const inv = r['Invoice number']; if (!inv || r['Status'] !== 'Paid') continue;
      if (!invMap[inv]) invMap[inv] = { name: r['Customer Name'], email: r['Customer Email'], date: parseMangoMintDate(r['Issue Date']), amount: parseAmount(r['Invoice Total']), items: [] };
      invMap[inv].items.push(r['Line Item Name']);
    }
    for (const inv of Object.values(invMap)) {
      if (!inv.date || inv.amount <= 0) continue;
      allTxns.push({ name: inv.name, email: inv.email, date: inv.date, amount: inv.amount, source: 'ghl_invoice', desc: inv.items.join(', ') });
    }
  }

  // Zenoti (individual line items)
  if (fs.existsSync(file3)) {
    for (const r of parseCSV(fs.readFileSync(file3, 'utf8'))) {
      const name = r['Guest Name']; const date = parseZenotiDate(r['Sale Date']); const collected = parseAmount(r['Collected']);
      if (!name || !date || collected <= 0) continue;
      allTxns.push({ name, date, amount: Math.round(collected*100)/100, source: 'zenoti', desc: r['Item Name'] || '', payMethod: r['Payment Type'] || '' });
    }
  }

  console.log(`Parsed ${allTxns.length} transactions total\n`);

  // ── Fetch all patients ────────────────────────────────────────────
  console.log('Fetching patients...');
  const patients = [];
  let pg = 0;
  while (true) {
    const { data, error } = await supabase.from('patients')
      .select('id, name, first_name, last_name, full_name, preferred_name, email, phone')
      .order('name')
      .range(pg * 1000, (pg + 1) * 1000 - 1);
    if (error) throw error;
    patients.push(...(data || []));
    if (!data || data.length < 1000) break;
    pg++;
  }
  console.log(`Found ${patients.length} patients\n`);

  // Build patient lookup by normalized name (check all name fields)
  const patientByName = {};
  for (const p of patients) {
    // Use full_name, name, or first+last
    p._displayName = p.full_name || p.name || [p.first_name, p.last_name].filter(Boolean).join(' ');
    const key = normalize(p._displayName);
    if (key && !patientByName[key]) patientByName[key] = p;
    // Also index by preferred_name if different
    if (p.preferred_name) {
      const prefKey = normalize(p.preferred_name + ' ' + (p.last_name || ''));
      if (prefKey && !patientByName[prefKey]) patientByName[prefKey] = p;
    }
  }

  // ── Fetch all purchases in date range ─────────────────────────────
  const dates = allTxns.map(t => t.date).filter(Boolean).sort();
  const minDate = dates[0]; const maxDate = dates[dates.length - 1];

  console.log('Fetching purchases...');
  const purchases = [];
  pg = 0;
  while (true) {
    const { data, error } = await supabase.from('purchases')
      .select('id, patient_id, patient_name, patient_email, purchase_date, amount, amount_paid, item_name, stripe_amount_cents, stripe_status, stripe_payment_intent_id')
      .gte('purchase_date', minDate).lte('purchase_date', maxDate)
      .order('purchase_date')
      .range(pg * 1000, (pg + 1) * 1000 - 1);
    if (error) throw error;
    purchases.push(...(data || []));
    if (!data || data.length < 1000) break;
    pg++;
  }
  console.log(`Found ${purchases.length} purchases in date range\n`);

  // Index purchases by name+date and email+date
  const purchByName = {};
  const purchByEmail = {};
  for (const p of purchases) {
    const nk = normalize(p.patient_name) + '|' + p.purchase_date;
    if (!purchByName[nk]) purchByName[nk] = [];
    purchByName[nk].push(p);
    if (p.patient_email) {
      const ek = p.patient_email.toLowerCase().trim() + '|' + p.purchase_date;
      if (!purchByEmail[ek]) purchByEmail[ek] = [];
      purchByEmail[ek].push(p);
    }
  }

  // ── Process each transaction ──────────────────────────────────────
  const usedIds = new Set();
  const stats = { matched_existing: 0, created_new: 0, amount_fixed: 0, patient_not_found: 0 };
  const created = [];
  const fixed = [];
  const notFound = [];

  for (const txn of allTxns) {
    const txnName = normalize(txn.name);
    const txnEmail = (txn.email || '').toLowerCase().trim();
    const amountCents = Math.round(txn.amount * 100);

    // ── Step 1: Try to match existing purchase ──────────────────
    let match = null;

    // By email + date
    if (txnEmail) {
      const cands = (purchByEmail[txnEmail + '|' + txn.date] || []).filter(p => !usedIds.has(p.id));
      match = bestMatch(cands, amountCents);
    }

    // By exact name + date
    if (!match) {
      const cands = (purchByName[txnName + '|' + txn.date] || []).filter(p => !usedIds.has(p.id));
      match = bestMatch(cands, amountCents);
    }

    // By nickname/variation + date
    if (!match) {
      for (const key of Object.keys(purchByName)) {
        if (!key.endsWith('|' + txn.date)) continue;
        const pName = key.split('|')[0];
        if (namesMatch(txn.name, pName)) {
          const cands = purchByName[key].filter(p => !usedIds.has(p.id));
          match = bestMatch(cands, amountCents);
          if (match) break;
        }
      }
    }

    if (match) {
      usedIds.add(match.id);
      const oldAmt = parseFloat(match.amount_paid || match.amount || 0);
      const mismatch = Math.abs(Math.round(oldAmt * 100) - amountCents) > 1;

      stats.matched_existing++;

      if (mismatch) {
        stats.amount_fixed++;
        fixed.push({ patient: match.patient_name, date: txn.date, was: oldAmt, now: txn.amount });
      }

      if (!DRY_RUN) {
        const upd = {
          stripe_amount_cents: amountCents,
          stripe_status: match.stripe_status || 'succeeded',
          stripe_verified_at: new Date().toISOString(),
        };
        if (mismatch) { upd.amount = txn.amount; upd.amount_paid = txn.amount; }
        await supabase.from('purchases').update(upd).eq('id', match.id);
      }
      continue;
    }

    // ── Step 2: No existing purchase — find the patient and create one ─
    let patient = null;

    // By email
    if (txnEmail) {
      patient = patients.find(p => p.email && p.email.toLowerCase() === txnEmail);
    }

    // By exact name
    if (!patient) {
      patient = patientByName[txnName];
    }

    // By nickname/variation
    if (!patient) {
      for (const p of patients) {
        if (namesMatch(txn.name, p._displayName)) {
          patient = p;
          break;
        }
      }
    }

    if (patient) {
      stats.created_new++;
      const category = guessCategory(txn.desc);
      const newPurchase = {
        patient_id: patient.id,
        patient_name: patient._displayName,
        patient_email: patient.email || null,
        purchase_date: txn.date,
        amount: txn.amount,
        amount_paid: txn.amount,
        item_name: txn.desc || guessPHIDescription(category),
        description: guessPHIDescription(category),
        category,
        source: txn.source,
        stripe_amount_cents: amountCents,
        stripe_status: 'succeeded',
        stripe_verified_at: new Date().toISOString(),
        protocol_created: false,
      };

      created.push({ patient: patient._displayName, csv_name: txn.name, date: txn.date, amount: txn.amount, desc: (txn.desc || '').slice(0, 50), source: txn.source });

      if (!DRY_RUN) {
        const { error } = await supabase.from('purchases').insert(newPurchase);
        if (error) console.error(`  Failed to create purchase for ${patient.patient_name}: ${error.message}`);
      }
    } else {
      stats.patient_not_found++;
      notFound.push({ name: txn.name, date: txn.date, amount: txn.amount, source: txn.source, desc: (txn.desc || '').slice(0, 50) });
    }
  }

  // ── Print results ─────────────────────────────────────────────────
  console.log(`${'─'.repeat(60)}`);
  console.log(`RESULTS ${DRY_RUN ? '(DRY RUN)' : '(APPLIED)'}`);
  console.log(`${'─'.repeat(60)}`);
  console.log(`  Total transactions:     ${allTxns.length}`);
  console.log(`  Matched existing:       ${stats.matched_existing}`);
  console.log(`  Amounts corrected:      ${stats.amount_fixed}`);
  console.log(`  NEW purchases created:  ${stats.created_new}`);
  console.log(`  Patient not found:      ${stats.patient_not_found}`);

  if (created.length > 0) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`NEW PURCHASES CREATED (showing first 30)`);
    console.log(`${'─'.repeat(60)}`);
    for (const c of created.slice(0, 30)) {
      const nameNote = c.csv_name.toLowerCase() !== normalize(c.patient) ? ` (CSV: ${c.csv_name})` : '';
      console.log(`  ${c.patient.padEnd(30)} ${c.date}  $${c.amount.toFixed(2).padStart(8)}  [${c.source}] ${c.desc}${nameNote}`);
    }
    if (created.length > 30) console.log(`  ... and ${created.length - 30} more`);
  }

  if (notFound.length > 0) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`PATIENT NOT FOUND (showing first 20)`);
    console.log(`${'─'.repeat(60)}`);
    for (const n of notFound.slice(0, 20)) {
      console.log(`  ${n.name.padEnd(30)} ${n.date}  $${n.amount.toFixed(2).padStart(8)}  [${n.source}] ${n.desc}`);
    }
    if (notFound.length > 20) console.log(`  ... and ${notFound.length - 20} more`);

    // Write not-found to CSV
    const header = 'Source,Customer Name,Date,Amount,Description';
    const rows = notFound.map(n => {
      const esc = s => '"' + (s||'').replace(/"/g,'""') + '"';
      return [esc(n.source), esc(n.name), n.date, n.amount.toFixed(2), esc(n.desc)].join(',');
    });
    fs.writeFileSync(path.join(CSV_DIR, 'patients-not-found.csv'), header + '\n' + rows.join('\n'));
    console.log(`\n  → Wrote ${notFound.length} to ${CSV_DIR}/patients-not-found.csv`);
  }

  console.log(`\n${DRY_RUN ? 'Run without --dry-run to apply.' : 'Done!'}\n`);
}

function bestMatch(candidates, amountCents) {
  if (!candidates || candidates.length === 0) return null;
  // Prefer exact amount
  const exact = candidates.find(p => Math.abs(Math.round(parseFloat(p.amount_paid || p.amount || 0) * 100) - amountCents) <= 1);
  if (exact) return exact;
  // Then unreconciled
  const unrec = candidates.filter(p => !p.stripe_amount_cents);
  if (unrec.length > 0) {
    return unrec.reduce((best, p) => {
      const d1 = Math.abs(Math.round(parseFloat(p.amount_paid || p.amount || 0) * 100) - amountCents);
      const d2 = Math.abs(Math.round(parseFloat(best.amount_paid || best.amount || 0) * 100) - amountCents);
      return d1 < d2 ? p : best;
    });
  }
  return candidates[0];
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
