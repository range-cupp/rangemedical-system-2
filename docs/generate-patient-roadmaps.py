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
ACCENT     = HexColor('#333333')
PHASE_BG   = HexColor('#F8F8F8')
W = 7.0 * inch

def st(name, **kw):
    return ParagraphStyle(name, **kw)

clinic_s    = st('Clinic', fontName='Helvetica-Bold',    fontSize=13,  textColor=BLACK,     leading=16)
contact_s   = st('Cont',   fontName='Helvetica',         fontSize=8,   textColor=MID_GRAY,  leading=12, alignment=TA_RIGHT)
title_s     = st('Title',  fontName='Helvetica-Bold',    fontSize=16,  textColor=BLACK,     leading=20, spaceAfter=2)
subtitle_s  = st('Sub',    fontName='Helvetica-Oblique', fontSize=9,   textColor=MID_GRAY,  leading=12)
sec_s       = st('Sec',    fontName='Helvetica-Bold',    fontSize=8,   textColor=MID_GRAY,  leading=11, spaceBefore=6, spaceAfter=2)
body_s      = st('Body',   fontName='Helvetica',         fontSize=9,   textColor=DARK_GRAY, leading=14, spaceAfter=0)
body_sm     = st('BodySm', fontName='Helvetica',         fontSize=8.5, textColor=DARK_GRAY, leading=12, spaceAfter=0)
bullet_s    = st('Bul',    fontName='Helvetica',         fontSize=8.5, textColor=DARK_GRAY, leading=12, leftIndent=12, firstLineIndent=-9, spaceAfter=0)
phase_title = st('PhT',    fontName='Helvetica-Bold',    fontSize=10,  textColor=BLACK,     leading=13)
phase_len   = st('PhL',    fontName='Helvetica',         fontSize=8.5, textColor=MID_GRAY,  leading=12)
phase_goal  = st('PhG',    fontName='Helvetica-Oblique', fontSize=8.5, textColor=MID_GRAY,  leading=12)
label_s     = st('Lbl',    fontName='Helvetica-Bold',    fontSize=8.5, textColor=BLACK,     leading=12)
value_s     = st('Val',    fontName='Helvetica',         fontSize=9,   textColor=DARK_GRAY, leading=12)
blank_s     = st('Blnk',   fontName='Helvetica',         fontSize=9,   textColor=MID_GRAY,  leading=14)
foot_s      = st('Foot',   fontName='Helvetica-Oblique', fontSize=7.5, textColor=MID_GRAY,  leading=10)
foot_bold_s = st('FootB',  fontName='Helvetica-Bold',    fontSize=8,   textColor=DARK_GRAY, leading=11)
note_s      = st('Note',   fontName='Helvetica-Oblique', fontSize=8,   textColor=MID_GRAY,  leading=11, spaceAfter=2)
check_s     = st('Chk',    fontName='Helvetica',         fontSize=9,   textColor=DARK_GRAY, leading=13)
num_s       = st('Num',    fontName='Helvetica-Bold',    fontSize=14,  textColor=WHITE,     leading=16, alignment=TA_CENTER)
callout_s   = st('Call',   fontName='Helvetica-Oblique', fontSize=8.5, textColor=HexColor('#444444'), leading=12)

def section_label(text):
    return [
        Paragraph(text.upper(), sec_s),
        HRFlowable(width="100%", thickness=0.75, color=RULE_GRAY, spaceAfter=6),
    ]

