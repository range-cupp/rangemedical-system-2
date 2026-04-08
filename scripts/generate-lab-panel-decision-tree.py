#!/usr/bin/env python3
"""Generate Lab Panel Decision Tree PDF — Patient Handout (p1) + Front Desk Reference (p2)"""

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
LIGHT_GREEN = HexColor('#F0FDF4')
GREEN_BORDER = HexColor('#BBF7D0')
YELLOW_BG  = HexColor('#FFFBE6')
YELLOW_BORDER = HexColor('#E6C200')

def st(name, **kw):
    return ParagraphStyle(name, **kw)

OUTPUT_PATH = os.path.join(os.path.dirname(__file__), '..', 'public', 'docs', 'lab-panel-decision-tree.pdf')

doc = SimpleDocTemplate(
    OUTPUT_PATH,
    pagesize=letter,
    rightMargin=0.5*inch, leftMargin=0.5*inch,
    topMargin=0.45*inch,  bottomMargin=0.45*inch,
)

W = letter[0] - 1.0*inch  # usable width

# ── STYLES ────────────────────────────────────────────────────────────────────

clinic_s      = st('Clinic',  fontName='Helvetica-Bold',    fontSize=13,  textColor=BLACK,  leading=16)
contact_s     = st('Cont',    fontName='Helvetica',         fontSize=8,   textColor=MID_GRAY, leading=11, alignment=TA_RIGHT)
title_s       = st('Title',   fontName='Helvetica-Bold',    fontSize=15,  textColor=BLACK,  leading=18, spaceAfter=1)
subtitle_s    = st('Sub',     fontName='Helvetica-Oblique', fontSize=9,   textColor=MID_GRAY, leading=11)
sec_s         = st('Sec',     fontName='Helvetica-Bold',    fontSize=7.5, textColor=MID_GRAY, leading=10, spaceBefore=5, spaceAfter=2)
body_s        = st('Body',    fontName='Helvetica',         fontSize=9,   textColor=DARK_GRAY, leading=13)
th_s          = st('TH',      fontName='Helvetica-Bold',    fontSize=7,   textColor=MID_GRAY, leading=9)
foot_s        = st('Foot',    fontName='Helvetica-Oblique', fontSize=7,   textColor=MID_GRAY, leading=10)
foot_bold_s   = st('FootB',   fontName='Helvetica-Bold',    fontSize=7.5, textColor=DARK_GRAY, leading=10)
note_s        = st('Note',    fontName='Helvetica-Oblique', fontSize=7.5, textColor=MID_GRAY, leading=11)

panel_hdr_s   = st('PH',     fontName='Helvetica-Bold',    fontSize=10,  textColor=WHITE,  leading=13)
panel_price_s = st('PP',     fontName='Helvetica-Bold',    fontSize=14,  textColor=WHITE,  leading=16, alignment=TA_RIGHT)
panel_tag_s   = st('PT',     fontName='Helvetica-Bold',    fontSize=8,   textColor=BLACK,  leading=11, spaceAfter=3)
mkr_label_s   = st('ML',     fontName='Helvetica-Bold',    fontSize=6.5, textColor=MID_GRAY, leading=8, spaceBefore=3, spaceAfter=0)
mkr_s         = st('M',      fontName='Helvetica',         fontSize=7.5, textColor=DARK_GRAY, leading=11, spaceAfter=1)
mkr_green_s   = st('MG',     fontName='Helvetica-Bold',    fontSize=7.5, textColor=GREEN,  leading=11, spaceAfter=1)
q_s           = st('Q',      fontName='Helvetica-Bold',    fontSize=8.5, textColor=BLACK,  leading=12)
ans_s         = st('A',      fontName='Helvetica-Oblique', fontSize=7.5, textColor=DARK_GRAY, leading=11)
intro_s       = st('Intro',  fontName='Helvetica',         fontSize=9,   textColor=DARK_GRAY, leading=13)

