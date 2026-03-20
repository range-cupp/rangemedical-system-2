-- Add missing Elite panel biomarker columns to labs table
-- These columns support Chol/HDL ratio, Apo B/A1 ratio, and % Free PSA
-- which were on the Elite panel but not being stored or displayed.

ALTER TABLE labs ADD COLUMN IF NOT EXISTS chol_hdl_ratio NUMERIC;
ALTER TABLE labs ADD COLUMN IF NOT EXISTS apo_b_a1_ratio NUMERIC;
ALTER TABLE labs ADD COLUMN IF NOT EXISTS psa_free_percent NUMERIC;

-- Also ensure these columns exist (parsed by importer but may be missing):
ALTER TABLE labs ADD COLUMN IF NOT EXISTS total_t4 NUMERIC;
ALTER TABLE labs ADD COLUMN IF NOT EXISTS reverse_t3 NUMERIC;
ALTER TABLE labs ADD COLUMN IF NOT EXISTS globulin NUMERIC;
ALTER TABLE labs ADD COLUMN IF NOT EXISTS ag_ratio NUMERIC;
ALTER TABLE labs ADD COLUMN IF NOT EXISTS anion_gap NUMERIC;
ALTER TABLE labs ADD COLUMN IF NOT EXISTS mpv NUMERIC;

-- Insert reference ranges for the new biomarkers
-- (uses upsert pattern: insert only if not already present)

INSERT INTO lab_reference_ranges (biomarker, gender, min_value, max_value, optimal_min, optimal_max, unit)
SELECT * FROM (VALUES
  ('globulin',        'Both',   2.0,   4.0,   2.3,   3.5,   'g/dL'),
  ('ag_ratio',        'Both',   1.1,   2.5,   1.2,   2.2,   ''),
  ('anion_gap',       'Both',   3.0,  25.0,   4.0,  12.0,   ''),
  ('mpv',             'Both',   5.2,  11.1,   7.5,  11.0,   'fL'),
  ('chol_hdl_ratio',  'Male',   0.0,   5.0,   0.0,   4.0,   ''),
  ('chol_hdl_ratio',  'Female', 0.0,   5.7,   0.0,   3.7,   ''),
  ('apo_b_a1_ratio',  'Male',   0.0,   0.90,  0.0,   0.69,  ''),
  ('apo_b_a1_ratio',  'Female', 0.0,   0.80,  0.0,   0.59,  ''),
  ('psa_free_percent', 'Male',  25.0, 100.0,  25.0, 100.0,  '%'),
  ('total_t4',        'Both',   4.5,  12.0,   6.0,  10.0,   'µg/dL'),
  ('reverse_t3',      'Both',   9.2,  24.1,  10.0,  20.0,   'ng/dL'),
  ('lp_a',            'Both',   0.0,  30.0,   0.0,  14.0,   'mg/dL')
) AS v(biomarker, gender, min_value, max_value, optimal_min, optimal_max, unit)
WHERE NOT EXISTS (
  SELECT 1 FROM lab_reference_ranges r WHERE r.biomarker = v.biomarker AND r.gender = v.gender
);

