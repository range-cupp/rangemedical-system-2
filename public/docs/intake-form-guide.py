#!/usr/bin/env python3
"""Generate Range Medical Intake Form Staff Guide PDF."""

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
bullet2_s   = st('Bul2',   fontName='Helvetica',         fontSize=9,   textColor=MID_GRAY,  leading=14, leftIndent=28, firstLineIndent=-10, spaceAfter=1)
th_s        = st('TH',     fontName='Helvetica-Bold',    fontSize=8,   textColor=MID_GRAY,  leading=11)
tv_s        = st('TV',     fontName='Helvetica',         fontSize=9.5, textColor=DARK_GRAY, leading=14)
tv_bold_s   = st('TVB',    fontName='Helvetica-Bold',    fontSize=9.5, textColor=BLACK,     leading=14)
foot_s      = st('Foot',   fontName='Helvetica-Oblique', fontSize=8,   textColor=MID_GRAY,  leading=12)
foot_bold_s = st('FootB',  fontName='Helvetica-Bold',    fontSize=8.5, textColor=DARK_GRAY, leading=12)
note_s      = st('Note',   fontName='Helvetica-Oblique', fontSize=9,   textColor=MID_GRAY,  leading=13, spaceAfter=4)
callout_s   = st('Call',   fontName='Helvetica-Bold',    fontSize=9,   textColor=HexColor('#1a5276'), leading=14, spaceBefore=4, spaceAfter=4, leftIndent=10, borderPadding=6)

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
            "Do not distribute to patients. For questions, contact Chris.",
            foot_s),
    ]], colWidths=[2.2*inch, 4.8*inch])
    tbl.setStyle(TableStyle([
        ('VALIGN',(0,0),(-1,-1),'TOP'),
        ('TOPPADDING',(0,0),(-1,-1),0),('BOTTOMPADDING',(0,0),(-1,-1),0),
        ('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),0),
    ]))
    story.append(tbl)


# ── BUILD THE PDF ──────────────────────────────────────────
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "intake-form-guide.pdf")

doc = SimpleDocTemplate(
    OUTPUT_PATH,
    pagesize=letter,
    rightMargin=0.75*inch, leftMargin=0.75*inch,
    topMargin=0.65*inch,   bottomMargin=0.65*inch,
)
story = []
build_header(story)

# Title
story.append(Paragraph("MEDICAL INTAKE FORM GUIDE", title_s))
story.append(Paragraph("What It Collects, How It Works, and What\u2019s New \u2014 Staff Reference \u2014 Range Medical Newport Beach", subtitle_s))
story.append(Spacer(1, 14))

# ═══════════════════════════════════════════════════════════
# SECTION 1 — OVERVIEW
# ═══════════════════════════════════════════════════════════
story += section_label("Section 1 \u2014 Overview")

story.append(Paragraph(
    "The medical intake form is the first thing every new patient fills out. It collects their personal info, "
    "health history, medications, and \u2014 most importantly \u2014 what they\u2019re here for. "
    "It\u2019s a <b>5-step form</b> with a progress bar so it doesn\u2019t feel overwhelming.",
    body_s))
story.append(Spacer(1, 8))

story.append(info_table([
    ("How It\u2019s Sent",    "Part of the forms bundle via SMS or email (patient gets a single link)"),
    ("How Long It Takes",   "About 10 minutes"),
    ("Mobile-Friendly",     "Yes \u2014 most patients complete it on their phone"),
    ("Auto-Save",           "Progress saves on each step, so they won\u2019t lose anything if they close the browser"),
    ("Where Data Goes",     "Supabase (intakes table) + PDF generated and stored automatically"),
]))

# ═══════════════════════════════════════════════════════════
# SECTION 2 — THE 5 STEPS
# ═══════════════════════════════════════════════════════════
story.append(Spacer(1, 4))
story += section_label("Section 2 \u2014 The 5 Steps")

# ── STEP 1 ──
story.append(Paragraph("Step 1 \u2014 Personal Information", comp_s))
story.append(Paragraph("Basic contact info and demographics. Nothing unusual here.", note_s))
story.append(bullet("First name, last name, preferred name"))
story.append(bullet("Gender (Male / Female / Other)"))
story.append(bullet("Date of birth \u2014 slashes auto-fill as they type (10191981 becomes 10/19/1981)"))
story.append(bullet("Phone, email, full address"))
story.append(bullet("How they heard about us (dropdown with options like Instagram, Dr. G, walk-in, referral)"))
story.append(bullet("If referred by a friend \u2192 asks for the friend\u2019s name"))
story.append(bullet("Minor patient check \u2014 if under 18, collects guardian name and relationship"))