sc_label_s    = st('SL',     fontName='Helvetica-Bold',    fontSize=6.5, textColor=HexColor('#92400E'), leading=8)
sc_s          = st('SC',     fontName='Helvetica-Oblique', fontSize=7.5, textColor=DARK_GRAY, leading=11)
prof_s        = st('PF',     fontName='Helvetica-Bold',    fontSize=7.5, textColor=BLACK,  leading=11)
reason_s      = st('R',      fontName='Helvetica',         fontSize=7.5, textColor=DARK_GRAY, leading=11)
tag_e_s       = st('TE',     fontName='Helvetica-Bold',    fontSize=7,   textColor=BLACK,  leading=10)
tag_el_s      = st('TEL',    fontName='Helvetica-Bold',    fontSize=7,   textColor=GREEN,  leading=10)
rule_w_s      = st('RW',     fontName='Helvetica',         fontSize=8,   textColor=HexColor('#DDDDDD'), leading=12)
rule_n_s      = st('RN',     fontName='Helvetica-Bold',    fontSize=8,   textColor=MID_GRAY, leading=12)
bio_t_s       = st('BT',     fontName='Helvetica-Bold',    fontSize=8,   textColor=GREEN,  leading=11, spaceAfter=1)
bio_b_s       = st('BB',     fontName='Helvetica',         fontSize=7,   textColor=DARK_GRAY, leading=10, spaceAfter=1)
bio_p_s       = st('BP',     fontName='Helvetica-Bold',    fontSize=6.5, textColor=HexColor('#065F46'), leading=9)

def section_label(text):
    return [
        Paragraph(text.upper(), sec_s),
        HRFlowable(width="100%", thickness=0.75, color=RULE_GRAY, spaceAfter=5),
    ]

def build_header(story):
    hdr = Table([[
        Paragraph("RANGE MEDICAL", clinic_s),
        Paragraph("range-medical.com  \u2022  (949) 997-3988<br/>1901 Westcliff Dr, Suite 10, Newport Beach, CA", contact_s),
    ]], colWidths=[2.8*inch, W - 2.8*inch])
    hdr.setStyle(TableStyle([
        ('VALIGN',(0,0),(-1,-1),'MIDDLE'),
        ('TOPPADDING',(0,0),(-1,-1),0),('BOTTOMPADDING',(0,0),(-1,-1),4),
        ('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),0),
    ]))
    story.append(hdr)
    story.append(HRFlowable(width="100%", thickness=1.5, color=BLACK, spaceAfter=8))

def build_footer(story):
    story.append(HRFlowable(width="100%", thickness=0.5, color=RULE_GRAY, spaceAfter=4))
    tbl = Table([[
        Paragraph("<b>Questions?</b>  Call or text: (949) 997-3988  \u2022  range-medical.com", foot_bold_s),
        Paragraph(
            "For Range Medical patients only. Not a substitute for personalized medical advice.",
            foot_s),
    ]], colWidths=[3.0*inch, W - 3.0*inch])
    tbl.setStyle(TableStyle([
        ('VALIGN',(0,0),(-1,-1),'TOP'),
        ('TOPPADDING',(0,0),(-1,-1),0),('BOTTOMPADDING',(0,0),(-1,-1),0),
        ('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),0),
    ]))
    story.append(tbl)

story = []

# ════════════════════════════════════════════════════════════════════════════
# PAGE 1: PATIENT HANDOUT
# ════════════════════════════════════════════════════════════════════════════

build_header(story)

story.append(Paragraph("LAB PANEL GUIDE", title_s))
story.append(Paragraph("Essential vs. Elite \u2014 Which panel is right for you?", subtitle_s))
story.append(Spacer(1, 6))

# Intro
intro_tbl = Table([[
    Paragraph(
        "<b>Both panels qualify you for every treatment we offer.</b> "
        "The Essential gives us what we need to build your plan. The Elite goes deeper \u2014 "
        "adding advanced heart markers, inflammation, and a full vitamin and mineral panel "
        "for patients who want the most complete picture.",
        intro_s
    )
]], colWidths=[W])
intro_tbl.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,-1), LIGHT_GRAY),
    ('BOX', (0,0), (-1,-1), 0.5, RULE_GRAY),
    ('TOPPADDING', (0,0), (-1,-1), 7), ('BOTTOMPADDING', (0,0), (-1,-1), 7),
    ('LEFTPADDING', (0,0), (-1,-1), 10), ('RIGHTPADDING', (0,0), (-1,-1), 10),
]))
story.append(intro_tbl)
story.append(Spacer(1, 8))

