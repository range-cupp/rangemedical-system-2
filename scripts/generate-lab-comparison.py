#!/usr/bin/env python3
"""Generate one-page lab panel comparison sheet for the front desk."""

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table,
                                 TableStyle, HRFlowable)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import os

pdfmetrics.registerFont(
    TTFont('Menlo', '/System/Library/Fonts/Menlo.ttc', subfontIndex=0))

BLACK      = HexColor('#0A0A0A')
DARK_GRAY  = HexColor('#1A1A1A')
MID_GRAY   = HexColor('#606060')
LIGHT_GRAY = HexColor('#F4F4F4')
RULE_GRAY  = HexColor('#DDDDDD')
WHITE      = HexColor('#FFFFFF')
GREEN      = HexColor('#2E6B35')
HEADER_BG  = HexColor('#1A1A1A')
CAT_BG     = HexColor('#EBEBEB')
W = 7.0 * inch


def st(name, **kw):
    return ParagraphStyle(name, **kw)


clinic_s   = st('Clinic', fontName='Helvetica-Bold', fontSize=13, textColor=BLACK, leading=16)
contact_s  = st('Cont', fontName='Helvetica', fontSize=8, textColor=MID_GRAY, leading=11, alignment=TA_RIGHT)
title_s    = st('Title', fontName='Helvetica-Bold', fontSize=16, textColor=BLACK, leading=18)
subtitle_s = st('Sub', fontName='Helvetica-Oblique', fontSize=9, textColor=MID_GRAY, leading=10)
th_s       = st('TH', fontName='Helvetica-Bold', fontSize=9, textColor=WHITE, leading=11, alignment=TA_CENTER)
cat_s      = st('Cat', fontName='Helvetica-Bold', fontSize=7, textColor=MID_GRAY, leading=9)
marker_s   = st('Mk', fontName='Helvetica', fontSize=8, textColor=DARK_GRAY, leading=9.5)
cell_c     = st('CC', fontName='Helvetica', fontSize=9, textColor=RULE_GRAY, leading=9.5, alignment=TA_CENTER)
addon_s    = st('Add', fontName='Helvetica', fontSize=7.5, textColor=MID_GRAY, leading=10, alignment=TA_CENTER)
cta_s      = st('CTA', fontName='Helvetica-Bold', fontSize=9, textColor=BLACK, leading=12, alignment=TA_CENTER)
foot_s     = st('Foot', fontName='Helvetica-Oblique', fontSize=7.5, textColor=MID_GRAY, leading=10)
foot_b     = st('FootB', fontName='Helvetica-Bold', fontSize=8, textColor=DARK_GRAY, leading=11)

COL_MK = 4.6 * inch
COL_PN = 1.2 * inch


def chk():
    return Paragraph(
        '<font name="Menlo" color="#2E6B35" size="11">✓</font>', cell_c)


def dsh():
    return Paragraph('<font color="#CCCCCC">—</font>', cell_c)


ROWS = [
    ('c', 'BLOOD & IMMUNE'),
    ('m', 'CBC with Differential', True, True),

    ('c', 'METABOLIC & LIVER'),
    ('m', 'Complete Metabolic Panel (17 markers)', True, True),
    ('m', 'HbA1c', True, True),
    ('m', 'Insulin, Fasting', True, True),
    ('m', 'Uric Acid', False, True),
    ('m', 'GGT', False, True),

    ('c', 'HEART & INFLAMMATION'),
    ('m', 'Lipid Panel', True, True),
    ('m', 'Apolipoprotein A-1', False, True),
    ('m', 'Apolipoprotein B', False, True),
    ('m', 'Homocysteine', False, True),
    ('m', 'Lipoprotein(a)', False, True),
    ('m', 'CRP-HS', False, True),
    ('m', 'Sed Rate', False, True),

    ('c', 'HORMONES'),
    ('m', 'Testosterone, Free & Total', True, True),
    ('m', 'Estradiol', True, True),
    ('m', 'SHBG', True, True),
    ('m', 'Cortisol', False, True),
    ('m', 'DHEA-S', False, True),
    ('m', 'IGF-1', False, True),

    ('c', 'THYROID'),
    ('m', 'TSH', True, True),
    ('m', 'T3, Free', True, True),
    ('m', 'T4, Total', True, True),
    ('m', 'T4, Free', False, True),
    ('m', 'TPO Antibodies', True, True),
    ('m', 'Thyroglobulin Antibodies', False, True),

    ('c', 'VITAMINS & MINERALS'),
    ('m', 'Vitamin D', True, True),
    ('m', 'Vitamin B-12', False, True),
    ('m', 'Folate', False, True),
    ('m', 'Ferritin', False, True),
    ('m', 'Iron & TIBC', False, True),
    ('m', 'Magnesium', False, True),

    ('c', "MEN'S PANEL ALSO INCLUDES"),
    ('m', 'PSA, Total', True, True),
    ('m', 'PSA, Free', False, True),
    ('m', 'FSH', False, True),
    ('m', 'LH', False, True),

    ('c', "WOMEN'S PANEL ALSO INCLUDES"),
    ('m', 'FSH', True, True),
    ('m', 'LH', True, True),
    ('m', 'Progesterone', True, True),
    ('m', 'DHT', False, True),
]


