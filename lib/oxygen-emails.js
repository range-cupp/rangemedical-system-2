// lib/oxygen-emails.js
// 30-day email series templates — Chris Cupp / Range Medical
// Clean, minimal design matching range-medical.com

function wrapEmail({ firstName, dayNumber, subject, bodyHtml }) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #ffffff; color: #1a1a1a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #ffffff;">
    <tr>
      <td align="center" style="padding: 48px 20px;">
        <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="max-width: 560px; width: 100%;">

          <!-- Day label -->
          <tr>
            <td style="padding-bottom: 32px;">
              <span style="font-size: 12px; font-weight: 600; letter-spacing: 0.12em; color: #b0b0b0; text-transform: uppercase;">Day ${dayNumber} of 30</span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="font-size: 16px; line-height: 1.7; color: #2a2a2a;">
              ${bodyHtml}
            </td>
          </tr>

          <!-- Sign-off -->
          <tr>
            <td style="padding-top: 36px; font-size: 15px; line-height: 1.6; color: #2a2a2a;">
              <p style="margin: 0;">Talk tomorrow,</p>
              <p style="margin: 4px 0 0; font-weight: 600;">Chris</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top: 48px; border-top: 1px solid #eee; margin-top: 48px;">
              <p style="font-size: 12px; color: #b0b0b0; line-height: 1.6; margin: 16px 0 0;">
                Chris Cupp &middot; Range Medical &middot; Newport Beach, CA<br>
                You signed up for 30 days of things worth knowing.<br>
                <a href="%unsubscribe_url%" style="color: #999;">Unsubscribe</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// Lookup map: day number → { generate, subject }
export const DAY_CONFIG = {
  1: { generate: generateDay1Html, subject: 'Day 1: The one thing your blood test isn\'t telling you' },
  2: { generate: generateDay2Html, subject: 'Day 2: The sleep mistake that\'s aging you faster' },
  3: { generate: generateDay3Html, subject: 'Day 3: The silent fire burning inside you' },
  4: { generate: generateDay4Html, subject: 'Day 4: Why you\'re tired and it\'s not caffeine' },
  5: { generate: generateDay5Html, subject: 'Day 5: The hormone nobody talks about until it\'s too late' },
  6: { generate: generateDay6Html, subject: 'Day 6: Your gut is healing wrong' },
  7: { generate: generateDay7Html, subject: 'Day 7: The cheapest health hack that 42% of Americans are failing' },
  8: { generate: generateDay8Html, subject: 'Day 8: What NASA knows about recovery that your gym doesn\'t' },
};

export function getEmailForDay(dayNumber, { firstName }) {
  const config = DAY_CONFIG[dayNumber];
  if (!config) return null;
  return {
    html: config.generate({ firstName }),
    subject: config.subject,
  };
}

export function generateDay1Html({ firstName }) {
  const bodyHtml = `
    <p style="margin: 0 0 20px;">Hey ${firstName},</p>

    <p style="margin: 0 0 20px;">Welcome. You asked for this, so let's get into it.</p>

    <p style="margin: 0 0 20px;">Here's something most people don't realize: the standard blood panel your doctor orders once a year checks about 15-20 markers. That sounds like a lot until you learn there are over 100 markers that can tell you meaningful things about how your body is actually functioning.</p>

    <p style="margin: 0 0 20px;">The annual physical panel is designed to catch disease. It's not designed to tell you how well you're performing, recovering, or aging. There's a massive gap between "nothing's wrong" and "everything's optimized" — and most people live their entire lives in that gap without knowing it.</p>

    <p style="margin: 0 0 20px;">Here's an example: standard panels rarely include insulin. They check glucose, sure. But glucose is a lagging indicator. By the time your glucose is elevated, your body has been compensating with high insulin for years — sometimes a decade. Fasting insulin is one of the single most useful numbers you can know, and almost nobody checks it.</p>

    <p style="margin: 0 0 20px;">Same goes for inflammatory markers like hs-CRP, hormone panels beyond just TSH, and nutrient levels like magnesium, B12, and vitamin D. These aren't exotic labs. They're available at any draw station. They're just not part of the default order.</p>

    <p style="margin: 0 0 20px;"><strong>What you can do today:</strong> The next time you get bloodwork, ask your provider to add fasting insulin and hs-CRP to the panel. If they ask why, tell them you want a baseline. That's it. Two markers, and you'll know more about your metabolic and inflammatory health than most people ever will.</p>

    <p style="margin: 0 0 20px;">Tomorrow: something your body does every night that most people are accidentally sabotaging.</p>
  `;

  return wrapEmail({
    firstName,
    dayNumber: 1,
    subject: 'Day 1: The one thing your blood test isn\'t telling you',
    bodyHtml,
  });
}

