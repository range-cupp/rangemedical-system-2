"""
Generate three patient-education one-pagers explaining how Range Medical works
and the two main patient paths:

  1. How Range Medical Works           (general intro / lobby handout)
  2. Energy, Hormones & Weight Path    (optimization avatar)
  3. Injury & Recovery Path            (rehab avatar — partners with Range Sports Therapy)

Visual style follows the Range Medical base template in CLAUDE.md:
  - Small-caps gray section labels + 0.75pt rule (no filled color bars)
  - 13pt bold clinic name, 8pt right-aligned contact line
  - 16pt body leading, proper unicode dashes & checkmarks
"""

import os
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table,
                                TableStyle, HRFlowable)
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
GREEN_BG   = HexColor('#EAF3EC')
ACCENT_BG  = HexColor('#F8F8F6')

W = 7.0 * inch  # content width with 0.75" margins on letter

# ── Styles ───────────────────────────────────────────────────────────────────
def st(name, **kw):
    return ParagraphStyle(name, **kw)

clinic_s    = st('Clinic',  fontName='Helvetica-Bold',    fontSize=13,  textColor=BLACK,     leading=16)
contact_s   = st('Cont',    fontName='Helvetica',         fontSize=8,   textColor=MID_GRAY,  leading=12, alignment=TA_RIGHT)
title_s     = st('Title',   fontName='Helvetica-Bold',    fontSize=20,  textColor=BLACK,     leading=24, spaceAfter=2)
subtitle_s  = st('Sub',     fontName='Helvetica-Oblique', fontSize=10.5,textColor=MID_GRAY,  leading=14)
intro_s     = st('Intro',   fontName='Helvetica',         fontSize=10,  textColor=DARK_GRAY, leading=15, spaceAfter=4)
sec_s       = st('Sec',     fontName='Helvetica-Bold',    fontSize=8,   textColor=MID_GRAY,  leading=11, spaceBefore=14, spaceAfter=3)
sub_s       = st('SubH',    fontName='Helvetica-Bold',    fontSize=10,  textColor=BLACK,     leading=13, spaceBefore=6, spaceAfter=3)
body_s      = st('Body',    fontName='Helvetica',         fontSize=9.5, textColor=DARK_GRAY, leading=16, spaceAfter=4)
bullet_s    = st('Bul',     fontName='Helvetica',         fontSize=9.5, textColor=DARK_GRAY, leading=16, leftIndent=14, firstLineIndent=-10, spaceAfter=2)
step_s      = st('Step',    fontName='Helvetica',         fontSize=9.5, textColor=DARK_GRAY, leading=16, leftIndent=18, firstLineIndent=-18, spaceAfter=4)
path_t_s    = st('PathT',   fontName='Helvetica-Bold',    fontSize=11,  textColor=BLACK,     leading=14, spaceAfter=2)
path_b_s    = st('PathB',   fontName='Helvetica',         fontSize=9.5, textColor=DARK_GRAY, leading=14, spaceAfter=2)
foot_s      = st('Foot',    fontName='Helvetica-Oblique', fontSize=8,   textColor=MID_GRAY,  leading=12)
foot_bold_s = st('FootB',   fontName='Helvetica-Bold',    fontSize=8.5, textColor=DARK_GRAY, leading=12)
cta_s       = st('CTA',     fontName='Helvetica-Bold',    fontSize=10.5,textColor=BLACK,     leading=14, spaceBefore=8, spaceAfter=4)
reassure_s  = st('Reas',    fontName='Helvetica-Oblique', fontSize=10,  textColor=GREEN,     leading=14, spaceBefore=4, spaceAfter=4)


# ── Helpers ──────────────────────────────────────────────────────────────────
def section_label(text):
    return [
        Paragraph(text.upper(), sec_s),
        HRFlowable(width="100%", thickness=0.75, color=RULE_GRAY, spaceAfter=8),
    ]


def bullet(text):
    return Paragraph(f"–  {text}", bullet_s)


