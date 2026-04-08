#!/usr/bin/env python3
"""Generate Range Medical Training System Framework PDF."""

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table,
                                 TableStyle, HRFlowable, KeepTogether, PageBreak)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
import os

BLACK      = HexColor('#0A0A0A')
DARK_GRAY  = HexColor('#1A1A1A')
MID_GRAY   = HexColor('#606060')
LIGHT_GRAY = HexColor('#F4F4F4')
RULE_GRAY  = HexColor('#DDDDDD')
WHITE      = HexColor('#FFFFFF')
GREEN      = HexColor('#2E6B35')
ACCENT     = HexColor('#1A3A5C')
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
bullet2_s   = st('Bul2',   fontName='Helvetica',         fontSize=9,   textColor=DARK_GRAY, leading=14, leftIndent=28, firstLineIndent=-10, spaceAfter=1)
th_s        = st('TH',     fontName='Helvetica-Bold',    fontSize=8,   textColor=MID_GRAY,  leading=11)
tv_s        = st('TV',     fontName='Helvetica',         fontSize=9.5, textColor=DARK_GRAY, leading=14)
tv_bold_s   = st('TVB',    fontName='Helvetica-Bold',    fontSize=9.5, textColor=BLACK,     leading=14)
check_s     = st('Chk',    fontName='Helvetica-Bold',    fontSize=9,   textColor=GREEN,     leading=14)
foot_s      = st('Foot',   fontName='Helvetica-Oblique', fontSize=8,   textColor=MID_GRAY,  leading=12)
foot_bold_s = st('FootB',  fontName='Helvetica-Bold',    fontSize=8.5, textColor=DARK_GRAY, leading=12)
note_s      = st('Note',   fontName='Helvetica-Oblique', fontSize=9,   textColor=MID_GRAY,  leading=13, spaceAfter=4)
num_s       = st('Num',    fontName='Helvetica-Bold',    fontSize=11,  textColor=ACCENT,    leading=14)
callout_s   = st('Call',   fontName='Helvetica-Bold',    fontSize=9.5, textColor=ACCENT,    leading=14, spaceBefore=6, spaceAfter=2)

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

def bullet2(text):
    return Paragraph(f"\u2013  {text}", bullet2_s)

def numbered_step(num, title, body_text):
    """A numbered step with bold title and body."""
    return KeepTogether([
        Paragraph(f"<b>{num}. {title}</b>", sub_s),
        Paragraph(body_text, body_s),
        Spacer(1, 4),
    ])

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
            "This document is for Range Medical internal use only. "
            "Do not distribute externally. Apply this framework to every process at Range Medical.",
            foot_s),
    ]], colWidths=[2.2*inch, 4.8*inch])
    tbl.setStyle(TableStyle([
        ('VALIGN',(0,0),(-1,-1),'TOP'),
        ('TOPPADDING',(0,0),(-1,-1),0),('BOTTOMPADDING',(0,0),(-1,-1),0),
        ('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),0),
    ]))
    story.append(tbl)


# ── BUILD THE PDF ──────────────────────────────────────────
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "training-system-framework.pdf")

doc = SimpleDocTemplate(
    OUTPUT_PATH,
    pagesize=letter,
    rightMargin=0.75*inch, leftMargin=0.75*inch,
    topMargin=0.65*inch,   bottomMargin=0.65*inch,
)
story = []
build_header(story)

# Title
story.append(Paragraph("TRAINING SYSTEM FRAMEWORK", title_s))
story.append(Paragraph("What / How / When / Blockers / Will \u2014 The Standard For Every Process at Range Medical", subtitle_s))
story.append(Spacer(1, 10))

# ── CORE PRINCIPLE ──
story += section_label("Core Principle")
story.append(Paragraph(
    "You are not making nice manuals. You are making it <b>impossible for a reasonable person to fail.</b> "
    "This framework applies to every process at Range Medical \u2014 walk-ins, phones, DMs, labs, follow-up, everything.",
    body_s))