export function generateDay2Html({ firstName }) {
  const bodyHtml = `
    <p style="margin: 0 0 20px;">Hey ${firstName},</p>

    <p style="margin: 0 0 20px;">Let's talk about sleep. Not the "get 8 hours" advice you've heard a thousand times. Something more specific.</p>

    <p style="margin: 0 0 20px;">Your body doesn't just "rest" when you sleep. It runs a very precise repair cycle. Growth hormone surges. Your brain flushes out metabolic waste through the glymphatic system. Damaged tissue gets rebuilt. Immune cells get deployed. Memories get consolidated.</p>

    <p style="margin: 0 0 20px;">Here's the problem: most of that repair happens during deep sleep — stages 3 and 4 of your cycle. And most adults get shockingly little of it. The average 40-year-old gets about half the deep sleep they got at 20. By 50, some people are barely getting any.</p>

    <p style="margin: 0 0 20px;">What tanks deep sleep? The usual suspects, but probably not in the way you think. Alcohol is the big one. A glass of wine might help you fall asleep faster, but it absolutely destroys your deep sleep architecture. Your body spends the night metabolizing the alcohol instead of repairing itself. You wake up "rested" but your cells didn't get the memo.</p>

    <p style="margin: 0 0 20px;">The other one people miss: core body temperature. Your body needs to drop about 2-3 degrees to initiate deep sleep. If your room is too warm, if you're eating late, or if you're exercising within 2-3 hours of bed, your core temp stays elevated and your brain can't get into that deep repair mode.</p>

    <p style="margin: 0 0 20px;"><strong>What you can do today:</strong> Tonight, set your bedroom to 65-67°F. Stop eating 3 hours before bed. If you drink, skip it tonight — just as a one-night experiment. Tomorrow morning, notice the difference. Most people describe it as feeling like they "actually slept" for the first time in months.</p>

    <p style="margin: 0 0 20px;">Tomorrow: a number on your blood panel that quietly predicts heart attacks, Alzheimer's, and joint pain — and almost nobody tracks it.</p>
  `;

  return wrapEmail({
    firstName,
    dayNumber: 2,
    subject: 'Day 2: The sleep mistake that\'s aging you faster',
    bodyHtml,
  });
}

export function generateDay3Html({ firstName }) {
  const bodyHtml = `
    <p style="margin: 0 0 20px;">Hey ${firstName},</p>

    <p style="margin: 0 0 20px;">Yesterday I mentioned a number on your blood panel that quietly predicts a lot of bad things. Let's get into it.</p>

    <p style="margin: 0 0 20px;">It's called hs-CRP — high-sensitivity C-reactive protein. It measures systemic inflammation. Not the kind you feel, like a swollen ankle. The kind that's running in the background, damaging blood vessels, accelerating joint breakdown, and creating the conditions for chronic disease. Doctors call it "silent inflammation" because you don't know it's there until something breaks.</p>

    <p style="margin: 0 0 20px;">Here's why this matters: elevated hs-CRP is associated with a significantly higher risk of heart attack, stroke, type 2 diabetes, Alzheimer's, and several cancers. It's one of the most predictive markers we have, and most annual physicals don't include it.</p>

    <p style="margin: 0 0 20px;">What drives it up? The list is longer than you'd think. Processed foods. Poor sleep (there's yesterday's email connecting the dots). Visceral fat — the fat around your organs, not the stuff you can pinch. Chronic stress. Low-grade infections, including gum disease. And here's one most people don't know: high-intensity exercise without adequate recovery actually increases inflammation. Your body is trying to repair and you keep hammering it.</p>

    <p style="margin: 0 0 20px;">What brings it down? Sleep, obviously. Anti-inflammatory nutrition — think omega-3s, colorful vegetables, and cutting seed oils. Reducing visceral fat (even 5-10 lbs makes a measurable difference). And targeted interventions like high-dose vitamin C, NAD+, and specific peptides that modulate the inflammatory response at the cellular level.</p>

    <p style="margin: 0 0 20px;"><strong>What you can do today:</strong> If you don't know your hs-CRP, get it tested. Optimal is under 1.0 mg/L. If it comes back above 3.0, that's a signal worth investigating — don't ignore it just because your doctor says "it's fine." Below 1.0 is where you want to live. And if you're dealing with chronic joint pain, fatigue, or brain fog, an elevated hs-CRP might be the thread that connects all of it.</p>

    <p style="margin: 0 0 20px;">Tomorrow: why you're tired all the time, and it has nothing to do with caffeine.</p>
  `;

  return wrapEmail({
    firstName,
    dayNumber: 3,
    subject: 'Day 3: The silent fire burning inside you',
    bodyHtml,
  });
}

