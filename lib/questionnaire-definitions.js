// lib/questionnaire-definitions.js
// Validated clinical questionnaire definitions for baseline assessments
// Door 1: Injury/Peptide (3 questions)
// Door 2: Energy/Optimization (PHQ-9, GAD-7, PSQI, modality branches)

// ─── Standard frequency scale used by PHQ-9 and GAD-7 ───
const FREQUENCY_OPTIONS = [
  { value: 0, label: 'Not at all' },
  { value: 1, label: 'Several days' },
  { value: 2, label: 'More than half the days' },
  { value: 3, label: 'Nearly every day' },
];

// ═══════════════════════════════════════════════════════════
// DOOR 1 — Injury / Peptide Baseline
// ═══════════════════════════════════════════════════════════
export const DOOR1_SECTIONS = [
  {
    id: 'injury_baseline',
    title: 'Injury Baseline',
    subtitle: 'Help us understand where you are right now.',
    questions: [
      {
        id: 'pain_severity',
        text: 'Rate your current pain level',
        type: 'slider',
        min: 0,
        max: 10,
        minLabel: 'No pain',
        maxLabel: 'Worst pain imaginable',
        defaultValue: 5,
      },
      {
        id: 'functional_limitation',
        text: 'How much is this limiting your daily life?',
        type: 'slider',
        min: 0,
        max: 10,
        minLabel: 'Not at all',
        maxLabel: 'Completely limiting',
        defaultValue: 5,
      },
      {
        id: 'trajectory',
        text: 'Is your condition currently...',
        type: 'single_select',
        options: [
          { value: 'getting_better', label: 'Getting better' },
          { value: 'staying_same', label: 'Staying the same' },
          { value: 'getting_worse', label: 'Getting worse' },
        ],
      },
    ],
  },
];

// ═══════════════════════════════════════════════════════════
// DOOR 2 — Energy & Optimization Baseline
// ═══════════════════════════════════════════════════════════

// ─── PHQ-9 (Patient Health Questionnaire) ───
const PHQ9 = {
  id: 'phq9',
  title: 'Mood Assessment',
  subtitle: 'Over the last 2 weeks, how often have you been bothered by any of the following problems?',
  scoreable: true,
  maxScore: 27,
  questions: [
    { id: 'phq9_1', text: 'Little interest or pleasure in doing things', type: 'frequency', options: FREQUENCY_OPTIONS },
    { id: 'phq9_2', text: 'Feeling down, depressed, or hopeless', type: 'frequency', options: FREQUENCY_OPTIONS },
    { id: 'phq9_3', text: 'Trouble falling or staying asleep, or sleeping too much', type: 'frequency', options: FREQUENCY_OPTIONS },
    { id: 'phq9_4', text: 'Feeling tired or having little energy', type: 'frequency', options: FREQUENCY_OPTIONS },
    { id: 'phq9_5', text: 'Poor appetite or overeating', type: 'frequency', options: FREQUENCY_OPTIONS },
    { id: 'phq9_6', text: 'Feeling bad about yourself — or that you are a failure or have let yourself or your family down', type: 'frequency', options: FREQUENCY_OPTIONS },
    { id: 'phq9_7', text: 'Trouble concentrating on things, such as reading the newspaper or watching television', type: 'frequency', options: FREQUENCY_OPTIONS },
    { id: 'phq9_8', text: 'Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual', type: 'frequency', options: FREQUENCY_OPTIONS },
    { id: 'phq9_9', text: 'Thoughts that you would be better off dead, or of hurting yourself in some way', type: 'frequency', options: FREQUENCY_OPTIONS },
  ],
};

