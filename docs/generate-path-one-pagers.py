"""
Generate three single-page (landscape, 2-column) patient-path one-pagers using
the Range Medical V2 editorial design system from styles/globals.css:

  - Inter font family (Regular / Medium / SemiBold / Bold / ExtraBold / Black)
  - Heavy uppercase headlines with negative tracking (matches h1/h2 on the site)
  - Tracked-out small-cap eyebrow labels (matches .rm-section-label / .rm-nav-cta)
  - Editorial palette: #1A1A1A text, #737373 body, #e8e8e8 hairlines

Outputs:
  1. Range-How-It-Works-One-Pager.pdf
  2. Range-Energy-Hormones-Weight-Path.pdf
  3. Range-Injury-Recovery-Path.pdf
"""

import os
from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor
from reportlab.platypus import (BaseDocTemplate, Frame, PageTemplate,
                                Paragraph, Spacer, Table, TableStyle,
                                HRFlowable, FrameBreak)
from reportlab.lib.enums import TA_LEFT, TA_RIGHT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily

# ── Paths ────────────────────────────────────────────────────────────────────
DOCS_DIR   = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR   = os.path.abspath(os.path.join(DOCS_DIR, ".."))
PUBLIC_DIR = os.path.join(ROOT_DIR, "public")
FONTS_DIR  = os.path.join(ROOT_DIR, "scripts", ".fonts")

# ── Register Inter (matches the website's V2 typography) ────────────────────
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


def _ensure_fonts_downloaded():
    """Fetch the Inter v4 release zip on first run; static TTFs are gitignored."""
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
            try:
                with zf.open(f"extras/ttf/{fn}") as src, \
                     open(os.path.join(FONTS_DIR, fn), "wb") as dst:
                    dst.write(src.read())
            except KeyError:
                raise RuntimeError(f"Inter weight {fn} not found in release zip")
    print("Fonts ready.")


def _register_fonts():
    _ensure_fonts_downloaded()
    for name, fn in INTER_WEIGHTS.items():
        pdfmetrics.registerFont(TTFont(name, os.path.join(FONTS_DIR, fn)))
    # Make <b> / <i> in inline markup resolve correctly
    registerFontFamily(
        "Inter",
        normal="Inter",
        bold="Inter-Bold",
        italic="Inter-Italic",
        boldItalic="Inter-BoldItalic",
    )

_register_fonts()

# ── V2 palette (mirrors styles/globals.css) ──────────────────────────────────
TEXT      = HexColor('#1A1A1A')   # h1, h2, .rm-wordmark color
BODY      = HexColor('#737373')   # default p color
MUTED     = HexColor('#a0a0a0')   # subtler labels
BORDER    = HexColor('#e8e8e8')   # .rm-header border-bottom
RULE_HEAD = HexColor('#1A1A1A')   # heavy editorial rule under header
SUBTLE_BG = HexColor('#fafafa')   # editorial off-white card fill
WHITE     = HexColor('#FFFFFF')
GREEN     = HexColor('#2E6B35')

# ── Page geometry ────────────────────────────────────────────────────────────
PAGE_W, PAGE_H = landscape(letter)        # 11" × 8.5"
MARGIN         = 0.42 * inch
HEADER_H       = 0.48 * inch
TITLE_H        = 1.18 * inch              # 2-line Inter Black headline + deck
FOOTER_H       = 0.40 * inch
COL_GAP        = 0.40 * inch
COL_W          = (PAGE_W - 2 * MARGIN - COL_GAP) / 2

# ── Tracking helper (CSS letter-spacing → ReportLab charSpace) ──────────────
def track(font_size_pt, em):
    """Return ReportLab charSpace for a given CSS letter-spacing in em."""
    return font_size_pt * em

# ── Styles (mapped 1:1 from globals.css) ────────────────────────────────────
def st(name, **kw):
    return ParagraphStyle(name, **kw)

# h1 → 28pt Inter Black, uppercase, line-height 0.95, letter-spacing -0.03em
title_s     = st('Title',
                 fontName='Inter-Black',  fontSize=30, leading=29,
                 textColor=TEXT, charSpace=track(30, -0.03),
                 spaceAfter=4)

# Subtitle / deck — 11pt Inter Medium gray
subtitle_s  = st('Sub',
                 fontName='Inter-Medium', fontSize=11, leading=14,
                 textColor=BODY)