def bullet(text):
    return Paragraph(f"–  {text}", bullet_s)

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
    story.append(HRFlowable(width="100%", thickness=0.5, color=RULE_GRAY, spaceAfter=6))
    tbl = Table([[
        Paragraph("<b>Questions?</b>  Call or text: (949) 997-3988  •  range-medical.com", foot_bold_s),
        Paragraph(
            "This roadmap is personalized by your provider. Timelines may be adjusted "
            "based on your progress and clinical needs.",
            foot_s),
    ]], colWidths=[2.8*inch, 4.2*inch])
    tbl.setStyle(TableStyle([
        ('VALIGN',(0,0),(-1,-1),'TOP'),
        ('TOPPADDING',(0,0),(-1,-1),0),('BOTTOMPADDING',(0,0),(-1,-1),0),
        ('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),0),
    ]))
    story.append(tbl)

def phase_block(number, title, length, goal, bullets_list):
    num_box = Table([[Paragraph(str(number), num_s)]], colWidths=[0.3*inch], rowHeights=[0.3*inch])
    num_box.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,0), ACCENT),
        ('ALIGN', (0,0), (0,0), 'CENTER'),
        ('VALIGN', (0,0), (0,0), 'MIDDLE'),
        ('TOPPADDING', (0,0), (0,0), 1),
        ('BOTTOMPADDING', (0,0), (0,0), 1),
    ]))
    header_row = Table([
        [num_box, Paragraph(title, phase_title), Paragraph(length, phase_len)]
    ], colWidths=[0.4*inch, 3.0*inch, 3.6*inch])
    header_row.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
    ]))
    inner = [header_row]
    if goal:
        inner.append(Spacer(1, 3))
        inner.append(Paragraph(f"“{goal}”", phase_goal))
    inner.append(Spacer(1, 3))
    for b in bullets_list:
        inner.append(Paragraph(f"–  {b}", bullet_s))

    content_cell = []
    for item in inner:
        content_cell.append(item)

    wrapper_data = [[content_cell]]
    wrapper = Table([[Paragraph("", body_s)]], colWidths=[W])
    rows = [[item] for item in inner]
    data = []
    for item in inner:
        data.append([item])
    tbl = Table(data, colWidths=[W - 0.3*inch])
    tbl.setStyle(TableStyle([
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
        ('TOPPADDING', (0,0), (0,0), 4),
        ('TOPPADDING', (0,1), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-2), 0),
        ('BOTTOMPADDING', (0,-1), (-1,-1), 4),
        ('BACKGROUND', (0,0), (-1,-1), PHASE_BG),
        ('BOX', (0,0), (-1,-1), 0.5, RULE_GRAY),
    ]))
    return tbl

def blank_line(label, width=3.5*inch):
    line = "_" * int(width / 4.5)
    return Table([
        [Paragraph(label, label_s), Paragraph(line, blank_s)]
    ], colWidths=[1.6*inch, W - 1.6*inch])

def checkbox_row(options):
    cells = []
    for opt in options:
        cells.append(Paragraph(f"□  {opt}", check_s))
    per = W / len(options)
    tbl = Table([cells], colWidths=[per] * len(options))
    tbl.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    return tbl


# ═══════════════════════════════════════════════════════════════════════════════
# WEIGHT LOSS ROADMAP
# ═══════════════════════════════════════════════════════════════════════════════
OUTPUT_WL = "/Users/chriscupp/Code/rangemedical-system-2/docs/Range-WL-Patient-Roadmap.pdf"

doc_wl = SimpleDocTemplate(
    OUTPUT_WL, pagesize=letter,
    rightMargin=0.75*inch, leftMargin=0.75*inch,
    topMargin=0.55*inch, bottomMargin=0.5*inch,
)
story = []
build_header(story)

story.append(Paragraph("MEDICAL WEIGHT LOSS PROGRAM", title_s))
story.append(Paragraph("Your Roadmap", subtitle_s))
story.append(Spacer(1, 6))

story += section_label("Patient Information")
info_data = [
    [Paragraph("<b>Patient</b>", label_s), Paragraph("_" * 50, blank_s),
     Paragraph("<b>Date</b>", label_s), Paragraph("_" * 22, blank_s)],
    [Paragraph("<b>Provider</b>", label_s), Paragraph("_" * 50, blank_s),
     Paragraph("<b>Start Weight</b>", label_s), Paragraph("_" * 22, blank_s)],
]
info_tbl = Table(info_data, colWidths=[0.8*inch, 2.9*inch, 1.1*inch, 2.2*inch])
info_tbl.setStyle(TableStyle([
    ('VALIGN', (0,0), (-1,-1), 'BOTTOM'),
    ('LEFTPADDING', (0,0), (-1,-1), 0),
    ('RIGHTPADDING', (0,0), (-1,-1), 4),
    ('TOPPADDING', (0,0), (-1,-1), 3),
    ('BOTTOMPADDING', (0,0), (-1,-1), 3),
]))
story.append(info_tbl)
story.append(Spacer(1, 2))

story += section_label("Your Program Length")
story.append(checkbox_row([
    "24 weeks  (up to 20 lbs)",
    "32 weeks  (21–40 lbs)",
    "48 weeks  (41+ lbs)",
]))
story.append(Spacer(1, 3))

story.append(Paragraph(
    "Your program has three phases: <b>lose the weight</b>, <b>let your body adjust</b>, "
    "and <b>learn to eat and live at your new weight</b>.",
    body_s
))
story.append(Spacer(1, 5))

story += section_label("Your Three Phases")