# ── SIDE-BY-SIDE PANELS ──────────────────────────────────────────────────────

col_w = W / 2

# Headers
hdr_data = [[
    Paragraph("ESSENTIAL PANEL", panel_hdr_s),
    Paragraph("$350", panel_price_s),
    Paragraph("ELITE PANEL", panel_hdr_s),
    Paragraph("$750", panel_price_s),
]]
hdr_tbl = Table(hdr_data, colWidths=[col_w * 0.6, col_w * 0.4, col_w * 0.6, col_w * 0.4])
hdr_tbl.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (1,0), BLACK),
    ('BACKGROUND', (2,0), (3,0), GREEN),
    ('TOPPADDING', (0,0), (-1,-1), 6), ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ('LEFTPADDING', (0,0), (0,0), 8), ('LEFTPADDING', (2,0), (2,0), 8),
    ('RIGHTPADDING', (1,0), (1,0), 8), ('RIGHTPADDING', (3,0), (3,0), 8),
    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
]))
story.append(hdr_tbl)

# Body
ess = [
    Paragraph("Everything you need to start treatment.", panel_tag_s),
    Paragraph("BASIC HEALTH", mkr_label_s),
    Paragraph("CMP (liver, kidneys, blood sugar) \u2022 Lipid Panel (cholesterol, triglycerides) \u2022 CBC (blood cells, anemia, infection)", mkr_s),
    Paragraph("HORMONES", mkr_label_s),
    Paragraph("Testosterone (Total &amp; Free) \u2022 SHBG \u2022 Estradiol \u2022 FSH", mkr_s),
    Paragraph("THYROID", mkr_label_s),
    Paragraph("TSH \u2022 T3 Free \u2022 T4 Total \u2022 TPO Antibodies", mkr_s),
    Paragraph("METABOLISM &amp; VITAMINS", mkr_label_s),
    Paragraph("Fasting Insulin \u2022 HgbA1c \u2022 Vitamin D", mkr_s),
]

elite = [
    Paragraph("The full picture \u2014 everything in Essential, plus:", panel_tag_s),
    Paragraph("ADVANCED HEART HEALTH", mkr_label_s),
    Paragraph("Apolipoprotein A-1 \u2022 Apolipoprotein B \u2022 Lipoprotein(a) \u2022 Homocysteine", mkr_green_s),
    Paragraph("INFLAMMATION", mkr_label_s),
    Paragraph("CRP-HS (high-sensitivity) \u2022 Sed Rate", mkr_green_s),
    Paragraph("DEEPER HORMONES", mkr_label_s),
    Paragraph("DHEA-S \u2022 IGF-1 \u2022 Cortisol \u2022 LH", mkr_green_s),
    Paragraph("EXTENDED THYROID", mkr_label_s),
    Paragraph("T4 Free \u2022 Thyroglobulin Antibodies", mkr_green_s),
    Paragraph("METABOLISM + VITAMINS &amp; MINERALS", mkr_label_s),
    Paragraph("Uric Acid \u2022 GGT \u2022 B12 \u2022 Folate \u2022 Magnesium \u2022 Iron \u2022 TIBC \u2022 Ferritin", mkr_green_s),
]

body_tbl = Table([[ess, elite]], colWidths=[col_w, col_w])
body_tbl.setStyle(TableStyle([
    ('BOX', (0,0), (0,0), 0.5, RULE_GRAY),
    ('BOX', (1,0), (1,0), 0.5, RULE_GRAY),
    ('TOPPADDING', (0,0), (-1,-1), 6), ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ('LEFTPADDING', (0,0), (-1,-1), 7), ('RIGHTPADDING', (0,0), (-1,-1), 7),
    ('VALIGN', (0,0), (-1,-1), 'TOP'),
]))
story.append(body_tbl)
story.append(Spacer(1, 8))

# ── WHY THESE MARKERS MATTER (single compact paragraph) ──────────────────────

story += section_label("Why the Elite Markers Matter")

