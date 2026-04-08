#!/usr/bin/env python3
"""
Generate Roberto Ayala consultation PDF — lab analysis + Range Medical recommendations.
"""

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table,
                                 TableStyle, HRFlowable, PageBreak)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
import os

BLACK      = HexColor('#0A0A0A')
DARK_GRAY  = HexColor('#1A1A1A')
MID_GRAY   = HexColor('#606060')
LIGHT_GRAY = HexColor('#F4F4F4')
RULE_GRAY  = HexColor('#DDDDDD')
WHITE      = HexColor('#FFFFFF')
GREEN      = HexColor('#2E6B35')
RED        = HexColor('#C0392B')
AMBER      = HexColor('#D4860B')
BLUE       = HexColor('#2471A3')
W = 7.0 * inch

def st(name, **kw):
    return ParagraphStyle(name, **kw)

clinic_s    = st('Clinic', fontName='Helvetica-Bold',    fontSize=13,  textColor=BLACK,     leading=16)
contact_s   = st('Cont',   fontName='Helvetica',         fontSize=8,   textColor=MID_GRAY,  leading=12, alignment=TA_RIGHT)
title_s     = st('Title',  fontName='Helvetica-Bold',    fontSize=17,  textColor=BLACK,     leading=21, spaceAfter=2)
subtitle_s  = st('Sub',    fontName='Helvetica-Oblique', fontSize=9.5, textColor=MID_GRAY,  leading=13)
sec_s       = st('Sec',    fontName='Helvetica-Bold',    fontSize=8,   textColor=MID_GRAY,  leading=11, spaceBefore=16, spaceAfter=3)
comp_s      = st('Comp',   fontName='Helvetica-Bold',    fontSize=12,  textColor=BLACK,     leading=15, spaceBefore=10, spaceAfter=4)
sub_s       = st('SubH',   fontName='Helvetica-Bold',    fontSize=9.5, textColor=BLACK,     leading=13, spaceBefore=8,  spaceAfter=3)
body_s      = st('Body',   fontName='Helvetica',         fontSize=9.5, textColor=DARK_GRAY, leading=16, spaceAfter=0)
bullet_s    = st('Bul',    fontName='Helvetica',         fontSize=9.5, textColor=DARK_GRAY, leading=16, leftIndent=14, firstLineIndent=-10, spaceAfter=2)
th_s        = st('TH',     fontName='Helvetica-Bold',    fontSize=8,   textColor=MID_GRAY,  leading=11)
tv_s        = st('TV',     fontName='Helvetica',         fontSize=9.5, textColor=DARK_GRAY, leading=14)
tv_bold_s   = st('TVB',    fontName='Helvetica-Bold',    fontSize=9.5, textColor=BLACK,     leading=14)
check_s     = st('Chk',    fontName='Helvetica-Bold',    fontSize=9,   textColor=GREEN,     leading=14)
rest_s      = st('Rst',    fontName='Helvetica',         fontSize=9,   textColor=MID_GRAY,  leading=14)
foot_s      = st('Foot',   fontName='Helvetica-Oblique', fontSize=8,   textColor=MID_GRAY,  leading=12)
foot_bold_s = st('FootB',  fontName='Helvetica-Bold',    fontSize=8.5, textColor=DARK_GRAY, leading=12)
note_s      = st('Note',   fontName='Helvetica-Oblique', fontSize=9,   textColor=MID_GRAY,  leading=13, spaceAfter=4)

# Additional styles for this document
flag_high_s = st('FlagH',  fontName='Helvetica-Bold',    fontSize=9,   textColor=RED,       leading=14)
flag_low_s  = st('FlagL',  fontName='Helvetica-Bold',    fontSize=9,   textColor=BLUE,      leading=14)
flag_warn_s = st('FlagW',  fontName='Helvetica-Bold',    fontSize=9,   textColor=AMBER,     leading=14)
optimal_s   = st('Opt',    fontName='Helvetica-Bold',    fontSize=9,   textColor=GREEN,     leading=14)

def section_label(text):
    return [
        Paragraph(text.upper(), sec_s),
        HRFlowable(width="100%", thickness=0.75, color=RULE_GRAY, spaceAfter=8),
    ]

def info_table(rows, col1=1.8*inch):
    col2 = W - col1
    data = [[Paragraph(l, tv_bold_s), Paragraph(v, tv_s)] for l, v in rows]
    tbl = Table(data, colWidths=[col1, col2])
    tbl.setStyle(TableStyle([
        ('TOPPADDING',    (0,0),(-1,-1), 5),
        ('BOTTOMPADDING', (0,0),(-1,-1), 5),
        ('LEFTPADDING',   (0,0),(-1,-1), 10),
        ('RIGHTPADDING',  (0,0),(-1,-1), 10),
        ('VALIGN',        (0,0),(-1,-1), 'TOP'),
        ('ROWBACKGROUNDS',(0,0),(-1,-1), [LIGHT_GRAY, WHITE]),
        ('BOX',           (0,0),(-1,-1), 0.5, RULE_GRAY),
        ('LINEBELOW',     (0,0),(-1,-2), 0.5, RULE_GRAY),
    ]))
    return tbl

def bullet(text):
    return Paragraph(f"\u2013  {text}", bullet_s)

