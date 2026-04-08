# Landing Page Quality Report

**URL:** https://www.range-medical.com/energy-check
**Date:** March 24, 2026
**Page Type:** Quiz-based lead magnet funnel (3-step: contact → quiz → results)

---

## Landing Page Health

```
Message Match:    ████████░░  80/100
Page Speed:       ████████░░  78/100
Mobile:           ███████░░░  72/100
Trust Signals:    ████░░░░░░  40/100
Form Quality:     ████████░░  82/100
Conversion Flow:  █████████░  88/100

OVERALL SCORE:    ███████░░░  73/100
```

---

## 1. Message Match Assessment — 80/100

### What Works
- **Headline is clear and specific:** "Energy & Recovery Check" — immediately tells the visitor what they're getting
- **Subheadline addresses pain points directly:** "tired, foggy, or slow to recover" — mirrors likely ad copy language
- **FREE + 3 MINUTES label** above the fold reduces friction and matches typical ad promises
- **"No cost. No obligation."** reinforces the free offer below the CTA

### Issues Found

| Issue | Impact | Fix |
|-------|--------|-----|
| No dynamic keyword insertion support | Medium | Add UTM-driven headline variants (e.g., if `utm_term=brain_fog`, swap subhead to focus on brain fog) |
| Generic for multiple audiences | Medium | "Energy" and "Recovery" are two distinct audiences. Consider separate landing pages per ad group |
| No offer reinforcement in H1 | Low | H1 says "Energy & Recovery Check" but doesn't include "Free" — the label above does, but H1 carries more weight |

### Recommendation
If running Google Search ads, create keyword-specific variants:
- `/energy-check?focus=fatigue` → "Why Am I So Tired?" headline
- `/energy-check?focus=recovery` → "Why Am I Recovering So Slowly?" headline
- `/energy-check?focus=brain-fog` → "Why Can't I Focus?" headline

This would push message match to 95/100.

---

## 2. Page Speed Assessment — 78/100

### Observed Metrics
| Metric | Observed | Target | Status |
|--------|----------|--------|--------|
| Framework | Next.js (SSR/SSG) | — | PASS |
| Analytics | Microsoft Clarity only | — | PASS (lightweight) |
| Font loading | Inter (6 weights) | 2-3 weights | WARNING |
| CSS delivery | Inline in `<Head>` | — | PASS (no render-blocking CSS) |
| JavaScript | React hydration | — | OK |
| Images | None on landing step | — | PASS |
| Third-party scripts | Clarity only | — | PASS |

### Issues Found

| Issue | Impact | Fix |
|-------|--------|-----|
| Loading 6 font weights (400-900) | Medium | Page only uses 500, 600, 700, 900 — drop 400 and 800 to save ~40KB |
| No font-display: swap | Medium | Add `font-display: swap` to prevent FOIT (Flash of Invisible Text) |
| Full React hydration for a simple form | Low | Consider static generation with client-side hydration only for form |

### What Works
- No hero images to slow down load
- Inline CSS means no render-blocking stylesheets
- Only one analytics script (Clarity) — very lean
- No chat widgets, heatmaps, or heavy third-party scripts

---

## 3. Mobile Experience — 72/100

### What Works
- Responsive breakpoint at 640px with appropriate sizing adjustments
- H1 scales down from 40px to 32px on mobile
- Form card padding reduces on mobile (28px→20px)
- Quiz questions scale properly
- Full-width CTA button

### Issues Found

| Issue | Impact | Fix |
|-------|--------|-----|
| **Phone number in footer is NOT a clickable tel: link** | HIGH | Wrap in `<a href="tel:9499973988">` — mobile users tap to call |
| **No sticky CTA on mobile** | HIGH | On mobile, the CTA scrolls out of view. Add a sticky bottom bar on the landing step |
| **Checkbox tap target too small** | Medium | 18x18px checkbox is below the 48x48px minimum. Use a larger custom checkbox or tap area |
| **Form inputs lack inputMode** | Medium | Add `inputMode="tel"` on phone field, `inputMode="email"` on email to trigger correct mobile keyboard |
| **No autofocus on first field** | Low | On mobile, auto-opening the keyboard on first name saves a tap |
| Quiz options are 16px padding | Low | Increase to 20px for easier finger tapping on mobile |
| Slider thumb is 28px | Medium | Below 48px minimum for comfortable touch. Increase to 44-48px |
| Results grid goes single-column on mobile | — | PASS — good responsive behavior |

