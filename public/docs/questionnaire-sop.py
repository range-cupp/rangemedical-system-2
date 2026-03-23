#!/usr/bin/env python3
"""Generate Range Medical Questionnaire SOP PDF using the base template."""

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
step_num_s  = st('StepN',  fontName='Helvetica-Bold',    fontSize=9.5, textColor=BLACK,     leading=16)
step_txt_s  = st('StepT',  fontName='Helvetica',         fontSize=9.5, textColor=DARK_GRAY, leading=16)

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
            "Do not distribute externally. Contact system administrator for technical issues.",
            foot_s),
    ]], colWidths=[2.2*inch, 4.8*inch])
    tbl.setStyle(TableStyle([
        ('VALIGN',(0,0),(-1,-1),'TOP'),
        ('TOPPADDING',(0,0),(-1,-1),0),('BOTTOMPADDING',(0,0),(-1,-1),0),
        ('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),0),
    ]))
    story.append(tbl)


# ── BUILD THE PDF ──────────────────────────────────────────
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "questionnaire-sop.pdf")

doc = SimpleDocTemplate(
    OUTPUT_PATH,
    pagesize=letter,
    rightMargin=0.75*inch, leftMargin=0.75*inch,
    topMargin=0.65*inch,   bottomMargin=0.65*inch,
)
story = []
build_header(story)

# Title
story.append(Paragraph("PATIENT BASELINE QUESTIONNAIRE SYSTEM", title_s))
story.append(Paragraph("Standard Operating Procedure \u2014 Newport Beach Location \u2014 Effective March 2026", subtitle_s))
story.append(Spacer(1, 14))

# ═══════════════════════════════════════════════════════════
# SECTION 1 — OVERVIEW
# ═══════════════════════════════════════════════════════════
story += section_label("Section 1 \u2014 Overview")

story.append(Paragraph(
    "This system captures validated clinical baselines before a patient\u2019s first visit, "
    "giving providers scored data (PHQ-9, GAD-7, sleep quality, hormone symptoms, and more) "
    "before the patient walks in the door.", body_s))
story.append(Spacer(1, 8))

story.append(info_table([
    ("Purpose",     "Capture validated clinical baselines so providers have scored, actionable data before the first appointment"),
    ("System",      "Automated SMS-triggered questionnaire linked to the medical intake form"),
    ("Staff Action", "None required \u2014 fully automated from intake submission to scored results in the patient profile"),
    ("Time to Complete", "Door 1 (Injury): under 2 minutes. Door 2 (Optimization): 5\u201310 minutes. Combined: 7\u201312 minutes."),
]))

# ═══════════════════════════════════════════════════════════
# SECTION 2 — PATIENT FLOW
# ═══════════════════════════════════════════════════════════
story.append(Spacer(1, 6))
story += section_label("Section 2 \u2014 How It Works (Patient Flow)")

steps = [
    ("Step 1:", "Patient completes medical intake form (in-clinic iPad or sent via SMS link)."),
    ("Step 2:", "Patient selects their path \u2014 Injury, Energy &amp; Optimization, or both."),
    ("Step 3:", "System automatically sends SMS within 60 seconds with a personalized message and assessment link."),
    ("Step 4:", "Patient opens link on their phone \u2014 no login required, secured via unique token."),
    ("Step 5:", "Patient completes the questionnaire. Progress auto-saves on each section, so they can close and return anytime."),
    ("Step 6:", "Scored totals are saved to the database and visible on the patient profile before their appointment."),
]

step_data = [[Paragraph(num, tv_bold_s), Paragraph(txt, tv_s)] for num, txt in steps]
step_tbl = Table(step_data, colWidths=[0.7*inch, 6.3*inch])
step_tbl.setStyle(TableStyle([
    ('TOPPADDING',    (0,0),(-1,-1), 4),
    ('BOTTOMPADDING', (0,0),(-1,-1), 4),
    ('LEFTPADDING',   (0,0),(-1,-1), 8),
    ('RIGHTPADDING',  (0,0),(-1,-1), 8),
    ('VALIGN',        (0,0),(-1,-1), 'TOP'),
    ('ROWBACKGROUNDS',(0,0),(-1,-1), [LIGHT_GRAY, WHITE]),
    ('BOX',           (0,0),(-1,-1), 0.5, RULE_GRAY),
    ('LINEBELOW',     (0,0),(-1,-2), 0.5, RULE_GRAY),
]))
story.append(step_tbl)

