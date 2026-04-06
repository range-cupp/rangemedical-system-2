#!/usr/bin/env python3
"""Front Desk Quick Guide — Phone Calls & Walk-Ins. One page, plain language."""

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table,
                                 TableStyle, HRFlowable, KeepTogether)
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
sec_s       = st('Sec',    fontName='Helvetica-Bold',    fontSize=8,   textColor=MID_GRAY,  leading=11, spaceBefore=14, spaceAfter=3)
body_s      = st('Body',   fontName='Helvetica',         fontSize=9.5, textColor=DARK_GRAY, leading=16, spaceAfter=0)
bullet_s    = st('Bul',    fontName='Helvetica',         fontSize=9.5, textColor=DARK_GRAY, leading=16, leftIndent=14, firstLineIndent=-10, spaceAfter=2)
sub_s       = st('SubH',   fontName='Helvetica-Bold',    fontSize=9.5, textColor=BLACK,     leading=13, spaceBefore=8, spaceAfter=3)
th_s        = st('TH',     fontName='Helvetica-Bold',    fontSize=8,   textColor=MID_GRAY,  leading=11)
tv_s        = st('TV',     fontName='Helvetica',         fontSize=9.5, textColor=DARK_GRAY, leading=14)
tv_bold_s   = st('TVB',    fontName='Helvetica-Bold',    fontSize=9.5, textColor=BLACK,     leading=14)
script_s    = st('Script', fontName='Helvetica-Oblique', fontSize=9.5, textColor=DARK_GRAY, leading=16, leftIndent=16, rightIndent=16, spaceAfter=6)
warn_s      = st('Warn',   fontName='Helvetica-Bold',    fontSize=9,   textColor=HexColor('#dc2626'), leading=14, spaceBefore=4, spaceAfter=4)
foot_s      = st('Foot',   fontName='Helvetica-Oblique', fontSize=8,   textColor=MID_GRAY,  leading=12)
foot_bold_s = st('FootB',  fontName='Helvetica-Bold',    fontSize=8.5, textColor=DARK_GRAY, leading=12)

def section_label(text):
    return [
        Paragraph(text.upper(), sec_s),
        HRFlowable(width="100%", thickness=0.75, color=RULE_GRAY, spaceAfter=6),
    ]

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
    story.append(HRFlowable(width="100%", thickness=1.5, color=BLACK, spaceAfter=10))

