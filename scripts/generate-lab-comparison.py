#!/usr/bin/env python3
"""Generate patient-facing lab panel comparison one-pager for front desk."""

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table,
                                 TableStyle, HRFlowable)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
import os

BLACK      = HexColor('#0A0A0A')
DARK_GRAY  = HexColor('#1A1A1A')
MID_GRAY   = HexColor('#606060')
LIGHT_GRAY = HexColor('#F4F4F4')
RULE_GRAY  = HexColor('#DDDDDD')
WHITE      = HexColor('#FFFFFF')
GREEN      = HexColor('#2E6B35')
ACCENT     = HexColor('#1B4F72')
W = 7.0 * inch


def st(name, **kw):
    return ParagraphStyle(name, **kw)


clinic_s    = st('Clinic', fontName='Helvetica-Bold', fontSize=13, textColor=BLACK, leading=16)
contact_s   = st('Cont', fontName='Helvetica', fontSize=8, textColor=MID_GRAY, leading=11, alignment=TA_RIGHT)
title_s     = st('Title', fontName='Helvetica-Bold', fontSize=17, textColor=BLACK, leading=20, spaceAfter=2)
intro_s     = st('Intro', fontName='Helvetica', fontSize=8.5, textColor=MID_GRAY, leading=12, spaceAfter=4)
sec_s       = st('Sec', fontName='Helvetica-Bold', fontSize=8, textColor=MID_GRAY, leading=11, spaceBefore=0, spaceAfter=2)
opt_title_s = st('OptT', fontName='Helvetica-Bold', fontSize=11, textColor=BLACK, leading=13)
opt_sub_s   = st('OptSub', fontName='Helvetica-Oblique', fontSize=8, textColor=MID_GRAY, leading=10)
price_s     = st('Price', fontName='Helvetica-Bold', fontSize=11, textColor=ACCENT, leading=13)
bestif_s    = st('Best', fontName='Helvetica', fontSize=7.5, textColor=DARK_GRAY, leading=10, leftIndent=8, firstLineIndent=-8, spaceAfter=1)
grp_hdr_s   = st('GrpH', fontName='Helvetica-Bold', fontSize=7, textColor=MID_GRAY, leading=9, spaceBefore=3, spaceAfter=0)
bio_s       = st('Bio', fontName='Helvetica', fontSize=7, textColor=DARK_GRAY, leading=9, leftIndent=6, spaceAfter=0)
gender_s    = st('Gen', fontName='Helvetica-Bold', fontSize=6.5, textColor=ACCENT, leading=8.5, spaceBefore=2, spaceAfter=0)
gender_b_s  = st('GenB', fontName='Helvetica', fontSize=7, textColor=DARK_GRAY, leading=9, leftIndent=6, spaceAfter=0)
addon_hdr_s = st('AddH', fontName='Helvetica-Bold', fontSize=8, textColor=MID_GRAY, leading=11)
addon_s     = st('Add', fontName='Helvetica', fontSize=7.5, textColor=DARK_GRAY, leading=10)
step_s      = st('Step', fontName='Helvetica', fontSize=7.5, textColor=DARK_GRAY, leading=10, leftIndent=12, firstLineIndent=-12, spaceAfter=1)
foot_s      = st('Foot', fontName='Helvetica-Oblique', fontSize=7, textColor=MID_GRAY, leading=9)
foot_b_s    = st('FootB', fontName='Helvetica-Bold', fontSize=7.5, textColor=DARK_GRAY, leading=10)
chk_s       = st('Chk', fontName='Helvetica-Bold', fontSize=7.5, textColor=GREEN, leading=10, leftIndent=8, firstLineIndent=-8, spaceAfter=1)


def section_label(text):
    return [
        Paragraph(text.upper(), sec_s),
        HRFlowable(width="100%", thickness=0.75, color=RULE_GRAY, spaceAfter=4),
    ]


def build_essential_content():
    items = []
    items.append(Paragraph("Option 1 — Essential Lab Panel", opt_title_s))
    items.append(Paragraph("$350", price_s))
    items.append(Paragraph("Great starting point for most people", opt_sub_s))
    items.append(Spacer(1, 4))

    items.append(Paragraph("<b>Best if you:</b>", grp_hdr_s))
    for b in [
        "Want a strong “baseline” of your health",
        "Are doing labs here for the first time",
        "Don’t have a big medical or family history, but don’t feel like yourself",
    ]:
        items.append(Paragraph(f"✓  {b}", chk_s))

    items.append(Spacer(1, 3))
    items.append(Paragraph("<b>Looks at (55–57 biomarkers):</b>", grp_hdr_s))

    groups = [
        ("Blood & immune health", ["Complete blood count — red cells, white cells, platelets"]),
        ("Metabolism, kidneys & liver", ["Full metabolic panel", "Blood sugar control (HbA1c)", "Fasting insulin"]),
        ("Heart health basics", ["Cholesterol panel (total, LDL, HDL, triglycerides)"]),
        ("Hormones", ["Testosterone (free & total)", "Estradiol", "SHBG"]),
        ("Thyroid basics + antibodies", ["TSH, Free T3, Total T4", "Thyroid peroxidase (TPO) antibodies"]),
    ]
    for gname, markers in groups:
        items.append(Paragraph(f"<b>{gname}</b>", grp_hdr_s))
        for m in markers:
            items.append(Paragraph(f"–  {m}", bio_s))

    items.append(Paragraph("Men also get:", gender_s))
    items.append(Paragraph("–  PSA (prostate screening)", gender_b_s))
    items.append(Paragraph("Women also get:", gender_s))
    items.append(Paragraph("–  FSH, LH, Progesterone", gender_b_s))

    return items


