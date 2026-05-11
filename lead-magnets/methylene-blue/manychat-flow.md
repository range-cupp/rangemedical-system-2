# Methylene Blue Lead Magnet — ManyChat DM Flow Spec

---

## Trigger Configuration

| Setting | Value |
|---|---|
| **Platform** | ManyChat (Instagram comment trigger) |
| **Keyword** | `BLUE` |
| **Match type** | Exact match, case-insensitive — NOT "contains" |
| **Scope** | Methylene blue reel ONLY — do NOT enable account-wide |
| **Public comment reply** | *Sent. Check your DMs.* |

**Why scoped:** If BLUE is set account-wide, it will fire on any comment containing "blue" on any post. Scope it to the specific reel's post ID in ManyChat.

---

## DM Sequence

### DM 1 — Immediate (on keyword trigger)

```
Hey — Chris here.

You commented BLUE on my methylene blue reel, so here's the clinical guide I promised. It covers the mechanism, what the research actually says, who shouldn't take it, and what to do if you want to take it the right way.

👉 [PDF_DOWNLOAD_LINK]

Quick heads up: I'm going to send you a couple short follow-ups over the next 10 days. The most useful one is the personal story about what happened the first morning I took it. After that, you'll get one under-a-minute tip per day if you want to stay on the list. Easy to unsubscribe anytime.

Talk soon. — Chris
```

### DM 2 — 30 seconds after DM 1

```
One ask: drop your best email below so I can send you the follow-ups. The PDF is yours either way — but the follow-ups are where the actually useful stuff lives.

[EMAIL_CAPTURE_BUTTON]
```

---

## Logic: Post-Email-Capture

```
ON email submission:
  → Push email to ESP (Resend / ConvertKit / whatever Chris uses)
  → Tag subscriber: methylene-blue-leadmag
  → Trigger Email 1 of email-sequence.md IMMEDIATELY
  → ManyChat flow ENDS — all further communication happens via email
```

---

## Logic: No Email Submitted

```
IF no email submitted within 24 hours:
  → Send ONE nudge DM (below)

IF no email submitted within 72 hours:
  → Stop. Do not send further DMs. Do not pester.
```

### 24-Hour Nudge DM

```
Hey — still want those follow-ups? Drop your email and I'll get them rolling.

[EMAIL_CAPTURE_BUTTON]
```

---

## ManyChat Build Notes

### Email Capture Setup
- Use ManyChat's built-in "User Input" action (not a button)
- Set input type to "Email" — ManyChat validates format automatically
- Store in ManyChat custom field: `email`
- On valid submission, fire the ESP webhook / Zapier / Make integration

### ESP Integration Options
1. **Zapier:** ManyChat trigger → Zapier → ESP (tag + sequence start)
2. **Make (Integromat):** Same flow, often cheaper at volume
3. **Direct API:** If ESP supports webhooks, ManyChat can POST directly via "External Request" action
4. **ManyChat native:** If using Mailchimp, ManyChat has a built-in integration

### Tag Convention
- ESP tag: `methylene-blue-leadmag`
- This tag should trigger the 5-email automation in the ESP
- Email 1 fires immediately on tag application (Day 0)
- Emails 2-5 fire on delay: Day 2, Day 4, Day 7, Day 10

---

## Voice Notes

- DM voice is a half-step warmer than the reel — DMs are 1:1, not camera-facing
- Sign-off is "Talk soon." — never "Cheers," "Stay strong," or any other tone-breaker
- The pointing-finger emoji in DM 1 is the ONLY emoji in the entire lead magnet system (PDF, emails, DMs). It functions as a directional cue, not decoration. If it feels off, swap for a plain dash or bullet.

---

## Testing Checklist (before going live)

- [ ] Comment "BLUE" on the reel from a test account — confirm DM 1 arrives
- [ ] Confirm DM 2 fires ~30 seconds after DM 1
- [ ] Submit a test email — confirm it arrives in the ESP with `methylene-blue-leadmag` tag
- [ ] Confirm Email 1 fires immediately after email submission
- [ ] Wait 24 hours without submitting email — confirm nudge DM fires
- [ ] Confirm no further DMs after 72 hours of no response
- [ ] Comment "BLUE" on a DIFFERENT post — confirm it does NOT trigger the flow
- [ ] Comment "blue" (lowercase) — confirm it DOES trigger (case-insensitive)
- [ ] Comment "blueberry" — confirm it does NOT trigger (exact match)
- [ ] Confirm public reply "Sent. Check your DMs." appears on the reel comment