// ─── GAD-7 (Generalized Anxiety Disorder) ───
const GAD7 = {
  id: 'gad7',
  title: 'Anxiety Assessment',
  subtitle: 'Over the last 2 weeks, how often have you been bothered by the following problems?',
  scoreable: true,
  maxScore: 21,
  questions: [
    { id: 'gad7_1', text: 'Feeling nervous, anxious, or on edge', type: 'frequency', options: FREQUENCY_OPTIONS },
    { id: 'gad7_2', text: 'Not being able to stop or control worrying', type: 'frequency', options: FREQUENCY_OPTIONS },
    { id: 'gad7_3', text: 'Worrying too much about different things', type: 'frequency', options: FREQUENCY_OPTIONS },
    { id: 'gad7_4', text: 'Trouble relaxing', type: 'frequency', options: FREQUENCY_OPTIONS },
    { id: 'gad7_5', text: 'Being so restless that it is hard to sit still', type: 'frequency', options: FREQUENCY_OPTIONS },
    { id: 'gad7_6', text: 'Becoming easily annoyed or irritable', type: 'frequency', options: FREQUENCY_OPTIONS },
    { id: 'gad7_7', text: 'Feeling afraid, as if something awful might happen', type: 'frequency', options: FREQUENCY_OPTIONS },
  ],
};

// ─── PSQI Simplified (Pittsburgh Sleep Quality Index) ───
const PSQI = {
  id: 'psqi',
  title: 'Sleep Assessment',
  subtitle: 'Tell us about your sleep habits over the past month.',
  scoreable: true,
  questions: [
    { id: 'psqi_bedtime', text: 'What is your usual bedtime?', type: 'time' },
    { id: 'psqi_hours', text: 'How many hours of actual sleep do you get per night?', type: 'number', min: 0, max: 24, step: 0.5, suffix: 'hours' },
    {
      id: 'psqi_quality',
      text: 'During the past month, how would you rate your sleep quality overall?',
      type: 'single_select',
      options: [
        { value: 0, label: 'Very good' },
        { value: 1, label: 'Fairly good' },
        { value: 2, label: 'Fairly bad' },
        { value: 3, label: 'Very bad' },
      ],
    },
    {
      id: 'psqi_disturbance',
      text: 'During the past month, how often have you had trouble sleeping (e.g., waking up in the middle of the night, having to get up to use the bathroom, cannot breathe comfortably, cough or snore loudly, feel too cold/hot)?',
      type: 'single_select',
      options: [
        { value: 0, label: 'Not during the past month' },
        { value: 1, label: 'Less than once a week' },
        { value: 2, label: 'Once or twice a week' },
        { value: 3, label: 'Three or more times a week' },
      ],
    },
    {
      id: 'psqi_dysfunction',
      text: 'During the past month, how much of a problem has it been for you to keep up enough enthusiasm to get things done?',
      type: 'single_select',
      options: [
        { value: 0, label: 'No problem at all' },
        { value: 1, label: 'Only a very slight problem' },
        { value: 2, label: 'Somewhat of a problem' },
        { value: 3, label: 'A very big problem' },
      ],
    },
  ],
};

// ─── Fatigue VAS ───
const FATIGUE_VAS = {
  id: 'fatigue',
  title: 'Energy Level',
  subtitle: '',
  questions: [
    {
      id: 'fatigue_vas',
      text: 'Rate your energy level on a typical day',
      type: 'slider',
      min: 0,
      max: 10,
      minLabel: 'Completely exhausted',
      maxLabel: 'Full energy',
      defaultValue: 5,
    },
  ],
};