def step(num, text):
    return Paragraph(f"<b>{num}.</b>  {text}", step_s)


def path_card(title, body):
    """Soft card to highlight a patient path."""
    title_p = Paragraph(title, path_t_s)
    body_p  = Paragraph(body, path_b_s)
    inner = Table([[title_p], [body_p]], colWidths=[W - 0.2 * inch])
    inner.setStyle(TableStyle([
        ('BACKGROUND',    (0, 0), (-1, -1), ACCENT_BG),
        ('BOX',           (0, 0), (-1, -1), 0.5, RULE_GRAY),
        ('LEFTPADDING',   (0, 0), (-1, -1), 12),
        ('RIGHTPADDING',  (0, 0), (-1, -1), 12),
        ('TOPPADDING',    (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 9),
    ]))
    return inner


def build_header(story):
    hdr = Table([[
        Paragraph("RANGE MEDICAL", clinic_s),
        Paragraph("range-medical.com  •  (949) 997-3988<br/>"
                  "1901 Westcliff Drive, Suite 10, Newport Beach, CA",
                  contact_s),
    ]], colWidths=[2.8 * inch, 4.2 * inch])
    hdr.setStyle(TableStyle([
        ('VALIGN',       (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING',   (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING',(0, 0), (-1, -1), 6),
        ('LEFTPADDING',  (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
    ]))
    story.append(hdr)
    story.append(HRFlowable(width="100%", thickness=1.5, color=BLACK, spaceAfter=10))


def build_footer(story):
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=0.5, color=RULE_GRAY, spaceAfter=8))
    tbl = Table([[
        Paragraph("<b>Questions or ready to start?</b><br/>"
                  "Call or text: (949) 997-3988<br/>"
                  "range-medical.com",
                  foot_bold_s),
        Paragraph(
            "Range Medical is a cash-pay health and wellness clinic. The "
            "Range Assessment is the starting point for any treatment plan. "
            "All medications, labs, and therapies are provided as medically "
            "indicated and require provider approval.",
            foot_s),
    ]], colWidths=[2.3 * inch, 4.7 * inch])
    tbl.setStyle(TableStyle([
        ('VALIGN',       (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING',   (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING',(0, 0), (-1, -1), 0),
        ('LEFTPADDING',  (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
    ]))
    story.append(tbl)


# ── PAGE 1: How Range Medical Works ──────────────────────────────────────────
def build_how_it_works(story):
    build_header(story)
    story.append(Paragraph("One Assessment. One Plan.", title_s))
    story.append(Paragraph("Feel like yourself again.", subtitle_s))
    story.append(Spacer(1, 8))
    story.append(Paragraph(
        "Something feels off. Maybe you’re tired all the time. Maybe your body "
        "isn’t bouncing back the way it used to. You don’t need to figure it "
        "out alone — that’s what we’re here for.",
        intro_s,
    ))

    story += section_label("Who we help")
    for line in [
        "You feel tired even after a full night of sleep.",
        "Your thinking feels foggy or slow.",
        "Your body takes longer to recover than it used to.",
        "You’re struggling with weight that won’t budge.",
        "You just don’t feel like yourself anymore.",
    ]:
        story.append(bullet(line))

    story += section_label("Step 1 — Range Assessment, your starting point")
    story.append(Paragraph(
        "Everything starts with one calm conversation. No pressure, no guesswork.",
        body_s,
    ))
    for line in [
        "We listen to your story and your symptoms.",
        "We talk about your goals and what matters to you.",
        "We decide together if labs make sense.",
        "If you move forward with a plan, your assessment fee is applied toward it.",
    ]:
        story.append(bullet(line))

    story += section_label("Step 2 — Choose your path with your provider")
    story.append(path_card(
        "Energy, Hormones &amp; Weight",
        "For people who feel run down, foggy, or stuck. We look at what’s going "
        "on inside your body and build a plan to help you feel like yourself again.",
    ))
    story.append(Spacer(1, 6))
    story.append(path_card(
        "Injury &amp; Recovery",
        "For people healing from an injury or surgery. We work alongside Range "
        "Sports Therapy, located in the same building, to support your recovery "
        "from the inside out.",
    ))

    story += section_label("Step 3 — Tools we may use")
    story.append(Paragraph(
        "Your provider may include tools like hormone therapy, weight loss support, "
        "peptides, IV therapy, red light therapy, hyperbaric oxygen therapy, PRP, "
        "or exosomes as part of your plan. These are tools — not a menu.",
        body_s,
    ))
    story.append(Paragraph(
        "“You don’t have to figure this out alone. We help you choose what "
        "fits your body and your goals.”",
        reassure_s,
    ))

    story.append(Paragraph(
        "Ask the front desk about scheduling your Range Assessment today.",
        cta_s,
    ))

    build_footer(story)


# ── PAGE 2: Energy, Hormones & Weight ────────────────────────────────────────
def build_energy_hormones_weight(story):
    build_header(story)
    story.append(Paragraph("Feel Like Yourself Again", title_s))
    story.append(Paragraph("Energy, Hormones &amp; Weight", subtitle_s))
    story.append(Spacer(1, 8))
    story.append(Paragraph(
        "Something changed. You used to have more energy, more focus, more drive. "
        "Now it takes everything you have just to get through the day. You’re "
        "not imagining it — and you don’t have to accept it.",
        intro_s,
    ))

    story += section_label("Is this you?")
    for line in [
        "You’re tired even after a full night of sleep.",
        "Your brain feels foggy or scattered.",
        "Weight seems to stick no matter what you try.",
        "Your mood has shifted and you’re not sure why.",
        "Your motivation or drive isn’t what it used to be.",
        "You’ve tried supplements or diets and nothing lasted.",
    ]:
        story.append(bullet(line))

    story += section_label("How this path works")
    story.append(step(1, "<b>Range Assessment.</b> We sit down and talk through your "
                          "symptoms and goals. No rush. No judgment."))
    story.append(step(2, "<b>Deeper labs.</b> Blood work that looks at hormones, "
                          "nutrients, metabolism, and other markers so we can see "
                          "what’s really going on."))
    story.append(step(3, "<b>Review together.</b> Your provider explains your results "
                          "in simple language and answers every question."))
    story.append(step(4, "<b>Start your program.</b> You decide together on a plan "
                          "that fits your body and your life."))

    story += section_label("Common program types")
    story.append(path_card(
        "Hormone Optimization",
        "Steady support for energy, mood, and drive when your levels are off.",
    ))
    story.append(Spacer(1, 4))
    story.append(path_card(
        "Medical Weight Loss",
        "Medication, labs, and guidance to help your body respond to weight loss again.",
    ))
    story.append(Spacer(1, 4))
    story.append(path_card(
        "Peptide Therapy",
        "Targeted support for energy, sleep, and recovery.",
    ))
    story.append(Spacer(1, 4))
    story.append(Paragraph(
        "<i>Your provider recommends what fits you. These are tools — not a menu.</i>",
        body_s,
    ))

    story += section_label("What to expect")
    for line in [
        "Most people start noticing changes over several weeks, not overnight.",
        "We check in with you regularly and adjust as your body responds.",
        "You always have a chance to ask questions and change course.",
        "You’re never locked into something that isn’t working.",
    ]:
        story.append(bullet(line))

    story.append(Paragraph(
        "Talk with your provider or the front desk about starting the "
        "Energy, Hormones &amp; Weight path with a Range Assessment.",
        cta_s,
    ))

    build_footer(story)


# ── PAGE 3: Injury & Recovery (with Range Sports Therapy) ────────────────────
def build_injury_recovery(story):
    build_header(story)
    story.append(Paragraph("Injury Recovery", title_s))
    story.append(Paragraph("When time and rehab aren’t enough.", subtitle_s))
    story.append(Spacer(1, 8))
    story.append(Paragraph(
        "You’re doing the work — the exercises, the stretches, the ice. "
        "But your body still isn’t healing the way you expected. Sometimes "
        "recovery needs support from the inside, too.",
        intro_s,
    ))

    story += section_label("Who this is for")
    for line in [
        "You’re dealing with a sprain, strain, or overuse injury.",
        "You have a tendon or ligament issue that won’t resolve.",
        "You’re recovering from surgery and want to heal faster.",
        "You have chronic pain that keeps coming back.",
        "Your injury is healing too slowly and you want more options.",
        "You’ve been referred by a physical therapist or chiropractor.",
    ]:
        story.append(bullet(line))

    story += section_label("How Range Medical + Range Sports Therapy work together")
    story.append(Paragraph(
        "<b>Range Sports Therapy</b> focuses on hands-on care, movement, and rehab. "
        "<b>Range Medical</b> focuses on what’s happening inside your body — "
        "healing, inflammation, and recovery. Both are in the same building, and we "
        "often share patients. The goal is to give your body better support from the "
        "inside and outside at the same time.",
        body_s,
    ))

    story += section_label("Your recovery path")
    story.append(step(1, "<b>Range Assessment.</b> We review your injury, your goals, "
                          "and your current care."))
    story.append(step(2, "<b>Plan with your providers.</b> We can coordinate with your "
                          "Range Sports Therapy team so everyone is on the same page."))
    story.append(step(3, "<b>Recovery tools.</b> Your plan may include peptides, PRP, "
                          "exosomes, IV support, red light therapy, or hyperbaric "
                          "oxygen therapy."))
    story.append(step(4, "<b>Track progress.</b> We check in with you and adjust as "
                          "you heal."))

    story += section_label("Recovery tools we may use")
    for line in [
        "<b>Peptide Therapy</b> — targeted support that may help your body’s natural repair process.",
        "<b>PRP and Exosomes</b> — concentrated treatments applied to the injury area to support tissue recovery.",
        "<b>IV Therapy</b> — nutrients delivered directly to help your body recover and reduce fatigue.",
        "<b>Red Light Therapy</b> — light energy that may help reduce inflammation and support healing.",
        "<b>Hyperbaric Oxygen Therapy</b> — higher-pressure oxygen that may support tissue healing and recovery.",
    ]:
        story.append(bullet(line))

    story += section_label("How this fits with your PT or chiro care")
    story.append(Paragraph(
        "We do <b>not</b> replace your physical therapy or chiropractic work — "
        "we support it. Your provider can coordinate with your Range Sports Therapy "
        "team so your recovery plan works together. One team, one building, one goal: "
        "get you back to what you love.",
        body_s,
    ))

    story.append(Paragraph(
        "Ask your therapist or the Range Medical front desk about starting the "
        "Injury &amp; Recovery path with a Range Assessment.",
        cta_s,
    ))

    build_footer(story)


# ── Driver ───────────────────────────────────────────────────────────────────
def render(out_dir, filename, title, builder):
    path = os.path.join(out_dir, filename)
    doc = SimpleDocTemplate(
        path, pagesize=letter,
        rightMargin=0.75 * inch, leftMargin=0.75 * inch,
        topMargin=0.65 * inch,   bottomMargin=0.65 * inch,
        title=title, author="Range Medical",
    )
    story = []
    builder(story)
    doc.build(story)
    print(f"Wrote {path}")


def main():
    # Write to public/ so PDFs are servable as URLs (e.g., /Range-How-It-Works-One-Pager.pdf)
    os.makedirs(PUBLIC_DIR, exist_ok=True)

    render(PUBLIC_DIR, "Range-How-It-Works-One-Pager.pdf",
           "How Range Medical Works — Range Medical",
           build_how_it_works)
    render(PUBLIC_DIR, "Range-Energy-Hormones-Weight-Path.pdf",
           "Energy, Hormones & Weight Path — Range Medical",
           build_energy_hormones_weight)
    render(PUBLIC_DIR, "Range-Injury-Recovery-Path.pdf",
           "Injury & Recovery Path — Range Medical",
           build_injury_recovery)


if __name__ == "__main__":
    main()
