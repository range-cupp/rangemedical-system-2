#!/usr/bin/env python3
"""Generate 6x4 raffle gift cards for Range Medical.

Produces two landscape PDFs (6" x 4"):
  - 5 Free Hyperbaric Oxygen Therapy Sessions
  - 5 Free Red Light Therapy Sessions

Each card follows the Range Medical v2 editorial design — minimalist
black/white, hairline rules, uppercase headline, Helvetica/Inter-style
weight hierarchy. A QR code on the right links to a matching landing
page at /raffle/<prize>. A unique code printed on the card is the
physical proof of ownership at redemption.

Requires: reportlab, qrcode[pil] (install inside the project .venv).
"""

import os
import secrets
import string
import io

import qrcode
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.platypus import (
    BaseDocTemplate, PageTemplate, Frame,
    Paragraph, Spacer, Image, Table, TableStyle, HRFlowable,
)

# --- Colors (v2 base template) ---
BLACK      = HexColor('#0A0A0A')
DARK_GRAY  = HexColor('#1A1A1A')
MID_GRAY   = HexColor('#606060')
LIGHT_GRAY = HexColor('#F4F4F4')
RULE_GRAY  = HexColor('#DDDDDD')
WHITE      = HexColor('#FFFFFF')

# --- Page: Letter portrait. Card content sits centered at the bottom. ---
PAGE_W, PAGE_H = letter              # 8.5 x 11
CARD_W = 6.0 * inch
CARD_H = 4.0 * inch
CARD_X = (PAGE_W - CARD_W) / 2.0     # 1.25" from left — horizontally centered
CARD_Y = 0.5 * inch                  # 0.5" up from bottom edge
PAD    = 0.22 * inch                 # inner padding inside the card
CONTENT_W = CARD_W - 2 * PAD         # text/QR content width inside the card

BASE_URL = "https://range-medical.com"


def st(name, **kw):
    return ParagraphStyle(name, **kw)


# --- Styles (v2 base template, tuned for 6x4 card) ---
clinic_s  = st('Clinic',  fontName='Helvetica-Bold',    fontSize=10.5,textColor=BLACK,    leading=12)
tag_s     = st('Tag',     fontName='Helvetica-Bold',    fontSize=7,   textColor=MID_GRAY, leading=10,
               alignment=TA_RIGHT)
eyebrow_s = st('Eye',     fontName='Helvetica-Bold',    fontSize=7,   textColor=MID_GRAY, leading=9,
               spaceAfter=3)
prize_s   = st('Prize',   fontName='Helvetica-Bold',    fontSize=17,  textColor=BLACK,    leading=18,
               spaceAfter=0)
sessions_s = st('Sess',   fontName='Helvetica-Bold',    fontSize=11,  textColor=BLACK,    leading=13,
                spaceBefore=3, spaceAfter=1)
comp_s    = st('Comp',    fontName='Helvetica',         fontSize=8,   textColor=MID_GRAY, leading=11)
scan_s    = st('Scan',    fontName='Helvetica-Bold',    fontSize=7,   textColor=MID_GRAY, leading=9,
               alignment=TA_CENTER)
code_lbl_s = st('CodeL',  fontName='Helvetica',         fontSize=6.5, textColor=MID_GRAY, leading=8)
code_s    = st('Code',    fontName='Courier-Bold',      fontSize=9.5, textColor=BLACK,    leading=11)
foot_s    = st('Foot',    fontName='Helvetica',         fontSize=7,   textColor=MID_GRAY, leading=9.5)
foot_bold_s = st('FootB', fontName='Helvetica-Bold',    fontSize=7,   textColor=DARK_GRAY, leading=9.5)


def generate_code(prefix: str) -> str:
    """Short, unambiguous alphanumeric code: e.g. HBOT-RAFFLE-7K3Q."""
    alphabet = string.ascii_uppercase + string.digits
    # Drop ambiguous chars (0/O, 1/I) for physical-card readability
    alphabet = alphabet.translate(str.maketrans('', '', '0O1I'))
    suffix = ''.join(secrets.choice(alphabet) for _ in range(4))
    return f"{prefix}-RAFFLE-{suffix}"


def build_qr_image(url: str, size_in: float = 1.35) -> Image:
    """Return a reportlab Image with a QR pointing at `url`."""
    qr = qrcode.QRCode(
        version=None,  # auto
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=1,
    )
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color='black', back_color='white')
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    buf.seek(0)
    return Image(buf, width=size_in * inch, height=size_in * inch)


