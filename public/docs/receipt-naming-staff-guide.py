#!/usr/bin/env python3
"""Generate staff guide PDF for the new receipt naming system."""

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
BLUE       = HexColor('#1E40AF')

W = 7.0 * inch

def st(name, **kw):
    return ParagraphStyle(name, **kw)

clinic_s    = st('Clinic', fontName='Helvetica-Bold',    fontSize=13,  textColor=BLACK,     leading=16)
contact_s   = st('Cont',   fontName='Helvetica',         fontSize=8,   textColor=MID_GRAY,  leading=12, alignment=TA_RIGHT)
title_s     = st('Title',  fontName='Helvetica-Bold',    fontSize=17,  textColor=BLACK,     leading=21, spaceAfter=2)
subtitle_s  = st('Sub',    fontName='Helvetica-Oblique', fontSize=9.5, textColor=MID_GRAY,  leading=13)
sec_s       = st('Sec',    fontName='Helvetica-Bold',    fontSize=8,   textColor=MID_GRAY,  leading=11, spaceBefore=16, spaceAfter=3)
body_s      = st('Body',   fontName='Helvetica',         fontSize=9.5, textColor=DARK_GRAY, leading=16, spaceAfter=0)
bullet_s    = st('Bul',    fontName='Helvetica',         fontSize=9.5, textColor=DARK_GRAY, leading=16, leftIndent=14, firstLineIndent=-10, spaceAfter=2)
th_s        = st('TH',     fontName='Helvetica-Bold',    fontSize=8,   textColor=MID_GRAY,  leading=11)
tv_s        = st('TV',     fontName='Helvetica',         fontSize=9.5, textColor=DARK_GRAY, leading=14)
tv_bold_s   = st('TVB',    fontName='Helvetica-Bold',    fontSize=9.5, textColor=BLACK,     leading=14)
note_s      = st('Note',   fontName='Helvetica-Oblique', fontSize=9,   textColor=MID_GRAY,  leading=13, spaceAfter=4)
foot_s      = st('Foot',   fontName='Helvetica-Oblique', fontSize=8,   textColor=MID_GRAY,  leading=12)
foot_bold_s = st('FootB',  fontName='Helvetica-Bold',    fontSize=8.5, textColor=DARK_GRAY, leading=12)
comp_s      = st('Comp',   fontName='Helvetica-Bold',    fontSize=12,  textColor=BLACK,     leading=15, spaceBefore=10, spaceAfter=4)
sub_s       = st('SubH',   fontName='Helvetica-Bold',    fontSize=9.5, textColor=BLACK,     leading=13, spaceBefore=8,  spaceAfter=3)

green_s     = st('Green',  fontName='Helvetica-Bold',    fontSize=9.5, textColor=GREEN,     leading=14)
blue_s      = st('Blue',   fontName='Helvetica-Bold',    fontSize=9.5, textColor=BLUE,      leading=14)