# Lead/intro paragraph — slightly larger, body color
intro_s     = st('Intro',
                 fontName='Inter',        fontSize=10, leading=14.5,
                 textColor=BODY, spaceAfter=4)

# Section eyebrow — Inter ExtraBold 8pt, uppercase, tracked-out 0.14em
sec_s       = st('Sec',
                 fontName='Inter-ExtraBold', fontSize=7.5, leading=10,
                 textColor=BODY, charSpace=track(7.5, 0.14),
                 spaceBefore=10, spaceAfter=4)

# Body paragraph — Inter Regular 9.5pt, gray
body_s      = st('Body',
                 fontName='Inter',        fontSize=9.5, leading=14,
                 textColor=BODY, spaceAfter=3)

# Bullet — Inter Regular, en-dash leader
bullet_s    = st('Bul',
                 fontName='Inter',        fontSize=9.5, leading=14,
                 textColor=BODY,
                 leftIndent=12, firstLineIndent=-10, spaceAfter=2)

# Numbered step — bold leader, gray body
step_s      = st('Step',
                 fontName='Inter',        fontSize=9.5, leading=14,
                 textColor=BODY,
                 leftIndent=16, firstLineIndent=-16, spaceAfter=3)

# Card title — Inter ExtraBold uppercase with light positive tracking
path_t_s    = st('PathT',
                 fontName='Inter-ExtraBold', fontSize=10, leading=12,
                 textColor=TEXT, charSpace=track(10, 0.06),
                 spaceAfter=3)

# Card body — Inter Regular, body gray
path_b_s    = st('PathB',
                 fontName='Inter',        fontSize=9.5, leading=13,
                 textColor=BODY)

# Reassurance — italic green
reassure_s  = st('Reas',
                 fontName='Inter-Italic', fontSize=10, leading=13,
                 textColor=GREEN, spaceBefore=6, spaceAfter=4)

# CTA — Inter ExtraBold uppercase, tracked 0.10em
cta_s       = st('CTA',
                 fontName='Inter-ExtraBold', fontSize=9.5, leading=13,
                 textColor=TEXT, charSpace=track(9.5, 0.10),
                 spaceBefore=10, spaceAfter=2)


# ── Helpers ──────────────────────────────────────────────────────────────────
def section_label(text, space_before=10):
    s = ParagraphStyle('SecOv', parent=sec_s, spaceBefore=space_before)
    return [
        Paragraph(text.upper(), s),
        HRFlowable(width="100%", thickness=0.5, color=BORDER, spaceAfter=5),
    ]


def bullet(text):
    return Paragraph(f"–  {text}", bullet_s)


def step(num, text):
    return Paragraph(f"<b>{num}.</b>  {text}", step_s)


