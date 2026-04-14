#!/usr/bin/env python3
"""Generate 8.5x11 QR code flyer for Range Sports Therapy."""

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Image,
                                 Table, TableStyle, HRFlowable)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
import os

# --- Colors (v2 base template) ---
BLACK      = HexColor('#0A0A0A')
DARK_GRAY  = HexColor('#1A1A1A')
MID_GRAY   = HexColor('#606060')
LIGHT_GRAY = HexColor('#F4F4F4')
RULE_GRAY  = HexColor('#DDDDDD')
WHITE      = HexColor('#FFFFFF')

W = 7.0 * inch

def st(name, **kw):
    return ParagraphStyle(name, **kw)

# --- Styles (v2 base template) ---
clinic_s    = st('Clinic',   fontName='Helvetica-Bold',    fontSize=13,  textColor=BLACK,     leading=16)
contact_s   = st('Cont',     fontName='Helvetica',         fontSize=8,   textColor=MID_GRAY,  leading=12, alignment=TA_RIGHT)
title_s     = st('Title',    fontName='Helvetica-Bold',    fontSize=22,  textColor=BLACK,     leading=26, alignment=TA_CENTER, spaceAfter=2)
subtitle_s  = st('Sub',      fontName='Helvetica',         fontSize=10,  textColor=MID_GRAY,  leading=14, alignment=TA_CENTER)
sec_s       = st('Sec',      fontName='Helvetica-Bold',    fontSize=8,   textColor=MID_GRAY,  leading=11, spaceBefore=12, spaceAfter=3)
item_s      = st('Item',     fontName='Helvetica-Bold',    fontSize=10.5, textColor=DARK_GRAY, leading=14, spaceAfter=0)
item_desc_s = st('ItemD',    fontName='Helvetica',         fontSize=9,   textColor=MID_GRAY,  leading=12, spaceAfter=6)
scan_s      = st('Scan',     fontName='Helvetica-Bold',    fontSize=14,  textColor=BLACK,     leading=18, alignment=TA_CENTER, spaceBefore=8)
scan_sub_s  = st('ScanSub',  fontName='Helvetica',         fontSize=9,   textColor=MID_GRAY,  leading=12, alignment=TA_CENTER, spaceAfter=2)
foot_s      = st('Foot',     fontName='Helvetica-Oblique', fontSize=8,   textColor=MID_GRAY,  leading=12)
foot_bold_s = st('FootB',    fontName='Helvetica-Bold',    fontSize=8.5, textColor=DARK_GRAY, leading=12)
tv_s        = st('TV',       fontName='Helvetica',         fontSize=9.5, textColor=DARK_GRAY, leading=14)
tv_bold_s   = st('TVB',      fontName='Helvetica-Bold',    fontSize=9.5, textColor=BLACK,     leading=14)

# --- Helpers (v2 base template) ---
def section_label(text):
    return [
        Paragraph(text.upper(), sec_s),
        HRFlowable(width="100%", thickness=0.75, color=RULE_GRAY, spaceAfter=6),
    ]

def service_row(name, desc):
    """Two-column table row: bold name left, description right."""
    data = [[Paragraph(name, tv_bold_s), Paragraph(desc, tv_s)]]
    tbl = Table(data, colWidths=[2.4*inch, W - 2.4*inch])
    tbl.setStyle(TableStyle([
        ('TOPPADDING',    (0,0),(-1,-1), 5),
        ('BOTTOMPADDING', (0,0),(-1,-1), 5),
        ('LEFTPADDING',   (0,0),(-1,-1), 10),
        ('RIGHTPADDING',  (0,0),(-1,-1), 10),
        ('VALIGN',        (0,0),(-1,-1), 'TOP'),
        ('BACKGROUND',    (0,0),(-1,-1), LIGHT_GRAY),
        ('BOX',           (0,0),(-1,-1), 0.5, RULE_GRAY),
    ]))
    return tbl

def service_table(rows):
    """Multi-row table with alternating backgrounds."""
    data = [[Paragraph(n, tv_bold_s), Paragraph(d, tv_s)] for n, d in rows]
    tbl = Table(data, colWidths=[2.4*inch, W - 2.4*inch])
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
            "Range Medical is located upstairs at 1901 Westcliff Dr, Suite 10, "
            "Newport Beach. Walk-ins welcome or text us to schedule.",
            foot_s),
    ]], colWidths=[2.2*inch, 4.8*inch])
    tbl.setStyle(TableStyle([
        ('VALIGN',(0,0),(-1,-1),'TOP'),
        ('TOPPADDING',(0,0),(-1,-1),0),('BOTTOMPADDING',(0,0),(-1,-1),0),
        ('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),0),
    ]))
    story.append(tbl)

# --- Paths ---
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
QR_PATH = os.path.join(PROJECT_DIR, 'public', 'qr-sports-therapy.png')
OUTPUT_PATH = os.path.join(PROJECT_DIR, 'public', 'Range-Medical-Sports-Therapy-Flyer.pdf')

# --- Build document ---
doc = SimpleDocTemplate(
    OUTPUT_PATH,
    pagesize=letter,
    rightMargin=0.75*inch, leftMargin=0.75*inch,
    topMargin=0.65*inch,   bottomMargin=0.65*inch,
)

story = []
build_header(story)

# Title
story.append(Paragraph("Recover Faster. We\u2019re Right Upstairs.", title_s))
story.append(Paragraph(
    "Range Medical offers regenerative treatments that work alongside "
    "your PT and rehab to help you heal faster.",
    subtitle_s
))
story.append(Spacer(1, 10))

# Injury & Recovery
story += section_label("Injury & Recovery")
story.append(service_table([
    ("Peptide Therapy",          "BPC-157 / TB4 \u2014 accelerates tissue repair and reduces inflammation"),
    ("Toradol Injection",        "Fast-acting pain relief for acute injuries and flare-ups"),
    ("PRP Therapy",              "Your own platelets concentrated to support natural repair"),
    ("Exosome Therapy",          "Cell-signaling molecules that ramp up your body\u2019s repair"),
    ("Red Light Therapy",        "Full body \u2014 cellular repair and collagen production, 10\u201320 min sessions"),
]))
story.append(Spacer(1, 4))

# Energy & Optimization
story += section_label("Energy & Optimization")
story.append(service_table([
    ("Lab Panels",               "Comprehensive bloodwork to identify what\u2019s holding you back"),
    ("Hormone Optimization",     "Testosterone, thyroid, and metabolic balancing"),
    ("Weight Loss",              "Medical weight loss programs with GLP-1 and more"),
    ("IV Therapy & NAD+",        "Performance drips, recovery, and cellular energy"),
]))
story.append(Spacer(1, 8))

# QR Code section
story.append(Paragraph("Scan to See Everything We Offer", scan_s))
story.append(Paragraph("Or text us \u2014 the message is pre-filled, just hit send.", scan_sub_s))
story.append(Spacer(1, 6))

qr_img = Image(QR_PATH, width=1.6*inch, height=1.6*inch)
qr_img.hAlign = 'CENTER'
story.append(qr_img)
story.append(Spacer(1, 10))

build_footer(story)
doc.build(story)
print(f"Flyer saved to: {OUTPUT_PATH}")
