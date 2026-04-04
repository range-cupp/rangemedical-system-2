#!/usr/bin/env python3
"""
Range Assessment SOP — Standard Operating Procedure
Generates a comprehensive PDF covering the full Range Assessment process.
Range Medical — April 2026
"""

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
BLUE       = HexColor('#1a56db')
RED        = HexColor('#dc2626')
AMBER      = HexColor('#d97706')
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
callout_s   = st('Call',   fontName='Helvetica-Bold',    fontSize=9,   textColor=HexColor('#1a56db'), leading=14, spaceBefore=6, spaceAfter=6)
warn_s      = st('Warn',   fontName='Helvetica-Bold',    fontSize=9,   textColor=RED, leading=14, spaceBefore=4, spaceAfter=4)
step_num_s  = st('StepN',  fontName='Helvetica-Bold',    fontSize=11,  textColor=MID_GRAY,  leading=14)
step_title_s= st('StepT',  fontName='Helvetica-Bold',    fontSize=10,  textColor=BLACK,     leading=14, spaceBefore=2, spaceAfter=2)

def section_label(text):
    return [
        Paragraph(text.upper(), sec_s),
        HRFlowable(width="100%", thickness=0.75, color=RULE_GRAY, spaceAfter=8),
    ]

def info_table(rows, col1=2.0*inch):
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

def check_bullet(text):
    return Paragraph(f"\u2713  {text}", st('ChkBul', fontName='Helvetica', fontSize=9.5, textColor=DARK_GRAY, leading=16, leftIndent=14, firstLineIndent=-10, spaceAfter=2))

