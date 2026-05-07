#!/usr/bin/env python3
"""Lab Panels Guide — Essential, Elite, and Add-On panels for front desk binder."""

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table,
                                 TableStyle, HRFlowable, PageBreak, KeepTogether)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
import os

BLACK      = HexColor('#0A0A0A')
DARK_GRAY  = HexColor('#1A1A1A')
MID_GRAY   = HexColor('#606060')
LIGHT_GRAY = HexColor('#F4F4F4')
RULE_GRAY  = HexColor('#DDDDDD')
WHITE      = HexColor('#FFFFFF')
GREEN      = HexColor('#2E6B35')
ACCENT     = HexColor('#1e3a5f')
W = 7.0 * inch

def st(name, **kw):
    return ParagraphStyle(name, **kw)

clinic_s    = st('Clinic', fontName='Helvetica-Bold',    fontSize=13,  textColor=BLACK,     leading=16)
contact_s   = st('Cont',   fontName='Helvetica',         fontSize=8,   textColor=MID_GRAY,  leading=12, alignment=TA_RIGHT)
title_s     = st('Title',  fontName='Helvetica-Bold',    fontSize=17,  textColor=BLACK,     leading=21, spaceAfter=2)
subtitle_s  = st('Sub',    fontName='Helvetica-Oblique', fontSize=9.5, textColor=MID_GRAY,  leading=13)
sec_s       = st('Sec',    fontName='Helvetica-Bold',    fontSize=8,   textColor=MID_GRAY,  leading=11, spaceBefore=14, spaceAfter=3)
body_s      = st('Body',   fontName='Helvetica',         fontSize=9.5, textColor=DARK_GRAY, leading=16, spaceAfter=0)
body_sm_s   = st('BodySm', fontName='Helvetica',         fontSize=8.5, textColor=MID_GRAY,  leading=13, spaceAfter=0)
bullet_s    = st('Bul',    fontName='Helvetica',         fontSize=9.5, textColor=DARK_GRAY, leading=16, leftIndent=14, firstLineIndent=-10, spaceAfter=2)
sub_s       = st('SubH',   fontName='Helvetica-Bold',    fontSize=10,  textColor=BLACK,     leading=14, spaceBefore=8, spaceAfter=3)
comp_s      = st('Comp',   fontName='Helvetica-Bold',    fontSize=12,  textColor=BLACK,     leading=15, spaceBefore=10, spaceAfter=4)
th_s        = st('TH',     fontName='Helvetica-Bold',    fontSize=8,   textColor=MID_GRAY,  leading=11)
tv_s        = st('TV',     fontName='Helvetica',         fontSize=9.5, textColor=DARK_GRAY, leading=14)
tv_sm_s     = st('TVsm',   fontName='Helvetica',         fontSize=8.5, textColor=MID_GRAY,  leading=12)
tv_bold_s   = st('TVB',    fontName='Helvetica-Bold',    fontSize=9.5, textColor=BLACK,     leading=14)
check_s     = st('Chk',    fontName='Helvetica-Bold',    fontSize=9,   textColor=GREEN,     leading=14)
price_s     = st('Price',  fontName='Helvetica-Bold',    fontSize=14,  textColor=BLACK,     leading=18)
price_lg_s  = st('PriceLg',fontName='Helvetica-Bold',    fontSize=20,  textColor=ACCENT,    leading=24)
foot_s      = st('Foot',   fontName='Helvetica-Oblique', fontSize=8,   textColor=MID_GRAY,  leading=12)
foot_bold_s = st('FootB',  fontName='Helvetica-Bold',    fontSize=8.5, textColor=DARK_GRAY, leading=12)
note_s      = st('Note',   fontName='Helvetica-Oblique', fontSize=9,   textColor=MID_GRAY,  leading=13, spaceAfter=4)
addon_title_s = st('AddonT', fontName='Helvetica-Bold',  fontSize=11,  textColor=ACCENT,    leading=14, spaceBefore=6, spaceAfter=2)
addon_price_s = st('AddonP', fontName='Helvetica-Bold',  fontSize=13,  textColor=ACCENT,    leading=16)

def section_label(text):
    return [
        Paragraph(text.upper(), sec_s),
        HRFlowable(width="100%", thickness=0.75, color=RULE_GRAY, spaceAfter=8),
    ]

