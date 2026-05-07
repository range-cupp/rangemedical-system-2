"""
Generate three TRUE one-page (landscape, 2-column) one-pagers for Range Medical:

  1. How Range Medical Works           (general intro / lobby handout)
  2. Energy, Hormones & Weight Path    (optimization avatar)
  3. Injury & Recovery Path            (rehab avatar — partners with Range Sports Therapy)

Layout: landscape letter (11" × 8.5"), header band at top, full-width title band,
two content columns separated by a hairline, footer band at bottom — all on one page.
Visual style follows the Range Medical base template in CLAUDE.md.
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

DOCS_DIR   = os.path.dirname(os.path.abspath(__file__))
PUBLIC_DIR = os.path.abspath(os.path.join(DOCS_DIR, "..", "public"))

# ── Palette ──────────────────────────────────────────────────────────────────
BLACK      = HexColor('#0A0A0A')
DARK_GRAY  = HexColor('#1A1A1A')
MID_GRAY   = HexColor('#606060')
LIGHT_GRAY = HexColor('#F4F4F4')
RULE_GRAY  = HexColor('#DDDDDD')
WHITE      = HexColor('#FFFFFF')
GREEN      = HexColor('#2E6B35')
ACCENT_BG  = HexColor('#F8F8F6')

# ── Page geometry ────────────────────────────────────────────────────────────
PAGE_W, PAGE_H = landscape(letter)        # 11" × 8.5"
MARGIN         = 0.45 * inch
HEADER_H       = 0.50 * inch              # band for clinic name + rule
TITLE_H        = 0.65 * inch              # band for title + subtitle
FOOTER_H       = 0.42 * inch              # band for bottom rule + small text
COL_GAP        = 0.35 * inch
COL_W          = (PAGE_W - 2 * MARGIN - COL_GAP) / 2

# ── Styles ───────────────────────────────────────────────────────────────────
def st(name, **kw):
    return ParagraphStyle(name, **kw)

clinic_s    = st('Clinic',  fontName='Helvetica-Bold',    fontSize=13,  textColor=BLACK,     leading=15)
contact_s   = st('Cont',    fontName='Helvetica',         fontSize=8,   textColor=MID_GRAY,  leading=11, alignment=TA_RIGHT)
title_s     = st('Title',   fontName='Helvetica-Bold',    fontSize=22,  textColor=BLACK,     leading=26, spaceAfter=2)
subtitle_s  = st('Sub',     fontName='Helvetica-Oblique', fontSize=11,  textColor=MID_GRAY,  leading=14)
intro_s     = st('Intro',   fontName='Helvetica',         fontSize=9.5, textColor=DARK_GRAY, leading=14, spaceAfter=4)
sec_s       = st('Sec',     fontName='Helvetica-Bold',    fontSize=8,   textColor=MID_GRAY,  leading=11, spaceBefore=10, spaceAfter=3)
body_s      = st('Body',    fontName='Helvetica',         fontSize=9.5, textColor=DARK_GRAY, leading=14, spaceAfter=3)
bullet_s    = st('Bul',     fontName='Helvetica',         fontSize=9.5, textColor=DARK_GRAY, leading=14, leftIndent=12, firstLineIndent=-10, spaceAfter=1)
step_s      = st('Step',    fontName='Helvetica',         fontSize=9.5, textColor=DARK_GRAY, leading=14, leftIndent=16, firstLineIndent=-16, spaceAfter=3)
path_t_s    = st('PathT',   fontName='Helvetica-Bold',    fontSize=10.5,textColor=BLACK,     leading=13, spaceAfter=1)
path_b_s    = st('PathB',   fontName='Helvetica',         fontSize=9.5, textColor=DARK_GRAY, leading=13, spaceAfter=1)
foot_s      = st('Foot',    fontName='Helvetica-Oblique', fontSize=8,   textColor=MID_GRAY,  leading=11)
foot_bold_s = st('FootB',   fontName='Helvetica-Bold',    fontSize=8.5, textColor=DARK_GRAY, leading=11)
cta_s       = st('CTA',     fontName='Helvetica-Bold',    fontSize=10.5,textColor=BLACK,     leading=14, spaceBefore=8, spaceAfter=2)
reassure_s  = st('Reas',    fontName='Helvetica-Oblique', fontSize=10,  textColor=GREEN,     leading=13, spaceBefore=4, spaceAfter=4)


# ── Helpers ──────────────────────────────────────────────────────────────────
def section_label(text, space_before=8):
    s = ParagraphStyle('SecOv', parent=sec_s, spaceBefore=space_before)
    return [
        Paragraph(text.upper(), s),
        HRFlowable(width="100%", thickness=0.75, color=RULE_GRAY, spaceAfter=4),
    ]


def bullet(text):
    return Paragraph(f"–  {text}", bullet_s)


def step(num, text):
    return Paragraph(f"<b>{num}.</b>  {text}", step_s)


def path_card(title, body, width=None):
    """Soft card to highlight a path or program type."""
    if width is None:
        width = COL_W
    title_p = Paragraph(title, path_t_s)
    body_p  = Paragraph(body, path_b_s)
    inner = Table([[title_p], [body_p]], colWidths=[width])
    inner.setStyle(TableStyle([
        ('BACKGROUND',    (0, 0), (-1, -1), ACCENT_BG),
        ('BOX',           (0, 0), (-1, -1), 0.5, RULE_GRAY),
        ('LEFTPADDING',   (0, 0), (-1, -1), 10),
        ('RIGHTPADDING',  (0, 0), (-1, -1), 10),
        ('TOPPADDING',    (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
    ]))
    return inner


# ── Page-level header / footer / column rule (drawn directly on canvas) ─────
def draw_page_chrome(canvas, doc):
    canvas.saveState()

    # ── Header band ──────────────────────────────────────────────────────────
    top_y = PAGE_H - MARGIN
    # Clinic name (left)
    canvas.setFillColor(BLACK)
    canvas.setFont('Helvetica-Bold', 13)
    canvas.drawString(MARGIN, top_y - 13, "RANGE MEDICAL")

    # Contact info (right, two lines)
    canvas.setFillColor(MID_GRAY)
    canvas.setFont('Helvetica', 8)
    canvas.drawRightString(PAGE_W - MARGIN, top_y - 9,
                           "range-medical.com  •  (949) 997-3988")
    canvas.drawRightString(PAGE_W - MARGIN, top_y - 20,
                           "1901 Westcliff Drive, Suite 10, Newport Beach, CA")

    # Header rule
    rule_y = top_y - HEADER_H + 4
    canvas.setStrokeColor(BLACK)
    canvas.setLineWidth(1.5)
    canvas.line(MARGIN, rule_y, PAGE_W - MARGIN, rule_y)

    # ── Column separator (hairline between left & right) ─────────────────────
    sep_x = MARGIN + COL_W + COL_GAP / 2
    sep_top    = PAGE_H - MARGIN - HEADER_H - TITLE_H - 4
    sep_bottom = MARGIN + FOOTER_H + 4
    canvas.setStrokeColor(RULE_GRAY)
    canvas.setLineWidth(0.5)
    canvas.line(sep_x, sep_top, sep_x, sep_bottom)

    # ── Footer band ──────────────────────────────────────────────────────────
    foot_top_y = MARGIN + FOOTER_H
    canvas.setStrokeColor(RULE_GRAY)
    canvas.setLineWidth(0.5)
    canvas.line(MARGIN, foot_top_y, PAGE_W - MARGIN, foot_top_y)

    canvas.setFillColor(DARK_GRAY)
    canvas.setFont('Helvetica-Bold', 8.5)
    canvas.drawString(MARGIN, foot_top_y - 13,
                      "Questions or ready to start?  Call or text (949) 997-3988  •  range-medical.com")

    canvas.setFillColor(MID_GRAY)
    canvas.setFont('Helvetica-Oblique', 8)
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

    # Title frame: full-width band just below the header
    title_y      = PAGE_H - MARGIN - HEADER_H - TITLE_H
    title_frame  = Frame(
        MARGIN, title_y, PAGE_W - 2 * MARGIN, TITLE_H,
        leftPadding=0, rightPadding=0, topPadding=2, bottomPadding=0,
        showBoundary=0, id='title',
    )

    # Two content frames below the title, above the footer
    content_top    = title_y - 4
    content_bottom = MARGIN + FOOTER_H + 4
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

    # ── Title band ───────────────────────────────────────────────────────────
    s.append(Paragraph("One Assessment. One Plan.", title_s))
    s.append(Paragraph("Feel like yourself again.", subtitle_s))
    s.append(FrameBreak())  # → left column

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

    s.append(FrameBreak())  # → right column

    # ── RIGHT COLUMN ─────────────────────────────────────────────────────────
    s += section_label("Step 2 — Choose your path with your provider", space_before=0)
    s.append(path_card(
        "Energy, Hormones &amp; Weight",
        "For people who feel run down, foggy, or stuck. We look at what’s "
        "going on inside your body and build a plan to help you feel like "
        "yourself again.",
    ))
    s.append(Spacer(1, 5))
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

    s.append(Paragraph(
        "Ask the front desk about scheduling your Range Assessment today.",
        cta_s,
    ))

    return s


# ── PAGE 2: Energy, Hormones & Weight ────────────────────────────────────────
def story_energy_hormones_weight():
    s = []

    s.append(Paragraph("Feel Like Yourself Again", title_s))
    s.append(Paragraph("Energy, Hormones &amp; Weight", subtitle_s))
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
    s.append(Spacer(1, 4))
    s.append(path_card(
        "Medical Weight Loss",
        "Medication, labs, and guidance to help your body respond to weight loss again.",
    ))
    s.append(Spacer(1, 4))
    s.append(path_card(
        "Peptide Therapy",
        "Targeted support for energy, sleep, and recovery.",
    ))
    s.append(Spacer(1, 4))
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
        "Talk with your provider or the front desk about starting the "
        "Energy, Hormones &amp; Weight path with a Range Assessment.",
        cta_s,
    ))

    return s


# ── PAGE 3: Injury & Recovery (with Range Sports Therapy) ────────────────────
def story_injury_recovery():
    s = []

    s.append(Paragraph("Injury Recovery", title_s))
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
        "we often share patients.",
        body_s,
    ))

    s += section_label("Your recovery path")
    s.append(step(1, "<b>Range Assessment.</b> We review your injury, your goals, "
                     "and your current care."))
    s.append(step(2, "<b>Plan with your providers.</b> We coordinate with your "
                     "Range Sports Therapy team so everyone is aligned."))
    s.append(step(3, "<b>Recovery tools.</b> Your plan may include peptides, PRP, "
                     "exosomes, IVs, red light, or hyperbaric oxygen."))
    s.append(step(4, "<b>Track progress.</b> We check in and adjust as you heal."))

    s.append(FrameBreak())

    # ── RIGHT COLUMN ─────────────────────────────────────────────────────────
    s += section_label("Recovery tools we may use", space_before=0)
    for line in [
        "<b>Peptide Therapy</b> — targeted support that may help your body’s natural repair process.",
        "<b>PRP &amp; Exosomes</b> — concentrated treatments applied to the injury area to support tissue recovery.",
        "<b>IV Therapy</b> — nutrients delivered directly to help your body recover and reduce fatigue.",
        "<b>Red Light Therapy</b> — light energy that may help reduce inflammation and support healing.",
        "<b>Hyperbaric Oxygen</b> — higher-pressure oxygen that may support tissue healing.",
    ]:
        s.append(bullet(line))

    s += section_label("How this fits with your PT or chiro care")
    s.append(Paragraph(
        "We do <b>not</b> replace your physical therapy or chiropractic work — we "
        "support it. Your provider can coordinate with your Range Sports Therapy "
        "team so everything works together. One team, one building, one goal: "
        "get you back to what you love.",
        body_s,
    ))

    s.append(Paragraph(
        "“Better support from the inside and outside at the same time.”",
        reassure_s,
    ))

    s.append(Paragraph(
        "Ask your therapist or the Range Medical front desk about starting the "
        "Injury &amp; Recovery path with a Range Assessment.",
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