// ─── IIEF-5 (International Index of Erectile Function — Male Sexual Health) ───
const IIEF5 = {
  id: 'iief5',
  title: 'Sexual Health Assessment',
  subtitle: 'Over the past 6 months:',
  scoreable: true,
  maxScore: 25,
  condition: { type: 'symptom', symptom: 'low_libido', gender: 'male' },
  questions: [
    {
      id: 'iief5_1',
      text: 'How do you rate your confidence that you could get and keep an erection?',
      type: 'single_select',
      options: [
        { value: 1, label: 'Very low' },
        { value: 2, label: 'Low' },
        { value: 3, label: 'Moderate' },
        { value: 4, label: 'High' },
        { value: 5, label: 'Very high' },
      ],
    },
    {
      id: 'iief5_2',
      text: 'When you had erections with sexual stimulation, how often were your erections hard enough for penetration?',
      type: 'single_select',
      options: [
        { value: 1, label: 'Almost never or never' },
        { value: 2, label: 'A few times (much less than half the time)' },
        { value: 3, label: 'Sometimes (about half the time)' },
        { value: 4, label: 'Most times (much more than half the time)' },
        { value: 5, label: 'Almost always or always' },
      ],
    },
    {
      id: 'iief5_3',
      text: 'During sexual intercourse, how often were you able to maintain your erection after you had penetrated your partner?',
      type: 'single_select',
      options: [
        { value: 1, label: 'Almost never or never' },
        { value: 2, label: 'A few times (much less than half the time)' },
        { value: 3, label: 'Sometimes (about half the time)' },
        { value: 4, label: 'Most times (much more than half the time)' },
        { value: 5, label: 'Almost always or always' },
      ],
    },
    {
      id: 'iief5_4',
      text: 'During sexual intercourse, how difficult was it to maintain your erection to completion of intercourse?',
      type: 'single_select',
      options: [
        { value: 1, label: 'Extremely difficult' },
        { value: 2, label: 'Very difficult' },
        { value: 3, label: 'Difficult' },
        { value: 4, label: 'Slightly difficult' },
        { value: 5, label: 'Not difficult' },
      ],
    },
    {
      id: 'iief5_5',
      text: 'When you attempted sexual intercourse, how often was it satisfactory for you?',
      type: 'single_select',
      options: [
        { value: 1, label: 'Almost never or never' },
        { value: 2, label: 'A few times (much less than half the time)' },
        { value: 3, label: 'Sometimes (about half the time)' },
        { value: 4, label: 'Most times (much more than half the time)' },
        { value: 5, label: 'Almost always or always' },
      ],
    },
  ],
};

// ─── FSFI-6 (Female Sexual Function Index — 6 domains) ───
const FSFI6 = {
  id: 'fsfi6',
  title: 'Sexual Health Assessment',
  subtitle: 'Over the past 4 weeks:',
  scoreable: true,
  condition: { type: 'symptom', symptom: 'low_libido', gender: 'female' },
  questions: [
    {
      id: 'fsfi6_desire',
      text: 'How often did you feel sexual desire or interest?',
      type: 'single_select',
      options: [
        { value: 1, label: 'Almost never or never' },
        { value: 2, label: 'A few times (much less than half the time)' },
        { value: 3, label: 'Sometimes (about half the time)' },
        { value: 4, label: 'Most times (much more than half the time)' },
        { value: 5, label: 'Almost always or always' },
      ],
    },
    {
      id: 'fsfi6_arousal',
      text: 'How would you rate your level of sexual arousal during sexual activity or intercourse?',
      type: 'single_select',
      options: [
        { value: 1, label: 'Very low or none at all' },
        { value: 2, label: 'Low' },
        { value: 3, label: 'Moderate' },
        { value: 4, label: 'High' },
        { value: 5, label: 'Very high' },
      ],
    },
    {
      id: 'fsfi6_lubrication',
      text: 'How often did you become lubricated ("wet") during sexual activity or intercourse?',
      type: 'single_select',
      options: [
        { value: 1, label: 'Almost never or never' },
        { value: 2, label: 'A few times (much less than half the time)' },
        { value: 3, label: 'Sometimes (about half the time)' },
        { value: 4, label: 'Most times (much more than half the time)' },
        { value: 5, label: 'Almost always or always' },
      ],
    },
    {
      id: 'fsfi6_orgasm',
      text: 'When you had sexual stimulation or intercourse, how often did you reach orgasm (climax)?',
      type: 'single_select',
      options: [
        { value: 1, label: 'Almost never or never' },
        { value: 2, label: 'A few times (much less than half the time)' },
        { value: 3, label: 'Sometimes (about half the time)' },
        { value: 4, label: 'Most times (much more than half the time)' },
        { value: 5, label: 'Almost always or always' },
      ],
    },
    {
      id: 'fsfi6_satisfaction',
      text: 'How satisfied have you been with your overall sexual life?',
      type: 'single_select',
      options: [
        { value: 1, label: 'Very dissatisfied' },
        { value: 2, label: 'Moderately dissatisfied' },
        { value: 3, label: 'About equally satisfied and dissatisfied' },
        { value: 4, label: 'Moderately satisfied' },
        { value: 5, label: 'Very satisfied' },
      ],
    },
    {
      id: 'fsfi6_pain',
      text: 'How often did you experience discomfort or pain during vaginal penetration?',
      type: 'single_select',
      options: [
        { value: 5, label: 'Almost never or never' },
        { value: 4, label: 'A few times (much less than half the time)' },
        { value: 3, label: 'Sometimes (about half the time)' },
        { value: 2, label: 'Most times (much more than half the time)' },
        { value: 1, label: 'Almost always or always' },
      ],
    },
  ],
};

