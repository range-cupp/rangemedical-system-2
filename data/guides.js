// data/guides.js
// Content for public-facing /guides/[slug] downloadable lead-magnet pages.
// Add new guides here — the /guides/[slug] route renders any guide in this map.

export const guides = {
  'brain-fog': {
    slug: 'brain-fog',
    pdfPath: '/guides/range-brain-fog-lab-guide.pdf',
    pdfFilename: 'range-brain-fog-lab-guide.pdf',
    trackingName: 'brain-fog-guide-download',
    seo: {
      title: 'The Brain Fog Lab Guide | Range Medical',
      description:
        'The 7 blood markers that explain brain fog — fasting insulin, A1c, hs-CRP, homocysteine, B12, ferritin, full thyroid panel. Free guide from Range Medical, Newport Beach.',
      canonical: 'https://www.range-medical.com/guides/brain-fog',
      ogImage:
        'https://storage.googleapis.com/msgsndr/WICdvbXmTjQORW6GiHWW/media/695fe7ca6eabe6386b2d84e1.png',
    },
    hero: {
      kicker: 'BRAIN FOG IS A LAB RESULT.',
      title: 'The Brain Fog Lab Guide.',
      subhead:
        "The 7 blood markers that explain why you can't think straight — and what optimal looks like.",
    },
    whatsInside: {
      kicker: "WHAT'S INSIDE",
      title: "What you'll learn from the guide",
      cards: [
        {
          number: '01',
          title: 'The 7 markers your physical misses',
          body:
            'Fasting insulin. A1c. hs-CRP. Homocysteine. B12. Ferritin. Full thyroid panel. The blood work that actually explains brain fog — almost none of which gets run at a standard physical.',
        },
        {
          number: '02',
          title: 'What optimal actually looks like',
          body:
            "Conventional “normal” ranges are set so wide you can be in metabolic decline for a decade and still get a clean lab report. The guide shows you the functional medicine ranges that catch problems years earlier.",
        },
        {
          number: '03',
          title: 'Two ways to get tested',
          body:
            'Get the markers run at Range as part of our Essential Panel, or order them yourself through a direct-to-consumer lab service. The guide explains the tradeoffs of each.',
        },
      ],
    },
    whoItsFor: {
      kicker: 'IS THIS YOU?',
      title: 'If any of this sounds like your daily life…',
      items: [
        'Reading the same email three times',
        'Walking into a room and forgetting why',
        'Losing words mid-sentence',
        'The 2–3pm energy crash',
        "Feeling foggy even after a full night's sleep",
        "A “normal” lab report that doesn't match how you feel",
      ],
      footer:
        "Brain fog is not a personality trait. It's a metabolic event. The guide shows you exactly what to test and what to do with the results.",
    },
    finalCta: {
      kicker: "WHEN YOU'RE READY",
      title: 'Stop guessing. Start measuring.',
      body:
        "Start with a $197 Range Assessment. We'll review your symptoms, decide which markers to run, and order them with you. Every marker in the guide is included in our Essential Panel ($350) — blood draw, lab work, and a full provider review to walk you through what each one means for you.",
      primaryLabel: 'Book Range Assessment — $197',
      primaryHref: '/assessment?path=energy',
      outlineLabel: 'Download the Guide First',
    },
    heroBookHref: '/assessment?path=energy',
  },
};

export function getGuideSlugs() {
  return Object.keys(guides);
}

export function getGuide(slug) {
  return guides[slug] || null;
}
