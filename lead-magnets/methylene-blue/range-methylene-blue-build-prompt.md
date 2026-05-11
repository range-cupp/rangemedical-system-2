# CLAUDE CODE PROMPT: Range Medical — Methylene Blue Lead Magnet System

## YOUR JOB

Build a complete lead magnet system for Range Medical, a cash-pay regenerative medicine clinic in Newport Beach, CA. The system has three deliverables:

1. A designed, print-ready PDF guide on methylene blue for mood and cognition
2. A 5-email follow-up sequence that fires when someone downloads the PDF
3. A ManyChat DM flow spec — the bridge between the Instagram comment and the email opt-in

The audience is a specific avatar (described below) and the voice is precise. Read this entire brief before writing a single line of code or copy.

Final deliverables, saved to project root:
- `range-medical-methylene-blue-guide.pdf`
- `email-sequence.md`
- `manychat-flow.md`
- All supporting source files (`lead-magnet.html`, `styles.css`, `generate-pdf.js`, `package.json`)

---

## TECHNICAL STACK

- Node.js project, ESM modules
- Puppeteer for HTML to PDF conversion
- Single HTML file with embedded CSS (Google Fonts via CDN allowed, system font fallback required)
- `qrcode` npm package for CTA QR code
- US Letter page size, 0.5" margins
- Print-optimized: page breaks, no widow/orphan lines, proper hierarchy

## SETUP STEPS

1. `npm init -y`
2. `npm install puppeteer qrcode`
3. Create:
   - `lead-magnet.html` — PDF content
   - `styles.css` — design system (or embedded in HTML)
   - `generate-pdf.js` — Puppeteer script
   - `email-sequence.md` — 5-email sequence
   - `manychat-flow.md` — DM flow spec
4. Build with: `node generate-pdf.js`

---

## AUDIENCE & VOICE — APPLIES TO ALL THREE DELIVERABLES

### Reader profile

45-55 year old male, $250K-$1M+ income, Newport Beach business owner. Already educated on health — has read Peter Attia, listens to Huberman, has googled BPC-157 and peptides. Skeptical of mainstream medicine. Does NOT need basics explained. Trusts specifics, numbers, and dry humor. Hates wellness-influencer voice, hype, and 101-level explanation.

### Voice rules (non-negotiable across PDF, emails, and DMs)

- Sarcastic, dry, honest. Not corporate. Not hyped.
- Short sentences. Mild swearing OK if it lands ("shit," "bullshit," "hell"). Not gratuitous.
- Action over mechanism. Tell the reader what matters, not the textbook.
- Specifics: real doses, real drug names, real study citations.
- Newport Beach references welcome where they fit naturally — never forced.
- Author voice is Chris Cupp, "head janitor" at Range Medical. Self-deprecating credibility.
- DM voice is a half-step warmer than the reel — DMs are 1:1, not camera-facing.

### Anti-patterns (never include)

- Emoji (one exception: pointing-finger directional cue in DM 1 only)
- Exclamation points (except in direct quotes)
- Countdown timers, "limited spots," urgency theater
- "Transform your life" language
- 101-level explanation
- Stock-photo aesthetic, wellness-brand pastels, motivational-poster phrases
- The words "protocol," "protocol breakdown," "blueprint," or "step-by-step plan" anywhere in PDF, emails, or DMs — the PDF is referred to as "the clinical guide" or "the guide," never as prescriptive content

---

# PART 1 — THE PDF LEAD MAGNET

## STRUCTURE — 10 PAGES + DISCLAIMER

### Page 1 — Cover

- Chris Cupp wordmark (text-based, no image — let typography do the work)
- Title: "Methylene Blue: What Your Doctor Won't Tell You and Your Wellness Bro Got Wrong"
- Subtitle: "A clinical guide to the most misunderstood molecule of 2026."
- Footer: "Chris Cupp - Range Medical - Newport Beach, CA"

### Page 2 — The 60-Second Summary (TL;DR)

Open: "If you're going to stop reading after this page, here's what matters."

Five clean bullets:
1. Methylene blue is a real medicine with real research behind it — for mood, cognition, and mitochondrial function.
2. At low doses (5-25mg), it has shown clinical benefit for mood symptoms, energy, and memory.
3. It is a potent MAO inhibitor. Combined with SSRIs, SNRIs, or other serotonergic drugs, it can cause serotonin syndrome — a medical emergency.
4. If you have G6PD deficiency, methylene blue can trigger hemolytic anemia. Separate, equally serious risk.
5. The dose matters. The source matters. The labs you pull first matter. This is not a TikTok supplement. Treat it accordingly.

