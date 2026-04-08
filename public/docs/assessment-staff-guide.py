#!/usr/bin/env python3
"""Generate Range Medical Assessment Staff Guide PDF — compact layout, no gaps."""

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
title_s     = st('Title',  fontName='Helvetica-Bold',    fontSize=16,  textColor=BLACK,     leading=20, spaceAfter=2)
subtitle_s  = st('Sub',    fontName='Helvetica-Oblique', fontSize=9,   textColor=MID_GRAY,  leading=12)
sec_s       = st('Sec',    fontName='Helvetica-Bold',    fontSize=8,   textColor=MID_GRAY,  leading=11, spaceBefore=12, spaceAfter=3)
comp_s      = st('Comp',   fontName='Helvetica-Bold',    fontSize=10.5, textColor=BLACK,    leading=13, spaceBefore=6, spaceAfter=2)
sub_s       = st('SubH',   fontName='Helvetica-Bold',    fontSize=9.5, textColor=BLACK,     leading=12, spaceBefore=6,  spaceAfter=2)
body_s      = st('Body',   fontName='Helvetica',         fontSize=9,   textColor=DARK_GRAY, leading=14, spaceAfter=0)
bullet_s    = st('Bul',    fontName='Helvetica',         fontSize=9,   textColor=DARK_GRAY, leading=14, leftIndent=14, firstLineIndent=-10, spaceAfter=1)
th_s        = st('TH',     fontName='Helvetica-Bold',    fontSize=8,   textColor=MID_GRAY,  leading=11)
tv_s        = st('TV',     fontName='Helvetica',         fontSize=9,   textColor=DARK_GRAY, leading=13)
tv_bold_s   = st('TVB',    fontName='Helvetica-Bold',    fontSize=9,   textColor=BLACK,     leading=13)
foot_s      = st('Foot',   fontName='Helvetica-Oblique', fontSize=8,   textColor=MID_GRAY,  leading=12)
foot_bold_s = st('FootB',  fontName='Helvetica-Bold',    fontSize=8.5, textColor=DARK_GRAY, leading=12)
note_s      = st('Note',   fontName='Helvetica-Oblique', fontSize=8.5, textColor=MID_GRAY,  leading=12, spaceAfter=2)
quote_q_s   = st('QQ',     fontName='Helvetica-Bold',    fontSize=9,   textColor=BLACK,     leading=13, leftIndent=10, spaceAfter=0)
quote_a_s   = st('QA',     fontName='Helvetica-Oblique', fontSize=9,   textColor=DARK_GRAY, leading=13, leftIndent=10, spaceAfter=6)

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
        ('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADGIN',(0,0),(-1,-1),0),
    ]))
    story.append(hdr)
    story.append(HRFlowable(width="100%", thickness=1.5, color=BLACK, spaceAfter=10))

def build_footer(story):
    story.append(HRFlowable(width="100%", thickness=0.5, color=RULE_GRAY, spaceAfter=6))
    tbl = Table([[
        Paragraph("<b>Questions or concerns?</b><br/>Call or text: (949) 997-3988<br/>range-medical.com", foot_bold_s),
        Paragraph(
            "This document is intended for Range Medical staff only. "
            "Do not distribute to patients. For questions about the assessment system, contact Chris.",
            foot_s),
    ]], colWidths=[2.2*inch, 4.8*inch])
    tbl.setStyle(TableStyle([
        ('VALIGN',(0,0),(-1,-1),'TOP'),
        ('TOPPADDING',(0,0),(-1,-1),0),('BOTTOMPADDING',(0,0),(-1,-1),0),
        ('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),0),
    ]))
    story.append(tbl)

def assessment_card(story, name, questions, description, why, patient_script):
    """Compact assessment card — uses KeepTogether to avoid splitting across pages."""
    card = [
        Paragraph(name, comp_s),
        Paragraph(questions, note_s),
        Paragraph(description, body_s),
        Spacer(1, 2),
        Paragraph(f"<b>Why we use it:</b> {why}", body_s),
        Spacer(1, 2),
        Paragraph(f"<b>What to tell patients:</b> <i>\u201c{patient_script}\u201d</i>", body_s),
        Spacer(1, 6),
    ]
    story.append(KeepTogether(card))


# ── BUILD THE PDF ──────────────────────────────────────────
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "assessment-staff-guide.pdf")

doc = SimpleDocTemplate(
    OUTPUT_PATH,
    pagesize=letter,
    rightMargin=0.75*inch, leftMargin=0.75*inch,
    topMargin=0.6*inch,   bottomMargin=0.55*inch,
)
story = []
build_header(story)

# Title
story.append(Paragraph("PATIENT ASSESSMENT GUIDE", title_s))
story.append(Paragraph("What We\u2019re Sending &amp; Why \u2014 Staff Reference \u2014 Range Medical Newport Beach", subtitle_s))
story.append(Spacer(1, 10))

# ═══════════════════════════════════════════════════════════
# SECTION 1 — THE BIG PICTURE
# ═══════════════════════════════════════════════════════════
story += section_label("Section 1 \u2014 The Big Picture")

