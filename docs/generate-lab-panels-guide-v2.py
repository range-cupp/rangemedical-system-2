"""
Generate the Range Medical Lab Panels Guide in the V2 editorial landscape style
(matches docs/generate-path-one-pagers.py — Inter typography, #737373 body,
#e8e8e8 hairlines, heavy uppercase headlines).

Output: public/Range-Lab-Panels-Guide.pdf — three landscape one-pagers, one per
panel section, designed to slot into the front-of-booklet alongside the patient
path one-pagers.

  Page 1 — Essential Panel ($350)
  Page 2 — Elite Panel ($750)
  Page 3 — Add-On Panels (Heavy Metals Blood, Urine, Mold Profile Plus IgE)
"""

import os
from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor
from reportlab.platypus import (BaseDocTemplate, Frame, PageTemplate,
                                Paragraph, Spacer, Table, TableStyle,
                                HRFlowable, FrameBreak, KeepTogether)
from reportlab.lib.enums import TA_LEFT, TA_RIGHT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily

# ── Paths ────────────────────────────────────────────────────────────────────
DOCS_DIR   = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR   = os.path.abspath(os.path.join(DOCS_DIR, ".."))
PUBLIC_DIR = os.path.join(ROOT_DIR, "public")
FONTS_DIR  = os.path.join(ROOT_DIR, "scripts", ".fonts")

# ── Inter (auto-download on first run) ──────────────────────────────────────
INTER_WEIGHTS = {
    "Inter":             "Inter-Regular.ttf",
    "Inter-Medium":      "Inter-Medium.ttf",
    "Inter-SemiBold":    "Inter-SemiBold.ttf",
    "Inter-Bold":        "Inter-Bold.ttf",
    "Inter-ExtraBold":   "Inter-ExtraBold.ttf",
    "Inter-Black":       "Inter-Black.ttf",
    "Inter-Italic":      "Inter-Italic.ttf",
    "Inter-BoldItalic":  "Inter-BoldItalic.ttf",
}
INTER_RELEASE_URL = "https://github.com/rsms/inter/releases/download/v4.0/Inter-4.0.zip"


def _ensure_fonts():
    missing = [fn for fn in INTER_WEIGHTS.values()
               if not os.path.exists(os.path.join(FONTS_DIR, fn))]
    if not missing:
        return
    import urllib.request, zipfile, io
    os.makedirs(FONTS_DIR, exist_ok=True)
    print(f"Downloading Inter v4 ({len(missing)} weight(s) missing)…")
    with urllib.request.urlopen(INTER_RELEASE_URL) as resp:
        data = resp.read()
    with zipfile.ZipFile(io.BytesIO(data)) as zf:
        for fn in missing:
            with zf.open(f"extras/ttf/{fn}") as src, \
                 open(os.path.join(FONTS_DIR, fn), "wb") as dst:
                dst.write(src.read())
    print("Fonts ready.")


def _register_fonts():
    _ensure_fonts()
    for name, fn in INTER_WEIGHTS.items():
        pdfmetrics.registerFont(TTFont(name, os.path.join(FONTS_DIR, fn)))
    registerFontFamily("Inter",
        normal="Inter", bold="Inter-Bold",
        italic="Inter-Italic", boldItalic="Inter-BoldItalic")

_register_fonts()

# ── V2 palette ───────────────────────────────────────────────────────────────
TEXT      = HexColor('#1A1A1A')
BODY      = HexColor('#737373')
MUTED     = HexColor('#a0a0a0')
BORDER    = HexColor('#e8e8e8')
SUBTLE_BG = HexColor('#fafafa')
SOFT_BG   = HexColor('#f4f4f4')
WHITE     = HexColor('#FFFFFF')
GREEN     = HexColor('#2E6B35')

# ── Page geometry (mirrors path-one-pagers) ─────────────────────────────────
PAGE_W, PAGE_H = landscape(letter)
MARGIN         = 0.42 * inch
HEADER_H       = 0.48 * inch
TITLE_H        = 1.18 * inch
FOOTER_H       = 0.40 * inch
COL_GAP        = 0.40 * inch
COL_W          = (PAGE_W - 2 * MARGIN - COL_GAP) / 2

def track(font_size_pt, em):
    return font_size_pt * em

def st(name, **kw):
    return ParagraphStyle(name, **kw)