story.append(Spacer(1, 6))
story.append(Paragraph(
    "<i>SMS Message:</i> \u201cHi [name], based on what you shared in your intake, "
    "we\u2019ve prepared a short clinical assessment tailored to your goals. It helps your provider "
    "build your personalized plan before your visit \u2014 takes under 10 minutes: [link]\u201d", note_s))

# ═══════════════════════════════════════════════════════════
# SECTION 3 — QUESTIONNAIRE CONTENT
# ═══════════════════════════════════════════════════════════
story += section_label("Section 3 \u2014 Questionnaire Content by Door")

# Door 1
story.append(Paragraph("Door 1 \u2014 Injury / Peptide Baseline", comp_s))
story.append(Paragraph("Completion time: under 2 minutes. Three questions only.", note_s))
story.append(bullet("Pain severity \u2014 NRS slider 0\u201310 (no pain to worst pain imaginable)"))
story.append(bullet("Functional limitation \u2014 NRS slider 0\u201310 (not at all to completely limiting)"))
story.append(bullet("Trajectory \u2014 Single select: Getting better / Staying the same / Getting worse"))

story.append(Spacer(1, 6))

# Door 2
story.append(Paragraph("Door 2 \u2014 Energy &amp; Optimization Baseline", comp_s))
story.append(Paragraph("Completion time: 5\u201310 minutes. Adaptive form with branching logic.", note_s))

story.append(Paragraph("Core Sections (all optimization patients):", sub_s))
story.append(bullet("PHQ-9 \u2014 Patient Health Questionnaire (mood/depression, 9 questions, scored 0\u201327)"))
story.append(bullet("GAD-7 \u2014 Generalized Anxiety Disorder (anxiety, 7 questions, scored 0\u201321)"))
story.append(bullet("PSQI Simplified \u2014 Pittsburgh Sleep Quality Index (sleep, 5 questions)"))
story.append(bullet("Fatigue VAS \u2014 Energy level on a typical day (slider 0\u201310)"))

story.append(Spacer(1, 4))
story.append(Paragraph("Conditional Branches (shown based on intake symptom selections):", sub_s))

branch_data = [
    [Paragraph("Intake Selection", th_s), Paragraph("Male", th_s), Paragraph("Female", th_s)],
    [Paragraph("Low libido / sexual dysfunction", tv_s), Paragraph("IIEF-5 (5 questions)", tv_s), Paragraph("FSFI-6 (6 domains)", tv_s)],
    [Paragraph("Weight gain / difficulty losing weight", tv_s), Paragraph("TFEQ-R18 (18 questions)", tv_s), Paragraph("TFEQ-R18 (18 questions)", tv_s)],
    [Paragraph("Hormone symptoms (fatigue, mood, muscle loss, brain fog)", tv_s), Paragraph("AMS (17 questions)", tv_s), Paragraph("MENQOL (29 questions)", tv_s)],
]
branch_tbl = Table(branch_data, colWidths=[3.0*inch, 2.0*inch, 2.0*inch])
branch_tbl.setStyle(TableStyle([
    ('TOPPADDING',    (0,0),(-1,-1), 4),
    ('BOTTOMPADDING', (0,0),(-1,-1), 4),
    ('LEFTPADDING',   (0,0),(-1,-1), 8),
    ('RIGHTPADDING',  (0,0),(-1,-1), 8),
    ('VALIGN',        (0,0),(-1,-1), 'TOP'),
    ('BACKGROUND',    (0,0),(-1,0), LIGHT_GRAY),
    ('ROWBACKGROUNDS',(0,1),(-1,-1), [WHITE, LIGHT_GRAY]),
    ('BOX',           (0,0),(-1,-1), 0.5, RULE_GRAY),
    ('LINEBELOW',     (0,0),(-1,-1), 0.5, RULE_GRAY),
    ('LINEBEFORE',    (1,0),(1,-1), 0.5, RULE_GRAY),
    ('LINEBEFORE',    (2,0),(2,-1), 0.5, RULE_GRAY),
]))
story.append(branch_tbl)

story.append(Spacer(1, 6))
story.append(Paragraph("Final Question (all optimization patients):", sub_s))
story.append(bullet("\u201cWhat is your primary goal for this program?\u201d \u2014 open text field"))