def numbered_step(num, title, body_text):
    """Create a numbered step block."""
    elements = []
    step_row = Table(
        [[Paragraph(f"{num}", step_num_s), Paragraph(title, step_title_s)]],
        colWidths=[0.35*inch, W - 0.35*inch]
    )
    step_row.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]))
    elements.append(step_row)
    if body_text:
        elements.append(Paragraph(body_text, st('StepBody', fontName='Helvetica', fontSize=9.5, textColor=DARK_GRAY, leading=16, leftIndent=35, spaceAfter=8)))
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
    story.append(Spacer(1, 16))
    story.append(HRFlowable(width="100%", thickness=0.5, color=RULE_GRAY, spaceAfter=8))
    tbl = Table([[
        Paragraph("<b>Questions about this SOP?</b><br/>Contact Chris Cupp or Damon Durante<br/>(949) 997-3988", foot_bold_s),
        Paragraph(
            "This document is an internal Standard Operating Procedure for Range Medical staff. "
            "It is not intended for patient distribution. Updated April 2026.",
            foot_s),
    ]], colWidths=[2.2*inch, 4.8*inch])
    tbl.setStyle(TableStyle([
        ('VALIGN',(0,0),(-1,-1),'TOP'),
        ('TOPPADDING',(0,0),(-1,-1),0),('BOTTOMPADDING',(0,0),(-1,-1),0),
        ('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),0),
    ]))
    story.append(tbl)

# ── BUILD THE DOCUMENT ───────────────────────────────────────────────────────

OUTPUT_PATH = os.path.join(os.path.dirname(__file__), '..', 'public', 'docs', 'range-assessment-sop.pdf')

doc = SimpleDocTemplate(
    OUTPUT_PATH,
    pagesize=letter,
    rightMargin=0.75*inch, leftMargin=0.75*inch,
    topMargin=0.65*inch,   bottomMargin=0.65*inch,
)
story = []

# ── COVER / TITLE ────────────────────────────────────────────────────────────

build_header(story)

story.append(Paragraph("RANGE ASSESSMENT", title_s))
story.append(Paragraph("Standard Operating Procedure \u2014 Internal Staff Document", subtitle_s))
story.append(Spacer(1, 6))
story.append(Paragraph("Version 1.0 \u2014 April 2026", subtitle_s))
story.append(Spacer(1, 14))

# Quick reference
story += section_label("Quick Reference")
story.append(info_table([
    ("Assessment Price",     "$197 \u2014 credited toward any treatment started within 7 days"),
    ("Duration",             "30 minutes (Injury or Energy) / 45 minutes (Both)"),
    ("Booking",              "Cal.com round-robin: Chris, Damon, Dr. Burgess"),
    ("Payment",              "Stripe \u2014 collected online before booking"),
    ("Forms Sent",           "Medical Intake + HIPAA Privacy Notice (via SMS)"),
    ("Website CTA",          "\"Book Your $197 Range Assessment\" \u2192 /range-assessment"),
]))
story.append(Spacer(1, 8))
story.append(Paragraph("<b>Core Rule:</b> Every new patient starts here. One price. One front door. No exceptions.", callout_s))

# ── SECTION 1: OVERVIEW ─────────────────────────────────────────────────────

story.append(Spacer(1, 8))
story += section_label("1. What Is the Range Assessment?")

story.append(Paragraph(
    "The Range Assessment is a $197 in-clinic visit where a team member reviews the patient\u2019s history, "
    "symptoms, and goals \u2014 then outlines a clear path forward. It replaces all previous entry points "
    "(the $250 assessment, the online lab panel checkout, and the separate injury/energy funnels).",
    body_s))
story.append(Spacer(1, 8))

story.append(Paragraph("Three appointment types:", sub_s))
story.append(Spacer(1, 4))

appt_data = [
    [Paragraph("<b>Type</b>", th_s), Paragraph("<b>Duration</b>", th_s), Paragraph("<b>Cal.com Slug</b>", th_s), Paragraph("<b>Cal.com Event ID</b>", th_s)],
    [Paragraph("Injury & Recovery", tv_s), Paragraph("30 min", tv_s), Paragraph("range-assessment-injury", tv_s), Paragraph("5256364", tv_s)],
    [Paragraph("Energy & Optimization", tv_s), Paragraph("30 min", tv_s), Paragraph("range-assessment-energy", tv_s), Paragraph("5256365", tv_s)],
    [Paragraph("Both", tv_s), Paragraph("45 min", tv_s), Paragraph("range-assessment-both", tv_s), Paragraph("5256369", tv_s)],
]
appt_tbl = Table(appt_data, colWidths=[2.0*inch, 1.0*inch, 2.2*inch, 1.8*inch])
appt_tbl.setStyle(TableStyle([
    ('TOPPADDING',    (0,0),(-1,-1), 5),
    ('BOTTOMPADDING', (0,0),(-1,-1), 5),
    ('LEFTPADDING',   (0,0),(-1,-1), 8),
    ('RIGHTPADDING',  (0,0),(-1,-1), 8),
    ('VALIGN',        (0,0),(-1,-1), 'MIDDLE'),
    ('BACKGROUND',    (0,0),(-1,0), LIGHT_GRAY),
    ('ROWBACKGROUNDS',(0,1),(-1,-1), [WHITE, LIGHT_GRAY]),
    ('BOX',           (0,0),(-1,-1), 0.5, RULE_GRAY),
    ('LINEBELOW',     (0,0),(-1,-1), 0.5, RULE_GRAY),
]))
story.append(appt_tbl)

story.append(Spacer(1, 8))
story.append(Paragraph("The $197 is <b>fully credited</b> toward any treatment program started within 7 days of the assessment. If the patient does not move forward, the $197 is non-refundable.", body_s))

# ── SECTION 2: ONLINE FLOW ──────────────────────────────────────────────────

story.append(Spacer(1, 12))
story += section_label("2. Online Patient Flow (What Happens Before They Walk In)")

story.append(Paragraph("This is what the patient experiences on the website. Staff does not need to do anything during this phase \u2014 it\u2019s fully automated.", note_s))
story.append(Spacer(1, 6))

for el in numbered_step("1", "Patient visits range-medical.com",
    "Every page on the site has one CTA: <b>\"Book Your $197 Range Assessment.\"</b> They click it and land on /range-assessment."):
    story.append(el)

for el in numbered_step("2", "Patient selects their path",
    "They choose: Injury & Recovery, Energy & Optimization, or Both. This determines which Cal.com event type they book and which intake forms fire."):
    story.append(el)

for el in numbered_step("3", "Patient pays $197 via Stripe",
    "Stripe collects payment. Apple Pay and Google Pay are supported. The system creates or finds the patient record in Supabase."):
    story.append(el)

for el in numbered_step("4", "Patient books on Cal.com",
    "Available time slots are shown based on the selected assessment type. Cal.com assigns the next available team member via round-robin (Chris, Damon, or Dr. Burgess)."):
    story.append(el)

for el in numbered_step("5", "Automated messages fire",
    "The system sends the patient an SMS with their medical intake form link. Confirmation email and SMS go out. Prep instructions are texted based on the path selected."):
    story.append(el)

story.append(Spacer(1, 6))
story.append(Paragraph("<b>Automated SMS/Email Summary (patient receives):</b>", sub_s))
story.append(Spacer(1, 4))

auto_data = [
    [Paragraph("<b>Message</b>", th_s), Paragraph("<b>Channel</b>", th_s), Paragraph("<b>Trigger</b>", th_s)],
    [Paragraph("Medical intake form link", tv_s), Paragraph("SMS", tv_s), Paragraph("Immediately after booking", tv_s)],
    [Paragraph("Booking confirmation", tv_s), Paragraph("SMS + Email", tv_s), Paragraph("Cal.com webhook fires", tv_s)],
    [Paragraph("Prep instructions", tv_s), Paragraph("SMS", tv_s), Paragraph("Booking automation T-02", tv_s)],
    [Paragraph("HIPAA consent form", tv_s), Paragraph("SMS", tv_s), Paragraph("Booking automation T-03", tv_s)],
]
auto_tbl = Table(auto_data, colWidths=[2.8*inch, 1.2*inch, 3.0*inch])
auto_tbl.setStyle(TableStyle([
    ('TOPPADDING',    (0,0),(-1,-1), 4),
    ('BOTTOMPADDING', (0,0),(-1,-1), 4),
    ('LEFTPADDING',   (0,0),(-1,-1), 8),
    ('RIGHTPADDING',  (0,0),(-1,-1), 8),
    ('VALIGN',        (0,0),(-1,-1), 'MIDDLE'),
    ('BACKGROUND',    (0,0),(-1,0), LIGHT_GRAY),
    ('ROWBACKGROUNDS',(0,1),(-1,-1), [WHITE, LIGHT_GRAY]),
    ('BOX',           (0,0),(-1,-1), 0.5, RULE_GRAY),
    ('LINEBELOW',     (0,0),(-1,-1), 0.5, RULE_GRAY),
]))
story.append(auto_tbl)

story.append(Spacer(1, 6))
story.append(Paragraph("<b>Automated Staff Notifications:</b>", sub_s))
story.append(Spacer(1, 4))
story.append(bullet("Staff email notification with booking details sent to assigned team member"))
story.append(bullet("Provider SMS notification with appointment summary"))
story.append(bullet("Tara receives SMS alert if visit reason is not set \u2014 she should update in the system before the appointment"))

# ── SECTION 3: PRE-VISIT PREP ───────────────────────────────────────────────

story.append(PageBreak())
build_header(story)

story += section_label("3. Pre-Visit Prep (Staff Responsibilities)")

story.append(Paragraph("Before the patient arrives, the assigned team member should:", body_s))
story.append(Spacer(1, 6))

story.append(check_bullet("<b>Check forms status</b> \u2014 Verify intake and HIPAA are completed in the system. If not, follow up via text or have them complete on an iPad at check-in."))
story.append(check_bullet("<b>Review intake form</b> \u2014 Read through their medical history, current medications, allergies, and chief complaint before they walk in."))
story.append(check_bullet("<b>Check path</b> \u2014 Confirm which assessment type they booked (Injury, Energy, or Both) so you know what to focus on."))
story.append(check_bullet("<b>Prepare any imaging</b> \u2014 For injury patients: check if they uploaded MRIs, X-rays, or surgical reports during booking. Have those ready to review."))
story.append(check_bullet("<b>Check for existing records</b> \u2014 If this is a returning patient or someone who\u2019s had labs elsewhere, pull those records."))

story.append(Spacer(1, 8))

prep_data = [
    [Paragraph("<b>Path</b>", th_s), Paragraph("<b>Prep Instructions Sent to Patient</b>", th_s)],
    [Paragraph("Injury & Recovery", tv_bold_s), Paragraph("Bring any imaging (MRI, X-ray) or medical records related to your injury. If you have recent lab results, bring those too. Arrive 5 minutes early.", tv_s)],
    [Paragraph("Energy & Optimization", tv_bold_s), Paragraph("Bring a list of your current medications and supplements, and any recent lab results if you have them. Arrive 5 minutes early.", tv_s)],
    [Paragraph("Both", tv_bold_s), Paragraph("Bring any imaging or medical records, a list of your current medications and supplements, and any recent lab results. Arrive 5 minutes early.", tv_s)],
]
prep_tbl = Table(prep_data, colWidths=[1.6*inch, 5.4*inch])
prep_tbl.setStyle(TableStyle([
    ('TOPPADDING',    (0,0),(-1,-1), 6),
    ('BOTTOMPADDING', (0,0),(-1,-1), 6),
    ('LEFTPADDING',   (0,0),(-1,-1), 8),
    ('RIGHTPADDING',  (0,0),(-1,-1), 8),
    ('VALIGN',        (0,0),(-1,-1), 'TOP'),
    ('BACKGROUND',    (0,0),(-1,0), LIGHT_GRAY),
    ('ROWBACKGROUNDS',(0,1),(-1,-1), [WHITE, LIGHT_GRAY]),
    ('BOX',           (0,0),(-1,-1), 0.5, RULE_GRAY),
    ('LINEBELOW',     (0,0),(-1,-1), 0.5, RULE_GRAY),
]))
story.append(prep_tbl)

# ── SECTION 4: IN-CLINIC ASSESSMENT ─────────────────────────────────────────

story.append(Spacer(1, 12))
story += section_label("4. In-Clinic Assessment (The Visit)")

story.append(Paragraph(
    "This is the core of the Range Assessment. The goal is simple: <b>the patient leaves with clarity and a next step.</b> "
    "They should know what\u2019s going on, what we recommend, and what happens next.",
    body_s))
story.append(Spacer(1, 10))

story.append(Paragraph("4A. CHECK-IN (2\u20133 minutes)", comp_s))
story.append(bullet("Greet the patient by name"))
story.append(bullet("Confirm intake and HIPAA are complete \u2014 if not, hand them an iPad"))
story.append(bullet("Offer water, get them comfortable"))
story.append(bullet("Briefly confirm what brings them in: \"I see you booked for [injury / energy / both] \u2014 is that still accurate?\""))

story.append(Spacer(1, 8))
story.append(Paragraph("4B. INJURY & RECOVERY PATH (15\u201320 minutes)", comp_s))
story.append(Paragraph("If the patient selected Injury & Recovery:", note_s))
story.append(Spacer(1, 4))

for el in numbered_step("1", "Understand the injury",
    "What happened? When? What have you tried so far? Are you working with a PT, chiro, or surgeon? Where are you in rehab?"):
    story.append(el)
for el in numbered_step("2", "Review imaging / records",
    "Look at any MRIs, X-rays, or surgical reports they brought. Note findings."):
    story.append(el)
for el in numbered_step("3", "Discuss recovery tools",
    "Based on their situation, explain which modalities may help: HBOT, red light, peptides (BPC-157, TB-500), PRP, exosomes, IV therapy. Don\u2019t overwhelm \u2014 recommend 1\u20132 primary tools."):
    story.append(el)
for el in numbered_step("4", "Present the plan",
    "Outline a clear recommendation: \"Based on what I\u2019m seeing, I\u2019d recommend a 10-day Recovery Jumpstart with HBOT + peptides. Here\u2019s what that looks like.\" Give them a program and a price."):
    story.append(el)
for el in numbered_step("5", "Book or schedule next step",
    "If they\u2019re ready: book their first session right there. If they need to think: \"No pressure \u2014 the $197 you paid today applies as a credit toward this program if you start within 7 days.\""):
    story.append(el)

story.append(Spacer(1, 8))
story.append(Paragraph("4C. ENERGY & OPTIMIZATION PATH (15\u201320 minutes)", comp_s))
story.append(Paragraph("If the patient selected Energy & Optimization:", note_s))
story.append(Spacer(1, 4))

for el in numbered_step("1", "Understand the symptoms",
    "What\u2019s your main complaint? Fatigue? Brain fog? Weight gain? Low libido? Mood changes? How long has this been going on? What have you tried?"):
    story.append(el)
for el in numbered_step("2", "Review history and medications",
    "Go through their intake form. Current meds, supplements, prior labs, prior hormone treatment, family history of relevant conditions."):
    story.append(el)
for el in numbered_step("3", "Recommend the right lab panel",
    "Based on their symptoms and goals, recommend Essential ($350) or Elite ($750). Explain what each panel tests and why you\u2019re recommending one over the other. <b>This is where labs are ordered \u2014 not on the website.</b>"):
    story.append(el)
for el in numbered_step("4", "Book fasting labs",
    "Schedule their blood draw right there \u2014 ideally within the next few days. Explain fasting requirements. Prep instructions will be sent automatically."):
    story.append(el)
for el in numbered_step("5", "Set expectations for next steps",
    "\"Results take 3\u20135 business days. Once we have them, we\u2019ll schedule a lab review with Dr. Burgess. He\u2019ll explain every number and recommend a plan \u2014 whether that\u2019s HRT, weight loss medication, peptides, or something else.\""):
    story.append(el)

story.append(Spacer(1, 8))
story.append(Paragraph("4D. BOTH PATHS (30\u201335 minutes)", comp_s))
story.append(Paragraph("If the patient selected Both: run through both sections above. Start with whichever is their primary concern, then transition: \"You also mentioned [energy/injury] \u2014 let\u2019s talk about that.\"", body_s))

# ── SECTION 5: POST-ASSESSMENT ───────────────────────────────────────────────

story.append(PageBreak())
build_header(story)

story += section_label("5. Post-Assessment (Closing the Visit)")

story.append(Paragraph("Every patient should leave with one of these outcomes:", body_s))
story.append(Spacer(1, 6))

outcome_data = [
    [Paragraph("<b>Outcome</b>", th_s), Paragraph("<b>What Happens</b>", th_s), Paragraph("<b>Credit Applies?</b>", th_s)],
    [Paragraph("Starts treatment today", tv_bold_s), Paragraph("Book first session or enroll in membership. Collect payment minus $197 credit.", tv_s), Paragraph("\u2713 Yes", check_s)],
    [Paragraph("Books labs (energy path)", tv_bold_s), Paragraph("Schedule blood draw. Patient comes back for lab review + program enrollment after results.", tv_s), Paragraph("\u2713 Yes (within 7 days of starting program)", check_s)],
    [Paragraph("Needs to think about it", tv_bold_s), Paragraph("No pressure. Remind them: \"Your $197 applies as credit if you start within 7 days.\" Follow up in 2\u20133 days.", tv_s), Paragraph("\u2713 If within 7 days", check_s)],
    [Paragraph("Not a fit", tv_bold_s), Paragraph("Thank them for coming in. No credit applies. $197 is non-refundable.", tv_s), Paragraph("\u2717 No", rest_s)],
]
outcome_tbl = Table(outcome_data, colWidths=[1.8*inch, 3.4*inch, 1.8*inch])
outcome_tbl.setStyle(TableStyle([
    ('TOPPADDING',    (0,0),(-1,-1), 6),
    ('BOTTOMPADDING', (0,0),(-1,-1), 6),
    ('LEFTPADDING',   (0,0),(-1,-1), 8),
    ('RIGHTPADDING',  (0,0),(-1,-1), 8),
    ('VALIGN',        (0,0),(-1,-1), 'TOP'),
    ('BACKGROUND',    (0,0),(-1,0), LIGHT_GRAY),
    ('ROWBACKGROUNDS',(0,1),(-1,-1), [WHITE, LIGHT_GRAY]),
    ('BOX',           (0,0),(-1,-1), 0.5, RULE_GRAY),
    ('LINEBELOW',     (0,0),(-1,-1), 0.5, RULE_GRAY),
]))
story.append(outcome_tbl)

story.append(Spacer(1, 10))
story.append(Paragraph("<b>The $197 Credit \u2014 Rules:</b>", sub_s))
story.append(Spacer(1, 4))
story.append(bullet("Applies toward any qualifying treatment program, membership, or package"))
story.append(bullet("Must start within <b>7 calendar days</b> of the assessment date"))
story.append(bullet("Applied as a line-item credit on their first purchase"))
story.append(bullet("Non-transferable \u2014 cannot be applied to another patient"))
story.append(bullet("Non-refundable if patient does not move forward"))
story.append(bullet("Does <b>not</b> apply to standalone single sessions (e.g., one-off IV, single HBOT)"))

# ── SECTION 6: PROGRAMS & PRICING ────────────────────────────────────────────

story.append(Spacer(1, 12))
story += section_label("6. Common Programs to Recommend")

story.append(Paragraph("These are the most common treatment paths after a Range Assessment. Always present a clear recommendation, not a menu.", note_s))
story.append(Spacer(1, 6))

story.append(Paragraph("<b>Injury & Recovery Patients:</b>", sub_s))
story.append(Spacer(1, 4))
story.append(bullet("<b>10-Day Recovery Jumpstart</b> \u2014 HBOT + RLT daily for 10 sessions. Best for acute injuries or post-surgical recovery."))
story.append(bullet("<b>30-Day Recovery Program</b> \u2014 HBOT + RLT + peptide protocol. For more complex or chronic injuries."))
story.append(bullet("<b>PRP Injection</b> \u2014 Single PRP treatment ($750). For joint/tendon-specific issues."))
story.append(bullet("<b>Peptide Protocol</b> \u2014 BPC-157 + TB-500 ($150\u2013$400/month). For tissue repair and inflammation."))

story.append(Spacer(1, 8))
story.append(Paragraph("<b>Energy & Optimization Patients:</b>", sub_s))
story.append(Spacer(1, 4))
story.append(bullet("<b>HRT Membership</b> \u2014 $250/month. All hormone medications, monthly IV, follow-up labs, provider access. Month-to-month, no contract."))
story.append(bullet("<b>Medical Weight Loss</b> \u2014 Tirzepatide, Semaglutide, or Retatrutide with labs and ongoing monitoring."))
story.append(bullet("<b>Peptide Therapy</b> \u2014 Growth hormone peptides, recovery peptides, sleep peptides ($150\u2013$400/month)."))
story.append(bullet("<b>Cellular Energy Reset</b> \u2014 6-week comprehensive HBOT program ($3,999)."))

# ── SECTION 7: FOLLOW-UP ────────────────────────────────────────────────────

story.append(Spacer(1, 12))
story += section_label("7. Follow-Up Protocol")

story.append(Paragraph("If the patient did not start treatment at the assessment:", body_s))
story.append(Spacer(1, 6))

followup_data = [
    [Paragraph("<b>When</b>", th_s), Paragraph("<b>Who</b>", th_s), Paragraph("<b>What</b>", th_s)],
    [Paragraph("Day 1\u20132", tv_s), Paragraph("Assigned team member", tv_s), Paragraph("Text or call: \"Hey [name], just following up from your assessment. Did you have any questions about [recommendation]? Happy to help.\"", tv_s)],
    [Paragraph("Day 5\u20136", tv_s), Paragraph("Assigned team member", tv_s), Paragraph("Final nudge: \"Hi [name], just a reminder that your $197 assessment credit applies if you start by [date]. Let me know if you want to get on the schedule.\"", tv_s)],
    [Paragraph("Day 8+", tv_s), Paragraph("No action", tv_s), Paragraph("Credit expires. Patient can still start treatment at full price.", tv_s)],
]
followup_tbl = Table(followup_data, colWidths=[1.0*inch, 1.8*inch, 4.2*inch])
followup_tbl.setStyle(TableStyle([
    ('TOPPADDING',    (0,0),(-1,-1), 6),
    ('BOTTOMPADDING', (0,0),(-1,-1), 6),
    ('LEFTPADDING',   (0,0),(-1,-1), 8),
    ('RIGHTPADDING',  (0,0),(-1,-1), 8),
    ('VALIGN',        (0,0),(-1,-1), 'TOP'),
    ('BACKGROUND',    (0,0),(-1,0), LIGHT_GRAY),
    ('ROWBACKGROUNDS',(0,1),(-1,-1), [WHITE, LIGHT_GRAY]),
    ('BOX',           (0,0),(-1,-1), 0.5, RULE_GRAY),
    ('LINEBELOW',     (0,0),(-1,-1), 0.5, RULE_GRAY),
]))
story.append(followup_tbl)

# ── SECTION 8: STAFF ROLES ──────────────────────────────────────────────────

story.append(Spacer(1, 12))
story += section_label("8. Staff Roles & Responsibilities")

roles_data = [
    [Paragraph("<b>Role</b>", th_s), Paragraph("<b>Who</b>", th_s), Paragraph("<b>Responsibilities</b>", th_s)],
    [Paragraph("Assessment Team", tv_bold_s), Paragraph("Chris, Damon, Dr. Burgess", tv_s), Paragraph("Conduct the in-clinic assessment. Present recommendation. Close or schedule next step.", tv_s)],
    [Paragraph("Front Desk / Ops", tv_bold_s), Paragraph("Tara, Damon", tv_s), Paragraph("Confirm forms before visit. Update visit reason in system. Handle scheduling and payment.", tv_s)],
    [Paragraph("Provider", tv_bold_s), Paragraph("Dr. Burgess", tv_s), Paragraph("Lab reviews after bloodwork comes back. Prescribe protocols. Follow-up consultations.", tv_s)],
    [Paragraph("Nurse", tv_bold_s), Paragraph("Lily", tv_s), Paragraph("Blood draws, injections, IV therapy. Not conducting assessments.", tv_s)],
    [Paragraph("Staff", tv_bold_s), Paragraph("Evan", tv_s), Paragraph("Blood draws, injections. Support scheduling. Not conducting assessments.", tv_s)],
]
roles_tbl = Table(roles_data, colWidths=[1.4*inch, 1.6*inch, 4.0*inch])
roles_tbl.setStyle(TableStyle([
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
story.append(roles_tbl)

# ── SECTION 9: SYSTEM REFERENCE ──────────────────────────────────────────────

story.append(PageBreak())
build_header(story)

story += section_label("9. System Reference (Technical)")

story.append(Paragraph("For staff who interact with the admin system or need to troubleshoot:", note_s))
story.append(Spacer(1, 6))

story.append(Paragraph("<b>Where Data Lives:</b>", sub_s))
story.append(Spacer(1, 4))
story.append(bullet("<b>assessment_leads</b> \u2014 payment status, Stripe ID, booking UID, intake SMS status"))
story.append(bullet("<b>calcom_bookings</b> \u2014 full booking metadata synced from Cal.com"))
story.append(bullet("<b>appointments</b> \u2014 native appointment record (parallel to Cal.com)"))
story.append(bullet("<b>patients</b> \u2014 patient master record with tags, contact info"))
story.append(bullet("<b>form_bundles</b> \u2014 intake/consent form delivery tracking"))
story.append(bullet("<b>comms_log</b> \u2014 all SMS and email history"))
story.append(bullet("<b>pos_services</b> \u2014 service catalog (Range Assessment = $197 / 19700 cents)"))

story.append(Spacer(1, 8))
story.append(Paragraph("<b>Key Endpoints:</b>", sub_s))
story.append(Spacer(1, 4))

endpoint_data = [
    [Paragraph("<b>Endpoint</b>", th_s), Paragraph("<b>What It Does</b>", th_s)],
    [Paragraph("/api/assessment/payment-intent", tv_s), Paragraph("Creates Stripe PaymentIntent for $197", tv_s)],
    [Paragraph("/api/assessment/confirm-payment", tv_s), Paragraph("Verifies payment succeeded, marks lead as paid", tv_s)],
    [Paragraph("/api/assessment/book", tv_s), Paragraph("Creates Cal.com booking + sends intake form SMS", tv_s)],
    [Paragraph("/api/webhooks/calcom", tv_s), Paragraph("Receives booking events, syncs to DB, fires automations", tv_s)],
    [Paragraph("/api/appointments/create", tv_s), Paragraph("Staff-side booking (admin calendar)", tv_s)],
    [Paragraph("/api/start/submit", tv_s), Paragraph("Lead capture (sends auto-text with assessment link)", tv_s)],
    [Paragraph("/api/cron/start-funnel-nudge", tv_s), Paragraph("24h and 72h follow-up nudge texts to leads", tv_s)],
]
endpoint_tbl = Table(endpoint_data, colWidths=[2.8*inch, 4.2*inch])
endpoint_tbl.setStyle(TableStyle([
    ('TOPPADDING',    (0,0),(-1,-1), 4),
    ('BOTTOMPADDING', (0,0),(-1,-1), 4),
    ('LEFTPADDING',   (0,0),(-1,-1), 8),
    ('RIGHTPADDING',  (0,0),(-1,-1), 8),
    ('VALIGN',        (0,0),(-1,-1), 'TOP'),
    ('BACKGROUND',    (0,0),(-1,0), LIGHT_GRAY),
    ('ROWBACKGROUNDS',(0,1),(-1,-1), [WHITE, LIGHT_GRAY]),
    ('BOX',           (0,0),(-1,-1), 0.5, RULE_GRAY),
    ('LINEBELOW',     (0,0),(-1,-1), 0.5, RULE_GRAY),
]))
story.append(endpoint_tbl)

story.append(Spacer(1, 8))
story.append(Paragraph("<b>Redirects (301 Permanent):</b>", sub_s))
story.append(Spacer(1, 4))
story.append(bullet("/start \u2192 /range-assessment"))
story.append(bullet("/start/energy \u2192 /range-assessment?path=energy"))
story.append(bullet("/start/injury \u2192 /range-assessment?path=injury"))
story.append(bullet("/start/energy-checkout \u2192 /range-assessment?path=energy"))
story.append(Spacer(1, 4))
story.append(Paragraph("Any old links in emails, texts, or ads will automatically redirect to the new assessment page.", note_s))

# ── SECTION 10: SCRIPTS & LANGUAGE ───────────────────────────────────────────

story.append(Spacer(1, 12))
story += section_label("10. Recommended Language & Scripts")

story.append(Paragraph("<b>When answering the phone / replying to inquiries:</b>", sub_s))
story.append(Spacer(1, 4))
story.append(Paragraph(
    "\"The best way to get started is with a Range Assessment. It\u2019s a $197 visit where we sit down, "
    "review your situation, and build a plan. If you move forward with treatment, we apply the full "
    "$197 toward it. Want me to get you on the schedule?\"",
    st('Script', fontName='Helvetica-Oblique', fontSize=9.5, textColor=DARK_GRAY, leading=16, leftIndent=20, rightIndent=20, spaceAfter=8)))

story.append(Spacer(1, 4))
story.append(Paragraph("<b>When presenting the recommendation at the assessment:</b>", sub_s))
story.append(Spacer(1, 4))
story.append(Paragraph(
    "\"Based on what you\u2019ve told me and what I\u2019m seeing, here\u2019s what I\u2019d recommend: [specific program]. "
    "The $197 you paid for today\u2019s assessment applies as a credit toward this if you start within the next week. "
    "No pressure \u2014 but I want you to know that\u2019s available.\"",
    st('Script2', fontName='Helvetica-Oblique', fontSize=9.5, textColor=DARK_GRAY, leading=16, leftIndent=20, rightIndent=20, spaceAfter=8)))

story.append(Spacer(1, 4))
story.append(Paragraph("<b>When following up after the assessment:</b>", sub_s))
story.append(Spacer(1, 4))
story.append(Paragraph(
    "\"Hey [name], it\u2019s [your name] from Range Medical. Just following up from your assessment. "
    "Did you have any questions about [the recommendation]? Happy to help if anything came up.\"",
    st('Script3', fontName='Helvetica-Oblique', fontSize=9.5, textColor=DARK_GRAY, leading=16, leftIndent=20, rightIndent=20, spaceAfter=8)))

story.append(Spacer(1, 8))
story.append(Paragraph("<b>What NOT to say:</b>", warn_s))
story.append(bullet("\"Our assessment is free\" \u2014 it\u2019s $197, credited toward treatment"))
story.append(bullet("\"You need to choose a lab panel first\" \u2014 labs are discussed at the assessment, not chosen online"))
story.append(bullet("\"Pick a door\" / \"Two doors\" \u2014 old language. It\u2019s one assessment with two paths"))
story.append(bullet("\"The assessment is $250\" \u2014 it\u2019s $197 now"))
story.append(bullet("Any discount or strikethrough pricing \u2014 patient sees one number: $197"))

# ── FOOTER ───────────────────────────────────────────────────────────────────

build_footer(story)

# ── GENERATE ─────────────────────────────────────────────────────────────────

doc.build(story)
print(f"SOP generated: {os.path.abspath(OUTPUT_PATH)}")