story.append(Paragraph(
    "When a patient comes in for energy &amp; optimization services, we send them a clinical "
    "assessment as part of their intake paperwork. This is <b>not a test</b> \u2014 there are no right "
    "or wrong answers. It\u2019s a snapshot of how they\u2019re feeling <i>right now</i>, before treatment starts. We use it to:",
    body_s))
story.append(Spacer(1, 4))
story.append(bullet("Give the provider real data before the first visit (not just \u201cI feel tired\u201d)"))
story.append(bullet("Track progress over time (we re-send the same assessment at 6 weeks, 12 weeks, and 6 months)"))
story.append(bullet("Show patients measurable improvement (\u201cyour sleep score went from 3 to 7\u201d)"))
story.append(bullet("Make smarter treatment decisions based on numbers, not guesses"))

# ═══════════════════════════════════════════════════════════
# SECTION 2 — WHAT'S IN THE ASSESSMENT
# ═══════════════════════════════════════════════════════════
story += section_label("Section 2 \u2014 What\u2019s in the Assessment")

story.append(Paragraph(
    "The assessment has a <b>core section everyone gets</b>, plus <b>extra sections</b> that show up "
    "based on what the patient selected in their intake form.", body_s))
story.append(Spacer(1, 6))

# ── CORE SECTIONS ──
story.append(Paragraph("Core \u2014 Everyone Gets These", sub_s))
story.append(HRFlowable(width="100%", thickness=0.5, color=RULE_GRAY, spaceAfter=4))

assessment_card(story,
    name="PHQ-9 (Mood)",
    questions="9 questions \u2022 Covers the past 2 weeks",
    description="Asks about interest in activities, sleep, energy, appetite, concentration, and overall mood.",
    why="It\u2019s the same tool every doctor in the country uses to screen for depression. It gives us a number (0\u201327) instead of a vague \u201cI\u2019m not feeling great.\u201d",
    patient_script="This helps us understand your baseline mood so we can track how you\u2019re responding to treatment.",
)

assessment_card(story,
    name="GAD-7 (Anxiety)",
    questions="7 questions \u2022 Covers the past 2 weeks",
    description="Asks about worry, nervousness, restlessness, and feeling on edge.",
    why="Anxiety affects sleep, hormones, and recovery. If someone scores high, the provider knows to address it in the treatment plan.",
    patient_script="These questions help us see the full picture of your mental wellness.",
)

assessment_card(story,
    name="Sleep Assessment (PSQI)",
    questions="5 questions",
    description="Asks about bedtime, hours of sleep, sleep quality, how often sleep is disturbed, and daytime tiredness.",
    why="Sleep is the first thing that improves with hormone optimization. Having a baseline number means we can show them the improvement.",
    patient_script="Sleep quality is one of the biggest things we track \u2014 it tells us a lot about how your body is responding.",
)

assessment_card(story,
    name="Energy Level (Fatigue VAS)",
    questions="1 question \u2022 Slider from 0 to 10",
    description="One simple slider: \u201cRate your energy on a typical day\u201d from 0 (completely exhausted) to 10 (full energy).",
    why="Quick snapshot that\u2019s easy to compare over time. Providers love this one because it\u2019s so clear.",
    patient_script="Just tell us how your energy is right now \u2014 we\u2019ll check again in a few weeks.",
)

# ── CONDITIONAL SECTIONS — no page break, just flow ──
story.append(Paragraph("Conditional \u2014 Only Shows Based on Intake Selections", sub_s))
story.append(HRFlowable(width="100%", thickness=0.5, color=RULE_GRAY, spaceAfter=4))

story.append(Paragraph(
    "These sections only appear if the patient checked certain symptoms in their medical intake. "
    "The system handles this automatically \u2014 you don\u2019t need to select which ones to include.",
    note_s))
story.append(Spacer(1, 2))

assessment_card(story,
    name="Sexual Health (IIEF-5 for Men / FSFI-6 for Women)",
    questions="5\u20136 questions \u2022 Appears if they selected \u201clow libido / sexual dysfunction\u201d",
    description="Standard clinical questions about sexual function, tailored to gender. The system automatically sends the right version based on the patient\u2019s gender in their profile.",
    why="Sexual health is a key quality-of-life marker and one of the first things to improve with HRT. Having a baseline score lets us prove the treatment is working.",
    patient_script="These are standard clinical questions \u2014 your answers are completely private and help your provider tailor your treatment.",
)

assessment_card(story,
    name="Eating Behavior (TFEQ-R18)",
    questions="18 questions \u2022 Appears if they selected \u201cweight gain / difficulty losing weight\u201d",
    description="Asks about eating patterns, hunger cues, food cravings, and emotional eating. Scored across three areas: cognitive restraint, uncontrolled eating, and emotional eating.",
    why="Helps the provider understand if weight issues are behavioral, hormonal, or both \u2014 which changes the treatment approach entirely.",
    patient_script="This helps us understand your relationship with food so we can build the right plan for you.",
)