# ── STEP 2 ──
story.append(Spacer(1, 4))
story.append(Paragraph("Step 2 \u2014 Health Concerns &amp; Baseline Assessment", comp_s))
story.append(Paragraph("This is the most important step. It determines what services the patient needs and drives the rest of their experience.", note_s))

story.append(Paragraph("Goals / Reason for Visit (NEW)", sub_s))
story.append(Paragraph(
    "First question: <b>\u201cIn one sentence, what is the main reason you\u2019re coming in today?\u201d</b> "
    "Open text field. The provider sees this first on the patient profile \u2014 it anchors the entire conversation.",
    body_s))
story.append(Spacer(1, 6))

story.append(Paragraph("Door 1 \u2014 Injury &amp; Recovery", sub_s))
story.append(Paragraph(
    "Patient is asked: <b>\u201cAre you dealing with an injury?\u201d</b> If they select Yes, these fields appear:",
    body_s))
story.append(bullet("Injury description \u2014 \u201cWhat is your injury?\u201d"))
story.append(bullet("Injury location \u2014 \u201cWhere is it located?\u201d (e.g., lower back, right knee)"))
story.append(bullet("When it occurred \u2014 optional"))
story.append(Spacer(1, 4))
story.append(Paragraph(
    "<b>Plus 3 baseline assessment questions</b> (built right into the intake \u2014 no separate form needed):",
    body_s))
story.append(bullet("Pain severity \u2014 slider 0\u201310"))
story.append(bullet("Functional limitation \u2014 slider 0\u201310"))
story.append(bullet("Trajectory \u2014 Getting better / Staying the same / Getting worse"))
story.append(Spacer(1, 4))
story.append(Paragraph(
    "<i>These 3 scores become the baseline for tracking peptide treatment progress. "
    "The provider can compare these numbers at follow-up visits.</i>", note_s))

story.append(Spacer(1, 4))
story.append(Paragraph("Door 2 \u2014 Energy &amp; Optimization", sub_s))
story.append(Paragraph(
    "Patient is asked: <b>\u201cAre you interested in energy &amp; optimization?\u201d</b> "
    "If they select Yes, a symptom checklist appears with 9 categories. Each symptom has a smart follow-up question:",
    body_s))
story.append(Spacer(1, 4))

symptom_data = [
    [Paragraph("Symptom", th_s), Paragraph("Follow-Up Question", th_s)],
    [Paragraph("Brain fog", tv_s), Paragraph("\u201cDoes this affect your work or daily tasks?\u201d", tv_s)],
    [Paragraph("Fatigue / low energy", tv_s), Paragraph("\u201cWhen is your energy lowest?\u201d (morning, afternoon, evening, all day)", tv_s)],
    [Paragraph("Poor sleep", tv_s), Paragraph("\u201cWhat\u2019s your main sleep issue?\u201d (falling asleep, staying asleep, etc.)", tv_s)],
    [Paragraph("Weight gain", tv_s), Paragraph("\u201cHave diet and exercise changes helped?\u201d", tv_s)],
    [Paragraph("Low libido", tv_s), Paragraph("\u201cHave you had hormone levels checked before?\u201d (hidden for minors)", tv_s)],
    [Paragraph("Mood changes", tv_s), Paragraph("\u201cIs this new or has it been ongoing?\u201d", tv_s)],
    [Paragraph("Slow recovery", tv_s), Paragraph("\u201cHow long does soreness typically last?\u201d", tv_s)],
    [Paragraph("Muscle loss", tv_s), Paragraph("\u201cIs this happening even with regular exercise?\u201d", tv_s)],
    [Paragraph("Hair thinning", tv_s), Paragraph("\u201cWhere are you noticing it most?\u201d", tv_s)],
]
sym_tbl = Table(symptom_data, colWidths=[1.6*inch, 5.4*inch])
sym_tbl.setStyle(TableStyle([
    ('TOPPADDING',    (0,0),(-1,-1), 3),
    ('BOTTOMPADDING', (0,0),(-1,-1), 3),
    ('LEFTPADDING',   (0,0),(-1,-1), 6),
    ('RIGHTPADDING',  (0,0),(-1,-1), 6),
    ('VALIGN',        (0,0),(-1,-1), 'TOP'),
    ('BACKGROUND',    (0,0),(-1,0), LIGHT_GRAY),
    ('ROWBACKGROUNDS',(0,1),(-1,-1), [WHITE, LIGHT_GRAY]),
    ('BOX',           (0,0),(-1,-1), 0.5, RULE_GRAY),
    ('LINEBELOW',     (0,0),(-1,-1), 0.5, RULE_GRAY),
    ('LINEBEFORE',    (1,0),(1,-1), 0.5, RULE_GRAY),
]))
story.append(sym_tbl)