# h1-style headline
title_s     = st('Title', fontName='Inter-Black', fontSize=30, leading=29,
                 textColor=TEXT, charSpace=track(30, -0.03), spaceAfter=4)

# Deck — tracked-out small caps in Inter ExtraBold (panel summary line)
deck_s      = st('Deck',  fontName='Inter-ExtraBold', fontSize=9, leading=12,
                 textColor=BODY, charSpace=track(9, 0.10), spaceAfter=2)

# Lead paragraph
intro_s     = st('Intro', fontName='Inter', fontSize=10, leading=14.5,
                 textColor=BODY, spaceAfter=4)

# Eyebrow / section label
sec_s       = st('Sec',   fontName='Inter-ExtraBold', fontSize=7.5, leading=10,
                 textColor=BODY, charSpace=track(7.5, 0.14),
                 spaceBefore=10, spaceAfter=4)

# Body paragraph
body_s      = st('Body',  fontName='Inter', fontSize=9.5, leading=14,
                 textColor=BODY, spaceAfter=3)

# Note / caption
note_s      = st('Note',  fontName='Inter-Italic', fontSize=8.5, leading=12,
                 textColor=MUTED, spaceAfter=4)

# Compact biomarker row
bm_s        = st('BM',    fontName='Inter', fontSize=8.8, leading=11.5,
                 textColor=BODY, leftIndent=0, spaceAfter=2)

# Add-on card title
addon_t_s   = st('AddT',  fontName='Inter-ExtraBold', fontSize=10.5, leading=12,
                 textColor=TEXT, charSpace=track(10.5, 0.06), spaceAfter=2)

# Add-on card price
price_s     = st('Price', fontName='Inter-Black', fontSize=15, leading=15,
                 textColor=TEXT, charSpace=track(15, -0.02))

# Add-on card meta line
meta_s      = st('Meta',  fontName='Inter-Italic', fontSize=8, leading=11,
                 textColor=MUTED, spaceAfter=4)

# Add-on card body
addon_b_s   = st('AddB',  fontName='Inter', fontSize=9, leading=12.5,
                 textColor=BODY, spaceAfter=4)

# Hero price for panel pages
panel_price_s = st('PnP', fontName='Inter-Black', fontSize=44, leading=42,
                   textColor=TEXT, charSpace=track(44, -0.04))

# CTA
cta_s       = st('CTA',   fontName='Inter-ExtraBold', fontSize=9.5, leading=13,
                 textColor=TEXT, charSpace=track(9.5, 0.10),
                 spaceBefore=10, spaceAfter=2)


# ── Helpers ──────────────────────────────────────────────────────────────────
def section_label(text, space_before=10):
    s = ParagraphStyle('SecOv', parent=sec_s, spaceBefore=space_before)
    return [
        Paragraph(text.upper(), s),
        HRFlowable(width="100%", thickness=0.5, color=BORDER, spaceAfter=5),
    ]


def biomarker(name, desc):
    return Paragraph(f"<b>{name}</b> &nbsp; <font color='#737373'>{desc}</font>", bm_s)