Close: "The rest of this guide is for the people who want to understand why."

### Page 3 — Why Your Mitochondria Are Why You Feel Like Shit

One page. Cover:
- Mitochondria as the cellular ATP factory
- Age-related mitochondrial dysfunction shows up as fatigue, brain fog, mood symptoms, slow recovery
- "Normal labs" doesn't capture cellular energy production
- Methylene blue directly enhances mitochondrial function

Cite Gonzalez-Lima research: ~30% increase in cytochrome c oxidase activity at low doses. ATP production increases ~30%. Oxygen consumption increases up to 70% in cell models.

Citation: Rojas JC, Bruchey AK, Gonzalez-Lima F. "Neurometabolic mechanisms for memory enhancement and neuroprotection of methylene blue." *Progress in Neurobiology.* 2012;96(1):32-45.

### Page 4 — The Mood Mechanism

One page. Three mechanisms in plain language:
1. **MAO-A inhibition** — slows breakdown of serotonin, dopamine, norepinephrine. Same neurotransmitters SSRIs target, different mechanism.
2. **Mitochondrial bioenergetic support** — energy-deprived brain regions get a metabolic upgrade. Mood follows.
3. **Nitric oxide modulation** — cerebral blood flow effects.

Callout: "This is why people feel it on day one. It's not a supplement that takes 8 weeks to kick in. It's pharmacology."

### Page 5 — What the Research Actually Says

Clean, scannable. 5 studies. Each with one-line takeaway + clinical citation:

1. **Alda et al., 2017** — Methylene blue (195mg vs. 15mg subtherapeutic) as adjunct to lamotrigine in bipolar disorder. 6-month crossover. Improved depression and anxiety on MADRS. Well tolerated.
   *Alda M, McKinnon M, Blagdon R, et al. "Methylene blue treatment for residual symptoms of bipolar disorder: randomised crossover study." British Journal of Psychiatry. 2017;210(1):54-60.*

2. **Naylor et al., 1986** — Original double-blind crossover in severe depression. 300mg vs. 15mg. Higher dose reduced depressive symptoms.
   *Naylor GJ, Martin B, Hopwood SE, Watson Y. "A two-year double-blind crossover trial of the prophylactic effect of methylene blue in manic-depressive psychosis." Biological Psychiatry. 1986;21(10):915-920.*

3. **Rojas, Bruchey, Gonzalez-Lima, 2012** — Mechanism review. Methylene blue as electron cycler in mitochondrial electron transport chain. Memory enhancement and neuroprotection at low doses.
   *Rojas JC, Bruchey AK, Gonzalez-Lima F. "Neurometabolic mechanisms for memory enhancement and neuroprotection of methylene blue." Progress in Neurobiology. 2012;96(1):32-45.*

4. **Lin et al., 2012** — Cerebral metabolic and hemodynamic enhancer. fMRI evidence of increased brain glucose uptake, cerebral blood flow, cerebral metabolic rate of oxygen.
   *Lin AL, Poteet E, Du F, et al. "Methylene blue as a cerebral metabolic and hemodynamic enhancer." PLoS One. 2012;7(10):e46585.*

5. **Gillman, 2011** — Methylene blue as a potent reversible MAO-A inhibitor. Theoretical and mechanistic basis for serotonin toxicity risk.
   *Gillman PK. "CNS toxicity involving methylene blue: the exemplar for understanding and predicting drug interactions that precipitate serotonin toxicity." Journal of Psychopharmacology. 2011;25(3):429-436.*

Sidebar: "Note: the 195mg doses in clinical trials were tested in patients with diagnosed bipolar disorder. Low-dose mood/cognition use (5-25mg) is supported by mechanism and clinical experience, but has less large-trial data. Buyer beware of anyone claiming certainty either way."

### Page 6 — The Danger Zone (Drug Interactions)

Longest section. The page that earns trust.

Open: "Here's what every methylene blue influencer is conveniently leaving out."

**The FDA Warning (2011):** FDA Drug Safety Communication after cases of serotonin syndrome — some fatal — in patients receiving IV methylene blue (1-8 mg/kg) during parathyroid surgery while on serotonergic medications.

