#!/usr/bin/env python3
"""Generate Weight Loss Protocol Management Staff Guide PDF"""

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
BLUE       = HexColor('#1e40af')
LIGHT_BLUE = HexColor('#eff6ff')
RED        = HexColor('#dc2626')
AMBER      = HexColor('#92400e')
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

# Additional styles for this doc
step_num_s  = st('StepN',  fontName='Helvetica-Bold',    fontSize=11,  textColor=BLUE,      leading=14)
step_s      = st('Step',   fontName='Helvetica-Bold',    fontSize=10,  textColor=BLACK,     leading=14, spaceBefore=6, spaceAfter=2)
callout_s   = st('Call',   fontName='Helvetica-Bold',    fontSize=9.5, textColor=BLUE,      leading=14)
warn_s      = st('Warn',   fontName='Helvetica-Bold',    fontSize=9.5, textColor=RED,       leading=14)

def section_label(text):
    return [
        Paragraph(text.upper(), sec_s),
        HRFlowable(width="100%", thickness=0.75, color=RULE_GRAY, spaceAfter=8),
    ]

def info_table(rows, col1=2.2*inch):
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
    story.append(Spacer(1, 16))
    story.append(HRFlowable(width="100%", thickness=0.5, color=RULE_GRAY, spaceAfter=8))
    tbl = Table([[
        Paragraph("<b>Questions or concerns?</b><br/>Call or text: (949) 997-3988<br/>range-medical.com", foot_bold_s),
        Paragraph(
            "This document is for Range Medical staff only. Processes described here reflect the "
            "current CRM system configuration as of March 2026.",
            foot_s),
    ]], colWidths=[2.2*inch, 4.8*inch])
    tbl.setStyle(TableStyle([
        ('VALIGN',(0,0),(-1,-1),'TOP'),
        ('TOPPADDING',(0,0),(-1,-1),0),('BOTTOMPADDING',(0,0),(-1,-1),0),
        ('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),0),
    ]))
    story.append(tbl)

def numbered_step(num, title, description):
    """Return a numbered step with title and description"""
    return [
        Paragraph(f"<b>Step {num}:</b>  {title}", step_s),
        Paragraph(description, body_s),
        Spacer(1, 4),
    ]

# ── BUILD THE PDF ────────────────────────────────────────────────────────────

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'public', 'docs')
OUTPUT_PATH = os.path.join(OUTPUT_DIR, 'weight-loss-protocol-staff-guide.pdf')

doc = SimpleDocTemplate(
    OUTPUT_PATH,
    pagesize=letter,
    rightMargin=0.75*inch, leftMargin=0.75*inch,
    topMargin=0.65*inch,   bottomMargin=0.65*inch,
)
story = []
build_header(story)

# Title
story.append(Paragraph("WEIGHT LOSS PROTOCOL MANAGEMENT", title_s))
story.append(Paragraph("Single Source of Truth Process for Weight Tracking & Protocol Management", subtitle_s))
story.append(Spacer(1, 6))
story.append(Paragraph("Staff Guide \u2014 Lily, Dr. Burgess, Chris", note_s))
story.append(Spacer(1, 10))

# ── SECTION 1: THE SINGLE SOURCE OF TRUTH ────────────────────────────────────
story += section_label("1. The Single Source of Truth")

story.append(Paragraph(
    "All weight loss data flows through one table: <b>service_logs</b>. "
    "This is the single source of truth for injection sessions, weight tracking, "
    "and protocol progress. Every weight entry \u2014 whether from the encounter modal, "
    "patient self-report, or the patient portal \u2014 writes to service_logs.",
    body_s))
story.append(Spacer(1, 6))

story.append(Paragraph("What feeds into service_logs:", sub_s))
story.append(bullet("Encounter vitals (Lily or Dr. Burgess enters weight during visit)"))
story.append(bullet("Patient self-report (weekly SMS check-in link)"))
story.append(bullet("Patient portal (patient logs weight directly)"))
story.append(bullet("Medication deliveries (auto-logged when patient purchases)"))
story.append(Spacer(1, 6))

story.append(Paragraph("What reads from service_logs:", sub_s))
story.append(bullet("Protocol detail card (injection history table + weight chart)"))
story.append(bullet("Session count (sessions used / total)"))
story.append(bullet("Weight change calculations"))
story.append(bullet("Staff progress reports"))
story.append(Spacer(1, 8))