story.append(Spacer(1, 6))
story.append(Paragraph("Combined (both doors selected):", sub_s))
story.append(Paragraph(
    "When a patient selects both Injury and Energy &amp; Optimization in their intake, "
    "the system creates a single combined assessment. Injury baseline questions flow seamlessly "
    "into optimization sections \u2014 one link, one SMS, one continuous experience.", body_s))

# ═══════════════════════════════════════════════════════════
# PAGE BREAK — SECTION 4
# ═══════════════════════════════════════════════════════════
story.append(PageBreak())
build_header(story)

story += section_label("Section 4 \u2014 What the Provider Sees")

story.append(Paragraph(
    "Scored totals appear on the patient profile before the appointment. "
    "Providers can see both summary scores and individual question responses.", body_s))
story.append(Spacer(1, 8))

score_data = [
    [Paragraph("Instrument", th_s), Paragraph("Score Range", th_s), Paragraph("Severity Levels", th_s)],
    [Paragraph("PHQ-9", tv_bold_s), Paragraph("0\u201327", tv_s), Paragraph("0\u20134 minimal  \u2022  5\u20139 mild  \u2022  10\u201314 moderate  \u2022  15\u201319 mod. severe  \u2022  20\u201327 severe", tv_s)],
    [Paragraph("GAD-7", tv_bold_s), Paragraph("0\u201321", tv_s), Paragraph("0\u20134 minimal  \u2022  5\u20139 mild  \u2022  10\u201314 moderate  \u2022  15\u201321 severe", tv_s)],
    [Paragraph("IIEF-5", tv_bold_s), Paragraph("5\u201325", tv_s), Paragraph("5\u20137 severe ED  \u2022  8\u201311 moderate  \u2022  12\u201316 mild-moderate  \u2022  17\u201321 mild  \u2022  22\u201325 normal", tv_s)],
    [Paragraph("AMS", tv_bold_s), Paragraph("17\u201385", tv_s), Paragraph("17\u201326 none  \u2022  27\u201336 mild  \u2022  37\u201349 moderate  \u2022  50+ severe", tv_s)],
    [Paragraph("PSQI", tv_bold_s), Paragraph("0\u20139", tv_s), Paragraph("Lower = better sleep quality (composite of 5 simplified items)", tv_s)],
    [Paragraph("Fatigue VAS", tv_bold_s), Paragraph("0\u201310", tv_s), Paragraph("0 = completely exhausted  \u2022  10 = full energy", tv_s)],
    [Paragraph("Pain NRS", tv_bold_s), Paragraph("0\u201310", tv_s), Paragraph("0 = no pain  \u2022  10 = worst pain imaginable", tv_s)],
]
score_tbl = Table(score_data, colWidths=[1.1*inch, 0.8*inch, 5.1*inch])
score_tbl.setStyle(TableStyle([
    ('TOPPADDING',    (0,0),(-1,-1), 4),
    ('BOTTOMPADDING', (0,0),(-1,-1), 4),
    ('LEFTPADDING',   (0,0),(-1,-1), 6),
    ('RIGHTPADDING',  (0,0),(-1,-1), 6),
    ('VALIGN',        (0,0),(-1,-1), 'TOP'),
    ('BACKGROUND',    (0,0),(-1,0), LIGHT_GRAY),
    ('ROWBACKGROUNDS',(0,1),(-1,-1), [WHITE, LIGHT_GRAY]),
    ('BOX',           (0,0),(-1,-1), 0.5, RULE_GRAY),
    ('LINEBELOW',     (0,0),(-1,-1), 0.5, RULE_GRAY),
    ('LINEBEFORE',    (1,0),(1,-1), 0.5, RULE_GRAY),
    ('LINEBEFORE',    (2,0),(2,-1), 0.5, RULE_GRAY),
]))
story.append(score_tbl)

# ═══════════════════════════════════════════════════════════
# SECTION 5 — FOLLOW-UP QUESTIONNAIRES
# ═══════════════════════════════════════════════════════════
story.append(Spacer(1, 6))
story += section_label("Section 5 \u2014 Follow-Up Questionnaires (Planned)")

story.append(Paragraph(
    "After a protocol starts, the same validated instruments from the patient\u2019s baseline "
    "will be automatically re-sent at protocol milestones to track progress over time.", body_s))
