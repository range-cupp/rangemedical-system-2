#!/usr/bin/env python3
"""Generate self-injection instructions PDF for Range Medical weight loss patients."""

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table,
                                 TableStyle, HRFlowable, PageBreak)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT

BLACK      = HexColor('#0A0A0A')
DARK_GRAY  = HexColor('#1A1A1A')
MID_GRAY   = HexColor('#606060')
LIGHT_GRAY = HexColor('#F4F4F4')
RULE_GRAY  = HexColor('#DDDDDD')
WHITE      = HexColor('#FFFFFF')
GREEN      = HexColor('#2E6B35')
RED        = HexColor('#C0392B')
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
warn_s      = st('Warn',   fontName='Helvetica-Bold',    fontSize=9.5, textColor=RED,       leading=16, spaceAfter=2)
step_num_s  = st('StepN',  fontName='Helvetica-Bold',    fontSize=11,  textColor=GREEN,     leading=14)
step_title_s= st('StepT',  fontName='Helvetica-Bold',    fontSize=9.5, textColor=BLACK,     leading=16, spaceAfter=2)

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

def numbered_step(num, title, details):
    """Create a numbered step with title and detail bullets."""
    elements = []
    # Step header row
    step_data = [[
        Paragraph(str(num), step_num_s),
        Paragraph(f"<b>{title}</b>", body_s),
    ]]
    step_tbl = Table(step_data, colWidths=[0.35*inch, W - 0.35*inch])
    step_tbl.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]))
    elements.append(step_tbl)
    for d in details:
        elements.append(Paragraph(f"\u2013  {d}", ParagraphStyle(
            'StepBul', fontName='Helvetica', fontSize=9.5, textColor=DARK_GRAY,
            leading=16, leftIndent=0.35*inch + 14, firstLineIndent=-10, spaceAfter=2,
        )))
    elements.append(Spacer(1, 4))
    return elements

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


# ── BUILD THE DOCUMENT ──────────────────────────────────────────────────────

import os
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "public", "docs")
os.makedirs(OUTPUT_DIR, exist_ok=True)
OUTPUT_PATH = os.path.join(OUTPUT_DIR, "self-injection-instructions.pdf")

doc = SimpleDocTemplate(
    OUTPUT_PATH,
    pagesize=letter,
    rightMargin=0.75*inch, leftMargin=0.75*inch,
    topMargin=0.65*inch,   bottomMargin=0.65*inch,
)
story = []
build_header(story)

# Title
story.append(Paragraph("SUBCUTANEOUS SELF-INJECTION GUIDE", title_s))
story.append(Paragraph("Weight Loss Medication \u2014 Abdominal Injection Instructions", subtitle_s))
story.append(Spacer(1, 14))

# ── WHAT YOU'LL NEED ─────────────────────────────────────────────────────────
story += section_label("What You Will Need")
story.append(bullet("Your pre-filled syringe (provided by Range Medical)"))
story.append(bullet("Alcohol swabs"))
story.append(bullet("Sharps container for used syringes"))
story.append(Spacer(1, 6))

# ── BEFORE YOU BEGIN ─────────────────────────────────────────────────────────
story += section_label("Before You Begin")
story.append(bullet("Wash your hands thoroughly with soap and warm water for at least 20 seconds"))
story.append(bullet("Remove your pre-filled syringe from the refrigerator 15\u201320 minutes before injecting to allow it to reach room temperature"))
story.append(bullet("Check the expiration date on the syringe label \u2014 do not use expired medication"))
story.append(bullet("Inspect the medication for particles, cloudiness, or discoloration \u2014 if present, do not use"))
story.append(bullet("Verify the medication name on the label matches your prescription"))
story.append(Spacer(1, 4))

# ── STEP-BY-STEP INSTRUCTIONS ───────────────────────────────────────────────
story += section_label("Step-by-Step Instructions")

for el in numbered_step(1, "Prepare Your Syringe", [
    "Remove the pre-filled syringe from its packaging.",
    "Remove the needle cap by pulling it straight off \u2014 do not twist.",
    "Do not touch the needle or let it contact any surface.",
]):
    story.append(el)

for el in numbered_step(2, "Choose Your Injection Site", [
    "The injection goes into the fatty tissue of your abdomen (stomach area).",
    "Stay at least 2 inches away from your belly button.",
    "Rotate your injection site each time \u2014 do not inject in the same spot twice in a row.",
    "Avoid areas with bruises, scars, stretch marks, or irritation.",
]):
    story.append(el)

for el in numbered_step(3, "Clean the Injection Site", [
    "Wipe the chosen area with a fresh alcohol swab using a circular motion.",
    "Allow the skin to air dry completely before injecting.",
]):
    story.append(el)

for el in numbered_step(4, "Inject the Medication", [
    "Pinch a 1\u20132 inch fold of skin between your thumb and index finger.",
    "Hold the syringe like a dart at a 90-degree angle (straight in) to the skin fold.",
    "Insert the needle quickly and smoothly into the pinched skin.",
    "Release the pinched skin.",
    "Push the plunger down slowly and steadily to inject the full dose.",
    "Wait 5\u201310 seconds with the needle in place before withdrawing.",
    "Pull the needle straight out.",
]):
    story.append(el)

for el in numbered_step(5, "After the Injection", [
    "Apply light pressure with a clean cotton ball or gauze if needed \u2014 do not rub the site.",
    "Dispose of the entire used syringe immediately in your sharps container.",
    "Never recap, bend, or reuse syringes.",
    "Record the date and injection site location for your records.",
]):
    story.append(el)