// ─── TFEQ-R18 (Three-Factor Eating Questionnaire) ───
const TFEQ_R18 = {
  id: 'tfeq_r18',
  title: 'Eating Behavior Assessment',
  subtitle: 'Please indicate how much you agree with each statement.',
  scoreable: true,
  condition: { type: 'symptom', symptom: 'weight_gain' },
  questions: [
    { id: 'tfeq_1', text: 'When I smell a sizzling steak or juicy piece of meat, I find it very difficult to keep from eating, even if I have just finished a meal', type: 'agree4', section: 'Uncontrolled Eating' },
    { id: 'tfeq_2', text: 'I deliberately take small helpings as a means of controlling my weight', type: 'agree4', section: 'Cognitive Restraint' },
    { id: 'tfeq_3', text: 'When I feel anxious, I find myself eating', type: 'agree4', section: 'Emotional Eating' },
    { id: 'tfeq_4', text: 'Sometimes when I start eating, I just can\'t seem to stop', type: 'agree4', section: 'Uncontrolled Eating' },
    { id: 'tfeq_5', text: 'Being with someone who is eating often makes me hungry enough to eat also', type: 'agree4', section: 'Uncontrolled Eating' },
    { id: 'tfeq_6', text: 'When I feel blue, I often overeat', type: 'agree4', section: 'Emotional Eating' },
    { id: 'tfeq_7', text: 'When I see a real delicacy, I often get so hungry that I have to eat right away', type: 'agree4', section: 'Uncontrolled Eating' },
    { id: 'tfeq_8', text: 'I get so hungry that my stomach often seems like a bottomless pit', type: 'agree4', section: 'Uncontrolled Eating' },
    { id: 'tfeq_9', text: 'I am always hungry so it is hard for me to stop eating before I finish the food on my plate', type: 'agree4', section: 'Uncontrolled Eating' },
    { id: 'tfeq_10', text: 'When I feel lonely, I console myself by eating', type: 'agree4', section: 'Emotional Eating' },
    { id: 'tfeq_11', text: 'I consciously hold back at meals in order not to gain weight', type: 'agree4', section: 'Cognitive Restraint' },
    { id: 'tfeq_12', text: 'I do not eat some foods because they make me fat', type: 'agree4', section: 'Cognitive Restraint' },
    { id: 'tfeq_13', text: 'I am always hungry enough to eat at any time', type: 'agree4', section: 'Uncontrolled Eating' },
    { id: 'tfeq_14', text: 'How often do you feel hungry?', type: 'agree4', section: 'Uncontrolled Eating' },
    { id: 'tfeq_15', text: 'How frequently do you avoid stocking up on tempting foods?', type: 'agree4', section: 'Cognitive Restraint' },
    { id: 'tfeq_16', text: 'How likely are you to consciously eat less than you want?', type: 'agree4', section: 'Cognitive Restraint' },
    { id: 'tfeq_17', text: 'Do you go on eating binges though you are not hungry?', type: 'agree4', section: 'Uncontrolled Eating' },
    { id: 'tfeq_18', text: 'On a scale of 1 to 8, where 1 means no restraint in eating and 8 means total restraint, what number would you give yourself?', type: 'scale8', section: 'Cognitive Restraint' },
  ],
};