def build_elite_content():
    items = []
    items.append(Paragraph("Option 2 — Elite Lab Panel", opt_title_s))
    items.append(Paragraph("$750", price_s))
    items.append(Paragraph("Deep-dive for stubborn symptoms or long-term optimization", opt_sub_s))
    items.append(Spacer(1, 4))

    items.append(Paragraph("<b>Best if you:</b>", grp_hdr_s))
    for b in [
        "Have ongoing fatigue, brain fog, weight, or recovery issues",
        "Have a strong family history (heart disease, autoimmune, etc.)",
        "Want the most complete picture of your heart, hormones, inflammation, and nutrients",
    ]:
        items.append(Paragraph(f"✓  {b}", chk_s))

    items.append(Spacer(1, 3))
    items.append(Paragraph("<b>Includes everything in Essential, plus (78 biomarkers total):</b>", grp_hdr_s))

    groups = [
        ("Heart & inflammation “early warning” markers",
         ["Apo A-1, Apo B, Lipoprotein(a)", "Homocysteine", "High-sensitivity CRP (CRP-hs)", "Sed rate (inflammation)"]),
        ("Expanded hormones & thyroid",
         ["Cortisol, DHEA-S, IGF-1", "Free T4", "Thyroglobulin antibodies"]),
        ("Vitamins & minerals",
         ["Vitamin B12, Folate", "Ferritin, Iron & TIBC", "Magnesium"]),
    ]
    for gname, markers in groups:
        items.append(Paragraph(f"<b>{gname}</b>", grp_hdr_s))
        for m in markers:
            items.append(Paragraph(f"–  {m}", bio_s))

    items.append(Paragraph("Men also get:", gender_s))
    items.append(Paragraph("–  Free PSA, FSH, LH", gender_b_s))
    items.append(Paragraph("Women also get:", gender_s))
    items.append(Paragraph("–  DHT (extra hormone insight)", gender_b_s))

    return items


def flowables_to_cell(items):
    return items


def build(out):
    doc = SimpleDocTemplate(
        out, pagesize=letter,
        leftMargin=0.65 * inch, rightMargin=0.65 * inch,
        topMargin=0.45 * inch, bottomMargin=0.35 * inch,
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
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
    ]))
    story.append(hdr)
    story.append(HRFlowable(width="100%", thickness=1.5, color=BLACK, spaceAfter=8))

    # Title
    story.append(Paragraph("Which lab panel is right for me?", title_s))
    story.append(Paragraph(
        "Both options check your blood, organs, metabolism, hormones, and thyroid "
        "so we can stop guessing and build a real plan. The difference is how deep we go.",
        intro_s))
    story.append(Spacer(1, 4))

    # Two-column panel comparison
    col_w = (W + 0.2 * inch) / 2
    gap = 0.15 * inch

    ess_content = build_essential_content()
    elite_content = build_elite_content()

    panel_tbl = Table(
        [[flowables_to_cell(ess_content), flowables_to_cell(elite_content)]],
        colWidths=[col_w - gap / 2, col_w - gap / 2],
    )
    panel_tbl.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (0, -1), 8),
        ('RIGHTPADDING', (0, 0), (0, -1), 8),
        ('LEFTPADDING', (1, 0), (1, -1), 8),
        ('RIGHTPADDING', (1, 0), (1, -1), 8),
        ('BOX', (0, 0), (0, -1), 0.5, RULE_GRAY),
        ('BOX', (1, 0), (1, -1), 0.5, ACCENT),
        ('BACKGROUND', (1, 0), (1, -1), HexColor('#F7FAFC')),
    ]))
    story.append(panel_tbl)
    story.append(Spacer(1, 6))

    # Add-on testing
    story += section_label("Add-on testing (optional, with any blood draw)")
    addon_data = [
        ["Heavy Metals — Blood: $220", "Heavy Metals — Urine: $280", "Mold Profile: $200"],
    ]
    addon_tbl = Table(addon_data, colWidths=[W / 3] * 3)
    addon_tbl.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 7.5),
        ('TEXTCOLOR', (0, 0), (-1, -1), DARK_GRAY),
    ]))
    story.append(addon_tbl)
    story.append(Spacer(1, 6))

    # How it works
    story += section_label("How it works")
    steps = [
        ("1.", "Your provider helps you choose the panel that fits your goals and history."),
        ("2.", "We draw your blood here in clinic."),
        ("3.", "When results are back, you’ll have a follow-up visit to review everything in plain language and get a written plan."),
    ]
    for num, text in steps:
        story.append(Paragraph(f"<b>{num}</b>  {text}", step_s))

    story.append(Spacer(1, 6))

    # Footer
    story.append(HRFlowable(width="100%", thickness=0.5, color=RULE_GRAY, spaceAfter=4))
    ft = Table([[
        Paragraph("<b>Questions?</b>  Call or text (949) 997-3988", foot_b_s),
        Paragraph(
            "Cash-pay clinic. Panels are ordered by your provider and always "
            "reviewed at a follow-up visit.", foot_s),
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