export function generateDay4Html({ firstName }) {
  const bodyHtml = `
    <p style="margin: 0 0 20px;">Hey ${firstName},</p>

    <p style="margin: 0 0 20px;">Quick question: when's the last time you felt genuinely energized? Not caffeinated. Not wired. Actually energized — like your body had real fuel and knew what to do with it.</p>

    <p style="margin: 0 0 20px;">If you can't remember, you're not alone. And the reason might be something happening at the cellular level that most people have never heard of.</p>

    <p style="margin: 0 0 20px;">Every cell in your body produces energy through a molecule called NAD+ (nicotinamide adenine dinucleotide). It's essential for mitochondrial function — your cells' power plants. Without enough NAD+, your mitochondria can't convert food into usable energy efficiently. You eat well, you sleep okay, but you still feel like you're running on 60%.</p>

    <p style="margin: 0 0 20px;">Here's the kicker: NAD+ levels decline significantly with age. By 40, most people have about half the NAD+ they had at 20. By 60, it can drop to 10-25% of youthful levels. This decline is now considered one of the primary drivers of aging — not just feeling old, but the actual biological mechanisms of aging. DNA repair slows down. Cellular cleanup (autophagy) stalls. Inflammation increases.</p>

    <p style="margin: 0 0 20px;">This is why some people describe getting an NAD+ IV as "turning the lights back on." It's not a stimulant. It's literally restoring a molecule your cells are starving for. The research on NAD+ and longevity, cognitive function, and metabolic health has exploded in the last five years, and it's some of the most promising work in regenerative medicine.</p>

    <p style="margin: 0 0 20px;"><strong>What you can do today:</strong> You can support NAD+ production naturally through exercise (especially HIIT), fasting, and foods rich in niacin (chicken, tuna, mushrooms, green peas). Supplements like NMN and NR are precursors that help your body make more NAD+. For a more direct approach, IV NAD+ therapy delivers it straight to your bloodstream — no gut absorption loss. If you've been dragging for months and can't figure out why, this is worth looking into.</p>

    <p style="margin: 0 0 20px;">Tomorrow: a hormone that affects your mood, your muscle, your motivation, and your metabolism — and it's declining in men and women at record rates.</p>
  `;

  return wrapEmail({
    firstName,
    dayNumber: 4,
    subject: 'Day 4: Why you\'re tired and it\'s not caffeine',
    bodyHtml,
  });
}

export function generateDay5Html({ firstName }) {
  const bodyHtml = `
    <p style="margin: 0 0 20px;">Hey ${firstName},</p>

    <p style="margin: 0 0 20px;">Today we're talking about testosterone. And before you skip this thinking it's a "men's issue" — it's not. This matters for everyone.</p>

    <p style="margin: 0 0 20px;">Testosterone doesn't just affect muscle and sex drive. It's a master regulator. It influences your energy levels, your mood, your ability to focus, your bone density, your body composition, how you handle stress, and how quickly you recover from basically anything. When it's optimized, you feel like yourself. When it's low, everything feels harder — and most people chalk it up to aging or "just being stressed."</p>

    <p style="margin: 0 0 20px;">Here's what's happening: average testosterone levels in both men and women have been declining for decades. A man today has roughly 20-25% less testosterone than a man the same age had in the 1980s. Women's levels are declining too, which shows up as fatigue, difficulty losing weight, low libido, and mood changes that often get misattributed to other things.</p>

    <p style="margin: 0 0 20px;">Why the decline? It's environmental and lifestyle. Endocrine disruptors in plastics, pesticides, and personal care products. Chronic stress driving cortisol up (which directly suppresses testosterone). Poor sleep — remember Day 2? Most testosterone is produced during deep sleep. Excess body fat converts testosterone to estrogen via an enzyme called aromatase. And simple nutrient deficiencies — zinc, vitamin D, and magnesium are all essential for testosterone production.</p>

    <p style="margin: 0 0 20px;">The frustrating part: most doctors only test total testosterone. But total T doesn't tell you what's actually available to your cells. You need free testosterone, SHBG, estradiol, and ideally DHEA-S to see the full picture. A total T of 500 ng/dL might sound "normal," but if your SHBG is sky-high, very little of that testosterone is actually doing anything.</p>

    <p style="margin: 0 0 20px;"><strong>What you can do today:</strong> Get a full hormone panel — not just total testosterone. Ask for: free testosterone, total testosterone, SHBG, estradiol, and DHEA-S. Do the blood draw before 10 AM (testosterone peaks in the morning and drops throughout the day). If your levels come back suboptimal, there are evidence-based approaches from lifestyle changes to hormone replacement therapy that can make a dramatic difference. This is one of those areas where data changes everything.</p>

    <p style="margin: 0 0 20px;">Tomorrow: something going on in your gut right now that's affecting your brain, your immune system, and how you heal.</p>
  `;

  return wrapEmail({
    firstName,
    dayNumber: 5,
    subject: 'Day 5: The hormone nobody talks about until it\'s too late',
    bodyHtml,
  });
}