// ─── AMS (Aging Males' Symptoms Scale) ───
const AMS = {
  id: 'ams',
  title: 'Male Hormone Symptoms',
  subtitle: 'Which of the following symptoms apply to you at this time? Please rate the severity.',
  scoreable: true,
  maxScore: 85,
  condition: { type: 'hormone_symptoms', gender: 'male' },
  questions: [
    { id: 'ams_1', text: 'Decline in your feeling of general well-being', type: 'severity5' },
    { id: 'ams_2', text: 'Joint pain and muscular ache', type: 'severity5' },
    { id: 'ams_3', text: 'Excessive sweating (unexpected/sudden episodes of sweating, hot flushes)', type: 'severity5' },
    { id: 'ams_4', text: 'Sleep problems (difficulty falling asleep, difficulty sleeping through, waking up early and feeling tired, poor sleep, sleeplessness)', type: 'severity5' },
    { id: 'ams_5', text: 'Increased need for sleep, often feeling tired', type: 'severity5' },
    { id: 'ams_6', text: 'Irritability (feeling aggressive, easily upset about little things, moody)', type: 'severity5' },
    { id: 'ams_7', text: 'Nervousness (inner tension, restlessness, feeling fidgety)', type: 'severity5' },
    { id: 'ams_8', text: 'Anxiety (feeling panicky)', type: 'severity5' },
    { id: 'ams_9', text: 'Physical exhaustion / lacking vitality (general decrease in performance, reduced activity, lacking interest in leisure activities, feeling of getting less done, of achieving less, of having to force oneself to undertake activities)', type: 'severity5' },
    { id: 'ams_10', text: 'Decrease in muscular strength (feeling of weakness)', type: 'severity5' },
    { id: 'ams_11', text: 'Depressive mood (feeling down, sad, on the verge of tears, lack of drive, mood swings, feeling nothing is of any use)', type: 'severity5' },
    { id: 'ams_12', text: 'Feeling that you have passed your peak', type: 'severity5' },
    { id: 'ams_13', text: 'Feeling burnt out, having hit rock-bottom', type: 'severity5' },
    { id: 'ams_14', text: 'Decrease in beard growth', type: 'severity5' },
    { id: 'ams_15', text: 'Decrease in ability/frequency to perform sexually', type: 'severity5' },
    { id: 'ams_16', text: 'Decrease in the number of morning erections', type: 'severity5' },
    { id: 'ams_17', text: 'Decrease in sexual desire/libido', type: 'severity5' },
  ],
};