### Critical Mobile Fix
```jsx
// Phone number should be clickable
<a href="tel:9499973988">(949) 997-3988</a>
```

---

## 4. Trust Signals — 40/100 (BIGGEST WEAKNESS)

### What's Present
- Clinic name and address in footer
- Phone number in footer
- "No cost. No obligation." reassurance text
- Location mention on results page ("Range Medical · Newport Beach, CA")

### What's Missing

| Missing Element | Impact | Priority |
|-----------------|--------|----------|
| **No social proof above the fold** | CRITICAL | Add "500+ patients assessed" or similar |
| **No testimonials anywhere** | CRITICAL | Add 1-2 short patient quotes on landing step |
| **No star rating or review count** | HIGH | "4.9 stars on Google (XX reviews)" with link |
| **No provider credentials** | HIGH | "Led by Dr. Burgess, MD" with brief credential |
| **No trust badges** | Medium | HIPAA compliant badge, medical licensing, etc. |
| **No before/after or case study** | Medium | Even one "Patient went from 3/10 energy to 8/10" adds credibility |
| **No media mentions or logos** | Low | If Range Medical has been featured anywhere, add logos |
| **No "As seen in" or certification logos** | Low | Medical certifications, partnership logos |

### Recommended Trust Stack (Above the Fold)
Add below the subheadline, before the form:
```
"Trusted by 500+ patients in Newport Beach"
★★★★★ 4.9 on Google · Led by Dr. Burgess, MD
```

### Recommended Trust Stack (Below Form)
Add 1-2 testimonial snippets:
```
"I had no idea my testosterone was that low. The quiz flagged it,
 and the labs confirmed it." — Mike R., Newport Beach
```

---

## 5. Form Quality — 82/100

### What Works
- **Only 3 fields** (name, email, phone) — optimal for top-of-funnel
- **Clear labels** with proper `htmlFor` associations
- **Placeholder text** guides input format
- **SMS consent checkbox** is properly disclosed (TCPA compliant)
- **CTA button text is specific:** "Start the 3-Minute Check" (not generic "Submit")
- **Error state** displays inline
- **autoComplete attributes** set correctly (given-name, email, tel)

### Issues Found

| Issue | Impact | Fix |
|-------|--------|-----|
| **No inline validation** | Medium | Validate email format and phone format on blur, not just on submit |
| **SMS consent is optional** — could confuse users | Low | Clarify "optional" or make it required if you need SMS for follow-up |
| **No field-level error messages** | Medium | "Please fill in all fields" is generic. Show which field is missing |
| **Submit button font-size is 11px** | Low | Very small text — increase to 13-14px for better readability |
| **No loading state on submit** | Low | Button should show spinner/disabled state while processing |

### Form Friction Score
| Factor | Assessment |
|--------|-----------|
| Number of fields | 3 — Optimal |
| Required vs optional clarity | Needs work (all required but not marked) |
| Input types correct | Yes (text, email, tel) |
| Autocomplete enabled | Yes |
| Error handling | Basic — needs inline validation |
| CTA specificity | Strong — "Start the 3-Minute Check" |

---

## 6. Conversion Flow — 88/100

### What Works Exceptionally Well
- **Quiz-based funnel is psychologically effective** — users invest time answering questions, creating commitment bias that increases conversion on the results page
- **Progressive disclosure** — contact info first, then quiz, then results with CTA
- **Auto-advance on single-select** (400ms delay) — reduces clicks, feels fast
- **Progress bar** keeps users oriented
- **Personalized results** based on actual answers — not a generic output
- **Dynamic CTA** — recovery users get "Book Recovery Visit," energy users get "See Lab Panels & Pricing"
- **Secondary CTA** — "I also have an injury" / "I'm also interested in labs" captures cross-intent
- **Score visualization** with color-coded severity creates urgency

### Issues Found