def section_label(text):
    return [
        Paragraph(text.upper(), sec_s),
        HRFlowable(width="100%", thickness=0.75, color=RULE_GRAY, spaceAfter=8),
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
    story.append(HRFlowable(width="100%", thickness=1.5, color=BLACK, spaceAfter=12))

def build_footer(story):
    story.append(HRFlowable(width="100%", thickness=0.5, color=RULE_GRAY, spaceAfter=8))
    tbl = Table([[
        Paragraph("<b>Questions?</b><br/>Call or text: (949) 997-3988<br/>range-medical.com", foot_bold_s),
        Paragraph(
            "This document is for Range Medical staff only. "
            "Do not distribute to patients.",
            foot_s),
    ]], colWidths=[2.2*inch, 4.8*inch])
    tbl.setStyle(TableStyle([
        ('VALIGN',(0,0),(-1,-1),'TOP'),
        ('TOPPADDING',(0,0),(-1,-1),0),('BOTTOMPADDING',(0,0),(-1,-1),0),
        ('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),0),
    ]))
    story.append(tbl)


OUTPUT_PATH = "public/docs/receipt-naming-staff-guide.pdf"

doc = SimpleDocTemplate(
    OUTPUT_PATH,
    pagesize=letter,
    rightMargin=0.75*inch, leftMargin=0.75*inch,
    topMargin=0.65*inch,   bottomMargin=0.65*inch,
)
story = []
build_header(story)

# Title
story.append(Paragraph("RECEIPT &amp; INVOICE NAMING GUIDE", title_s))
story.append(Paragraph("Staff reference \u2014 Updated March 2026", subtitle_s))
story.append(Spacer(1, 14))

# ── WHY THIS CHANGED ──
story += section_label("Why This Changed")
story.append(Paragraph(
    "Patient receipts and invoices previously showed specific medication names and dosages "
    "(e.g., \u201cTirzepatide \u2014 Monthly \u2014 2.5 mg/week\u201d). Because these are patient-facing "
    "documents that may be seen by others, we now use generic program names to protect "
    "patient health information (PHI). This applies to both POS receipts and invoices \u2014 "
    "all internal records, admin views, and protocol tracking remain unchanged.",
    body_s))
story.append(Spacer(1, 10))

# ── WHAT PATIENTS SEE ──
story += section_label("What Patients See on Receipts &amp; Invoices")

# Weight Loss table
story.append(Paragraph("Weight Loss", comp_s))
story.append(Paragraph(
    "All weight loss purchases \u2014 regardless of medication, dose, or duration \u2014 appear as:",
    body_s))
story.append(Spacer(1, 4))

wl_data = [
    [Paragraph("POS Item (What You Ring Up)", th_s), Paragraph("Receipt / Invoice Shows", th_s)],
    [Paragraph("Semaglutide \u2014 Monthly \u2014 4 mg/week x2", tv_s), Paragraph("Weight Loss Program", green_s)],
    [Paragraph("Tirzepatide \u2014 Monthly \u2014 10 mg/week x4", tv_s), Paragraph("Weight Loss Program", green_s)],
    [Paragraph("Retatrutide \u2014 Weekly \u2014 2 mg", tv_s), Paragraph("Weight Loss Program", green_s)],
]
wl_tbl = Table(wl_data, colWidths=[3.8*inch, 3.2*inch])
wl_tbl.setStyle(TableStyle([
    ('TOPPADDING',    (0,0),(-1,-1), 5),
    ('BOTTOMPADDING', (0,0),(-1,-1), 5),
    ('LEFTPADDING',   (0,0),(-1,-1), 10),
    ('RIGHTPADDING',  (0,0),(-1,-1), 10),
    ('VALIGN',        (0,0),(-1,-1), 'TOP'),
    ('ROWBACKGROUNDS',(0,1),(-1,-1), [LIGHT_GRAY, WHITE]),
    ('BOX',           (0,0),(-1,-1), 0.5, RULE_GRAY),
    ('LINEBELOW',     (0,0),(-1,-1), 0.5, RULE_GRAY),
]))
story.append(wl_tbl)
story.append(Spacer(1, 12))

# Recovery Peptides table
story.append(Paragraph("Injury &amp; Recovery Peptides", comp_s))
story.append(Paragraph(
    "Peptides used for injury recovery \u2014 BPC-157, TB-500, Thymosin Beta-4, KPV, and MGF \u2014 "
    "show the protocol type and duration without the specific peptide name:",
    body_s))
story.append(Spacer(1, 4))

rp_data = [
    [Paragraph("POS Item", th_s), Paragraph("Receipt / Invoice Shows", th_s)],
    [Paragraph("Peptide Protocol \u2014 10 Day \u2014 BPC-157 (500mcg)", tv_s), Paragraph("Injury &amp; Recovery Protocol \u2014 10 Day", green_s)],
    [Paragraph("Peptide Protocol \u2014 20 Day \u2014 BPC-157 + Thymosin Beta-4", tv_s), Paragraph("Injury &amp; Recovery Protocol \u2014 20 Day", green_s)],
    [Paragraph("Peptide Protocol \u2014 30 Day \u2014 BPC-157 / TB-500 / KPV / MGF", tv_s), Paragraph("Injury &amp; Recovery Protocol \u2014 30 Day", green_s)],
]
rp_tbl = Table(rp_data, colWidths=[3.8*inch, 3.2*inch])
rp_tbl.setStyle(TableStyle([
    ('TOPPADDING',    (0,0),(-1,-1), 5),
    ('BOTTOMPADDING', (0,0),(-1,-1), 5),
    ('LEFTPADDING',   (0,0),(-1,-1), 10),
    ('RIGHTPADDING',  (0,0),(-1,-1), 10),
    ('VALIGN',        (0,0),(-1,-1), 'TOP'),
    ('ROWBACKGROUNDS',(0,1),(-1,-1), [LIGHT_GRAY, WHITE]),
    ('BOX',           (0,0),(-1,-1), 0.5, RULE_GRAY),
    ('LINEBELOW',     (0,0),(-1,-1), 0.5, RULE_GRAY),
]))
story.append(rp_tbl)
story.append(Spacer(1, 12))

# Energy & Optimization Peptides table
story.append(Paragraph("Energy &amp; Optimization Peptides", comp_s))
story.append(Paragraph(
    "All other peptide protocols \u2014 growth hormone blends, MOTS-C, GHK-Cu, GLOW, NAD+, and more \u2014 "
    "appear under the Energy &amp; Optimization label:",
    body_s))
story.append(Spacer(1, 4))

eo_data = [
    [Paragraph("POS Item", th_s), Paragraph("Receipt / Invoice Shows", th_s)],
    [Paragraph("Peptide Protocol \u2014 30 Day \u2014 2X Blend (2mg \u00d7 20 inj)", tv_s), Paragraph("Energy &amp; Optimization Protocol \u2014 30 Day", blue_s)],
    [Paragraph("Peptide Protocol \u2014 30 Day \u2014 3X Blend (3mg \u00d7 20 inj)", tv_s), Paragraph("Energy &amp; Optimization Protocol \u2014 30 Day", blue_s)],
    [Paragraph("Peptide Protocol \u2014 20 Day \u2014 MOTS-C (5mg)", tv_s), Paragraph("Energy &amp; Optimization Protocol \u2014 20 Day", blue_s)],
    [Paragraph("Peptide Protocol \u2014 30 Day \u2014 GHK-Cu (2mg daily)", tv_s), Paragraph("Energy &amp; Optimization Protocol \u2014 30 Day", blue_s)],
    [Paragraph("NAD+ 100mg Protocol \u2014 12 Week", tv_s), Paragraph("Energy &amp; Optimization Protocol", blue_s)],
]
eo_tbl = Table(eo_data, colWidths=[3.8*inch, 3.2*inch])
eo_tbl.setStyle(TableStyle([
    ('TOPPADDING',    (0,0),(-1,-1), 5),
    ('BOTTOMPADDING', (0,0),(-1,-1), 5),
    ('LEFTPADDING',   (0,0),(-1,-1), 10),
    ('RIGHTPADDING',  (0,0),(-1,-1), 10),
    ('VALIGN',        (0,0),(-1,-1), 'TOP'),
    ('ROWBACKGROUNDS',(0,1),(-1,-1), [LIGHT_GRAY, WHITE]),
    ('BOX',           (0,0),(-1,-1), 0.5, RULE_GRAY),
    ('LINEBELOW',     (0,0),(-1,-1), 0.5, RULE_GRAY),
]))
story.append(eo_tbl)
story.append(Spacer(1, 14))

# ── WHAT DOESN'T CHANGE ──
story += section_label("What Doesn\u2019t Change")
story.append(bullet("The admin dashboard still shows the full medication name and dosage"))
story.append(bullet("Protocols are still created automatically with the correct peptide details"))
story.append(bullet("Staff can still see the exact item in the Purchases tab and Invoices tab"))
story.append(bullet("HBOT, IV Therapy, Red Light, Labs, and Injections are not affected \u2014 these show their normal names"))
story.append(bullet("Vial purchases follow the same rules (recovery vs. energy &amp; optimization)"))
story.append(bullet("Applies to both POS receipts and invoices \u2014 any patient-facing document"))
story.append(Spacer(1, 10))

# ── QUICK REFERENCE ──
story += section_label("Quick Reference")

qr_data = [
    [Paragraph("Category", th_s), Paragraph("Patient Sees", th_s), Paragraph("Example Meds", th_s)],
    [Paragraph("Weight Loss", tv_bold_s), Paragraph("Weight Loss Program", tv_s), Paragraph("Semaglutide, Tirzepatide, Retatrutide", tv_s)],
    [Paragraph("Recovery Peptides", tv_bold_s), Paragraph("Injury &amp; Recovery Protocol", tv_s), Paragraph("BPC-157, TB-500, Thymosin Beta-4, KPV, MGF", tv_s)],
    [Paragraph("GH Peptides", tv_bold_s), Paragraph("Energy &amp; Optimization Protocol", tv_s), Paragraph("2X/3X/4X Blends, CJC, Tesamorelin, Ipamorelin", tv_s)],
    [Paragraph("Other Peptides", tv_bold_s), Paragraph("Energy &amp; Optimization Protocol", tv_s), Paragraph("MOTS-C, GHK-Cu, GLOW, NAD+, Epitalon, SS-31", tv_s)],
    [Paragraph("HRT", tv_bold_s), Paragraph("<i>No change \u2014 shows as-is</i>", tv_s), Paragraph("Testosterone Cypionate", tv_s)],
    [Paragraph("Everything Else", tv_bold_s), Paragraph("<i>No change \u2014 shows as-is</i>", tv_s), Paragraph("HBOT, IV, RLT, Labs, Injections", tv_s)],
]
qr_tbl = Table(qr_data, colWidths=[1.6*inch, 2.4*inch, 3.0*inch])
qr_tbl.setStyle(TableStyle([
    ('TOPPADDING',    (0,0),(-1,-1), 5),
    ('BOTTOMPADDING', (0,0),(-1,-1), 5),
    ('LEFTPADDING',   (0,0),(-1,-1), 8),
    ('RIGHTPADDING',  (0,0),(-1,-1), 8),
    ('VALIGN',        (0,0),(-1,-1), 'TOP'),
    ('ROWBACKGROUNDS',(0,1),(-1,-1), [LIGHT_GRAY, WHITE]),
    ('BOX',           (0,0),(-1,-1), 0.5, RULE_GRAY),
    ('LINEBELOW',     (0,0),(-1,-1), 0.5, RULE_GRAY),
]))
story.append(qr_tbl)
story.append(Spacer(1, 14))

# ── STAFF ACTION ──
story += section_label("What Staff Need To Do")
story.append(Paragraph(
    "Nothing. This is fully automatic. When you ring up a purchase in the POS or create an invoice, "
    "the system generates the correct display name behind the scenes. You select the specific medication "
    "and dosage as usual \u2014 the patient just sees the generic program name on their receipt, invoice, "
    "and payment page.",
    body_s))
story.append(Spacer(1, 6))
story.append(Paragraph(
    "If a patient asks what their receipt or invoice means, you can explain that we use program-level "
    "names for privacy. Their specific treatment details are always available in their patient portal "
    "and protocol documents.",
    note_s))

story.append(Spacer(1, 20))
build_footer(story)
doc.build(story)
print(f"PDF generated: {OUTPUT_PATH}")