// ─── MENQOL (Menopause-Specific Quality of Life) ───
const MENQOL = {
  id: 'menqol',
  title: 'Menopause Symptoms',
  subtitle: 'Have you experienced any of the following during the past month? If yes, how bothered were you?',
  scoreable: true,
  condition: { type: 'hormone_symptoms', gender: 'female' },
  questions: [
    // Vasomotor
    { id: 'menqol_1', text: 'Hot flashes or flushes', type: 'bother8', section: 'Vasomotor' },
    { id: 'menqol_2', text: 'Night sweats', type: 'bother8', section: 'Vasomotor' },
    { id: 'menqol_3', text: 'Sweating', type: 'bother8', section: 'Vasomotor' },
    // Psychosocial
    { id: 'menqol_4', text: 'Being dissatisfied with my personal life', type: 'bother8', section: 'Psychosocial' },
    { id: 'menqol_5', text: 'Feeling anxious or nervous', type: 'bother8', section: 'Psychosocial' },
    { id: 'menqol_6', text: 'Experiencing poor memory', type: 'bother8', section: 'Psychosocial' },
    { id: 'menqol_7', text: 'Accomplishing less than I used to', type: 'bother8', section: 'Psychosocial' },
    { id: 'menqol_8', text: 'Feeling depressed, down, or blue', type: 'bother8', section: 'Psychosocial' },
    { id: 'menqol_9', text: 'Being impatient with other people', type: 'bother8', section: 'Psychosocial' },
    { id: 'menqol_10', text: 'Feelings of wanting to be alone', type: 'bother8', section: 'Psychosocial' },
    // Physical
    { id: 'menqol_11', text: 'Flatulence (wind) or gas pains', type: 'bother8', section: 'Physical' },
    { id: 'menqol_12', text: 'Aching in muscles and joints', type: 'bother8', section: 'Physical' },
    { id: 'menqol_13', text: 'Feeling tired or worn out', type: 'bother8', section: 'Physical' },
    { id: 'menqol_14', text: 'Difficulty sleeping', type: 'bother8', section: 'Physical' },
    { id: 'menqol_15', text: 'Aches in back of neck or head', type: 'bother8', section: 'Physical' },
    { id: 'menqol_16', text: 'Decrease in physical strength', type: 'bother8', section: 'Physical' },
    { id: 'menqol_17', text: 'Decrease in stamina', type: 'bother8', section: 'Physical' },
    { id: 'menqol_18', text: 'Feeling a lack of energy', type: 'bother8', section: 'Physical' },
    { id: 'menqol_19', text: 'Dry skin', type: 'bother8', section: 'Physical' },
    { id: 'menqol_20', text: 'Weight gain', type: 'bother8', section: 'Physical' },
    { id: 'menqol_21', text: 'Increased facial hair', type: 'bother8', section: 'Physical' },
    { id: 'menqol_22', text: 'Changes in appearance, texture, or tone of your skin', type: 'bother8', section: 'Physical' },
    { id: 'menqol_23', text: 'Feeling bloated', type: 'bother8', section: 'Physical' },
    { id: 'menqol_24', text: 'Low backache', type: 'bother8', section: 'Physical' },
    { id: 'menqol_25', text: 'Frequent urination', type: 'bother8', section: 'Physical' },
    { id: 'menqol_26', text: 'Involuntary urination when laughing or coughing', type: 'bother8', section: 'Physical' },
    // Sexual
    { id: 'menqol_27', text: 'Change in your sexual desire', type: 'bother8', section: 'Sexual' },
    { id: 'menqol_28', text: 'Vaginal dryness during intercourse', type: 'bother8', section: 'Sexual' },
    { id: 'menqol_29', text: 'Avoiding intimacy', type: 'bother8', section: 'Sexual' },
  ],
};

// ─── PGIC Baseline (Patient Global Impression — Goal) ───
const PGIC_BASELINE = {
  id: 'pgic_baseline',
  title: 'Your Goals',
  subtitle: '',
  questions: [
    {
      id: 'primary_goal',
      text: 'What is your primary goal for this program?',
      type: 'textarea',
      placeholder: 'In your own words, what would you most like to improve or achieve?',
    },
  ],
};

// ─── Severity 5-point scale (for AMS) ───
export const SEVERITY5_OPTIONS = [
  { value: 1, label: 'None' },
  { value: 2, label: 'Mild' },
  { value: 3, label: 'Moderate' },
  { value: 4, label: 'Severe' },
  { value: 5, label: 'Extremely severe' },
];

// ─── Agree 4-point scale (for TFEQ-R18) ───
export const AGREE4_OPTIONS = [
  { value: 1, label: 'Definitely false' },
  { value: 2, label: 'Mostly false' },
  { value: 3, label: 'Mostly true' },
  { value: 4, label: 'Definitely true' },
];