story.append(Paragraph(
    "<b>Apo B</b> counts the particles carrying cholesterol into your artery walls \u2014 a better predictor than LDL alone. "
    "<b>Lipoprotein(a)</b> is genetic, can\u2019t be changed by diet, and is one of the strongest risk factors for heart attack and stroke. "
    "<b>Apo A-1</b> measures your body\u2019s ability to clear cholesterol out. Together, these are the gold standard for cardiac risk. "
    "<b>CRP-HS</b> and <b>Homocysteine</b> catch silent inflammation before you feel anything. "
    "The full vitamin/mineral panel (B12, folate, magnesium, iron, ferritin) reveals deficiencies affecting energy, sleep, and recovery.",
    body_s
))
story.append(Spacer(1, 8))

# ── DECISION QUESTIONS ────────────────────────────────────────────────────────

story += section_label("Which Panel Is Right for You?")

questions = [
    ("What brought you in today?",
     "\u201cI know what I want \u2014 hormones, weight loss, or peptides.\u201d",
     "\u201cI want to understand what\u2019s going on inside my body \u2014 the full picture.\u201d"),
    ("Family history of heart disease, stroke, or high cholesterol?",
     "\u201cNo, or I\u2019m not sure. Basic lipids are fine.\u201d",
     "\u201cYes \u2014 I want Apo B, Lp(a), and real cardiac risk.\u201d"),
    ("How deep do you want to go?",
     "\u201cWhat I need to qualify for treatment.\u201d",
     "\u201cThe longevity-grade workup \u2014 inflammation, vitamins, the works.\u201d"),
]

for question, ess_ans, elite_ans in questions:
    q_data = [[
        Paragraph(question, q_s),
        Paragraph("<b>ESSENTIAL:</b> " + ess_ans, ans_s),
        Paragraph("<font color='#2E6B35'><b>ELITE:</b></font> " + elite_ans, ans_s),
    ]]
    q_tbl = Table(q_data, colWidths=[2.2*inch, 2.55*inch, 2.75*inch])
    q_tbl.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,0), LIGHT_GRAY),
        ('BACKGROUND', (1,0), (1,0), WHITE),
        ('BACKGROUND', (2,0), (2,0), LIGHT_GREEN),
        ('BOX', (0,0), (-1,-1), 0.5, RULE_GRAY),
        ('LINEAFTER', (0,0), (1,0), 0.5, RULE_GRAY),
        ('TOPPADDING', (0,0), (-1,-1), 4), ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 5), ('RIGHTPADDING', (0,0), (-1,-1), 5),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(q_tbl)
    story.append(Spacer(1, 2))

story.append(Spacer(1, 4))

# ── BOTTOM LINE ───────────────────────────────────────────────────────────────

bottom_tbl = Table([[
    Paragraph(
        "<b>Bottom line:</b> The Essential gives you everything you need to start any treatment at Range. "
        "The Elite gives you the same markers longevity specialists use to catch problems 10\u201320 years early. "
        "Both include labs drawn here and a one-on-one provider review.",
        body_s
    )
]], colWidths=[W])
bottom_tbl.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,-1), LIGHT_GRAY),
    ('BOX', (0,0), (-1,-1), 0.5, RULE_GRAY),
    ('TOPPADDING', (0,0), (-1,-1), 6), ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ('LEFTPADDING', (0,0), (-1,-1), 8), ('RIGHTPADDING', (0,0), (-1,-1), 8),
]))
story.append(bottom_tbl)
story.append(Spacer(1, 6))

build_footer(story)

# ════════════════════════════════════════════════════════════════════════════
# PAGE 2: FRONT DESK REFERENCE
# ════════════════════════════════════════════════════════════════════════════

story.append(PageBreak())
build_header(story)

story.append(Paragraph("LAB PANEL DECISION TREE", title_s))
story.append(Paragraph("Front Desk Reference \u2014 Internal Use Only", subtitle_s))
story.append(Spacer(1, 3))

# ── PATIENT PROFILE TABLE ─────────────────────────────────────────────────────

story += section_label("Patient Profile \u2192 Panel Match")