story.append(Spacer(1, 6))
story.append(Paragraph(
    "The standard: <b>\u201cThey are trained when they can do it right, on demand, without me.\u201d</b>",
    callout_s))
story.append(Spacer(1, 10))


# ═══════════════════════════════════════════════════════════
# STEP 1 — START WITH SEATS, NOT TASKS
# ═══════════════════════════════════════════════════════════
story += section_label("Step 1 \u2014 Start With Seats, Not Tasks")

story.append(Paragraph(
    "Before writing any training material, define the seats in the clinic and what each seat <b>owns</b>. "
    "Training is anchored to outcomes, not random activity.",
    body_s))
story.append(Spacer(1, 8))

# Seats table
seats_data = [
    [Paragraph("<b>Seat</b>", th_s),
     Paragraph("<b>Outcomes Owned</b>", th_s),
     Paragraph("<b>Metrics</b>", th_s)],
    [Paragraph("Front Desk / Phones", tv_bold_s),
     Paragraph("\u2013  90% of calls answered within 3 rings<br/>"
               "\u2013  Every walk-in greeted within 30 seconds<br/>"
               "\u2013  All call notes logged in LeadConnector<br/>"
               "\u2013  No patient leaves without a next step", tv_s),
     Paragraph("\u2013  Ring-to-answer time<br/>"
               "\u2013  Call log completion rate<br/>"
               "\u2013  Walk-in conversion rate", tv_s)],
    [Paragraph("Sales / Consults", tv_bold_s),
     Paragraph("\u2013  80% of consults book a plan<br/>"
               "\u2013  Assessment sent within 24 hours of booking<br/>"
               "\u2013  Follow-up within 48 hours of no-show", tv_s),
     Paragraph("\u2013  Consult-to-plan conversion<br/>"
               "\u2013  Assessment completion rate<br/>"
               "\u2013  No-show recovery rate", tv_s)],
    [Paragraph("Provider", tv_bold_s),
     Paragraph("\u2013  Review patient data before every visit<br/>"
               "\u2013  Treatment plan documented same day<br/>"
               "\u2013  Lab results reviewed within 48 hours", tv_s),
     Paragraph("\u2013  Pre-visit prep rate<br/>"
               "\u2013  Same-day documentation rate<br/>"
               "\u2013  Lab turnaround time", tv_s)],
    [Paragraph("Back Office / Ops", tv_bold_s),
     Paragraph("\u2013  Inventory never runs out mid-week<br/>"
               "\u2013  All purchases reconciled weekly<br/>"
               "\u2013  Compliance docs current and filed", tv_s),
     Paragraph("\u2013  Stockout incidents per month<br/>"
               "\u2013  Reconciliation accuracy<br/>"
               "\u2013  Compliance audit score", tv_s)],
]

seats_tbl = Table(seats_data, colWidths=[1.2*inch, 3.0*inch, 2.8*inch])
seats_tbl.setStyle(TableStyle([
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
    ('LINEBEFORE',    (2,0),(2,-1), 0.5, RULE_GRAY),
]))
story.append(seats_tbl)

story.append(Spacer(1, 6))
story.append(Paragraph(
    "<b>Do this first.</b> For each seat, define 3\u20135 outcomes they own and 1\u20133 metrics for each. "
    "Everything else flows from this.",
    note_s))

story.append(PageBreak())
build_header(story)

# ═══════════════════════════════════════════════════════════
# STEP 2 — PROCESS CARDS
# ═══════════════════════════════════════════════════════════
story += section_label("Step 2 \u2014 Build a Process Card for Every Repeated Task")

story.append(Paragraph(
    "For every important task (answer phone, greet walk-in, book consult, upsell assessment, collect payment), "
    "create a <b>one-page Process Card</b> with this exact structure. Tape these at each workstation.",
    body_s))
story.append(Spacer(1, 10))

