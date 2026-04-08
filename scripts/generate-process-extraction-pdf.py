#!/usr/bin/env python3
"""Generate Range Sports Therapy Process Extraction Template PDF."""

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
W = 7.0 * inch

def st(name, **kw):
    return ParagraphStyle(name, **kw)

clinic_s    = st('Clinic', fontName='Helvetica-Bold',    fontSize=13,  textColor=BLACK,     leading=16)
contact_s   = st('Cont',   fontName='Helvetica',         fontSize=8,   textColor=MID_GRAY,  leading=12, alignment=TA_RIGHT)
title_s     = st('Title',  fontName='Helvetica-Bold',    fontSize=17,  textColor=BLACK,     leading=21, spaceAfter=2)
subtitle_s  = st('Sub',    fontName='Helvetica-Oblique', fontSize=9.5, textColor=MID_GRAY,  leading=13)
sec_s       = st('Sec',    fontName='Helvetica-Bold',    fontSize=8,   textColor=MID_GRAY,  leading=11, spaceBefore=16, spaceAfter=3)
body_s      = st('Body',   fontName='Helvetica',         fontSize=9.5, textColor=DARK_GRAY, leading=16, spaceAfter=0)
bullet_s    = st('Bul',    fontName='Helvetica',         fontSize=9.5, textColor=DARK_GRAY, leading=16, leftIndent=14, firstLineIndent=-10, spaceAfter=2)
th_s        = st('TH',     fontName='Helvetica-Bold',    fontSize=8,   textColor=MID_GRAY,  leading=11)
tv_s        = st('TV',     fontName='Helvetica',         fontSize=9.5, textColor=DARK_GRAY, leading=14)
tv_bold_s   = st('TVB',    fontName='Helvetica-Bold',    fontSize=9.5, textColor=BLACK,     leading=14)
foot_s      = st('Foot',   fontName='Helvetica-Oblique', fontSize=8,   textColor=MID_GRAY,  leading=12)
foot_bold_s = st('FootB',  fontName='Helvetica-Bold',    fontSize=8.5, textColor=DARK_GRAY, leading=12)

# Additional styles for this template
step_title_s = st('StepTitle', fontName='Helvetica-Bold', fontSize=12, textColor=BLACK, leading=15, spaceBefore=10, spaceAfter=4)
question_s   = st('Question',  fontName='Helvetica-Bold', fontSize=9,  textColor=DARK_GRAY, leading=13, spaceAfter=2)
line_s       = st('Line',      fontName='Helvetica',      fontSize=9,  textColor=MID_GRAY,  leading=20, spaceAfter=0)
instruct_s   = st('Instruct',  fontName='Helvetica-Oblique', fontSize=9.5, textColor=MID_GRAY, leading=14, spaceAfter=8)
check_label_s = st('CheckLabel', fontName='Helvetica', fontSize=9, textColor=DARK_GRAY, leading=14)

def section_label(text):
    return [
        Paragraph(text.upper(), sec_s),
        HRFlowable(width="100%", thickness=0.75, color=RULE_GRAY, spaceAfter=8),
    ]

def build_header(story):
    hdr = Table([[
        Paragraph("RANGE SPORTS THERAPY", clinic_s),
        Paragraph("Process Extraction Template", contact_s),
    ]], colWidths=[3.2 * inch, 3.8 * inch])
    hdr.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
    ]))
    story.append(hdr)
    story.append(HRFlowable(width="100%", thickness=1.5, color=BLACK, spaceAfter=12))

def build_footer(story):
    story.append(Spacer(1, 12))
    story.append(HRFlowable(width="100%", thickness=0.5, color=RULE_GRAY, spaceAfter=8))
    story.append(Paragraph(
        "Range Sports Therapy \u2014 Process Extraction Template \u2014 Confidential",
        foot_s
    ))

def write_lines(story, count=3):
    """Add blank ruled lines for handwriting."""
    for _ in range(count):
        story.append(Spacer(1, 18))
        story.append(HRFlowable(width="100%", thickness=0.25, color=RULE_GRAY, spaceAfter=2))

def build_step_section(story, number, title, questions):
    """Build a full step section with questions and write-in space."""
    story += section_label(f"Step {number}: {title}")

    for q in questions:
        story.append(Paragraph(f"\u25a2  {q}", question_s))
        write_lines(story, count=3)
        story.append(Spacer(1, 6))

    story.append(Spacer(1, 4))


# ── BUILD THE PDF ────────────────────────────────────────────────────────────

OUTPUT_PATH = "public/docs/range-sports-therapy-process-extraction.pdf"

doc = SimpleDocTemplate(
    OUTPUT_PATH,
    pagesize=letter,
    rightMargin=0.75 * inch,
    leftMargin=0.75 * inch,
    topMargin=0.65 * inch,
    bottomMargin=0.65 * inch,
)

story = []
build_header(story)

# Title
story.append(Paragraph("PROCESS EXTRACTION TEMPLATE", title_s))
story.append(Paragraph("Part 1 \u2014 The Journey Map", subtitle_s))
story.append(Spacer(1, 14))

# Instructions
story += section_label("Instructions")
story.append(Paragraph(
    "Walk through a single patient from first contact to discharge. "
    "For each step, document the following:",
    instruct_s
))
story.append(Spacer(1, 6))

