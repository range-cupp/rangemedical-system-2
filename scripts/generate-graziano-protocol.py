#!/usr/bin/env python3
"""Generate personalized treatment protocol PDF for Erick Graziano."""

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
            "This document is intended for Range Medical patients only and is not a substitute "
            "for personalized medical advice. Do not adjust your dose without consulting your provider.",
            foot_s),
    ]], colWidths=[2.2*inch, 4.8*inch])
    tbl.setStyle(TableStyle([
        ('VALIGN',(0,0),(-1,-1),'TOP'),
        ('TOPPADDING',(0,0),(-1,-1),0),('BOTTOMPADDING',(0,0),(-1,-1),0),
        ('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),0),
    ]))
    story.append(tbl)

def schedule_table(days_labels, compounds):
    """Build a weekly schedule table.
    days_labels: list of 7 day labels ['Mon','Tue',...]
    compounds: list of dicts with 'label' and 'days' (list of 0-6 indices that are active)
    """
    header = [Paragraph("", th_s)] + [Paragraph(d, th_s) for d in days_labels]
    rows = [header]
    for comp in compounds:
        row = [Paragraph(comp['label'], tv_bold_s)]
        for i in range(7):
            if i in comp['days']:
                row.append(Paragraph("\u2713 " + comp.get('action', 'Inject'), check_s))
            else:
                row.append(Paragraph("\u2014", rest_s))
        rows.append(row)

    col0 = 1.4 * inch
    day_col = (W - col0) / 7
    col_widths = [col0] + [day_col] * 7

    tbl = Table(rows, colWidths=col_widths)
    tbl.setStyle(TableStyle([
        ('TOPPADDING',    (0,0),(-1,-1), 5),
        ('BOTTOMPADDING', (0,0),(-1,-1), 5),
        ('LEFTPADDING',   (0,0),(-1,-1), 4),
        ('RIGHTPADDING',  (0,0),(-1,-1), 4),
        ('VALIGN',        (0,0),(-1,-1), 'MIDDLE'),
        ('BACKGROUND',    (0,0),(-1,0), LIGHT_GRAY),
        ('BOX',           (0,0),(-1,-1), 0.5, RULE_GRAY),
        ('LINEBELOW',     (0,0),(-1,-1), 0.5, RULE_GRAY),
        ('LINEBEFORE',    (1,0),(1,-1), 0.5, RULE_GRAY),
    ]))
    return tbl

def timeline_table(rows_data):
    """Build a timeline table with Phase, Timeframe, Details columns."""
    header = [
        Paragraph("Phase", th_s),
        Paragraph("Timeframe", th_s),
        Paragraph("What to Expect", th_s),
    ]
    rows = [header]
    for phase, timeframe, details in rows_data:
        rows.append([
            Paragraph(phase, tv_bold_s),
            Paragraph(timeframe, tv_s),
            Paragraph(details, tv_s),
        ])
    tbl = Table(rows, colWidths=[1.0*inch, 1.4*inch, 4.6*inch])
    tbl.setStyle(TableStyle([
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
    return tbl


# ── BUILD THE PDF ────────────────────────────────────────────────

OUTPUT_PATH = "public/docs/erick-graziano-protocol.pdf"
PATIENT_NAME = "Erick Graziano"
ISSUE_DATE = "March 31, 2026"

doc = SimpleDocTemplate(
    OUTPUT_PATH,
    pagesize=letter,
    rightMargin=0.75*inch, leftMargin=0.75*inch,
    topMargin=0.65*inch,   bottomMargin=0.65*inch,
)
story = []
build_header(story)

# Title
story.append(Paragraph("PERSONALIZED TREATMENT PROTOCOL", title_s))
story.append(Paragraph("HRT + Peptide Therapy \u2014 Hormone Optimization &amp; GH Secretagogue", subtitle_s))
story.append(Spacer(1, 14))

# ── Patient Information ──────────────────────────────────────────
story += section_label("Patient Information")
story.append(info_table([
    ("Patient Name",         PATIENT_NAME),
    ("Plan Issued",          ISSUE_DATE),
    ("Prescribing Provider", "Dr. Burgess, Range Medical"),
    ("Protocol Type",        "HRT + Peptide Therapy"),
]))
story.append(Spacer(1, 6))

# ── Protocol Overview ────────────────────────────────────────────
story += section_label("Protocol Overview")
story.append(info_table([
    ("Compound #1",    "Testosterone Cypionate 200mg/mL"),
    ("Dose",           "0.3mL (60mg) per injection"),
    ("Frequency",      "Twice per week (e.g., Monday &amp; Thursday)"),
    ("Supply",         "10mL vial (multi-dose)"),
    ("Duration",       "Ongoing \u2014 vial yields approx. 16 weeks at current dose"),
    ("Compound #2",    "2X Blend: Tesamorelin / Ipamorelin"),
    ("Dose",           "1mg per injection"),
    ("Frequency",      "Monday \u2013 Friday (5 on / 2 off)"),
    ("Duration",       "30 days per vial \u2014 up to 90-day cycle"),
    ("Cycle",          "90 days on / 28 days off"),
], col1=1.6*inch))
story.append(Spacer(1, 6))

# ══════════════════════════════════════════════════════════════════
# COMPOUND 1 \u2014 TESTOSTERONE CYPIONATE
# ══════════════════════════════════════════════════════════════════
story += section_label("Compound 1 \u2014 Testosterone Cypionate")

story.append(Paragraph("What It Is", sub_s))
story.append(Paragraph(
    "Testosterone Cypionate is a bio-identical form of testosterone delivered via intramuscular "
    "injection. It is the gold-standard hormone replacement for men with low or suboptimal testosterone "
    "levels, supporting energy, body composition, mood, libido, and overall vitality.",
    body_s))
story.append(Spacer(1, 6))

story.append(Paragraph("Administration", sub_s))
story.append(Paragraph(
    "Intramuscular injection \u2014 0.3mL drawn from the 10mL vial, injected twice per week "
    "(e.g., Monday and Thursday). Rotate injection sites between the deltoid and gluteal muscles. "
    "Total weekly dose: 0.6mL (120mg).",
    body_s))
story.append(Spacer(1, 6))

story.append(Paragraph("Vial Supply Details", sub_s))
story.append(info_table([
    ("Vial Size",        "10mL (200mg/mL)"),
    ("Total Content",    "2,000mg testosterone cypionate"),
    ("Per Injection",    "0.3mL = 60mg"),
    ("Injections / Week","2 (total 0.6mL / 120mg per week)"),
    ("Injections / Vial","~33 injections"),
    ("Vial Duration",    "~16 weeks"),
], col1=1.8*inch))
story.append(Spacer(1, 6))

story.append(Paragraph("Expected Benefits", sub_s))
story.append(bullet("Increased energy, motivation, and mental clarity"))
story.append(bullet("Improved lean muscle mass and reduced body fat"))
story.append(bullet("Enhanced libido and sexual performance"))
story.append(bullet("Better mood stability and reduced irritability"))
story.append(bullet("Improved sleep quality and recovery"))
story.append(bullet("Greater bone density and cardiovascular markers over time"))
story.append(Spacer(1, 6))

story.append(Paragraph("Timeline \u2014 What to Expect", sub_s))
story.append(timeline_table([
    ("Phase 1", "Weeks 1\u20134",  "Energy and mood improvements begin. Sleep quality may improve. Some patients notice increased libido."),
    ("Phase 2", "Weeks 4\u20138",  "Noticeable changes in body composition \u2014 increased lean mass, reduced body fat. Strength and recovery improve."),
    ("Phase 3", "Weeks 8\u201312", "Full benefits realized. Stable energy, improved confidence, optimal body composition trajectory."),
    ("Ongoing", "12+ weeks",       "Maintenance phase. Labs rechecked at 8\u201312 weeks to confirm levels are dialed in."),
]))
story.append(Spacer(1, 6))

story.append(Paragraph("Side Effects to Watch For", sub_s))
story.append(bullet("Mild soreness or redness at injection site (normal, resolves in 24\u201348 hours)"))
story.append(bullet("Acne or oily skin (usually transient, resolves as levels stabilize)"))
story.append(bullet("Elevated hematocrit \u2014 monitored via follow-up labs"))
story.append(bullet("Mood changes during initial adjustment period"))
story.append(bullet("Contact Range Medical if you experience significant swelling, shortness of breath, or persistent pain"))
story.append(Spacer(1, 10))

# ══════════════════════════════════════════════════════════════════
# COMPOUND 2 \u2014 2X BLEND: TESAMORELIN / IPAMORELIN
# ══════════════════════════════════════════════════════════════════
story += section_label("Compound 2 \u2014 2X Blend: Tesamorelin / Ipamorelin")

story.append(Paragraph("What It Is", sub_s))
story.append(Paragraph(
    "The 2X Blend combines Tesamorelin and Ipamorelin \u2014 two growth hormone secretagogue peptides "
    "that work synergistically to stimulate your body\u2019s natural production of growth hormone. Unlike "
    "synthetic HGH, these peptides signal your pituitary gland to release GH in natural pulsatile "
    "patterns, optimizing recovery, body composition, and cellular repair.",
    body_s))
story.append(Spacer(1, 6))

story.append(Paragraph("Administration", sub_s))
story.append(Paragraph(
    "Subcutaneous injection at bedtime \u2014 1mg per injection, Monday through Friday (5 on / 2 off). "
    "Inject into the lower abdomen, rotating sides nightly. Administer on an empty stomach (at least "
    "2 hours after eating) for optimal GH release.",
    body_s))
story.append(Spacer(1, 6))

story.append(Paragraph("Vial &amp; Cycle Details", sub_s))
story.append(info_table([
    ("Dose per Injection", "1mg"),
    ("Frequency",          "5 days on / 2 days off (Mon\u2013Fri)"),
    ("Vial Supply",        "30-day supply per vial"),
    ("Cycle Length",       "Up to 90 days (3 vials)"),
    ("Off Cycle",          "28 days off after completing 90-day cycle"),
    ("Reconstitution",     "Reconstitute with 2mL bacteriostatic water"),
], col1=1.8*inch))
story.append(Spacer(1, 6))

story.append(Paragraph("Expected Benefits", sub_s))
story.append(bullet("Enhanced fat metabolism \u2014 particularly visceral (abdominal) fat reduction"))
story.append(bullet("Improved muscle recovery and lean body mass"))
story.append(bullet("Deeper, more restorative sleep"))
story.append(bullet("Faster healing and tissue repair"))
story.append(bullet("Improved skin elasticity and collagen production"))
story.append(bullet("Cognitive clarity and anti-aging benefits at the cellular level"))
story.append(Spacer(1, 6))

story.append(Paragraph("Timeline \u2014 What to Expect", sub_s))
story.append(timeline_table([
    ("Phase 1", "Weeks 1\u20134",  "Improved sleep quality is typically the first benefit noticed. Subtle energy improvements and faster workout recovery."),
    ("Phase 2", "Weeks 4\u20138",  "Fat loss becomes noticeable, especially in the midsection. Skin quality improves. Recovery continues to accelerate."),
    ("Phase 3", "Weeks 8\u201312", "Full optimization \u2014 significant body composition changes, sustained energy, deep sleep, and overall vitality improvement."),
]))
story.append(Spacer(1, 6))

story.append(Paragraph("Side Effects to Watch For", sub_s))
story.append(bullet("Mild redness or itching at injection site (common, resolves quickly)"))
story.append(bullet("Temporary water retention during first 1\u20132 weeks"))
story.append(bullet("Tingling or numbness in hands (indicates GH response \u2014 typically mild and transient)"))
story.append(bullet("Increased hunger in some patients"))
story.append(bullet("Contact Range Medical if you experience joint pain or persistent swelling"))
story.append(Spacer(1, 10))

# ── Your Weekly Schedule ─────────────────────────────────────────
story += section_label("Your Weekly Schedule")
story.append(Paragraph(
    "Below is your combined weekly injection schedule. Testosterone is injected twice per week "
    "(intramuscular). Tesa/Ipa is injected Monday through Friday at bedtime (subcutaneous).",
    body_s))
story.append(Spacer(1, 8))

days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
story.append(schedule_table(days, [
    {'label': 'Testosterone\n(0.3mL IM)', 'days': [0, 3], 'action': 'Inject'},
    {'label': 'Tesa/Ipa\n(1mg SubQ)', 'days': [0, 1, 2, 3, 4], 'action': 'Bedtime'},
]))
story.append(Spacer(1, 4))
story.append(Paragraph(
    "\u2713 = active injection day  |  \u2014 = rest day",
    note_s))
story.append(Spacer(1, 10))

# ── General Recommendations ──────────────────────────────────────
story += section_label("General Recommendations")
story.append(bullet("<b>Protein intake:</b> Aim for 1g per pound of body weight daily to maximize muscle synthesis"))
story.append(bullet("<b>Hydration:</b> Drink at least half your body weight in ounces of water daily"))
story.append(bullet("<b>Training:</b> Resistance training 3\u20135x per week to amplify testosterone and GH benefits"))
story.append(bullet("<b>Sleep:</b> 7\u20139 hours nightly \u2014 critical for GH release (especially with Tesa/Ipa at bedtime)"))
story.append(bullet("<b>Alcohol:</b> Minimize consumption \u2014 alcohol suppresses testosterone production and GH secretion"))
story.append(bullet("<b>Missed injection (Testosterone):</b> If you miss a dose, take it as soon as you remember. Do not double up."))
story.append(bullet("<b>Missed injection (Tesa/Ipa):</b> Skip the missed dose and resume the next scheduled evening. Do not double up."))
story.append(bullet("<b>Storage:</b> Store testosterone vial at room temperature. Store reconstituted Tesa/Ipa in the refrigerator."))
story.append(Spacer(1, 14))

# ── Footer ───────────────────────────────────────────────────────
build_footer(story)
doc.build(story)
print(f"PDF generated: {OUTPUT_PATH}")
