#!/usr/bin/env python3
"""Clinical Questionnaire Quick Reference — One page, plain language."""

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
note_s      = st('Note',   fontName='Helvetica-Oblique', fontSize=9,   textColor=MID_GRAY,  leading=13, spaceAfter=4)
script_s    = st('Script', fontName='Helvetica-Oblique', fontSize=9.5, textColor=DARK_GRAY, leading=16, leftIndent=16, rightIndent=16, spaceAfter=6)
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

OUTPUT_PATH = os.path.join(os.path.dirname(__file__), '..', 'public', 'docs', 'questionnaire-quick-ref.pdf')

doc = SimpleDocTemplate(
    OUTPUT_PATH,
    pagesize=letter,
    rightMargin=0.75*inch, leftMargin=0.75*inch,
    topMargin=0.6*inch,   bottomMargin=0.5*inch,
)
story = []
build_header(story)

story.append(Paragraph("CLINICAL QUESTIONNAIRES", title_s))
story.append(Paragraph("Quick Reference \u2014 What We Send &amp; Why", subtitle_s))
story.append(Spacer(1, 10))

# ── THE ONE THING TO KNOW ────────────────────────────────────────────────────

story += section_label("The One Thing to Know")

story.append(Paragraph(
    "When energy &amp; optimization patients come in, the system sends them a clinical questionnaire as part of their intake. "
    "It\u2019s <b>not a test</b>. There are no right or wrong answers. It\u2019s a snapshot of how they feel "
    "<b>right now</b> so we can track their progress over time.",
    body_s))
story.append(Spacer(1, 4))
story.append(Paragraph(
    "The system picks the right sections automatically based on the patient\u2019s gender and what symptoms they selected. "
    "You don\u2019t need to choose which parts to include.",
    note_s))

# ── WHAT'S IN IT ─────────────────────────────────────────────────────────────

story.append(Spacer(1, 2))
story += section_label("What\u2019s in the Questionnaire")

q_data = [
    [Paragraph("<b>Section</b>", th_s), Paragraph("<b>What it asks</b>", th_s), Paragraph("<b>Who gets it</b>", th_s)],
    [Paragraph("Mood (PHQ-9)", tv_bold_s), Paragraph("Sleep, energy, appetite, concentration, mood \u2014 9 questions", tv_s), Paragraph("Everyone", tv_s)],
    [Paragraph("Anxiety (GAD-7)", tv_bold_s), Paragraph("Worry, nervousness, restlessness \u2014 7 questions", tv_s), Paragraph("Everyone", tv_s)],
    [Paragraph("Sleep (PSQI)", tv_bold_s), Paragraph("Bedtime, hours, quality, tiredness \u2014 5 questions", tv_s), Paragraph("Everyone", tv_s)],
    [Paragraph("Energy (VAS)", tv_bold_s), Paragraph("One slider: rate your energy 0\u201310", tv_s), Paragraph("Everyone", tv_s)],
    [Paragraph("Goal Setting", tv_bold_s), Paragraph("One open question: \u201cWhat\u2019s your main goal?\u201d", tv_s), Paragraph("Everyone", tv_s)],
    [Paragraph("Sexual Health", tv_bold_s), Paragraph("Standard clinical questions about sexual function \u2014 5\u20136 questions", tv_s), Paragraph("Only if they selected \u201clow libido\u201d", tv_s)],
    [Paragraph("Eating Behavior", tv_bold_s), Paragraph("Hunger, cravings, emotional eating \u2014 18 questions", tv_s), Paragraph("Only if they selected \u201cweight gain\u201d", tv_s)],
    [Paragraph("Hormone Symptoms (Men)", tv_bold_s), Paragraph("Energy, mood, strength, sleep, libido \u2014 17 questions", tv_s), Paragraph("Men with hormone symptoms", tv_s)],
    [Paragraph("Hormone Symptoms (Women)", tv_bold_s), Paragraph("Hot flashes, mood, joint pain, fatigue \u2014 29 questions", tv_s), Paragraph("Women with hormone symptoms", tv_s)],
]
q_tbl = Table(q_data, colWidths=[2.0*inch, 2.8*inch, 2.2*inch])
q_tbl.setStyle(TableStyle([
    ('TOPPADDING',    (0,0),(-1,-1), 4),
    ('BOTTOMPADDING', (0,0),(-1,-1), 4),
    ('LEFTPADDING',   (0,0),(-1,-1), 6),
    ('RIGHTPADDING',  (0,0),(-1,-1), 6),
    ('VALIGN',        (0,0),(-1,-1), 'TOP'),
    ('BACKGROUND',    (0,0),(-1,0), LIGHT_GRAY),
    ('ROWBACKGROUNDS',(0,1),(-1,-1), [WHITE, LIGHT_GRAY]),
    ('BOX',           (0,0),(-1,-1), 0.5, RULE_GRAY),
    ('LINEBELOW',     (0,0),(-1,-1), 0.5, RULE_GRAY),
]))
story.append(q_tbl)

# ── HOW TO SEND IT ───────────────────────────────────────────────────────────

story.append(Spacer(1, 2))
story += section_label("How to Send It")

story.append(Paragraph(
    "Go to the patient\u2019s profile \u2192 <b>Send Forms</b> \u2192 select <b>\u201cLabs + Questionnaire\u201d</b> preset \u2192 choose SMS or email \u2192 Send.",
    body_s))
story.append(Spacer(1, 4))
story.append(Paragraph(
    "The HRT and Weight Loss presets already include the questionnaire. You don\u2019t need to add it separately for those patients.",
    note_s))

# ── IF A PATIENT ASKS ────────────────────────────────────────────────────────

story.append(Spacer(1, 2))
story += section_label("If a Patient Asks About It")

qa_data = [
    [Paragraph("<b>They ask\u2026</b>", th_s), Paragraph("<b>You say\u2026</b>", th_s)],
    [
        Paragraph("\u201cWhy do I have to fill this out?\u201d", tv_s),
        Paragraph("\u201cIt gives your provider a baseline before your first visit so they can build a better plan for you.\u201d", tv_s),
    ],
    [
        Paragraph("\u201cThis is really personal.\u201d", tv_s),
        Paragraph("\u201cYour answers are completely confidential \u2014 only your provider sees them. These are standard clinical tools used by doctors everywhere.\u201d", tv_s),
    ],
    [
        Paragraph("\u201cDo I have to finish it now?\u201d", tv_s),
        Paragraph("\u201cNo \u2014 your progress saves automatically. You can close it and come back anytime.\u201d", tv_s),
    ],
    [
        Paragraph("\u201cHow long does this take?\u201d", tv_s),
        Paragraph("\u201cAbout 5\u201310 minutes for most people.\u201d", tv_s),
    ],
    [
        Paragraph("\u201cWill I have to do it again?\u201d", tv_s),
        Paragraph("\u201cYes \u2014 we send a follow-up at 6 weeks, 12 weeks, and 6 months. That\u2019s how we track your progress.\u201d", tv_s),
    ],
]
qa_tbl = Table(qa_data, colWidths=[2.2*inch, 4.8*inch])
qa_tbl.setStyle(TableStyle([
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
story.append(qa_tbl)

# ── FOOTER ───────────────────────────────────────────────────────────────────

build_footer(story)
doc.build(story)
print(f"PDF generated: {os.path.abspath(OUTPUT_PATH)}")