story.append(phase_block(
    1, "Weight Loss", "First 8–24 weeks",
    None,
    [
        "Baseline labs and personalized treatment plan",
        "Weekly or biweekly check-ins (in-person or telehealth)",
        "Medication, nutrition, and activity adjusted as needed",
        "Follow-up labs around week 8, then every 12 weeks",
        "<b>What you're tracking:</b> weight, measurements, energy, cravings",
    ]
))
story.append(Spacer(1, 4))

story.append(phase_block(
    2, "Recalibration", "8–12 weeks",
    "Teach your metabolism this new weight is the new normal.",
    [
        "Hold your weight within a narrow band — no more losing, no regaining",
        "Gradually adjust calories and macros upward as appropriate",
        "Fine-tune or begin reducing medications when clinically safe",
        "Labs every ~12 weeks, tied to provider visits",
    ]
))
story.append(Spacer(1, 4))

story.append(phase_block(
    3, "Reverse &amp; Transition", "8–12 weeks",
    "Raise your food and activity to a long-term level without regaining.",
    [
        "Gradually increase intake and activity to sustainable levels",
        "Lock in routines for work, travel, and weekends",
        "Build your long-term follow-up plan with your provider",
        "Transition into <b>Range Continued Care Membership</b> to keep your results",
    ]
))

story.append(Spacer(1, 5))
story += section_label("Upcoming Dates")
dates_data = [
    [Paragraph("<b>Next Visit</b>", label_s), Paragraph("_" * 28, blank_s),
     Paragraph("<b>Next Labs</b>", label_s), Paragraph("_" * 28, blank_s)],
]
dates_tbl = Table(dates_data, colWidths=[0.9*inch, 2.6*inch, 0.9*inch, 2.6*inch])
dates_tbl.setStyle(TableStyle([
    ('VALIGN', (0,0), (-1,-1), 'BOTTOM'),
    ('LEFTPADDING', (0,0), (-1,-1), 0),
    ('RIGHTPADDING', (0,0), (-1,-1), 4),
    ('TOPPADDING', (0,0), (-1,-1), 2),
    ('BOTTOMPADDING', (0,0), (-1,-1), 2),
]))
story.append(dates_tbl)
story.append(Spacer(1, 4))

callout_data = [[Paragraph(
    "<b>This is where most diets fail.</b> Phases 2 and 3 are built in so your body doesn't rebound. "
    "We're not just helping you lose weight — we're helping you <b>keep</b> it off.",
    callout_s
)]]
callout_tbl = Table(callout_data, colWidths=[W])
callout_tbl.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,-1), HexColor('#F0F5F0')),
    ('BOX', (0,0), (-1,-1), 0.5, HexColor('#C8D8C8')),
    ('LEFTPADDING', (0,0), (-1,-1), 10),
    ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ('TOPPADDING', (0,0), (-1,-1), 6),
    ('BOTTOMPADDING', (0,0), (-1,-1), 6),
]))
story.append(callout_tbl)

story.append(Spacer(1, 4))
build_footer(story)
doc_wl.build(story)
print(f"PDF saved to {OUTPUT_WL}")


# ═══════════════════════════════════════════════════════════════════════════════
# HORMONE OPTIMIZATION ROADMAP
# ═══════════════════════════════════════════════════════════════════════════════
OUTPUT_HRT = "/Users/chriscupp/Code/rangemedical-system-2/docs/Range-HRT-Patient-Roadmap.pdf"

doc_hrt = SimpleDocTemplate(
    OUTPUT_HRT, pagesize=letter,
    rightMargin=0.75*inch, leftMargin=0.75*inch,
    topMargin=0.55*inch, bottomMargin=0.5*inch,
)
story = []
build_header(story)

story.append(Paragraph("HORMONE OPTIMIZATION PROGRAM", title_s))
story.append(Paragraph("Your Roadmap", subtitle_s))
story.append(Spacer(1, 6))

story += section_label("Patient Information")
info_data = [
    [Paragraph("<b>Patient</b>", label_s), Paragraph("_" * 50, blank_s),
     Paragraph("<b>Date</b>", label_s), Paragraph("_" * 22, blank_s)],
    [Paragraph("<b>Provider</b>", label_s), Paragraph("_" * 50, blank_s),
     Paragraph("<b>Primary Goal</b>", label_s), Paragraph("_" * 22, blank_s)],
]
info_tbl = Table(info_data, colWidths=[0.8*inch, 2.9*inch, 1.1*inch, 2.2*inch])
info_tbl.setStyle(TableStyle([
    ('VALIGN', (0,0), (-1,-1), 'BOTTOM'),
    ('LEFTPADDING', (0,0), (-1,-1), 0),
    ('RIGHTPADDING', (0,0), (-1,-1), 4),
    ('TOPPADDING', (0,0), (-1,-1), 3),
    ('BOTTOMPADDING', (0,0), (-1,-1), 3),
]))
story.append(info_tbl)
story.append(Spacer(1, 3))