# Callout box
callout_data = [[Paragraph(
    "\u2713  <b>Rule:</b> Never track weight or sessions in a separate spreadsheet, "
    "notes field, or side system. If it\u2019s not in service_logs, it doesn\u2019t exist.",
    check_s)]]
callout_tbl = Table(callout_data, colWidths=[W])
callout_tbl.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,-1), HexColor('#f0fdf4')),
    ('BOX', (0,0), (-1,-1), 1, HexColor('#bbf7d0')),
    ('TOPPADDING', (0,0), (-1,-1), 8),
    ('BOTTOMPADDING', (0,0), (-1,-1), 8),
    ('LEFTPADDING', (0,0), (-1,-1), 12),
    ('RIGHTPADDING', (0,0), (-1,-1), 12),
]))
story.append(callout_tbl)

# ── SECTION 2: AUTOMATIC VS MANUAL ──────────────────────────────────────────
story.append(Spacer(1, 8))
story += section_label("2. What\u2019s Automatic vs. What\u2019s Manual")

auto_data = [
    [Paragraph("<b>Action</b>", th_s), Paragraph("<b>Automatic</b>", th_s), Paragraph("<b>Manual</b>", th_s)],
    [Paragraph("First purchase", tv_s), Paragraph("Protocol auto-created with medication, dose, sessions, start date", tv_s), Paragraph("\u2014", rest_s)],
    [Paragraph("Repurchase", tv_s), Paragraph("Delivery logged in service_logs", tv_s), Paragraph("Update total sessions + end date on protocol", tv_s)],
    [Paragraph("Weekly SMS reminder", tv_s), Paragraph("Sent on patient\u2019s injection day (if enabled)", tv_s), Paragraph("\u2014", rest_s)],
    [Paragraph("Patient texts weight", tv_s), Paragraph("Weight + injection logged to service_logs, sessions_used incremented, staff notified", tv_s), Paragraph("\u2014", rest_s)],
    [Paragraph("In-clinic weight entry", tv_s), Paragraph("Syncs to service_logs as injection, sessions_used incremented", tv_s), Paragraph("Enter weight in encounter vitals", tv_s)],
    [Paragraph("Protocol completion", tv_s), Paragraph("\u2014", rest_s), Paragraph("Never auto-completes. Staff decides when done.", tv_s)],
    [Paragraph("Dose change", tv_s), Paragraph("\u2014", rest_s), Paragraph("Edit protocol \u2192 update selected dose", tv_s)],
]
auto_tbl = Table(auto_data, colWidths=[1.4*inch, 2.8*inch, 2.8*inch])
auto_tbl.setStyle(TableStyle([
    ('TOPPADDING',    (0,0),(-1,-1), 5),
    ('BOTTOMPADDING', (0,0),(-1,-1), 5),
    ('LEFTPADDING',   (0,0),(-1,-1), 8),
    ('RIGHTPADDING',  (0,0),(-1,-1), 8),
    ('VALIGN',        (0,0),(-1,-1), 'TOP'),
    ('BACKGROUND',    (0,0),(-1,0), LIGHT_GRAY),
    ('BOX',           (0,0),(-1,-1), 0.5, RULE_GRAY),
    ('LINEBELOW',     (0,0),(-1,-1), 0.5, RULE_GRAY),
    ('ROWBACKGROUNDS',(0,1),(-1,-1), [WHITE, LIGHT_GRAY]),
]))
story.append(auto_tbl)

# ── SECTION 3: LOGGING WEIGHT DURING AN ENCOUNTER ───────────────────────────
story.append(PageBreak())
build_header(story)
story += section_label("3. Logging Weight During an Encounter")

story.append(Paragraph(
    "When a weight loss patient comes in, the encounter modal now highlights the weight field automatically.",
    body_s))
story.append(Spacer(1, 6))

for s in numbered_step(1, "Open the encounter",
    "Click on the patient\u2019s appointment to open the encounter modal."):
    story.append(s)

for s in numbered_step(2, "See the Weight Loss banner",
    "A blue banner appears at the top showing: medication, current dose, last weight, "
    "weight change since last visit, and session count. If renewal is due, a red warning shows."):
    story.append(s)

for s in numbered_step(3, "Enter weight in the Vitals section",
    "The Vitals section auto-expands for weight loss patients. The Weight field is highlighted "
    "in blue and auto-focused \u2014 just type the number. It auto-saves after 1 second."):
    story.append(s)

for s in numbered_step(4, "Write encounter note as normal",
    "Choose a note template or use the Weight Loss Check-in form for structured documentation. "
    "The weight you entered in vitals is already saved to the source of truth."):
    story.append(s)