Citation: *FDA Drug Safety Communication: Updated information about the drug interaction between methylene blue and serotonergic psychiatric medications. October 20, 2011.*

**The Mechanism:** Methylene blue is a potent reversible MAO-A inhibitor. MAO-A breaks down serotonin. Block MAO-A while simultaneously increasing serotonin (SSRIs, SNRIs) and serotonin levels can spike dangerously high.

**The Hard List — drugs that don't mix:**

| Drug Class | Examples |
|---|---|
| SSRIs | Lexapro, Zoloft, Prozac, Paxil, Celexa, Luvox |
| SNRIs | Effexor, Cymbalta, Pristiq, Savella |
| Tricyclics | Amitriptyline, Nortriptyline, Clomipramine |
| MAO inhibitors | Phenelzine, Tranylcypromine, Selegiline |
| Atypicals | Trazodone, Mirtazapine, Bupropion (caution) |
| Pain meds | Tramadol, Fentanyl, Meperidine |
| Migraine | Triptans (Imitrex, Maxalt, Relpax) |
| Antibiotics | Linezolid |
| Recreational/OTC | MDMA, high-dose 5-HTP, high-dose tryptophan, St. John's Wort |

**Serotonin Syndrome — what it looks like:** agitation, confusion, rapid heart rate, dilated pupils, muscle twitching or rigidity, heavy sweating, shivering, diarrhea, high body temperature. Severe cases: seizures, irregular heartbeat, loss of consciousness, death.

**Hard-stop callout box:** "If you are on any drug in the table above and you're considering methylene blue — stop. Do not order it online. Do not buy it at a wellness store. Talk to a provider who knows your medication list. This is non-negotiable."

**The G6PD Issue:** Separate, equally important. G6PD deficiency is a genetic enzyme deficiency affecting an estimated 330 million people worldwide, more common in men, and in those of Mediterranean, African, or Southeast Asian descent. In G6PD-deficient individuals, methylene blue can trigger hemolytic anemia. Most people don't know they have it. Simple blood test. Range Medical pulls it before recommending methylene blue.

Citation: *PharmGKB summary: methylene blue pathway. Pharmacogenetics and Genomics. 2014.*

### Page 7 — Dosing: Why "More" Is Not "Better"

U-shaped dose-response curve (hormesis). Low doses enhance mitochondrial function and cognition. High doses can reverse those effects and shift methylene blue from antioxidant to pro-oxidant.

Reference ranges, not prescriptive:
- Mood/cognition research: 5-25mg daily (low-dose protocol)
- Clinical bipolar trials: 195mg daily (Alda et al.)
- Acute methemoglobinemia treatment: 1-2 mg/kg IV (medical emergency only)

Add: "The 25mg you see most longevity guys taking is a starting point, not a target. The right dose for you depends on your weight, your goals, your labs, your other medications. This is what a real assessment is for."

### Page 8 — Pharmaceutical-Grade vs. Internet Methylene Blue

Cover:
- USP/pharmaceutical-grade vs. industrial/laboratory-grade methylene blue
- Contamination risks: heavy metals (arsenic, lead, mercury, cadmium) in non-pharma sources
- A dye sold for staining microscope slides is not the same molecule sold for human consumption
- Compounding pharmacies, NOT online wellness retailers

Add: "If the bottle doesn't have a USP or pharmaceutical-grade certification, you are dosing yourself with a textile dye. This is not a metaphor. This is literally what methylene blue was invented for."

### Page 9 — What We Actually Do at Range Medical

Soft sell. No hype. Clear process.

The Range Assessment includes:
- Comprehensive lab panel (Total T, Free T, SHBG, estradiol, thyroid, A1c, fasting insulin)
- G6PD screening before any methylene blue is recommended
- Full medication review — every prescription, every supplement, every peptide
- One-on-one provider conversation — your labs read with you, not emailed at you
- Personalized recommendation — if methylene blue is right for you, dose, source, and stack are dialed in to your physiology

Add: "If methylene blue isn't right for you, we'll tell you. We've turned plenty of people away from it. That's the whole point of having a provider."

### Page 10 — Book the Range Assessment