def hero_price(price_str, count_str):
    """Big editorial price block with biomarker count beneath."""
    rows = [
        [Paragraph(price_str, panel_price_s)],
        [Paragraph(count_str.upper(),
                   ParagraphStyle('PCount', fontName='Inter-ExtraBold',
                                  fontSize=8, leading=10, textColor=BODY,
                                  charSpace=track(8, 0.14), spaceBefore=4))],
    ]
    tbl = Table(rows, colWidths=[COL_W])
    tbl.setStyle(TableStyle([
        ('TOPPADDING',    (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
        ('LEFTPADDING',   (0, 0), (-1, -1), 0),
        ('RIGHTPADDING',  (0, 0), (-1, -1), 0),
    ]))
    return tbl


def addon_card(title, price, meta, intro, body_rows, width):
    """Editorial add-on card: thin black rule, title + price row, meta, body."""
    title_row = Table(
        [[Paragraph(title.upper(), addon_t_s),
          Paragraph(price, price_s)]],
        colWidths=[width * 0.62, width * 0.38],
    )
    title_row.setStyle(TableStyle([
        ('VALIGN',        (0, 0), (-1, -1), 'BOTTOM'),
        ('TOPPADDING',    (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
        ('LEFTPADDING',   (0, 0), (-1, -1), 0),
        ('RIGHTPADDING',  (0, 0), (-1, -1), 0),
        ('ALIGN',         (1, 0), (1, 0), 'RIGHT'),
    ]))

    inner_rows = [
        [HRFlowable(width=width - 16, thickness=1.5, color=TEXT,
                    spaceBefore=0, spaceAfter=4)],
        [title_row],
        [Paragraph(meta, meta_s)],
        [Paragraph(intro, addon_b_s)],
    ]
    for r in body_rows:
        inner_rows.append([r])

    inner = Table(inner_rows, colWidths=[width])
    inner.setStyle(TableStyle([
        ('BACKGROUND',    (0, 0), (-1, -1), SUBTLE_BG),
        ('TOPPADDING',    (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING',   (0, 0), (-1, -1), 12),
        ('RIGHTPADDING',  (0, 0), (-1, -1), 12),
    ]))
    return inner


def chip_grid(items, total_width, cols=2):
    """Compact multi-column grid of name chips (used inside add-on cards)."""
    rows = []
    n = len(items)
    per_col = (n + cols - 1) // cols
    for r in range(per_col):
        row = []
        for c in range(cols):
            idx = c * per_col + r
            if idx < n:
                row.append(Paragraph(f"–  {items[idx]}",
                                     ParagraphStyle('Chip',
                                         fontName='Inter', fontSize=8.5,
                                         leading=11.5, textColor=BODY)))
            else:
                row.append("")
        rows.append(row)
    col_w = (total_width - 24) / cols
    tbl = Table(rows, colWidths=[col_w] * cols)
    tbl.setStyle(TableStyle([
        ('TOPPADDING',    (0, 0), (-1, -1), 1),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 1),
        ('LEFTPADDING',   (0, 0), (-1, -1), 0),
        ('RIGHTPADDING',  (0, 0), (-1, -1), 4),
        ('VALIGN',        (0, 0), (-1, -1), 'TOP'),
    ]))
    return tbl


# ── Page chrome (header / footer / column rule, drawn on canvas) ────────────
def _tracked(canvas, x, y, text, font, size, em, color, align='left'):
    canvas.saveState()
    canvas.setFillColor(color)
    if align == 'right':
        spacing = size * em
        width = canvas.stringWidth(text, font, size) + spacing * (len(text) - 1)
        x = x - width
    t = canvas.beginText(x, y)
    t.setFont(font, size)
    t.setCharSpace(size * em)
    t.setFillColor(color)
    t.textOut(text)
    canvas.drawText(t)
    canvas.restoreState()


def _draw_header_footer(canvas):
    top_y = PAGE_H - MARGIN

    _tracked(canvas, MARGIN, top_y - 12,
             "RANGE MEDICAL", "Inter-ExtraBold", 12, 0.15, TEXT)

    canvas.setFillColor(BODY)
    canvas.setFont('Inter', 8)
    canvas.drawRightString(PAGE_W - MARGIN, top_y - 7,
                           "range-medical.com  •  (949) 997-3988")
    canvas.drawRightString(PAGE_W - MARGIN, top_y - 18,
                           "1901 Westcliff Drive, Suite 10, Newport Beach, CA")

    rule_y = top_y - HEADER_H + 6
    canvas.setStrokeColor(BORDER)
    canvas.setLineWidth(1.0)
    canvas.line(MARGIN, rule_y, PAGE_W - MARGIN, rule_y)

    foot_top_y = MARGIN + FOOTER_H
    canvas.setStrokeColor(BORDER)
    canvas.setLineWidth(0.5)
    canvas.line(MARGIN, foot_top_y, PAGE_W - MARGIN, foot_top_y)

    _tracked(canvas, MARGIN, foot_top_y - 13,
             "PANELS ORDERED BY YOUR PROVIDER  •  REVIEWED AT YOUR FOLLOW-UP",
             "Inter-ExtraBold", 8, 0.10, TEXT)

    canvas.setFillColor(BODY)
    canvas.setFont('Inter-Italic', 7.5)
    canvas.drawRightString(PAGE_W - MARGIN, foot_top_y - 13,
                           "Cash-pay clinic.  Range Medical • range-medical.com • (949) 997-3988")


def draw_page_chrome_2col(canvas, doc):
    canvas.saveState()
    _draw_header_footer(canvas)
    # Column separator between the two content frames
    sep_x = MARGIN + COL_W + COL_GAP / 2
    sep_top    = PAGE_H - MARGIN - HEADER_H - TITLE_H - 4
    sep_bottom = MARGIN + FOOTER_H + 6
    canvas.setStrokeColor(BORDER)
    canvas.setLineWidth(0.5)
    canvas.line(sep_x, sep_top, sep_x, sep_bottom)
    canvas.restoreState()


def draw_page_chrome_full(canvas, doc):
    canvas.saveState()
    _draw_header_footer(canvas)
    canvas.restoreState()


# ── Doc template factory (two layouts: 2-column panels, 3-column add-ons) ───
def make_doc(path, title):
    doc = BaseDocTemplate(
        path, pagesize=landscape(letter),
        leftMargin=MARGIN, rightMargin=MARGIN,
        topMargin=MARGIN,  bottomMargin=MARGIN,
        title=title, author="Range Medical",
    )

    title_y        = PAGE_H - MARGIN - HEADER_H - TITLE_H
    content_top    = title_y - 4
    content_bottom = MARGIN + FOOTER_H + 6
    content_h      = content_top - content_bottom

    # Title frame (shared, spans full width)
    title_frame = Frame(
        MARGIN, title_y, PAGE_W - 2 * MARGIN, TITLE_H,
        leftPadding=0, rightPadding=0, topPadding=4, bottomPadding=0,
        showBoundary=0, id='title',
    )

    # ── 2-column layout (for Essential / Elite panel pages) ─────────────────
    panel_left  = Frame(
        MARGIN, content_bottom, COL_W, content_h,
        leftPadding=0, rightPadding=8, topPadding=0, bottomPadding=0,
        showBoundary=0, id='left',
    )
    panel_right = Frame(
        MARGIN + COL_W + COL_GAP, content_bottom, COL_W, content_h,
        leftPadding=8, rightPadding=0, topPadding=0, bottomPadding=0,
        showBoundary=0, id='right',
    )

    # ── Single full-width frame (for add-ons showcase) ──────────────────────
    full_frame = Frame(
        MARGIN, content_bottom, PAGE_W - 2 * MARGIN, content_h,
        leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0,
        showBoundary=0, id='full',
    )

    doc.addPageTemplates([
        PageTemplate(id='panel',
                     frames=[title_frame, panel_left, panel_right],
                     onPage=draw_page_chrome_2col),
        PageTemplate(id='addons',
                     frames=[Frame(MARGIN, title_y, PAGE_W - 2 * MARGIN, TITLE_H,
                                   leftPadding=0, rightPadding=0,
                                   topPadding=4, bottomPadding=0,
                                   showBoundary=0, id='title2'),
                             full_frame],
                     onPage=draw_page_chrome_full),
    ])
    return doc


# ── BIOMARKER DATA (compact descriptions tuned for one-line landscape rows) ─
descriptions = {
    "Complete Metabolic Panel (CMP)": "Kidney, liver, blood sugar, electrolytes (17 markers).",
    "Lipid Panel":                    "Cholesterol, HDL, LDL, triglycerides — heart-risk basics.",
    "CBC with Differential":          "Red &amp; white cells, platelets — anemia, infection, immunity.",
    "Estradiol":                      "Primary estrogen — affects fatigue, weight, reproductive health.",
    "HbA1c":                          "3-month average blood sugar — gold standard for pre-diabetes.",
    "Insulin, Fasting":               "Catches metabolic dysfunction before sugar goes off.",
    "PSA, Total":                     "Prostate-specific antigen — prostate health screen.",
    "SHBG":                           "How much testosterone is actually available to your body.",
    "T3, Free":                       "Active thyroid hormone — fatigue &amp; brain fog when low.",
    "T4, Total":                      "Main thyroid hormone — overall thyroid output.",
    "Testosterone, Free":             "Testosterone available for your body to use.",
    "Testosterone, Total":            "Total production — energy, libido, muscle.",
    "TPO Antibodies":                 "Detects autoimmune thyroid (Hashimoto’s) early.",
    "TSH":                            "First-line thyroid screening marker.",
    "Vitamin D, 25-OH":               "Immune, mood, bone, hormones — most people are low.",
    "FSH":                            "Fertility, menopause status, pituitary function.",
    "LH":                             "Pairs with FSH to regulate reproductive function.",
    "Progesterone":                   "Balances estrogen — mood, sleep, reproductive health.",
    "Apolipoprotein A-1":             "Protein in HDL — higher levels protect against heart disease.",
    "Apolipoprotein B":               "Protein in LDL — better heart-risk predictor than cholesterol.",
    "CRP-HS (Inflammation)":          "High-sensitivity inflammation marker.",
    "Cortisol":                       "Stress hormone — chronic high/low affects energy &amp; sleep.",
    "DHEA-S":                         "Precursor hormone declining with age — energy, mood, immunity.",
    "DHT":                            "Hair loss, acne, hormone balance (women’s Elite only).",
    "Ferritin":                       "Iron storage — fatigue even when iron looks normal.",
    "Folate":                         "B-vitamin for DNA synthesis — fatigue &amp; heart-disease links.",
    "GGT":                            "Sensitive liver enzyme — early liver/bile duct stress.",
    "Homocysteine":                   "Heart-disease &amp; stroke risk; B-vitamin status.",
    "IGF-1":                          "Reflects growth hormone — metabolism, muscle, longevity.",
    "Iron &amp; TIBC":                "Iron, binding capacity, saturation — anemia &amp; overload.",
    "Lipoprotein(a)":                 "Genetic heart-attack risk factor.",
    "Magnesium":                      "Cramps, anxiety, sleep — deficiency is common.",
    "PSA, Free &amp; Total":          "Detailed prostate screen — distinguishes cancer from benign.",
    "Sed Rate":                       "Inflammation marker for autoimmune conditions.",
    "T4, Free":                       "Unbound, active T4 — more accurate than total T4.",
    "Thyroglobulin Antibodies":       "Tested with TPO for autoimmune thyroid disease.",
    "Uric Acid":                      "Gout, metabolic syndrome, kidney stones.",
    "Vitamin B-12":                   "Energy, nerves, red cells — deficiency is often missed.",
}

# Essential — 17 markers (men have PSA; women have FSH/LH/Progesterone)
essential_shared = [
    "Complete Metabolic Panel (CMP)", "Lipid Panel", "CBC with Differential",
    "Estradiol", "HbA1c", "Insulin, Fasting", "SHBG",
    "T3, Free", "T4, Total", "Testosterone, Free", "Testosterone, Total",
    "TPO Antibodies", "TSH", "Vitamin D, 25-OH",
]
essential_men_only   = ["PSA, Total"]
essential_women_only = ["FSH", "LH", "Progesterone"]

# Elite extras — beyond Essential
elite_shared = [
    "Apolipoprotein A-1", "Apolipoprotein B", "CRP-HS (Inflammation)",
    "Cortisol", "DHEA-S", "Ferritin", "Folate", "GGT",
    "Homocysteine", "IGF-1", "Iron &amp; TIBC", "Lipoprotein(a)",
    "Magnesium", "Sed Rate", "T4, Free",
    "Thyroglobulin Antibodies", "Uric Acid", "Vitamin B-12",
]
elite_men_only   = ["FSH", "LH", "PSA, Free &amp; Total"]
elite_women_only = ["DHT"]


# ── PAGE 1: Essential Panel ──────────────────────────────────────────────────
def story_essential():
    s = []
    s.append(Paragraph("ESSENTIAL<br/>PANEL.", title_s))
    s.append(Paragraph("$350  ·  55–57 BIOMARKERS  ·  HORMONES, THYROID, METABOLIC, VITAMINS",
                       deck_s))
    s.append(FrameBreak())

    # ── LEFT COLUMN ──────────────────────────────────────────────────────────
    s.append(Paragraph(
        "Our foundational panel goes well beyond standard annual bloodwork. "
        "It covers hormones, thyroid, metabolic health, and key vitamins so your "
        "provider can see the full baseline before recommending a plan.",
        intro_s,
    ))

    s += section_label("Shared markers (men &amp; women)", space_before=4)
    half = (len(essential_shared) + 1) // 2
    for m in essential_shared[:half]:
        s.append(biomarker(m, descriptions[m]))

    s.append(FrameBreak())

    # ── RIGHT COLUMN ─────────────────────────────────────────────────────────
    s += section_label("Shared markers continued", space_before=0)
    for m in essential_shared[half:]:
        s.append(biomarker(m, descriptions[m]))

    s += section_label("Men’s panel adds")
    for m in essential_men_only:
        s.append(biomarker(m, descriptions[m]))

    s += section_label("Women’s panel adds")
    for m in essential_women_only:
        s.append(biomarker(m, descriptions[m]))

    s.append(Paragraph(
        "ASK THE FRONT DESK ABOUT ORDERING THE ESSENTIAL PANEL.",
        cta_s,
    ))
    return s


# ── PAGE 2: Elite Panel ──────────────────────────────────────────────────────
def story_elite():
    s = []
    s.append(Paragraph("ELITE<br/>PANEL.", title_s))
    s.append(Paragraph("$750  ·  78 BIOMARKERS  ·  EVERYTHING ESSENTIAL + ADVANCED MARKERS",
                       deck_s))
    s.append(FrameBreak())

    # ── LEFT COLUMN ──────────────────────────────────────────────────────────
    s.append(Paragraph(
        "Includes every marker from the Essential Panel plus advanced cardiovascular, "
        "inflammation, and longevity markers. The most comprehensive panel we offer — "
        "many clinics skip these entirely.",
        intro_s,
    ))

    s += section_label("Additional markers (men &amp; women)", space_before=4)
    half = (len(elite_shared) + 1) // 2
    for m in elite_shared[:half]:
        s.append(biomarker(m, descriptions[m]))

    s.append(FrameBreak())

    # ── RIGHT COLUMN ─────────────────────────────────────────────────────────
    s += section_label("Additional markers continued", space_before=0)
    for m in elite_shared[half:]:
        s.append(biomarker(m, descriptions[m]))

    s += section_label("Men’s Elite adds")
    for m in elite_men_only:
        s.append(biomarker(m, descriptions[m]))

    s += section_label("Women’s Elite adds")
    for m in elite_women_only:
        s.append(biomarker(m, descriptions[m]))

    s.append(Paragraph(
        "ASK THE FRONT DESK ABOUT UPGRADING TO THE ELITE PANEL.",
        cta_s,
    ))
    return s


# ── PAGE 3: Add-On Panels (3 cards in one row, single full-width frame) ─────
def story_addons():
    s = []
    s.append(Paragraph("ADD-ON<br/>PANELS.", title_s))
    s.append(Paragraph("SPECIALTY TESTS  ·  HEAVY METALS  ·  MOLD SENSITIVITY",
                       deck_s))
    s.append(FrameBreak())  # → full-width content frame

    # Intro paragraph
    s.append(Paragraph(
        "Add-ons can be ordered alongside any Essential or Elite blood draw. "
        "Specialty tests that go beyond routine bloodwork.",
        intro_s,
    ))
    s.append(Spacer(1, 6))

    # Card widths: 3 cards across the full content width, with two small gaps
    full_w   = PAGE_W - 2 * MARGIN
    card_gap = 0.18 * inch
    card_w   = (full_w - 2 * card_gap) / 3

    # ── Card 1: Heavy Metals Blood ──────────────────────────────────────────
    blood_rows = [
        Paragraph("<b>Arsenic</b>  &nbsp;<font color='#737373'>Water, rice, seafood — long-term: cancer &amp; heart-disease risk.</font>", bm_s),
        Paragraph("<b>Lead</b>  &nbsp;<font color='#737373'>Old paint, pipes — cognitive decline, kidneys, hypertension.</font>", bm_s),
        Paragraph("<b>Mercury</b>  &nbsp;<font color='#737373'>Fish, dental amalgams — nervous system, kidneys, immunity.</font>", bm_s),
        Spacer(1, 3),
        Paragraph("<i>No special prep — collected at your regular blood draw.</i>", note_s),
    ]
    card_blood = addon_card(
        "Heavy Metals — Blood",
        "$220",
        "Whole Blood  ·  ICP-MS/MS  ·  3 toxic metals",
        "For patients with occupational exposure, water concerns, or unexplained "
        "fatigue, headaches, or cognitive issues.",
        blood_rows,
        card_w,
    )

    # ── Card 2: Heavy Metals Urine ──────────────────────────────────────────
    urine_metals = [
        "Aluminum", "Arsenic", "Antimony", "Barium", "Bismuth", "Cadmium",
        "Cesium", "Gadolinium", "Germanium", "Lead", "Mercury", "Nickel",
        "Niobium", "Platinum", "Rubidium", "Thallium", "Thorium", "Tin",
        "Titanium", "Tungsten", "Uranium",
    ]
    urine_rows = [
        chip_grid(urine_metals, card_w, cols=3),
        Spacer(1, 4),
        Paragraph("<i>Plus creatinine (random urine) for normalization.</i>", note_s),
        Paragraph("<b>Prep:</b> Avoid seafood for 48 hours before collection. "
                  "Specimen in an acid-washed or metal-free container.",
                  ParagraphStyle('Prep', fontName='Inter', fontSize=8.5,
                                 leading=12, textColor=BODY, spaceAfter=2)),
    ]
    card_urine = addon_card(
        "Heavy Metals — Urine",
        "$280",
        "Urine  ·  ICP-MS/MS  ·  21 toxic metals",
        "Our most comprehensive toxic-metals screen. Evaluates cumulative exposure "
        "and detoxification — for environmental concerns, chelation patients, or "
        "chronic unexplained symptoms.",
        urine_rows,
        card_w,
    )

    # ── Card 3: Mold Profile Plus IgE ───────────────────────────────────────
    mold_rows = [
        Paragraph("<b>Penicillium notatum (m1)</b>  &nbsp;<font color='#737373'>Blue-green mold on food, wallpaper, damp walls.</font>", bm_s),
        Paragraph("<b>Cladosporium herbarum (m2)</b>  &nbsp;<font color='#737373'>Most common outdoor mold; thrives indoors too.</font>", bm_s),
        Paragraph("<b>Aspergillus fumigatus (m3)</b>  &nbsp;<font color='#737373'>Soil, compost, HVAC — can cause lung infections.</font>", bm_s),
        Paragraph("<b>Mucor racemosus (m4)</b>  &nbsp;<font color='#737373'>Dust, soil, decaying food — common in older buildings.</font>", bm_s),
        Paragraph("<b>Alternaria alternata (m6)</b>  &nbsp;<font color='#737373'>Showers, window frames — major asthma trigger.</font>", bm_s),
        Paragraph("<b>Stemphylium botryosum (m10)</b>  &nbsp;<font color='#737373'>Decaying plants, agricultural settings.</font>", bm_s),
    ]
    card_mold = addon_card(
        "Mold Profile Plus IgE",
        "$200",
        "Blood Draw  ·  Immunoassay  ·  6 indoor molds",
        "For patients with chronic sinus issues, unexplained respiratory "
        "symptoms, persistent fatigue, or known mold exposure.",
        mold_rows,
        card_w,
    )

    # ── Lay 3 cards in a single row table ───────────────────────────────────
    row = Table(
        [[card_blood, card_urine, card_mold]],
        colWidths=[card_w, card_w, card_w],
    )
    row.setStyle(TableStyle([
        ('VALIGN',        (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING',    (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
        ('LEFTPADDING',   (0, 0), (0, -1), 0),
        ('RIGHTPADDING',  (-1, 0), (-1, -1), 0),
        ('LEFTPADDING',   (1, 0), (1, -1), card_gap),
        ('RIGHTPADDING',  (0, 0), (0, -1), 0),
        ('LEFTPADDING',   (2, 0), (2, -1), card_gap),
    ]))
    s.append(row)

    s.append(Paragraph(
        "ASK THE FRONT DESK TO ADD ANY OF THESE TO YOUR DRAW.",
        cta_s,
    ))
    return s


# ── Driver ───────────────────────────────────────────────────────────────────
def main():
    from reportlab.platypus import PageBreak, NextPageTemplate

    os.makedirs(PUBLIC_DIR, exist_ok=True)
    out = os.path.join(PUBLIC_DIR, "Range-Lab-Panels-Guide.pdf")
    doc = make_doc(out, "Lab Panels Guide — Range Medical")

    story = []

    # Page 1: Essential (panel template — 2 columns)
    story.extend(story_essential())

    # Page 2: Elite (panel template — 2 columns)
    story.append(NextPageTemplate('panel'))
    story.append(PageBreak())
    story.extend(story_elite())

    # Page 3: Add-Ons (full-width template — single frame, 3 cards in row)
    story.append(NextPageTemplate('addons'))
    story.append(PageBreak())
    story.extend(story_addons())

    doc.build(story)
    print(f"Wrote {out}")


if __name__ == "__main__":
    main()