story.append(Paragraph(
    "Your program has three phases: <b>find your dose</b>, <b>stabilize and fine-tune</b>, "
    "and <b>maintain your results long-term</b>. Hormone optimization is not a quick fix — "
    "it's a process, and each phase has a purpose.",
    body_s
))
story.append(Spacer(1, 5))

story += section_label("Your Three Phases")

story.append(phase_block(
    1, "Reset &amp; Find Your Dose", "First 8–12 weeks",
    "This phase is about finding your sweet spot, not perfection on day one.",
    [
        "Baseline labs and comprehensive symptom review",
        "Start or adjust hormones based on your labs and goals",
        "First follow-up labs around week 8 to see how your body responds",
        "Regular check-ins to monitor symptoms and adjust",
        "<b>What you're tracking:</b> energy, mood, sleep, libido, any side effects",
    ]
))
story.append(Spacer(1, 4))

story.append(phase_block(
    2, "Stabilize &amp; Fine-Tune", "Next 3–6 months",
    "Do most days feel better than before we started?",
    [
        "Keep your levels in a stable, optimal range",
        "Small dose adjustments if labs or symptoms call for it",
        "Provider visits every 8–12 weeks with labs at the same rhythm",
        "Address any secondary factors — sleep, stress, nutrition, training",
    ]
))
story.append(Spacer(1, 4))

story.append(phase_block(
    3, "Maintain &amp; Monitor", "Ongoing",
    None,
    [
        "Move to a steady maintenance schedule",
        "Labs every 3–6+ months as clinically appropriate",
        "Check-ins to adjust for life changes — stress, weight, other health shifts",
        "Transition into <b>Range Continued Care Membership</b> for ongoing labs, "
        "follow-ups, and easier access to adjustments",
    ]
))

story.append(Spacer(1, 5))
story += section_label("Upcoming Dates")
dates_data = [
    [Paragraph("<b>Next Visit</b>", label_s), Paragraph("_" * 28, blank_s),
     Paragraph("<b>Next Labs</b>", label_s), Paragraph("_" * 28, blank_s)],
]
dates_tbl = Table(dates_data, colWidths=[0.9*inch, 2.6*inch, 0.9*inch, 2.6*inch])
dates_tbl.setStyle(TableStyle([
    ('VALIGN', (0,0), (-1,-1), 'BOTTOM'),
    ('LEFTPADDING', (0,0), (-1,-1), 0),
    ('RIGHTPADDING', (0,0), (-1,-1), 4),
    ('TOPPADDING', (0,0), (-1,-1), 2),
    ('BOTTOMPADDING', (0,0), (-1,-1), 2),
]))
story.append(dates_tbl)
story.append(Spacer(1, 4))

story += section_label("What to Expect")
expect_data = [
    [Paragraph("<b>Weeks 1–4</b>", label_s),
     Paragraph("Early changes in energy and sleep. Full hormone response takes 6–8 weeks.", body_sm)],
    [Paragraph("<b>Weeks 6–12</b>", label_s),
     Paragraph("Meaningful improvement in mood, body composition, libido, and recovery. Follow-up labs confirm we're on track.", body_sm)],
    [Paragraph("<b>Month 3+</b>", label_s),
     Paragraph("Compounding benefits. This is when patients say they feel like themselves again.", body_sm)],
]
expect_tbl = Table(expect_data, colWidths=[0.9*inch, W - 0.9*inch])
expect_tbl.setStyle(TableStyle([
    ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ('LEFTPADDING', (0,0), (-1,-1), 8),
    ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ('TOPPADDING', (0,0), (-1,-1), 4),
    ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ('ROWBACKGROUNDS', (0,0), (-1,-1), [LIGHT_GRAY, WHITE]),
    ('BOX', (0,0), (-1,-1), 0.5, RULE_GRAY),
    ('LINEBELOW', (0,0), (-1,-2), 0.5, RULE_GRAY),
]))
story.append(expect_tbl)

story.append(Spacer(1, 4))
build_footer(story)
doc_hrt.build(story)
print(f"PDF saved to {OUTPUT_HRT}")