def build_header(story):
    hdr = Table([[
        Paragraph("RANGE MEDICAL", clinic_s),
        Paragraph("range-medical.com  \u2022  (949) 997-3988<br/>1901 Westcliff Drive, Suite 10, Newport Beach, CA", contact_s),
    ]], colWidths=[2.8*inch, 4.2*inch])
    hdr.setStyle(TableStyle([
        ('VALIGN',(0,0),(-1,-1),'MIDDLE'),
        ('TOPPADDING',(0,0),(-1,-1),0),('BOTTOMPADDING',(0,0),(-1,-1),6),
        ('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),0),
    ]))
    story.append(hdr)
    story.append(HRFlowable(width="100%", thickness=1.5, color=BLACK, spaceAfter=12))

def build_footer(story):
    story.append(HRFlowable(width="100%", thickness=0.5, color=RULE_GRAY, spaceAfter=8))
    tbl = Table([[
        Paragraph("<b>Questions or concerns?</b><br/>Call or text: (949) 997-3988<br/>range-medical.com", foot_bold_s),
        Paragraph(
            "This document is intended for Range Medical patients only and is not a substitute "
            "for personalized medical advice. Do not adjust your dose without consulting your provider.",
            foot_s),
    ]], colWidths=[2.2*inch, 4.8*inch])
    tbl.setStyle(TableStyle([
        ('VALIGN',(0,0),(-1,-1),'TOP'),
        ('TOPPADDING',(0,0),(-1,-1),0),('BOTTOMPADDING',(0,0),(-1,-1),0),
        ('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),0),
    ]))
    story.append(tbl)


# ── BUILD THE DOCUMENT ──────────────────────────────────────────────

OUTPUT_PATH = os.path.join(os.path.dirname(__file__), '..', 'public', 'docs', 'ayala-roberto-consultation.pdf')

doc = SimpleDocTemplate(
    OUTPUT_PATH,
    pagesize=letter,
    rightMargin=0.75*inch, leftMargin=0.75*inch,
    topMargin=0.65*inch,   bottomMargin=0.65*inch,
)
story = []
build_header(story)

# Title
story.append(Paragraph("LONGEVITY LAB ANALYSIS", title_s))
story.append(Paragraph("Comprehensive biomarker review with Range Medical protocol recommendations", subtitle_s))
story.append(Spacer(1, 14))

# Patient info
story += section_label("Patient Information")
story.append(info_table([
    ("Patient",              "Roberto Ayala"),
    ("Date of Birth",        "12/15/1963 \u2014 Age 62"),
    ("Lab Date",             "January 26, 2026"),
    ("Lab Provider",         "Pacific Medical Laboratory (Accession #848138)"),
    ("Current Provider",     "Dr. Gaurav Goswami \u2014 Beyond Wellness"),
    ("Reviewing Provider",   "Dr. Burgess \u2014 Range Medical"),
]))
story.append(Spacer(1, 6))

# ── FLAGGED MARKERS ──────────────────────────────────────────────────

story += section_label("Flagged Markers")

story.append(Paragraph("The following values are out of range or suboptimal from a longevity medicine perspective.", body_s))
story.append(Spacer(1, 8))

# Flagged markers table
flag_header = [
    Paragraph("Marker", th_s),
    Paragraph("Result", th_s),
    Paragraph("Flag", th_s),
    Paragraph("Ref Range", th_s),
    Paragraph("Optimal Range", th_s),
]
flag_rows = [
    flag_header,
    [Paragraph("Free Testosterone %", tv_bold_s), Paragraph("0.7%", tv_s), Paragraph("LOW", flag_low_s), Paragraph("1.0\u20132.7%", tv_s), Paragraph("2.0\u20132.5%", tv_s)],
    [Paragraph("LH", tv_bold_s), Paragraph("8.62 mIU/mL", tv_s), Paragraph("BORDERLINE", flag_warn_s), Paragraph("1.70\u20138.60", tv_s), Paragraph("2.0\u20135.0", tv_s)],
    [Paragraph("Hemoglobin", tv_bold_s), Paragraph("13.9 g/dL", tv_s), Paragraph("LOW", flag_low_s), Paragraph("14.0\u201318.0", tv_s), Paragraph("15.0\u201316.5", tv_s)],
    [Paragraph("Platelets", tv_bold_s), Paragraph("432 K/uL", tv_s), Paragraph("HIGH", flag_high_s), Paragraph("130\u2013400", tv_s), Paragraph("150\u2013300", tv_s)],
    [Paragraph("ALT/SGPT", tv_bold_s), Paragraph("46 U/L", tv_s), Paragraph("HIGH", flag_high_s), Paragraph("0\u201342", tv_s), Paragraph("<30", tv_s)],
    [Paragraph("LDL Cholesterol", tv_bold_s), Paragraph("117 mg/dL", tv_s), Paragraph("HIGH", flag_high_s), Paragraph("<100", tv_s), Paragraph("<80", tv_s)],
    [Paragraph("Vitamin D", tv_bold_s), Paragraph("45.9 ng/mL", tv_s), Paragraph("SUBOPTIMAL", flag_warn_s), Paragraph("30\u2013100", tv_s), Paragraph("60\u201380", tv_s)],
    [Paragraph("IGF-1", tv_bold_s), Paragraph("115 ng/mL", tv_s), Paragraph("LOW-END", flag_warn_s), Paragraph("49\u2013214", tv_s), Paragraph("150\u2013200", tv_s)],
    [Paragraph("Glucose (fasting)", tv_bold_s), Paragraph("98 mg/dL", tv_s), Paragraph("BORDERLINE", flag_warn_s), Paragraph("65\u201399", tv_s), Paragraph("75\u201388", tv_s)],
]

flag_tbl = Table(flag_rows, colWidths=[1.6*inch, 1.2*inch, 1.1*inch, 1.2*inch, 1.2*inch])
flag_tbl.setStyle(TableStyle([
    ('TOPPADDING',    (0,0),(-1,-1), 5),
    ('BOTTOMPADDING', (0,0),(-1,-1), 5),
    ('LEFTPADDING',   (0,0),(-1,-1), 6),
    ('RIGHTPADDING',  (0,0),(-1,-1), 6),
    ('VALIGN',        (0,0),(-1,-1), 'MIDDLE'),
    ('BACKGROUND',    (0,0),(-1,0), LIGHT_GRAY),
    ('ROWBACKGROUNDS',(0,1),(-1,-1), [WHITE, LIGHT_GRAY]),
    ('BOX',           (0,0),(-1,-1), 0.5, RULE_GRAY),
    ('LINEBELOW',     (0,0),(-1,-1), 0.5, RULE_GRAY),
]))
story.append(flag_tbl)
story.append(Spacer(1, 6))

# ── STRONG MARKERS ───────────────────────────────────────────────────

story += section_label("Strong Markers")
story.append(Paragraph("These values reflect a solid metabolic foundation to build on.", body_s))
story.append(Spacer(1, 6))

strong_header = [
    Paragraph("Marker", th_s),
    Paragraph("Result", th_s),
    Paragraph("Status", th_s),
    Paragraph("Clinical Note", th_s),
]
strong_rows = [
    strong_header,
    [Paragraph("hs-CRP", tv_bold_s), Paragraph("<0.16 mg/dL", tv_s), Paragraph("\u2713 Excellent", check_s), Paragraph("Near-zero systemic inflammation", tv_s)],
    [Paragraph("Fasting Insulin", tv_bold_s), Paragraph("4.3 uU/mL", tv_s), Paragraph("\u2713 Excellent", check_s), Paragraph("Outstanding insulin sensitivity", tv_s)],
    [Paragraph("HbA1c", tv_bold_s), Paragraph("5.18%", tv_s), Paragraph("\u2713 Excellent", check_s), Paragraph("Strong glycemic control", tv_s)],
    [Paragraph("Triglycerides", tv_bold_s), Paragraph("72 mg/dL", tv_s), Paragraph("\u2713 Excellent", check_s), Paragraph("Well below threshold", tv_s)],
    [Paragraph("HDL Cholesterol", tv_bold_s), Paragraph("66.5 mg/dL", tv_s), Paragraph("\u2713 Favorable", check_s), Paragraph("Favorable range for males", tv_s)],
    [Paragraph("PSA", tv_bold_s), Paragraph("0.9 ng/mL", tv_s), Paragraph("\u2713 Excellent", check_s), Paragraph("No prostate concern \u2014 safe for TRT", tv_s)],
    [Paragraph("RBC Magnesium", tv_bold_s), Paragraph("6.9 mg/dL", tv_s), Paragraph("\u2713 Good", check_s), Paragraph("Intracellular magnesium is solid", tv_s)],
    [Paragraph("Total Testosterone", tv_bold_s), Paragraph("643 ng/dL", tv_s), Paragraph("\u2713 In Range", check_s), Paragraph("Adequate production \u2014 delivery is the issue", tv_s)],
    [Paragraph("Estradiol", tv_bold_s), Paragraph("29.5 pg/mL", tv_s), Paragraph("\u2713 In Range", check_s), Paragraph("Within male reference (7.63\u201342.6)", tv_s)],
    [Paragraph("Kidney Function", tv_bold_s), Paragraph("eGFR 86", tv_s), Paragraph("\u2713 Normal", check_s), Paragraph("Creatinine 0.94, BUN 16.5 \u2014 all clear", tv_s)],
]

strong_tbl = Table(strong_rows, colWidths=[1.4*inch, 1.2*inch, 1.1*inch, 2.6*inch])
strong_tbl.setStyle(TableStyle([
    ('TOPPADDING',    (0,0),(-1,-1), 5),
    ('BOTTOMPADDING', (0,0),(-1,-1), 5),
    ('LEFTPADDING',   (0,0),(-1,-1), 6),
    ('RIGHTPADDING',  (0,0),(-1,-1), 6),
    ('VALIGN',        (0,0),(-1,-1), 'MIDDLE'),
    ('BACKGROUND',    (0,0),(-1,0), LIGHT_GRAY),
    ('ROWBACKGROUNDS',(0,1),(-1,-1), [WHITE, LIGHT_GRAY]),
    ('BOX',           (0,0),(-1,-1), 0.5, RULE_GRAY),
    ('LINEBELOW',     (0,0),(-1,-1), 0.5, RULE_GRAY),
]))
story.append(strong_tbl)

# ── CLINICAL PATTERNS ────────────────────────────────────────────────

story.append(PageBreak())
build_header(story)

story += section_label("Clinical Patterns")

story.append(Paragraph("<b>1. Primary Androgen Insufficiency</b>", comp_s))
story.append(Paragraph(
    "This is the most clinically significant finding. LH is at the absolute ceiling of normal (8.62 vs. max 8.60), "
    "indicating the pituitary is maximally signaling the testes to produce more testosterone. Total testosterone at "
    "643 ng/dL appears adequate on paper, but <b>free testosterone is only 0.7%</b> (reference: 1.0\u20132.7%). SHBG at "
    "48.1 nmol/L is binding too much of what he produces. The net result: his tissues are not receiving adequate "
    "testosterone delivery despite a \u201cnormal\u201d total number.", body_s))
story.append(Spacer(1, 4))
story.append(Paragraph(
    "The low hemoglobin (13.9 g/dL) further supports this pattern \u2014 testosterone is a primary driver of "
    "erythropoiesis, and mild anemia is consistent with functional hypogonadism.", body_s))
story.append(Spacer(1, 8))

story.append(Paragraph("<b>2. Suboptimal Growth Hormone Axis</b>", comp_s))
story.append(Paragraph(
    "IGF-1 at 115 ng/mL falls within the age-adjusted reference (49\u2013214 for age 62), but it is in the lower half. "
    "From a longevity optimization perspective, the target zone is 150\u2013200 ng/mL. This represents an opportunity "
    "for meaningful improvement in body composition, recovery, sleep quality, and tissue repair.", body_s))
story.append(Spacer(1, 8))

story.append(Paragraph("<b>3. Cardiovascular \u2014 Mixed Profile</b>", comp_s))
story.append(Paragraph(
    "LDL at 117 mg/dL is above optimal, but the broader lipid picture is favorable: triglycerides are excellent (72), "
    "HDL is strong (66.5), and the CHOL/HDL ratio (2.98) places him in the \u201cbelow average CHD risk\u201d category. "
    "hs-CRP is nearly undetectable (<0.16), indicating minimal vascular inflammation. <b>Important gap:</b> ApoB and "
    "Lp(a) were not ordered in this panel \u2014 these are the most predictive single markers for cardiovascular risk "
    "and are essential for a complete picture.", body_s))
story.append(Spacer(1, 8))

story.append(Paragraph("<b>4. Mild Hepatic Signal</b>", comp_s))
story.append(Paragraph(
    "ALT at 46 U/L (ref <42) is mildly elevated. In isolation this is not alarming, but it warrants baseline "
    "documentation before initiating any new protocols. Potential contributors include supplements, alcohol, "
    "fatty liver, or medication effects. This should be monitored at each 90-day follow-up.", body_s))
story.append(Spacer(1, 8))

story.append(Paragraph("<b>5. Pre-TRT Hematologic Baseline</b>", comp_s))
story.append(Paragraph(
    "Platelets are elevated at 432 K/uL (ref 130\u2013400). While hemoglobin is currently low (13.9), both of these "
    "markers will shift on TRT \u2014 hemoglobin will rise (desirable, up to a point) and platelet behavior should be "
    "monitored. This baseline makes proactive blood viscosity management essential from day one.", body_s))

# ── MISSING FROM CURRENT PANEL ───────────────────────────────────────

story.append(Spacer(1, 8))
story += section_label("Gaps in Current Lab Panel")
story.append(Paragraph(
    "The following markers were not ordered by the current provider but are critical for a complete longevity assessment:", body_s))
story.append(Spacer(1, 6))

gap_rows = [
    [Paragraph("Missing Marker", th_s), Paragraph("Why It Matters", th_s)],
    [Paragraph("Full Thyroid Panel", tv_bold_s), Paragraph("TSH, Free T3, Free T4, Reverse T3 \u2014 thyroid function entirely unassessed", tv_s)],
    [Paragraph("Apolipoprotein B", tv_bold_s), Paragraph("Single best predictor of cardiovascular risk; LDL particle count > LDL-C", tv_s)],
    [Paragraph("Lp(a)", tv_bold_s), Paragraph("Genetic cardiovascular risk marker \u2014 non-modifiable, must know for risk stratification", tv_s)],
    [Paragraph("Homocysteine", tv_bold_s), Paragraph("Methylation and cardiovascular inflammation marker", tv_s)],
    [Paragraph("Vitamin B12 / Folate", tv_bold_s), Paragraph("Methylation cofactors; relevant to his mild anemia and cardiovascular risk", tv_s)],
    [Paragraph("FSH", tv_bold_s), Paragraph("Only LH was ordered \u2014 need both for full HPG axis evaluation", tv_s)],
    [Paragraph("Iron Panel / Ferritin", tv_bold_s), Paragraph("Essential for anemia workup given low hemoglobin; also relevant to fatigue", tv_s)],
    [Paragraph("GGT", tv_bold_s), Paragraph("Liver marker that adds context to elevated ALT; also a cardiovascular risk marker", tv_s)],
]

gap_tbl = Table(gap_rows, colWidths=[1.8*inch, 5.2*inch])
gap_tbl.setStyle(TableStyle([
    ('TOPPADDING',    (0,0),(-1,-1), 5),
    ('BOTTOMPADDING', (0,0),(-1,-1), 5),
    ('LEFTPADDING',   (0,0),(-1,-1), 8),
    ('RIGHTPADDING',  (0,0),(-1,-1), 8),
    ('VALIGN',        (0,0),(-1,-1), 'TOP'),
    ('BACKGROUND',    (0,0),(-1,0), LIGHT_GRAY),
    ('ROWBACKGROUNDS',(0,1),(-1,-1), [WHITE, LIGHT_GRAY]),
    ('BOX',           (0,0),(-1,-1), 0.5, RULE_GRAY),
    ('LINEBELOW',     (0,0),(-1,-1), 0.5, RULE_GRAY),
]))
story.append(gap_tbl)

# ── PAGE 3: RANGE MEDICAL PROTOCOL RECOMMENDATIONS ───────────────────

story.append(PageBreak())
build_header(story)

story += section_label("Range Medical Protocol Recommendations")

# Protocol 1: TRT
story.append(Paragraph("<b>1. Testosterone Replacement Therapy</b>", comp_s))
story.append(Paragraph("Primary intervention \u2014 addresses the central finding of functional hypogonadism.", body_s))
story.append(Spacer(1, 6))

trt_rows = [
    ("Protocol", "Testosterone Cypionate 200mg/mL"),
    ("Starting Dose", "100\u2013120mg per week"),
    ("Administration", "SubQ daily micro-dosing or IM 2x/week"),
    ("Why SubQ Daily", "More stable serum levels, less estrogen conversion, less hematocrit spike vs. weekly IM"),
    ("Expected Response", "Free T% normalizes to 1.5\u20132.5%, hemoglobin corrects, improved energy/cognition/libido"),
    ("Monitoring", "CBC, Total/Free T, Estradiol, PSA every 90 days"),
]
story.append(info_table(trt_rows, col1=1.6*inch))
story.append(Spacer(1, 4))
story.append(Paragraph("<i>Note: His PSA at 0.9 and estradiol at 29.5 are both favorable baselines for TRT initiation. "
                        "Low hemoglobin (13.9) will likely normalize before any polycythemia risk emerges.</i>", note_s))
story.append(Spacer(1, 8))

# Protocol 2: GH Secretagogue
story.append(Paragraph("<b>2. GH Secretagogue \u2014 Tesamorelin / Ipamorelin 2X Blend</b>", comp_s))
story.append(Paragraph("Targets suboptimal IGF-1 and age-related GH decline.", body_s))
story.append(Spacer(1, 6))

gh_rows = [
    ("Protocol", "2X Blend: Tesamorelin / Ipamorelin"),
    ("Administration", "SubQ evening injection, 5 on / 2 off"),
    ("Phase 1 (Weeks 1\u20134)", "500mcg / 500mcg"),
    ("Phase 2 (Weeks 5\u20138)", "1mg / 1mg"),
    ("Phase 3 (Weeks 9\u201312)", "1.5mg / 1.5mg"),
    ("Target", "IGF-1 from 115 \u2192 150\u2013200 ng/mL"),
    ("Expected Benefits", "Visceral fat reduction, improved sleep, recovery, skin quality, body composition"),
]
story.append(info_table(gh_rows, col1=1.8*inch))
story.append(Spacer(1, 8))

# Protocol 3: Longevity Peptides
story.append(Paragraph("<b>3. Longevity Peptides</b>", comp_s))
story.append(Paragraph("Age-appropriate cellular optimization for a 62-year-old with strong metabolic baseline.", body_s))
story.append(Spacer(1, 6))

longevity_rows = [
    ("MOTS-C", "5mg every 5 days \u00d7 20 days, 3x/year \u2014 mitochondrial optimization, metabolic enhancement"),
    ("Epithalon", "10mg daily \u00d7 20 days \u2014 telomerase activation, cellular aging defense"),
    ("NAD+ (injectable)", "50\u2013200mg, 2\u20133x weekly \u2014 mitochondrial cofactor, DNA repair, cellular energy"),
]
story.append(info_table(longevity_rows, col1=1.4*inch))
story.append(Spacer(1, 8))

# Protocol 4: IV Therapy
story.append(Paragraph("<b>4. IV Therapy</b>", comp_s))
story.append(Spacer(1, 4))
bullet_items = [
    "<b>NAD+ IV</b> \u2014 Mitochondrial support, cellular energy production, DNA repair. Especially valuable at 62.",
    "<b>Glutathione IV</b> \u2014 Master antioxidant; supports liver function (relevant given ALT at 46) and detoxification.",
    "<b>Methylene Blue IV</b> \u2014 Mitochondrial electron transport chain support, cognitive enhancement, neuroprotection.",
    "<b>High-Dose Vitamin C IV</b> \u2014 Immune support, collagen synthesis, antioxidant defense.",
]
for b in bullet_items:
    story.append(bullet(b))

# ── PAGE 4: HEMATOCRIT MANAGEMENT + SUPPLEMENT STACK ─────────────────

story.append(PageBreak())
build_header(story)

story += section_label("TRT Support \u2014 Hematocrit & Blood Viscosity Management")

story.append(Paragraph(
    "Testosterone replacement increases red blood cell production (erythropoiesis). While Roberto\u2019s hemoglobin is "
    "currently <i>low</i> at 13.9, his platelets are already elevated at 432. A proactive approach to blood viscosity "
    "management is built into every Range Medical TRT protocol from day one \u2014 not added reactively after problems emerge.", body_s))
story.append(Spacer(1, 8))

story.append(Paragraph("<b>Monitoring Schedule</b>", sub_s))
story.append(Spacer(1, 4))

monitor_rows = [
    [Paragraph("Marker", th_s), Paragraph("Frequency", th_s), Paragraph("Action Threshold", th_s)],
    [Paragraph("Hematocrit", tv_bold_s), Paragraph("Every 90 days", tv_s), Paragraph(">50% \u2192 assess; >52% \u2192 dose reduction; >54% \u2192 hold + therapeutic phlebotomy", tv_s)],
    [Paragraph("Hemoglobin", tv_bold_s), Paragraph("Every 90 days", tv_s), Paragraph("Target 15\u201316.5 g/dL; >17.5 \u2192 flag", tv_s)],
    [Paragraph("Platelets", tv_bold_s), Paragraph("Every 90 days", tv_s), Paragraph("Baseline 432 (elevated) \u2014 watch for further rise on TRT", tv_s)],
    [Paragraph("RBC Count", tv_bold_s), Paragraph("Every 90 days", tv_s), Paragraph("Monitor for polycythemia trend", tv_s)],
    [Paragraph("Ferritin", tv_bold_s), Paragraph("Every 90 days", tv_s), Paragraph("Rising ferritin + rising HCT = early polycythemia signal", tv_s)],
]

monitor_tbl = Table(monitor_rows, colWidths=[1.2*inch, 1.3*inch, 4.5*inch])
monitor_tbl.setStyle(TableStyle([
    ('TOPPADDING',    (0,0),(-1,-1), 5),
    ('BOTTOMPADDING', (0,0),(-1,-1), 5),
    ('LEFTPADDING',   (0,0),(-1,-1), 6),
    ('RIGHTPADDING',  (0,0),(-1,-1), 6),
    ('VALIGN',        (0,0),(-1,-1), 'TOP'),
    ('BACKGROUND',    (0,0),(-1,0), LIGHT_GRAY),
    ('ROWBACKGROUNDS',(0,1),(-1,-1), [WHITE, LIGHT_GRAY]),
    ('BOX',           (0,0),(-1,-1), 0.5, RULE_GRAY),
    ('LINEBELOW',     (0,0),(-1,-1), 0.5, RULE_GRAY),
]))
story.append(monitor_tbl)
story.append(Spacer(1, 8))

story.append(Paragraph("<b>Administration Strategy</b>", sub_s))
story.append(Spacer(1, 4))
story.append(bullet("<b>Daily SubQ micro-dosing over weekly IM injections.</b> Smaller, more frequent doses produce more stable serum levels with significantly less hematocrit spike. A 100mg/week dose split into 7 daily SubQ injections (~14mg/day) avoids the peak-and-trough pattern that drives erythropoiesis harder than necessary."))
story.append(bullet("<b>Dose titration over brute force.</b> Start at 100\u2013120mg/week. Optimize free T% first. Only increase dose if labs at 90 days show room to move safely."))
story.append(Spacer(1, 10))

story += section_label("Essential TRT Support Supplement Stack")

story.append(Paragraph(
    "The following supplements are recommended as standard adjuncts to TRT. They address lipid management, "
    "blood viscosity, liver protection, estrogen metabolism, and mitochondrial function \u2014 all critical "
    "for a 62-year-old male initiating testosterone therapy.", body_s))
story.append(Spacer(1, 8))

# Supplement table
supp_header = [
    Paragraph("Supplement", th_s),
    Paragraph("Dose", th_s),
    Paragraph("Purpose", th_s),
]
supp_rows = [
    supp_header,
    [Paragraph("Fish Oil (EPA/DHA)", tv_bold_s),
     Paragraph("3\u20134g EPA+DHA daily", tv_s),
     Paragraph("Blood viscosity reduction, triglyceride management, systemic anti-inflammatory, neuroprotection", tv_s)],
    [Paragraph("Nattokinase", tv_bold_s),
     Paragraph("4,000\u201311,000 FU daily", tv_s),
     Paragraph("Fibrinolytic enzyme \u2014 reduces blood viscosity, breaks down fibrin deposits. Critical with elevated platelets (432) and impending TRT. Above 11,000 FU helps clear fibrotic buildup.", tv_s)],
    [Paragraph("CoQ10 (Ubiquinol)", tv_bold_s),
     Paragraph("200\u2013400mg daily", tv_s),
     Paragraph("Mitochondrial electron transport chain cofactor, antioxidant, cardioprotective. Production declines with age. Essential if ever on a statin.", tv_s)],
    [Paragraph("Citrus Bergamot", tv_bold_s),
     Paragraph("500\u20131,000mg daily", tv_s),
     Paragraph("Natural lipid optimizer \u2014 lowers LDL and ApoB, raises HDL. Directly targets his LDL of 117.", tv_s)],
    [Paragraph("DIM (Diindolylmethane)", tv_bold_s),
     Paragraph("200\u2013300mg daily", tv_s),
     Paragraph("Shifts estrogen metabolism toward favorable 2-hydroxyestrone pathway. Important on TRT as testosterone aromatizes to estrogen. Preferable to an AI (aromatase inhibitor) as first-line.", tv_s)],
    [Paragraph("NAC (N-Acetyl Cysteine)", tv_bold_s),
     Paragraph("600\u20131,200mg daily", tv_s),
     Paragraph("Glutathione precursor, liver protection (relevant: ALT at 46), powerful antioxidant, supports detox pathways.", tv_s)],
    [Paragraph("Curcumin + Boswellia", tv_bold_s),
     Paragraph("500mg / 300mg daily", tv_s),
     Paragraph("Anti-inflammatory, hepatoprotective. Range also offers injectable curcumin (45\u201390mg) at 10x oral bioavailability.", tv_s)],
    [Paragraph("Vitamin D3 + K2", tv_bold_s),
     Paragraph("5,000\u201310,000 IU D3 + 200mcg K2 daily", tv_s),
     Paragraph("Current level 45.9 \u2014 target 60\u201380 ng/mL. K2 ensures calcium goes to bones, not arteries.", tv_s)],
    [Paragraph("IP6 (Inositol Hexaphosphate)", tv_bold_s),
     Paragraph("800\u20131,200mg on empty stomach", tv_s),
     Paragraph("Iron chelator \u2014 helps manage iron/ferritin levels as hematocrit rises on TRT. Natural alternative to frequent phlebotomy.", tv_s)],
]

supp_tbl = Table(supp_rows, colWidths=[1.6*inch, 1.4*inch, 4.0*inch])
supp_tbl.setStyle(TableStyle([
    ('TOPPADDING',    (0,0),(-1,-1), 5),
    ('BOTTOMPADDING', (0,0),(-1,-1), 5),
    ('LEFTPADDING',   (0,0),(-1,-1), 6),
    ('RIGHTPADDING',  (0,0),(-1,-1), 6),
    ('VALIGN',        (0,0),(-1,-1), 'TOP'),
    ('BACKGROUND',    (0,0),(-1,0), LIGHT_GRAY),
    ('ROWBACKGROUNDS',(0,1),(-1,-1), [WHITE, LIGHT_GRAY]),
    ('BOX',           (0,0),(-1,-1), 0.5, RULE_GRAY),
    ('LINEBELOW',     (0,0),(-1,-1), 0.5, RULE_GRAY),
]))
story.append(supp_tbl)

# ── PAGE 5: ADVANCED SUPPLEMENTS + HYDRATION ─────────────────────────

story.append(PageBreak())
build_header(story)

story += section_label("Advanced Support \u2014 Mitochondrial & Metabolic Optimization")

story.append(Paragraph(
    "The following are situationally valuable additions for insulin sensitivity, mitochondrial function, "
    "and cellular longevity in a 62-year-old male.", body_s))
story.append(Spacer(1, 8))

adv_rows = [
    [Paragraph("Supplement", th_s), Paragraph("Dose", th_s), Paragraph("Purpose", th_s)],
    [Paragraph("Dihydroberberine", tv_bold_s),
     Paragraph("150\u2013300mg 2\u20133x daily", tv_s),
     Paragraph("Superior bioavailability vs. berberine. AMPK activator, insulin sensitizer. His fasting glucose at 98 (borderline) would benefit. Metformin-like effects without the prescription.", tv_s)],
    [Paragraph("ALA (Alpha Lipoic Acid)", tv_bold_s),
     Paragraph("300\u2013600mg daily", tv_s),
     Paragraph("Universal antioxidant (both water- and fat-soluble), insulin sensitizer, supports glucose metabolism, regenerates vitamins C and E.", tv_s)],
    [Paragraph("PQQ (Pyrroloquinoline Quinone)", tv_bold_s),
     Paragraph("20\u201340mg daily", tv_s),
     Paragraph("Stimulates mitochondrial biogenesis \u2014 the creation of new mitochondria. Works synergistically with CoQ10. Neuroprotective.", tv_s)],
    [Paragraph("Urolithin A", tv_bold_s),
     Paragraph("500\u20131,000mg daily", tv_s),
     Paragraph("Triggers mitophagy \u2014 clearance of damaged mitochondria. Clinically shown to improve muscle endurance and mitochondrial function in aging populations.", tv_s)],
    [Paragraph("NR + Quercetin", tv_bold_s),
     Paragraph("300mg NR + 500mg Quercetin", tv_s),
     Paragraph("NR (Nicotinamide Riboside) is an NAD+ precursor for daily oral support between IV NAD+ sessions. Quercetin is a senolytic \u2014 helps clear senescent (zombie) cells. Powerful combination for cellular aging.", tv_s)],
    [Paragraph("Naringin / Grapefruit Extract", tv_bold_s),
     Paragraph("500mg daily", tv_s),
     Paragraph("Specifically supports hematocrit management on TRT \u2014 helps modulate red blood cell production. Natural adjunct before reaching for phlebotomy. <b>Note:</b> check drug interactions.", tv_s)],
]

adv_tbl = Table(adv_rows, colWidths=[1.7*inch, 1.4*inch, 3.9*inch])
adv_tbl.setStyle(TableStyle([
    ('TOPPADDING',    (0,0),(-1,-1), 5),
    ('BOTTOMPADDING', (0,0),(-1,-1), 5),
    ('LEFTPADDING',   (0,0),(-1,-1), 6),
    ('RIGHTPADDING',  (0,0),(-1,-1), 6),
    ('VALIGN',        (0,0),(-1,-1), 'TOP'),
    ('BACKGROUND',    (0,0),(-1,0), LIGHT_GRAY),
    ('ROWBACKGROUNDS',(0,1),(-1,-1), [WHITE, LIGHT_GRAY]),
    ('BOX',           (0,0),(-1,-1), 0.5, RULE_GRAY),
    ('LINEBELOW',     (0,0),(-1,-1), 0.5, RULE_GRAY),
]))
story.append(adv_tbl)
story.append(Spacer(1, 10))

story += section_label("Hydration & Lifestyle Protocol for Blood Viscosity")

story.append(Paragraph(
    "Blood viscosity management on TRT is not just supplements \u2014 hydration and lifestyle are foundational.", body_s))
story.append(Spacer(1, 6))

bullet_items_hydration = [
    "<b>Hydration target:</b> Minimum 100\u2013120 oz water daily. Dehydration concentrates blood and falsely elevates hematocrit. Many \u201chigh hematocrit\u201d readings are actually dehydration artifacts.",
    "<b>Electrolyte support:</b> Sodium, potassium, magnesium in water \u2014 not just plain water. Proper electrolyte balance improves cellular hydration and blood flow.",
    "<b>Regular blood donation or therapeutic phlebotomy:</b> If hematocrit exceeds 52% despite conservative dosing and supplement support, scheduled blood draws (every 8\u201312 weeks) are the definitive intervention. This also lowers ferritin and reduces oxidative stress.",
    "<b>Cardio exercise:</b> Regular aerobic activity (30\u201345 min, 4\u20135x/week) improves blood flow, promotes vascular health, and helps the body adapt to higher RBC counts without viscosity issues.",
    "<b>Avoid excess alcohol:</b> Alcohol dehydrates, stresses the liver (ALT already at 46), and can compound platelet aggregation issues.",
    "<b>Sleep optimization:</b> Sleep apnea \u2014 common in men on TRT \u2014 causes chronic intermittent hypoxia, which drives hematocrit up independently of testosterone. Screen for sleep apnea if hematocrit rises disproportionately.",
]
for b in bullet_items_hydration:
    story.append(bullet(b))

story.append(Spacer(1, 10))

# ── SUMMARY ──────────────────────────────────────────────────────────

story += section_label("Summary \u2014 Range Medical vs. Current Care")

summary_rows = [
    [Paragraph("Area", th_s), Paragraph("Beyond Wellness (Current)", th_s), Paragraph("Range Medical (Proposed)", th_s)],
    [Paragraph("Lab Panel", tv_bold_s),
     Paragraph("CBC, CMP, lipids, hormones, Vitamin D, hs-CRP, insulin, IGF-1, PSA \u2014 decent but incomplete", tv_s),
     Paragraph("All of the above + full thyroid, ApoB, Lp(a), homocysteine, B12/folate, iron panel, FSH, GGT", tv_s)],
    [Paragraph("Testosterone", tv_bold_s),
     Paragraph("Likely no intervention \u2014 total T at 643 \u201clooks normal\u201d", tv_s),
     Paragraph("TRT at 100\u2013120mg/week SubQ daily \u2014 targeting free T%, not just total T", tv_s)],
    [Paragraph("GH Axis", tv_bold_s),
     Paragraph("Not addressed", tv_s),
     Paragraph("Tesa/Ipa 2X Blend \u2014 progressive 90-day protocol targeting IGF-1 of 150\u2013200", tv_s)],
    [Paragraph("Blood Viscosity", tv_bold_s),
     Paragraph("Platelets flagged but no proactive management plan", tv_s),
     Paragraph("Nattokinase, IP6, naringin, hydration protocol, 90-day CBC monitoring, phlebotomy thresholds", tv_s)],
    [Paragraph("Supplement Stack", tv_bold_s),
     Paragraph("Not part of standard Beyond Wellness protocol", tv_s),
     Paragraph("Complete TRT support stack: fish oil, CoQ10, DIM, NAC, citrus bergamot, D3+K2, curcumin", tv_s)],
    [Paragraph("IV Therapy", tv_bold_s),
     Paragraph("Not available", tv_s),
     Paragraph("NAD+, glutathione, methylene blue, high-dose vitamin C", tv_s)],
    [Paragraph("Longevity Peptides", tv_bold_s),
     Paragraph("Not available", tv_s),
     Paragraph("MOTS-C, Epithalon, injectable NAD+, injectable curcumin", tv_s)],
    [Paragraph("LDL Management", tv_bold_s),
     Paragraph("LDL flagged at 117 \u2014 likely to recommend statin", tv_s),
     Paragraph("Citrus bergamot + fish oil + metabolic optimization first; ApoB for true particle risk", tv_s)],
    [Paragraph("Monitoring", tv_bold_s),
     Paragraph("Unknown cadence", tv_s),
     Paragraph("Full panel every 90 days with AI-generated synopsis and provider review", tv_s)],
]

summary_tbl = Table(summary_rows, colWidths=[1.2*inch, 2.9*inch, 2.9*inch])
summary_tbl.setStyle(TableStyle([
    ('TOPPADDING',    (0,0),(-1,-1), 5),
    ('BOTTOMPADDING', (0,0),(-1,-1), 5),
    ('LEFTPADDING',   (0,0),(-1,-1), 6),
    ('RIGHTPADDING',  (0,0),(-1,-1), 6),
    ('VALIGN',        (0,0),(-1,-1), 'TOP'),
    ('BACKGROUND',    (0,0),(-1,0), LIGHT_GRAY),
    ('ROWBACKGROUNDS',(0,1),(-1,-1), [WHITE, LIGHT_GRAY]),
    ('BOX',           (0,0),(-1,-1), 0.5, RULE_GRAY),
    ('LINEBELOW',     (0,0),(-1,-1), 0.5, RULE_GRAY),
]))
story.append(summary_tbl)
story.append(Spacer(1, 12))

story.append(Paragraph(
    "<i>This analysis is prepared for consultation purposes. All treatment recommendations require "
    "provider evaluation and patient consent before initiation. Labs should be repeated through "
    "Range Medical\u2019s lab partner (Primex) to establish baseline values under our monitoring system.</i>", note_s))

story.append(Spacer(1, 8))
build_footer(story)
doc.build(story)

print(f"PDF generated: {os.path.abspath(OUTPUT_PATH)}")