# ── INJECTION SITE ROTATION ─────────────────────────────────────────────────
story += section_label("Injection Site Rotation")
story.append(Paragraph(
    "Rotating your injection site prevents skin irritation and ensures consistent medication absorption. "
    "Think of your abdomen as four quadrants around your belly button:",
    body_s,
))
story.append(Spacer(1, 6))

quad_data = [
    [Paragraph("Week", th_s), Paragraph("Injection Area", th_s)],
    [Paragraph("Week 1", tv_bold_s), Paragraph("Upper left abdomen", tv_s)],
    [Paragraph("Week 2", tv_bold_s), Paragraph("Upper right abdomen", tv_s)],
    [Paragraph("Week 3", tv_bold_s), Paragraph("Lower left abdomen", tv_s)],
    [Paragraph("Week 4", tv_bold_s), Paragraph("Lower right abdomen", tv_s)],
]
quad_tbl = Table(quad_data, colWidths=[1.5*inch, 5.5*inch])
quad_tbl.setStyle(TableStyle([
    ('TOPPADDING',    (0,0),(-1,-1), 5),
    ('BOTTOMPADDING', (0,0),(-1,-1), 5),
    ('LEFTPADDING',   (0,0),(-1,-1), 10),
    ('RIGHTPADDING',  (0,0),(-1,-1), 10),
    ('VALIGN',        (0,0),(-1,-1), 'TOP'),
    ('BACKGROUND',    (0,0),(-1,0),  LIGHT_GRAY),
    ('ROWBACKGROUNDS',(0,1),(-1,-1), [WHITE, LIGHT_GRAY]),
    ('BOX',           (0,0),(-1,-1), 0.5, RULE_GRAY),
    ('LINEBELOW',     (0,0),(-1,-1), 0.5, RULE_GRAY),
]))
story.append(quad_tbl)
story.append(Spacer(1, 4))
story.append(Paragraph("Then repeat the cycle. Always stay at least 2 inches from your belly button.", note_s))

# ── STORAGE ──────────────────────────────────────────────────────────────────
story += section_label("Medication Storage")
story.append(bullet("Store pre-filled syringes in the refrigerator between 36\u201346\u00b0F (2\u20138\u00b0C) unless otherwise directed"))
story.append(bullet("Do not freeze \u2014 discard medication if it has been frozen"))
story.append(bullet("Keep syringes in their original packaging to protect from light"))
story.append(bullet("Never store medication in your car, bathroom, or in direct sunlight"))
story.append(Spacer(1, 4))

# ── COMMON SIDE EFFECTS ─────────────────────────────────────────────────────
story += section_label("Common Side Effects")
story.append(Paragraph("The following are normal and typically resolve within a few days:", body_s))
story.append(Spacer(1, 4))
story.append(bullet("Mild redness, swelling, or itching at the injection site"))
story.append(bullet("Small bruise at the injection site"))
story.append(bullet("Nausea (especially in the first few weeks \u2014 tends to improve over time)"))
story.append(bullet("Decreased appetite (this is expected and part of how the medication works)"))
story.append(bullet("Mild fatigue or headache"))
story.append(Spacer(1, 6))

# ── WHEN TO CALL US ──────────────────────────────────────────────────────────
story += section_label("When to Contact Range Medical")
story.append(Paragraph("Call or text us at <b>(949) 997-3988</b> if you experience:", warn_s))
story.append(Spacer(1, 4))
story.append(bullet("Severe or persistent nausea, vomiting, or abdominal pain"))
story.append(bullet("Signs of allergic reaction \u2014 rash, hives, difficulty breathing, swelling of face or throat"))
story.append(bullet("Infection at the injection site \u2014 increasing redness, warmth, swelling, or pus"))
story.append(bullet("Dizziness, fainting, or rapid heartbeat"))
story.append(bullet("Any symptom that concerns you or feels unusual"))
story.append(Spacer(1, 6))

# ── TIPS FOR SUCCESS ─────────────────────────────────────────────────────────
story += section_label("Tips for Success")
story.append(bullet("Inject on the same day each week to maintain a consistent schedule"))
story.append(bullet("Set a weekly reminder on your phone so you don't forget"))
story.append(bullet("Stay hydrated \u2014 drink plenty of water, especially in the first few days after injection"))
story.append(bullet("Eat smaller, balanced meals to help manage nausea"))
story.append(bullet("If you miss a dose, contact Range Medical for guidance \u2014 do not double up"))
story.append(Spacer(1, 10))

# ── SHARPS DISPOSAL ──────────────────────────────────────────────────────────
story += section_label("Sharps Disposal")
story.append(bullet("Always place used needles and syringes in an FDA-cleared sharps container"))
story.append(bullet("If you don't have a sharps container, use a heavy-duty plastic container with a screw-on lid (e.g., laundry detergent bottle)"))
story.append(bullet("When the container is \u00be full, seal it and label it \u201cSharps \u2014 Do Not Recycle\u201d"))
story.append(bullet("Drop off at your local pharmacy or household hazardous waste facility"))
story.append(bullet("Never throw loose needles in the trash or recycling"))
story.append(Spacer(1, 12))

# Footer
build_footer(story)
doc.build(story)
print(f"PDF generated: {OUTPUT_PATH}")