profiles = [
    ("\u201cI want testosterone\u201d / \u201cI need HRT\u201d",     "ESS",   "Covers total &amp; free T, SHBG, estradiol, thyroid, metabolic markers."),
    ("\u201cI want to lose weight\u201d / GLP-1",                     "ESS",   "Covers insulin, A1c, lipids, thyroid \u2014 all needed to prescribe."),
    ("\u201cI just want to see where I\u2019m at\u201d",             "ESS",   "Great starting point. Can upgrade to Elite next time."),
    ("\u201cMy dad had a heart attack\u201d / family history",       "ELITE", "Apo B, Lp(a), homocysteine are must-haves for hereditary risk."),
    ("\u201cI want the full longevity workup\u201d",                 "ELITE", "This IS the longevity workup \u2014 Apo B, Lp(a), CRP-HS, IGF-1, minerals."),
    ("\u201cI\u2019m always tired, don\u2019t know why\u201d",       "ELITE", "Could be hormones, thyroid, iron, B12, cortisol, or inflammation."),
    ("Mentions Apo B, Lp(a), or specific markers",                   "ELITE", "They\u2019ve done research. Give them what they came for."),
    ("Biohacker / optimization / Attia listener",                     "ELITE", "They\u2019ll be disappointed with a basic panel."),
    ("\u201cWhat do you recommend?\u201d / unsure",                  "ESS",   "Start Essential. Mention Elite if they want to go deeper."),
]

tbl_data = [[Paragraph("PATIENT SAYS", th_s), Paragraph("PANEL", th_s), Paragraph("WHY", th_s)]]
for profile, panel, why in profiles:
    color = GREEN if panel == "ELITE" else BLACK
    s = tag_el_s if panel == "ELITE" else tag_e_s
    tbl_data.append([
        Paragraph(profile, prof_s),
        Paragraph(f"<font color='{color.hexval()}'>{panel}</font>", s),
        Paragraph(why, reason_s),
    ])

prof_tbl = Table(tbl_data, colWidths=[2.1*inch, 0.5*inch, W - 2.6*inch])
prof_tbl.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,0), LIGHT_GRAY),
    ('LINEBELOW', (0,0), (-1,0), 0.75, RULE_GRAY),
    ('ROWBACKGROUNDS', (0,1), (-1,-1), [WHITE, LIGHT_GRAY]),
    ('LINEBELOW', (0,1), (-1,-2), 0.5, RULE_GRAY),
    ('BOX', (0,0), (-1,-1), 0.5, RULE_GRAY),
    ('TOPPADDING', (0,0), (-1,-1), 2), ('BOTTOMPADDING', (0,0), (-1,-1), 2),
    ('LEFTPADDING', (0,0), (-1,-1), 4), ('RIGHTPADDING', (0,0), (-1,-1), 4),
    ('VALIGN', (0,0), (-1,-1), 'TOP'),
]))
story.append(prof_tbl)
story.append(Spacer(1, 4))

# ── SCRIPTS ───────────────────────────────────────────────────────────────────

story += section_label("What to Say")

scripts = [
    ("THE 10-SECOND EXPLANATION",
     "\u201cBoth panels qualify you for any treatment. Essential at $350 covers hormones, thyroid, metabolism. "
     "Elite at $750 adds heart markers like Apo B and Lp(a), inflammation, and a full vitamin/mineral panel.\u201d"),
    ("\u201cIS THE ELITE WORTH IT?\u201d",
     "\u201cIf you have family history of heart issues or want to catch things early, absolutely. "
     "Apo B and Lp(a) are the gold standard \u2014 most primary care doctors never order them.\u201d"),
    ("PRICE HESITATION",
     "\u201cNo pressure \u2014 Essential is a great panel. We can run Elite next time. "
     "A lot of people start Essential and upgrade on follow-up.\u201d"),
    ("THEY MENTION APO B / LP(A) / LONGEVITY",
     "\u201cYou\u2019ll want Elite \u2014 Apo B, Apo A, Lp(a), CRP, homocysteine, IGF-1, full mineral panel. "
     "Same workup longevity specialists order.\u201d"),
]

sc_rows = []
for label, text in scripts:
    sc_rows.append([Paragraph(label, sc_label_s), Paragraph(text, sc_s)])