def build(out):
    doc = SimpleDocTemplate(
        out, pagesize=letter,
        leftMargin=0.75 * inch, rightMargin=0.75 * inch,
        topMargin=0.4 * inch, bottomMargin=0.35 * inch,
    )
    story = []

    # Header
    hdr = Table([[
        Paragraph("RANGE MEDICAL", clinic_s),
        Paragraph(
            "range-medical.com  •  (949) 997-3988<br/>"
            "1901 Westcliff Drive, Suite 10, Newport Beach, CA", contact_s),
    ]], colWidths=[2.8 * inch, 4.2 * inch])
    hdr.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
    ]))
    story.append(hdr)
    story.append(HRFlowable(width="100%", thickness=1.5, color=BLACK, spaceAfter=6))

    # Title
    story.append(Paragraph("Lab Panel Comparison", title_s))
    story.append(Paragraph(
        "Essential (55–57 biomarkers) vs. Elite (78 biomarkers)", subtitle_s))
    story.append(Spacer(1, 6))

    # Comparison table
    td = [[
        Paragraph('', cell_c),
        Paragraph('ESSENTIAL · $350', th_s),
        Paragraph('ELITE · $750', th_s),
    ]]
    cat_rows = []
    for r in ROWS:
        if r[0] == 'c':
            cat_rows.append(len(td))
            td.append([
                Paragraph(r[1], cat_s),
                Paragraph('', cat_s),
                Paragraph('', cat_s),
            ])
        else:
            _, name, ess, elite = r
            td.append([
                Paragraph(name, marker_s),
                chk() if ess else dsh(),
                chk() if elite else dsh(),
            ])

    tbl = Table(td, colWidths=[COL_MK, COL_PN, COL_PN])
    cmds = [
        ('BACKGROUND', (0, 0), (-1, 0), HEADER_BG),
        ('TOPPADDING', (0, 0), (-1, 0), 3),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
        ('TOPPADDING', (0, 1), (-1, -1), 1),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 1),
        ('BOX', (0, 0), (-1, -1), 0.5, RULE_GRAY),
        ('LINEBELOW', (0, 0), (-1, -2), 0.25, RULE_GRAY),
    ]
    for i in cat_rows:
        cmds.append(('BACKGROUND', (0, i), (-1, i), CAT_BG))
        cmds.append(('TOPPADDING', (0, i), (-1, i), 1.5))
        cmds.append(('BOTTOMPADDING', (0, i), (-1, i), 0.5))

    tbl.setStyle(TableStyle(cmds))
    story.append(tbl)
    story.append(Spacer(1, 6))

    # Add-ons + CTA
    story.append(Paragraph(
        "Add-ons available with any blood draw:  "
        "Heavy Metals — Blood $220  •  "
        "Heavy Metals — Urine $280  •  "
        "Mold Profile $200", addon_s))
    story.append(Spacer(1, 4))
    story.append(Paragraph(
        "Ask the front desk to order your panel.", cta_s))
    story.append(Spacer(1, 6))

    # Footer
    story.append(HRFlowable(
        width="100%", thickness=0.5, color=RULE_GRAY, spaceAfter=4))
    ft = Table([[
        Paragraph(
            "<b>Questions?</b>  Call or text (949) 997-3988", foot_b),
        Paragraph(
            "Cash-pay clinic. Panels ordered by your provider, "
            "reviewed at follow-up.", foot_s),
    ]], colWidths=[2.2 * inch, 4.8 * inch])
    ft.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
    ]))
    story.append(ft)

    doc.build(story)
    print(f"Generated: {out}")


if __name__ == '__main__':
    here = os.path.dirname(os.path.abspath(__file__))
    root = os.path.dirname(here)
    out_path = os.path.join(root, 'public', 'Range-Lab-Panels-Comparison.pdf')
    build(out_path)
