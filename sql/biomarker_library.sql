-- ============================================================================
-- biomarker_library.sql
-- Creates and seeds the biomarker_library table with education content
-- for all tracked biomarkers across 12 categories.
-- Idempotent: safe to run multiple times.
-- ============================================================================

CREATE TABLE IF NOT EXISTS biomarker_library (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  biomarker_key TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  category TEXT NOT NULL,
  unit TEXT,
  what_it_measures TEXT,
  why_it_matters TEXT,
  influencing_factors TEXT,
  optimal_range_display TEXT,
  special_notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- HORMONES
-- ============================================================================

INSERT INTO biomarker_library (biomarker_key, display_name, category, unit, what_it_measures, why_it_matters, influencing_factors, optimal_range_display, special_notes, sort_order)
VALUES
(
  'total_testosterone',
  'Total Testosterone',
  'Hormones',
  'ng/dL',
  'Measures the total amount of testosterone circulating in the blood, including both bound and unbound forms.',
  'Testosterone is the primary male sex hormone, essential for muscle mass, bone density, red blood cell production, fat distribution, and reproductive health. Low levels are associated with fatigue, decreased libido, and increased cardiovascular risk.',
  'Age, Sleep, Exercise, Stress, Body fat percentage, Medications, Time of day',
  'Males: 500-900 ng/dL; Females: 15-70 ng/dL',
  'Levels are highest in the morning and decline throughout the day. Always draw blood before 10 AM for accurate assessment.',
  1
),
(
  'free_testosterone',
  'Free Testosterone',
  'Hormones',
  'pg/mL',
  'Measures the fraction of testosterone not bound to proteins like SHBG or albumin, representing the biologically active form available to tissues.',
  'Free testosterone is the most clinically relevant measure of androgenic activity because only unbound testosterone can enter cells and exert its effects. It can be low even when total testosterone is normal.',
  'Age, SHBG levels, Body fat, Insulin resistance, Thyroid function, Medications',
  'Males: 9-25 pg/mL; Females: 0.3-1.9 pg/mL',
  'Calculated free testosterone (using SHBG and albumin) is generally more reliable than direct analog assays.',
  2
),
(
  'shbg',
  'Sex Hormone-Binding Globulin (SHBG)',
  'Hormones',
  'nmol/L',
  'Measures the level of a protein produced by the liver that binds to sex hormones, primarily testosterone and estradiol, regulating their bioavailability.',
  'SHBG determines how much testosterone and estrogen is freely available to tissues. High SHBG reduces free hormone levels, while low SHBG increases them, each carrying distinct clinical implications.',
  'Thyroid function, Liver health, Insulin resistance, Obesity, Aging, Estrogen levels, Medications',
  'Males: 20-50 nmol/L; Females: 40-120 nmol/L',
  'Elevated SHBG is common with hyperthyroidism, oral estrogen use, and liver disease. Low SHBG is associated with insulin resistance and metabolic syndrome.',
  3
),
(
  'estradiol',
  'Estradiol (E2)',
  'Hormones',
  'pg/mL',
  'Measures the primary and most potent form of estrogen in the body, produced mainly by the ovaries in women and by aromatization of testosterone in men.',
  'Estradiol is critical for bone health, cardiovascular protection, brain function, and reproductive health in both sexes. In men, optimal levels support joint health and cognitive function, while excessively high levels can cause gynecomastia and water retention.',
  'Body fat percentage, Aromatase activity, Liver function, Medications, Menstrual cycle phase, Age',
  'Males: 20-40 pg/mL; Premenopausal females: varies by cycle phase; Postmenopausal females: <20 pg/mL',
  'In men on TRT, estradiol should be monitored to ensure it rises proportionally with testosterone. The sensitive LC/MS assay is preferred for accurate measurement in males.',
  4
),
(
  'progesterone',
  'Progesterone',
  'Hormones',
  'ng/mL',
  'Measures the steroid hormone produced primarily by the ovaries after ovulation and by the adrenal glands in smaller amounts.',
  'Progesterone plays a key role in regulating the menstrual cycle, supporting pregnancy, and balancing the effects of estrogen. Low levels are linked to irregular periods, PMS, and difficulty maintaining pregnancy.',
  'Menstrual cycle phase, Ovulation, Stress, Age, Body weight, Thyroid function',
  'Males: 0.2-1.4 ng/mL; Females (luteal phase): 5-20 ng/mL',
  'In women, progesterone is best measured 7 days after ovulation (day 21 of a 28-day cycle) to confirm ovulation has occurred.',
  5
),
(
  'dhea_s',
  'DHEA-Sulfate (DHEA-S)',
  'Hormones',
  'mcg/dL',
  'Measures the sulfated form of DHEA, a precursor hormone produced by the adrenal glands that converts into testosterone and estrogen.',
  'DHEA-S is a marker of adrenal function and is the most abundant steroid hormone in the body. It naturally declines with age and low levels are associated with decreased energy, reduced immune function, and accelerated aging.',
  'Age, Stress, Adrenal function, Sleep, Medications, Chronic illness',
  'Males: 200-500 mcg/dL; Females: 100-400 mcg/dL (age-dependent)',
  'DHEA-S is relatively stable throughout the day, making it a more reliable marker than DHEA, which fluctuates significantly.',
  6
),
(
  'dht',
  'Dihydrotestosterone (DHT)',
  'Hormones',
  'ng/dL',
  'Measures the potent androgen formed from testosterone by the enzyme 5-alpha reductase, primarily in peripheral tissues such as skin, hair follicles, and the prostate.',
  'DHT is significantly more potent than testosterone at androgen receptors and plays a key role in male pattern hair loss, prostate growth, and secondary sexual characteristics. Monitoring is important for men on hormone therapy.',
  'Testosterone levels, 5-alpha reductase activity, Medications (finasteride, dutasteride), Genetics',
  'Males: 30-85 ng/dL; Females: 4-22 ng/dL',
  '5-alpha reductase inhibitors like finasteride dramatically lower DHT and can affect PSA levels. DHT is not commonly tested unless clinically indicated.',
  7
),
(
  'fsh',
  'Follicle-Stimulating Hormone (FSH)',
  'Hormones',
  'mIU/mL',
  'Measures the pituitary hormone that stimulates the gonads: sperm production in men and follicle development in women.',
  'FSH is essential for evaluating fertility, pituitary function, and gonadal health. Elevated levels may indicate primary gonadal failure, while low levels suggest a pituitary or hypothalamic issue.',
  'Age, Menstrual cycle phase, Pituitary function, Exogenous hormones, Stress',
  'Males: 1.5-12.4 mIU/mL; Females (follicular): 3.5-12.5 mIU/mL; Postmenopausal: 26-135 mIU/mL',
  'In men on TRT or clomiphene, FSH is often suppressed. Persistently elevated FSH in women under 40 may indicate premature ovarian insufficiency.',
  8
),
(
  'lh',
  'Luteinizing Hormone (LH)',
  'Hormones',
  'mIU/mL',
  'Measures the pituitary hormone that triggers ovulation in women and stimulates testosterone production in men via the Leydig cells.',
  'LH works in concert with FSH to regulate reproductive function. It is a key marker for diagnosing primary versus secondary hypogonadism and evaluating pituitary health.',
  'Age, Menstrual cycle phase, Pituitary function, Exogenous hormones, Stress, Medications',
  'Males: 1.7-8.6 mIU/mL; Females (follicular): 2.4-12.6 mIU/mL; Midcycle surge: 14-96 mIU/mL',
  'An elevated LH with low testosterone in men suggests primary hypogonadism. A low LH with low testosterone suggests secondary (pituitary/hypothalamic) hypogonadism.',
  9
),
(
  'igf_1',
  'Insulin-Like Growth Factor 1 (IGF-1)',
  'Hormones',
  'ng/mL',
  'Measures the hormone produced primarily by the liver in response to growth hormone (GH) stimulation, reflecting overall GH activity.',
  'IGF-1 mediates many of the anabolic effects of growth hormone, including muscle growth, tissue repair, and bone density. It is the most reliable marker of GH status because GH itself is released in pulses and difficult to measure directly.',
  'Age, Growth hormone levels, Nutrition, Liver function, Sleep, Exercise, Fasting state',
  'Age-dependent; Adults 20-40: 100-300 ng/mL; Adults 40-60: 80-250 ng/mL',
  'Very high IGF-1 levels may indicate excessive GH activity or acromegaly. Low levels can be seen with GH deficiency, malnutrition, or liver disease.',
  10
),
(
  'cortisol',
  'Cortisol',
  'Hormones',
  'mcg/dL',
  'Measures the primary stress hormone produced by the adrenal glands, involved in the body''s fight-or-flight response and metabolic regulation.',
  'Cortisol regulates blood sugar, inflammation, blood pressure, and the sleep-wake cycle. Chronically elevated cortisol contributes to weight gain, muscle wasting, immune suppression, and metabolic dysfunction. Very low cortisol may indicate adrenal insufficiency.',
  'Stress, Sleep, Time of day, Exercise, Medications (corticosteroids), Illness, Caffeine',
  'Morning (AM): 6-18 mcg/dL; Afternoon: 3-10 mcg/dL',
  'Cortisol follows a strong diurnal pattern, peaking shortly after waking. Single morning serum cortisol has limited diagnostic value; salivary cortisol or 4-point diurnal testing may be more informative for adrenal dysfunction.',
  11
)
ON CONFLICT (biomarker_key) DO NOTHING;

-- ============================================================================
-- THYROID
-- ============================================================================

INSERT INTO biomarker_library (biomarker_key, display_name, category, unit, what_it_measures, why_it_matters, influencing_factors, optimal_range_display, special_notes, sort_order)
VALUES
(
  'tsh',
  'Thyroid-Stimulating Hormone (TSH)',
  'Thyroid',
  'mIU/L',
  'Measures the pituitary hormone that signals the thyroid gland to produce thyroid hormones (T3 and T4).',
  'TSH is the most sensitive screening test for thyroid dysfunction. Elevated TSH indicates an underactive thyroid (hypothyroidism), while suppressed TSH suggests an overactive thyroid (hyperthyroidism) or excessive thyroid medication.',
  'Thyroid medication, Iodine intake, Stress, Sleep, Biotin supplements, Pituitary function, Pregnancy',
  'Optimal: 1.0-2.5 mIU/L (functional range); Lab reference: 0.4-4.5 mIU/L',
  'Biotin supplementation can interfere with TSH assays and cause falsely low results. Discontinue biotin 48-72 hours before testing.',
  1
),
(
  'free_t3',
  'Free T3 (Triiodothyronine)',
  'Thyroid',
  'pg/mL',
  'Measures the unbound, biologically active form of triiodothyronine, the most metabolically potent thyroid hormone.',
  'Free T3 is the active thyroid hormone that drives cellular metabolism, energy production, and body temperature regulation. Low Free T3 even with normal TSH can explain symptoms of fatigue, cold intolerance, and brain fog.',
  'T4-to-T3 conversion, Selenium status, Stress, Calorie restriction, Liver function, Medications, Inflammation',
  'Optimal: 3.0-4.0 pg/mL; Lab reference: 2.0-4.4 pg/mL',
  'Chronic stress, calorie restriction, and inflammation can impair T4-to-T3 conversion, leading to low T3 syndrome (sometimes called reverse T3 dominance).',
  2
),
(
  'free_t4',
  'Free T4 (Thyroxine)',
  'Thyroid',
  'ng/dL',
  'Measures the unbound form of thyroxine, the primary hormone produced by the thyroid gland, which serves as a reservoir for conversion to active T3.',
  'Free T4 reflects the thyroid gland''s direct output. Together with TSH, it helps differentiate between primary thyroid disease and pituitary/hypothalamic causes of thyroid dysfunction.',
  'Thyroid medication, Iodine intake, Pregnancy, Estrogen levels, Medications (amiodarone, lithium), Illness',
  'Optimal: 1.1-1.5 ng/dL; Lab reference: 0.8-1.8 ng/dL',
  'Free T4 is preferred over Total T4 because it is not affected by changes in binding protein concentrations caused by pregnancy, estrogen therapy, or liver disease.',
  3
),
(
  'tpo_antibody',
  'Thyroid Peroxidase Antibody (TPO Ab)',
  'Thyroid',
  'IU/mL',
  'Measures antibodies directed against thyroid peroxidase, an enzyme essential for thyroid hormone synthesis.',
  'Elevated TPO antibodies indicate autoimmune thyroid disease, most commonly Hashimoto''s thyroiditis. Their presence increases the risk of developing hypothyroidism even when thyroid function tests are currently normal.',
  'Autoimmune conditions, Genetics, Iodine intake, Gut health, Gluten sensitivity, Stress, Pregnancy',
  'Normal: <35 IU/mL',
  'Up to 10-15% of the general population has mildly elevated TPO antibodies without overt thyroid disease. Levels can fluctuate over time and may decrease with lifestyle interventions addressing autoimmune triggers.',
  4
),
(
  'thyroglobulin_antibody',
  'Thyroglobulin Antibody (TgAb)',
  'Thyroid',
  'IU/mL',
  'Measures antibodies against thyroglobulin, a protein produced by the thyroid gland that is the precursor to thyroid hormones.',
  'Elevated thyroglobulin antibodies, like TPO antibodies, indicate autoimmune thyroid disease. They are also clinically important in thyroid cancer monitoring, where their presence can interfere with thyroglobulin tumor marker measurements.',
  'Autoimmune conditions, Genetics, Iodine intake, Thyroid cancer history, Gut health',
  'Normal: <40 IU/mL',
  'Thyroglobulin antibodies are present in about 20-25% of Hashimoto''s patients who are TPO-negative, making this marker useful for comprehensive autoimmune thyroid screening.',
  5
)
ON CONFLICT (biomarker_key) DO NOTHING;

-- ============================================================================
-- BLOOD SUGAR & METABOLISM
-- ============================================================================

INSERT INTO biomarker_library (biomarker_key, display_name, category, unit, what_it_measures, why_it_matters, influencing_factors, optimal_range_display, special_notes, sort_order)
VALUES
(
  'glucose',
  'Fasting Glucose',
  'Blood Sugar & Metabolism',
  'mg/dL',
  'Measures the concentration of glucose in the blood after a period of fasting, reflecting baseline blood sugar regulation.',
  'Fasting glucose is a fundamental screen for diabetes and prediabetes. Chronically elevated blood sugar damages blood vessels, nerves, and organs, and is a major driver of cardiovascular disease, kidney disease, and neuropathy.',
  'Diet, Fasting duration, Stress, Sleep, Medications (steroids, metformin), Illness, Exercise',
  'Optimal: 72-90 mg/dL; Normal: 70-99 mg/dL; Prediabetes: 100-125 mg/dL',
  'A single fasting glucose reading can be affected by acute stress or illness. Hemoglobin A1c provides a more reliable long-term picture of glucose control.',
  1
),
(
  'fasting_insulin',
  'Fasting Insulin',
  'Blood Sugar & Metabolism',
  'uIU/mL',
  'Measures the amount of insulin circulating in the blood after fasting, reflecting the pancreas''s baseline insulin output.',
  'Fasting insulin is one of the earliest markers of metabolic dysfunction. Elevated levels indicate insulin resistance, where the body must produce more insulin to maintain normal blood sugar, often years before glucose levels become abnormal.',
  'Diet, Body composition, Exercise, Sleep, Stress, Medications, Genetics',
  'Optimal: 2-6 uIU/mL; Lab reference: 2-25 uIU/mL',
  'Most standard lab reference ranges for fasting insulin are too broad to detect early insulin resistance. A level above 8-10 uIU/mL, even if "normal" by lab standards, warrants attention.',
  2
),
(
  'hemoglobin_a1c',
  'Hemoglobin A1c (HbA1c)',
  'Blood Sugar & Metabolism',
  '%',
  'Measures the percentage of hemoglobin proteins in red blood cells that have glucose attached, reflecting average blood sugar levels over the preceding 2-3 months.',
  'HbA1c provides a long-term view of glucose control that is not affected by day-to-day fluctuations. It is the gold standard for diagnosing and monitoring diabetes and is strongly correlated with cardiovascular and all-cause mortality risk.',
  'Red blood cell turnover, Anemia, Hemoglobin variants, Kidney disease, Pregnancy, Recent blood loss',
  'Optimal: 4.8-5.2%; Normal: <5.7%; Prediabetes: 5.7-6.4%; Diabetes: >=6.5%',
  'HbA1c can be falsely low in conditions with rapid red blood cell turnover (hemolytic anemia, recent blood loss) and falsely elevated with iron deficiency anemia or certain hemoglobin variants.',
  3
),
(
  'uric_acid',
  'Uric Acid',
  'Blood Sugar & Metabolism',
  'mg/dL',
  'Measures the level of uric acid in the blood, a waste product formed from the breakdown of purines found in certain foods and produced by the body.',
  'Elevated uric acid is best known for causing gout but is also an independent risk factor for cardiovascular disease, kidney disease, hypertension, and metabolic syndrome. It reflects fructose metabolism and purine turnover.',
  'Diet (red meat, shellfish, alcohol, fructose), Kidney function, Hydration, Medications (diuretics), Genetics, Cell turnover',
  'Optimal: 3.5-5.5 mg/dL; Males: <7.0 mg/dL; Females: <6.0 mg/dL',
  'Elevated uric acid is increasingly recognized as an early metabolic marker, not just a gout indicator. Reducing fructose and alcohol intake can meaningfully lower levels.',
  4
)
ON CONFLICT (biomarker_key) DO NOTHING;

-- ============================================================================
-- LIPIDS
-- ============================================================================

INSERT INTO biomarker_library (biomarker_key, display_name, category, unit, what_it_measures, why_it_matters, influencing_factors, optimal_range_display, special_notes, sort_order)
VALUES
(
  'total_cholesterol',
  'Total Cholesterol',
  'Lipids',
  'mg/dL',
  'Measures the total amount of cholesterol in the blood, including LDL, HDL, and VLDL fractions.',
  'Total cholesterol provides a broad overview of lipid status but has limited utility on its own. The ratio of total cholesterol to HDL and the individual lipoprotein particle counts are far more predictive of cardiovascular risk.',
  'Diet, Genetics, Thyroid function, Liver function, Medications (statins), Exercise, Body weight',
  'Desirable: <200 mg/dL; Borderline: 200-239 mg/dL; High: >=240 mg/dL',
  'Total cholesterol alone is a poor predictor of cardiovascular risk. Many heart attacks occur in people with "normal" total cholesterol. ApoB and LDL particle number are more informative.',
  1
),
(
  'ldl_cholesterol',
  'LDL Cholesterol',
  'Lipids',
  'mg/dL',
  'Measures low-density lipoprotein cholesterol, often called "bad" cholesterol, which carries cholesterol from the liver to the arteries.',
  'Elevated LDL cholesterol is a major driver of atherosclerotic cardiovascular disease. LDL particles penetrate and accumulate in artery walls, triggering inflammation and plaque formation over time.',
  'Diet (saturated fat, trans fat), Genetics, Thyroid function, Medications (statins), Body weight, Inflammation',
  'Optimal: <100 mg/dL; High risk individuals: <70 mg/dL',
  'Standard LDL is typically calculated (Friedewald equation), not directly measured, and can be inaccurate when triglycerides are elevated. Direct LDL or ApoB may be preferred in those cases.',
  2
),
(
  'hdl_cholesterol',
  'HDL Cholesterol',
  'Lipids',
  'mg/dL',
  'Measures high-density lipoprotein cholesterol, often called "good" cholesterol, which helps transport cholesterol away from artery walls back to the liver for disposal.',
  'Higher HDL levels are associated with reduced cardiovascular risk through reverse cholesterol transport and anti-inflammatory properties. However, extremely high HDL (>90 mg/dL) does not always confer additional protection and may indicate dysfunctional HDL particles.',
  'Exercise, Alcohol intake, Smoking, Genetics, Body weight, Diet, Medications',
  'Males: >40 mg/dL; Females: >50 mg/dL; Optimal: >60 mg/dL',
  'HDL function (cholesterol efflux capacity) matters more than HDL quantity. Pharmacologically raising HDL has not been shown to reduce cardiovascular events.',
  3
),
(
  'triglycerides',
  'Triglycerides',
  'Lipids',
  'mg/dL',
  'Measures the level of triglycerides in the blood, the most common type of fat, which the body uses for energy storage.',
  'Elevated triglycerides are a strong marker of metabolic dysfunction and insulin resistance. Very high levels (>500 mg/dL) increase the risk of acute pancreatitis. The triglyceride-to-HDL ratio is a useful surrogate for insulin resistance.',
  'Diet (carbohydrates, sugar, alcohol), Fasting state, Exercise, Medications, Thyroid function, Kidney disease, Genetics',
  'Optimal: <100 mg/dL; Normal: <150 mg/dL; High: >=200 mg/dL',
  'A triglyceride-to-HDL ratio above 2.0 suggests insulin resistance and increased small dense LDL particles. Triglycerides must be drawn fasting for accurate results.',
  4
),
(
  'vldl_cholesterol',
  'VLDL Cholesterol',
  'Lipids',
  'mg/dL',
  'Measures very low-density lipoprotein cholesterol, which is produced by the liver and carries triglycerides to tissues throughout the body.',
  'Elevated VLDL reflects increased triglyceride-rich lipoprotein production and contributes to atherosclerosis. It is a marker of metabolic syndrome and insulin resistance.',
  'Diet, Triglyceride levels, Insulin resistance, Alcohol, Liver function, Medications',
  'Normal: 5-30 mg/dL',
  'VLDL is typically estimated as triglycerides divided by 5. It is not directly measured in standard lipid panels.',
  5
),
(
  'apolipoprotein_b',
  'Apolipoprotein B (ApoB)',
  'Lipids',
  'mg/dL',
  'Measures the concentration of apolipoprotein B, a protein found on all atherogenic lipoproteins (LDL, VLDL, IDL, and Lp(a)), with one ApoB molecule per particle.',
  'ApoB is considered the single best measure of atherogenic particle burden and cardiovascular risk. It directly counts the number of potentially harmful lipoprotein particles, which is more predictive than cholesterol content alone.',
  'Diet, Genetics, Medications (statins), Thyroid function, Insulin resistance, Liver function',
  'Optimal: <80 mg/dL; Low risk: <90 mg/dL; High risk individuals: <60 mg/dL',
  'ApoB is increasingly recognized as superior to LDL-C for cardiovascular risk assessment. When LDL-C and ApoB are discordant, ApoB better predicts risk.',
  6
),
(
  'apolipoprotein_a1',
  'Apolipoprotein A1 (ApoA1)',
  'Lipids',
  'mg/dL',
  'Measures the primary protein component of HDL particles, which plays a central role in reverse cholesterol transport.',
  'ApoA1 reflects functional HDL particle concentration and anti-atherogenic capacity. Low ApoA1 levels are associated with increased cardiovascular risk. The ApoB/ApoA1 ratio is a strong predictor of heart disease.',
  'Exercise, Diet, Genetics, Smoking, Alcohol, Medications',
  'Males: 110-180 mg/dL; Females: 120-190 mg/dL',
  'The ApoB/ApoA1 ratio provides a comprehensive view of the balance between atherogenic and protective lipoproteins. A ratio below 0.7 is generally considered favorable.',
  7
),
(
  'lp_a',
  'Lipoprotein(a) [Lp(a)]',
  'Lipids',
  'nmol/L',
  'Measures the concentration of lipoprotein(a), a genetically determined LDL-like particle with an additional apolipoprotein(a) protein attached.',
  'Lp(a) is an independent, genetically determined risk factor for atherosclerotic cardiovascular disease, aortic valve stenosis, and thrombosis. Elevated levels substantially increase heart attack and stroke risk regardless of other lipid levels.',
  'Genetics (primary determinant), Kidney disease, Thyroid function, Menopause, Niacin',
  'Desirable: <75 nmol/L; High risk: >125 nmol/L',
  'Lp(a) is largely genetically fixed and does not respond to diet or exercise. It only needs to be tested once in a lifetime unless a specific intervention is being monitored. Currently, no FDA-approved therapy specifically targets Lp(a), though trials are ongoing.',
  8
)
ON CONFLICT (biomarker_key) DO NOTHING;

-- ============================================================================
-- VITAMINS & MINERALS
-- ============================================================================

INSERT INTO biomarker_library (biomarker_key, display_name, category, unit, what_it_measures, why_it_matters, influencing_factors, optimal_range_display, special_notes, sort_order)
VALUES
(
  'vitamin_d',
  'Vitamin D (25-Hydroxyvitamin D)',
  'Vitamins & Minerals',
  'ng/mL',
  'Measures 25-hydroxyvitamin D, the main circulating form of vitamin D, reflecting total vitamin D status from both sun exposure and dietary intake.',
  'Vitamin D is essential for calcium absorption, bone health, immune function, and mood regulation. Deficiency is extremely common and linked to increased risk of autoimmune disease, infections, depression, osteoporosis, and certain cancers.',
  'Sun exposure, Skin pigmentation, Latitude, Supplementation, Body fat percentage, Kidney function, Age, Absorption disorders',
  'Optimal: 50-80 ng/mL; Sufficient: 30-50 ng/mL; Deficient: <20 ng/mL',
  'Vitamin D is fat-soluble and should be taken with a meal containing fat for optimal absorption. Vitamin D3 (cholecalciferol) is preferred over D2 (ergocalciferol). Co-supplementation with vitamin K2 is recommended to direct calcium to bones rather than arteries.',
  1
),
(
  'vitamin_b12',
  'Vitamin B12 (Cobalamin)',
  'Vitamins & Minerals',
  'pg/mL',
  'Measures the level of vitamin B12, a water-soluble vitamin essential for red blood cell formation, neurological function, and DNA synthesis.',
  'B12 deficiency can cause irreversible neurological damage if left untreated, along with macrocytic anemia, fatigue, cognitive decline, and peripheral neuropathy. Deficiency is common in vegetarians/vegans, older adults, and those on metformin or acid-suppressing medications.',
  'Diet (animal products), Age, Medications (metformin, PPIs, H2 blockers), Pernicious anemia, Gut absorption, Vegetarian/vegan diet',
  'Optimal: 600-1000 pg/mL; Lab reference: 200-900 pg/mL',
  'Serum B12 can appear normal even with functional deficiency. Methylmalonic acid (MMA) is a more sensitive marker of true B12 status at the cellular level.',
  2
),
(
  'folate',
  'Folate (Vitamin B9)',
  'Vitamins & Minerals',
  'ng/mL',
  'Measures the level of folate (vitamin B9) in the blood, essential for DNA synthesis, cell division, and methylation reactions.',
  'Folate is critical for red blood cell production, neural tube development during pregnancy, and homocysteine metabolism. Deficiency causes macrocytic anemia and elevated homocysteine, increasing cardiovascular risk.',
  'Diet (leafy greens, legumes), MTHFR gene variants, Medications (methotrexate, phenytoin), Alcohol use, Pregnancy, Malabsorption',
  'Optimal: >10 ng/mL; Deficient: <3 ng/mL',
  'Individuals with MTHFR gene variants may benefit from methylfolate (5-MTHF) rather than folic acid. High-dose folic acid supplementation can mask B12 deficiency.',
  3
),
(
  'magnesium',
  'Magnesium',
  'Vitamins & Minerals',
  'mg/dL',
  'Measures serum magnesium levels. Magnesium is a cofactor in over 300 enzymatic reactions in the body, including energy production, muscle function, and nerve signaling.',
  'Magnesium is essential for muscle relaxation, sleep quality, blood pressure regulation, blood sugar control, and heart rhythm. Deficiency is very common but often underdiagnosed because serum levels represent less than 1% of total body magnesium stores.',
  'Diet, Stress, Medications (PPIs, diuretics), Alcohol, Diabetes, Intense exercise, GI disorders, Aging',
  'Optimal: 2.0-2.4 mg/dL; Lab reference: 1.7-2.2 mg/dL',
  'Serum magnesium is a poor indicator of total body magnesium status because most magnesium is stored in bones and cells. RBC magnesium is a more accurate measure. Symptoms of deficiency include muscle cramps, insomnia, anxiety, and heart palpitations.',
  4
)
ON CONFLICT (biomarker_key) DO NOTHING;

-- ============================================================================
-- INFLAMMATION
-- ============================================================================

INSERT INTO biomarker_library (biomarker_key, display_name, category, unit, what_it_measures, why_it_matters, influencing_factors, optimal_range_display, special_notes, sort_order)
VALUES
(
  'crp_hs',
  'High-Sensitivity C-Reactive Protein (hs-CRP)',
  'Inflammation',
  'mg/L',
  'Measures very low levels of C-reactive protein, an acute-phase reactant produced by the liver in response to systemic inflammation.',
  'hs-CRP is one of the best-studied inflammatory biomarkers for cardiovascular risk stratification. Chronic low-grade inflammation, as reflected by elevated hs-CRP, is a key driver of atherosclerosis, metabolic syndrome, and many chronic diseases.',
  'Infection, Chronic disease, Obesity, Smoking, Diet, Exercise, Sleep, Stress, Dental health, Medications (statins, NSAIDs)',
  'Low risk: <1.0 mg/L; Moderate risk: 1.0-3.0 mg/L; High risk: >3.0 mg/L',
  'A single reading above 10 mg/L usually indicates acute infection or inflammation and should be repeated after the acute process resolves. Two measurements 2 weeks apart are recommended for cardiovascular risk assessment.',
  1
),
(
  'esr',
  'Erythrocyte Sedimentation Rate (ESR)',
  'Inflammation',
  'mm/hr',
  'Measures the rate at which red blood cells settle to the bottom of a test tube over one hour, a nonspecific marker of inflammation.',
  'ESR is a general indicator of inflammation that can help detect and monitor autoimmune diseases, infections, and malignancies. While nonspecific, persistent elevation warrants further investigation.',
  'Age, Sex, Anemia, Pregnancy, Infections, Autoimmune disease, Malignancy, Obesity, Medications',
  'Males: <15 mm/hr; Females: <20 mm/hr (increases with age)',
  'ESR rises more slowly than CRP in response to inflammation and remains elevated longer after the inflammatory stimulus resolves. It is less specific than hs-CRP but useful for monitoring chronic inflammatory conditions.',
  2
),
(
  'homocysteine',
  'Homocysteine',
  'Inflammation',
  'umol/L',
  'Measures the level of homocysteine, a sulfur-containing amino acid produced during methionine metabolism that requires B vitamins (B12, folate, B6) for clearance.',
  'Elevated homocysteine is an independent risk factor for cardiovascular disease, stroke, blood clots, and cognitive decline. It reflects methylation capacity and B vitamin status, making it both a cardiovascular and a nutritional marker.',
  'B12 status, Folate status, B6 status, MTHFR gene variants, Kidney function, Medications (metformin, methotrexate), Age, Diet',
  'Optimal: <8 umol/L; Normal: <15 umol/L; Elevated: >15 umol/L',
  'Elevated homocysteine is often correctable with adequate B12, folate, and B6 supplementation. Individuals with MTHFR variants may require methylated forms of these vitamins (methylfolate, methylcobalamin).',
  3
)
ON CONFLICT (biomarker_key) DO NOTHING;

-- ============================================================================
-- LIVER FUNCTION
-- ============================================================================

INSERT INTO biomarker_library (biomarker_key, display_name, category, unit, what_it_measures, why_it_matters, influencing_factors, optimal_range_display, special_notes, sort_order)
VALUES
(
  'alt',
  'Alanine Aminotransferase (ALT)',
  'Liver Function',
  'U/L',
  'Measures the level of the enzyme ALT, found predominantly in liver cells, which is released into the bloodstream when liver cells are damaged.',
  'ALT is the most liver-specific transaminase and is a primary marker for hepatocellular injury. Elevations suggest liver cell damage from fatty liver disease, hepatitis, medications, alcohol, or other causes.',
  'Alcohol, Medications (statins, acetaminophen, NSAIDs), Non-alcoholic fatty liver disease, Body weight, Exercise intensity, Hepatitis, Supplements',
  'Optimal: <25 U/L; Lab reference: 7-56 U/L',
  'Even mildly elevated ALT within the lab''s "normal" range (e.g., 30-40 U/L) may indicate early fatty liver disease. Recent evidence supports lower optimal thresholds than traditional reference ranges.',
  1
),
(
  'ast',
  'Aspartate Aminotransferase (AST)',
  'Liver Function',
  'U/L',
  'Measures the level of the enzyme AST, found in the liver, heart, muscle, and other tissues, which is released when these cells are damaged.',
  'AST is less liver-specific than ALT because it is also present in muscle and heart tissue. However, the AST/ALT ratio can help distinguish different liver conditions. An AST/ALT ratio greater than 2 suggests alcoholic liver disease.',
  'Alcohol, Medications, Exercise (muscle damage), Heart disease, Liver disease, Hemolysis, Supplements',
  'Optimal: <25 U/L; Lab reference: 10-40 U/L',
  'Intense exercise can cause temporary AST elevation due to muscle damage. If AST is elevated but ALT is normal, consider non-hepatic sources such as skeletal muscle injury or cardiac damage.',
  2
),
(
  'alkaline_phosphatase',
  'Alkaline Phosphatase (ALP)',
  'Liver Function',
  'U/L',
  'Measures the enzyme alkaline phosphatase, present in the liver, bile ducts, bone, kidneys, and intestines.',
  'ALP is primarily used to evaluate bile duct obstruction and liver cholestasis. Elevated levels can also indicate bone disease (Paget''s disease, hyperparathyroidism) or growth in adolescents.',
  'Bone growth, Pregnancy, Bile duct obstruction, Liver disease, Vitamin D deficiency, Medications, Age',
  'Adults: 44-147 U/L',
  'ALP is naturally elevated in growing children and adolescents, during pregnancy, and after bone fractures. If elevated, GGT can help determine whether the source is hepatic or non-hepatic.',
  3
),
(
  'total_bilirubin',
  'Total Bilirubin',
  'Liver Function',
  'mg/dL',
  'Measures the total amount of bilirubin in the blood, a yellow pigment produced from the breakdown of hemoglobin in red blood cells and processed by the liver.',
  'Elevated bilirubin can indicate liver dysfunction, bile duct obstruction, or excessive red blood cell destruction (hemolysis). Mildly elevated levels are common in Gilbert''s syndrome, a benign genetic condition affecting about 5-10% of the population.',
  'Liver function, Red blood cell turnover, Bile duct obstruction, Gilbert''s syndrome, Fasting, Medications, Neonatal status',
  'Normal: 0.1-1.2 mg/dL',
  'Mild unconjugated hyperbilirubinemia (1.2-3.0 mg/dL) in otherwise healthy individuals is usually Gilbert''s syndrome. Interestingly, mildly elevated bilirubin from Gilbert''s may have antioxidant and cardiovascular protective effects.',
  4
),
(
  'albumin',
  'Albumin',
  'Liver Function',
  'g/dL',
  'Measures the most abundant protein in the blood, produced by the liver, which maintains fluid balance, transports hormones and nutrients, and acts as an antioxidant.',
  'Albumin is a marker of liver synthetic function and nutritional status. Low albumin can indicate chronic liver disease, malnutrition, kidney disease (nephrotic syndrome), or chronic inflammation.',
  'Liver function, Nutrition, Hydration, Inflammation, Kidney disease, Burns, Pregnancy, Age',
  'Optimal: 4.2-5.0 g/dL; Lab reference: 3.5-5.5 g/dL',
  'Albumin has a long half-life (about 20 days), so it reflects chronic rather than acute changes. Low albumin is a strong predictor of poor outcomes in hospitalized patients and is associated with increased mortality risk.',
  5
),
(
  'total_protein',
  'Total Protein',
  'Liver Function',
  'g/dL',
  'Measures the combined amount of albumin and globulin proteins in the blood.',
  'Total protein provides a general overview of nutritional status and can help identify conditions affecting protein levels, including liver disease, kidney disease, immune disorders, and malnutrition.',
  'Liver function, Nutrition, Hydration, Immune function, Kidney disease, Inflammation',
  'Normal: 6.0-8.3 g/dL',
  'The albumin-to-globulin ratio (A/G ratio) derived from total protein and albumin can provide additional diagnostic information. A low ratio may suggest chronic inflammation, liver disease, or immune disorders.',
  6
),
(
  'ggt',
  'Gamma-Glutamyl Transferase (GGT)',
  'Liver Function',
  'U/L',
  'Measures the enzyme GGT, found primarily in liver and bile duct cells, which is involved in glutathione metabolism and amino acid transport.',
  'GGT is a sensitive marker for bile duct obstruction and alcohol-related liver damage. It is also emerging as an independent predictor of cardiovascular disease, metabolic syndrome, and oxidative stress.',
  'Alcohol consumption, Medications, Bile duct disease, Obesity, Diabetes, Smoking, Liver disease',
  'Optimal: <25 U/L; Males: 8-61 U/L; Females: 5-36 U/L',
  'GGT is particularly useful for differentiating the source of an elevated ALP (hepatic vs. bone). It is also one of the most sensitive indicators of excessive alcohol consumption.',
  7
)
ON CONFLICT (biomarker_key) DO NOTHING;

-- ============================================================================
-- KIDNEY FUNCTION
-- ============================================================================

INSERT INTO biomarker_library (biomarker_key, display_name, category, unit, what_it_measures, why_it_matters, influencing_factors, optimal_range_display, special_notes, sort_order)
VALUES
(
  'creatinine',
  'Creatinine',
  'Kidney Function',
  'mg/dL',
  'Measures the level of creatinine, a waste product produced at a constant rate from normal muscle metabolism (breakdown of creatine phosphate), filtered by the kidneys.',
  'Creatinine is the primary marker used to estimate kidney filtration rate (eGFR). Rising creatinine levels indicate declining kidney function, which can result from dehydration, medications, kidney disease, or reduced blood flow to the kidneys.',
  'Muscle mass, Diet (creatine supplements, high protein), Hydration, Medications (ACE inhibitors, NSAIDs), Exercise, Age, Sex',
  'Males: 0.7-1.2 mg/dL; Females: 0.5-1.0 mg/dL',
  'Creatinine is influenced by muscle mass, so very muscular individuals may have higher levels without kidney disease, while elderly or low-muscle-mass patients may have falsely normal levels despite impaired kidney function.',
  1
),
(
  'bun',
  'Blood Urea Nitrogen (BUN)',
  'Kidney Function',
  'mg/dL',
  'Measures the amount of urea nitrogen in the blood, a waste product formed from protein metabolism in the liver and excreted by the kidneys.',
  'BUN reflects kidney function, hydration status, and protein metabolism. Elevated BUN can indicate kidney dysfunction, dehydration, high protein diet, or gastrointestinal bleeding.',
  'Hydration, Protein intake, Kidney function, Liver function, GI bleeding, Medications, Heart failure',
  'Normal: 7-20 mg/dL',
  'BUN is less specific for kidney function than creatinine because it is also affected by protein intake, liver function, and hydration status. The BUN-to-creatinine ratio helps distinguish prerenal causes (dehydration) from intrinsic kidney disease.',
  2
),
(
  'egfr',
  'Estimated Glomerular Filtration Rate (eGFR)',
  'Kidney Function',
  'mL/min/1.73m2',
  'Estimates how efficiently the kidneys filter waste from the blood, calculated from creatinine levels adjusted for age, sex, and race.',
  'eGFR is the most widely used measure of kidney function and is used to stage chronic kidney disease. Early detection of declining eGFR allows for interventions to slow progression and protect kidney health.',
  'Age, Muscle mass, Hydration, Medications, Acute illness, Diet, Race',
  'Normal: >90 mL/min/1.73m2; Mild decrease: 60-89; Moderate decrease: 30-59; Severe decrease: 15-29',
  'The CKD-EPI 2021 equation (race-free) is now recommended over older equations. A sustained eGFR below 60 on two measurements at least 3 months apart defines chronic kidney disease.',
  3
),
(
  'bun_creatinine_ratio',
  'BUN/Creatinine Ratio',
  'Kidney Function',
  NULL,
  'Calculates the ratio of blood urea nitrogen to creatinine, helping to differentiate between various causes of kidney dysfunction.',
  'This ratio helps distinguish prerenal azotemia (dehydration, heart failure) from intrinsic kidney disease. A high ratio suggests a prerenal cause, while a normal ratio with elevated values suggests intrinsic kidney damage.',
  'Hydration, Protein intake, GI bleeding, Heart failure, Kidney disease, Medications',
  'Normal: 10:1 to 20:1',
  'A ratio greater than 20:1 with elevated BUN suggests prerenal causes such as dehydration or reduced kidney perfusion. A ratio less than 10:1 may indicate liver disease or low protein intake.',
  4
)
ON CONFLICT (biomarker_key) DO NOTHING;

-- ============================================================================
-- ELECTROLYTES
-- ============================================================================

INSERT INTO biomarker_library (biomarker_key, display_name, category, unit, what_it_measures, why_it_matters, influencing_factors, optimal_range_display, special_notes, sort_order)
VALUES
(
  'sodium',
  'Sodium',
  'Electrolytes',
  'mEq/L',
  'Measures the concentration of sodium in the blood, the major extracellular cation responsible for maintaining fluid balance and blood pressure.',
  'Sodium is critical for nerve impulse transmission, muscle contraction, and fluid homeostasis. Abnormal sodium levels can cause neurological symptoms ranging from confusion and fatigue to seizures and coma in severe cases.',
  'Hydration, Medications (diuretics, ACE inhibitors), Kidney function, Adrenal function, Heart failure, Diet, Sweating, Vomiting/diarrhea',
  'Normal: 136-145 mEq/L',
  'Hyponatremia (low sodium) is the most common electrolyte abnormality and is frequently caused by medications (thiazide diuretics, SSRIs) or excessive water intake. Rapid correction of severe hyponatremia can cause osmotic demyelination syndrome.',
  1
),
(
  'potassium',
  'Potassium',
  'Electrolytes',
  'mEq/L',
  'Measures the concentration of potassium in the blood, the major intracellular cation essential for cellular function, especially in nerve and muscle cells.',
  'Potassium is critical for normal heart rhythm, muscle contraction, and nerve function. Both hypokalemia (low) and hyperkalemia (high) can cause dangerous cardiac arrhythmias and must be managed carefully.',
  'Diet, Medications (ACE inhibitors, ARBs, diuretics, potassium supplements), Kidney function, Acid-base status, Insulin, Adrenal function',
  'Normal: 3.5-5.0 mEq/L',
  'Hemolyzed blood samples (from difficult blood draws or improper handling) can cause falsely elevated potassium. If hyperkalemia is unexpected, repeat the test before initiating treatment.',
  2
),
(
  'chloride',
  'Chloride',
  'Electrolytes',
  'mEq/L',
  'Measures the concentration of chloride, a negatively charged electrolyte that works with sodium to maintain fluid balance and acid-base equilibrium.',
  'Chloride abnormalities usually parallel sodium changes and help evaluate acid-base disturbances. Elevated chloride with normal sodium may indicate a non-anion gap metabolic acidosis.',
  'Hydration, Medications (diuretics), Kidney function, Acid-base status, Vomiting/diarrhea, Diet',
  'Normal: 98-106 mEq/L',
  'Chloride is essential for calculating the anion gap, which helps identify the cause of metabolic acidosis. It typically moves inversely with bicarbonate.',
  3
),
(
  'co2',
  'Carbon Dioxide (CO2/Bicarbonate)',
  'Electrolytes',
  'mEq/L',
  'Measures total CO2 content in the blood, primarily reflecting bicarbonate levels, which is the major blood buffer maintaining acid-base balance.',
  'Bicarbonate is essential for maintaining blood pH in the normal range. Low levels may indicate metabolic acidosis (from kidney disease, diabetic ketoacidosis, or lactic acidosis), while high levels suggest metabolic alkalosis (from vomiting or diuretic use).',
  'Kidney function, Lung function, Vomiting, Diarrhea, Medications (diuretics), Diabetes, Dehydration',
  'Normal: 23-29 mEq/L',
  'CO2 on a basic metabolic panel represents total CO2 (mostly bicarbonate), not dissolved carbon dioxide gas. It is a venous measurement and differs from arterial blood gas values.',
  4
),
(
  'calcium',
  'Calcium',
  'Electrolytes',
  'mg/dL',
  'Measures total calcium in the blood, which includes both protein-bound (mostly to albumin) and free ionized (biologically active) forms.',
  'Calcium is essential for bone health, muscle contraction, nerve function, blood clotting, and heart rhythm. Abnormal calcium levels can indicate parathyroid dysfunction, vitamin D deficiency, kidney disease, or malignancy.',
  'Parathyroid function, Vitamin D status, Albumin levels, Kidney function, Medications, Diet, Malignancy',
  'Normal: 8.5-10.5 mg/dL; Corrected for albumin if albumin is abnormal',
  'Total calcium must be interpreted with albumin levels. For every 1 g/dL decrease in albumin below 4.0, add 0.8 mg/dL to the measured calcium (corrected calcium). Ionized calcium is the most accurate measure of true calcium status.',
  5
)
ON CONFLICT (biomarker_key) DO NOTHING;

-- ============================================================================
-- COMPLETE BLOOD COUNT
-- ============================================================================

INSERT INTO biomarker_library (biomarker_key, display_name, category, unit, what_it_measures, why_it_matters, influencing_factors, optimal_range_display, special_notes, sort_order)
VALUES
(
  'wbc',
  'White Blood Cell Count (WBC)',
  'Complete Blood Count',
  'K/uL',
  'Measures the total number of white blood cells (leukocytes) in the blood, which are the primary cells of the immune system.',
  'WBC count reflects the overall activity of the immune system. Elevated WBC can indicate infection, inflammation, stress, or leukemia. Low WBC may indicate bone marrow suppression, autoimmune conditions, or certain infections.',
  'Infection, Stress, Medications (steroids, chemotherapy), Autoimmune disease, Smoking, Exercise, Pregnancy',
  'Normal: 4.5-11.0 K/uL',
  'Mild elevation (11-15 K/uL) is often caused by physiological stress, smoking, or corticosteroid use rather than infection. Persistently elevated or very low WBC warrants further evaluation with a differential.',
  1
),
(
  'rbc',
  'Red Blood Cell Count (RBC)',
  'Complete Blood Count',
  'M/uL',
  'Measures the total number of red blood cells (erythrocytes) in the blood, which carry oxygen from the lungs to all tissues.',
  'RBC count helps evaluate anemia, polycythemia, and bone marrow function. Low counts indicate anemia, while high counts may indicate polycythemia vera, dehydration, or chronic hypoxia.',
  'Iron status, B12/folate status, Kidney function (EPO), Altitude, Dehydration, Testosterone, Bone marrow health',
  'Males: 4.5-5.5 M/uL; Females: 4.0-5.0 M/uL',
  'RBC count alone does not define anemia; it must be interpreted alongside hemoglobin, hematocrit, and red cell indices (MCV, MCH, MCHC) for proper classification.',
  2
),
(
  'hemoglobin',
  'Hemoglobin (Hgb)',
  'Complete Blood Count',
  'g/dL',
  'Measures the concentration of hemoglobin, the iron-containing protein in red blood cells that binds and transports oxygen throughout the body.',
  'Hemoglobin is the primary metric for diagnosing anemia and polycythemia. Low hemoglobin impairs oxygen delivery, causing fatigue, shortness of breath, and poor exercise tolerance. Elevated hemoglobin increases blood viscosity and clot risk.',
  'Iron status, B12/folate status, Chronic disease, Blood loss, Kidney function, Testosterone therapy, Altitude, Hydration',
  'Males: 13.5-17.5 g/dL; Females: 12.0-16.0 g/dL',
  'Men on testosterone replacement therapy require regular hemoglobin monitoring, as testosterone stimulates erythropoiesis and can cause polycythemia (hemoglobin >17.5 g/dL), increasing thrombotic risk.',
  3
),
(
  'hematocrit',
  'Hematocrit (Hct)',
  'Complete Blood Count',
  '%',
  'Measures the percentage of blood volume occupied by red blood cells, providing a ratio of red cells to total blood volume.',
  'Hematocrit mirrors hemoglobin in clinical utility and is used to assess anemia, dehydration, and polycythemia. It is particularly important to monitor in patients on testosterone therapy to detect excessive red blood cell production.',
  'Iron status, Hydration, Testosterone therapy, Altitude, Blood loss, Kidney function, Bone marrow function',
  'Males: 38.3-48.6%; Females: 35.5-44.9%',
  'Hematocrit above 54% in men on TRT is a threshold often used to consider dose reduction or therapeutic phlebotomy due to increased risk of blood clots and stroke.',
  4
),
(
  'mcv',
  'Mean Corpuscular Volume (MCV)',
  'Complete Blood Count',
  'fL',
  'Measures the average size of individual red blood cells, expressed in femtoliters.',
  'MCV is essential for classifying anemia. Low MCV (microcytic) suggests iron deficiency or thalassemia. High MCV (macrocytic) suggests B12 or folate deficiency, alcohol use, or thyroid dysfunction. Normal MCV (normocytic) may indicate chronic disease or acute blood loss.',
  'Iron status, B12/folate status, Alcohol use, Thyroid function, Liver disease, Medications (methotrexate, hydroxyurea), Reticulocyte count',
  'Normal: 80-100 fL',
  'MCV is one of the most useful red cell indices for narrowing the differential diagnosis of anemia. Combined with RDW, it provides a powerful classification framework.',
  5
),
(
  'mch',
  'Mean Corpuscular Hemoglobin (MCH)',
  'Complete Blood Count',
  'pg',
  'Measures the average amount of hemoglobin contained in a single red blood cell.',
  'MCH parallels MCV and helps classify anemias. Low MCH indicates hypochromic red cells (iron deficiency), while high MCH indicates hyperchromic cells (B12/folate deficiency).',
  'Iron status, B12/folate status, Thalassemia, Chronic disease',
  'Normal: 27-33 pg',
  'MCH generally tracks with MCV and provides complementary information. It is calculated by dividing hemoglobin by RBC count.',
  6
),
(
  'mchc',
  'Mean Corpuscular Hemoglobin Concentration (MCHC)',
  'Complete Blood Count',
  'g/dL',
  'Measures the average concentration of hemoglobin in a given volume of red blood cells.',
  'MCHC reflects hemoglobin concentration within red cells. Low MCHC confirms hypochromic anemias (iron deficiency), while elevated MCHC is seen in hereditary spherocytosis and some hemolytic anemias.',
  'Iron status, Hereditary spherocytosis, Cold agglutinins, Lipemia (can cause false elevation)',
  'Normal: 31-37 g/dL',
  'MCHC is the least variable of the red cell indices. Values above 37 g/dL should prompt consideration of spherocytosis or a specimen issue (lipemia, cold agglutinins).',
  7
),
(
  'rdw',
  'Red Cell Distribution Width (RDW)',
  'Complete Blood Count',
  '%',
  'Measures the variation in size (anisocytosis) among red blood cells, expressed as a coefficient of variation of the MCV.',
  'RDW helps differentiate causes of anemia and is an emerging marker of overall health. Elevated RDW is independently associated with increased cardiovascular mortality and all-cause mortality, even in the absence of anemia.',
  'Iron deficiency, B12/folate deficiency, Mixed anemias, Chronic inflammation, Cardiovascular disease, Recent transfusion',
  'Normal: 11.5-14.5%',
  'RDW is elevated early in iron deficiency (before MCV drops) and in combined deficiencies. An elevated RDW with a normal CBC may warrant further investigation as a marker of subclinical disease.',
  8
),
(
  'platelets',
  'Platelet Count',
  'Complete Blood Count',
  'K/uL',
  'Measures the number of platelets (thrombocytes) in the blood, which are cell fragments essential for blood clotting and wound repair.',
  'Platelet count is critical for assessing bleeding and clotting risk. Low platelets (thrombocytopenia) increase bleeding risk, while high platelets (thrombocytosis) may increase clotting risk or indicate an underlying inflammatory or myeloproliferative condition.',
  'Bone marrow function, Liver disease, Autoimmune conditions, Medications (heparin, chemotherapy), Infections, Spleen size, Alcohol',
  'Normal: 150-400 K/uL',
  'Pseudothrombocytopenia (falsely low count due to platelet clumping in EDTA tubes) should be ruled out before pursuing a workup for true thrombocytopenia. A citrate tube can confirm the true count.',
  9
),
(
  'neutrophils_percent',
  'Neutrophils (%)',
  'Complete Blood Count',
  '%',
  'Measures the percentage of white blood cells that are neutrophils, the most abundant type of WBC and the first responders to bacterial infections.',
  'Neutrophils are the primary defense against bacterial infections. Elevated percentages suggest bacterial infection or acute inflammation, while low levels increase susceptibility to infections.',
  'Infection, Stress, Medications (steroids, chemotherapy), Autoimmune disease, Bone marrow function',
  'Normal: 40-60%',
  NULL,
  10
),
(
  'lymphocytes_percent',
  'Lymphocytes (%)',
  'Complete Blood Count',
  '%',
  'Measures the percentage of white blood cells that are lymphocytes, which include T cells, B cells, and NK cells responsible for adaptive immunity.',
  'Lymphocyte percentage helps evaluate viral infections, chronic infections, immune deficiency, and lymphoproliferative disorders. Elevated levels are common with viral infections, while low levels may indicate immunosuppression.',
  'Viral infections, HIV, Autoimmune disease, Medications (steroids, chemotherapy), Stress, Chronic illness',
  'Normal: 20-40%',
  NULL,
  11
),
(
  'monocytes_percent',
  'Monocytes (%)',
  'Complete Blood Count',
  '%',
  'Measures the percentage of white blood cells that are monocytes, which mature into macrophages in tissues and play a role in chronic inflammation and immune regulation.',
  'Elevated monocytes may indicate chronic infection, inflammatory conditions, or recovery from acute infection. They are part of the innate immune system and bridge to the adaptive immune response.',
  'Chronic infections, Autoimmune disease, Recovery phase of acute infection, Malignancy, Medications',
  'Normal: 2-8%',
  NULL,
  12
),
(
  'eosinophils_percent',
  'Eosinophils (%)',
  'Complete Blood Count',
  '%',
  'Measures the percentage of white blood cells that are eosinophils, which are involved in allergic responses and parasitic defense.',
  'Elevated eosinophils suggest allergic conditions (asthma, hay fever, eczema), parasitic infections, drug reactions, or eosinophilic disorders. They are also elevated in some autoimmune and malignant conditions.',
  'Allergies, Asthma, Parasitic infections, Drug reactions, Autoimmune disease, Adrenal insufficiency',
  'Normal: 1-4%',
  NULL,
  13
),
(
  'basophils_percent',
  'Basophils (%)',
  'Complete Blood Count',
  '%',
  'Measures the percentage of white blood cells that are basophils, the least common WBC type, involved in allergic and inflammatory responses through histamine release.',
  'Basophils play a role in allergic reactions and hypersensitivity. Significant elevations are rare and may indicate myeloproliferative disorders, hypothyroidism, or chronic inflammation.',
  'Allergic reactions, Myeloproliferative disorders, Hypothyroidism, Chronic inflammation, Medications',
  'Normal: 0-1%',
  NULL,
  14
),
(
  'neutrophils_absolute',
  'Neutrophils (Absolute)',
  'Complete Blood Count',
  'K/uL',
  'Measures the absolute number of neutrophils per microliter of blood, providing a more clinically meaningful count than percentage alone.',
  'Absolute neutrophil count (ANC) is the standard for assessing neutrophil status. An ANC below 1.5 K/uL defines neutropenia, and below 0.5 K/uL is severe neutropenia with high infection risk.',
  'Infection, Stress, Medications (steroids, chemotherapy), Autoimmune disease, Bone marrow function',
  'Normal: 1.8-7.7 K/uL',
  'ANC is the critical metric for managing chemotherapy patients and evaluating febrile neutropenia. It is calculated as WBC multiplied by neutrophil percentage.',
  15
),
(
  'lymphocytes_absolute',
  'Lymphocytes (Absolute)',
  'Complete Blood Count',
  'K/uL',
  'Measures the absolute number of lymphocytes per microliter of blood.',
  'Absolute lymphocyte count is more clinically reliable than percentage for evaluating immune status. Lymphopenia (<1.0 K/uL) is associated with increased infection risk and may indicate immunosuppression.',
  'Viral infections, HIV, Autoimmune disease, Medications (steroids, chemotherapy), Stress, Chronic illness',
  'Normal: 1.0-4.8 K/uL',
  'Persistent absolute lymphopenia warrants evaluation for HIV, autoimmune disease, or other causes of immunosuppression.',
  16
),
(
  'monocytes_absolute',
  'Monocytes (Absolute)',
  'Complete Blood Count',
  'K/uL',
  'Measures the absolute number of monocytes per microliter of blood.',
  'Absolute monocyte count helps assess chronic infections, inflammatory states, and hematologic conditions. Persistent monocytosis may indicate chronic infection, autoimmune disease, or myelodysplastic/myeloproliferative disorders.',
  'Chronic infections, Autoimmune disease, Recovery phase of acute infection, Malignancy, Medications',
  'Normal: 0.2-0.8 K/uL',
  NULL,
  17
),
(
  'eosinophils_absolute',
  'Eosinophils (Absolute)',
  'Complete Blood Count',
  'K/uL',
  'Measures the absolute number of eosinophils per microliter of blood.',
  'Absolute eosinophil count is preferred over percentage for diagnosing eosinophilic conditions. Counts above 0.5 K/uL define eosinophilia, and above 1.5 K/uL defines hypereosinophilia, which may cause organ damage.',
  'Allergies, Asthma, Parasitic infections, Drug reactions, Autoimmune disease, Adrenal insufficiency',
  'Normal: 0.0-0.4 K/uL',
  'Hypereosinophilia (>1.5 K/uL) requires evaluation for organ involvement and may need treatment to prevent eosinophilic tissue damage.',
  18
),
(
  'basophils_absolute',
  'Basophils (Absolute)',
  'Complete Blood Count',
  'K/uL',
  'Measures the absolute number of basophils per microliter of blood.',
  'Elevated absolute basophil count is uncommon and may suggest myeloproliferative neoplasms (especially chronic myeloid leukemia), severe allergic reactions, or hypothyroidism.',
  'Allergic reactions, Myeloproliferative disorders, Hypothyroidism, Chronic inflammation, Medications',
  'Normal: 0.0-0.1 K/uL',
  'Basophilia is rare and when persistent should prompt evaluation for myeloproliferative disorders, particularly if accompanied by other CBC abnormalities.',
  19
)
ON CONFLICT (biomarker_key) DO NOTHING;

-- ============================================================================
-- IRON STUDIES
-- ============================================================================

INSERT INTO biomarker_library (biomarker_key, display_name, category, unit, what_it_measures, why_it_matters, influencing_factors, optimal_range_display, special_notes, sort_order)
VALUES
(
  'iron',
  'Serum Iron',
  'Iron Studies',
  'mcg/dL',
  'Measures the amount of circulating iron in the blood that is bound to transferrin, the primary iron transport protein.',
  'Serum iron reflects current iron availability for red blood cell production and metabolic functions. However, it fluctuates significantly throughout the day and with meals, making it less reliable than ferritin for assessing overall iron stores.',
  'Diet, Time of day, Recent meals, Iron supplementation, Inflammation, Liver disease, Menstruation, GI blood loss',
  'Males: 65-175 mcg/dL; Females: 50-170 mcg/dL',
  'Serum iron has significant diurnal variation (highest in the morning) and day-to-day variability. It should always be interpreted alongside ferritin, TIBC, and iron saturation rather than in isolation.',
  1
),
(
  'tibc',
  'Total Iron-Binding Capacity (TIBC)',
  'Iron Studies',
  'mcg/dL',
  'Measures the total capacity of transferrin in the blood to bind iron, reflecting the body''s ability to transport iron.',
  'TIBC is inversely related to iron stores: it increases when iron stores are depleted (the body makes more transferrin to capture available iron) and decreases with iron overload or chronic inflammation.',
  'Iron status, Liver function, Inflammation, Malnutrition, Pregnancy, Chronic disease',
  'Normal: 250-370 mcg/dL',
  'High TIBC with low serum iron is the classic pattern of iron deficiency anemia. Low TIBC with normal or high serum iron suggests iron overload or anemia of chronic disease.',
  2
),
(
  'iron_saturation',
  'Iron Saturation (Transferrin Saturation)',
  'Iron Studies',
  '%',
  'Measures the percentage of transferrin binding sites that are occupied by iron, calculated as serum iron divided by TIBC.',
  'Iron saturation provides a more complete picture than serum iron alone. Low saturation indicates iron deficiency, while consistently elevated saturation (>45%) suggests iron overload and warrants evaluation for hemochromatosis.',
  'Iron status, Inflammation, Liver disease, Hemochromatosis, Diet, Time of day',
  'Normal: 20-50%; Optimal: 25-45%',
  'Fasting morning samples are preferred for accuracy. Iron saturation above 45% on repeated testing should prompt genetic testing for hereditary hemochromatosis (HFE gene mutations).',
  3
),
(
  'ferritin',
  'Ferritin',
  'Iron Studies',
  'ng/mL',
  'Measures the level of ferritin, the primary intracellular iron storage protein, which reflects total body iron stores.',
  'Ferritin is the most sensitive and specific single test for iron deficiency. However, it is also an acute-phase reactant that rises with inflammation, infection, and liver disease, which can mask underlying iron deficiency.',
  'Iron status, Inflammation, Infection, Liver disease, Alcohol, Malignancy, Thyroid function, Hemochromatosis, Menstruation',
  'Optimal: Males 50-200 ng/mL; Females 50-150 ng/mL; Deficient: <30 ng/mL',
  'A ferritin below 30 ng/mL is diagnostic of iron deficiency regardless of hemoglobin. In the setting of inflammation (elevated CRP), a ferritin below 100 ng/mL may still represent functional iron deficiency. Very high ferritin (>500 ng/mL) warrants evaluation for hemochromatosis, liver disease, or other causes.',
  4
)
ON CONFLICT (biomarker_key) DO NOTHING;

-- ============================================================================
-- PROSTATE
-- ============================================================================

INSERT INTO biomarker_library (biomarker_key, display_name, category, unit, what_it_measures, why_it_matters, influencing_factors, optimal_range_display, special_notes, sort_order)
VALUES
(
  'psa_total',
  'Prostate-Specific Antigen (PSA Total)',
  'Prostate',
  'ng/mL',
  'Measures the total amount of prostate-specific antigen in the blood, a protein produced exclusively by prostate gland cells.',
  'PSA is the primary screening biomarker for prostate cancer, though it is not cancer-specific. Elevated PSA can result from prostate cancer, benign prostatic hyperplasia (BPH), prostatitis, recent ejaculation, or vigorous exercise. It is also important to monitor in men on testosterone therapy.',
  'Age, Prostate size, BPH, Prostatitis, Recent ejaculation, Vigorous exercise, Medications (finasteride, dutasteride), Testosterone therapy, Prostate procedures',
  'Age-dependent; Generally <4.0 ng/mL; Optimal: <1.0 ng/mL for men under 50',
  '5-alpha reductase inhibitors (finasteride, dutasteride) reduce PSA by approximately 50%, so the measured value should be doubled for accurate interpretation. PSA velocity (rate of change over time) may be more informative than a single value.',
  1
),
(
  'psa_free',
  'Free PSA (% Free PSA)',
  'Prostate',
  '%',
  'Measures the percentage of total PSA that circulates in an unbound (free) form, as opposed to being complexed with proteins.',
  'Free PSA percentage helps distinguish between prostate cancer and benign prostate conditions when total PSA is in the borderline range (4-10 ng/mL). A lower free PSA percentage is associated with a higher probability of prostate cancer.',
  'Prostate cancer, BPH, Prostatitis, Age, Total PSA level',
  'Higher is generally better; Free PSA >25% suggests BPH; <10% increases cancer suspicion',
  'Free PSA is most clinically useful when total PSA is between 4 and 10 ng/mL (the "diagnostic gray zone"). It helps guide decisions about whether to proceed with prostate biopsy. Free PSA is less stable than total PSA and samples should be processed promptly.',
  2
)
ON CONFLICT (biomarker_key) DO NOTHING;

-- ============================================================================
-- Create index for category-based lookups and sorting
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_biomarker_library_category
  ON biomarker_library (category, sort_order);

CREATE INDEX IF NOT EXISTS idx_biomarker_library_key
  ON biomarker_library (biomarker_key);