# Process Card structure
pc_data = [
    [Paragraph("<b>Section</b>", th_s),
     Paragraph("<b>What Goes Here</b>", th_s),
     Paragraph("<b>Example (Inbound Phone Call)</b>", th_s)],
    [Paragraph("<b>1. WHAT</b>", tv_bold_s),
     Paragraph("One sentence: what is this task?<br/>"
               "Outcome and definition of done.", tv_s),
     Paragraph("\u201cHandle inbound calls so that every caller is greeted within 3 rings, "
               "booked or helped, and notes are logged in LeadConnector.\u201d", tv_s)],
    [Paragraph("<b>2. HOW</b>", tv_bold_s),
     Paragraph("Step-by-step checklist, 8\u201312 bullets.<br/>"
               "Include exact scripts where words matter.", tv_s),
     Paragraph("1. Answer within 3 rings<br/>"
               "2. \u201cThank you for calling Range Medical, this is [name], how can I help you?\u201d<br/>"
               "3. Triage: new patient, existing, or lab callback?<br/>"
               "4. New patient \u2192 offer free assessment<br/>"
               "5. Book with 2-option close: \u201cI have Tuesday at 10 or Thursday at 2 \u2014 which works better?\u201d<br/>"
               "6. Collect name, phone, email<br/>"
               "7. Log call in LeadConnector with disposition code<br/>"
               "8. Set next step / follow-up task", tv_s)],
    [Paragraph("<b>3. WHEN</b>", tv_bold_s),
     Paragraph("Triggers and timing.<br/>"
               "When does this process apply?", tv_s),
     Paragraph("Use for: new patient inquiries, price shoppers, lab result callbacks.<br/>"
               "Answer immediately. If missed, return call within 15 minutes.", tv_s)],
    [Paragraph("<b>4. TOOLS</b>", tv_bold_s),
     Paragraph("Links, systems, forms needed.", tv_s),
     Paragraph("LeadConnector \u2192 Contacts pipeline<br/>"
               "Range CRM patient lookup<br/>"
               "Assessment booking link", tv_s)],
    [Paragraph("<b>5. QUALITY BAR</b>", tv_bold_s),
     Paragraph("How you know it was done right.<br/>"
               "Checklist for completion.", tv_s),
     Paragraph("\u2713 Call log completed<br/>"
               "\u2713 Disposition code set<br/>"
               "\u2713 Next step scheduled<br/>"
               "\u2713 No missing fields<br/>"
               "\u2713 Patient has a clear next action", tv_s)],
]

