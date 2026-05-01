# Batch tip generator

Use this prompt when you want a stack of new daily tips on a topic or a theme. Drop into the Claude project that has `CLAUDE.md` loaded, then fill in the bracketed bits.

---

## Prompt

I need [N] new daily tips on the topic of **[TOPIC]**.

**Sub-angles I want covered (if any):**
- [angle 1]
- [angle 2]
- [angle 3]

**What's already been covered for this topic** (do NOT repeat — pull from `topics-covered.md`):
[paste relevant lines from topics-covered.md]

**Constraints:**
- Format every tip exactly per `CLAUDE.md` (subject + opener + middle + action + sign-off + P.S.)
- ~120 words each. 180 hard ceiling.
- Each tip must be MECHANICALLY DIFFERENT from the others — different specific action, different time-of-day target, different product, different test. If two tips would result in him doing roughly the same thing, kill one.
- For each tip, give me a one-line summary at the top in the format: `[number]. [topic-tag] — [one-line description]`. So I can scan and approve fast.
- Output each tip in a fenced markdown block so I can paste straight into the admin form.

**Topics to AVOID (don't even adjacent to these):**
- Anything that requires 101 explanation
- Generic "drink water / sleep 8 hours / lift weights" advice
- Anything that's already a tip in `topics-covered.md`

**Voice gut-check before sending each one:**
- Would a Newport Beach business owner who reads Attia roll his eyes at this?
- Could this run on any wellness blog? If yes, kill it.
- Did I lecture instead of permission? Fix.

Go.

---

## Tips for using this prompt

- Start with `N=10`, not 30. Reading 30 mediocre tips is worse than 10 good ones.
- After Claude returns the batch, ask: "Of these 10, which 3 are the strongest? Why?" Then use those to set tone for the next batch.
- Always tighten in a second pass with `tighten.md`. First-pass output is rarely tight enough.
- If the batch feels generic, name a specific *moment* in the avatar's life as the trigger. e.g., "Generate 10 tips that hit when he's at the third cocktail at Bandera" or "10 tips for the morning after a Saturday with the kids."