export function generateDay6Html({ firstName }) {
  const bodyHtml = `
    <p style="margin: 0 0 20px;">Hey ${firstName},</p>

    <p style="margin: 0 0 20px;">Your gut lining is one cell layer thick. One. That single layer of cells is all that separates the contents of your digestive tract — bacteria, food particles, toxins — from your bloodstream. When that lining is healthy, it's selectively permeable: nutrients get through, everything else stays out.</p>

    <p style="margin: 0 0 20px;">When it's damaged? Things leak through that shouldn't. Your immune system sees these foreign particles, sounds the alarm, and you get a chronic low-grade inflammatory response. This is the basis of what's often called "leaky gut," and while it used to be dismissed as fringe science, the research is now overwhelming. The medical term is intestinal permeability, and it's linked to autoimmune conditions, skin issues, food sensitivities, brain fog, joint pain, and — full circle from Day 3 — elevated inflammatory markers.</p>

    <p style="margin: 0 0 20px;">What damages the gut lining? NSAIDs (ibuprofen, naproxen) are one of the biggest culprits — they directly erode the mucosal barrier. Antibiotics wipe out beneficial bacteria that maintain the lining. Chronic stress reduces blood flow to the gut and slows repair. Alcohol, processed food, and high sugar intake all contribute. And here's the one nobody talks about: overtraining. Intense exercise without recovery shunts blood away from the gut and increases permeability.</p>

    <p style="margin: 0 0 20px;">The good news: your gut lining regenerates every 3-5 days. It wants to heal. It just needs the right conditions and the right building blocks. Bone broth, L-glutamine, and zinc carnosine are foundational for gut repair. Fermented foods (sauerkraut, kimchi, kefir) support the microbiome. And for more targeted repair, peptides like BPC-157 have shown remarkable results in accelerating gut lining recovery. BPC-157 is a naturally occurring peptide in gastric juice — your body already makes it. Supplementing it amplifies the healing process in ways that have been studied extensively in tissue repair research.</p>

    <p style="margin: 0 0 20px;"><strong>What you can do today:</strong> For the next week, try removing NSAIDs if you use them regularly (talk to your doctor first if they're prescribed). Add bone broth or 5g of L-glutamine powder to your daily routine. Notice how you feel — bloating, energy, even mental clarity. The gut-brain connection is real, and when you fix the gut, the brain often follows.</p>

    <p style="margin: 0 0 20px;">Tomorrow: a vitamin that 42% of Americans are deficient in — and why the "normal" range on your lab report is probably wrong.</p>
  `;

  return wrapEmail({
    firstName,
    dayNumber: 6,
    subject: 'Day 6: Your gut is healing wrong',
    bodyHtml,
  });
}