pc_tbl = Table(pc_data, colWidths=[1.0*inch, 2.4*inch, 3.6*inch])
pc_tbl.setStyle(TableStyle([
    ('TOPPADDING',    (0,0),(-1,-1), 6),
    ('BOTTOMPADDING', (0,0),(-1,-1), 6),
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
story.append(pc_tbl)

story.append(PageBreak())
build_header(story)

# ═══════════════════════════════════════════════════════════
# STEP 3 — TRAINING FLOW
# ═══════════════════════════════════════════════════════════
story += section_label("Step 3 \u2014 Training Flow for Every New Hire")

story.append(Paragraph(
    "Use the same 5-step sequence every time, for every process. "
    "Same flow whether it\u2019s \u201cguy walks in\u201d or \u201cphone rings.\u201d",
    body_s))
story.append(Spacer(1, 8))

# Training flow table
tf_data = [
    [Paragraph("<b>Phase</b>", th_s),
     Paragraph("<b>What Happens</b>", th_s),
     Paragraph("<b>Key Details</b>", th_s)],
    [Paragraph("<b>1. EXPLAIN</b><br/><i>What / Why</i>", tv_bold_s),
     Paragraph("Review the Process Card with them.", tv_s),
     Paragraph("Explain <i>why</i> it matters: \u201cThis is how we make sure no patient falls through the cracks.\u201d "
               "Connect the task to the outcome they own.", tv_s)],
    [Paragraph("<b>2. DEMONSTRATE</b><br/><i>You do it</i>", tv_bold_s),
     Paragraph("You or your best person performs the task live.", tv_s),
     Paragraph("Follow the checklist exactly as written. Record on Loom if possible for future reference. "
               "They watch, take notes, ask questions.", tv_s)],
    [Paragraph("<b>3. SIMULATE</b><br/><i>They practice</i>", tv_bold_s),
     Paragraph("Role play for calls and in-person scenarios.", tv_s),
     Paragraph("They must do it <b>with the checklist visible</b> until they can do it without looking. "
               "Repeat until smooth. No shortcutting this step.", tv_s)],
    [Paragraph("<b>4. OBSERVED LIVE</b><br/><i>They do it for real</i>", tv_bold_s),
     Paragraph("They do the real thing while you shadow.", tv_s),
     Paragraph("Score them against the Process Card checklist. Give <b>immediate</b> feedback after each rep. "
               "Don\u2019t wait until end of day.", tv_s)],
    [Paragraph("<b>5. CERTIFY</b><br/><i>Sign-off</i>", tv_bold_s),
     Paragraph("They hit the Quality Bar 3\u20135 times in a row.", tv_s),
     Paragraph("You sign off that process. Track which processes each person is certified on. "
               "No one is \u201ctrained\u201d until they\u2019re certified.", tv_s)],
]

tf_tbl = Table(tf_data, colWidths=[1.2*inch, 2.4*inch, 3.4*inch])
tf_tbl.setStyle(TableStyle([
    ('TOPPADDING',    (0,0),(-1,-1), 6),
    ('BOTTOMPADDING', (0,0),(-1,-1), 6),
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
story.append(tf_tbl)
story.append(Spacer(1, 12))

story.append(PageBreak())
build_header(story)

# ═══════════════════════════════════════════════════════════
# STEP 4 — THE 5-QUESTION CHECK
# ═══════════════════════════════════════════════════════════
story += section_label("Step 4 \u2014 Managing Performance: The 5-Question Check")

story.append(Paragraph(
    "When someone is not doing something, walk this ladder <b>in order</b>. "
    "Fix 1\u20134 before you ever conclude \u201cthey don\u2019t care.\u201d",
    body_s))
story.append(Spacer(1, 8))

check_data = [
    [Paragraph("<b>#</b>", th_s),
     Paragraph("<b>Question</b>", th_s),
     Paragraph("<b>If No \u2014 Fix This</b>", th_s),
     Paragraph("<b>Category</b>", th_s)],
    [Paragraph("1", tv_bold_s),
     Paragraph("Do they know <b>what outcome</b> they own?", tv_s),
     Paragraph("Revisit the seat definition. Clarify expectations.", tv_s),
     Paragraph("<b>WHAT</b>", tv_bold_s)],
    [Paragraph("2", tv_bold_s),
     Paragraph("Do they know <b>how</b> to do it?<br/>(Clear SOP + training reps)", tv_s),
     Paragraph("Review the Process Card. Re-run Simulate + Observed steps.", tv_s),
     Paragraph("<b>HOW</b>", tv_bold_s)],
    [Paragraph("3", tv_bold_s),
     Paragraph("Do they know <b>when</b> to do it?<br/>(Triggers and timing)", tv_s),
     Paragraph("Clarify triggers. Post the \u201cWhen\u201d section visibly.", tv_s),
     Paragraph("<b>WHEN</b>", tv_bold_s)],
    [Paragraph("4", tv_bold_s),
     Paragraph("Do they have <b>blockers</b>?<br/>(Tools, authority, time)", tv_s),
     Paragraph("Remove the blocker. Get them what they need.", tv_s),
     Paragraph("<b>BLOCKERS</b>", tv_bold_s)],
    [Paragraph("5", tv_bold_s),
     Paragraph("If all above are yes \u2014 it\u2019s a <b>will</b> issue.", tv_s),
     Paragraph("This is a performance conversation, not a training problem.", tv_s),
     Paragraph("<b>WILL</b>", tv_bold_s)],
]

check_tbl = Table(check_data, colWidths=[0.4*inch, 2.4*inch, 2.6*inch, 1.6*inch])
check_tbl.setStyle(TableStyle([
    ('TOPPADDING',    (0,0),(-1,-1), 6),
    ('BOTTOMPADDING', (0,0),(-1,-1), 6),
    ('LEFTPADDING',   (0,0),(-1,-1), 8),
    ('RIGHTPADDING',  (0,0),(-1,-1), 8),
    ('VALIGN',        (0,0),(-1,-1), 'TOP'),
    ('BACKGROUND',    (0,0),(-1,0), LIGHT_GRAY),
    ('ROWBACKGROUNDS',(0,1),(-1,-1), [WHITE, LIGHT_GRAY]),
    ('BOX',           (0,0),(-1,-1), 0.5, RULE_GRAY),
    ('LINEBELOW',     (0,0),(-1,-1), 0.5, RULE_GRAY),
    ('LINEBEFORE',    (1,0),(1,-1), 0.5, RULE_GRAY),
    ('LINEBEFORE',    (2,0),(2,-1), 0.5, RULE_GRAY),
    ('LINEBEFORE',    (3,0),(3,-1), 0.5, RULE_GRAY),
]))
story.append(check_tbl)

story.append(Spacer(1, 14))

# ═══════════════════════════════════════════════════════════
# STEP 5 — DAILY & WEEKLY CADENCE
# ═══════════════════════════════════════════════════════════
story += section_label("Step 5 \u2014 Daily & Weekly Cadence")

story.append(Paragraph(
    "Consistency beats intensity. These rhythms keep the system alive.",
    body_s))
story.append(Spacer(1, 8))

cadence_data = [
    [Paragraph("<b>Frequency</b>", th_s),
     Paragraph("<b>Activity</b>", th_s),
     Paragraph("<b>Time</b>", th_s),
     Paragraph("<b>Purpose</b>", th_s)],
    [Paragraph("<b>Daily</b>", tv_bold_s),
     Paragraph("Role play for phones and in-person scripts", tv_s),
     Paragraph("10\u201315 min", tv_s),
     Paragraph("Keeps skills sharp. Builds muscle memory.", tv_s)],
    [Paragraph("<b>Weekly</b>", tv_bold_s),
     Paragraph("Review 3 recorded or live calls. Score against the Process Card checklist. Coach.", tv_s),
     Paragraph("30 min", tv_s),
     Paragraph("Catches drift before it becomes habit.", tv_s)],
    [Paragraph("<b>Monthly</b>", tv_bold_s),
     Paragraph("Pick one broken process. Update the Process Card. Retrain the team.", tv_s),
     Paragraph("1 hour", tv_s),
     Paragraph("Continuous improvement. The system gets better every month.", tv_s)],
]

cadence_tbl = Table(cadence_data, colWidths=[1.0*inch, 2.8*inch, 0.9*inch, 2.3*inch])
cadence_tbl.setStyle(TableStyle([
    ('TOPPADDING',    (0,0),(-1,-1), 6),
    ('BOTTOMPADDING', (0,0),(-1,-1), 6),
    ('LEFTPADDING',   (0,0),(-1,-1), 8),
    ('RIGHTPADDING',  (0,0),(-1,-1), 8),
    ('VALIGN',        (0,0),(-1,-1), 'TOP'),
    ('BACKGROUND',    (0,0),(-1,0), LIGHT_GRAY),
    ('ROWBACKGROUNDS',(0,1),(-1,-1), [WHITE, LIGHT_GRAY]),
    ('BOX',           (0,0),(-1,-1), 0.5, RULE_GRAY),
    ('LINEBELOW',     (0,0),(-1,-1), 0.5, RULE_GRAY),
    ('LINEBEFORE',    (1,0),(1,-1), 0.5, RULE_GRAY),
    ('LINEBEFORE',    (2,0),(2,-1), 0.5, RULE_GRAY),
    ('LINEBEFORE',    (3,0),(3,-1), 0.5, RULE_GRAY),
]))
story.append(cadence_tbl)
story.append(Spacer(1, 14))


# ═══════════════════════════════════════════════════════════
# PROCESS CARD TEMPLATE (BLANK)
# ═══════════════════════════════════════════════════════════
story += section_label("Blank Process Card Template")

story.append(Paragraph(
    "Copy this structure for every new process. One page per task. Tape at the workstation.",
    note_s))
story.append(Spacer(1, 6))

blank_data = [
    [Paragraph("<b>PROCESS NAME:</b>", tv_bold_s),
     Paragraph("_________________________________________________", tv_s)],
    [Paragraph("<b>SEAT:</b>", tv_bold_s),
     Paragraph("_________________________________________________", tv_s)],
]
blank_hdr = Table(blank_data, colWidths=[1.4*inch, 5.6*inch])
blank_hdr.setStyle(TableStyle([
    ('TOPPADDING',    (0,0),(-1,-1), 4),
    ('BOTTOMPADDING', (0,0),(-1,-1), 4),
    ('LEFTPADDING',   (0,0),(-1,-1), 8),
    ('RIGHTPADDING',  (0,0),(-1,-1), 8),
    ('VALIGN',        (0,0),(-1,-1), 'TOP'),
    ('BOX',           (0,0),(-1,-1), 0.5, RULE_GRAY),
    ('LINEBELOW',     (0,0),(-1,0), 0.5, RULE_GRAY),
]))
story.append(blank_hdr)
story.append(Spacer(1, 4))

blank_sections = [
    ("1. WHAT", "One sentence: what is this task? Outcome and definition of done."),
    ("2. HOW", "Step-by-step checklist (8\u201312 bullets). Include exact scripts where words matter."),
    ("3. WHEN", "Triggers and timing. When does this process apply?"),
    ("4. TOOLS", "Systems, links, forms, materials needed."),
    ("5. QUALITY BAR", "How you know it was done right. Checklist for completion."),
]

for title, desc in blank_sections:
    story.append(KeepTogether([
        Paragraph(f"<b>{title}</b>", sub_s),
        Paragraph(desc, note_s),
        Spacer(1, 20),
        HRFlowable(width="100%", thickness=0.5, color=RULE_GRAY, spaceAfter=4),
    ]))


# ═══════════════════════════════════════════════════════════
# CERTIFICATION TRACKER
# ═══════════════════════════════════════════════════════════
story.append(PageBreak())
build_header(story)

story += section_label("Certification Tracker")

story.append(Paragraph(
    "Track which processes each team member is certified on. "
    "\u201cCertified\u201d means they hit the Quality Bar 3\u20135 times in a row during observed live reps.",
    body_s))
story.append(Spacer(1, 8))

cert_data = [
    [Paragraph("<b>Process</b>", th_s),
     Paragraph("<b>Team Member 1</b>", th_s),
     Paragraph("<b>Team Member 2</b>", th_s),
     Paragraph("<b>Team Member 3</b>", th_s),
     Paragraph("<b>Team Member 4</b>", th_s)],
]
# Add blank rows for processes
processes = [
    "Answer inbound call",
    "Greet walk-in",
    "Book consult",
    "Send assessment",
    "Collect payment",
    "Process lab order",
    "Schedule follow-up",
    "Handle price shopper",
    "Log service in CRM",
    "Close / end-of-day",
]
for p in processes:
    cert_data.append([
        Paragraph(p, tv_s),
        Paragraph("", tv_s),
        Paragraph("", tv_s),
        Paragraph("", tv_s),
        Paragraph("", tv_s),
    ])

cert_tbl = Table(cert_data, colWidths=[1.8*inch, 1.3*inch, 1.3*inch, 1.3*inch, 1.3*inch])
cert_tbl.setStyle(TableStyle([
    ('TOPPADDING',    (0,0),(-1,-1), 6),
    ('BOTTOMPADDING', (0,0),(-1,-1), 6),
    ('LEFTPADDING',   (0,0),(-1,-1), 8),
    ('RIGHTPADDING',  (0,0),(-1,-1), 8),
    ('VALIGN',        (0,0),(-1,-1), 'TOP'),
    ('BACKGROUND',    (0,0),(-1,0), LIGHT_GRAY),
    ('ROWBACKGROUNDS',(0,1),(-1,-1), [WHITE, LIGHT_GRAY]),
    ('BOX',           (0,0),(-1,-1), 0.5, RULE_GRAY),
    ('LINEBELOW',     (0,0),(-1,-1), 0.5, RULE_GRAY),
    ('LINEBEFORE',    (1,0),(1,-1), 0.5, RULE_GRAY),
    ('LINEBEFORE',    (2,0),(2,-1), 0.5, RULE_GRAY),
    ('LINEBEFORE',    (3,0),(3,-1), 0.5, RULE_GRAY),
    ('LINEBEFORE',    (4,0),(4,-1), 0.5, RULE_GRAY),
]))
story.append(cert_tbl)

story.append(Spacer(1, 10))
story.append(Paragraph(
    "Mark each cell with: date certified, \u201cIP\u201d (in progress), or blank (not started). "
    "Review monthly. No one works unsupervised on a process they\u2019re not certified on.",
    note_s))

story.append(Spacer(1, 14))


# ═══════════════════════════════════════════════════════════
# QUICK REFERENCE — THE SYSTEM ON ONE PAGE
# ═══════════════════════════════════════════════════════════
story += section_label("Quick Reference \u2014 The Entire System")

summary_data = [
    [Paragraph("<b>Step</b>", th_s),
     Paragraph("<b>Action</b>", th_s),
     Paragraph("<b>Output</b>", th_s)],
    [Paragraph("1. Seats", tv_bold_s),
     Paragraph("Define who owns what outcomes and metrics", tv_s),
     Paragraph("Seat definitions with 3\u20135 outcomes + metrics each", tv_s)],
    [Paragraph("2. Process Cards", tv_bold_s),
     Paragraph("Write What / How / When / Tools / Quality Bar for every repeated task", tv_s),
     Paragraph("One-page cards taped at each workstation", tv_s)],
    [Paragraph("3. Training Flow", tv_bold_s),
     Paragraph("Explain \u2192 Demonstrate \u2192 Simulate \u2192 Observed Live \u2192 Certify", tv_s),
     Paragraph("Certified team members who can perform on demand", tv_s)],
    [Paragraph("4. Performance Check", tv_bold_s),
     Paragraph("What \u2192 How \u2192 When \u2192 Blockers \u2192 Will", tv_s),
     Paragraph("Root cause found and fixed (not just \u201cthey don\u2019t care\u201d)", tv_s)],
    [Paragraph("5. Cadence", tv_bold_s),
     Paragraph("Daily role play + Weekly call review + Monthly process update", tv_s),
     Paragraph("System that improves every month without you", tv_s)],
]

summary_tbl = Table(summary_data, colWidths=[1.2*inch, 3.2*inch, 2.6*inch])
summary_tbl.setStyle(TableStyle([
    ('TOPPADDING',    (0,0),(-1,-1), 6),
    ('BOTTOMPADDING', (0,0),(-1,-1), 6),
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
story.append(summary_tbl)

story.append(Spacer(1, 12))
story.append(Paragraph(
    "You do not need a fancy LMS. You need one-page Process Cards, repetition, and a simple standard.",
    body_s))
story.append(Spacer(1, 6))

# Footer
story.append(Spacer(1, 8))
build_footer(story)
doc.build(story)
print(f"PDF generated: {OUTPUT_PATH}")
