#!/usr/bin/env python3
"""Generate iPad Patient Check-In Process PDF for Range Medical."""

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table,
                                 TableStyle, HRFlowable)
from reportlab.lib.enums import TA_LEFT, TA_RIGHT

BLACK      = HexColor('#0A0A0A')
DARK_GRAY  = HexColor('#1A1A1A')
MID_GRAY   = HexColor('#606060')
LIGHT_GRAY = HexColor('#F4F4F4')
RULE_GRAY  = HexColor('#DDDDDD')
WHITE      = HexColor('#FFFFFF')
GREEN      = HexColor('#2E6B35')
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
step_s      = st('Step',   fontName='Helvetica-Bold',    fontSize=10,  textColor=BLACK,     leading=14, spaceBefore=10, spaceAfter=3)

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
            "This document is intended for Range Medical staff only. "
            "For technical support with the check-in system, contact your system administrator.",
            foot_s),
    ]], colWidths=[2.2*inch, 4.8*inch])
    tbl.setStyle(TableStyle([
        ('VALIGN',(0,0),(-1,-1),'TOP'),
        ('TOPPADDING',(0,0),(-1,-1),0),('BOTTOMPADDING',(0,0),(-1,-1),0),
        ('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),0),
    ]))
    story.append(tbl)

# ── BUILD THE PDF ────────────────────────────────────────────────────────────

import os
OUTPUT_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                           "public", "docs", "ipad-check-in-process.pdf")

doc = SimpleDocTemplate(
    OUTPUT_PATH,
    pagesize=letter,
    rightMargin=0.75*inch, leftMargin=0.75*inch,
    topMargin=0.65*inch,   bottomMargin=0.65*inch,
)
story = []
build_header(story)

# Title
story.append(Paragraph("IPAD PATIENT CHECK-IN PROCESS", title_s))
story.append(Paragraph("Front Desk Quick Reference Guide", subtitle_s))
story.append(Spacer(1, 14))

# ── ONE-TIME SETUP ───────────────────────────────────────────────────────────
story += section_label("One-Time Setup")
bullet_text = [
    'Open <b>app.range-medical.com/check-in</b> in Safari on the iPad',
    'Tap the <b>Share</b> button (square with arrow) \u2192 <b>Add to Home Screen</b>',
    'This gives you a one-tap icon to launch the check-in screen',
]
for t in bullet_text:
    story.append(bullet(t))

story.append(Spacer(1, 6))

# ── CHECK-IN PROCESS ────────────────────────────────────────────────────────
story += section_label("Check-In Process")
story.append(Paragraph("Follow these steps each time a patient walks in.", body_s))
story.append(Spacer(1, 6))

# Step 1
story.append(Paragraph("Step 1 \u2014 Open the Check-In Page", step_s))
story.append(bullet("Tap the bookmark icon on the iPad home screen, or navigate to <b>app.range-medical.com/check-in</b>"))
story.append(Spacer(1, 2))

# Step 2
story.append(Paragraph("Step 2 \u2014 Find the Patient", step_s))
story.append(bullet("<b>Existing Patient:</b> Type their name, email, or phone in the search box, then tap their name when it appears"))
story.append(bullet("<b>New Patient:</b> Tap \u201cNew Patient\u201d and enter first name + last name (email and phone are optional)"))
story.append(Spacer(1, 2))

# Step 3
story.append(Paragraph("Step 3 \u2014 Select Forms", step_s))
story.append(bullet('Tap <b>\u201cNext: Select Forms\u201d</b>'))
story.append(bullet("Choose a <b>quick preset</b> (e.g., New Patient, HRT Patient, Weight Loss) OR select individual forms manually"))
story.append(Spacer(1, 2))

# Step 4
story.append(Paragraph("Step 4 \u2014 Hand iPad to Patient", step_s))
story.append(bullet('Tap the green <b>\u201cHand iPad to Patient\u201d</b> button'))
story.append(bullet("Hand the iPad to the patient"))
story.append(bullet("Patient fills out each form (intake, HIPAA, consents)"))
story.append(bullet("Patient info carries forward \u2014 they only enter their details once"))
story.append(Spacer(1, 2))

# Step 5
story.append(Paragraph("Step 5 \u2014 Patient Completes Forms", step_s))
story.append(bullet('When all forms are done, the screen shows <b>\u201cPlease return this iPad to the front desk\u201d</b>'))
story.append(bullet("Patient hands iPad back to staff"))
story.append(Spacer(1, 2))

# Step 6
story.append(Paragraph("Step 6 \u2014 Reset for Next Patient", step_s))
story.append(bullet('Staff taps <b>\u201cStart New Check-In\u201d</b> to reset for the next patient'))
story.append(Spacer(1, 8))

# ── QUICK PRESET REFERENCE ──────────────────────────────────────────────────
story += section_label("Quick Preset Reference")

preset_data = [
    ["Preset", "Forms Included"],
    ["New Patient", "Medical Intake + HIPAA"],
    ["HRT Patient", "Medical Intake + HIPAA + HRT Consent + Blood Draw"],
    ["Weight Loss", "Medical Intake + HIPAA + Weight Loss Consent + Blood Draw"],
    ["IV Therapy", "Medical Intake + HIPAA + IV & Injection Consent"],
    ["Peptides", "Medical Intake + HIPAA + Peptide Consent"],
    ["HBOT", "Medical Intake + HIPAA + HBOT Consent"],
    ["Red Light", "Medical Intake + HIPAA + Red Light Consent"],
    ["PRP", "Medical Intake + HIPAA + PRP Consent + Blood Draw"],
    ["Exosome IV", "Medical Intake + HIPAA + Exosome IV Consent"],
    ["Labs + Questionnaire", "Medical Intake + HIPAA + Blood Draw + Baseline Questionnaire"],
]

header_row = [Paragraph(c, th_s) for c in preset_data[0]]
data_rows = [[Paragraph(r[0], tv_bold_s), Paragraph(r[1], tv_s)] for r in preset_data[1:]]
all_rows = [header_row] + data_rows

preset_tbl = Table(all_rows, colWidths=[1.6*inch, 5.4*inch])
preset_tbl.setStyle(TableStyle([
    ('TOPPADDING',    (0,0),(-1,-1), 5),
    ('BOTTOMPADDING', (0,0),(-1,-1), 5),
    ('LEFTPADDING',   (0,0),(-1,-1), 10),
    ('RIGHTPADDING',  (0,0),(-1,-1), 10),
    ('VALIGN',        (0,0),(-1,-1), 'TOP'),
    ('BACKGROUND',    (0,0),(-1,0), LIGHT_GRAY),
    ('ROWBACKGROUNDS',(0,1),(-1,-1), [WHITE, LIGHT_GRAY]),
    ('BOX',           (0,0),(-1,-1), 0.5, RULE_GRAY),
    ('LINEBELOW',     (0,0),(-1,-1), 0.5, RULE_GRAY),
]))
story.append(preset_tbl)
story.append(Spacer(1, 8))

# ── WHERE DOES THE DATA GO? ─────────────────────────────────────────────────
story += section_label("Where Does the Data Go?")
story.append(bullet("All intake data saves to the patient\u2019s profile in the CRM"))
story.append(bullet("Consent forms are stored and linked to the patient record"))
story.append(bullet("Works exactly the same as sending forms via SMS or email \u2014 same database, same workflow"))

story.append(Spacer(1, 16))
build_footer(story)
doc.build(story)

print(f"\u2713 PDF generated: {OUTPUT_PATH}")