Single, uncluttered CTA:
- Headline: "Stop guessing. Start measuring."
- Subhead: "If you're in Orange County, 40+, and serious about doing this right — book the Range Assessment."
- Range Medical contact info
- QR code (use `qrcode` npm package, point to `[BOOKING_URL_PLACEHOLDER]` — Chris replaces before publishing)

### Final page — Disclaimer

Standard medical disclaimer, small type. Educational content, not medical advice, individual results vary, consult a qualified provider, Range Medical does not prescribe based on this PDF.

## DESIGN SYSTEM

### Aesthetic

Editorial. Clinical. Confident. *The Economist* meets a high-end private clinic. NOT wellness brand. NOT supplement company. NOT motivational.

### Color Palette

- Primary: Deep navy `#0B1B2B`
- Secondary: Warm off-white `#F7F4EE` (page background)
- Accent: Methylene-blue `#1B4D8C` (sparingly — pull quotes, dividers, danger callouts)
- Body text: Near-black `#1A1A1A`
- Muted: Warm grey `#6B6660` (captions, citations)
- Danger callout: Pale warm red `#F5E8E4` background, deep red `#7A2E2E` text — ONLY for serious risk warnings

### Typography

- Headlines: **Fraunces** or **Source Serif 4**, weight 700 for H1, 600 for H2
- Body: **Inter** weight 400, 1.6 line-height — OR **Source Serif 4** for unified feel
- Citations: Inter 10pt italic
- Pull quotes: Fraunces 18-22pt weight 500 italic

### Layout

- Single-column body
- Margins: 0.75" left/right minimum
- Page numbers: bottom outside corner, small caps
- Section headers: navy serif, thin underline rule
- Pull quotes: indented, 2px solid methylene-blue left border
- Tables: alternating row backgrounds, no heavy gridlines
- Danger callouts: 16px rounded corners, pale red padded box

### Print Requirements

- US Letter (8.5" x 11")
- 0.5" outer margins, 0.75" body text margins
- Page breaks at section transitions
- No widows/orphans
- Embed fonts
- 300 DPI equivalent

## PUPPETEER SCRIPT REQUIREMENTS

`generate-pdf.js` should:
1. Launch Puppeteer headless
2. Load `lead-magnet.html` from local filesystem
3. Wait for fonts and styles to render
4. Generate PDF with:
   - `format: 'Letter'`
   - `printBackground: true`
   - `margin: { top: '0.5in', bottom: '0.5in', left: '0.5in', right: '0.5in' }`
   - `preferCSSPageSize: true`
5. Save as `range-medical-methylene-blue-guide.pdf`
6. Close browser
7. Log success with file path and file size

Proper async/await. Try/catch with informative error logging.

---

# PART 2 — THE 5-EMAIL FOLLOW-UP SEQUENCE

Output as a single `email-sequence.md` file in project root.

## OUTPUT FORMAT — for each email

```
EMAIL X of 5
SEND: [Day X]
SUBJECT LINE OPTIONS (A/B test):
A: [option]
B: [option]
PREVIEW TEXT: [50-90 characters]

[Full email body in plain text, ready to paste into ESP]
[Signature block]
```

## FORMAT RULES

- Each email: 150-300 words max. Skimmable.
- Single column, plain text, no HTML decoration beyond sign-off
- ONE clear CTA per email — no competing asks
- Consistent signature block across all 5
- P.S. lines allowed and encouraged in Emails 2, 4, 5

## SIGNATURE BLOCK (use at end of every email)

```
-- Chris
Head Janitor, Range Medical
Newport Beach, CA

Range Medical | [BOOKING_URL_PLACEHOLDER]
Reply to this email if you want to talk. It comes straight to me.
```

## PLACEHOLDERS (use exactly these — Chris will fill in)

- `[PDF_DOWNLOAD_LINK]`
- `[BOOKING_URL_PLACEHOLDER]`
- `[ASSESSMENT_PRICE]`

---

# PART 3 — THE MANYCHAT DM FLOW SPEC

Output as a single `manychat-flow.md` file in project root.

## TRIGGER CONFIGURATION

- **Platform:** ManyChat (Instagram comment trigger)
- **Keyword:** `BLUE` (case-insensitive, exact match — not "contains")
- **Scope:** Triggers on comments on the methylene blue reel only — do NOT enable account-wide or BLUE will fire on random comments
- **Public comment reply:** *"Sent. Check your DMs."*

## DM SEQUENCE

### DM 1 — Immediate