def build_footer(story):
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=0.5, color=RULE_GRAY, spaceAfter=6))
    tbl = Table([[
        Paragraph("<b>Questions?</b> Ask Chris or Damon. (949) 997-3988", foot_bold_s),
        Paragraph("Internal document \u2014 not for patients. April 2026.", foot_s),
    ]], colWidths=[3.0*inch, 4.0*inch])
    tbl.setStyle(TableStyle([
        ('VALIGN',(0,0),(-1,-1),'TOP'),
        ('TOPPADDING',(0,0),(-1,-1),0),('BOTTOMPADDING',(0,0),(-1,-1),0),
        ('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),0),
    ]))
    story.append(tbl)


# ── BUILD ────────────────────────────────────────────────────────────────────

OUTPUT_PATH = os.path.join(os.path.dirname(__file__), '..', 'public', 'docs', 'front-desk-guide.pdf')

doc = SimpleDocTemplate(
    OUTPUT_PATH,
    pagesize=letter,
    rightMargin=0.75*inch, leftMargin=0.75*inch,
    topMargin=0.6*inch,   bottomMargin=0.5*inch,
)
story = []
build_header(story)

story.append(Paragraph("FRONT DESK QUICK GUIDE", title_s))
story.append(Paragraph("Phone Calls &amp; Walk-Ins \u2014 Keep It Simple", subtitle_s))
story.append(Spacer(1, 10))

# ── PHONE CALLS ──────────────────────────────────────────────────────────────

story += section_label("When Someone Calls")

story.append(Paragraph("Answer: <b>\u201cRange Medical, this is [your name], how can I help you?\u201d</b>", body_s))
story.append(Spacer(1, 6))

story.append(Paragraph("Then figure out what they need:", sub_s))
story.append(Spacer(1, 4))

call_data = [
    [Paragraph("<b>They say\u2026</b>", th_s), Paragraph("<b>You say\u2026</b>", th_s)],
    [
        Paragraph("\u201cI\u2019m interested in\u2026\u201d<br/>\u201cWhat do you guys do?\u201d<br/>\u201cHow much is\u2026?\u201d<br/>\u201cI want to get started\u201d", tv_s),
        Paragraph(
            "\u201cThe best way to get started is with a Range Assessment. It\u2019s $197 and it\u2019s a "
            "30-minute visit where we sit down, go over everything, and build a plan. "
            "If you move forward with treatment, we credit the full $197 toward it. "
            "No commitment \u2014 want me to get you on the schedule?\u201d", tv_s),
    ],
    [
        Paragraph("\u201cI have an appointment\u201d<br/>\u201cI\u2019m calling to confirm\u201d<br/>\u201cI need to reschedule\u201d", tv_s),
        Paragraph("Pull up their appointment in the system. Confirm date, time, and any prep instructions. If rescheduling, find a new slot on Cal.com.", tv_s),
    ],
    [
        Paragraph("\u201cI\u2019m a current patient\u201d<br/>\u201cI have a question about my treatment\u201d", tv_s),
        Paragraph("Pull up their profile. Answer if you can, or take a message and let them know someone will call back today.", tv_s),
    ],
    [
        Paragraph("\u201cI want to talk to the doctor\u201d<br/>\u201cI need my lab results\u201d", tv_s),
        Paragraph("\u201cLet me take your name and number \u2014 I\u2019ll have Dr. Burgess\u2019s team reach out to you today.\u201d", tv_s),
    ],
    [
        Paragraph("Vendor / sales call /<br/>not a patient", tv_s),
        Paragraph("\u201cCan I get your name, company, and what it\u2019s regarding? I\u2019ll pass it along.\u201d Take a message. Do not transfer.", tv_s),
    ],
]
call_tbl = Table(call_data, colWidths=[2.2*inch, 4.8*inch])
call_tbl.setStyle(TableStyle([
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
story.append(call_tbl)

# ── WALK-INS ─────────────────────────────────────────────────────────────────

story.append(Spacer(1, 4))
story += section_label("When Someone Walks In")

walkin_data = [
    [Paragraph("<b>Situation</b>", th_s), Paragraph("<b>What to do</b>", th_s)],
    [
        Paragraph("<b>They have an appointment</b>", tv_bold_s),
        Paragraph(
            "1. Greet them by name<br/>"
            "2. Check if their intake + HIPAA forms are done \u2014 if not, hand them the iPad<br/>"
            "3. Offer water<br/>"
            "4. Let the assigned team member know they\u2019re here",
            tv_s),
    ],
    [
        Paragraph("<b>They don\u2019t have an appointment</b><br/>(interested, curious, just walked by)", tv_bold_s),
        Paragraph(
            "1. \u201cWelcome to Range Medical! Have you been here before?\u201d<br/>"
            "2. If new: \u201cThe best way to get started is with a Range Assessment \u2014 it\u2019s $197, "
            "30 minutes, and we credit it toward treatment. Want to book one?\u201d<br/>"
            "3. Book them on the spot if there\u2019s availability, or schedule for another day<br/>"
            "4. If they just want info, hand them a card and say \u201crange-medical.com has everything \u2014 "
            "you can book right from the site.\u201d",
            tv_s),
    ],
    [
        Paragraph("<b>They\u2019re picking up medication</b><br/>(peptides, weight loss, HRT)", tv_bold_s),
        Paragraph(
            "1. Get their name, pull up their profile<br/>"
            "2. Let the team member who handles their protocol know<br/>"
            "3. Log the pickup in the service log",
            tv_s),
    ],
    [
        Paragraph("<b>Delivery / vendor / non-patient</b>", tv_bold_s),
        Paragraph("Accept delivery or take a message. Do not let non-patients into the treatment area.", tv_s),
    ],
]
walkin_tbl = Table(walkin_data, colWidths=[2.2*inch, 4.8*inch])
walkin_tbl.setStyle(TableStyle([
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
story.append(walkin_tbl)

# ── DO NOT SAY ───────────────────────────────────────────────────────────────

story.append(Spacer(1, 4))
story += section_label("Never Say")

never_data = [
    [Paragraph("<b>Don\u2019t say</b>", th_s), Paragraph("<b>Say instead</b>", th_s)],
    [Paragraph("\u201cThe assessment is free\u201d", tv_s), Paragraph("\u201cIt\u2019s $197, and we credit it toward your treatment\u201d", tv_s)],
    [Paragraph("\u201cYou need to pick a lab panel first\u201d", tv_s), Paragraph("\u201cWe\u2019ll figure out the right labs at your assessment\u201d", tv_s)],
    [Paragraph("\u201cThe assessment is $250\u201d", tv_s), Paragraph("\u201cIt\u2019s $197\u201d", tv_s)],
    [Paragraph("\u201cI don\u2019t know\u201d (and leave it there)", tv_s), Paragraph("\u201cLet me find out for you \u2014 can I grab your number?\u201d", tv_s)],
    [Paragraph("Any specific pricing for treatments", tv_s), Paragraph("\u201cThat\u2019s something we cover at the assessment so we can match you with the right plan\u201d", tv_s)],
]
never_tbl = Table(never_data, colWidths=[3.0*inch, 4.0*inch])
never_tbl.setStyle(TableStyle([
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
story.append(never_tbl)

# ── FOOTER ───────────────────────────────────────────────────────────────────

build_footer(story)
doc.build(story)
print(f"PDF generated: {os.path.abspath(OUTPUT_PATH)}")
