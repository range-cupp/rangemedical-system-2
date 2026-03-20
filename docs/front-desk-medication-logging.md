# Front Desk — Medication & Session Logging Guide

**Range Medical — Standard Operating Procedure**

---

## How This Works

There are only two things front desk needs to do:

| What's Happening | Where to Do It |
|---|---|
| Patient is **paying for medication** (weight loss, peptides) | **POS** (Charge button on patient profile) |
| Patient is **picking up HRT program medications** (testosterone, HCG, etc.) | **Medications page** (Admin → Medications → Dispense) |

Everything else is automatic:
- **In-clinic sessions** (IV, HBOT, Red Light) → auto-logged when the appointment is marked completed
- **In-clinic injections** (B12, weight loss, peptide, testosterone) → auto-logged when the appointment is marked completed
- **Protocols and session counts** → auto-updated when any of the above happens

---

## 1. Weight Loss (Tirzepatide, Retatrutide, Semaglutide)

**Where:** POS

1. Open patient profile → **Charge**
2. Select the exact product (e.g., "Retatrutide — Monthly — 4 mg/week x2")
3. Select **fulfillment**:
   - **Picked Up In Clinic** — patient is here taking it home
   - **Overnighted** — being shipped (enter tracking number)
4. Process payment

Everything else is automatic — protocol, service log, medication name, dose, quantity.

---

## 2. Peptides (BPC-157, Thymosin Beta-4, GLOW, Tesamorelin/Ipamorelin, etc.)

**Where:** POS

1. Open patient profile → **Charge**
2. Select the correct product:
   - Vials: "BPC-157 / Thymosin Beta-4 Vial"
   - Protocols: "Peptide Therapy — Recovery 10 Day"
3. Select **fulfillment**:
   - **Picked Up In Clinic** — patient picks up vial today
   - **Overnighted** — vial being shipped (enter tracking number)
4. Process payment

Make sure you pick the right product — "BPC-157 / TB4 Vial" and "GLOW Vial" are different medications.

---

## 3. HRT Program Medications (Testosterone, HCG, Gonadorelin, Nandrolone, etc.)

**Where:** Medications page

HRT monthly payments are automatic through subscriptions. You do not process HRT payments. Your only job is logging when any HRT program medication actually leaves the clinic — whether that's testosterone, HCG, or any other medication in their program.

**When a patient picks up their vial or prefilled syringes (or you ship it):**

1. Go to **Admin → Medications**
2. Find the patient (you can search by name)
3. Click **Dispense**
4. Select the **supply type** (vial 5ml, vial 10ml, prefilled 1-week, prefilled 2-week, etc.)
5. Select **fulfillment**:
   - **Picked Up In Clinic** — patient is here
   - **Overnighted** — being shipped (enter tracking number)
6. Click **Dispense & Log Pickup**

This records what was dispensed, how it left the clinic, and sets the next refill date.

---

## 4. In-Clinic Sessions & Injections (IV, HBOT, Red Light, B12, etc.)

**No action needed from front desk.**

When an appointment is marked as **completed** on the schedule, the system automatically:
- Creates a service log entry for that session
- Decrements the remaining sessions on the patient's protocol (e.g., HBOT 10-Pack goes from 8 remaining to 7)
- Records the provider who administered it

Just make sure the appointment gets marked completed — that's it.

---

## Don'ts

- **Don't use Custom Charge for medication** — the medication name won't get tracked
- **Don't forget to Dispense HRT program medications** — payments are automatic, but dispensing is not
- **Don't manually create service log entries** — the system handles this automatically for all types
- **Don't skip the POS for comped medication** — run it as a $0 charge so it's tracked
- **Don't mix up peptide products** — each one is a different medication, select the right one

---

## Quick Reference

| Medication/Service | Front Desk Action | Auto-Logged? |
|---|---|---|
| Weight loss (take-home) | POS charge + fulfillment | Yes — from POS |
| Peptide vial (take-home) | POS charge + fulfillment | Yes — from POS |
| HRT program meds (take-home) | Medications → Dispense | Yes — from Dispense |
| IV therapy session | None — mark appointment completed | Yes — from appointment |
| HBOT session | None — mark appointment completed | Yes — from appointment |
| Red Light session | None — mark appointment completed | Yes — from appointment |
| In-clinic injection (B12, etc.) | None — mark appointment completed | Yes — from appointment |

---

## If Something Looks Wrong

- **Wrong medication on a protocol** → Tell Chris
- **Patient missing from the Medications page** → They may not have an active protocol. Tell Chris.
- **Session didn't get logged after appointment** → Make sure the appointment was marked "completed" (not just "checked in")
- **Need to add a tracking number after the fact** → Find the entry on the patient's protocol page
- **Patient charged but no protocol appeared** → Wrong service category was selected. Tell Chris.

---

*Last updated: March 2026*