assessment_card(story,
    name="Hormone Symptoms \u2014 Men (AMS)",
    questions="17 questions \u2022 Appears for male patients with hormone symptoms",
    description="Covers energy, mood, muscle strength, joint pain, sleep, sweating, irritability, and libido. Only shows if the patient is male and selected symptoms like fatigue, low libido, mood changes, muscle loss, or brain fog.",
    why="Gives a severity score for testosterone deficiency symptoms. We use it to track exactly how HRT is working over time.",
    patient_script="These questions cover the most common symptoms of hormone imbalance \u2014 we use your answers to measure how treatment is working.",
)

assessment_card(story,
    name="Hormone Symptoms \u2014 Women (MENQOL)",
    questions="29 questions \u2022 Appears for female patients with hormone symptoms",
    description="Covers four areas: vasomotor (hot flashes, night sweats), psychosocial (mood, anxiety, memory), physical (joint pain, fatigue, weight), and sexual health. Only shows if the patient is female and selected hormone-related symptoms.",
    why="The most comprehensive menopause and hormone symptom tracker available. Covers things patients might not connect to hormones, like joint stiffness or brain fog.",
    patient_script="This covers a wide range of symptoms that can be related to hormones \u2014 even things you might not have connected, like joint stiffness or brain fog.",
)

assessment_card(story,
    name="Goal Setting (PGIC Baseline)",
    questions="1 open-text question \u2022 Everyone gets this at the end",
    description="\u201cWhat is your primary goal for this program?\u201d \u2014 the patient writes their answer in their own words.",
    why="The provider sees this first on the patient profile. It anchors the entire conversation and ensures the treatment plan aligns with what the patient actually wants.",
    patient_script="Just tell us in your own words what you\u2019re hoping to get out of this.",
)

# ═══════════════════════════════════════════════════════════
# SECTION 3 — WHAT TO TELL PATIENTS
# ═══════════════════════════════════════════════════════════
story += section_label("Section 3 \u2014 What to Tell Patients Who Ask")

story.append(Paragraph("Keep these responses in your back pocket:", note_s))
story.append(Spacer(1, 2))

qa_pairs = [
    ("\u201cWhy do I have to fill this out?\u201d",
     "\u201cIt helps your provider build a personalized plan before your visit. Instead of spending time asking questions, they already have your baseline data and can focus on solutions.\u201d"),
    ("\u201cThis seems really personal.\u201d",
     "\u201cYour answers are completely confidential and only visible to your provider. These are standard clinical tools used by doctors everywhere \u2014 they help us give you better care.\u201d"),
    ("\u201cDo I have to finish it all at once?\u201d",
     "\u201cNo \u2014 your progress saves automatically. You can close it and come back anytime using the same link.\u201d"),
    ("\u201cHow long does it take?\u201d",
     "\u201cAbout 5\u201310 minutes for most people. Some sections are shorter than others.\u201d"),
    ("\u201cWill I have to do this again?\u201d",
     "\u201cYes \u2014 we\u2019ll send a shorter follow-up at 6 weeks, 12 weeks, and 6 months. That\u2019s how we track your progress and make sure your treatment is working.\u201d"),
]

for q, a in qa_pairs:
    story.append(KeepTogether([
        Paragraph(q, quote_q_s),
        Paragraph(f"\u2192 {a}", quote_a_s),
    ]))

# ═══════════════════════════════════════════════════════════
# SECTION 4 — HOW TO SEND IT
# ═══════════════════════════════════════════════════════════
story += section_label("Section 4 \u2014 How to Send It")

story.append(Paragraph(
    "The questionnaire is included in the forms bundle. When sending forms to a patient:",
    body_s))
story.append(Spacer(1, 4))

step_data = [
    [Paragraph("Step 1:", tv_bold_s), Paragraph("Go to the patient\u2019s profile \u2192 click <b>Send Forms</b>", tv_s)],
    [Paragraph("Step 2:", tv_bold_s), Paragraph("Select <b>\u201cLabs + Questionnaire\u201d</b> preset (or manually check \u201cBaseline Questionnaire\u201d)", tv_s)],
    [Paragraph("Step 3:", tv_bold_s), Paragraph("The system automatically uses the patient\u2019s gender from their profile to show the right version (male vs. female instruments)", tv_s)],
    [Paragraph("Step 4:", tv_bold_s), Paragraph("Choose SMS or email \u2192 Send. Patient gets a single link with all their forms.", tv_s)],
]
step_tbl = Table(step_data, colWidths=[0.7*inch, 6.3*inch])
step_tbl.setStyle(TableStyle([
    ('TOPPADDING',    (0,0),(-1,-1), 3),
    ('BOTTOMPADDING', (0,0),(-1,-1), 3),
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
    "<b>Quick tip:</b> If a patient is coming in for HRT or Weight Loss, the \u201cHRT Patient\u201d and "
    "\u201cWeight Loss\u201d presets already include the questionnaire automatically. You don\u2019t need to add it separately.",
    note_s))

# Footer
story.append(Spacer(1, 12))
build_footer(story)
doc.build(story)
print(f"PDF generated: {OUTPUT_PATH}")