story.append(Spacer(1, 4))
story.append(Paragraph(
    "<b>Important:</b> Patients can select <b>both</b> doors. Someone with a knee injury who also wants hormone optimization "
    "will get the injury questions AND the symptom checklist. The system handles this seamlessly.",
    note_s))

story.append(Spacer(1, 4))
story.append(Paragraph(
    "The symptom selections from this step also drive which sections appear in the <b>Baseline Questionnaire</b> "
    "(the separate assessment sent as part of the labs bundle). For example, if a patient checks \u201clow libido,\u201d "
    "the questionnaire will include sexual health questions tailored to their gender.",
    body_s))

# ═══════════════════════════════════════════════════════════
# PAGE BREAK
# ═══════════════════════════════════════════════════════════
story.append(PageBreak())
build_header(story)

# ── STEP 3 ──
story.append(Paragraph("Step 3 \u2014 Medical History", comp_s))
story.append(Paragraph("Covers existing conditions, hospitalization, and family history.", note_s))

story.append(bullet("Primary care physician \u2014 yes/no, if yes asks for name"))
story.append(bullet("Hospitalized in past year \u2014 yes/no, if yes asks for reason"))
story.append(Spacer(1, 4))
story.append(Paragraph("Medical conditions \u2014 each is a simple Yes/No. If Yes, asks for year diagnosed and type where relevant:", body_s))
story.append(Spacer(1, 4))

cond_data = [
    [Paragraph("Category", th_s), Paragraph("Conditions", th_s)],
    [Paragraph("Cardiovascular", tv_bold_s), Paragraph("High blood pressure, high cholesterol, heart disease", tv_s)],
    [Paragraph("Metabolic", tv_bold_s), Paragraph("Diabetes (Type 1/2/Pre), thyroid disorder (Hypo/Hyper/Hashimoto\u2019s/Graves\u2019)", tv_s)],
    [Paragraph("Mental Health", tv_bold_s), Paragraph("Depression/anxiety, eating disorder", tv_s)],
    [Paragraph("Organ Health", tv_bold_s), Paragraph("Kidney disease, liver disease", tv_s)],
    [Paragraph("Immune &amp; Cancer", tv_bold_s), Paragraph("Autoimmune disorder (with type), cancer (with type)", tv_s)],
]
cond_tbl = Table(cond_data, colWidths=[1.4*inch, 5.6*inch])
cond_tbl.setStyle(TableStyle([
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
]))
story.append(cond_tbl)

story.append(Spacer(1, 6))
story.append(Paragraph("Family History Screening (required for GLP-1 safety):", sub_s))
story.append(bullet("Medullary Thyroid Cancer (MTC) \u2014 personal or family"))
story.append(bullet("Multiple Endocrine Neoplasia Type 2 (MEN2) \u2014 personal or family"))
story.append(bullet("\u201cNone of these apply\u201d option"))
story.append(Paragraph(
    "<i>This is a safety requirement for weight loss medications (semaglutide, tirzepatide). "
    "If a patient has MTC or MEN2 history, GLP-1s are contraindicated.</i>", note_s))

# ── STEP 4 ──
story.append(Spacer(1, 4))
story.append(Paragraph("Step 4 \u2014 Medications, Allergies &amp; Supplements", comp_s))
story.append(Paragraph("What they\u2019re currently taking and what they\u2019ve tried before.", note_s))

story.append(bullet("Currently on HRT? \u2014 if yes, asks for regimen details"))
story.append(Spacer(1, 2))
story.append(Paragraph("<b>Previous Therapy History (NEW)</b>", sub_s))
story.append(Paragraph(
    "\u201cHave you previously been on any hormone therapy, peptides, or weight loss medications?\u201d "
    "If yes: \u201cWhat did you take, and why did you stop?\u201d",
    body_s))