story.append(Spacer(1, 6))

story.append(info_table([
    ("Schedule",     "Follow-up assessments at 6 weeks, 12 weeks, and 6 months after protocol start"),
    ("Automation",   "Cron job checks protocol milestones daily and sends SMS automatically \u2014 no staff action"),
    ("Provider View", "Trend over time displayed on patient profile (e.g., PHQ-9: 14 \u2192 9 \u2192 5)"),
    ("Clinical Value", "Enables data-driven treatment decisions, dose adjustments, and outcome tracking"),
], col1=1.5*inch))

# ═══════════════════════════════════════════════════════════
# SECTION 6 — TROUBLESHOOTING
# ═══════════════════════════════════════════════════════════
story.append(Spacer(1, 6))
story += section_label("Section 6 \u2014 Troubleshooting")

trouble_data = [
    [Paragraph("Issue", th_s), Paragraph("Resolution", th_s)],
    [Paragraph("Patient didn\u2019t receive SMS", tv_s), Paragraph("Verify phone number in intake form. Check comms_log table for delivery status. Re-trigger via admin if needed.", tv_s)],
    [Paragraph("Patient closed before finishing", tv_s), Paragraph("Progress auto-saves on each section advance. Patient can reopen the same link to resume where they left off.", tv_s)],
    [Paragraph("Patient already completed", tv_s), Paragraph("Link shows \u201cAll done\u201d confirmation screen. Data is already saved. No action needed.", tv_s)],
    [Paragraph("Wrong questionnaire content", tv_s), Paragraph("Content is driven by intake selections (injury checkbox, optimization checkbox, symptom checklist, gender). Verify the intake record.", tv_s)],
    [Paragraph("Link expired or not found", tv_s), Paragraph("Token may have been corrupted in SMS. Check baseline_questionnaires table for the patient\u2019s record and generate a new link if needed.", tv_s)],
]
trouble_tbl = Table(trouble_data, colWidths=[2.0*inch, 5.0*inch])
trouble_tbl.setStyle(TableStyle([
    ('TOPPADDING',    (0,0),(-1,-1), 5),
    ('BOTTOMPADDING', (0,0),(-1,-1), 5),
    ('LEFTPADDING',   (0,0),(-1,-1), 8),
    ('RIGHTPADDING',  (0,0),(-1,-1), 8),
    ('VALIGN',        (0,0),(-1,-1), 'TOP'),
    ('BACKGROUND',    (0,0),(-1,0), LIGHT_GRAY),
    ('ROWBACKGROUNDS',(0,1),(-1,-1), [WHITE, LIGHT_GRAY]),
    ('BOX',           (0,0),(-1,-1), 0.5, RULE_GRAY),
    ('LINEBELOW',     (0,0),(-1,-1), 0.5, RULE_GRAY),
    ('LINEBEFORE',    (1,0),(1,-1), 0.5, RULE_GRAY),
]))
story.append(trouble_tbl)

# ═══════════════════════════════════════════════════════════
# SECTION 7 — TECHNICAL REFERENCE
# ═══════════════════════════════════════════════════════════
story.append(Spacer(1, 6))
story += section_label("Section 7 \u2014 Technical Reference (For Developers)")

story.append(info_table([
    ("Database Table",   "baseline_questionnaires (Supabase/PostgreSQL)"),
    ("Patient Page",     "/questionnaire/[token] \u2014 token-gated, no authentication required"),
    ("Trigger API",      "/api/questionnaire/trigger \u2014 creates record + sends SMS (called from /api/intakes)"),
    ("CRUD API",         "/api/questionnaire/[token] \u2014 GET (load), PUT (auto-save), POST (final submit)"),
    ("Intake Hook",      "Fire-and-forget call from /api/intakes after successful submission"),
    ("SMS Provider",     "Twilio (primary) or Blooio (configurable via SMS_PROVIDER env var)"),
    ("Definitions",      "lib/questionnaire-definitions.js \u2014 all instrument definitions, scoring, branching logic"),
    ("Door Values",      "1 = Injury only, 2 = Optimization only, 3 = Combined (both)"),
], col1=1.5*inch))

# Footer
story.append(Spacer(1, 16))
build_footer(story)
doc.build(story)
print(f"PDF generated: {OUTPUT_PATH}")
