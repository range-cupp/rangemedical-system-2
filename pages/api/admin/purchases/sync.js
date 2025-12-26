// /pages/api/admin/purchases/sync.js
// Sync purchases from GHL CSV export
// Excludes calendar source, dedupes by transaction ID or patient+item+date+amount
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Categorize items
function categorizeItem(itemName) {
  if (!itemName) return 'Other';
  const name = itemName.toLowerCase();
  
  if (name.includes('hrt') || name.includes('testosterone')) return 'HRT';
  if (name.includes('peptide') || name.includes('bpc') || name.includes('tb-500') || name.includes('wolverine')) return 'Peptide';
  if (name.includes('semaglutide') || name.includes('tirzepatide') || name.includes('weight loss') || name.includes('retatrutide')) return 'Weight Loss';
  if (name.includes('iv ') || name.includes('iv-') || name.includes('infusion') || name.includes('drip') || name.includes('range iv')) return 'IV Therapy';
  if (name.includes('nad+') || name.includes('nad ') || name.includes('b12') || name.includes('injection') || name.includes('glutathione') || name.includes('amino')) return 'Injection';
  if (name.includes('lab') || name.includes('blood') || name.includes('panel')) return 'Labs';
  if (name.includes('consult')) return 'Consultation';
  if (name.includes('red light')) return 'Red Light';
  if (name.includes('hyperbaric') || name.includes('hbot')) return 'Hyperbaric';
  if (name.includes('gift card')) return 'Gift Card';
  
  return 'Other';
}

export default async function handler(req, res) {
  if (req.method === 'DELETE') {
    // Delete calendar source transactions
    try {
      const { data, error } = await supabase
        .from('purchases')
        .delete()
        .eq('source', 'calendar')
        .select('id');

      if (error) throw error;

      return res.status(200).json({
        message: 'Calendar transactions deleted',
        deleted: data?.length || 0
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { purchases: newPurchases, dryRun = true } = req.body;

  if (!newPurchases || !Array.isArray(newPurchases)) {
    return res.status(400).json({ error: 'purchases array required' });
  }

  try {
    // Get existing purchases for deduplication
    const { data: existing, error: fetchError } = await supabase
      .from('purchases')
      .select('id, patient_name, item_name, payment_date, amount, created_at');

    if (fetchError) throw fetchError;

    // Build lookup set using patient + item + date + amount combo
    const existingByCombo = new Set(
      existing.map(e => {
        const date = e.payment_date || (e.created_at ? e.created_at.split('T')[0] : '');
        return `${(e.patient_name || '').toLowerCase()}|${(e.item_name || '').toLowerCase()}|${date}|${e.amount}`;
      })
    );

    // Filter to only new purchases
    const toInsert = [];
    const duplicates = [];

    newPurchases.forEach(p => {
      // Skip calendar source
      if (p.source === 'calendar' || p.ghl_source_type === 'calendar') {
        return;
      }

      // Check if already exists by combo
      const date = p.purchase_date || p.payment_date || '';
      const combo = `${(p.patient_name || '').toLowerCase()}|${(p.item_name || '').toLowerCase()}|${date}|${p.amount}`;
      if (existingByCombo.has(combo)) {
        duplicates.push({ reason: 'combo', ...p });
        return;
      }

      // Add to insert list
      toInsert.push({
        ghl_contact_id: p.ghl_contact_id,
        patient_name: p.patient_name,
        patient_email: p.patient_email,
        patient_phone: p.patient_phone,
        item_name: p.item_name,
        amount: parseFloat(p.amount) || 0,
        list_price: p.list_price ? parseFloat(p.list_price) : null,
        quantity: parseInt(p.quantity) || 1,
        category: categorizeItem(p.item_name),
        source: p.source || 'ghl',
        payment_date: p.purchase_date || p.payment_date || null,
        created_at: new Date().toISOString()
      });

      // Add to set to prevent duplicates within the same batch
      existingByCombo.add(combo);
    });

    if (dryRun) {
      return res.status(200).json({
        dryRun: true,
        existing: existing.length,
        newRecords: newPurchases.length,
        toInsert: toInsert.length,
        duplicates: duplicates.length,
        sampleToInsert: toInsert.slice(0, 5),
        sampleDuplicates: duplicates.slice(0, 5)
      });
    }

    // Actually insert
    if (toInsert.length > 0) {
      // Insert in batches of 100
      const batchSize = 100;
      let inserted = 0;
      
      for (let i = 0; i < toInsert.length; i += batchSize) {
        const batch = toInsert.slice(i, i + batchSize);
        const { error: insertError } = await supabase
          .from('purchases')
          .insert(batch);

        if (insertError) {
          console.error('Batch insert error:', insertError);
          throw insertError;
        }
        inserted += batch.length;
      }

      return res.status(200).json({
        dryRun: false,
        inserted,
        duplicatesSkipped: duplicates.length
      });
    }

    return res.status(200).json({
      dryRun: false,
      inserted: 0,
      duplicatesSkipped: duplicates.length,
      message: 'No new records to insert'
    });

  } catch (error) {
    console.error('Sync error:', error);
    return res.status(500).json({ error: error.message });
  }
}