story.append(Paragraph(
    "<i>This is critical for providers. A patient who tried testosterone and stopped due to side effects "
    "is a very different conversation than a first-timer. Same for someone who was on semaglutide before.</i>", note_s))
story.append(Spacer(1, 4))

story.append(bullet("Current medications \u2014 yes/no, if yes asks for full list"))
story.append(Spacer(1, 2))
story.append(Paragraph("<b>Supplements Checklist (NEW)</b>", sub_s))
story.append(Paragraph(
    "Instead of asking patients to type out all their supplements (which nobody does completely), "
    "we give them a quick-tap checklist of the 14 most common supplements our patients take:",
    body_s))
story.append(Spacer(1, 4))

supp_data = [
    [Paragraph("Vitamin D", tv_s), Paragraph("B12 / B-Complex", tv_s), Paragraph("Magnesium", tv_s), Paragraph("Zinc", tv_s)],
    [Paragraph("DHEA", tv_s), Paragraph("Pregnenolone", tv_s), Paragraph("Fish Oil / Omega-3", tv_s), Paragraph("Creatine", tv_s)],
    [Paragraph("Collagen", tv_s), Paragraph("Probiotics", tv_s), Paragraph("Multivitamin", tv_s), Paragraph("Melatonin", tv_s)],
    [Paragraph("Ashwagandha", tv_s), Paragraph("Iron", tv_s), Paragraph("+ Other (text field)", tv_s), Paragraph("", tv_s)],
]
supp_tbl = Table(supp_data, colWidths=[1.75*inch, 1.75*inch, 1.75*inch, 1.75*inch])
supp_tbl.setStyle(TableStyle([
    ('TOPPADDING',    (0,0),(-1,-1), 4),
    ('BOTTOMPADDING', (0,0),(-1,-1), 4),
    ('LEFTPADDING',   (0,0),(-1,-1), 6),
    ('RIGHTPADDING',  (0,0),(-1,-1), 6),
    ('VALIGN',        (0,0),(-1,-1), 'TOP'),
    ('ROWBACKGROUNDS',(0,0),(-1,-1), [LIGHT_GRAY, WHITE]),
    ('BOX',           (0,0),(-1,-1), 0.5, RULE_GRAY),
    ('LINEBELOW',     (0,0),(-1,-2), 0.5, RULE_GRAY),
    ('LINEBEFORE',    (1,0),(1,-1), 0.5, RULE_GRAY),
    ('LINEBEFORE',    (2,0),(2,-1), 0.5, RULE_GRAY),
    ('LINEBEFORE',    (3,0),(3,-1), 0.5, RULE_GRAY),
]))
story.append(supp_tbl)

story.append(Spacer(1, 4))
story.append(Paragraph(
    "<i>Why a checklist instead of a text field: Patients are more likely to check boxes than type out every supplement. "
    "The provider sees it at a glance. The \u201cOther\u201d field catches anything unusual.</i>", note_s))

story.append(Spacer(1, 4))
story.append(bullet("Allergies \u2014 yes/no, if yes asks for list with reactions"))

# ── STEP 5 ──
story.append(Spacer(1, 4))
story.append(Paragraph("Step 5 \u2014 Emergency Contact, Photo ID &amp; Signature", comp_s))
story.append(Paragraph("Final step \u2014 wraps up with safety info and legal consent.", note_s))

story.append(bullet("Emergency contact \u2014 name, relationship, phone number"))
story.append(bullet("Photo ID upload \u2014 patient takes a photo or uploads an image of their ID"))
story.append(bullet("Signature \u2014 digital signature pad (draws with finger on phone)"))
story.append(bullet("Consent agreement \u2014 confirms information is accurate and authorizes care"))
story.append(bullet("For minors \u2014 signature label changes to \u201cParent/Guardian Signature\u201d"))

# ═══════════════════════════════════════════════════════════
# SECTION 3 — SMART LOGIC
# ═══════════════════════════════════════════════════════════
story.append(Spacer(1, 4))
story += section_label("Section 3 \u2014 Smart Logic (How the Form Adapts)")

story.append(Paragraph(
    "The form adapts based on what the patient selects. Patients only see what\u2019s relevant to them. "
    "Here\u2019s what triggers what:", body_s))