sc_tbl = Table(sc_rows, colWidths=[1.5*inch, W - 1.5*inch])
sc_tbl.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,-1), YELLOW_BG),
    ('BOX', (0,0), (-1,-1), 0.5, YELLOW_BORDER),
    ('LINEBELOW', (0,0), (-1,-2), 0.5, HexColor('#F0E6A0')),
    ('TOPPADDING', (0,0), (-1,-1), 3), ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ('LEFTPADDING', (0,0), (-1,-1), 6), ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ('VALIGN', (0,0), (-1,-1), 'TOP'),
]))
story.append(sc_tbl)
story.append(Spacer(1, 4))

# ── THREE KEY MARKERS ─────────────────────────────────────────────────────────

story += section_label("Know These Three Markers (Elite Only)")

bio_data = [[
    [
        Paragraph("Apo B", bio_t_s),
        Paragraph("Counts particles carrying cholesterol into artery walls. Better than LDL alone.", bio_b_s),
        Paragraph("\u201cHow many trucks delivering cholesterol to your arteries?\u201d", bio_p_s),
    ],
    [
        Paragraph("Lipoprotein(a) \u2014 Lp(a)", bio_t_s),
        Paragraph("Genetic. Can\u2019t change with diet. Strongest independent risk factor for heart attack.", bio_b_s),
        Paragraph("\u201cA genetic risk factor only found with a blood test.\u201d", bio_p_s),
    ],
    [
        Paragraph("Apo A-1", bio_t_s),
        Paragraph("Measures HDL function \u2014 ability to remove cholesterol. The cleanup crew.", bio_b_s),
        Paragraph("\u201cHow good your body is at cleaning up cholesterol.\u201d", bio_p_s),
    ],
]]

bio_tbl = Table(bio_data, colWidths=[W/3, W/3, W/3])
bio_tbl.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,-1), LIGHT_GREEN),
    ('BOX', (0,0), (0,0), 0.5, GREEN_BORDER),
    ('BOX', (1,0), (1,0), 0.5, GREEN_BORDER),
    ('BOX', (2,0), (2,0), 0.5, GREEN_BORDER),
    ('TOPPADDING', (0,0), (-1,-1), 4), ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ('LEFTPADDING', (0,0), (-1,-1), 5), ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ('VALIGN', (0,0), (-1,-1), 'TOP'),
]))
story.append(bio_tbl)
story.append(Spacer(1, 4))

# ── RULES ─────────────────────────────────────────────────────────────────────

rules = [
    "<b><font color='#FFFFFF'>Both panels qualify for every treatment.</font></b> Never say they \u201cneed\u201d Elite.",
    "<b><font color='#FFFFFF'>Default is Essential</font></b> unless they ask for more or mention longevity/heart history.",
    "<b><font color='#FFFFFF'>Never pressure toward Elite.</font></b> Upgrade path always available next time.",
    "<b><font color='#FFFFFF'>Family heart history = recommend Elite.</font></b> The one case to proactively suggest it.",
    "<b><font color='#FFFFFF'>Both include</font></b> labs drawn at clinic + one-on-one provider review.",
    "<b><font color='#FFFFFF'>Fasting required</font></b> for both \u2014 8\u201312 hours. Water fine. Remind when booking.",
]

r_rows = []
for i, rt in enumerate(rules, 1):
    r_rows.append([Paragraph(f"{i}.", rule_n_s), Paragraph(rt, rule_w_s)])

r_tbl = Table(r_rows, colWidths=[0.22*inch, W - 0.22*inch])
r_tbl.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,-1), DARK_GRAY),
    ('TOPPADDING', (0,0), (-1,-1), 2), ('BOTTOMPADDING', (0,0), (-1,-1), 2),
    ('LEFTPADDING', (0,0), (0,-1), 6), ('LEFTPADDING', (1,0), (1,-1), 2),
    ('RIGHTPADDING', (1,0), (1,-1), 6),
    ('VALIGN', (0,0), (-1,-1), 'TOP'),
]))
story.append(r_tbl)
story.append(Spacer(1, 4))

story.append(HRFlowable(width="100%", thickness=0.5, color=RULE_GRAY, spaceAfter=3))
story.append(Paragraph("Range Medical \u2014 Internal Use Only \u2014 March 2026", note_s))

doc.build(story)
print(f"PDF generated: {os.path.abspath(OUTPUT_PATH)}")