-- Insert education content for new biomarkers into biomarker_library
INSERT INTO biomarker_library (biomarker_key, display_name, category, unit, what_it_measures, why_it_matters, influencing_factors, optimal_range_display, special_notes, sort_order)
SELECT * FROM (VALUES
  ('globulin', 'Globulin', 'Liver Function', 'g/dL',
   'Measures the group of proteins in the blood that includes antibodies (immunoglobulins) and other proteins involved in immune function and inflammation.',
   'Abnormal globulin levels can indicate chronic infections, liver disease, immune disorders, or blood cancers like multiple myeloma. Low levels may suggest immune deficiency.',
   'Chronic infections, autoimmune diseases, liver disease, dehydration, malnutrition',
   '2.3–3.5 g/dL',
   'The A/G ratio (albumin to globulin) provides additional diagnostic information when interpreted alongside total protein.',
   58),
  ('ag_ratio', 'A/G Ratio', 'Liver Function', '',
   'The ratio of albumin to globulin proteins in the blood, calculated from total protein and albumin values.',
   'A low A/G ratio may suggest overproduction of globulins (as in multiple myeloma or autoimmune diseases) or underproduction of albumin (as in liver disease). A high ratio is generally not clinically significant.',
   'Liver disease, chronic inflammation, immune disorders, malnutrition, dehydration',
   '1.2–2.2',
   'This is a calculated value derived from albumin and total protein. Changes in either component affect the ratio.',
   59),
  ('anion_gap', 'Anion Gap', 'Electrolytes', '',
   'A calculated value representing the difference between measured cations (sodium, potassium) and anions (chloride, bicarbonate) in the blood.',
   'An elevated anion gap indicates the presence of unmeasured anions, which can point to metabolic acidosis from conditions like diabetic ketoacidosis, lactic acidosis, kidney failure, or toxic ingestions.',
   'Kidney function, diabetic status, dehydration, medications, toxic exposures',
   '4–12',
   'The anion gap is a calculated value. An elevated gap with normal pH may indicate a mixed acid-base disorder.',
   75),
  ('mpv', 'MPV', 'Complete Blood Count', 'fL',
   'Mean Platelet Volume — measures the average size of platelets in the blood.',
   'MPV reflects platelet production rate. Large platelets are younger and more active. Elevated MPV with low platelet count may suggest increased platelet destruction or consumption. Low MPV may indicate bone marrow underproduction.',
   'Inflammation, infections, bone marrow disorders, medications, spleen function',
   '7.5–11.0 fL',
   'MPV is most useful when interpreted alongside platelet count. A high MPV with normal platelet count is generally not concerning.',
   85),
  ('chol_hdl_ratio', 'Chol/HDL Ratio', 'Lipids', '',
   'The ratio of total cholesterol to HDL cholesterol, used as an indicator of cardiovascular disease risk.',
   'This ratio is a better predictor of heart disease risk than total cholesterol alone. A lower ratio indicates a healthier balance between total and protective (HDL) cholesterol.',
   'Diet, exercise, genetics, medications (statins), weight, smoking, alcohol intake',
   'Men: <4.0, Women: <3.7',
   'The American Heart Association considers a ratio above 5.0 to indicate elevated cardiovascular risk.',
   35),
  ('apo_b_a1_ratio', 'Apo B/A1 Ratio', 'Lipids', '',
   'The ratio of Apolipoprotein B to Apolipoprotein A1, representing the balance between atherogenic (harmful) and protective lipoproteins.',
   'This ratio is considered one of the strongest lipid-related predictors of cardiovascular risk. A higher ratio indicates more atherogenic particles relative to protective ones.',
   'Diet, exercise, genetics, medications, metabolic syndrome, insulin resistance',
   'Men: <0.69, Women: <0.59',
   'Some experts consider the Apo B/A1 ratio superior to traditional cholesterol ratios for cardiovascular risk assessment.',
   40),
  ('psa_free_percent', '% Free PSA', 'Prostate', '%',
   'The percentage of PSA (Prostate-Specific Antigen) circulating in the blood in its free (unbound) form, as opposed to bound to proteins.',
   'When total PSA is in the borderline range (4–10 ng/mL), % Free PSA helps distinguish between prostate cancer and benign prostatic hyperplasia (BPH). A lower % Free PSA is more concerning for cancer.',
   'Prostate size, BPH, prostatitis, recent ejaculation, prostate manipulation, age',
   '>25%',
   'Most clinically useful when total PSA is between 4.0–10.0 ng/mL. A % Free PSA below 25% with elevated total PSA warrants further evaluation.',
   103),
  ('total_t4', 'Total T4', 'Thyroid', 'µg/dL',
   'Measures the total amount of thyroxine (T4) in the blood, including both protein-bound and free forms.',
   'Total T4 provides a general assessment of thyroid function. Elevated levels may indicate hyperthyroidism, while low levels suggest hypothyroidism. However, Free T4 is generally more clinically useful as it measures the active hormone.',
   'Thyroid disease, pregnancy, estrogen therapy, liver disease, medications (birth control, steroids)',
   '6.0–10.0 µg/dL',
   'Total T4 can be affected by changes in binding proteins (TBG), making Free T4 a more reliable indicator of actual thyroid function.',
   22),
  ('reverse_t3', 'Reverse T3', 'Thyroid', 'ng/dL',
   'Measures reverse triiodothyronine, an inactive form of T3 that the body produces from T4 instead of active T3.',
   'Elevated reverse T3 can indicate that the body is converting T4 into the inactive form rather than active T3, which may explain thyroid symptoms despite normal TSH and T4 levels. This is sometimes seen in chronic illness, stress, or caloric restriction.',
   'Chronic illness, stress, caloric restriction, inflammation, liver disease, medications',
   '10.0–20.0 ng/dL',
   'Reverse T3 is most useful when patients have thyroid symptoms but normal standard thyroid labs. The Free T3 to Reverse T3 ratio may provide additional clinical insight.',
   23)
) AS v(biomarker_key, display_name, category, unit, what_it_measures, why_it_matters, influencing_factors, optimal_range_display, special_notes, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM biomarker_library b WHERE b.biomarker_key = v.biomarker_key
);
