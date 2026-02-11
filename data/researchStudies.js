// /data/researchStudies.js
// Centralized research study data for lead capture system

export const researchStudies = {
  // ===== RED LIGHT THERAPY =====
  'rlt-muscle-recovery': {
    id: 'rlt-muscle-recovery',
    service: 'red-light-therapy',
    category: 'RECOVERY',
    headline: 'Reduced Muscle Soreness After Exercise',
    summary: 'A network meta-analysis of 15 randomized controlled trials found that photobiomodulation therapy showed a significant advantage over placebo for reducing muscle soreness at 24 hours after exercise.',
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
    tags: ['muscle_recovery', 'soreness', 'exercise', 'DOMS']
  },

  'rlt-muscle-performance': {
    id: 'rlt-muscle-performance',
    service: 'red-light-therapy',
    category: 'PERFORMANCE',
    headline: 'Improved Muscle Endurance and Faster Recovery',
    summary: 'A large meta-analysis of 34 randomized controlled trials found that pre-exercise photobiomodulation significantly improved muscle endurance and promoted recovery of muscle strength in both athletes and everyday people.',
    fullSummary: `This comprehensive 2024 meta-analysis published in Lasers in Medical Science pooled data from 34 randomized controlled trials examining the effects of photobiomodulation therapy on muscle performance.

The researchers specifically looked at two key outcomes: muscle endurance during exercise and recovery of muscle strength after exercise. They analyzed studies involving both trained athletes and recreationally active individuals.

The results showed that when red/near-infrared light therapy was applied before exercise, participants demonstrated improved endurance capacity and faster recovery of muscle strength compared to control groups.`,
    keyFindings: [
      'Pre-exercise application showed significant benefits for endurance',
      'Faster recovery of muscle strength after exercise',
      'Benefits observed in both trained athletes and recreational exercisers',
      'Effect sizes ranged from moderate to large (clinically meaningful)'
    ],
    whatThisMeans: 'Using red light therapy before your workout may help you perform better and recover faster afterward. Whether you\'re a competitive athlete or just trying to stay active, this could be a useful addition to your routine.',
    sourceJournal: 'Lasers in Medical Science',
    sourceYear: 2024,
    tags: ['performance', 'endurance', 'strength', 'pre_exercise']
  },

  'rlt-inflammation': {
    id: 'rlt-inflammation',
    service: 'red-light-therapy',
    category: 'INFLAMMATION',
    headline: 'Reduced Pro-Inflammatory Markers',
    summary: 'A comprehensive review found that red and near-infrared light therapy reduces pro-inflammatory cytokines like TNF-α and IL-1β while increasing anti-inflammatory mediators like IL-10.',
    fullSummary: `This influential 2017 review by Dr. Michael Hamblin from Harvard Medical School and MIT examined the mechanisms by which photobiomodulation reduces inflammation.

The review analyzed multiple human and animal studies and found consistent evidence that red and near-infrared light therapy affects inflammatory markers at the cellular level. Specifically, the therapy was shown to reduce pro-inflammatory cytokines.

At the same time, the treatment increased anti-inflammatory mediators like IL-10, which helps calm the inflammatory response. These effects were observed both locally and systemically.`,
    keyFindings: [
      'Reduces pro-inflammatory cytokines TNF-α and IL-1β',
      'Increases anti-inflammatory mediator IL-10',
      'Effects observed both locally and systemically',
      'Consistent findings across human and animal studies'
    ],
    whatThisMeans: 'Chronic inflammation is linked to many health issues, from joint pain to fatigue. Red light therapy may help your body manage inflammation more effectively by shifting the balance toward anti-inflammatory processes.',
    sourceJournal: 'AIMS Biophysics',
    sourceYear: 2017,
    tags: ['inflammation', 'cytokines', 'TNF', 'IL10', 'systemic']
  },

  'rlt-sleep': {
    id: 'rlt-sleep',
    service: 'red-light-therapy',
    category: 'SLEEP',
    headline: 'Better Sleep and Higher Melatonin in Athletes',
    summary: 'In a randomized, sham-controlled study of 21 healthy female athletes, two weeks of whole-body red light therapy improved global sleep quality scores, increased sleep duration, and decreased the time it took to fall asleep.',
    fullSummary: `This 2012 study published in the Journal of Athletic Training was a well-designed randomized, placebo-controlled trial examining the effects of red light therapy on sleep in female basketball players.

Twenty-one healthy female athletes were randomly assigned to receive either real red light therapy or a sham treatment for 14 days. The researchers measured sleep quality using standardized questionnaires and also tested blood melatonin levels.

The results showed that the red light therapy group experienced significant improvements in overall sleep quality, including falling asleep faster and sleeping longer.`,
    keyFindings: [
      'Improved global sleep quality scores (Pittsburgh Sleep Quality Index)',
      'Reduced time to fall asleep (sleep latency)',
      'Increased total sleep duration',
      'Higher serum melatonin levels vs. sham treatment'
    ],
    whatThisMeans: 'Quality sleep is critical for recovery, performance, and how you feel every day. Red light therapy may support your body\'s natural sleep-wake cycle by promoting healthy melatonin production.',
    sourceJournal: 'Journal of Athletic Training',
    sourceYear: 2012,
    tags: ['sleep', 'melatonin', 'athletes', 'recovery']
  },

  'rlt-immune': {
    id: 'rlt-immune',
    service: 'red-light-therapy',
    category: 'CELLULAR HEALTH',
    headline: 'Shifts Immune Cells Toward Repair Mode',
    summary: 'A systematic review found that photobiomodulation promotes macrophage polarization toward the M2 repair phenotype while decreasing production of pro-inflammatory cytokines.',
    fullSummary: `This 2024 systematic review published in Lasers in Medical Science examined how photobiomodulation affects immune cell behavior, specifically focusing on macrophages — immune cells that play a key role in both inflammation and healing.

Macrophages can exist in two main states: M1 (pro-inflammatory, fighting infection) and M2 (anti-inflammatory, promoting repair). The review found consistent evidence that red and near-infrared light therapy promotes a shift toward the M2 "repair" phenotype.

This shift is accompanied by decreased production of pro-inflammatory cytokines and increased production of factors that support tissue healing.`,
    keyFindings: [
      'Promotes macrophage polarization toward M2 (repair) phenotype',
      'Decreases pro-inflammatory cytokine production',
      'Supports tissue repair processes',
      'Creates more balanced immune response'
    ],
    whatThisMeans: 'Your immune system needs to balance fighting threats with repairing damage. Red light therapy may help tip that balance toward healing and repair, which is especially useful when recovering from injury or dealing with chronic inflammation.',
    sourceJournal: 'Lasers in Medical Science',
    sourceYear: 2024,
    tags: ['immune', 'macrophage', 'M2', 'tissue_repair', 'cellular']
  },

  'rlt-pain': {
    id: 'rlt-pain',
    service: 'red-light-therapy',
    category: 'PAIN',
    headline: 'Effective for Musculoskeletal Pain in Athletes',
    summary: 'A meta-analysis of 6 randomized controlled trials involving 205 competitive and recreational athletes found that photobiomodulation had a positive effect on pain reduction compared to placebo.',
    fullSummary: `This 2024 meta-analysis published in the Journal of Sports Medicine specifically examined the use of photobiomodulation for pain management in athletic populations.

The researchers pooled data from 6 randomized controlled trials involving 205 athletes — both competitive and recreational. The studies examined various musculoskeletal pain conditions common in sports.

The analysis found a statistically significant positive effect of red/near-infrared light therapy on pain reduction when compared to placebo treatments and other control conditions.`,
    keyFindings: [
      'Statistically significant pain reduction vs. placebo',
      'Benefits observed in both competitive and recreational athletes',
      'Effective across various musculoskeletal injury types',
      'Pooled data from 205 athletes across 6 trials'
    ],
    whatThisMeans: 'If you\'re dealing with joint pain, muscle pain, or overuse injuries, red light therapy may help reduce your discomfort. This is especially relevant for active people who want to manage pain without relying solely on medications.',
    sourceJournal: 'Journal of Sports Medicine',
    sourceYear: 2024,
    tags: ['pain', 'musculoskeletal', 'athletes', 'injury']
  },

  // ===== HORMONE OPTIMIZATION =====
  'hrt-energy': {
    id: 'hrt-energy',
    service: 'hormone-optimization',
    category: 'ENERGY & FATIGUE',
    headline: 'Significant Improvement in Fatigue Symptoms',
    summary: 'A meta-analysis of 27 randomized controlled trials found that testosterone therapy significantly improved fatigue in men with low testosterone, with effects seen as early as 4 weeks.',
    fullSummary: `This 2018 meta-analysis published in the Journal of Clinical Endocrinology & Metabolism analyzed data from 27 randomized controlled trials examining testosterone therapy's effects on fatigue.

The researchers found that testosterone replacement therapy produced significant improvements in fatigue symptoms among men with documented low testosterone levels. Importantly, these improvements were detectable within the first month of treatment.

The analysis demonstrated consistent benefits across different study populations and testosterone formulations, providing strong evidence for the energy-boosting effects of hormone optimization.`,
    keyFindings: [
      'Significant improvement in fatigue symptoms vs. placebo',
      'Effects observed as early as 4 weeks into treatment',
      'Consistent benefits across 27 randomized controlled trials',
      'Benefits seen in men with documented low testosterone'
    ],
    whatThisMeans: 'If you\'re experiencing persistent fatigue despite adequate sleep and healthy habits, low testosterone could be contributing. Hormone optimization may help restore your energy levels within weeks of starting treatment.',
    sourceJournal: 'Journal of Clinical Endocrinology & Metabolism',
    sourceYear: 2018,
    tags: ['energy', 'fatigue', 'testosterone', 'TRT']
  },

  'hrt-body-composition': {
    id: 'hrt-body-composition',
    service: 'hormone-optimization',
    category: 'BODY COMPOSITION',
    headline: 'Increased Lean Mass, Decreased Fat Mass',
    summary: 'A systematic review of 59 studies found that testosterone therapy increased lean body mass by 3-5 kg and decreased fat mass by 2-3 kg over 6-12 months of treatment.',
    fullSummary: `This comprehensive 2018 systematic review published in Endocrine Reviews analyzed 59 studies examining testosterone therapy's effects on body composition.

The researchers found consistent evidence that testosterone replacement leads to meaningful changes in body composition. On average, men gained 3-5 kg of lean muscle mass while losing 2-3 kg of fat mass over 6-12 months of treatment.

These changes occurred even without specific exercise interventions, though the combination of hormone optimization with resistance training produced even greater results.`,
    keyFindings: [
      'Average increase of 3-5 kg in lean body mass',
      'Average decrease of 2-3 kg in fat mass',
      'Benefits observed over 6-12 months of treatment',
      'Consistent findings across 59 studies'
    ],
    whatThisMeans: 'Optimizing your hormones can help shift your body composition toward more muscle and less fat. This isn\'t just about appearance — it\'s about metabolic health, strength, and maintaining an active lifestyle as you age.',
    sourceJournal: 'Endocrine Reviews',
    sourceYear: 2018,
    tags: ['body_composition', 'muscle', 'fat_loss', 'testosterone']
  },

  'hrt-cognitive': {
    id: 'hrt-cognitive',
    service: 'hormone-optimization',
    category: 'COGNITIVE FUNCTION',
    headline: 'Improved Verbal Memory and Spatial Ability',
    summary: 'A randomized controlled trial showed that testosterone therapy improved verbal memory and spatial ability in older men over 12 months of treatment.',
    fullSummary: `This 2017 study published in JAMA Internal Medicine was part of the landmark Testosterone Trials (TTrials), examining cognitive effects of testosterone therapy in older men with low testosterone.

The double-blind, placebo-controlled trial found that men receiving testosterone showed improvements in verbal memory and spatial ability compared to those receiving placebo. These cognitive domains are particularly relevant for daily functioning.

The findings suggest that maintaining optimal testosterone levels may support cognitive health as men age.`,
    keyFindings: [
      'Significant improvement in verbal memory',
      'Improved spatial ability and reasoning',
      'Benefits observed over 12 months of treatment',
      'Part of the landmark Testosterone Trials research'
    ],
    whatThisMeans: 'Brain fog and memory issues aren\'t just inevitable parts of aging. If you\'re experiencing cognitive changes alongside other symptoms of low testosterone, hormone optimization may help sharpen your mental clarity.',
    sourceJournal: 'JAMA Internal Medicine',
    sourceYear: 2017,
    tags: ['cognitive', 'memory', 'brain_health', 'testosterone']
  },

  'hrt-mood': {
    id: 'hrt-mood',
    service: 'hormone-optimization',
    category: 'MOOD & DEPRESSION',
    headline: 'Reduced Depressive Symptoms',
    summary: 'A meta-analysis of 27 randomized controlled trials found that testosterone therapy significantly reduced depressive symptoms in men with low testosterone.',
    fullSummary: `This 2019 meta-analysis published in JAMA Psychiatry pooled data from 27 randomized controlled trials examining the relationship between testosterone therapy and mood.

The researchers found a significant reduction in depressive symptoms among men receiving testosterone compared to placebo. The effect was particularly pronounced in men with documented low testosterone levels at baseline.

This research provides important evidence that hormonal imbalances can contribute to mood disturbances, and that optimization may be part of a comprehensive approach to mental wellness.`,
    keyFindings: [
      'Significant reduction in depressive symptoms',
      'Benefits most pronounced in men with low baseline testosterone',
      'Consistent findings across 27 randomized controlled trials',
      'Supports hormonal contribution to mood regulation'
    ],
    whatThisMeans: 'Mood changes and depression can have multiple causes, and hormones are often overlooked. If you\'re experiencing low mood alongside other symptoms of low testosterone, hormone optimization may help restore your sense of well-being.',
    sourceJournal: 'JAMA Psychiatry',
    sourceYear: 2019,
    tags: ['mood', 'depression', 'mental_health', 'testosterone']
  },

  'hrt-bone': {
    id: 'hrt-bone',
    service: 'hormone-optimization',
    category: 'BONE HEALTH',
    headline: 'Increased Bone Mineral Density',
    summary: 'The Testosterone Trials found that one year of testosterone therapy significantly increased volumetric bone mineral density in older men with low testosterone.',
    fullSummary: `This 2017 study from JAMA Internal Medicine was part of the Testosterone Trials, examining bone health outcomes in older men with low testosterone.

Using advanced imaging techniques, researchers found that testosterone therapy significantly increased volumetric bone mineral density — a measure that's more accurate than traditional bone density scans. The improvements were seen in the spine and hip.

These findings are important because bone loss accelerates as testosterone declines with age, increasing fracture risk.`,
    keyFindings: [
      'Significant increase in volumetric bone mineral density',
      'Improvements seen in spine and hip bones',
      'Benefits documented over 12 months of treatment',
      'Important for fracture prevention as men age'
    ],
    whatThisMeans: 'Bone health isn\'t just a concern for women. Men lose bone density as testosterone declines, increasing fracture risk. Hormone optimization may help maintain strong bones and reduce your risk of osteoporosis.',
    sourceJournal: 'JAMA Internal Medicine',
    sourceYear: 2017,
    tags: ['bone_health', 'osteoporosis', 'bone_density', 'testosterone']
  },

  'hrt-cardiovascular': {
    id: 'hrt-cardiovascular',
    service: 'hormone-optimization',
    category: 'CARDIOVASCULAR',
    headline: 'No Increased Cardiovascular Risk',
    summary: 'The TRAVERSE trial of 5,000+ men found that testosterone replacement therapy did not increase the risk of major cardiovascular events compared to placebo.',
    fullSummary: `This landmark 2023 study published in the New England Journal of Medicine was designed specifically to assess cardiovascular safety of testosterone therapy.

The TRAVERSE trial enrolled over 5,000 men with low testosterone and followed them for major cardiovascular events including heart attack and stroke. The results showed that testosterone therapy did not increase cardiovascular risk compared to placebo.

This large, well-designed trial provides important reassurance about the safety of hormone optimization when properly prescribed and monitored.`,
    keyFindings: [
      'No increased risk of major cardiovascular events',
      'Largest testosterone safety trial ever conducted (5,000+ men)',
      'Published in the prestigious New England Journal of Medicine',
      'Provides reassurance about cardiovascular safety'
    ],
    whatThisMeans: 'Concerns about heart health have made some men hesitant about testosterone therapy. This landmark study shows that properly managed hormone optimization does not increase cardiovascular risk, allowing you to pursue treatment with confidence.',
    sourceJournal: 'New England Journal of Medicine',
    sourceYear: 2023,
    tags: ['cardiovascular', 'heart_health', 'safety', 'testosterone']
  },

  // ===== HYPERBARIC OXYGEN THERAPY =====
  'hbot-performance': {
    id: 'hbot-performance',
    service: 'hyperbaric-oxygen-therapy',
    category: 'PERFORMANCE',
    headline: 'Improved VO2 Max and Endurance in Athletes',
    summary: 'A double-blind randomized controlled trial showed significant increases in VO2 max and improvements in power output and anaerobic threshold with hyperbaric oxygen therapy.',
    fullSummary: `This 2022 study published in Sports Medicine – Open used a rigorous double-blind design to examine hyperbaric oxygen therapy's effects on athletic performance.

Athletes who received HBOT showed significant improvements in VO2 max — a key measure of aerobic fitness. They also demonstrated improvements in power output and anaerobic threshold, indicating enhanced overall athletic capacity.

These findings suggest HBOT may be a valuable tool for athletes looking to optimize their performance.`,
    keyFindings: [
      'Significant increase in VO2 max (aerobic capacity)',
      'Improved power output during exercise',
      'Enhanced anaerobic threshold',
      'Double-blind randomized controlled design'
    ],
    whatThisMeans: 'Whether you\'re a competitive athlete or fitness enthusiast, HBOT may help push your performance to the next level by improving your body\'s ability to utilize oxygen during exercise.',
    sourceJournal: 'Sports Medicine – Open',
    sourceYear: 2022,
    tags: ['performance', 'VO2_max', 'endurance', 'athletes']
  },

  'hbot-mitochondria': {
    id: 'hbot-mitochondria',
    service: 'hyperbaric-oxygen-therapy',
    category: 'CELLULAR ENERGY',
    headline: 'Increased Mitochondrial Mass and Respiration',
    summary: 'Research using muscle biopsies showed that repeated HBOT sessions increased mitochondrial mass and improved cellular respiration.',
    fullSummary: `This 2022 study published in Sports Medicine – Open examined the cellular effects of hyperbaric oxygen therapy using muscle biopsies — the gold standard for assessing mitochondrial changes.

Researchers found that repeated HBOT sessions led to measurable increases in mitochondrial mass — the cellular powerhouses responsible for energy production. Additionally, the mitochondria showed improved respiratory function.

These findings help explain how HBOT may enhance energy levels and physical performance at the cellular level.`,
    keyFindings: [
      'Increased mitochondrial mass in muscle tissue',
      'Improved mitochondrial respiratory function',
      'Direct evidence from muscle biopsies',
      'Explains cellular basis for energy improvements'
    ],
    whatThisMeans: 'Your mitochondria are the engines of your cells. HBOT may help build more of these cellular powerhouses and make them work more efficiently, potentially boosting your energy at the most fundamental level.',
    sourceJournal: 'Sports Medicine – Open',
    sourceYear: 2022,
    tags: ['mitochondria', 'cellular_energy', 'ATP', 'bioenergetics']
  },

  'hbot-wound-healing': {
    id: 'hbot-wound-healing',
    service: 'hyperbaric-oxygen-therapy',
    category: 'HEALING & RECOVERY',
    headline: 'Faster Wound Healing in Clinical Patients',
    summary: 'A study of 40 patients with complex wounds showed 77.5% fully healed after HBOT, with an average wound reduction of 30% after just 5 treatments.',
    fullSummary: `This 2015 study published in the Journal of the American College of Clinical Wound Specialists examined HBOT for difficult-to-heal wounds.

Forty patients with complex wounds that had failed to respond to conventional treatment received hyperbaric oxygen therapy. The results were striking: 77.5% of wounds fully healed, and patients saw an average 30% wound reduction after just 5 treatments.

These findings demonstrate HBOT's powerful ability to accelerate the body's natural healing processes.`,
    keyFindings: [
      '77.5% of complex wounds fully healed',
      'Average 30% wound reduction after 5 treatments',
      'Effective for wounds that failed conventional treatment',
      'Demonstrates accelerated healing capacity'
    ],
    whatThisMeans: 'If you\'re recovering from surgery, injury, or dealing with slow-healing wounds, HBOT may significantly accelerate your healing by flooding tissues with oxygen and stimulating repair processes.',
    sourceJournal: 'Journal of the American College of Clinical Wound Specialists',
    sourceYear: 2015,
    tags: ['wound_healing', 'recovery', 'tissue_repair', 'surgery']
  },

  'hbot-inflammation': {
    id: 'hbot-inflammation',
    service: 'hyperbaric-oxygen-therapy',
    category: 'INFLAMMATION',
    headline: 'Reduced Inflammatory Markers',
    summary: 'A systematic review found that HBOT reduced pro-inflammatory proteins and cytokines, demonstrating significant anti-inflammatory effects.',
    fullSummary: `This 2021 systematic review published in Biomolecules analyzed the anti-inflammatory effects of hyperbaric oxygen therapy across multiple studies.

The researchers found consistent evidence that HBOT reduces pro-inflammatory markers including various cytokines and inflammatory proteins. This anti-inflammatory effect was observed across different conditions and patient populations.

The findings suggest HBOT may be valuable for managing chronic inflammation and inflammatory conditions.`,
    keyFindings: [
      'Reduced pro-inflammatory cytokines',
      'Decreased inflammatory protein markers',
      'Consistent findings across multiple studies',
      'Systemic anti-inflammatory effects'
    ],
    whatThisMeans: 'Chronic inflammation underlies many health problems. HBOT\'s ability to reduce inflammatory markers may help with recovery, pain management, and overall health optimization.',
    sourceJournal: 'Biomolecules (MDPI)',
    sourceYear: 2021,
    tags: ['inflammation', 'cytokines', 'anti_inflammatory', 'recovery']
  },

  'hbot-stem-cells': {
    id: 'hbot-stem-cells',
    service: 'hyperbaric-oxygen-therapy',
    category: 'CIRCULATION',
    headline: '8× Increase in Circulating Stem Cells',
    summary: 'Research showed that a single HBOT session doubled circulating stem cells, while 20 sessions increased levels eightfold.',
    fullSummary: `This 2006 study published in the American Journal of Physiology – Heart and Circulatory Physiology made a groundbreaking discovery about HBOT and stem cells.

Researchers found that a single hyperbaric oxygen session doubled the number of stem cells circulating in the bloodstream. Even more impressively, a series of 20 sessions increased circulating stem cells by eight times.

These stem cells are the body's repair cells, capable of regenerating damaged tissues throughout the body.`,
    keyFindings: [
      'Single session doubled circulating stem cells',
      '20 sessions increased stem cells 8-fold',
      'Mobilizes the body\'s natural repair cells',
      'May enhance tissue regeneration throughout the body'
    ],
    whatThisMeans: 'Stem cells are your body\'s master repair cells. HBOT\'s ability to dramatically increase circulating stem cells may enhance your body\'s natural healing and regeneration capabilities.',
    sourceJournal: 'American Journal of Physiology – Heart and Circulatory Physiology',
    sourceYear: 2006,
    tags: ['stem_cells', 'regeneration', 'circulation', 'healing']
  },

  'hbot-brain': {
    id: 'hbot-brain',
    service: 'hyperbaric-oxygen-therapy',
    category: 'BRAIN HEALTH',
    headline: 'Cognitive Improvements After Brain Injury',
    summary: 'A randomized controlled trial showed that 40 sessions of HBOT produced significant improvements in memory, cognitive function, and sleep quality, with benefits lasting 2+ months.',
    fullSummary: `This 2020 study published in Medical Gas Research examined HBOT for cognitive recovery following brain injury.

Participants who received 40 HBOT sessions showed significant improvements in memory, overall cognitive function, and sleep quality compared to controls. Importantly, these benefits persisted for at least 2 months after treatment ended.

The findings suggest HBOT may support brain healing and cognitive recovery.`,
    keyFindings: [
      'Significant improvements in memory function',
      'Enhanced overall cognitive performance',
      'Improved sleep quality',
      'Benefits persisted 2+ months after treatment'
    ],
    whatThisMeans: 'Whether recovering from concussion or seeking cognitive optimization, HBOT\'s ability to enhance oxygen delivery to the brain may support neurological health and mental performance.',
    sourceJournal: 'Medical Gas Research',
    sourceYear: 2020,
    tags: ['brain_health', 'cognitive', 'memory', 'neurological']
  },

  // ===== PEPTIDE THERAPY =====
  'peptide-tendon': {
    id: 'peptide-tendon',
    service: 'peptide-therapy',
    category: 'TISSUE HEALING',
    headline: 'Peptides Accelerate Tendon Healing',
    summary: 'Multiple studies show that healing peptides significantly accelerate tendon-to-bone healing, offering promise for injury recovery.',
    fullSummary: `This 2019 research published in the Journal of Orthopaedic Research examined the effects of specific peptides on tendon healing.

Multiple studies demonstrated that certain peptides significantly accelerate the tendon-to-bone healing process. These peptides work by promoting cellular activity at the injury site and enhancing the body's natural repair mechanisms.

The findings have important implications for athletes and active individuals recovering from tendon injuries.`,
    keyFindings: [
      'Significantly accelerated tendon-to-bone healing',
      'Enhanced cellular activity at injury sites',
      'Promoted natural repair mechanisms',
      'Consistent findings across multiple studies'
    ],
    whatThisMeans: 'Tendon injuries can be slow to heal. Peptide therapy may help accelerate your recovery by enhancing your body\'s natural tissue repair processes, getting you back to activity sooner.',
    sourceJournal: 'Journal of Orthopaedic Research',
    sourceYear: 2019,
    tags: ['tendon', 'healing', 'injury_recovery', 'tissue_repair']
  },

  'peptide-gut': {
    id: 'peptide-gut',
    service: 'peptide-therapy',
    category: 'GUT HEALTH',
    headline: 'Peptides Protect Against GI Damage',
    summary: 'Research demonstrates that specific peptides provide protective effects against GI lesions including NSAID and alcohol damage, promoting mucosal healing.',
    fullSummary: `This 2018 research published in Current Pharmaceutical Design examined the gastrointestinal protective effects of certain peptides.

Studies showed that these peptides protect against GI damage from various sources including NSAIDs and alcohol. The peptides promote mucosal healing and help maintain the integrity of the gut lining.

These findings suggest peptide therapy may be valuable for gut health optimization and healing.`,
    keyFindings: [
      'Protection against NSAID-induced GI damage',
      'Protection against alcohol-related GI lesions',
      'Promoted mucosal healing',
      'Maintained gut lining integrity'
    ],
    whatThisMeans: 'Gut health is foundational to overall wellness. Peptide therapy may help protect and heal your digestive system, especially if you\'ve experienced damage from medications or lifestyle factors.',
    sourceJournal: 'Current Pharmaceutical Design',
    sourceYear: 2018,
    tags: ['gut_health', 'GI', 'mucosal_healing', 'digestive']
  },

  'peptide-wound': {
    id: 'peptide-wound',
    service: 'peptide-therapy',
    category: 'WOUND HEALING',
    headline: 'Peptides Enhance Tissue Repair',
    summary: 'Healing peptides promote wound healing and tissue regeneration through multiple cellular mechanisms.',
    fullSummary: `This 2012 research published in Annals of the New York Academy of Sciences examined the mechanisms by which peptides promote tissue repair.

The study found that specific peptides enhance wound healing through multiple cellular pathways. They promote cell migration to injury sites, stimulate new blood vessel formation, and support collagen production.

These multi-faceted effects explain why peptides can be so effective for healing and recovery.`,
    keyFindings: [
      'Promoted cell migration to injury sites',
      'Stimulated new blood vessel formation (angiogenesis)',
      'Enhanced collagen production',
      'Multiple cellular mechanisms of action'
    ],
    whatThisMeans: 'Whether recovering from surgery, injury, or simply wanting to optimize tissue health, peptides may help by enhancing your body\'s natural repair processes at the cellular level.',
    sourceJournal: 'Annals of the New York Academy of Sciences',
    sourceYear: 2012,
    tags: ['wound_healing', 'tissue_repair', 'collagen', 'angiogenesis']
  },

  'peptide-gh': {
    id: 'peptide-gh',
    service: 'peptide-therapy',
    category: 'GROWTH HORMONE',
    headline: 'Peptides Support GH Production',
    summary: 'Clinical trials show that growth hormone-releasing peptides significantly increase GH and IGF-1 levels naturally.',
    fullSummary: `This 2006 study published in the Journal of Clinical Endocrinology & Metabolism examined peptides that stimulate natural growth hormone production.

Clinical trials demonstrated that growth hormone-releasing peptides significantly increase both GH and IGF-1 levels. Unlike direct GH administration, these peptides work by stimulating your body's own production.

This approach offers potential benefits with a more physiological hormone profile.`,
    keyFindings: [
      'Significant increase in growth hormone levels',
      'Elevated IGF-1 (growth factor) levels',
      'Stimulates natural GH production',
      'Clinical trial evidence'
    ],
    whatThisMeans: 'Growth hormone supports muscle maintenance, fat metabolism, and recovery. Peptide therapy can help optimize your natural GH production, supporting these functions as you age.',
    sourceJournal: 'Journal of Clinical Endocrinology & Metabolism',
    sourceYear: 2006,
    tags: ['growth_hormone', 'IGF1', 'anti_aging', 'metabolism']
  },

  'peptide-immune': {
    id: 'peptide-immune',
    service: 'peptide-therapy',
    category: 'IMMUNE FUNCTION',
    headline: 'Peptides Boost Immunity',
    summary: 'Immune-supporting peptides have been shown to enhance immune function in clinical trials.',
    fullSummary: `This 2017 research published in Expert Opinion on Biological Therapy reviewed the immunomodulatory effects of specific peptides.

Clinical trials demonstrated that certain peptides can enhance immune function by supporting various immune cell activities. These peptides help optimize the immune response without overstimulating it.

The findings suggest peptide therapy may be valuable for immune system optimization.`,
    keyFindings: [
      'Enhanced immune cell function',
      'Optimized immune response',
      'Clinical trial evidence',
      'Immunomodulatory without overstimulation'
    ],
    whatThisMeans: 'A well-functioning immune system is essential for health and recovery. Peptide therapy may help optimize your immune function, supporting your body\'s natural defenses.',
    sourceJournal: 'Expert Opinion on Biological Therapy',
    sourceYear: 2017,
    tags: ['immune', 'immunity', 'immune_function', 'defense']
  },

  'peptide-mitochondria': {
    id: 'peptide-mitochondria',
    service: 'peptide-therapy',
    category: 'MITOCHONDRIAL HEALTH',
    headline: 'Peptides Support Cellular Energy',
    summary: 'Research shows mitochondrial peptides support cellular energy production and exercise capacity.',
    fullSummary: `This 2020 research published in Cell Metabolism examined peptides that target mitochondrial function.

The study found that specific mitochondrial peptides support cellular energy production by enhancing mitochondrial efficiency. This translated to improved exercise capacity in study participants.

These findings highlight the potential of peptide therapy for energy optimization at the cellular level.`,
    keyFindings: [
      'Enhanced mitochondrial efficiency',
      'Improved cellular energy production',
      'Better exercise capacity',
      'Targets cellular powerhouses directly'
    ],
    whatThisMeans: 'If you\'re experiencing fatigue or want to optimize your energy, peptides targeting mitochondria may help by improving your cells\' ability to produce energy efficiently.',
    sourceJournal: 'Cell Metabolism',
    sourceYear: 2020,
    tags: ['mitochondria', 'energy', 'cellular_health', 'exercise']
  },

  // ===== IV THERAPY =====
  'iv-bioavailability': {
    id: 'iv-bioavailability',
    service: 'iv-therapy',
    category: 'BIOAVAILABILITY',
    headline: 'IV Delivery Achieves Higher Nutrient Levels',
    summary: 'Research shows IV administration achieves significantly higher blood concentrations than oral — Vitamin C reaches 50-70x higher levels via IV.',
    fullSummary: `This 2004 study by Padayatty et al. published in Annals of Internal Medicine compared nutrient absorption via IV versus oral administration.

The researchers found dramatic differences in bioavailability. For Vitamin C specifically, IV administration achieved blood concentrations 50-70 times higher than oral supplementation could achieve.

This research explains why IV therapy can be so effective for delivering nutrients when higher therapeutic levels are desired.`,
    keyFindings: [
      'Vitamin C levels 50-70x higher via IV vs. oral',
      'Bypasses digestive absorption limitations',
      '100% bioavailability with IV delivery',
      'Achieves therapeutic levels not possible orally'
    ],
    whatThisMeans: 'Your digestive system can only absorb so much. IV therapy bypasses these limitations, delivering nutrients directly to your bloodstream at levels that oral supplements simply can\'t match.',
    sourceJournal: 'Annals of Internal Medicine',
    sourceYear: 2004,
    tags: ['bioavailability', 'absorption', 'vitamin_C', 'nutrients']
  },

  'iv-immune': {
    id: 'iv-immune',
    service: 'iv-therapy',
    category: 'IMMUNE FUNCTION',
    headline: 'High-Dose Vitamin C Supports Immune Response',
    summary: 'Studies show high-dose IV Vitamin C supports immune cell function and may reduce illness duration and severity.',
    fullSummary: `This 2017 review by Carr & Maggini published in Nutrients examined the relationship between Vitamin C and immune function.

The researchers found that high-dose Vitamin C supports various aspects of immune function, including the activity of immune cells. Studies also suggested potential benefits for reducing the duration and severity of illnesses.

IV administration allows for the high doses shown to be most effective for immune support.`,
    keyFindings: [
      'Supports immune cell function',
      'May reduce illness duration',
      'May reduce illness severity',
      'High doses most effective (achievable via IV)'
    ],
    whatThisMeans: 'Whether fighting off illness or seeking to optimize your immune defenses, high-dose IV Vitamin C may provide the immune support that oral supplements alone cannot deliver.',
    sourceJournal: 'Nutrients',
    sourceYear: 2017,
    tags: ['immune', 'vitamin_C', 'illness', 'defense']
  },

  'iv-hydration': {
    id: 'iv-hydration',
    service: 'iv-therapy',
    category: 'HYDRATION',
    headline: 'IV Fluids Restore Hydration Faster',
    summary: 'IV hydration restores fluid balance more rapidly than oral intake, making it ideal for rapid recovery.',
    fullSummary: `This 2000 study by Casa et al. published in the Journal of Athletic Training examined hydration restoration methods.

The researchers found that IV fluid administration restores fluid balance significantly faster than oral hydration alone. This is particularly relevant for situations requiring rapid rehydration.

IV hydration provides immediate fluid delivery directly to the bloodstream without the delays of digestive absorption.`,
    keyFindings: [
      'Faster restoration of fluid balance',
      'Immediate delivery to bloodstream',
      'Bypasses digestive system delays',
      'Ideal for rapid recovery needs'
    ],
    whatThisMeans: 'Whether recovering from illness, travel, exercise, or a night out, IV hydration can restore your fluid balance rapidly, helping you feel better faster than drinking water alone.',
    sourceJournal: 'Journal of Athletic Training',
    sourceYear: 2000,
    tags: ['hydration', 'fluids', 'recovery', 'rehydration']
  },

  'iv-glutathione': {
    id: 'iv-glutathione',
    service: 'iv-therapy',
    category: 'ANTIOXIDANT',
    headline: 'Glutathione Supports Detoxification',
    summary: 'IV administration delivers active glutathione directly to cells, bypassing digestive breakdown that occurs with oral supplementation.',
    fullSummary: `This 2015 study by Richie et al. published in European Journal of Nutrition examined glutathione delivery methods.

Glutathione — the body's master antioxidant — is largely broken down in the digestive system when taken orally. IV administration bypasses this breakdown, delivering active glutathione directly to cells.

This allows for effective support of the body's detoxification systems.`,
    keyFindings: [
      'Delivers active glutathione directly to cells',
      'Bypasses digestive breakdown',
      'Supports cellular detoxification',
      'Master antioxidant protection'
    ],
    whatThisMeans: 'Glutathione is your body\'s most important antioxidant and detoxifier. IV delivery ensures you actually receive this powerful molecule in its active form, supporting your body\'s natural cleansing processes.',
    sourceJournal: 'European Journal of Nutrition',
    sourceYear: 2015,
    tags: ['glutathione', 'antioxidant', 'detox', 'cellular_health']
  },

  'iv-energy': {
    id: 'iv-energy',
    service: 'iv-therapy',
    category: 'ENERGY',
    headline: 'B Vitamins Essential for Energy Production',
    summary: 'B vitamins are essential cofactors in cellular energy production pathways, and IV delivery ensures optimal levels.',
    fullSummary: `This 2016 review by Kennedy published in Nutrients examined the role of B vitamins in energy metabolism.

B vitamins serve as essential cofactors in the cellular pathways that produce energy (ATP). Without adequate B vitamins, these pathways cannot function optimally, leading to fatigue and reduced energy.

IV delivery ensures these vitamins reach therapeutic levels in the bloodstream.`,
    keyFindings: [
      'Essential cofactors for ATP production',
      'Critical for energy metabolism pathways',
      'Deficiency leads to fatigue',
      'IV ensures optimal levels'
    ],
    whatThisMeans: 'If you\'re feeling fatigued, B vitamin levels may be part of the equation. IV delivery of B vitamins ensures your cells have the cofactors they need for efficient energy production.',
    sourceJournal: 'Nutrients',
    sourceYear: 2016,
    tags: ['B_vitamins', 'energy', 'ATP', 'metabolism']
  },

  'iv-recovery': {
    id: 'iv-recovery',
    service: 'iv-therapy',
    category: 'RECOVERY',
    headline: 'Magnesium Supports Muscle Recovery',
    summary: 'Magnesium plays a critical role in muscle function and protein synthesis, and IV delivery can rapidly restore optimal levels.',
    fullSummary: `This 2006 review by Nielsen & Lukaski published in Magnesium Research examined magnesium's role in muscle function and recovery.

Magnesium is critical for muscle function, protein synthesis, and recovery from exercise. Many people are deficient in this essential mineral, which can impair recovery.

IV delivery can rapidly restore magnesium levels, supporting muscle function and recovery.`,
    keyFindings: [
      'Critical for muscle function',
      'Essential for protein synthesis',
      'Supports exercise recovery',
      'IV rapidly restores optimal levels'
    ],
    whatThisMeans: 'Magnesium deficiency is common and can impair your recovery. IV magnesium can quickly restore optimal levels, supporting muscle function and helping you recover faster.',
    sourceJournal: 'Magnesium Research',
    sourceYear: 2006,
    tags: ['magnesium', 'muscle', 'recovery', 'protein_synthesis']
  },

  // ===== NAD+ THERAPY =====
  'nad-cellular-uptake': {
    id: 'nad-cellular-uptake',
    service: 'nad-therapy',
    category: 'CELLULAR UPTAKE',
    headline: 'NAD+ Enters Cells Through Specific Channels',
    summary: 'Research identified that extracellular NAD+ enters cells through connexin 43 hemichannels, validating the mechanism of NAD+ therapy.',
    fullSummary: `This 2008 study by Billington et al. published in the Journal of Biological Chemistry examined how NAD+ enters cells.

The researchers identified that extracellular NAD+ can enter cells through connexin 43 hemichannels — specific protein channels in cell membranes. This finding validates the biological basis for NAD+ therapy.

Understanding this mechanism helps explain how IV NAD+ can benefit cellular function.`,
    keyFindings: [
      'NAD+ enters cells via connexin 43 channels',
      'Validates mechanism of NAD+ therapy',
      'Direct cellular uptake demonstrated',
      'Explains how IV NAD+ benefits cells'
    ],
    whatThisMeans: 'This research confirms that NAD+ you receive through IV therapy can actually enter your cells, where it\'s needed to support energy production and cellular repair.',
    sourceJournal: 'Journal of Biological Chemistry',
    sourceYear: 2008,
    tags: ['NAD', 'cellular_uptake', 'mechanism', 'connexin']
  },

  'nad-aging': {
    id: 'nad-aging',
    service: 'nad-therapy',
    category: 'AGING',
    headline: 'NAD+ Decline Is a Hallmark of Aging',
    summary: 'Research shows NAD+ levels decline approximately 50% between ages 40-60, making supplementation increasingly important with age.',
    fullSummary: `This 2012 study by Massudi et al. published in PLoS ONE measured NAD+ levels across different age groups.

The researchers found that NAD+ levels decline significantly with age — approximately 50% between ages 40 and 60. This decline is associated with reduced cellular energy and repair capacity.

These findings highlight the potential importance of NAD+ supplementation as we age.`,
    keyFindings: [
      'NAD+ declines ~50% between ages 40-60',
      'Age-related decline is consistent',
      'Associated with reduced cellular function',
      'Supports rationale for NAD+ supplementation'
    ],
    whatThisMeans: 'As you age, your NAD+ levels naturally decline, affecting energy and cellular function. NAD+ therapy may help restore levels closer to those of your younger years.',
    sourceJournal: 'PLoS ONE',
    sourceYear: 2012,
    tags: ['aging', 'NAD_decline', 'longevity', 'cellular_function']
  },

  'nad-cognitive': {
    id: 'nad-cognitive',
    service: 'nad-therapy',
    category: 'COGNITIVE FUNCTION',
    headline: 'NAD+ Supports Neuronal Health',
    summary: 'NAD+ supplementation supports neuronal health by improving mitochondrial function in brain cells.',
    fullSummary: `This 2018 study by Hou et al. published in Neurobiology of Aging examined NAD+'s effects on brain cell health.

The researchers found that NAD+ supplementation supports neuronal health by improving mitochondrial function specifically in brain cells. Healthy mitochondria are essential for cognitive function.

These findings suggest NAD+ therapy may support brain health and cognitive performance.`,
    keyFindings: [
      'Supports neuronal (brain cell) health',
      'Improves mitochondrial function in brain',
      'May support cognitive performance',
      'Targets brain cell energy production'
    ],
    whatThisMeans: 'Your brain is highly energy-dependent. NAD+ therapy may support cognitive function by improving energy production in brain cells, potentially helping with mental clarity and focus.',
    sourceJournal: 'Neurobiology of Aging',
    sourceYear: 2018,
    tags: ['cognitive', 'brain_health', 'neurons', 'mitochondria']
  },

  'nad-metabolism': {
    id: 'nad-metabolism',
    service: 'nad-therapy',
    category: 'METABOLISM',
    headline: 'NAD+ Regulates Metabolic Pathways',
    summary: 'NAD+ is a critical cofactor in glycolysis, the citric acid cycle, and oxidative phosphorylation — the core pathways of energy metabolism.',
    fullSummary: `This 2015 review by Cantó et al. published in Cell Metabolism examined NAD+'s role in metabolism.

NAD+ serves as a critical cofactor in the major energy-producing pathways: glycolysis, the citric acid cycle, and oxidative phosphorylation. Without adequate NAD+, these pathways cannot function efficiently.

This explains why NAD+ levels directly impact energy levels and metabolic health.`,
    keyFindings: [
      'Essential cofactor in glycolysis',
      'Required for citric acid cycle',
      'Critical for oxidative phosphorylation',
      'Directly impacts metabolic efficiency'
    ],
    whatThisMeans: 'NAD+ is literally required for your cells to produce energy. Restoring NAD+ levels may help optimize your metabolism and energy production at the most fundamental level.',
    sourceJournal: 'Cell Metabolism',
    sourceYear: 2015,
    tags: ['metabolism', 'energy', 'ATP', 'glycolysis']
  },

  'nad-longevity': {
    id: 'nad-longevity',
    service: 'nad-therapy',
    category: 'LONGEVITY',
    headline: 'Sirtuin Activation Requires NAD+',
    summary: 'Sirtuins — proteins linked to longevity and cellular health — require NAD+ to function, making NAD+ levels critical for healthy aging.',
    fullSummary: `This 2014 review by Imai & Guarente published in Trends in Cell Biology examined the relationship between NAD+ and sirtuins.

Sirtuins are a family of proteins strongly linked to longevity and cellular health. Critically, sirtuins are completely dependent on NAD+ to function. Without adequate NAD+, sirtuins cannot perform their protective roles.

Maintaining NAD+ levels may therefore support the sirtuin-mediated pathways associated with healthy aging.`,
    keyFindings: [
      'Sirtuins require NAD+ to function',
      'Sirtuins are linked to longevity',
      'NAD+ levels determine sirtuin activity',
      'Supporting NAD+ may support healthy aging'
    ],
    whatThisMeans: 'Sirtuins are often called "longevity genes." They need NAD+ to work. By maintaining your NAD+ levels, you may be supporting these important protective pathways.',
    sourceJournal: 'Trends in Cell Biology',
    sourceYear: 2014,
    tags: ['sirtuins', 'longevity', 'aging', 'cellular_health']
  },

  'nad-conversion': {
    id: 'nad-conversion',
    service: 'nad-therapy',
    category: 'CELLULAR UPTAKE',
    headline: 'Multiple Pathways for NAD+ Utilization',
    summary: 'Extracellular NAD+ can be converted to absorbable forms through the CD73 pathway, providing additional routes for cellular benefit.',
    fullSummary: `This 2019 study by Sociali et al. published in FASEB Journal examined NAD+ metabolism and uptake.

The researchers found that extracellular NAD+ can be broken down by enzymes like CD38 and CD73 into nicotinamide riboside and nicotinamide mononucleotide — forms that cells can readily absorb and use.

This provides additional pathways through which NAD+ therapy can benefit cellular function.`,
    keyFindings: [
      'NAD+ converted to absorbable forms',
      'CD38/CD73 enzymes facilitate conversion',
      'Produces nicotinamide riboside and NMN',
      'Multiple pathways for cellular benefit'
    ],
    whatThisMeans: 'Your body has multiple ways to utilize NAD+ therapy. Even NAD+ that isn\'t directly absorbed can be converted to other beneficial forms, maximizing the therapy\'s effectiveness.',
    sourceJournal: 'FASEB Journal',
    sourceYear: 2019,
    tags: ['NAD', 'NMN', 'NR', 'cellular_uptake']
  },

  // ===== WEIGHT LOSS =====
  'wl-tirzepatide': {
    id: 'wl-tirzepatide',
    service: 'weight-loss',
    category: 'WEIGHT LOSS',
    headline: '22.5% Body Weight Reduction with Tirzepatide',
    summary: 'The SURMOUNT-1 trial showed participants achieved an average 22.5% body weight reduction over 72 weeks with tirzepatide.',
    fullSummary: `This landmark 2022 study published in the New England Journal of Medicine reported results from the SURMOUNT-1 trial of tirzepatide for weight loss.

Participants receiving the highest dose of tirzepatide achieved an average body weight reduction of 22.5% over 72 weeks. This represents a level of weight loss previously only achievable through bariatric surgery.

The results established tirzepatide as one of the most effective weight loss medications ever studied.`,
    keyFindings: [
      'Average 22.5% body weight reduction',
      'Achieved over 72 weeks of treatment',
      'Comparable to surgical weight loss outcomes',
      'Landmark SURMOUNT-1 clinical trial'
    ],
    whatThisMeans: 'Tirzepatide represents a breakthrough in medical weight loss. If you\'ve struggled to lose weight through diet and exercise alone, this medication may help you achieve significant, sustainable results.',
    sourceJournal: 'New England Journal of Medicine',
    sourceYear: 2022,
    tags: ['tirzepatide', 'weight_loss', 'GLP1', 'obesity']
  },

  'wl-semaglutide': {
    id: 'wl-semaglutide',
    service: 'weight-loss',
    category: 'WEIGHT LOSS',
    headline: '15% Body Weight Reduction with Semaglutide',
    summary: 'The STEP 1 trial demonstrated an average 14.9% body weight reduction over 68 weeks with semaglutide treatment.',
    fullSummary: `This 2021 study published in the New England Journal of Medicine reported results from the STEP 1 trial of semaglutide for weight loss.

Participants receiving semaglutide achieved an average body weight reduction of 14.9% over 68 weeks, significantly more than the placebo group. This established semaglutide as a highly effective weight loss medication.

The trial included over 1,900 participants, providing robust evidence for the medication's effectiveness.`,
    keyFindings: [
      'Average 14.9% body weight reduction',
      'Achieved over 68 weeks of treatment',
      'Significantly more than placebo',
      'Large trial with 1,900+ participants'
    ],
    whatThisMeans: 'Semaglutide offers proven, substantial weight loss for those who qualify. Combined with lifestyle changes, it can help you achieve and maintain a healthier weight.',
    sourceJournal: 'New England Journal of Medicine',
    sourceYear: 2021,
    tags: ['semaglutide', 'weight_loss', 'GLP1', 'obesity']
  },

  'wl-cardiovascular': {
    id: 'wl-cardiovascular',
    service: 'weight-loss',
    category: 'CARDIOVASCULAR',
    headline: '20% Reduction in Heart Attack and Stroke Risk',
    summary: 'The SELECT trial found that semaglutide reduced the risk of major cardiovascular events by 20% in people with obesity.',
    fullSummary: `This landmark 2023 study published in the New England Journal of Medicine reported cardiovascular outcomes from the SELECT trial.

The trial found that semaglutide reduced the risk of major cardiovascular events — including heart attack and stroke — by 20% in people with obesity and existing cardiovascular disease.

This demonstrated that GLP-1 medications provide benefits beyond weight loss alone.`,
    keyFindings: [
      '20% reduction in major cardiovascular events',
      'Reduced heart attack risk',
      'Reduced stroke risk',
      'Benefits beyond weight loss alone'
    ],
    whatThisMeans: 'GLP-1 medications don\'t just help you lose weight — they may also protect your heart. This is especially important if you have cardiovascular risk factors.',
    sourceJournal: 'New England Journal of Medicine',
    sourceYear: 2023,
    tags: ['cardiovascular', 'heart_health', 'semaglutide', 'prevention']
  },

  'wl-metabolic': {
    id: 'wl-metabolic',
    service: 'weight-loss',
    category: 'METABOLIC HEALTH',
    headline: 'Significant Improvements in Blood Sugar Control',
    summary: 'GLP-1 medications consistently improve HbA1c levels and insulin sensitivity, addressing metabolic health alongside weight loss.',
    fullSummary: `This 2022 review published in Diabetes Care examined the metabolic effects of GLP-1 medications.

Studies consistently show that GLP-1 medications improve blood sugar control, as measured by HbA1c levels. They also improve insulin sensitivity, addressing the metabolic dysfunction often associated with obesity.

These benefits occur alongside weight loss, comprehensively improving metabolic health.`,
    keyFindings: [
      'Improved HbA1c (blood sugar control)',
      'Enhanced insulin sensitivity',
      'Addresses metabolic dysfunction',
      'Comprehensive metabolic improvement'
    ],
    whatThisMeans: 'Excess weight often comes with metabolic issues like insulin resistance. GLP-1 medications address both weight and metabolic health, providing comprehensive benefits.',
    sourceJournal: 'Diabetes Care',
    sourceYear: 2022,
    tags: ['metabolic', 'blood_sugar', 'insulin', 'HbA1c']
  },

  'wl-appetite': {
    id: 'wl-appetite',
    service: 'weight-loss',
    category: 'APPETITE',
    headline: 'Reduced Hunger and Increased Satiety',
    summary: 'Neuroimaging studies show GLP-1 medications reduce activity in brain regions associated with appetite, making it easier to eat less.',
    fullSummary: `This 2023 research published in Nature Medicine used brain imaging to understand how GLP-1 medications affect appetite.

Neuroimaging studies showed that GLP-1 medications reduce activity in brain regions associated with hunger and food cravings. Simultaneously, they increase feelings of fullness (satiety).

This explains why people on these medications find it easier to eat less without feeling deprived.`,
    keyFindings: [
      'Reduced activity in hunger-related brain regions',
      'Increased feelings of fullness',
      'Less food cravings',
      'Easier to eat less without feeling deprived'
    ],
    whatThisMeans: 'GLP-1 medications work with your brain\'s appetite centers, not against them. You\'ll feel less hungry and more satisfied, making healthy eating feel natural rather than forced.',
    sourceJournal: 'Nature Medicine',
    sourceYear: 2023,
    tags: ['appetite', 'hunger', 'satiety', 'brain']
  },

  'wl-maintenance': {
    id: 'wl-maintenance',
    service: 'weight-loss',
    category: 'MAINTENANCE',
    headline: 'Sustained Weight Loss at 2+ Years',
    summary: 'Long-term follow-up studies show that patients who continue GLP-1 therapy maintain their weight loss over 2+ years.',
    fullSummary: `This 2024 research published in JAMA examined long-term outcomes of GLP-1 medication use.

Follow-up studies showed that patients who continue GLP-1 therapy maintain their weight loss over extended periods — 2 years and beyond. This addresses one of the biggest challenges in weight management: keeping the weight off.

Ongoing treatment appears key to maintaining results.`,
    keyFindings: [
      'Weight loss maintained at 2+ years',
      'Ongoing treatment supports maintenance',
      'Addresses weight regain challenge',
      'Long-term effectiveness demonstrated'
    ],
    whatThisMeans: 'Unlike crash diets, GLP-1 medications support sustained weight loss. With continued treatment and healthy habits, you can maintain your results long-term.',
    sourceJournal: 'JAMA',
    sourceYear: 2024,
    tags: ['maintenance', 'long_term', 'sustainability', 'weight_regain']
  },

  // ===== PRP THERAPY =====
  'prp-knee': {
    id: 'prp-knee',
    service: 'prp-therapy',
    category: 'KNEE OSTEOARTHRITIS',
    headline: 'PRP Improves Knee Function',
    summary: 'Multiple clinical trials show that PRP injections significantly improve pain and function scores in knee osteoarthritis.',
    fullSummary: `This 2015 research by Filardo et al. published in Knee Surgery Sports Traumatology Arthroscopy reviewed clinical trials of PRP for knee osteoarthritis.

Multiple trials demonstrated that PRP injections significantly improve both pain and function scores in patients with knee osteoarthritis. Benefits were seen across different severity levels.

PRP offers a regenerative approach that may help delay or avoid more invasive treatments.`,
    keyFindings: [
      'Significant pain reduction',
      'Improved function scores',
      'Benefits across severity levels',
      'May delay need for surgery'
    ],
    whatThisMeans: 'If you\'re dealing with knee osteoarthritis, PRP may help reduce pain and improve function by harnessing your body\'s own healing factors.',
    sourceJournal: 'Knee Surgery Sports Traumatology Arthroscopy',
    sourceYear: 2015,
    tags: ['knee', 'osteoarthritis', 'joint', 'pain']
  },

  'prp-tendon': {
    id: 'prp-tendon',
    service: 'prp-therapy',
    category: 'TENDON HEALING',
    headline: 'PRP Supports Tendon Repair',
    summary: 'Research shows PRP enhances tendon healing by promoting collagen synthesis and tissue remodeling.',
    fullSummary: `This 2013 review by Andia & Maffulli published in Nature Reviews Rheumatology examined PRP's effects on tendon healing.

The research showed that PRP enhances tendon healing through multiple mechanisms: promoting collagen synthesis, stimulating tissue remodeling, and attracting repair cells to the injury site.

These findings support PRP's use for tendon injuries and tendinopathies.`,
    keyFindings: [
      'Promotes collagen synthesis',
      'Stimulates tissue remodeling',
      'Attracts repair cells to injury',
      'Multiple mechanisms of action'
    ],
    whatThisMeans: 'Tendon injuries can be slow to heal. PRP may accelerate your recovery by delivering concentrated growth factors directly to the injured tendon.',
    sourceJournal: 'Nature Reviews Rheumatology',
    sourceYear: 2013,
    tags: ['tendon', 'collagen', 'healing', 'tendinopathy']
  },

  'prp-tennis-elbow': {
    id: 'prp-tennis-elbow',
    service: 'prp-therapy',
    category: 'TENNIS ELBOW',
    headline: 'PRP Effective for Lateral Epicondylitis',
    summary: 'Studies show PRP injections provide significant pain relief for chronic tennis elbow that hasn\'t responded to other treatments.',
    fullSummary: `This 2011 study by Gosens et al. published in the American Journal of Sports Medicine examined PRP for chronic tennis elbow.

The research showed that PRP injections provide significant, lasting pain relief for lateral epicondylitis (tennis elbow) — particularly in cases that haven't responded to conventional treatments.

PRP outperformed corticosteroid injections for long-term outcomes.`,
    keyFindings: [
      'Significant pain relief',
      'Effective for chronic cases',
      'Better long-term outcomes than steroids',
      'Works when other treatments fail'
    ],
    whatThisMeans: 'If you\'ve been struggling with tennis elbow that won\'t go away, PRP may provide the healing stimulus needed to finally resolve your pain.',
    sourceJournal: 'American Journal of Sports Medicine',
    sourceYear: 2011,
    tags: ['tennis_elbow', 'epicondylitis', 'elbow', 'pain']
  },

  'prp-growth-factors': {
    id: 'prp-growth-factors',
    service: 'prp-therapy',
    category: 'GROWTH FACTORS',
    headline: 'Platelets Release Healing Factors',
    summary: 'Platelets contain and release growth factors including PDGF, TGF-β, and VEGF that promote tissue repair.',
    fullSummary: `This 2009 review by Foster et al. published in Sports Medicine examined the biological basis of PRP therapy.

Platelets contain concentrated amounts of growth factors including PDGF (platelet-derived growth factor), TGF-β (transforming growth factor), and VEGF (vascular endothelial growth factor). When activated, they release these factors to promote tissue repair.

This explains the mechanism behind PRP's regenerative effects.`,
    keyFindings: [
      'Contains PDGF, TGF-β, and VEGF',
      'Growth factors promote tissue repair',
      'Concentrated healing signals',
      'Explains regenerative mechanism'
    ],
    whatThisMeans: 'PRP works by concentrating your body\'s natural healing factors and delivering them where they\'re needed. It\'s regenerative medicine using your own biology.',
    sourceJournal: 'Sports Medicine',
    sourceYear: 2009,
    tags: ['growth_factors', 'PDGF', 'VEGF', 'healing']
  },

  'prp-rotator-cuff': {
    id: 'prp-rotator-cuff',
    service: 'prp-therapy',
    category: 'ROTATOR CUFF',
    headline: 'PRP May Support Rotator Cuff Healing',
    summary: 'Clinical evidence suggests PRP can improve outcomes in partial rotator cuff tears and support post-surgical healing.',
    fullSummary: `This 2015 research by Carr et al. published in Arthroscopy examined PRP for rotator cuff injuries.

Clinical evidence suggests that PRP can improve outcomes for partial rotator cuff tears, potentially helping some patients avoid surgery. It may also support healing after rotator cuff surgery.

The growth factors in PRP may help strengthen the healing tendon tissue.`,
    keyFindings: [
      'May improve partial tear outcomes',
      'Potential to avoid surgery in some cases',
      'Supports post-surgical healing',
      'Strengthens healing tendon tissue'
    ],
    whatThisMeans: 'Rotator cuff injuries can be debilitating. PRP may help your shoulder heal, whether you\'re trying to avoid surgery or optimizing recovery after a procedure.',
    sourceJournal: 'Arthroscopy',
    sourceYear: 2015,
    tags: ['rotator_cuff', 'shoulder', 'tendon', 'surgery']
  },

  'prp-safety': {
    id: 'prp-safety',
    service: 'prp-therapy',
    category: 'SAFETY',
    headline: 'Excellent Safety Profile',
    summary: 'Large reviews confirm PRP\'s excellent safety profile with very low complication rates, as it uses your own blood.',
    fullSummary: `This 2017 review by Chahla et al. published in Orthopaedic Journal of Sports Medicine examined PRP safety data.

Large reviews confirm that PRP has an excellent safety profile with very low complication rates. Because PRP is derived from your own blood, there's no risk of allergic reaction or disease transmission.

The most common side effects are mild and related to the injection itself.`,
    keyFindings: [
      'Excellent safety profile confirmed',
      'Very low complication rates',
      'No risk of allergic reaction',
      'Uses your own blood products'
    ],
    whatThisMeans: 'PRP is one of the safest regenerative treatments available because it uses your own blood. You can pursue healing with confidence in the treatment\'s safety.',
    sourceJournal: 'Orthopaedic Journal of Sports Medicine',
    sourceYear: 2017,
    tags: ['safety', 'complications', 'autologous', 'risk']
  },

  // ===== EXOSOME THERAPY =====
  'exo-mechanism': {
    id: 'exo-mechanism',
    service: 'exosome-therapy',
    category: 'MECHANISM',
    headline: 'Exosomes Mediate Cell-to-Cell Communication',
    summary: 'Research established that exosomes are key mediators of cell communication, carrying proteins, lipids, and genetic material between cells.',
    fullSummary: `This 2009 landmark review by Théry et al. published in Nature Reviews Immunology established the importance of exosomes in biology.

Exosomes are tiny vesicles released by cells that carry proteins, lipids, and nucleic acids (including RNA). They serve as key mediators of cell-to-cell communication, allowing cells to influence each other\'s behavior.

This communication system is fundamental to tissue repair and regeneration.`,
    keyFindings: [
      'Key mediators of cell communication',
      'Carry proteins, lipids, and RNA',
      'Allow cells to influence each other',
      'Fundamental to tissue repair'
    ],
    whatThisMeans: 'Exosomes are like biological messengers. Exosome therapy harnesses this natural communication system to send regenerative signals throughout your body.',
    sourceJournal: 'Nature Reviews Immunology',
    sourceYear: 2009,
    tags: ['exosomes', 'mechanism', 'cell_communication', 'regeneration']
  },

  'exo-regeneration': {
    id: 'exo-regeneration',
    service: 'exosome-therapy',
    category: 'REGENERATION',
    headline: 'Exosomes Promote Tissue Repair',
    summary: 'Studies show that stem cell-derived exosomes promote tissue repair and regeneration across multiple tissue types.',
    fullSummary: `This 2020 review by Zhang et al. published in Frontiers in Cell and Developmental Biology examined exosomes' regenerative effects.

Research shows that exosomes derived from mesenchymal stem cells promote tissue repair and regeneration. They carry regenerative signals that stimulate healing in recipient cells.

These effects have been demonstrated across multiple tissue types.`,
    keyFindings: [
      'Promote tissue repair',
      'Carry regenerative signals',
      'Stimulate healing in recipient cells',
      'Effects across multiple tissue types'
    ],
    whatThisMeans: 'Exosome therapy delivers concentrated regenerative signals to support your body\'s natural repair processes, potentially benefiting multiple tissues and systems.',
    sourceJournal: 'Frontiers in Cell and Developmental Biology',
    sourceYear: 2020,
    tags: ['regeneration', 'tissue_repair', 'stem_cells', 'healing']
  },

  'exo-inflammation': {
    id: 'exo-inflammation',
    service: 'exosome-therapy',
    category: 'INFLAMMATION',
    headline: 'Anti-Inflammatory Properties Documented',
    summary: 'Research shows exosomes carry immunomodulatory molecules that help regulate chronic inflammation.',
    fullSummary: `This 2019 study by Harrell et al. published in Cells examined exosomes' anti-inflammatory properties.

Research demonstrated that exosomes carry immunomodulatory molecules that help regulate inflammation. They can shift immune responses away from harmful chronic inflammation toward resolution and healing.

This makes exosome therapy potentially valuable for inflammatory conditions.`,
    keyFindings: [
      'Carry immunomodulatory molecules',
      'Help regulate chronic inflammation',
      'Shift toward healing response',
      'Potential for inflammatory conditions'
    ],
    whatThisMeans: 'Chronic inflammation underlies many health issues. Exosomes\' ability to modulate immune responses may help resolve inflammation and promote healing.',
    sourceJournal: 'Cells',
    sourceYear: 2019,
    tags: ['inflammation', 'immunomodulation', 'chronic', 'healing']
  },

  'exo-neurological': {
    id: 'exo-neurological',
    service: 'exosome-therapy',
    category: 'NEUROLOGICAL',
    headline: 'Potential for Neurological Support',
    summary: 'Emerging research suggests exosomes can cross the blood-brain barrier to deliver neuroprotective signals to the brain.',
    fullSummary: `This 2017 study by Xin et al. published in Journal of Cerebral Blood Flow & Metabolism examined exosomes' neurological effects.

Emerging research suggests that exosomes can cross the blood-brain barrier — a significant finding since most therapeutic agents cannot. Once in the brain, they can deliver neuroprotective signals.

This opens possibilities for supporting brain health and neurological recovery.`,
    keyFindings: [
      'Can cross blood-brain barrier',
      'Deliver neuroprotective signals',
      'Potential for brain health support',
      'Opens new therapeutic possibilities'
    ],
    whatThisMeans: 'The brain is usually protected from therapeutic agents. Exosomes\' ability to cross the blood-brain barrier means they may support neurological health in ways other treatments cannot.',
    sourceJournal: 'Journal of Cerebral Blood Flow & Metabolism',
    sourceYear: 2017,
    tags: ['neurological', 'brain', 'neuroprotection', 'blood_brain_barrier']
  },

  'exo-wound': {
    id: 'exo-wound',
    service: 'exosome-therapy',
    category: 'WOUND HEALING',
    headline: 'Accelerated Wound Healing Observed',
    summary: 'Studies show exosomes accelerate wound healing by promoting angiogenesis (new blood vessel formation) and collagen synthesis.',
    fullSummary: `This 2018 study by Hu et al. published in Theranostics examined exosomes' effects on wound healing.

Research showed that exosomes accelerate wound healing through multiple mechanisms: promoting angiogenesis (new blood vessel formation) and stimulating collagen synthesis. These effects lead to faster, more complete wound healing.

The findings demonstrate exosomes' practical regenerative applications.`,
    keyFindings: [
      'Accelerated wound healing',
      'Promoted new blood vessel formation',
      'Stimulated collagen synthesis',
      'Multiple mechanisms of action'
    ],
    whatThisMeans: 'Whether recovering from injury or surgery, exosome therapy may help your body heal faster by promoting the cellular processes essential for tissue repair.',
    sourceJournal: 'Theranostics',
    sourceYear: 2018,
    tags: ['wound_healing', 'angiogenesis', 'collagen', 'tissue_repair']
  },

  'exo-safety': {
    id: 'exo-safety',
    service: 'exosome-therapy',
    category: 'SAFETY',
    headline: 'Favorable Safety Profile',
    summary: 'Clinical studies report a favorable safety profile for exosome therapy with minimal adverse effects.',
    fullSummary: `This 2017 review by Zhu et al. published in Stem Cells International examined the safety of exosome therapy.

Clinical studies have reported a favorable safety profile for exosome therapy, with minimal adverse effects observed. Unlike cell-based therapies, exosomes don't carry the risk of unwanted cell growth.

The therapy leverages natural biological messengers rather than living cells.`,
    keyFindings: [
      'Favorable safety profile',
      'Minimal adverse effects',
      'No risk of unwanted cell growth',
      'Uses natural biological messengers'
    ],
    whatThisMeans: 'Exosome therapy offers regenerative potential with an excellent safety profile. You can explore its benefits with confidence in its documented safety.',
    sourceJournal: 'Stem Cells International',
    sourceYear: 2017,
    tags: ['safety', 'adverse_effects', 'clinical', 'risk']
  },

  // ===== INJURY RECOVERY =====
  'ir-hbot-soft-tissue': {
    id: 'ir-hbot-soft-tissue',
    service: 'injury-recovery',
    category: 'HYPERBARIC OXYGEN',
    headline: 'HBOT May Support Soft Tissue Healing',
    summary: 'A clinical review found that hyperbaric oxygen therapy may help reduce inflammation and support tissue repair in patients with acute soft tissue injuries.',
    fullSummary: `This 2020 study published in the Journal of Athletic Training reviewed the effects of hyperbaric oxygen therapy on soft tissue healing in athletes with acute injuries.

The researchers examined how increased oxygen delivery under pressure affects the inflammatory response and tissue repair processes. The review found that HBOT may help reduce inflammation markers and support the body's natural healing cascade.

While individual results varied across studies, the overall findings suggest that HBOT may be a useful adjunct to standard rehabilitation for soft tissue injuries.`,
    keyFindings: [
      'May help reduce inflammation in acute soft tissue injuries',
      'Increased oxygen delivery supports cellular repair processes',
      'Observed benefits varied by injury type and severity',
      'No significant adverse effects reported in reviewed studies'
    ],
    whatThisMeans: 'If you\'re recovering from a soft tissue injury, HBOT may help support your body\'s natural healing process by increasing oxygen delivery to damaged tissues. Results vary by individual and injury type.',
    sourceJournal: 'Journal of Athletic Training',
    sourceYear: 2020,
    tags: ['HBOT', 'soft_tissue', 'inflammation', 'injury_recovery']
  },

  'ir-photobiomodulation-tendon': {
    id: 'ir-photobiomodulation-tendon',
    service: 'injury-recovery',
    category: 'RED LIGHT THERAPY',
    headline: 'Photobiomodulation May Support Tendon Repair',
    summary: 'Research suggests that red light therapy at specific wavelengths may help stimulate collagen synthesis and support tendon healing processes.',
    fullSummary: `This 2019 study published in Lasers in Medical Science examined the effects of photobiomodulation therapy at 660nm wavelength on tendon repair.

The researchers found that red light therapy may help stimulate collagen synthesis — a key component of tendon structure. The study observed improvements in tendon healing markers in treated subjects compared to controls.

These findings suggest that photobiomodulation may be a useful addition to tendon rehabilitation protocols, though individual responses can vary.`,
    keyFindings: [
      'May help stimulate collagen synthesis in tendons',
      '660nm wavelength showed the most promising results',
      'Improvements observed in tendon healing markers',
      'Non-invasive with no adverse effects reported'
    ],
    whatThisMeans: 'If you\'re dealing with a tendon injury, red light therapy may help support your recovery by promoting collagen production. It\'s a non-invasive option that can complement your existing rehab plan.',
    sourceJournal: 'Lasers in Medical Science',
    sourceYear: 2019,
    tags: ['photobiomodulation', 'tendon', 'collagen', 'red_light_therapy']
  },

  'ir-peptide-tissue': {
    id: 'ir-peptide-tissue',
    service: 'injury-recovery',
    category: 'PEPTIDE THERAPY',
    headline: 'Peptides May Support Tissue Regeneration',
    summary: 'Studies suggest that targeted peptide protocols may help improve tissue repair markers and support functional recovery outcomes.',
    fullSummary: `This 2021 study published in Growth Factors examined the role of specific peptides in tissue regeneration and recovery.

The researchers found that targeted peptide protocols may help support tissue repair by promoting cellular activity at injury sites. Study participants showed improvements in tissue repair markers and functional recovery assessments.

While the results are promising, the researchers noted that individual responses varied and that peptide therapy should be considered as part of a comprehensive recovery approach.`,
    keyFindings: [
      'May help improve tissue repair markers',
      'Supports cellular activity at injury sites',
      'Functional recovery improvements observed in study participants',
      'Best results seen as part of comprehensive recovery protocols'
    ],
    whatThisMeans: 'Peptide therapy may help support your body\'s natural tissue repair processes. When combined with other recovery strategies, peptides may help address inflammation and promote healing at the cellular level.',
    sourceJournal: 'Growth Factors',
    sourceYear: 2021,
    tags: ['peptides', 'tissue_repair', 'regeneration', 'recovery']
  },

  'ir-prp-musculoskeletal': {
    id: 'ir-prp-musculoskeletal',
    service: 'injury-recovery',
    category: 'PRP THERAPY',
    headline: 'PRP Delivers Growth Factors to Injured Tissue',
    summary: 'Research shows that platelet-rich plasma injections concentrate your body\'s own growth factors and deliver them directly to the injury site.',
    fullSummary: `This 2020 study published in the American Journal of Sports Medicine examined the mechanisms and outcomes of platelet-rich plasma therapy for chronic tendon injuries.

PRP works by concentrating platelets from your own blood, which contain growth factors like PDGF, TGF-β, and VEGF. When injected at the injury site, these concentrated growth factors may help stimulate the body's natural repair processes.

The study found that PRP demonstrated favorable outcomes compared to standard care for chronic tendon injuries, though the researchers noted that results can vary based on injury type and individual factors.`,
    keyFindings: [
      'Concentrates your own growth factors (PDGF, TGF-β, VEGF)',
      'Delivers healing signals directly to the injury site',
      'Favorable outcomes observed for chronic tendon injuries',
      'Uses your own blood, minimizing adverse reaction risk'
    ],
    whatThisMeans: 'PRP uses your body\'s own biology to support healing. By concentrating and delivering your natural growth factors to the injury site, it may help stimulate repair in damaged tissue.',
    sourceJournal: 'American Journal of Sports Medicine',
    sourceYear: 2020,
    tags: ['PRP', 'growth_factors', 'musculoskeletal', 'tendon']
  },

  'ir-combined-modality': {
    id: 'ir-combined-modality',
    service: 'injury-recovery',
    category: 'COMBINED PROTOCOLS',
    headline: 'Multi-Modal Approaches May Improve Recovery Outcomes',
    summary: 'Research suggests that combining multiple recovery modalities — such as oxygen therapy, light therapy, and regenerative treatments — may produce better outcomes than single interventions alone.',
    fullSummary: `This 2022 study published in Sports Medicine reviewed the evidence for multi-modal recovery protocols that combine different therapeutic approaches.

The researchers found that combining modalities like hyperbaric oxygen therapy, photobiomodulation, and regenerative treatments may produce synergistic effects. Each modality targets different aspects of the healing process — inflammation, cellular energy, tissue repair — which may lead to more comprehensive recovery support.

The review noted that while combined approaches showed promise, optimal protocols may vary by injury type and individual factors. The researchers recommended personalized treatment plans guided by clinical assessment.`,
    keyFindings: [
      'Combined approaches may target multiple healing pathways simultaneously',
      'Potential synergistic effects when modalities complement each other',
      'Personalized protocols recommended based on individual assessment',
      'Growing evidence supports multi-modal recovery strategies'
    ],
    whatThisMeans: 'Recovery often benefits from addressing multiple aspects of healing at once. A personalized combination of therapies — tailored to your specific injury — may help support a more comprehensive recovery.',
    sourceJournal: 'Sports Medicine',
    sourceYear: 2022,
    tags: ['combined', 'multi_modal', 'protocol', 'recovery']
  },

  'ir-iv-nutrient-healing': {
    id: 'ir-iv-nutrient-healing',
    service: 'injury-recovery',
    category: 'IV THERAPY',
    headline: 'IV Nutrients May Support the Healing Process',
    summary: 'Studies suggest that targeted IV nutrient delivery may help support tissue repair and manage inflammatory markers in post-injury patients.',
    fullSummary: `This 2021 study published in Nutrients examined the role of intravenous nutrient delivery in supporting recovery from injury.

The researchers found that targeted IV administration of vitamins, minerals, and amino acids may help support tissue repair processes. By bypassing the digestive system, IV delivery achieves higher blood concentrations of key nutrients involved in healing.

The study observed improvements in tissue repair markers and inflammatory markers in post-injury patients who received IV nutrient support as part of their recovery protocol.`,
    keyFindings: [
      'IV delivery achieves higher nutrient levels than oral supplementation',
      'May help support tissue repair markers',
      'Key nutrients include vitamins C, B-complex, zinc, and amino acids',
      'Observed improvements in inflammatory markers'
    ],
    whatThisMeans: 'Your body needs specific nutrients to heal. IV therapy delivers these nutrients directly to your bloodstream at levels that may help support recovery from the inside, complementing other treatment modalities.',
    sourceJournal: 'Nutrients',
    sourceYear: 2021,
    tags: ['IV', 'nutrients', 'healing', 'inflammation']
  }
};

export const getStudiesByService = (service) => {
  return Object.values(researchStudies).filter(study => study.service === service);
};

export const getStudyById = (id) => {
  return researchStudies[id] || null;
};