story.append(Spacer(1, 6))

logic_data = [
    [Paragraph("If the patient...", th_s), Paragraph("Then the form...", th_s)],
    [Paragraph("Selects \u201cYes\u201d to injury", tv_s), Paragraph("Shows injury details + 3 baseline pain/function questions", tv_s)],
    [Paragraph("Selects \u201cYes\u201d to optimization", tv_s), Paragraph("Shows the full symptom checklist with follow-up questions", tv_s)],
    [Paragraph("Selects both injury AND optimization", tv_s), Paragraph("Shows everything \u2014 injury section + symptom checklist", tv_s)],
    [Paragraph("Is under 18 (minor)", tv_s), Paragraph("Adds guardian fields, hides libido question, changes signature label", tv_s)],
    [Paragraph("Says \u201cYes\u201d to any medical condition", tv_s), Paragraph("Expands to ask for year diagnosed and type", tv_s)],
    [Paragraph("Was referred by a friend", tv_s), Paragraph("Asks for the friend\u2019s name", tv_s)],
    [Paragraph("Says \u201cYes\u201d to previous therapy", tv_s), Paragraph("Asks what they took and why they stopped", tv_s)],
]
logic_tbl = Table(logic_data, colWidths=[2.8*inch, 4.2*inch])
logic_tbl.setStyle(TableStyle([
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
]))
story.append(logic_tbl)

# ═══════════════════════════════════════════════════════════
# SECTION 4 — WHAT'S NEW
# ═══════════════════════════════════════════════════════════
story.append(Spacer(1, 4))
story += section_label("Section 4 \u2014 What\u2019s New (Recently Added)")

story.append(Paragraph("Three new features were added to give providers better data before the first visit:", body_s))
story.append(Spacer(1, 6))

new_data = [
    [Paragraph("Feature", th_s), Paragraph("What It Does", th_s), Paragraph("Why It Matters", th_s)],
    [Paragraph("Goals / Reason for Visit", tv_bold_s),
     Paragraph("Open text: \u201cWhat\u2019s the main reason you\u2019re coming in?\u201d", tv_s),
     Paragraph("Provider sees this first. Anchors the conversation.", tv_s)],
    [Paragraph("Previous Therapy History", tv_bold_s),
     Paragraph("Yes/No + details on what they took and why they stopped", tv_s),
     Paragraph("Knowing they tried testosterone before changes the whole approach.", tv_s)],
    [Paragraph("Supplements Checklist", tv_bold_s),
     Paragraph("14-item checkbox grid + \u201cOther\u201d text field", tv_s),
     Paragraph("Providers see at a glance what they\u2019re already taking. Affects lab interpretation.", tv_s)],
    [Paragraph("Injury Baseline (3 questions)", tv_bold_s),
     Paragraph("Pain slider, function slider, trajectory \u2014 built into intake", tv_s),
     Paragraph("Baseline scores for peptide patients. No separate form needed.", tv_s)],
]
new_tbl = Table(new_data, colWidths=[1.6*inch, 2.8*inch, 2.6*inch])
new_tbl.setStyle(TableStyle([
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
story.append(new_tbl)

# ═══════════════════════════════════════════════════════════
# SECTION 5 — WHAT HAPPENS AFTER SUBMISSION
# ═══════════════════════════════════════════════════════════
story.append(Spacer(1, 4))
story += section_label("Section 5 \u2014 What Happens After Submission")

story.append(Paragraph("When the patient hits submit, the system automatically:", body_s))
story.append(Spacer(1, 4))
story.append(bullet("Saves all data to Supabase (the database)"))
story.append(bullet("Generates a PDF of the completed intake"))
story.append(bullet("Stores the PDF in the patient\u2019s profile"))
story.append(bullet("If part of a form bundle \u2192 redirects to the next form (consent, questionnaire, etc.)"))
story.append(bullet("If standalone \u2192 shows a thank-you screen"))
story.append(Spacer(1, 6))
story.append(Paragraph(
    "The provider can view all intake data on the patient\u2019s profile in the admin system \u2014 "
    "goals, symptoms, medical history, supplements, injury baseline scores, and the full PDF.",
    body_s))

# Footer
story.append(Spacer(1, 16))
build_footer(story)
doc.build(story)
print(f"PDF generated: {OUTPUT_PATH}")
