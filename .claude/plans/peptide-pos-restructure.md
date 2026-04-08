# Peptide POS Restructure — Protocol Auto-Creation Fixes

## Problem
After restructuring POS items, auto-created protocols have wrong durations, session counts, and naming. Brittany Smith's test purchase created 10-day protocols instead of 30-day for KLOW and MOTS-C.

## Root Cause
1. New POS item names (e.g., "Peptide Therapy — Recovery 30 Day") don't match existing catalog patterns
2. KLOW, AOD-9604, and DSIP have no `PEPTIDE_PRODUCT_CATALOG` entries
3. Recovery 4-Blend and GLOW prices/durations are stale in the catalog
4. 90-day upfront items calculate wrong session counts
5. MOTS-C 20-day defaults to 20 sessions instead of 4
6. Stripe charge description includes peptide names (should be generic)

## Changes

### 1. `lib/protocol-config.js` — Add/update catalog entries

**Add KLOW:**
```js
{
  category: 'recovery',
  medication: 'KLOW (GHK-Cu / KPV / BPC-157 / TB-4)',
  dose: '1.67mg/83mcg/333mcg/333mcg',
  frequencyOptions: ['Daily'],
  defaultFrequency: 'Daily',
  deliveryOptions: ['in_clinic', 'take_home'],
  guideSlug: '/klow-guide',
  durations: [
    { days: 10, label: '10 Day', price: 250 },
    { days: 20, label: '20 Day', price: 450 },
    { days: 30, label: '30 Day', price: 675 },
  ],
  matchPatterns: [/^klow/i, /klow.*\d+.*day/i, /klow.*protocol/i],
}
```

**Add AOD-9604:**
```js
{
  category: 'peptide',
  medication: 'AOD-9604',
  defaultFrequency: 'Daily',
  deliveryOptions: ['take_home'],
  durations: [{ days: 30, label: '30 Day', price: 400 }],
  matchPatterns: [/^aod/i, /aod.*9604/i],
}
```

**Add DSIP:**
```js
{
  category: 'peptide',
  medication: 'DSIP',
  defaultFrequency: 'As Needed',
  deliveryOptions: ['take_home'],
  durations: [{ days: 30, label: '30 Day', price: 200 }],
  matchPatterns: [/^dsip/i, /dsip.*protocol/i],
}
```

**Update Recovery 4-Blend prices** (were $275/500/725 → $250/450/675)

**Update GLOW:**
- Add 10-day ($250) and 20-day ($450) durations
- Fix 30-day price ($400 → $675)

### 2. `lib/auto-protocol.js` — Fix service name parsing

The new POS names follow these patterns:
- `"Peptide Therapy — Recovery 30 Day — KLOW"` (recovery)
- `"Peptide Therapy — Monthly — 2X Blend — CJC/IPA"` (90-day monthly)
- `"Peptide Therapy — 90 Day Program — 2X Blend — CJC/IPA"` (upfront)
- `"Peptide Therapy — 20 Day Protocol — MOTS-C (4x 5mg)"` (MOTS-C)
- `"Peptide Therapy — As Needed — DSIP"` (as-needed)

Update `buildProtocolData` peptide case:
- When parsing the service name, extract the peptide identifier (last part after `—`)
- Pass that to `findPeptideProduct()` instead of the full service name
- For 90-day upfront: multiply 30-day session count by 3
- For MOTS-C: use the `injections` field from the phase data

### 3. `components/POSChargeModal.js` — Fix Stripe description

Change line 572 and 660 to NOT append `peptide_identifier` to the Stripe charge description:
```js
// OLD: sends peptide name to Stripe
const serviceName = item.peptide_identifier ? `${item.name} — ${item.peptide_identifier}` : item.name;

// NEW: keep Stripe description generic, pass peptide_identifier separately
const serviceName = item.name; // Stripe-facing — generic
```

But we still need the peptide_identifier for auto-protocol creation. Add it as a separate field in the record-purchase API call.

### 4. `pages/api/stripe/record-purchase.js` — Accept peptide_identifier separately

Add `peptide_identifier` to the request body and pass it to `autoCreateOrExtendProtocol` so protocols get the right medication without it appearing on Stripe.

### 5. Fix Brittany Smith's protocols

Delete the incorrectly created protocols and recreate them with correct data:
- KLOW: 30-day, 30 sessions, Daily
- MOTS-C: 30-day, 20 sessions (20x 1mg), 5 on / 2 off
- Tesa/IPA: 30-day, 20 sessions, 5 on / 2 off (this one was already wrong — showed as 10-day)

## Files Modified
1. `lib/protocol-config.js` — catalog entries
2. `lib/auto-protocol.js` — service name parsing + session count fixes
3. `components/POSChargeModal.js` — Stripe description + protocol creation
4. `pages/api/stripe/record-purchase.js` — accept peptide_identifier
5. Supabase: fix Brittany's protocols (direct SQL)