story.append(Spacer(1, 6))

# What happens behind the scenes
story.append(Paragraph("What happens when you enter weight:", sub_s))
story.append(bullet("Weight is saved to <b>patient_vitals</b> (vitals flowsheet)"))
story.append(bullet("An <b>injection</b> entry is created in service_logs (counts as a session for in-clinic patients)"))
story.append(bullet("<b>sessions_used</b> is incremented on the protocol"))
story.append(bullet("BMI is auto-calculated if height is on file"))
story.append(Spacer(1, 6))

# Warning box
warn_data = [[Paragraph(
    "\u26A0  <b>Do not</b> log the same injection in both vitals AND the Weight Loss Check-in form. "
    "The system prevents duplicate entries for the same day, but using one method consistently is best.",
    warn_s)]]
warn_tbl = Table(warn_data, colWidths=[W])
warn_tbl.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,-1), HexColor('#fef2f2')),
    ('BOX', (0,0), (-1,-1), 1, HexColor('#fecaca')),
    ('TOPPADDING', (0,0), (-1,-1), 8),
    ('BOTTOMPADDING', (0,0), (-1,-1), 8),
    ('LEFTPADDING', (0,0), (-1,-1), 12),
    ('RIGHTPADDING', (0,0), (-1,-1), 12),
]))
story.append(warn_tbl)

# ── SECTION 4: CREATING A NEW PROTOCOL ──────────────────────────────────────
story.append(Spacer(1, 8))
story += section_label("4. Creating a New Weight Loss Protocol")

story.append(Paragraph(
    "New protocols are auto-created when a patient purchases weight loss for the first time via Stripe. "
    "If you need to create one manually:",
    body_s))
story.append(Spacer(1, 6))

for s in numbered_step(1, "Go to the patient\u2019s profile",
    "Navigate to Patients \u2192 search for the patient \u2192 click their name."):
    story.append(s)

for s in numbered_step(2, "Click \u201c+ Add Protocol\u201d",
    "On the Protocols tab, click the button in the top-right corner."):
    story.append(s)

for s in numbered_step(3, "Fill in protocol details",
    "Select <b>Weight Loss</b> category. Choose the medication (Tirzepatide, Semaglutide, or Retatrutide). "
    "Set the starting dose, frequency (usually Weekly), total sessions (usually 4 for monthly), "
    "delivery method (In-Clinic or Take-Home), and start date."):
    story.append(s)

for s in numbered_step(4, "Save",
    "The protocol appears on the patient\u2019s profile immediately."):
    story.append(s)

# ── SECTION 5: UPDATING ON REPURCHASE ───────────────────────────────────────
story.append(Spacer(1, 8))
story += section_label("5. When a Patient Repurchases")

story.append(Paragraph(
    "When a patient buys another month of weight loss, the system logs the delivery automatically "
    "but does <b>not</b> modify the protocol. You need to update it manually.",
    body_s))
story.append(Spacer(1, 6))

for s in numbered_step(1, "Open the patient\u2019s protocol",
    "Go to their profile \u2192 Protocols tab \u2192 click on the weight loss protocol."):
    story.append(s)

for s in numbered_step(2, "Click \u201cEdit\u201d",
    "The Edit button is in the protocol card header."):
    story.append(s)

for s in numbered_step(3, "Update Total Sessions",
    "Add the number of new sessions to the existing total. Example: patient was at 8 sessions, "
    "bought 4 more \u2192 change to 12."):
    story.append(s)

for s in numbered_step(4, "Update End Date",
    "Extend the end date by the number of new weeks. Example: 4 new sessions = extend by 4 weeks."):
    story.append(s)

for s in numbered_step(5, "Update Dose (if changed)",
    "If the provider changed the dose (e.g., 2mg \u2192 4mg), update the selected dose field."):
    story.append(s)

for s in numbered_step(6, "Save",
    "The protocol card updates immediately with the new session count and end date."):
    story.append(s)

# ── SECTION 6: READING THE PROTOCOL CARD ────────────────────────────────────
story.append(PageBreak())
build_header(story)
story += section_label("6. Reading the Protocol Card")

story.append(Paragraph("The protocol card shows everything you need at a glance:", body_s))
story.append(Spacer(1, 6))

