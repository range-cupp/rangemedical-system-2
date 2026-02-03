// /data/researchStudies.js
// Centralized research study data for lead capture system

export const researchStudies = {
  // ===== RED LIGHT THERAPY =====
  'rlt-muscle-recovery': {
    id: 'rlt-muscle-recovery',
    service: 'red-light-therapy',
    category: 'RECOVERY',
    headline: 'Reduced Muscle Soreness After Exercise',
    summary: 'A network meta-analysis of 15 randomized controlled trials found that photobiomodulation therapy showed a significant advantage over placebo for reducing muscle soreness at 24 hours after exercise. Researchers concluded it was among the most effective physical therapy options for exercise-related muscle pain.',
    fullSummary: `This 2025 study published in Frontiers in Public Health analyzed data from 15 high-quality randomized controlled trials comparing different treatments for exercise-induced muscle soreness.

The researchers used a network meta-analysis approach, which allows comparison of multiple treatments simultaneously. They found that photobiomodulation (red and near-infrared light therapy) demonstrated a statistically significant advantage over placebo treatments.

Specifically, the analysis showed that red light therapy was among the top-performing interventions for reducing delayed-onset muscle soreness (DOMS) at the 24-hour mark after exercise — the time when soreness typically peaks.`,
    keyFindings: [
      'Statistically significant advantage over placebo at 24 hours post-exercise',
      'Ranked among the most effective physical therapy interventions studied',
      'Benefits observed across multiple study populations and exercise types',
      'No adverse effects reported in any of the included trials'
    ],
    whatThisMeans: 'If you experience muscle soreness after workouts, red light therapy may help reduce that discomfort and support faster recovery. This is especially relevant for athletes, weekend warriors, or anyone who wants to get back to training sooner.',
    sourceJournal: 'Frontiers in Public Health',
    sourceYear: 2025,
    pubmedUrl: null,
    tags: ['muscle_recovery', 'soreness', 'exercise', 'DOMS']
  },

  'rlt-muscle-performance': {
    id: 'rlt-muscle-performance',
    service: 'red-light-therapy',
    category: 'PERFORMANCE',
    headline: 'Improved Muscle Endurance and Faster Recovery',
    summary: 'A large meta-analysis of 34 randomized controlled trials found that pre-exercise photobiomodulation significantly improved muscle endurance and promoted recovery of muscle strength in both athletes and everyday people. The effect sizes ranged from moderate to large.',
    fullSummary: `This comprehensive 2024 meta-analysis published in Lasers in Medical Science pooled data from 34 randomized controlled trials examining the effects of photobiomodulation therapy on muscle performance.

The researchers specifically looked at two key outcomes: muscle endurance during exercise and recovery of muscle strength after exercise. They analyzed studies involving both trained athletes and recreationally active individuals.

The results showed that when red/near-infrared light therapy was applied before exercise, participants demonstrated improved endurance capacity and faster recovery of muscle strength compared to control groups. The effect sizes were categorized as moderate to large, indicating clinically meaningful benefits.`,
    keyFindings: [
      'Pre-exercise application showed significant benefits for endurance',
      'Faster recovery of muscle strength after exercise',
      'Benefits observed in both trained athletes and recreational exercisers',
      'Effect sizes ranged from moderate to large (clinically meaningful)'
    ],
    whatThisMeans: 'Using red light therapy before your workout may help you perform better and recover faster afterward. Whether you\'re a competitive athlete or just trying to stay active, this could be a useful addition to your routine.',
    sourceJournal: 'Lasers in Medical Science',
    sourceYear: 2024,
    pubmedUrl: null,
    tags: ['performance', 'endurance', 'strength', 'pre_exercise']
  },

  'rlt-inflammation': {
    id: 'rlt-inflammation',
    service: 'red-light-therapy',
    category: 'INFLAMMATION',
    headline: 'Reduced Pro-Inflammatory Markers',
    summary: 'A comprehensive review found that red and near-infrared light therapy reduces pro-inflammatory cytokines like TNF-α and IL-1β while increasing anti-inflammatory mediators like IL-10. Researchers noted both local and systemic anti-inflammatory effects across multiple human and animal studies.',
    fullSummary: `This influential 2017 review by Dr. Michael Hamblin from Harvard Medical School and MIT examined the mechanisms by which photobiomodulation reduces inflammation.

The review analyzed multiple human and animal studies and found consistent evidence that red and near-infrared light therapy affects inflammatory markers at the cellular level. Specifically, the therapy was shown to reduce pro-inflammatory cytokines (chemical messengers that promote inflammation) like TNF-α and IL-1β.

At the same time, the treatment increased anti-inflammatory mediators like IL-10, which helps calm the inflammatory response. Importantly, these effects were observed both locally (at the treatment site) and systemically (throughout the body).`,
    keyFindings: [
      'Reduces pro-inflammatory cytokines TNF-α and IL-1β',
      'Increases anti-inflammatory mediator IL-10',
      'Effects observed both locally and systemically',
      'Consistent findings across human and animal studies'
    ],
    whatThisMeans: 'Chronic inflammation is linked to many health issues, from joint pain to fatigue. Red light therapy may help your body manage inflammation more effectively by shifting the balance toward anti-inflammatory processes.',
    sourceJournal: 'AIMS Biophysics',
    sourceYear: 2017,
    pubmedUrl: null,
    tags: ['inflammation', 'cytokines', 'TNF', 'IL10', 'systemic']
  },

  'rlt-sleep': {
    id: 'rlt-sleep',
    service: 'red-light-therapy',
    category: 'SLEEP',
    headline: 'Better Sleep and Higher Melatonin in Athletes',
    summary: 'In a randomized, sham-controlled study of 21 healthy female athletes, two weeks of whole-body red light therapy improved global sleep quality scores, increased sleep duration, and decreased the time it took to fall asleep. The treatment group also showed improved serum melatonin levels compared to sham.',
    fullSummary: `This 2012 study published in the Journal of Athletic Training was a well-designed randomized, placebo-controlled trial examining the effects of red light therapy on sleep in female basketball players.

Twenty-one healthy female athletes were randomly assigned to receive either real red light therapy or a sham treatment for 14 days. The researchers measured sleep quality using standardized questionnaires (Pittsburgh Sleep Quality Index) and also tested blood melatonin levels.

The results showed that the red light therapy group experienced significant improvements in overall sleep quality, including falling asleep faster and sleeping longer. Blood tests confirmed that melatonin levels — the hormone that regulates sleep — were higher in the treatment group.`,
    keyFindings: [
      'Improved global sleep quality scores (Pittsburgh Sleep Quality Index)',
      'Reduced time to fall asleep (sleep latency)',
      'Increased total sleep duration',
      'Higher serum melatonin levels vs. sham treatment'
    ],
    whatThisMeans: 'Quality sleep is critical for recovery, performance, and how you feel every day. Red light therapy may support your body\'s natural sleep-wake cycle by promoting healthy melatonin production.',
    sourceJournal: 'Journal of Athletic Training',
    sourceYear: 2012,
    pubmedUrl: null,
    tags: ['sleep', 'melatonin', 'athletes', 'recovery']
  },

  'rlt-immune': {
    id: 'rlt-immune',
    service: 'red-light-therapy',
    category: 'CELLULAR HEALTH',
    headline: 'Shifts Immune Cells Toward Repair Mode',
    summary: 'A systematic review of clinical and experimental studies found that photobiomodulation promotes macrophage polarization toward the M2 repair phenotype while decreasing production of pro-inflammatory cytokines. This shift supports tissue repair and a more balanced immune response.',
    fullSummary: `This 2024 systematic review published in Lasers in Medical Science examined how photobiomodulation affects immune cell behavior, specifically focusing on macrophages — immune cells that play a key role in both inflammation and healing.

Macrophages can exist in two main states: M1 (pro-inflammatory, fighting infection) and M2 (anti-inflammatory, promoting repair). The review found consistent evidence that red and near-infrared light therapy promotes a shift toward the M2 "repair" phenotype.

This shift is accompanied by decreased production of pro-inflammatory cytokines and increased production of factors that support tissue healing. The researchers concluded that this immunomodulatory effect helps explain many of the therapeutic benefits of photobiomodulation.`,
    keyFindings: [
      'Promotes macrophage polarization toward M2 (repair) phenotype',
      'Decreases pro-inflammatory cytokine production',
      'Supports tissue repair processes',
      'Creates more balanced immune response'
    ],
    whatThisMeans: 'Your immune system needs to balance fighting threats with repairing damage. Red light therapy may help tip that balance toward healing and repair, which is especially useful when recovering from injury or dealing with chronic inflammation.',
    sourceJournal: 'Lasers in Medical Science',
    sourceYear: 2024,
    pubmedUrl: null,
    tags: ['immune', 'macrophage', 'M2', 'tissue_repair', 'cellular']
  },

  'rlt-pain': {
    id: 'rlt-pain',
    service: 'red-light-therapy',
    category: 'PAIN',
    headline: 'Effective for Musculoskeletal Pain in Athletes',
    summary: 'A meta-analysis of 6 randomized controlled trials involving 205 competitive and recreational athletes found that photobiomodulation had a positive effect on pain reduction compared to placebo and other controls. Researchers noted benefits across a range of musculoskeletal injuries.',
    fullSummary: `This 2024 meta-analysis published in the Journal of Sports Medicine specifically examined the use of photobiomodulation for pain management in athletic populations.

The researchers pooled data from 6 randomized controlled trials involving 205 athletes — both competitive and recreational. The studies examined various musculoskeletal pain conditions common in sports, including muscle strains, tendinopathies, and overuse injuries.

The analysis found a statistically significant positive effect of red/near-infrared light therapy on pain reduction when compared to placebo treatments and other control conditions. The benefits were observed across different types of musculoskeletal injuries.`,
    keyFindings: [
      'Statistically significant pain reduction vs. placebo',
      'Benefits observed in both competitive and recreational athletes',
      'Effective across various musculoskeletal injury types',
      'Pooled data from 205 athletes across 6 trials'
    ],
    whatThisMeans: 'If you\'re dealing with joint pain, muscle pain, or overuse injuries, red light therapy may help reduce your discomfort. This is especially relevant for active people who want to manage pain without relying solely on medications.',
    sourceJournal: 'Journal of Sports Medicine',
    sourceYear: 2024,
    pubmedUrl: null,
    tags: ['pain', 'musculoskeletal', 'athletes', 'injury']
  }
};

export const getStudiesByService = (service) => {
  return Object.values(researchStudies).filter(study => study.service === service);
};

export const getStudyById = (id) => {
  return researchStudies[id] || null;
};