def build_card(output_path: str, title_line1: str, title_line2: str,
               prize_slug: str, code_prefix: str) -> str:
    """Build a single 6x4 raffle card. Returns the redemption code."""
    code = generate_code(code_prefix)
    redeem_url = f"{BASE_URL}/raffle/{prize_slug}?c={code}"

    def draw_cut_line(canvas, _doc):
        """Subtle dashed rectangle around the card boundary — trim guide."""
        canvas.saveState()
        canvas.setStrokeColor(RULE_GRAY)
        canvas.setLineWidth(0.5)
        canvas.setDash([3, 3])
        canvas.rect(CARD_X, CARD_Y, CARD_W, CARD_H)
        canvas.restoreState()

    frame = Frame(
        CARD_X, CARD_Y, CARD_W, CARD_H,
        leftPadding=PAD, rightPadding=PAD,
        topPadding=PAD, bottomPadding=PAD,
        showBoundary=0,
    )
    doc = BaseDocTemplate(
        output_path,
        pagesize=(PAGE_W, PAGE_H),
        leftMargin=0, rightMargin=0, topMargin=0, bottomMargin=0,
        title=f"Range Medical Raffle — {title_line1} {title_line2}",
    )
    doc.addPageTemplates([
        PageTemplate(id='card', frames=[frame], onPage=draw_cut_line),
    ])

    story = []

    # --- Header row: clinic name (left) + "RAFFLE PRIZE" eyebrow (right) ---
    header = Table(
        [[
            Paragraph("RANGE MEDICAL", clinic_s),
            Paragraph("&#8226;&nbsp;RAFFLE PRIZE&nbsp;&#8226;", tag_s),
        ]],
        colWidths=[CONTENT_W * 0.55, CONTENT_W * 0.45],
    )
    header.setStyle(TableStyle([
        ('VALIGN',       (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING',   (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING',(0, 0), (-1, -1), 4),
        ('LEFTPADDING',  (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
    ]))
    story.append(header)
    story.append(HRFlowable(width="100%", thickness=1.0, color=BLACK, spaceAfter=8))

    # --- Main row: prize copy (left) + QR code (right) ---
    left_col_w = CONTENT_W * 0.60
    right_col_w = CONTENT_W * 0.40

    # Left cell — prize title + session count
    left_cell = [
        Paragraph("YOU'VE WON", eyebrow_s),
        Paragraph(title_line1.upper(), prize_s),
        Paragraph(title_line2.upper(), prize_s),
        Spacer(1, 4),
        HRFlowable(width="40%", thickness=0.5, color=RULE_GRAY, spaceAfter=4),
        Paragraph("5 COMPLIMENTARY SESSIONS", sessions_s),
        Paragraph(
            "A full course to experience the benefits at Range Medical.",
            comp_s,
        ),
    ]

    # Right cell — QR code + scan label
    qr_img = build_qr_image(redeem_url, size_in=1.15)
    qr_img.hAlign = 'CENTER'
    right_cell = [
        qr_img,
        Spacer(1, 3),
        Paragraph("SCAN TO VIEW YOUR PRIZE", scan_s),
    ]

    main = Table(
        [[left_cell, right_cell]],
        colWidths=[left_col_w, right_col_w],
    )
    main.setStyle(TableStyle([
        ('VALIGN',       (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING',   (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING',(0, 0), (-1, -1), 0),
        ('LEFTPADDING',  (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
    ]))
    story.append(main)

    # --- Footer row: code (left) + instructions (right) ---
    story.append(Spacer(1, 6))
    story.append(HRFlowable(width="100%", thickness=0.5, color=RULE_GRAY, spaceAfter=4))

    code_cell = [
        Paragraph("RAFFLE CODE", code_lbl_s),
        Paragraph(code, code_s),
    ]
    info_cell = [
        Paragraph(
            "<b>Present this card</b> at Range Medical to redeem. "
            "Call or text (949) 997-3988 to schedule. "
            "Non-transferable &#8226; No cash value &#8226; Expires 12 months from issue.",
            foot_s,
        ),
    ]
    footer = Table(
        [[code_cell, info_cell]],
        colWidths=[CONTENT_W * 0.28, CONTENT_W * 0.72],
    )
    footer.setStyle(TableStyle([
        ('VALIGN',       (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING',   (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING',(0, 0), (-1, -1), 0),
        ('LEFTPADDING',  (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
    ]))
    story.append(footer)

    doc.build(story)
    return code


SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
OUT_DIR = os.path.join(PROJECT_DIR, 'public')
os.makedirs(OUT_DIR, exist_ok=True)

hbot_path = os.path.join(OUT_DIR, 'Range-Medical-Raffle-HBOT.pdf')
rlt_path  = os.path.join(OUT_DIR, 'Range-Medical-Raffle-RedLight.pdf')

hbot_code = build_card(
    output_path=hbot_path,
    title_line1="Hyperbaric Oxygen",
    title_line2="Chamber Therapy",
    prize_slug="hbot",
    code_prefix="HBOT",
)
rlt_code = build_card(
    output_path=rlt_path,
    title_line1="Red Light",
    title_line2="Therapy",
    prize_slug="red-light",
    code_prefix="RLT",
)

print(f"HBOT card: {hbot_path}")
print(f"  Code: {hbot_code}")
print(f"  URL:  {BASE_URL}/raffle/hbot?c={hbot_code}")
print()
print(f"Red Light card: {rlt_path}")
print(f"  Code: {rlt_code}")
print(f"  URL:  {BASE_URL}/raffle/red-light?c={rlt_code}")
