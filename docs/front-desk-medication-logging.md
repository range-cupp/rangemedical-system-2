# Front Desk Medication Logging Guide

**Range Medical — Standard Operating Procedure**

---

## The Golden Rule

**Every time medication leaves this clinic — whether handed to a patient, injected in-clinic, or shipped overnight — it must be logged.** For most things, the POS charge handles this automatically. For HRT, dispensing is a separate step (see below).

---

## How It Works (The Short Version)

When you charge a patient through the POS:
1. **Purchase record** is created (what they paid for)
2. **Protocol** is automatically created or extended (their treatment plan)
3. **Service log entry** is automatically created (proof medication was dispensed)

**Exception: HRT.** Payment and dispensing are separate — see the HRT section below.

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
- Purchase recorded with the medication name
- Protocol created (or extended if returning patient)
- Service log pickup entry created with medication, dose, quantity, and fulfillment method
- All sessions marked as dispensed (take-home = all at once)

**Important:** Always select the correct service — don't use a generic "Weight Loss" charge.

---

### HRT / Testosterone — TWO SEPARATE STEPS

HRT is different from everything else. **Payment and dispensing are separate** because patients pay monthly but get medication on a different schedule (every 30 days, every 8 weeks, or a full vial).

#### Step 1: Monthly Payment (billing day)
1. Open POS
2. Select "Testosterone Cypionate"
3. Process payment
4. **That's it** — this only records the payment and extends the protocol. It does NOT log medication being dispensed.

#### Step 2: Dispense Medication (when vial actually leaves)
1. Go to **Admin → Medications** page
2. Find the patient's HRT protocol
3. Click **Dispense**
4. Confirm the date and supply type (vial, prefilled syringes, etc.)
5. **Select fulfillment method:**
   - **Picked Up In Clinic** — patient is here picking up their vial
   - **Overnighted** — vial being shipped (enter tracking number)
6. Click **Dispense & Log Pickup**

**This is what actually records the medication leaving the clinic** and sets the next refill date.

**Key point:** Step 1 and Step 2 may happen on different days. A patient might pay on the 1st but pick up their vial on the 5th. That's fine — each step is tracked independently.

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
- Purchase recorded with the specific peptide name
- Protocol created with correct medication, dose, and frequency
- Service log entry created for take-home pickups

**Important:** Select the right product. "BPC-157 / Thymosin Beta-4 Vial" is different from "GLOW Vial" — each is a different medication.

---

### IV Therapy

**What to do:**
1. Open POS
2. Select the specific IV (e.g., "Myers Cocktail", "NAD+ IV", "Immunity Drip")
3. Process payment

**What happens automatically:**
- Purchase recorded
- For packs/memberships: protocol created with session count
- Sessions logged individually via the Service Log when the patient comes in

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
- Individual sessions logged via the Service Log when the patient comes in

---

## Fulfillment Options

For **all take-home medication** (weight loss, HRT, peptides), you'll see a fulfillment section:

| Option | When to Use |
|--------|-------------|
| **Picked Up In Clinic** | Patient is physically here and taking medication home |
| **Overnighted** | Medication is being shipped to the patient |

If you select **Overnighted**, enter the tracking number if you have it.

This shows in two places:
- **POS checkout** — for weight loss and peptide purchases
- **Medications page → Dispense modal** — for HRT and any other dispense action

---

## Common Mistakes to Avoid

1. **Don't use "Custom Charge" for medication** — always select the specific product so the medication name gets logged
2. **Don't forget to Dispense HRT separately** — the POS charge only records payment, not medication leaving
3. **Don't create manual service log entries for POS purchases** — the system auto-creates them (except HRT). Double entries = inaccurate records
4. **Don't mix up peptide products** — "BPC-157 / TB4 Vial" and "GLOW Vial" are different medications
5. **Don't skip the POS for free/comped medication** — run it as a $0 charge so it's still tracked

---

## Quick Reference: What Gets Logged Where

| What | Purchases | Protocol | Service Log |
|------|:-:|:-:|:-:|
| Payment amount | Yes | — | — |
| Medication name | Yes | Yes | Yes |
| Dose | — | Yes | Yes |
| Fulfillment method | — | — | Yes |
| Tracking number | — | — | Yes |
| Session count | — | Yes | — |
| Next refill date | — | Yes | — |

---

## Quick Reference: Where to Do What

| Action | Where |
|--------|-------|
| Charge for weight loss medication | POS → select product → fulfillment → charge |
| Charge for peptide | POS → select product → fulfillment → charge |
| Charge HRT monthly payment | POS → Testosterone Cypionate → charge |
| **Dispense HRT vial** | **Admin → Medications → Dispense button** |
| Log an IV/HBOT/RLT session | Service Log |
| Check a patient's medication history | Patient profile → Protocols tab |

---

## If Something Looks Wrong

- **Wrong medication on a protocol?** → Tell Chris or edit in the protocol detail page
- **Missing service log entry?** → Check if the POS charge went through. For HRT, check if someone clicked Dispense.
- **Need to add a tracking number after the fact?** → Find the service log entry on the patient's protocol page and update it
- **Patient was charged but no protocol appeared?** → The service category may have been wrong. Tell Chris.

---

*Last updated: March 2026*