export function generateDay7Html({ firstName }) {
  const bodyHtml = `
    <p style="margin: 0 0 20px;">Hey ${firstName},</p>

    <p style="margin: 0 0 20px;">Vitamin D might be the most misunderstood molecule in medicine. Most people think of it as a vitamin. It's actually a hormone — a steroid hormone that your body synthesizes from sunlight, and it influences over 1,000 genes.</p>

    <p style="margin: 0 0 20px;">It regulates immune function. It affects bone density, muscle strength, and cardiovascular health. It modulates mood through serotonin pathways. It plays a role in insulin sensitivity. And it's one of the most common deficiencies in the developed world — roughly 42% of American adults are deficient, and that number goes higher if you're over 40, have darker skin, or spend most of your day indoors.</p>

    <p style="margin: 0 0 20px;">Here's the part that frustrates me: the "normal" reference range on most lab reports is 30-100 ng/mL. That range is based on preventing rickets — a bone disease. It has almost nothing to do with optimal function. Most functional medicine practitioners and longevity researchers target 60-80 ng/mL. The difference between 35 and 70 is massive in terms of immune resilience, inflammation control, and overall performance. But at 35, your doctor tells you you're "fine."</p>

    <p style="margin: 0 0 20px;">Why so many people are low: we don't spend enough time in direct sunlight. When we do, we're wearing sunscreen (which blocks vitamin D synthesis by 95%+). Office workers, night shift workers, and anyone north of the 37th parallel for half the year are especially at risk. And dietary sources — fatty fish, egg yolks, fortified milk — provide nowhere near enough on their own.</p>

    <p style="margin: 0 0 20px;">Supplementation works, but it's not one-size-fits-all. Vitamin D is fat-soluble, which means you can overdo it — and you need to take it with fat for absorption. Vitamin D3 (cholecalciferol) is the form you want, ideally paired with K2 (which directs calcium into bones instead of arteries). Dosing depends on your current level, your weight, and your absorption — which is why testing matters.</p>

    <p style="margin: 0 0 20px;"><strong>What you can do today:</strong> Check your vitamin D level (25-hydroxy vitamin D is the test name). If it's below 50, you're likely leaving a lot on the table. A common maintenance dose is 5,000 IU of D3 daily with K2 and a meal containing fat. But start with the number — know where you are, then adjust. This is one of the simplest, cheapest interventions with one of the highest returns.</p>

    <p style="margin: 0 0 20px;">Tomorrow: a therapy that NASA uses for astronaut recovery that's quietly becoming one of the most studied tools in regenerative medicine.</p>
  `;

  return wrapEmail({
    firstName,
    dayNumber: 7,
    subject: 'Day 7: The cheapest health hack that 42% of Americans are failing',
    bodyHtml,
  });
}

export function generateDay8Html({ firstName }) {
  const bodyHtml = `
    <p style="margin: 0 0 20px;">Hey ${firstName},</p>

    <p style="margin: 0 0 20px;">In the early 2000s, NASA had a problem. Astronauts were coming back from space missions with muscle atrophy, slow-healing wounds, and bone density loss. They needed a way to accelerate tissue repair that didn't involve drugs or surgery.</p>

    <p style="margin: 0 0 20px;">What they landed on was red and near-infrared light therapy — specific wavelengths of light (typically 630-670nm red and 810-850nm near-infrared) that penetrate skin and tissue to stimulate mitochondrial function at the cellular level. The mechanism is well-documented: these wavelengths are absorbed by cytochrome c oxidase in your mitochondria, which increases ATP production (cellular energy), reduces oxidative stress, and triggers a cascade of repair signals.</p>

    <p style="margin: 0 0 20px;">Since then, the research has expanded into areas most people don't expect. Over 5,000 peer-reviewed studies have looked at red light therapy. The results on skin health and collagen production are strong. Joint pain and inflammation reduction is well-supported. Muscle recovery after exercise shows meaningful improvements. There's promising data on thyroid function, testosterone production, hair regrowth, and cognitive performance. It's not a miracle cure — but the cellular mechanism is real, and the evidence base is getting hard to ignore.</p>

    <p style="margin: 0 0 20px;">What matters is the delivery. Not all red light is equal. Those $30 face masks on Amazon aren't delivering therapeutic doses. Effective treatment requires specific wavelengths, sufficient power density (irradiance), and appropriate treatment duration. Clinical-grade panels deliver 100+ mW/cm² at the surface — that's orders of magnitude more than consumer devices. It's the difference between standing near a campfire and actually being in the sun.</p>

    <p style="margin: 0 0 20px;">This is one of those therapies where the risk-benefit ratio is almost absurdly favorable. Side effects are essentially zero. Sessions take 10-20 minutes. The downside of trying it is losing a few minutes of your day. The upside, based on the research, ranges from better skin and faster recovery to reduced inflammation and improved cellular energy production.</p>

    <p style="margin: 0 0 20px;"><strong>What you can do today:</strong> If you're dealing with joint pain, slow recovery, skin issues, or general inflammation, red light therapy is worth trying. Look for clinical-grade setups that offer full-body panels (not handheld devices — you want coverage). A good protocol is 3-5 sessions per week, 10-15 minutes per session, standing 6-12 inches from the panel. Give it 4-6 weeks to see cumulative results — this isn't instant, it's compounding.</p>

    <p style="margin: 0 0 20px;">Tomorrow: why the advice to "just eat less and move more" is scientifically bankrupt — and what actually works for sustainable body composition change.</p>
  `;

  return wrapEmail({
    firstName,
    dayNumber: 8,
    subject: 'Day 8: What NASA knows about recovery that your gym doesn\'t',
    bodyHtml,
  });
}
