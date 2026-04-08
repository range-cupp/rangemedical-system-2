#!/usr/bin/env python3
"""Generate patient-facing PDF guide for 2X Blend: Tesamorelin / Ipamorelin."""

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
    elements = []
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
OUTPUT_PATH = os.path.join(OUTPUT_DIR, "tesa-ipa-patient-guide.pdf")

doc = SimpleDocTemplate(
    OUTPUT_PATH,
    pagesize=letter,
    rightMargin=0.75*inch, leftMargin=0.75*inch,
    topMargin=0.65*inch,   bottomMargin=0.65*inch,
)
story = []
build_header(story)

# Title
story.append(Paragraph("2X BLEND: TESAMORELIN / IPAMORELIN", title_s))
story.append(Paragraph("Growth Hormone Peptide Therapy \u2014 Patient Guide", subtitle_s))
story.append(Spacer(1, 14))

# ── WHAT IS THIS MEDICATION ─────────────────────────────────────────────────
story += section_label("What Is This Medication")
story.append(Paragraph(
    "Your 2X Blend combines two growth hormone\u2013releasing peptides that work together to "
    "naturally stimulate your body\u2019s own growth hormone production:",
    body_s,
))
story.append(Spacer(1, 6))
story.append(Paragraph("<b>Tesamorelin</b> \u2014 A growth hormone\u2013releasing hormone (GHRH) analog that signals "
    "your pituitary gland to produce and release growth hormone. It is especially effective at "
    "reducing visceral (abdominal) fat.", body_s))
story.append(Spacer(1, 4))
story.append(Paragraph("<b>Ipamorelin</b> \u2014 A selective growth hormone\u2013releasing peptide (GHRP) that amplifies "
    "the signal from Tesamorelin. It promotes a strong, clean growth hormone pulse without "
    "significantly raising cortisol or prolactin.", body_s))
story.append(Spacer(1, 6))
story.append(Paragraph(
    "Together, these peptides create a synergistic effect \u2014 producing a more robust growth hormone "
    "release than either peptide alone.",
    body_s,
))
story.append(Spacer(1, 6))

# ── EXPECTED BENEFITS ────────────────────────────────────────────────────────
story += section_label("Expected Benefits")
story.append(bullet("Reduced visceral and abdominal fat"))
story.append(bullet("Improved body composition and lean muscle support"))
story.append(bullet("Better sleep quality and recovery"))
story.append(bullet("Increased energy and mental clarity"))
story.append(bullet("Enhanced skin elasticity and collagen production"))
story.append(bullet("Improved metabolism and cellular repair"))
story.append(Spacer(1, 4))
story.append(Paragraph(
    "Most patients begin noticing changes in sleep and energy within the first 2\u20134 weeks. "
    "Body composition improvements typically become more noticeable after 8\u201312 weeks of consistent use.",
    note_s,
))

# ── YOUR PROTOCOL ────────────────────────────────────────────────────────────
story += section_label("Your Protocol")
story.append(info_table([
    ("Medication",   "2X Blend: Tesamorelin / Ipamorelin"),
    ("Schedule",     "5 days on, 2 days off (e.g., Mon\u2013Fri inject, Sat\u2013Sun rest)"),
    ("Injection Type", "Subcutaneous (into belly fat)"),
    ("Timing",       "Evening before bed on an empty stomach (ideal for GH release)"),
    ("Supply",       "30-day vial \u2014 approximately 20 injections per cycle"),
], col1=1.6*inch))
story.append(Spacer(1, 6))

# ── DOSING PHASES ────────────────────────────────────────────────────────────
story += section_label("Dosing Phases")
story.append(Paragraph(
    "Your provider will start you at a lower dose and titrate up based on your response and tolerance. "
    "Do not adjust your dose without consulting your provider.",
    body_s,
))
story.append(Spacer(1, 6))

