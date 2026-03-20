# Front Desk Medication Logging Guide

**Range Medical — Standard Operating Procedure**

---

## The Golden Rule

**Every time medication leaves this clinic — whether handed to a patient, injected in-clinic, or shipped overnight — it must be logged through the POS system.** The system handles the rest automatically.

---

## How It Works (The Short Version)

When you charge a patient through the POS:

1. **Purchase record** is created (what they paid for)
2. **Protocol** is automatically created or extended (their treatment plan)
3. **Service log entry** is automatically created (proof medication was dispensed)

**You don't need to manually create protocols or service log entries.** The POS charge triggers everything.

---

## By Medication Type

### Weight Loss (Tirzepatide, Retatrutide, Semaglutide)

**What to do:**
1. Open POS (charge button on patient profile)
2. Select the correct medication and plan (e.g., "Retatrutide — Monthly — 4 mg/week x2")
3. **Select fulfillment method:**
   - **Picked Up In Clinic** — patient is taking it home today
   - **Overnighted** — being shipped to patient (enter tracking number)
4. Process payment

**What happens automatically:**
- Purchase is recorded with the medication name
- Protocol is created (or extended if they're a returning patient)
- Service log pickup entry is created with medication, dose, quantity, and fulfillment method
- All sessions are marked as dispensed (take-home = all at once)

**Important:** The medication name (Tirzepatide, Retatrutide, Semaglutide) is parsed from the service you select. Always select the correct service — don't use a generic "Weight Loss" charge.

---

### HRT / Testosterone

**What to do:**
1. Open POS
2. Select "Testosterone Cypionate" (the HRT service)
3. **Select fulfillment method:**
   - **Picked Up In Clinic** — patient picks up their vial/syringes today
   - **Overnighted** — being shipped (enter tracking number)
4. Process payment

**What happens automatically:**
- Purchase recorded with "Testosterone Cypionate" as the medication
- HRT protocol created or extended (+30 days)
- Service log pickup entry created with medication name and fulfillment details

**Dispensing schedule:** HRT patients get medication on different intervals:
- **Monthly** — standard refill every 30 days
- **Every 8 weeks** — some patients on longer cycles
- **Full vial** — 5ml or 10ml vial (lasts 70-140 days)

Each time they pay for a refill, just run the POS charge. The protocol automatically extends.

---

### Peptides (BPC-157, Thymosin Beta-4, GLOW, Tesamorelin/Ipamorelin, etc.)

**What to do:**
1. Open POS
2. Select the correct peptide product:
   - **Protocol format:** "Peptide Therapy — Recovery 10 Day" (for in-clinic injection protocols)
   - **Vial format:** "BPC-157 / Thymosin Beta-4 Vial" (for take-home vials)
3. **Select fulfillment method:**
   - **Picked Up In Clinic** — patient picks up vial or gets injected today
   - **Overnighted** — vial being shipped (enter tracking number)
4. Process payment

**What happens automatically:**
- Purchase recorded with the specific peptide name (e.g., "BPC-157 / Thymosin Beta-4")
- Protocol created with correct medication, dose, and frequency
- Service log entry created for take-home pickups

**Important:** Make sure to select the right product. "BPC-157 / Thymosin Beta-4 Vial" is different from "GLOW Vial" — each has a different medication and dosing protocol.

---

### IV Therapy

**What to do:**
1. Open POS
2. Select the specific IV (e.g., "Myers Cocktail", "NAD+ IV", "Immunity Drip")
3. Process payment

**What happens automatically:**
- Purchase recorded
- For packs/memberships: protocol created with session count
- Sessions are logged individually via the Service Log when the patient comes in

**Note:** Single IV sessions don't create a protocol — only packs and memberships do.

---

### In-Clinic Sessions (HBOT, Red Light Therapy)

**What to do:**
1. Open POS
2. Select the session or pack (e.g., "HBOT 10-Pack", "Red Light Membership")
3. Process payment

**What happens automatically:**
- Purchase recorded
- Protocol created with total sessions
- Individual sessions are logged via the Service Log when the patient comes in

---

## Fulfillment Options (New!)

For **all take-home medication** (weight loss, HRT, peptides), you'll now see a fulfillment section at checkout:

| Option | When to Use |
|--------|-------------|
| **Picked Up In Clinic** | Patient is physically here and taking medication home |
| **Overnighted** | Medication is being shipped to the patient |

If you select **Overnighted**, enter the tracking number if you have it. You can also add it later.

---

## Common Mistakes to Avoid

1. **Don't use "Custom Charge"** for medication — always select the specific product so the medication name gets logged correctly
2. **Don't forget to select fulfillment method** — this tracks whether medication was picked up or shipped
3. **Don't create manual service log entries for POS purchases** — the system auto-creates them. Double entries = inaccurate records
4. **Don't mix up peptide products** — "BPC-157 / TB4 Vial" and "GLOW Vial" are different medications
5. **Don't skip the POS for free/comped medication** — run it as a $0 charge so it's still tracked

---

## Quick Reference: What Gets Logged Where

| What | Purchases Table | Protocol | Service Log |
|------|:-:|:-:|:-:|
| Payment amount | Yes | — | — |
| Medication name | Yes | Yes | Yes |
| Dose | — | Yes | Yes |
| Fulfillment method | — | — | Yes |
| Tracking number | — | — | Yes |
| Session count | — | Yes | — |
| Next refill date | — | Yes | — |

---

## If Something Looks Wrong

- **Wrong medication on a protocol?** → Tell Chris or edit in the protocol detail page
- **Missing service log entry?** → Check if the POS charge went through. If it did, the service log should exist
- **Need to add a tracking number after the fact?** → Find the service log entry on the patient's protocol page and update it
- **Patient was charged but no protocol appeared?** → The service category may have been wrong. Tell Chris

---

*Last updated: March 2026*