story.append(Paragraph("Header Badges", sub_s))
badge_data = [
    [Paragraph("<b>Badge</b>", th_s), Paragraph("<b>Meaning</b>", th_s)],
    [Paragraph("Weight Loss", tv_s), Paragraph("Category badge (always shown)", tv_s)],
    [Paragraph("In-Clinic", tv_s), Paragraph("Patient comes in for injections (not take-home)", tv_s)],
    [Paragraph("\u26A0 Renewal Due", tv_s), Paragraph("Patient has used all their sessions \u2014 needs to repurchase", tv_s)],
    [Paragraph("14/12 sessions", tv_s), Paragraph("Sessions exceed total \u2014 total sessions needs updating", tv_s)],
]
badge_tbl = Table(badge_data, colWidths=[1.8*inch, 5.2*inch])
badge_tbl.setStyle(TableStyle([
    ('TOPPADDING',    (0,0),(-1,-1), 4),
    ('BOTTOMPADDING', (0,0),(-1,-1), 4),
    ('LEFTPADDING',   (0,0),(-1,-1), 8),
    ('RIGHTPADDING',  (0,0),(-1,-1), 8),
    ('VALIGN',        (0,0),(-1,-1), 'TOP'),
    ('BACKGROUND',    (0,0),(-1,0), LIGHT_GRAY),
    ('BOX',           (0,0),(-1,-1), 0.5, RULE_GRAY),
    ('LINEBELOW',     (0,0),(-1,-1), 0.5, RULE_GRAY),
]))
story.append(badge_tbl)
story.append(Spacer(1, 8))

story.append(Paragraph("Stats Row", sub_s))
story.append(bullet("<b>Starting Weight \u2192 Current Weight:</b> Total change shown in green"))
story.append(bullet("<b>Starting Dose \u2192 Current Dose:</b> Dose progression"))
story.append(bullet("<b>Sessions:</b> Injections completed out of total purchased"))
story.append(Spacer(1, 8))

story.append(Paragraph("Weight Chart", sub_s))
story.append(bullet("<b>Blue line:</b> Weight over time (each dot = a weigh-in)"))
story.append(bullet("<b>Green dashed lines:</b> Payment/delivery dates with quantity labels (e.g., \u201c4x\u201d for monthly purchase)"))
story.append(bullet("Chart legend shows at bottom: dashed green line = payment/delivery"))
story.append(Spacer(1, 8))

story.append(Paragraph("Injection History Table", sub_s))
story.append(bullet("Shows sessions in <b>chronological order</b> (slot 1 = first injection, slot 2 = second, etc.)"))
story.append(bullet("<b>Date:</b> When the injection was logged"))
story.append(bullet("<b>Dose:</b> What dose was used that session"))
story.append(bullet("<b>Weight:</b> Patient\u2019s weight at that session"))
story.append(bullet("<b>Change:</b> Weight difference from previous session (green = loss, red = gain)"))
story.append(bullet("Click any row to edit or delete that entry"))
story.append(bullet("<b>Red \u201cMissed\u201d rows:</b> Expected sessions with no data \u2014 click to add weight"))
story.append(bullet("<b>Faded \u201cUpcoming\u201d rows:</b> Future expected sessions"))

# ── SECTION 7: WEEKLY CHECK-IN FLOW ─────────────────────────────────────────
story.append(Spacer(1, 8))
story += section_label("7. Weekly Patient Check-In Flow (Automated)")

story.append(Paragraph(
    "Take-home patients receive automated weekly SMS reminders to report their weight. "
    "This flow is fully automated \u2014 no staff action needed.",
    body_s))
story.append(Spacer(1, 6))