phase_data = [
    [Paragraph("Phase", th_s), Paragraph("Dose Per Injection", th_s), Paragraph("Notes", th_s)],
    [Paragraph("Phase 1", tv_bold_s), Paragraph("500mcg Tesa + 500mcg Ipa (1mg total)", tv_s),
     Paragraph("Starting dose \u2014 assess tolerance", tv_s)],
    [Paragraph("Phase 2", tv_bold_s), Paragraph("1mg Tesa + 1mg Ipa (2mg total)", tv_s),
     Paragraph("Standard maintenance dose", tv_s)],
    [Paragraph("Phase 3", tv_bold_s), Paragraph("1.5mg Tesa + 1.5mg Ipa (3mg total)", tv_s),
     Paragraph("Optimized dose (provider-directed)", tv_s)],
]
phase_tbl = Table(phase_data, colWidths=[1.0*inch, 2.8*inch, 3.2*inch])
phase_tbl.setStyle(TableStyle([
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
story.append(phase_tbl)
story.append(Spacer(1, 6))

# ── WEEKLY SCHEDULE ──────────────────────────────────────────────────────────
story += section_label("Sample Weekly Schedule")

sched_data = [
    [Paragraph("Day", th_s), Paragraph("Mon", th_s), Paragraph("Tue", th_s),
     Paragraph("Wed", th_s), Paragraph("Thu", th_s), Paragraph("Fri", th_s),
     Paragraph("Sat", th_s), Paragraph("Sun", th_s)],
    [Paragraph("Status", tv_bold_s),
     Paragraph("\u2713 Inject", check_s), Paragraph("\u2713 Inject", check_s),
     Paragraph("\u2713 Inject", check_s), Paragraph("\u2713 Inject", check_s),
     Paragraph("\u2713 Inject", check_s),
     Paragraph("Rest", rest_s), Paragraph("Rest", rest_s)],
]
sched_tbl = Table(sched_data, colWidths=[0.7*inch] + [0.9*inch]*7)
sched_tbl.setStyle(TableStyle([
    ('TOPPADDING',    (0,0),(-1,-1), 5),
    ('BOTTOMPADDING', (0,0),(-1,-1), 5),
    ('LEFTPADDING',   (0,0),(-1,-1), 6),
    ('RIGHTPADDING',  (0,0),(-1,-1), 6),
    ('VALIGN',        (0,0),(-1,-1), 'MIDDLE'),
    ('ALIGN',         (1,0),(-1,-1), 'CENTER'),
    ('BACKGROUND',    (0,0),(-1,0),  LIGHT_GRAY),
    ('ROWBACKGROUNDS',(0,1),(-1,-1), [WHITE]),
    ('BOX',           (0,0),(-1,-1), 0.5, RULE_GRAY),
    ('LINEBELOW',     (0,0),(-1,-1), 0.5, RULE_GRAY),
    ('LINEBEFORE',    (1,0),(-1,-1), 0.5, RULE_GRAY),
]))
story.append(sched_tbl)
story.append(Spacer(1, 4))
story.append(Paragraph(
    "You may choose any 2 consecutive rest days that work for your schedule. "
    "The key is consistency \u2014 keep the same pattern each week.",
    note_s,
))

# ── PAGE BREAK ───────────────────────────────────────────────────────────────
story.append(PageBreak())
build_header(story)

# ── RECONSTITUTION ───────────────────────────────────────────────────────────
story += section_label("How to Prepare Your Vial (Reconstitution)")
story.append(Paragraph(
    "Your medication arrives as a freeze-dried powder in a vial. You will reconstitute (mix) it "
    "with bacteriostatic water before injecting.",
    body_s,
))
story.append(Spacer(1, 6))

for el in numbered_step(1, "Gather Your Supplies", [
    "Medication vial (freeze-dried powder)",
    "Bacteriostatic (BAC) water vial",
    "Insulin syringe (provided by Range Medical)",
    "Alcohol swabs",
]):
    story.append(el)

for el in numbered_step(2, "Reconstitute the Vial", [
    "Wipe the tops of both vials with an alcohol swab.",
    "Draw <b>2mL</b> of bacteriostatic water into the syringe.",
    "Insert the needle into the medication vial at an angle, aiming at the glass wall.",
    "Slowly release the water down the side of the vial \u2014 <b>do not squirt directly onto the powder.</b>",
    "Gently swirl the vial until the powder is fully dissolved \u2014 <b>do not shake.</b>",
    "The solution should be clear. If cloudy or discolored, do not use.",
]):
    story.append(el)

for el in numbered_step(3, "Draw Your Dose", [
    "Wipe the vial top with a fresh alcohol swab.",
    "Draw the prescribed dose into a fresh insulin syringe.",
    "Remove any air bubbles by gently tapping the syringe and pushing them out.",
    "Your provider will tell you the exact number of units (tick marks) to draw.",
]):
    story.append(el)

story.append(Spacer(1, 4))

# ── INJECTION INSTRUCTIONS ──────────────────────────────────────────────────
story += section_label("How to Inject")

for el in numbered_step(1, "Choose Your Injection Site", [
    "Inject into the fatty tissue of your abdomen (stomach area).",
    "Stay at least 2 inches away from your belly button.",
    "Rotate your injection site each time \u2014 do not inject in the same spot twice in a row.",
]):
    story.append(el)

for el in numbered_step(2, "Clean and Inject", [
    "Wipe the area with an alcohol swab and let it air dry.",
    "Pinch a 1\u20132 inch fold of skin between your thumb and index finger.",
    "Insert the needle at a 90-degree angle (straight in) quickly and smoothly.",
    "Release the pinch and push the plunger down slowly and steadily.",
    "Wait 5\u201310 seconds, then pull the needle straight out.",
]):
    story.append(el)

for el in numbered_step(3, "After the Injection", [
    "Apply light pressure if needed \u2014 do not rub the site.",
    "Dispose of the syringe immediately in your sharps container.",
    "Never recap, bend, or reuse syringes.",
]):
    story.append(el)

# ── INJECTION SITE ROTATION ─────────────────────────────────────────────────
story += section_label("Injection Site Rotation")
story.append(Paragraph(
    "Rotate between four quadrants of your abdomen to prevent irritation:",
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
story.append(bullet("Store the reconstituted vial in the refrigerator between 36\u201346\u00b0F (2\u20138\u00b0C)"))
story.append(bullet("Do not freeze \u2014 discard if the medication has been frozen"))
story.append(bullet("Use the reconstituted vial within 30 days"))
story.append(bullet("Keep away from direct sunlight and heat"))
story.append(bullet("Store bacteriostatic water at room temperature"))
story.append(Spacer(1, 4))

# ── COMMON SIDE EFFECTS ─────────────────────────────────────────────────────
story += section_label("Common Side Effects")
story.append(Paragraph("The following are normal and typically resolve within the first 1\u20132 weeks:", body_s))
story.append(Spacer(1, 4))
story.append(bullet("Mild redness or itching at the injection site"))
story.append(bullet("Temporary water retention or bloating"))
story.append(bullet("Tingling or numbness in hands/fingers (usually transient)"))
story.append(bullet("Mild headache"))
story.append(bullet("Increased hunger (especially in the first week)"))
story.append(bullet("Mild joint stiffness"))
story.append(Spacer(1, 6))

# ── WHEN TO CALL US ──────────────────────────────────────────────────────────
story += section_label("When to Contact Range Medical")
story.append(Paragraph("Call or text us at <b>(949) 997-3988</b> if you experience:", warn_s))
story.append(Spacer(1, 4))
story.append(bullet("Severe or persistent swelling, especially in hands or feet"))
story.append(bullet("Signs of allergic reaction \u2014 rash, hives, difficulty breathing, swelling of face or throat"))
story.append(bullet("Significant joint pain or carpal tunnel symptoms"))
story.append(bullet("Changes in vision"))
story.append(bullet("Infection at the injection site \u2014 increasing redness, warmth, swelling, or pus"))
story.append(bullet("Any symptom that concerns you or feels unusual"))
story.append(Spacer(1, 6))

# ── TIPS FOR SUCCESS ─────────────────────────────────────────────────────────
story += section_label("Tips for Best Results")
story.append(bullet("Inject in the evening before bed on an empty stomach (2\u20133 hours after eating) \u2014 this aligns with your body\u2019s natural GH release cycle"))
story.append(bullet("Keep a consistent 5-on / 2-off schedule every week"))
story.append(bullet("Stay hydrated \u2014 drink plenty of water throughout the day"))
story.append(bullet("Prioritize sleep \u2014 growth hormone is released primarily during deep sleep"))
story.append(bullet("Regular exercise (especially resistance training) amplifies the benefits"))
story.append(bullet("If you miss a dose, skip it and continue with your next scheduled injection \u2014 do not double up"))
story.append(Spacer(1, 6))

# ── SHARPS DISPOSAL ──────────────────────────────────────────────────────────
story += section_label("Sharps Disposal")
story.append(bullet("Always place used needles and syringes in an FDA-cleared sharps container"))
story.append(bullet("If you don\u2019t have a sharps container, use a heavy-duty plastic container with a screw-on lid (e.g., laundry detergent bottle)"))
story.append(bullet("When the container is \u00be full, seal it and label it \u201cSharps \u2014 Do Not Recycle\u201d"))
story.append(bullet("Drop off at your local pharmacy or household hazardous waste facility"))
story.append(bullet("Never throw loose needles in the trash or recycling"))
story.append(Spacer(1, 12))

# Footer
build_footer(story)
doc.build(story)
print(f"PDF generated: {OUTPUT_PATH}")