# The 7 questions as a reference checklist
ref_questions = [
    "What happens? (Describe it like you\u2019re narrating to someone who\u2019s never been here)",
    "Who does it?",
    "How long does it take?",
    "What tools / forms / systems are used?",
    "What decisions get made at this step? (If X \u2192 do Y, if Z \u2192 do W)",
    "What gets documented, and where?",
    "What triggers the next step?",
]

for q in ref_questions:
    story.append(Paragraph(f"\u25a2  {q}", check_label_s))
    story.append(Spacer(1, 2))

story.append(Spacer(1, 8))
story.append(Paragraph(
    "Each step below repeats these seven questions with space to write your answers.",
    instruct_s
))

# Page break before steps begin
story.append(PageBreak())

# The 12 steps
steps = [
    ("Booking / First Contact", [
        "What happens when someone first reaches out or books?",
        "Who handles it?",
        "How long does it take?",
        "What tools / forms / systems are used?",
        "What decisions get made? (If X \u2192 do Y, if Z \u2192 do W)",
        "What gets documented, and where?",
        "What triggers the next step?",
    ]),
    ("Arrival / Check-in", [
        "What happens when the patient walks in the door?",
        "Who handles it?",
        "How long does it take?",
        "What tools / forms / systems are used?",
        "What decisions get made? (If X \u2192 do Y, if Z \u2192 do W)",
        "What gets documented, and where?",
        "What triggers the next step?",
    ]),
    ("Intake Paperwork", [
        "What paperwork does the patient fill out?",
        "Who handles it?",
        "How long does it take?",
        "What tools / forms / systems are used?",
        "What decisions get made? (If X \u2192 do Y, if Z \u2192 do W)",
        "What gets documented, and where?",
        "What triggers the next step?",
    ]),
    ("Initial Assessment", [
        "What does the assessment consist of?",
        "Who performs it?",
        "How long does it take?",
        "What tools / equipment / systems are used?",
        "What decisions get made? (If finding X \u2192 recommend Y)",
        "What gets documented, and where?",
        "What triggers the next step?",
    ]),
    ("Diagnosis / Findings Discussion with Patient", [
        "What happens \u2014 how are findings communicated?",
        "Who does it?",
        "How long does it take?",
        "What tools / visuals / systems are used?",
        "What decisions get made? (If X \u2192 do Y, if Z \u2192 do W)",
        "What gets documented, and where?",
        "What triggers the next step?",
    ]),
    ("Treatment Plan Recommendation", [
        "What happens \u2014 how is the plan presented?",
        "Who does it?",
        "How long does it take?",
        "What tools / forms / systems are used?",
        "What decisions get made? (If patient wants X \u2192 do Y)",
        "What gets documented, and where?",
        "What triggers the next step?",
    ]),
    ("First Treatment (if same day)", [
        "What happens during the first treatment?",
        "Who performs it?",
        "How long does it take?",
        "What tools / equipment / systems are used?",
        "What decisions get made during treatment?",
        "What gets documented, and where?",
        "What triggers the next step?",
    ]),
    ("Scheduling Follow-ups", [
        "What happens \u2014 how are follow-ups scheduled?",
        "Who handles it?",
        "How long does it take?",
        "What tools / systems are used?",
        "What decisions get made? (Frequency, duration, etc.)",
        "What gets documented, and where?",
        "What triggers the next step?",
    ]),
    ("Payment / Insurance", [
        "What happens \u2014 how is payment handled?",
        "Who handles it?",
        "How long does it take?",
        "What tools / systems are used?",
        "What decisions get made? (Insurance vs. cash, packages, etc.)",
        "What gets documented, and where?",
        "What triggers the next step?",
    ]),
    ("Ongoing Visits \u2014 What Changes Visit to Visit?", [
        "What happens at a typical follow-up visit?",
        "Who handles it?",
        "How long does it take?",
        "What tools / equipment / systems are used?",
        "What decisions get made? (Progress, plan adjustments, etc.)",
        "What gets documented, and where?",
        "What triggers the next step or change in plan?",
    ]),
    ("Discharge / Graduation \u2014 How Do You Know They\u2019re Done?", [
        "What happens \u2014 what does discharge look like?",
        "Who makes the call?",
        "How long does the process take?",
        "What tools / forms / systems are used?",
        "What decisions get made? (Criteria for discharge)",
        "What gets documented, and where?",
        "What triggers discharge vs. continued care?",
    ]),
    ("Re-engagement \u2014 What Happens If They Stop Showing Up?", [
        "What happens when a patient goes dark?",
        "Who handles outreach?",
        "How long before you reach out?",
        "What tools / systems are used?",
        "What decisions get made? (When to call, text, give up)",
        "What gets documented, and where?",
        "What triggers re-engagement vs. closing the case?",
    ]),
]

for i, (title, questions) in enumerate(steps, 1):
    if i > 1:
        story.append(PageBreak())
    build_step_section(story, i, title, questions)

# Final page - notes
story.append(PageBreak())
story += section_label("Additional Notes")
story.append(Paragraph(
    "Use this space for anything that didn\u2019t fit above \u2014 "
    "unwritten rules, edge cases, things Dr. G does that he\u2019s never documented.",
    instruct_s
))
write_lines(story, count=20)

build_footer(story)
doc.build(story)
print(f"PDF generated: {OUTPUT_PATH}")