| Issue | Impact | Fix |
|-------|--------|-----|
| **No exit intent capture** | HIGH | If user tries to leave during quiz, show "Your progress will be lost" modal |
| **No "back" button on quiz** | Medium | Users can't revisit previous answers — may cause abandonment |
| **No email/SMS with results** | HIGH | After completing quiz, send results via email for re-engagement |
| **Source tracking is basic** | Medium | Only captures `src`/`source` param — add full UTM capture (utm_source, utm_medium, utm_campaign, utm_content, utm_term) |
| **No retargeting pixel events** | HIGH | No Meta Pixel, Google Ads conversion events firing at each step |

---

## 7. Ad Platform-Specific Issues

### Conversion Tracking Assessment

| Platform | Tracking Found | Status |
|----------|---------------|--------|
| Google Ads (gtag/gclid) | No | FAIL |
| Meta Pixel (fbclid) | No | FAIL |
| TikTok Pixel (ttclid) | No | FAIL |
| Microsoft Ads (msclkid) | No | FAIL |
| Microsoft Clarity | Yes | PASS |

**This is a critical gap.** Without conversion tracking pixels, you cannot:
- Optimize ad delivery toward converters
- Build lookalike audiences from quiz completers
- Measure cost per lead accurately
- Retarget quiz abandoners

### Recommended Tracking Events

| Event | Trigger | Platforms |
|-------|---------|-----------|
| `PageView` | Page load | All |
| `Lead` / `form_submit` | Contact form submitted (step 1 → quiz) | All |
| `QuizComplete` | Quiz finished, results shown | All (custom event) |
| `ViewContent` | Results page viewed | Meta |
| `ClickCTA` | "See Lab Panels" or "Book Recovery" clicked | All (custom event) |

### UTM Parameter Handling

Current code captures only `src` or `source`:
```js
const source = router.query.src || router.query.source || 'direct';
```

**Missing:** `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `gclid`, `fbclid`

These should be captured on page load and passed through to the API submission for proper attribution.

---

## 8. Quick Wins — Sorted by Conversion Impact

| # | Fix | Effort | Expected Impact |
|---|-----|--------|-----------------|
| 1 | **Add conversion tracking pixels** (Google, Meta minimum) | 2 hours | +20-30% optimization efficiency |
| 2 | **Add social proof above the fold** (review count, patient count) | 30 min | +10-15% CVR |
| 3 | **Make phone number clickable** (tel: link) | 5 min | +5% mobile engagement |
| 4 | **Add 1-2 testimonials** on landing step | 30 min | +8-12% CVR |
| 5 | **Capture full UTM parameters** | 1 hour | Better attribution, smarter spend |
| 6 | **Add exit-intent modal** on quiz abandonment | 2 hours | +5-8% completion rate |
| 7 | **Send results via email** after quiz completion | 2 hours | +15-20% re-engagement |
| 8 | **Increase mobile tap targets** (checkbox, slider thumb) | 30 min | Reduces mobile friction |
| 9 | **Add sticky CTA on mobile** landing step | 1 hour | +5% mobile CVR |
| 10 | **Add provider credentialing** ("Dr. Burgess, MD") | 15 min | Increases medical trust |

---

## 9. Competitive Assessment

### Strengths vs. Typical Medical Landing Pages
- Quiz funnel is **significantly better** than the industry-standard "Book a consultation" form — it provides value before asking for commitment
- Clean, minimal design avoids the "cluttered medical website" trap
- Personalized results create a reason to take the next step
- Dynamic CTAs based on user concern show sophistication

### Weaknesses vs. Best-in-Class
- No video (even a 30-second provider intro would boost trust significantly)
- No urgency elements (limited availability, waitlist, seasonal offer)
- No price anchoring on the landing step (mentioning that labs start at $350 later creates sticker shock — consider a "valued at $X, assessment is free" frame)
- No FAQ section to handle objections ("Is this legit?", "What happens after?", "Do I need insurance?")

---

## Summary

The Energy & Recovery Check is a **well-designed quiz funnel** with strong conversion flow mechanics. The biggest gaps are:

1. **Zero conversion tracking** — you're flying blind on ad performance
2. **Weak trust signals** — no social proof, testimonials, or credentials visible
3. **Mobile friction points** — non-clickable phone, small tap targets, no sticky CTA

Fix items #1-4 from the Quick Wins list and this page goes from 73/100 to ~88/100. The quiz mechanics and personalized results are already strong — the page just needs the trust layer and tracking infrastructure to perform at its potential.