// ─── Bother 1-8 scale (for MENQOL): 1=not experienced, 2-8=not bothered to extremely bothered ───
export const BOTHER8_OPTIONS = [
  { value: 1, label: 'Not experienced' },
  { value: 2, label: 'Yes, but not bothered' },
  { value: 3, label: 'Yes, a little bothered' },
  { value: 4, label: 'Yes, somewhat bothered' },
  { value: 5, label: 'Yes, moderately bothered' },
  { value: 6, label: 'Yes, quite a bit bothered' },
  { value: 7, label: 'Yes, very bothered' },
  { value: 8, label: 'Yes, extremely bothered' },
];

// All core sections (always shown for Door 2)
export const DOOR2_CORE_SECTIONS = [PHQ9, GAD7, PSQI, FATIGUE_VAS];

// Modality branches (conditionally shown)
export const DOOR2_MODALITY_SECTIONS = [IIEF5, FSFI6, TFEQ_R18, AMS, MENQOL];

// Final section (always shown)
export const DOOR2_FINAL_SECTION = PGIC_BASELINE;

// ─── Symptom keys from intake form that map to modality branches ───
export const SYMPTOM_TO_MODALITY = {
  // Symptoms from intake that trigger sexual health tools
  low_libido: ['iief5', 'fsfi6'],  // gender-filtered at runtime
  sexual_dysfunction: ['iief5', 'fsfi6'],
  // Weight symptoms
  weight_gain: ['tfeq_r18'],
  difficulty_losing_weight: ['tfeq_r18'],
  // Hormone symptoms that trigger AMS/MENQOL
  fatigue: ['ams', 'menqol'],
  low_energy: ['ams', 'menqol'],
  mood_changes: ['ams', 'menqol'],
  muscle_loss: ['ams', 'menqol'],
  brain_fog: ['ams', 'menqol'],
  low_libido_hormone: ['ams', 'menqol'],
};

// ─── Scoring functions ───
export function calculateScores(responses, sections) {
  const totals = {};

  for (const section of sections) {
    if (!section.scoreable) continue;
    let sum = 0;
    let answered = 0;

    for (const q of section.questions) {
      const val = responses[q.id];
      if (val !== undefined && val !== null && val !== '') {
        const numVal = typeof val === 'object' ? val.value : Number(val);
        if (!isNaN(numVal)) {
          sum += numVal;
          answered++;
        }
      }
    }

    totals[section.id] = {
      score: sum,
      maxScore: section.maxScore || section.questions.length * Math.max(...(section.questions[0]?.options?.map(o => o.value) || [1])),
      answered,
      totalQuestions: section.questions.length,
    };
  }

  return totals;
}

/**
 * Given intake data (symptoms array, gender), determine which Door 2 modality
 * sections should be shown.
 */
export function getApplicableModalities(intakeSymptoms, gender) {
  const symptoms = Array.isArray(intakeSymptoms) ? intakeSymptoms : [];
  const applicableIds = new Set();

  // Map intake symptom strings to modality section IDs
  for (const symptom of symptoms) {
    const normalized = symptom.toLowerCase().replace(/[\s/]+/g, '_');

    // Check for sexual dysfunction symptoms
    if (normalized.includes('libido') || normalized.includes('sexual')) {
      if (gender?.toLowerCase() === 'male') applicableIds.add('iief5');
      if (gender?.toLowerCase() === 'female') applicableIds.add('fsfi6');
    }

    // Check for weight symptoms
    if (normalized.includes('weight') || normalized.includes('metabolism')) {
      applicableIds.add('tfeq_r18');
    }

    // Check for hormone symptoms (fatigue, mood, muscle, brain fog, libido)
    if (
      normalized.includes('fatigue') || normalized.includes('energy') ||
      normalized.includes('mood') || normalized.includes('muscle') ||
      normalized.includes('brain') || normalized.includes('fog') ||
      normalized.includes('libido') || normalized.includes('hormone')
    ) {
      if (gender?.toLowerCase() === 'male') applicableIds.add('ams');
      if (gender?.toLowerCase() === 'female') applicableIds.add('menqol');
    }
  }

  return DOOR2_MODALITY_SECTIONS.filter(s => applicableIds.has(s.id));
}