def path_card(title, body, width=None):
    """Editorial card: thin black rule on top, heavy uppercase title, body text."""
    if width is None:
        width = COL_W
    title_p = Paragraph(title.upper(), path_t_s)
    body_p  = Paragraph(body, path_b_s)
    rule    = HRFlowable(width=width - 12, thickness=1.5, color=TEXT,
                         spaceBefore=0, spaceAfter=4)
    inner = Table([[rule], [title_p], [body_p]], colWidths=[width])
    inner.setStyle(TableStyle([
        ('BACKGROUND',    (0, 0), (-1, -1), SUBTLE_BG),
        ('TOPPADDING',    (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
        ('LEFTPADDING',   (0, 0), (-1, -1), 12),
        ('RIGHTPADDING',  (0, 0), (-1, -1), 12),
    ]))
    return inner


# ── Page chrome (header / footer / column rule, drawn on canvas) ────────────
def _tracked_text(canvas, x, y, text, font, size, em, color, align='left'):
    """Draw text with CSS-style letter-spacing using a text object."""
    canvas.saveState()
    canvas.setFillColor(color)
    if align == 'right':
        # Measure tracked width and shift left
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


def draw_page_chrome(canvas, doc):
    canvas.saveState()

    # ── Header ───────────────────────────────────────────────────────────────
    top_y = PAGE_H - MARGIN

    # Wordmark — matches .rm-wordmark: ExtraBold 12pt, letter-spacing 0.15em
    _tracked_text(canvas, MARGIN, top_y - 12,
                  "RANGE MEDICAL", "Inter-ExtraBold", 12, 0.15, TEXT)

    # Contact info — right side, two lines, Inter Regular 8pt body gray
    canvas.setFillColor(BODY)
    canvas.setFont('Inter', 8)
    canvas.drawRightString(PAGE_W - MARGIN, top_y - 7,
                           "range-medical.com  •  (949) 997-3988")
    canvas.drawRightString(PAGE_W - MARGIN, top_y - 18,
                           "1901 Westcliff Drive, Suite 10, Newport Beach, CA")

    # Header hairline — matches site border #e8e8e8
    rule_y = top_y - HEADER_H + 6
    canvas.setStrokeColor(BORDER)
    canvas.setLineWidth(1.0)
    canvas.line(MARGIN, rule_y, PAGE_W - MARGIN, rule_y)

    # ── Column separator ─────────────────────────────────────────────────────
    sep_x = MARGIN + COL_W + COL_GAP / 2
    sep_top    = PAGE_H - MARGIN - HEADER_H - TITLE_H - 4
    sep_bottom = MARGIN + FOOTER_H + 6
    canvas.setStrokeColor(BORDER)
    canvas.setLineWidth(0.5)
    canvas.line(sep_x, sep_top, sep_x, sep_bottom)

    # ── Footer ───────────────────────────────────────────────────────────────
    foot_top_y = MARGIN + FOOTER_H
    canvas.setStrokeColor(BORDER)
    canvas.setLineWidth(0.5)
    canvas.line(MARGIN, foot_top_y, PAGE_W - MARGIN, foot_top_y)

    # Left foot — bold dark, tracked-out per .rm-nav-cta style
    _tracked_text(canvas, MARGIN, foot_top_y - 13,
                  "READY TO START?  CALL OR TEXT (949) 997-3988",
                  "Inter-ExtraBold", 8, 0.10, TEXT)

    # Right foot — small gray italic disclaimer
    canvas.setFillColor(BODY)
    canvas.setFont('Inter-Italic', 7.5)
    canvas.drawRightString(PAGE_W - MARGIN, foot_top_y - 13,
                           "Cash-pay clinic.  All meds and labs are as medically indicated and require provider approval.")

    canvas.restoreState()


# ── Doc template factory ─────────────────────────────────────────────────────
def make_doc(path, title):
    doc = BaseDocTemplate(
        path,
        pagesize=landscape(letter),
        leftMargin=MARGIN, rightMargin=MARGIN,
        topMargin=MARGIN,  bottomMargin=MARGIN,
        title=title, author="Range Medical",
    )

    title_y     = PAGE_H - MARGIN - HEADER_H - TITLE_H
    title_frame = Frame(
        MARGIN, title_y, PAGE_W - 2 * MARGIN, TITLE_H,
        leftPadding=0, rightPadding=0, topPadding=4, bottomPadding=0,
        showBoundary=0, id='title',
    )

    content_top    = title_y - 4
    content_bottom = MARGIN + FOOTER_H + 6
    content_h      = content_top - content_bottom

    left_frame  = Frame(
        MARGIN, content_bottom, COL_W, content_h,
        leftPadding=0, rightPadding=8, topPadding=0, bottomPadding=0,
        showBoundary=0, id='left',
    )
    right_frame = Frame(
        MARGIN + COL_W + COL_GAP, content_bottom, COL_W, content_h,
        leftPadding=8, rightPadding=0, topPadding=0, bottomPadding=0,
        showBoundary=0, id='right',
    )

    doc.addPageTemplates([
        PageTemplate(id='onepager',
                     frames=[title_frame, left_frame, right_frame],
                     onPage=draw_page_chrome),
    ])
    return doc


# ── PAGE 1: How Range Medical Works ──────────────────────────────────────────
def story_how_it_works():
    s = []
    s.append(Paragraph("ONE ASSESSMENT.<br/>ONE PLAN.", title_s))
    s.append(Paragraph("Feel like yourself again.", subtitle_s))
    s.append(FrameBreak())

    # ── LEFT COLUMN ──────────────────────────────────────────────────────────
    s.append(Paragraph(
        "Something feels off. Maybe you’re tired all the time. Maybe your body "
        "isn’t bouncing back the way it used to. You don’t need to figure it out "
        "alone — that’s what we’re here for.",
        intro_s,
    ))

    s += section_label("Who we help", space_before=4)
    for line in [
        "You feel tired even after a full night of sleep.",
        "Your thinking feels foggy or slow.",
        "Your body takes longer to recover than it used to.",
        "You’re struggling with weight that won’t budge.",
        "You just don’t feel like yourself anymore.",
    ]:
        s.append(bullet(line))

    s += section_label("Step 1 — Range Assessment, your starting point")
    s.append(Paragraph(
        "Everything starts with one calm conversation. No pressure, no guesswork.",
        body_s,
    ))
    for line in [
        "We listen to your story and your symptoms.",
        "We talk about your goals and what matters to you.",
        "We decide together if labs make sense.",
        "If you move forward with a plan, your assessment fee is applied toward it.",
    ]:
        s.append(bullet(line))

    s.append(FrameBreak())

    # ── RIGHT COLUMN ─────────────────────────────────────────────────────────
    s += section_label("Step 2 — Choose your path with your provider", space_before=0)
    s.append(path_card(
        "Energy, Hormones &amp; Weight",
        "For people who feel run down, foggy, or stuck. We look at what’s "
        "going on inside your body and build a plan to help you feel like "
        "yourself again.",
    ))
    s.append(Spacer(1, 6))
    s.append(path_card(
        "Injury &amp; Recovery",
        "For people healing from an injury or surgery. We work alongside "
        "Range Sports Therapy, located in the same building, to support "
        "your recovery from the inside out.",
    ))

    s += section_label("Step 3 — Tools we may use")
    s.append(Paragraph(
        "Your provider may include tools like hormone therapy, weight loss support, "
        "peptides, IV therapy, red light therapy, hyperbaric oxygen therapy, PRP, "
        "or exosomes as part of your plan. These are tools — not a menu.",
        body_s,
    ))
    s.append(Paragraph(
        "“You don’t have to figure this out alone. We help you choose what fits "
        "your body and your goals.”",
        reassure_s,
    ))

    s.append(Paragraph("ASK THE FRONT DESK ABOUT SCHEDULING YOUR RANGE ASSESSMENT TODAY.", cta_s))

    return s


# ── PAGE 2: Energy, Hormones & Weight ────────────────────────────────────────
def story_energy_hormones_weight():
    s = []
    s.append(Paragraph("FEEL LIKE<br/>YOURSELF AGAIN.", title_s))
    s.append(Paragraph("Energy, Hormones &amp; Weight.", subtitle_s))
    s.append(FrameBreak())

    # ── LEFT COLUMN ──────────────────────────────────────────────────────────
    s.append(Paragraph(
        "Something changed. You used to have more energy, more focus, more drive. "
        "Now it takes everything you have just to get through the day. You’re not "
        "imagining it — and you don’t have to accept it.",
        intro_s,
    ))

    s += section_label("Is this you?", space_before=4)
    for line in [
        "You’re tired even after a full night of sleep.",
        "Your brain feels foggy or scattered.",
        "Weight seems to stick no matter what you try.",
        "Your mood has shifted and you’re not sure why.",
        "Your motivation or drive isn’t what it used to be.",
        "You’ve tried supplements or diets and nothing lasted.",
    ]:
        s.append(bullet(line))

    s += section_label("How this path works")
    s.append(step(1, "<b>Range Assessment.</b> We sit down and talk through your "
                     "symptoms and goals. No rush. No judgment."))
    s.append(step(2, "<b>Deeper labs.</b> Blood work that looks at hormones, "
                     "nutrients, metabolism, and other markers so we can see what’s "
                     "really going on."))
    s.append(step(3, "<b>Review together.</b> Your provider explains your results in "
                     "simple language and answers every question."))
    s.append(step(4, "<b>Start your program.</b> You decide together on a plan that "
                     "fits your body and your life."))

    s.append(FrameBreak())

    # ── RIGHT COLUMN ─────────────────────────────────────────────────────────
    s += section_label("Common program types", space_before=0)
    s.append(path_card(
        "Hormone Optimization",
        "Steady support for energy, mood, and drive when your levels are off.",
    ))
    s.append(Spacer(1, 5))
    s.append(path_card(
        "Medical Weight Loss",
        "Medication, labs, and guidance to help your body respond to weight loss again.",
    ))
    s.append(Spacer(1, 5))
    s.append(path_card(
        "Peptide Therapy",
        "Targeted support for energy, sleep, and recovery.",
    ))
    s.append(Spacer(1, 5))
    s.append(Paragraph(
        "<i>Your provider recommends what fits you. These are tools — not a menu.</i>",
        body_s,
    ))

    s += section_label("What to expect")
    for line in [
        "Most people start noticing changes over several weeks, not overnight.",
        "We check in with you regularly and adjust as your body responds.",
        "You always have a chance to ask questions and change course.",
        "You’re never locked into something that isn’t working.",
    ]:
        s.append(bullet(line))

    s.append(Paragraph(
        "TALK WITH YOUR PROVIDER ABOUT STARTING THIS PATH WITH A RANGE ASSESSMENT.",
        cta_s,
    ))

    return s


# ── PAGE 3: Injury & Recovery (with Range Sports Therapy) ────────────────────
def story_injury_recovery():
    s = []
    s.append(Paragraph("INJURY<br/>RECOVERY.", title_s))
    s.append(Paragraph("When time and rehab aren’t enough.", subtitle_s))
    s.append(FrameBreak())

    # ── LEFT COLUMN ──────────────────────────────────────────────────────────
    s.append(Paragraph(
        "You’re doing the work — the exercises, the stretches, the ice. But your "
        "body still isn’t healing the way you expected. Sometimes recovery needs "
        "support from the inside, too.",
        intro_s,
    ))

    s += section_label("Who this is for", space_before=4)
    for line in [
        "You’re dealing with a sprain, strain, or overuse injury.",
        "You have a tendon or ligament issue that won’t resolve.",
        "You’re recovering from surgery and want to heal faster.",
        "You have chronic pain that keeps coming back.",
        "Your injury is healing too slowly and you want more options.",
        "You’ve been referred by a physical therapist or chiropractor.",
    ]:
        s.append(bullet(line))

    s += section_label("How Range Medical + Range Sports Therapy work together")
    s.append(Paragraph(
        "<b>Range Sports Therapy</b> focuses on hands-on care, movement, and rehab. "
        "<b>Range Medical</b> focuses on what’s happening inside your body — "
        "healing, inflammation, and recovery. Both are in the same building, and "
        "we often share patients. The goal: support your body from the inside and "
        "outside at the same time.",
        body_s,
    ))

    s.append(FrameBreak())

    # ── RIGHT COLUMN ─────────────────────────────────────────────────────────
    s += section_label("Your recovery path", space_before=0)
    s.append(step(1, "<b>Range Assessment.</b> We review your injury, your goals, "
                     "and your current care."))
    s.append(step(2, "<b>Plan with your providers.</b> We coordinate with your "
                     "Range Sports Therapy team so everyone is aligned."))
    s.append(step(3, "<b>Recovery tools.</b> Your plan may include peptides, PRP, "
                     "exosomes, IVs, red light, or hyperbaric oxygen."))
    s.append(step(4, "<b>Track progress.</b> We check in and adjust as you heal."))

    s += section_label("Recovery tools we may use")
    for line in [
        "<b>Peptide Therapy</b> — may help your body’s natural repair process.",
        "<b>PRP &amp; Exosomes</b> — concentrated treatments applied to the injury area.",
        "<b>IV Therapy</b> — nutrients delivered directly to help your body recover.",
        "<b>Red Light Therapy</b> — may help reduce inflammation and support healing.",
        "<b>Hyperbaric Oxygen</b> — higher-pressure oxygen that may support tissue healing.",
    ]:
        s.append(bullet(line))

    s.append(Paragraph(
        "<i>We do <b>not</b> replace your PT or chiro work — we support it.</i>",
        body_s,
    ))

    s.append(Paragraph(
        "ASK YOUR THERAPIST OR FRONT DESK ABOUT STARTING WITH A RANGE ASSESSMENT.",
        cta_s,
    ))

    return s


# ── Driver ───────────────────────────────────────────────────────────────────
def render(out_dir, filename, title, story_fn):
    path = os.path.join(out_dir, filename)
    doc = make_doc(path, title)
    doc.build(story_fn())
    print(f"Wrote {path}")


def main():
    os.makedirs(PUBLIC_DIR, exist_ok=True)

    render(PUBLIC_DIR, "Range-How-It-Works-One-Pager.pdf",
           "How Range Medical Works — Range Medical",
           story_how_it_works)
    render(PUBLIC_DIR, "Range-Energy-Hormones-Weight-Path.pdf",
           "Energy, Hormones & Weight Path — Range Medical",
           story_energy_hormones_weight)
    render(PUBLIC_DIR, "Range-Injury-Recovery-Path.pdf",
           "Injury & Recovery Path — Range Medical",
           story_injury_recovery)


if __name__ == "__main__":
    main()