checkin_data = [
    [Paragraph("<b>Step</b>", th_s), Paragraph("<b>What Happens</b>", th_s), Paragraph("<b>Who</b>", th_s)],
    [Paragraph("1", tv_bold_s), Paragraph("Cron job runs daily at 9 AM PST", tv_s), Paragraph("System", rest_s)],
    [Paragraph("2", tv_bold_s), Paragraph("Finds patients with check-ins enabled + today = their injection day", tv_s), Paragraph("System", rest_s)],
    [Paragraph("3", tv_bold_s), Paragraph("Sends SMS with check-in link", tv_s), Paragraph("System", rest_s)],
    [Paragraph("4", tv_bold_s), Paragraph("Patient clicks link, enters weight + side effects", tv_s), Paragraph("Patient", rest_s)],
    [Paragraph("5", tv_bold_s), Paragraph("Weight + injection logged to service_logs, sessions_used incremented", tv_s), Paragraph("System", rest_s)],
    [Paragraph("6", tv_bold_s), Paragraph("Staff SMS notification sent (weight, change, sessions remaining, payment warning)", tv_s), Paragraph("System", rest_s)],
    [Paragraph("7", tv_bold_s), Paragraph("Patient receives thank-you SMS with confirmation", tv_s), Paragraph("System", rest_s)],
]
checkin_tbl = Table(checkin_data, colWidths=[0.5*inch, 5.0*inch, 1.5*inch])
checkin_tbl.setStyle(TableStyle([
    ('TOPPADDING',    (0,0),(-1,-1), 4),
    ('BOTTOMPADDING', (0,0),(-1,-1), 4),
    ('LEFTPADDING',   (0,0),(-1,-1), 8),
    ('RIGHTPADDING',  (0,0),(-1,-1), 8),
    ('VALIGN',        (0,0),(-1,-1), 'TOP'),
    ('BACKGROUND',    (0,0),(-1,0), LIGHT_GRAY),
    ('BOX',           (0,0),(-1,-1), 0.5, RULE_GRAY),
    ('LINEBELOW',     (0,0),(-1,-1), 0.5, RULE_GRAY),
    ('ROWBACKGROUNDS',(0,1),(-1,-1), [WHITE, LIGHT_GRAY]),
]))
story.append(checkin_tbl)
story.append(Spacer(1, 8))

story.append(Paragraph("To enable/disable check-ins:", sub_s))
story.append(bullet("On the patient\u2019s protocol card, look for the check-in controls"))
story.append(bullet("Select the injection day (Monday\u2013Sunday) and click <b>Enable Check-ins</b>"))
story.append(bullet("To disable, click the <b>Disable</b> link next to the day selector"))
story.append(Spacer(1, 6))

story.append(Paragraph("Payment warning:", sub_s))
story.append(Paragraph(
    "When a patient has 2 or fewer sessions remaining, the staff notification includes a "
    "<b>payment due warning</b>. This is your cue to follow up on renewal.",
    body_s))

# ── QUICK REFERENCE ─────────────────────────────────────────────────────────
story.append(Spacer(1, 12))
story += section_label("Quick Reference")

ref_data = [
    [Paragraph("<b>I need to...</b>", th_s), Paragraph("<b>Do this</b>", th_s)],
    [Paragraph("Log a weight during a visit", tv_s), Paragraph("Open encounter \u2192 type weight in the highlighted Vitals field", tv_s)],
    [Paragraph("See a patient\u2019s progress", tv_s), Paragraph("Patient profile \u2192 Protocols tab \u2192 expand weight loss protocol", tv_s)],
    [Paragraph("Update sessions after repurchase", tv_s), Paragraph("Protocol card \u2192 Edit \u2192 update Total Sessions + End Date", tv_s)],
    [Paragraph("Check who needs renewal", tv_s), Paragraph("Look for red \u201c\u26A0 Renewal Due\u201d badge on protocol cards", tv_s)],
    [Paragraph("Enable weekly check-ins", tv_s), Paragraph("Protocol card \u2192 select injection day \u2192 Enable Check-ins", tv_s)],
    [Paragraph("Change a patient\u2019s dose", tv_s), Paragraph("Protocol card \u2192 Edit \u2192 update Selected Dose", tv_s)],
    [Paragraph("Fix a wrong weight entry", tv_s), Paragraph("Protocol card \u2192 click the row in injection table \u2192 edit or delete", tv_s)],
]
ref_tbl = Table(ref_data, colWidths=[2.5*inch, 4.5*inch])
ref_tbl.setStyle(TableStyle([
    ('TOPPADDING',    (0,0),(-1,-1), 5),
    ('BOTTOMPADDING', (0,0),(-1,-1), 5),
    ('LEFTPADDING',   (0,0),(-1,-1), 10),
    ('RIGHTPADDING',  (0,0),(-1,-1), 10),
    ('VALIGN',        (0,0),(-1,-1), 'TOP'),
    ('BACKGROUND',    (0,0),(-1,0), LIGHT_GRAY),
    ('BOX',           (0,0),(-1,-1), 0.5, RULE_GRAY),
    ('LINEBELOW',     (0,0),(-1,-1), 0.5, RULE_GRAY),
    ('ROWBACKGROUNDS',(0,1),(-1,-1), [WHITE, LIGHT_GRAY]),
]))
story.append(ref_tbl)

build_footer(story)
doc.build(story)
print(f"\n\u2713 PDF generated: {OUTPUT_PATH}")