```
Hey — Chris here.

You commented BLUE on my methylene blue reel, so here's the clinical guide I promised. It covers the mechanism, what the research actually says, who shouldn't take it, and what to do if you want to take it the right way.

(pointing finger) [PDF_DOWNLOAD_LINK]

Quick heads up: I'm going to send you a couple short follow-ups over the next 10 days. The most useful one is the personal story about what happened the first morning I took it. After that, you'll get one under-a-minute tip per day if you want to stay on the list. Easy to unsubscribe anytime.

Talk soon. — Chris
```

### DM 2 — 30 seconds after DM 1

```
One ask: drop your best email below so I can send you the follow-ups. The PDF is yours either way — but the follow-ups are where the actually useful stuff lives.

[EMAIL_CAPTURE_BUTTON]
```

### Logic

- **On email submission:** push to ESP, tag as `methylene-blue-leadmag`, trigger Email 1 of the sequence immediately
- **No email within 24 hours:** send one nudge DM:

```
Hey — still want those follow-ups? Drop your email and I'll get them rolling.

[EMAIL_CAPTURE_BUTTON]
```

- **No email within 72 hours:** stop. Do not pester further.

## NOTES

- The single pointing-finger emoji in DM 1 is the only emoji in the entire system. It functions as a directional cue in a DM context, not decoration. If it feels off, swap for a plain bullet.
- DM voice is a half-step warmer than the reel — DMs are 1:1, not camera-facing.
- Sign-off is "Talk soon." Never "Cheers," "Stay strong," or any other tone-breaker.

---

## QUALITY CHECKLIST — VERIFY BEFORE DECLARING DONE

### PDF checklist

- [ ] Every citation matches the format above exactly
- [ ] No fabricated studies, no made-up author names, no hallucinated PMID numbers
- [ ] Drug interaction table is complete and visually scannable
- [ ] G6PD section is present and equally weighted with serotonin syndrome
- [ ] Voice is Chris Cupp — dry, direct, no wellness influencer phrases
- [ ] No 101-level explanation — assumes an educated reader
- [ ] No use of the words "protocol," "protocol breakdown," "blueprint," or "step-by-step plan" — the PDF is referred to as "the clinical guide" or "the guide"
- [ ] PDF generates without errors
- [ ] Exactly 10 pages + disclaimer page
- [ ] All page breaks land where they should
- [ ] No widows, no orphans
- [ ] No emoji, no icon fonts, no stock photo references
- [ ] CTA on final page is the ONLY call to action

### Email sequence checklist

- [ ] Five emails total, no more, no less
- [ ] Each email 150-300 words
- [ ] Voice is Chris Cupp — dry, direct, sarcastic
- [ ] No exclamation points
- [ ] No emoji
- [ ] No countdown timers, no "limited spots," no urgency theater
- [ ] One clear CTA per email
- [ ] Progression intact: Email 1 sets expectations, Email 2 builds credibility, Email 3 surfaces stakes, Email 4 makes the offer, Email 5 hands off cleanly
- [ ] Email 1 opens with the BLUE keyword callback in the body's first line
- [ ] Newport Beach reference appears at least once (Email 2 P.S. is natural)
- [ ] Subject lines direct, not clickbait
- [ ] All placeholders in ALL_CAPS_BRACKETS as specified
- [ ] Signature block consistent across all 5
- [ ] No use of the words "protocol," "protocol breakdown," "blueprint," or "step-by-step plan"

### ManyChat flow checklist

- [ ] Trigger is exact-match BLUE, case-insensitive, scoped to the methylene blue reel only
- [ ] Public comment reply is *"Sent. Check your DMs."*
- [ ] DM 1 delivers the PDF link, sets expectations for the email sequence, signs off "Talk soon"
- [ ] DM 2 fires 30 seconds after DM 1 with email capture CTA
- [ ] Nudge logic: 24-hour single nudge, 72-hour stop
- [ ] ESP handoff tag is `methylene-blue-leadmag`
- [ ] On email submission, Email 1 fires immediately
- [ ] Pointing-finger emoji in DM 1 is the only emoji in the system

## FINAL OUTPUT CONFIRMATION

When complete, show the file structure and confirm all three deliverables generated successfully:
- `range-medical-methylene-blue-guide.pdf` (with file size)
- `email-sequence.md` (with word count for each email)
- `manychat-flow.md` (with full spec rendered)
