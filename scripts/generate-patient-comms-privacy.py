#!/usr/bin/env python3
# Generate: Patient Communication Privacy Policy — Range Medical
# Staff one-pager explaining the privacy rules for patient-facing messages

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
RED        = HexColor('#DC2626')
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
red_bold_s  = st('RedB',   fontName='Helvetica-Bold',    fontSize=9.5, textColor=RED,       leading=16, spaceAfter=0)
red_bullet_s = st('RedBul', fontName='Helvetica',        fontSize=9.5, textColor=RED,       leading=16, leftIndent=14, firstLineIndent=-10, spaceAfter=2)

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

def red_bullet(text):
    return Paragraph(f"\u2013  {text}", red_bullet_s)

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
        Paragraph("<b>Questions?</b><br/>Call or text: (949) 997-3988<br/>range-medical.com", foot_bold_s),
        Paragraph(
            "This document is for Range Medical staff only. Patient communication privacy "
            "is a core part of our HIPAA compliance. When in doubt, keep it generic.",
            foot_s),
    ]], colWidths=[2.2*inch, 4.8*inch])
    tbl.setStyle(TableStyle([
        ('VALIGN',(0,0),(-1,-1),'TOP'),
        ('TOPPADDING',(0,0),(-1,-1),0),('BOTTOMPADDING',(0,0),(-1,-1),0),
        ('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),0),
    ]))
    story.append(tbl)

# ── BUILD THE DOCUMENT ──────────────────────────────────────────────────────

OUTPUT_PATH = "public/docs/patient-comms-privacy-policy.pdf"

doc = SimpleDocTemplate(
    OUTPUT_PATH,
    pagesize=letter,
    rightMargin=0.75*inch, leftMargin=0.75*inch,
    topMargin=0.65*inch,   bottomMargin=0.65*inch,
)
story = []
build_header(story)

# Title
story.append(Paragraph("PATIENT COMMUNICATION PRIVACY POLICY", title_s))
story.append(Paragraph("Staff reference \u2014 How patient-facing messages should read", subtitle_s))
story.append(Spacer(1, 10))

# ── THE RULE ──
story += section_label("The Rule")
story.append(Paragraph(
    "All patient-facing appointment messages \u2014 texts, emails, and reminders \u2014 must use "
    "<b>generic language only</b>. Patients see \u201cappointment with Range Medical\u201d and a time. "
    "They never see the specific service or treatment type.",
    body_s
))
story.append(Spacer(1, 6))
story.append(Paragraph(
    "This applies for privacy purposes. A patient\u2019s phone screen, email inbox, or notification "
    "banner should never reveal what type of medical treatment they\u2019re receiving.",
    body_s
))

# ── WHAT PATIENTS SEE ──
story.append(Spacer(1, 4))
story += section_label("What Patients See")

# Before / After table
compare_header = st('CmpH', fontName='Helvetica-Bold', fontSize=8, textColor=WHITE, leading=11)
before_s = st('Bef', fontName='Helvetica', fontSize=9, textColor=RED, leading=14)
after_s  = st('Aft', fontName='Helvetica', fontSize=9, textColor=GREEN, leading=14)

data = [
    [Paragraph("BEFORE (old)", compare_header), Paragraph("NOW (correct)", compare_header)],
    [Paragraph("\u2718  \u201cYour Testosterone Injection appointment is confirmed for...\u201d", before_s),
     Paragraph("\u2713  \u201cYour appointment with Range Medical is confirmed for...\u201d", after_s)],
    [Paragraph("\u2718  \u201cReminder: your Weight Loss Injection is tomorrow at 10 AM\u201d", before_s),
     Paragraph("\u2713  \u201cReminder: your appointment with Range Medical is tomorrow at 10 AM\u201d", after_s)],
    [Paragraph("\u2718  Email subject: \u201cAppointment Confirmed: NAD+ IV \u2014 Range Medical\u201d", before_s),
     Paragraph("\u2713  Email subject: \u201cAppointment Confirmed \u2014 Range Medical\u201d", after_s)],
    [Paragraph("\u2718  \u201cYour Range IV is included with your HRT membership\u201d", before_s),
     Paragraph("\u2713  \u201cYou have a complimentary IV session included with your membership\u201d", after_s)],
]

tbl = Table(data, colWidths=[W/2, W/2])
tbl.setStyle(TableStyle([
    ('BACKGROUND',    (0,0), (-1,0), BLACK),
    ('TOPPADDING',    (0,0), (-1,-1), 6),
    ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ('LEFTPADDING',   (0,0), (-1,-1), 10),
    ('RIGHTPADDING',  (0,0), (-1,-1), 10),
    ('VALIGN',        (0,0), (-1,-1), 'TOP'),
    ('ROWBACKGROUNDS',(0,1), (-1,-1), [LIGHT_GRAY, WHITE]),
    ('BOX',           (0,0), (-1,-1), 0.5, RULE_GRAY),
    ('LINEBELOW',     (0,0), (-1,-2), 0.5, RULE_GRAY),
    ('LINEBEFORE',    (1,0), (1,-1),  0.5, RULE_GRAY),
]))
story.append(tbl)

# ── WHAT THIS COVERS ──
story.append(Spacer(1, 4))
story += section_label("Messages Covered by This Policy")

story.append(bullet("<b>Booking confirmations</b> \u2014 SMS and email sent when an appointment is created"))
story.append(bullet("<b>24-hour reminders</b> \u2014 daily cron SMS sent the day before an appointment"))
story.append(bullet("<b>Reschedule notices</b> \u2014 SMS and email when an appointment time changes"))
story.append(bullet("<b>Cancellation notices</b> \u2014 SMS and email when an appointment is cancelled"))
story.append(bullet("<b>Membership reminders</b> \u2014 monthly SMS about included benefits"))
story.append(bullet("<b>Email subject lines</b> \u2014 no service type in any email subject"))
story.append(bullet("<b>Email body</b> \u2014 the \u201cService\u201d row has been removed from appointment detail emails"))

# ── INTERNAL SIDE ──
story.append(Spacer(1, 4))
story += section_label("What Stays Internal")

story.append(Paragraph(
    "The specific service type is still stored in our system and visible on the admin side. "
    "Staff can see what type of appointment it is on the schedule, patient profile, and service log. "
    "The privacy rule only applies to what the <b>patient receives</b> on their phone or email.",
    body_s
))
story.append(Spacer(1, 6))
story.append(bullet("<b>Admin schedule</b> \u2014 still shows full service names (Testosterone Injection, NAD+ IV, etc.)"))
story.append(bullet("<b>Staff notifications</b> \u2014 still include service type (Tara\u2019s alerts, prereq checks, etc.)"))
story.append(bullet("<b>Patient profile</b> \u2014 still shows full appointment and protocol details"))
story.append(bullet("<b>Comms log</b> \u2014 still records the service name for internal tracking"))

# ── KEY REMINDER ──
story.append(Spacer(1, 4))
story += section_label("Key Reminder")

story.append(Paragraph(
    "If you are ever manually texting or emailing a patient about an upcoming appointment, "
    "follow the same rule: <b>no treatment names</b>. Say \u201cyour appointment\u201d or "
    "\u201cyour visit at Range Medical.\u201d This protects our patients\u2019 privacy and keeps us "
    "aligned with HIPAA best practices.",
    body_s
))

story.append(Spacer(1, 8))

# Effective date
story.append(Paragraph("Effective: April 6, 2026", note_s))

build_footer(story)
doc.build(story)
print(f"PDF generated: {OUTPUT_PATH}")
