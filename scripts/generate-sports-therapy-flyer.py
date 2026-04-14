#!/usr/bin/env python3
"""Generate 8.5x11 QR code flyer for Range Sports Therapy."""

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Image,
                                 HRFlowable)
from reportlab.lib.enums import TA_CENTER
import os

# Colors
BLACK      = HexColor('#0A0A0A')
DARK_GRAY  = HexColor('#1A1A1A')
MID_GRAY   = HexColor('#606060')
RULE_GRAY  = HexColor('#DDDDDD')
WHITE      = HexColor('#FFFFFF')

W = 7.0 * inch

def st(name, **kw):
    return ParagraphStyle(name, **kw)

# Styles
clinic_s    = st('Clinic',    fontName='Helvetica-Bold',    fontSize=13,  textColor=BLACK,    leading=16, alignment=TA_CENTER)
tagline_s   = st('Tagline',   fontName='Helvetica',         fontSize=9,   textColor=MID_GRAY, leading=11, alignment=TA_CENTER)
headline_s  = st('Headline',  fontName='Helvetica-Bold',    fontSize=24,  textColor=BLACK,    leading=28, alignment=TA_CENTER, spaceAfter=0)
subhead_s   = st('Subhead',   fontName='Helvetica',         fontSize=11,  textColor=MID_GRAY, leading=14, alignment=TA_CENTER)
section_s   = st('Section',   fontName='Helvetica-Bold',    fontSize=8,   textColor=MID_GRAY, leading=10, alignment=TA_CENTER, spaceBefore=8, spaceAfter=2)
item_s      = st('Item',      fontName='Helvetica-Bold',    fontSize=11,  textColor=DARK_GRAY, leading=14, alignment=TA_CENTER, spaceAfter=0)
item_desc_s = st('ItemDesc',  fontName='Helvetica',         fontSize=9,   textColor=MID_GRAY, leading=11, alignment=TA_CENTER, spaceAfter=3)
scan_s      = st('Scan',      fontName='Helvetica-Bold',    fontSize=13,  textColor=BLACK,    leading=16, alignment=TA_CENTER, spaceBefore=4)
scan_sub_s  = st('ScanSub',   fontName='Helvetica',         fontSize=9,   textColor=MID_GRAY, leading=11, alignment=TA_CENTER, spaceAfter=0)
phone_s     = st('Phone',     fontName='Helvetica-Bold',    fontSize=12,  textColor=DARK_GRAY, leading=14, alignment=TA_CENTER)
addr_s      = st('Addr',      fontName='Helvetica',         fontSize=9,   textColor=MID_GRAY, leading=11, alignment=TA_CENTER)

# Paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
QR_PATH = os.path.join(PROJECT_DIR, 'public', 'qr-sports-therapy.png')
OUTPUT_PATH = os.path.join(PROJECT_DIR, 'public', 'Range-Medical-Sports-Therapy-Flyer.pdf')

doc = SimpleDocTemplate(
    OUTPUT_PATH,
    pagesize=letter,
    rightMargin=0.75*inch, leftMargin=0.75*inch,
    topMargin=0.6*inch,    bottomMargin=0.5*inch,
)

story = []

# Header
story.append(Paragraph("RANGE MEDICAL", clinic_s))
story.append(Spacer(1, 2))
story.append(Paragraph("Regenerative Medicine \u2022 Newport Beach", tagline_s))
story.append(Spacer(1, 4))
story.append(HRFlowable(width="100%", thickness=1.5, color=BLACK, spaceAfter=14))

# Headline
story.append(Paragraph("Recover Faster.", headline_s))
story.append(Paragraph("We\u2019re Right Upstairs.", headline_s))
story.append(Spacer(1, 4))
story.append(Paragraph(
    "Range Medical offers regenerative treatments that work alongside<br/>"
    "your PT and rehab to help you heal faster.",
    subhead_s
))

# Divider
story.append(Spacer(1, 2))
story.append(HRFlowable(width=60, thickness=0.75, color=RULE_GRAY, spaceAfter=0))

# Injury & Recovery
story.append(Paragraph("INJURY &amp; RECOVERY", section_s))

story.append(Paragraph("Peptide Therapy \u2014 BPC-157 / TB4", item_s))
story.append(Paragraph("Accelerates tissue repair and reduces inflammation", item_desc_s))

story.append(Paragraph("Toradol Injection", item_s))
story.append(Paragraph("Fast-acting pain relief for acute injuries and flare-ups", item_desc_s))

story.append(Paragraph("PRP Therapy", item_s))
story.append(Paragraph("Your own platelets concentrated to support natural repair", item_desc_s))

story.append(Paragraph("Exosome Therapy", item_s))
story.append(Paragraph("Cell-signaling molecules that ramp up your body\u2019s repair", item_desc_s))

story.append(Paragraph("Full Body Red Light Therapy", item_s))
story.append(Paragraph("Cellular repair and collagen production \u2014 10\u201320 min sessions", item_desc_s))

# Energy & Optimization
story.append(Paragraph("ENERGY &amp; OPTIMIZATION", section_s))

story.append(Paragraph("Lab Panels \u2022 Hormone Optimization \u2022 Weight Loss", item_s))
story.append(Paragraph("IV Therapy \u2022 NAD+ \u2022 Hyperbaric Oxygen \u2022 And More", item_s))
story.append(Spacer(1, 2))

# Divider
story.append(HRFlowable(width=60, thickness=0.75, color=RULE_GRAY, spaceAfter=2))

# QR Code section
story.append(Paragraph("Scan to See Everything We Offer", scan_s))
story.append(Paragraph("Or text us \u2014 the message is pre-filled, just hit send.", scan_sub_s))
story.append(Spacer(1, 6))

# QR Code
qr_img = Image(QR_PATH, width=1.6*inch, height=1.6*inch)
qr_img.hAlign = 'CENTER'
story.append(qr_img)
story.append(Spacer(1, 8))

# Contact
story.append(Paragraph("(949) 997-3988", phone_s))
story.append(Spacer(1, 2))
story.append(Paragraph("1901 Westcliff Dr, Suite 10 \u2022 Upstairs \u2022 Newport Beach", addr_s))
story.append(Spacer(1, 2))
story.append(Paragraph("range-medical.com", addr_s))

doc.build(story)
print(f"Flyer saved to: {OUTPUT_PATH}")
