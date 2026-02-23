// lib/biomarker-config.js
// Single source of truth for biomarker definitions, groupings, and display metadata.
// Used by the lab dashboard, compare-labs page, and API routes.

const biomarkerGroups = {
  'Hormones': [
    { key: 'total_testosterone', label: 'Total Testosterone', unit: 'ng/dL' },
    { key: 'free_testosterone', label: 'Free Testosterone', unit: 'pg/mL' },
    { key: 'shbg', label: 'SHBG', unit: 'nmol/L' },
    { key: 'estradiol', label: 'Estradiol', unit: 'pg/mL' },
    { key: 'progesterone', label: 'Progesterone', unit: 'ng/mL' },
    { key: 'dhea_s', label: 'DHEA-S', unit: 'µg/dL' },
    { key: 'dht', label: 'DHT', unit: 'ng/dL' },
    { key: 'fsh', label: 'FSH', unit: 'mIU/mL' },
    { key: 'lh', label: 'LH', unit: 'mIU/mL' },
    { key: 'igf_1', label: 'IGF-1', unit: 'ng/mL' },
    { key: 'cortisol', label: 'Cortisol', unit: 'µg/dL' }
  ],
  'Thyroid': [
    { key: 'tsh', label: 'TSH', unit: 'uIU/mL' },
    { key: 'free_t3', label: 'Free T3', unit: 'pg/mL' },
    { key: 'free_t4', label: 'Free T4', unit: 'ng/dL' },
    { key: 'tpo_antibody', label: 'TPO Antibody', unit: 'IU/mL' },
    { key: 'thyroglobulin_antibody', label: 'Thyroglobulin Antibody', unit: 'IU/mL' }
  ],
  'Blood Sugar & Metabolism': [
    { key: 'glucose', label: 'Glucose', unit: 'mg/dL' },
    { key: 'fasting_insulin', label: 'Fasting Insulin', unit: 'µIU/mL' },
    { key: 'hemoglobin_a1c', label: 'Hemoglobin A1C', unit: '%' },
    { key: 'uric_acid', label: 'Uric Acid', unit: 'mg/dL' }
  ],
  'Lipids': [
    { key: 'total_cholesterol', label: 'Total Cholesterol', unit: 'mg/dL' },
    { key: 'ldl_cholesterol', label: 'LDL', unit: 'mg/dL' },
    { key: 'hdl_cholesterol', label: 'HDL', unit: 'mg/dL' },
    { key: 'triglycerides', label: 'Triglycerides', unit: 'mg/dL' },
    { key: 'vldl_cholesterol', label: 'VLDL', unit: 'mg/dL' },
    { key: 'apolipoprotein_b', label: 'Apolipoprotein B', unit: 'mg/dL' },
    { key: 'apolipoprotein_a1', label: 'Apolipoprotein A1', unit: 'mg/dL' },
    { key: 'lp_a', label: 'Lp(a)', unit: 'nmol/L' }
  ],
  'Vitamins & Minerals': [
    { key: 'vitamin_d', label: 'Vitamin D', unit: 'ng/mL' },
    { key: 'vitamin_b12', label: 'Vitamin B12', unit: 'pg/mL' },
    { key: 'folate', label: 'Folate', unit: 'ng/mL' },
    { key: 'magnesium', label: 'Magnesium', unit: 'mg/dL' }
  ],
  'Inflammation': [
    { key: 'crp_hs', label: 'CRP (hs)', unit: 'mg/L' },
    { key: 'esr', label: 'ESR', unit: 'mm/hr' },
    { key: 'homocysteine', label: 'Homocysteine', unit: 'µmol/L' }
  ],
  'Liver Function': [
    { key: 'alt', label: 'ALT', unit: 'U/L' },
    { key: 'ast', label: 'AST', unit: 'U/L' },
    { key: 'alkaline_phosphatase', label: 'Alkaline Phosphatase', unit: 'U/L' },
    { key: 'total_bilirubin', label: 'Total Bilirubin', unit: 'mg/dL' },
    { key: 'albumin', label: 'Albumin', unit: 'g/dL' },
    { key: 'total_protein', label: 'Total Protein', unit: 'g/dL' },
    { key: 'ggt', label: 'GGT', unit: 'U/L' }
  ],
  'Kidney Function': [
    { key: 'creatinine', label: 'Creatinine', unit: 'mg/dL' },
    { key: 'bun', label: 'BUN', unit: 'mg/dL' },
    { key: 'egfr', label: 'eGFR', unit: 'mL/min/1.73m²' },
    { key: 'bun_creatinine_ratio', label: 'BUN/Creatinine Ratio', unit: '' }
  ],
  'Electrolytes': [
    { key: 'sodium', label: 'Sodium', unit: 'mmol/L' },
    { key: 'potassium', label: 'Potassium', unit: 'mmol/L' },
    { key: 'chloride', label: 'Chloride', unit: 'mmol/L' },
    { key: 'co2', label: 'CO2', unit: 'mmol/L' },
    { key: 'calcium', label: 'Calcium', unit: 'mg/dL' }
  ],
  'Complete Blood Count': [
    { key: 'wbc', label: 'WBC', unit: 'K/µL' },
    { key: 'rbc', label: 'RBC', unit: 'M/µL' },
    { key: 'hemoglobin', label: 'Hemoglobin', unit: 'g/dL' },
    { key: 'hematocrit', label: 'Hematocrit', unit: '%' },
    { key: 'mcv', label: 'MCV', unit: 'fL' },
    { key: 'mch', label: 'MCH', unit: 'pg' },
    { key: 'mchc', label: 'MCHC', unit: 'g/dL' },
    { key: 'rdw', label: 'RDW', unit: '%' },
    { key: 'platelets', label: 'Platelets', unit: 'K/µL' },
    { key: 'neutrophils_percent', label: 'Neutrophils %', unit: '%' },
    { key: 'lymphocytes_percent', label: 'Lymphocytes %', unit: '%' },
    { key: 'monocytes_percent', label: 'Monocytes %', unit: '%' },
    { key: 'eosinophils_percent', label: 'Eosinophils %', unit: '%' },
    { key: 'basophils_percent', label: 'Basophils %', unit: '%' },
    { key: 'neutrophils_absolute', label: 'Neutrophils (abs)', unit: 'K/µL' },
    { key: 'lymphocytes_absolute', label: 'Lymphocytes (abs)', unit: 'K/µL' },
    { key: 'monocytes_absolute', label: 'Monocytes (abs)', unit: 'K/µL' },
    { key: 'eosinophils_absolute', label: 'Eosinophils (abs)', unit: 'K/µL' },
    { key: 'basophils_absolute', label: 'Basophils (abs)', unit: 'K/µL' }
  ],
  'Iron Studies': [
    { key: 'iron', label: 'Iron', unit: 'µg/dL' },
    { key: 'tibc', label: 'TIBC', unit: 'µg/dL' },
    { key: 'iron_saturation', label: 'Iron Saturation', unit: '%' },
    { key: 'ferritin', label: 'Ferritin', unit: 'ng/mL' }
  ],
  'Prostate': [
    { key: 'psa_total', label: 'PSA Total', unit: 'ng/mL' },
    { key: 'psa_free', label: 'PSA Free', unit: 'ng/mL' }
  ]
};

// Flat lookup: biomarker_key → { label, unit, category }
const biomarkerMap = {};
Object.entries(biomarkerGroups).forEach(([category, markers]) => {
  markers.forEach(m => {
    biomarkerMap[m.key] = { ...m, category };
  });
});

// All biomarker keys as flat array
const allBiomarkerKeys = Object.values(biomarkerGroups).flat().map(m => m.key);

// Category display order
const categoryOrder = [
  'Hormones', 'Thyroid', 'Blood Sugar & Metabolism', 'Lipids',
  'Vitamins & Minerals', 'Inflammation', 'Liver Function', 'Kidney Function',
  'Electrolytes', 'Complete Blood Count', 'Iron Studies', 'Prostate'
];

module.exports = { biomarkerGroups, biomarkerMap, allBiomarkerKeys, categoryOrder };