def bullet(text):
    return Paragraph(f"–  {text}", bullet_s)

def check_bullet(text):
    return Paragraph(f"✓  {text}", st('ChkBul', fontName='Helvetica', fontSize=9.5, textColor=DARK_GRAY, leading=16, leftIndent=14, firstLineIndent=-10, spaceAfter=1))

def build_header(story):
    hdr = Table([[
        Paragraph("RANGE MEDICAL", clinic_s),
        Paragraph("range-medical.com  •  (949) 997-3988<br/>1901 Westcliff Drive, Suite 10, Newport Beach, CA", contact_s),
    ]], colWidths=[2.8*inch, 4.2*inch])
    hdr.setStyle(TableStyle([
        ('VALIGN',(0,0),(-1,-1),'MIDDLE'),
        ('TOPPADDING',(0,0),(-1,-1),0),('BOTTOMPADDING',(0,0),(-1,-1),6),
        ('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),0),
    ]))
    story.append(hdr)
    story.append(HRFlowable(width="100%", thickness=1.5, color=BLACK, spaceAfter=10))

def build_footer(story):
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=0.5, color=RULE_GRAY, spaceAfter=6))
    tbl = Table([[
        Paragraph("<b>Questions or concerns?</b><br/>Call or text: (949) 997-3988<br/>range-medical.com", foot_bold_s),
        Paragraph(
            "Lab panels are ordered by your Range Medical provider based on your "
            "health goals. Results are reviewed during your follow-up appointment.",
            foot_s),
    ]], colWidths=[2.2*inch, 4.8*inch])
    tbl.setStyle(TableStyle([
        ('VALIGN',(0,0),(-1,-1),'TOP'),
        ('TOPPADDING',(0,0),(-1,-1),0),('BOTTOMPADDING',(0,0),(-1,-1),0),
        ('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),0),
    ]))
    story.append(tbl)


def biomarker_table(markers, descriptions):
    """Build a two-column table: marker name + what it tells us."""
    data = []
    data.append([
        Paragraph("BIOMARKER", th_s),
        Paragraph("WHAT IT TELLS US", th_s),
    ])
    for m in markers:
        desc = descriptions.get(m, "")
        data.append([
            Paragraph(m, tv_bold_s),
            Paragraph(desc, tv_s),
        ])
    tbl = Table(data, colWidths=[2.2*inch, 4.8*inch])
    tbl.setStyle(TableStyle([
        ('TOPPADDING',    (0,0),(-1,0), 6),
        ('BOTTOMPADDING', (0,0),(-1,0), 6),
        ('TOPPADDING',    (0,1),(-1,-1), 5),
        ('BOTTOMPADDING', (0,1),(-1,-1), 5),
        ('LEFTPADDING',   (0,0),(-1,-1), 8),
        ('RIGHTPADDING',  (0,0),(-1,-1), 8),
        ('VALIGN',        (0,0),(-1,-1), 'TOP'),
        ('ROWBACKGROUNDS',(0,1),(-1,-1), [LIGHT_GRAY, WHITE]),
        ('LINEBELOW',     (0,0),(-1,0), 0.75, RULE_GRAY),
        ('BOX',           (0,0),(-1,-1), 0.5, RULE_GRAY),
        ('LINEBELOW',     (0,1),(-1,-2), 0.5, RULE_GRAY),
    ]))
    return tbl


# ── BIOMARKER DATA ──────────────────────────────────────────────────────────

descriptions = {
    "Complete Metabolic Panel (CMP)": "Kidney function, liver enzymes, blood sugar, electrolytes, and proteins — 17 markers in one panel.",
    "Lipid Panel": "Total cholesterol, HDL, LDL, triglycerides, and ratios — cardiovascular risk assessment.",
    "CBC with Differential": "Red cells, white cells, platelets — detects anemia, infection, and immune issues. 20 markers.",
    "Estradiol": "Primary estrogen. In men, high levels cause fatigue and weight gain. In women, key for reproductive health.",
    "HbA1c": "Average blood sugar over 3 months — the gold standard for detecting pre-diabetes.",
    "Insulin, Fasting": "Reveals metabolic dysfunction early, before blood sugar goes abnormal.",
    "PSA, Total": "Prostate-specific antigen — important for monitoring prostate health. (Men only)",
    "SHBG": "Sex hormone binding globulin — affects how much testosterone is available to your body.",
    "T3, Free": "The active thyroid hormone. Low T3 causes fatigue and brain fog even when TSH looks normal.",
    "T4, Total": "Main thyroid hormone your body converts to T3. Assesses overall thyroid output.",
    "Testosterone, Free": "The testosterone actually available for your body to use.",
    "Testosterone, Total": "Overall testosterone production. Low levels cause fatigue, low libido, and muscle loss.",
    "TPO Antibodies": "Detects autoimmune thyroid disease (Hashimoto’s) — often elevated years before symptoms.",
    "TSH": "Thyroid-stimulating hormone — the first-line thyroid screening marker.",
    "Vitamin D, 25-OH": "Critical for immune function, mood, bone health, and hormones. Most people are deficient.",
    "FSH": "Follicle-stimulating hormone — assesses fertility, menopause status, and pituitary function.",
    "LH": "Luteinizing hormone — works with FSH to regulate reproductive function.",
    "Progesterone": "Balances estrogen; supports mood, sleep, and reproductive health. (Women only)",
    "Apolipoprotein A-1": "The protein in ‘good’ HDL cholesterol. Higher levels are protective against heart disease.",
    "Apolipoprotein B": "The protein in ‘bad’ LDL particles — a better predictor of heart disease than standard cholesterol.",
    "CRP-HS (Inflammation)": "High-sensitivity inflammation marker — elevated in heart disease and chronic illness.",
    "Cortisol": "Primary stress hormone. Chronic high or low cortisol affects energy, sleep, and weight.",
    "DHEA-S": "Precursor hormone that declines with age. Supports energy, mood, and immune function.",
    "DHT": "Dihydrotestosterone — relevant for hair loss, acne, and hormone balance. (Women Elite only)",
    "Ferritin": "Iron storage protein. Low ferritin causes fatigue even when iron looks normal.",
    "Folate": "Essential B-vitamin for DNA synthesis. Low levels linked to fatigue and heart disease.",
    "GGT": "Sensitive liver enzyme — elevated early in liver stress or bile duct issues.",
    "Homocysteine": "Amino acid linked to heart disease and stroke when elevated. Also indicates B-vitamin status.",
    "IGF-1": "Reflects growth hormone status — important for metabolism, muscle, and longevity.",
    "Iron & TIBC": "Serum iron, total iron binding capacity, and transferrin saturation — diagnoses anemia and overload.",
    "Lipoprotein(a)": "Genetic cardiovascular risk factor — high Lp(a) significantly increases heart attack risk.",
    "Magnesium": "Essential mineral for 300+ functions. Deficiency causes cramps, anxiety, and sleep issues.",
    "PSA, Free & Total": "Detailed prostate screening — free-to-total ratio distinguishes cancer from benign conditions. (Men only)",
    "Sed Rate": "Erythrocyte sedimentation rate — measures inflammation in autoimmune conditions.",
    "T4, Free": "Unbound, active form of T4 — more accurate than total T4 for thyroid assessment.",
    "Thyroglobulin Antibodies": "Another marker for autoimmune thyroid disease, tested alongside TPO antibodies.",
    "Uric Acid": "High levels cause gout and are linked to metabolic syndrome and kidney stones.",
    "Vitamin B-12": "Essential for energy, nerve function, and red blood cells. Deficiency is common and often missed.",
}

men_essential = [
    "Complete Metabolic Panel (CMP)", "Lipid Panel", "CBC with Differential",
    "Estradiol", "HbA1c", "Insulin, Fasting", "PSA, Total", "SHBG",
    "T3, Free", "T4, Total", "Testosterone, Free", "Testosterone, Total",
    "TPO Antibodies", "TSH", "Vitamin D, 25-OH",
]

men_elite_extra = [
    "Apolipoprotein A-1", "Apolipoprotein B", "CRP-HS (Inflammation)",
    "Cortisol", "DHEA-S", "Ferritin", "Folate", "FSH", "GGT",
    "Homocysteine", "IGF-1", "Iron & TIBC", "LH", "Lipoprotein(a)",
    "Magnesium", "PSA, Free & Total", "Sed Rate", "T4, Free",
    "Thyroglobulin Antibodies", "Uric Acid", "Vitamin B-12",
]

women_essential = [
    "Complete Metabolic Panel (CMP)", "Lipid Panel", "CBC with Differential",
    "Estradiol", "FSH", "LH", "HbA1c", "Insulin, Fasting", "Progesterone",
    "SHBG", "T3, Free", "T4, Total", "Testosterone, Free", "Testosterone, Total",
    "TPO Antibodies", "TSH", "Vitamin D, 25-OH",
]

women_elite_extra = [
    "Apolipoprotein A-1", "Apolipoprotein B", "CRP-HS (Inflammation)",
    "Cortisol", "DHEA-S", "DHT", "Ferritin", "Folate", "GGT",
    "Homocysteine", "IGF-1", "Iron & TIBC", "Lipoprotein(a)",
    "Magnesium", "Sed Rate", "T4, Free", "Thyroglobulin Antibodies",
    "Uric Acid", "Vitamin B-12",
]


# ── BUILD PDF ───────────────────────────────────────────────────────────────

OUTPUT_PATH = os.path.join(os.path.dirname(__file__), '..', 'public', 'docs', 'lab-panels-guide.pdf')

doc = SimpleDocTemplate(
    OUTPUT_PATH,
    pagesize=letter,
    rightMargin=0.75*inch, leftMargin=0.75*inch,
    topMargin=0.65*inch,   bottomMargin=0.65*inch,
)
story = []


# ═══════════════════════════════════════════════════════════════════════════
# PAGE 1 — ESSENTIAL PANEL
# ═══════════════════════════════════════════════════════════════════════════

build_header(story)
story.append(Paragraph("LAB PANELS GUIDE", title_s))
story.append(Paragraph("What we test, what it means, and why it matters", subtitle_s))
story.append(Spacer(1, 14))

# Essential Panel header
story += section_label("Essential Panel")

price_row = Table([[
    Paragraph("Essential Panel", comp_s),
    Paragraph("$350", price_lg_s),
]], colWidths=[5.0*inch, 2.0*inch])
price_row.setStyle(TableStyle([
    ('VALIGN',(0,0),(-1,-1),'MIDDLE'),
    ('TOPPADDING',(0,0),(-1,-1),0),('BOTTOMPADDING',(0,0),(-1,-1),4),
    ('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),0),
    ('ALIGN',(1,0),(1,0),'RIGHT'),
]))
story.append(price_row)

story.append(Paragraph(
    "Our foundational panel covers hormones, thyroid, metabolic health, and key vitamins. "
    "Goes beyond standard annual bloodwork — gives you the full baseline.",
    body_s
))
story.append(Spacer(1, 6))
story.append(Paragraph("55 biomarkers (men) • 57 biomarkers (women)", body_sm_s))
story.append(Spacer(1, 10))

# Men's Essential
story.append(Paragraph("Men’s Essential Panel", sub_s))
story.append(biomarker_table(men_essential, descriptions))
story.append(Spacer(1, 10))

# Women's Essential — note the extra markers (FSH, LH, Progesterone)
story.append(Paragraph("Women’s Essential Panel", sub_s))
story.append(Paragraph(
    "Includes everything in the men’s panel (except PSA) plus FSH, LH, and Progesterone.",
    note_s
))
women_only = [m for m in women_essential if m not in men_essential]
if women_only:
    for m in women_only:
        story.append(check_bullet(f"<b>{m}</b> — {descriptions.get(m, '')}"))
story.append(Spacer(1, 4))

build_footer(story)


# ═══════════════════════════════════════════════════════════════════════════
# PAGE 2 — ELITE PANEL
# ═══════════════════════════════════════════════════════════════════════════

story.append(PageBreak())
build_header(story)
story += section_label("Elite Panel")

price_row2 = Table([[
    Paragraph("Elite Panel", comp_s),
    Paragraph("$750", price_lg_s),
]], colWidths=[5.0*inch, 2.0*inch])
price_row2.setStyle(TableStyle([
    ('VALIGN',(0,0),(-1,-1),'MIDDLE'),
    ('TOPPADDING',(0,0),(-1,-1),0),('BOTTOMPADDING',(0,0),(-1,-1),4),
    ('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),0),
    ('ALIGN',(1,0),(1,0),'RIGHT'),
]))
story.append(price_row2)

story.append(Paragraph(
    "Everything in the Essential Panel plus advanced cardiovascular, inflammation, "
    "and longevity markers. The most comprehensive panel we offer — includes markers "
    "many clinics skip entirely.",
    body_s
))
story.append(Spacer(1, 6))
story.append(Paragraph("78 biomarkers (men and women)", body_sm_s))
story.append(Spacer(1, 6))

story.append(Paragraph(
    "Includes all Essential Panel markers, plus the following:",
    note_s
))
story.append(Spacer(1, 4))

# Men's Elite extras
story.append(Paragraph("Additional Men’s Elite Markers", sub_s))
story.append(biomarker_table(men_elite_extra, descriptions))
story.append(Spacer(1, 10))

# Women's Elite extras
story.append(Paragraph("Additional Women’s Elite Markers", sub_s))
women_diff = [m for m in women_elite_extra if m not in men_elite_extra]
if women_diff:
    story.append(Paragraph(
        f"Same as men’s Elite extras (above), except replaces PSA with: "
        + ", ".join(f"<b>{m}</b>" for m in women_diff) + ".",
        note_s
    ))
else:
    story.append(Paragraph(
        "Same as men’s Elite extras above, minus PSA.",
        note_s
    ))
story.append(Spacer(1, 4))

build_footer(story)


# ═══════════════════════════════════════════════════════════════════════════
# PAGE 3 — ADD-ON PANELS
# ═══════════════════════════════════════════════════════════════════════════

story.append(PageBreak())
build_header(story)
story += section_label("Add-On Panels")

story.append(Paragraph(
    "Add-on panels can be ordered alongside any Essential or Elite blood draw. "
    "These are specialty tests that go beyond routine bloodwork to screen for "
    "heavy metal exposure and mold sensitivity.",
    body_s
))
story.append(Spacer(1, 14))


# ── Heavy Metals Blood ──────────────────────────────────────────────────────

addon1 = []
addon1_header = Table([[
    Paragraph("Heavy Metals Panel — Blood (3 Toxic)", addon_title_s),
    Paragraph("$220", addon_price_s),
]], colWidths=[5.0*inch, 2.0*inch])
addon1_header.setStyle(TableStyle([
    ('VALIGN',(0,0),(-1,-1),'MIDDLE'),
    ('TOPPADDING',(0,0),(-1,-1),0),('BOTTOMPADDING',(0,0),(-1,-1),2),
    ('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),0),
    ('ALIGN',(1,0),(1,0),'RIGHT'),
]))
addon1.append(addon1_header)
addon1.append(Paragraph("Whole Blood • ICP-MS/MS", body_sm_s))
addon1.append(Spacer(1, 8))
addon1.append(Paragraph(
    "Screens for the three most common toxic heavy metals. Ideal for patients with "
    "occupational exposure, contaminated water concerns, or unexplained symptoms like "
    "fatigue, headaches, or cognitive issues.",
    body_s
))
addon1.append(Spacer(1, 8))

hm_blood_data = [
    [Paragraph("METAL", th_s), Paragraph("WHY WE TEST IT", th_s)],
    [Paragraph("Arsenic", tv_bold_s), Paragraph("Found in contaminated water, rice, and seafood. Chronic exposure linked to cancer, cardiovascular disease, and neurological damage.", tv_s)],
    [Paragraph("Lead", tv_bold_s), Paragraph("From old paint, pipes, and occupational exposure. Causes cognitive decline, kidney damage, and hypertension — no safe level.", tv_s)],
    [Paragraph("Mercury", tv_bold_s), Paragraph("Primarily from fish consumption and dental amalgams. Affects nervous system, kidneys, and immune function.", tv_s)],
]
hm_blood_tbl = Table(hm_blood_data, colWidths=[1.4*inch, 5.6*inch])
hm_blood_tbl.setStyle(TableStyle([
    ('TOPPADDING',    (0,0),(-1,0), 6),
    ('BOTTOMPADDING', (0,0),(-1,0), 6),
    ('TOPPADDING',    (0,1),(-1,-1), 5),
    ('BOTTOMPADDING', (0,1),(-1,-1), 5),
    ('LEFTPADDING',   (0,0),(-1,-1), 8),
    ('RIGHTPADDING',  (0,0),(-1,-1), 8),
    ('VALIGN',        (0,0),(-1,-1), 'TOP'),
    ('ROWBACKGROUNDS',(0,1),(-1,-1), [LIGHT_GRAY, WHITE]),
    ('LINEBELOW',     (0,0),(-1,0), 0.75, RULE_GRAY),
    ('BOX',           (0,0),(-1,-1), 0.5, RULE_GRAY),
    ('LINEBELOW',     (0,1),(-1,-2), 0.5, RULE_GRAY),
]))
addon1.append(hm_blood_tbl)
addon1.append(Spacer(1, 6))
addon1.append(Paragraph("No special preparation required — collected during your regular blood draw.", note_s))

story.append(KeepTogether(addon1))
story.append(Spacer(1, 16))


# ── Heavy Metals Urine ──────────────────────────────────────────────────────

addon2 = []
addon2_header = Table([[
    Paragraph("Heavy Metals Panel — Urine (21 Toxic)", addon_title_s),
    Paragraph("$280", addon_price_s),
]], colWidths=[5.0*inch, 2.0*inch])
addon2_header.setStyle(TableStyle([
    ('VALIGN',(0,0),(-1,-1),'MIDDLE'),
    ('TOPPADDING',(0,0),(-1,-1),0),('BOTTOMPADDING',(0,0),(-1,-1),2),
    ('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),0),
    ('ALIGN',(1,0),(1,0),'RIGHT'),
]))
addon2.append(addon2_header)
addon2.append(Paragraph("Urine Collection • ICP-MS/MS", body_sm_s))
addon2.append(Spacer(1, 8))
addon2.append(Paragraph(
    "The most comprehensive toxic metals screen we offer. Tests 21 metals via "
    "urine to evaluate cumulative exposure and detoxification status. Recommended for "
    "patients concerned about environmental toxins, those undergoing chelation, or "
    "anyone with chronic unexplained symptoms.",
    body_s
))
addon2.append(Spacer(1, 8))

metals_list = [
    "Aluminum", "Arsenic", "Antimony", "Barium", "Bismuth", "Cadmium", "Cesium",
    "Gadolinium", "Germanium", "Lead", "Mercury", "Nickel", "Niobium", "Platinum",
    "Rubidium", "Thallium", "Thorium", "Tin", "Titanium", "Tungsten", "Uranium",
]

col1 = metals_list[:7]
col2 = metals_list[7:14]
col3 = metals_list[14:]

metals_data = [[Paragraph("METALS TESTED (21)", th_s), Paragraph("", th_s), Paragraph("", th_s)]]
for i in range(max(len(col1), len(col2), len(col3))):
    row = [
        Paragraph(f"✓  {col1[i]}" if i < len(col1) else "", st('C1', fontName='Helvetica', fontSize=9, textColor=DARK_GRAY, leading=13)),
        Paragraph(f"✓  {col2[i]}" if i < len(col2) else "", st('C2', fontName='Helvetica', fontSize=9, textColor=DARK_GRAY, leading=13)),
        Paragraph(f"✓  {col3[i]}" if i < len(col3) else "", st('C3', fontName='Helvetica', fontSize=9, textColor=DARK_GRAY, leading=13)),
    ]
    metals_data.append(row)

# Add Creatinine note
metals_data.append([
    Paragraph("✓  Creatinine (Random Urine)", st('C4', fontName='Helvetica-Oblique', fontSize=9, textColor=MID_GRAY, leading=13)),
    Paragraph("", tv_s),
    Paragraph("", tv_s),
])

metals_tbl = Table(metals_data, colWidths=[2.33*inch, 2.33*inch, 2.34*inch])
metals_tbl.setStyle(TableStyle([
    ('TOPPADDING',    (0,0),(-1,0), 6),
    ('BOTTOMPADDING', (0,0),(-1,0), 6),
    ('TOPPADDING',    (0,1),(-1,-1), 3),
    ('BOTTOMPADDING', (0,1),(-1,-1), 3),
    ('LEFTPADDING',   (0,0),(-1,-1), 8),
    ('RIGHTPADDING',  (0,0),(-1,-1), 8),
    ('VALIGN',        (0,0),(-1,-1), 'TOP'),
    ('BACKGROUND',    (0,0),(-1,0), LIGHT_GRAY),
    ('LINEBELOW',     (0,0),(-1,0), 0.75, RULE_GRAY),
    ('BOX',           (0,0),(-1,-1), 0.5, RULE_GRAY),
]))
addon2.append(metals_tbl)
addon2.append(Spacer(1, 6))
addon2.append(Paragraph(
    "<b>Preparation:</b> Avoid seafood for 48 hours before collection. "
    "Specimen must be collected in an acid-washed or metal-free plastic container.",
    st('PrepNote', fontName='Helvetica', fontSize=8.5, textColor=DARK_GRAY, leading=13, spaceAfter=4)
))

story.append(KeepTogether(addon2))
story.append(Spacer(1, 16))


# ── Mold Profile Plus IgE ───────────────────────────────────────────────────

addon3 = []
addon3_header = Table([[
    Paragraph("Mold Profile Plus IgE", addon_title_s),
    Paragraph("$200", addon_price_s),
]], colWidths=[5.0*inch, 2.0*inch])
addon3_header.setStyle(TableStyle([
    ('VALIGN',(0,0),(-1,-1),'MIDDLE'),
    ('TOPPADDING',(0,0),(-1,-1),0),('BOTTOMPADDING',(0,0),(-1,-1),2),
    ('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),0),
    ('ALIGN',(1,0),(1,0),'RIGHT'),
]))
addon3.append(addon3_header)
addon3.append(Paragraph("Blood Draw • Immunoassay", body_sm_s))
addon3.append(Spacer(1, 8))
addon3.append(Paragraph(
    "Screens for IgE-mediated allergic sensitivity to six common indoor molds. "
    "Ideal for patients with chronic sinus issues, unexplained respiratory symptoms, "
    "persistent fatigue, or known mold exposure at home or work.",
    body_s
))
addon3.append(Spacer(1, 8))

mold_data = [
    [Paragraph("MOLD SPECIES", th_s), Paragraph("COMMON NAME / WHERE IT’S FOUND", th_s)],
    [Paragraph("Penicillium Notatum (m1)", tv_bold_s), Paragraph("Blue-green mold found on food, wallpaper, and damp buildings. One of the most common indoor molds.", tv_s)],
    [Paragraph("Cladosporium herbarum (m2)", tv_bold_s), Paragraph("Found on plants, textiles, and window frames. The most common outdoor mold, also thrives indoors.", tv_s)],
    [Paragraph("Aspergillus fumigatus (m3)", tv_bold_s), Paragraph("Found in soil, compost, and HVAC systems. Can cause serious lung infections in susceptible individuals.", tv_s)],
    [Paragraph("Mucor racemosus (m4)", tv_bold_s), Paragraph("Fast-growing mold found in dust, soil, and decaying food. Common in older buildings.", tv_s)],
    [Paragraph("Alternaria alternata (m6)", tv_bold_s), Paragraph("Found in showers, window frames, and damp areas. A major trigger for allergic asthma.", tv_s)],
    [Paragraph("Stemphylium Botryosum (m10)", tv_bold_s), Paragraph("Found on decaying plants and in agricultural settings. Less common but clinically significant.", tv_s)],
]
mold_tbl = Table(mold_data, colWidths=[2.4*inch, 4.6*inch])
mold_tbl.setStyle(TableStyle([
    ('TOPPADDING',    (0,0),(-1,0), 6),
    ('BOTTOMPADDING', (0,0),(-1,0), 6),
    ('TOPPADDING',    (0,1),(-1,-1), 5),
    ('BOTTOMPADDING', (0,1),(-1,-1), 5),
    ('LEFTPADDING',   (0,0),(-1,-1), 8),
    ('RIGHTPADDING',  (0,0),(-1,-1), 8),
    ('VALIGN',        (0,0),(-1,-1), 'TOP'),
    ('ROWBACKGROUNDS',(0,1),(-1,-1), [LIGHT_GRAY, WHITE]),
    ('LINEBELOW',     (0,0),(-1,0), 0.75, RULE_GRAY),
    ('BOX',           (0,0),(-1,-1), 0.5, RULE_GRAY),
    ('LINEBELOW',     (0,1),(-1,-2), 0.5, RULE_GRAY),
]))
addon3.append(mold_tbl)
addon3.append(Spacer(1, 6))
addon3.append(Paragraph("No special preparation required — collected during your regular blood draw.", note_s))

story.append(KeepTogether(addon3))
story.append(Spacer(1, 10))

build_footer(story)


# ── GENERATE ────────────────────────────────────────────────────────────────

os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
doc.build(story)
print(f"Generated: {OUTPUT_PATH}")
