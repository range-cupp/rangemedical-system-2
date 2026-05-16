#!/usr/bin/env python3
"""Generate HBOT Package Guide PDF for front desk."""

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
ACCENT     = HexColor('#4A9070')
CALLOUT_BG = HexColor('#F0F7F4')
W = 7.0 * inch

def st(name, **kw):
    return ParagraphStyle(name, **kw)

clinic_s     = st('Clinic',   fontName='Helvetica-Bold',    fontSize=13,  textColor=BLACK,     leading=16)
contact_s    = st('Cont',     fontName='Helvetica',         fontSize=8,   textColor=MID_GRAY,  leading=12, alignment=TA_RIGHT)
title_s      = st('Title',    fontName='Helvetica-Bold',    fontSize=22,  textColor=BLACK,     leading=26, spaceAfter=2)
subtitle_s   = st('Sub',      fontName='Helvetica-Oblique', fontSize=10,  textColor=MID_GRAY,  leading=14)
sec_s        = st('Sec',      fontName='Helvetica-Bold',    fontSize=8,   textColor=ACCENT,    leading=11, spaceBefore=14, spaceAfter=4)
body_s       = st('Body',     fontName='Helvetica',         fontSize=9.5, textColor=DARK_GRAY, leading=16, spaceAfter=0)
stat_label_s = st('StatL',    fontName='Helvetica-Bold',    fontSize=7.5, textColor=MID_GRAY,  leading=10)
stat_val_s   = st('StatV',    fontName='Helvetica-Bold',    fontSize=11,  textColor=BLACK,     leading=14)
card_hdr_s   = st('CardH',    fontName='Helvetica-Bold',    fontSize=10,  textColor=ACCENT,    leading=13)
big_price_s  = st('BigP',     fontName='Helvetica-Bold',    fontSize=24,  textColor=BLACK,     leading=28, spaceAfter=1)
cycle_s      = st('Cycle',    fontName='Helvetica-Bold',    fontSize=8,   textColor=MID_GRAY,  leading=11, spaceAfter=4, spaceBefore=0)
price_det_s  = st('PrDet',    fontName='Helvetica',         fontSize=9,   textColor=MID_GRAY,  leading=13)
card_desc_s  = st('CardD',    fontName='Helvetica',         fontSize=9,   textColor=DARK_GRAY, leading=13)
cta_s        = st('CTA',      fontName='Helvetica',         fontSize=8,   textColor=MID_GRAY,  leading=12)
cta_right_s  = st('CTAR',     fontName='Helvetica-Oblique', fontSize=8,   textColor=MID_GRAY,  leading=12, alignment=TA_RIGHT)
bullet_s     = st('Bul',      fontName='Helvetica',         fontSize=9,   textColor=DARK_GRAY, leading=14, leftIndent=14, firstLineIndent=-10, spaceAfter=3)


def build_header(story):
    hdr = Table([[
        Paragraph("RANGE MEDICAL", clinic_s),
        Paragraph("range-medical.com  •  (949) 997-3988<br/>1901 Westcliff Drive, Suite 10, Newport Beach, CA", contact_s),
    ]], colWidths=[2.8*inch, 4.2*inch])
    hdr.setStyle(TableStyle([
        ('VALIGN',(0,0),(-1,-1),'MIDDLE'),
        ('TOPPADDING',(0,0),(-1,-1),0),('BOTTOMPADDING',(0,0),(-1,-1),6),
        ('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),0),
    ]))
    story.append(hdr)
    story.append(HRFlowable(width="100%", thickness=1.5, color=BLACK, spaceAfter=12))


def build_cta_strip(story):
    tbl = Table([[
        Paragraph("Ready to schedule? Call or text (949) 997-3988, or stop by the front desk.", cta_s),
        Paragraph("HSA/FSA accepted  •  Memberships — 3-month minimum", cta_right_s),
    ]], colWidths=[3.8*inch, 3.2*inch])
    tbl.setStyle(TableStyle([
        ('VALIGN',(0,0),(-1,-1),'MIDDLE'),
        ('TOPPADDING',(0,0),(-1,-1),0),('BOTTOMPADDING',(0,0),(-1,-1),4),
        ('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),0),
    ]))
    story.append(tbl)
    story.append(HRFlowable(width="100%", thickness=0.5, color=RULE_GRAY, spaceAfter=10))


def pricing_card(header, price, detail, desc, cycle=None):
    items = [
        Paragraph(header, card_hdr_s),
        Spacer(1, 6),
        Paragraph(price, big_price_s),
    ]
    if cycle:
        items.append(Paragraph(cycle.upper(), cycle_s))
    items += [
        Paragraph(detail, price_det_s),
        Spacer(1, 8),
        Paragraph(desc, card_desc_s),
    ]
    return items


def card_table(cards, col_count=3):
    card_w = W / col_count
    data = [cards]
    tbl = Table(data, colWidths=[card_w]*col_count)
    style_cmds = [
        ('VALIGN',        (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING',    (0,0), (-1,-1), 12),
        ('BOTTOMPADDING', (0,0), (-1,-1), 12),
        ('LEFTPADDING',   (0,0), (-1,-1), 12),
        ('RIGHTPADDING',  (0,0), (-1,-1), 12),
        ('BOX',           (0,0), (-1,-1), 0.5, RULE_GRAY),
    ]
    for i in range(col_count):
        style_cmds.append(('LINEABOVE', (i,0), (i,0), 2, ACCENT))
    for i in range(1, col_count):
        style_cmds.append(('LINEBEFORE', (i,0), (i,-1), 0.5, RULE_GRAY))
    tbl.setStyle(TableStyle(style_cmds))
    return tbl


# ── Build PDF ──────────────────────────────────────────────────────────────────
output_path = os.path.join(os.path.dirname(__file__), '..', 'docs', 'HBOT-Package-Guide.pdf')
output_path = os.path.abspath(output_path)

doc = SimpleDocTemplate(
    output_path,
    pagesize=letter,
    rightMargin=0.75*inch, leftMargin=0.75*inch,
    topMargin=0.65*inch,   bottomMargin=0.65*inch,
)

story = []
build_header(story)

# Title
story.append(Paragraph("HYPERBARIC OXYGEN THERAPY", title_s))
story.append(Paragraph("Every way to do HBOT at Range Medical — pricing and plans", subtitle_s))
story.append(Spacer(1, 10))
build_cta_strip(story)

# Callout box
callout_s = st('Callout', fontName='Helvetica', fontSize=9.5, textColor=DARK_GRAY, leading=15)
callout_content = [
    Paragraph(
        "<b>Most people who feel a real difference with HBOT do at least 10–40 sessions.</b> "
        "The easiest way to do that is our Oxygen Recovery Membership "
        "(HBOT + Red Light 2x/week for 3 months).",
        callout_s,
    ),
]
callout_tbl = Table([[callout_content]], colWidths=[W])
callout_tbl.setStyle(TableStyle([
    ('BACKGROUND',    (0,0), (-1,-1), CALLOUT_BG),
    ('TOPPADDING',    (0,0), (-1,-1), 10),
    ('BOTTOMPADDING', (0,0), (-1,-1), 10),
    ('LEFTPADDING',   (0,0), (-1,-1), 14),
    ('RIGHTPADDING',  (0,0), (-1,-1), 14),
    ('LINEBEFORE',    (0,0), (0,-1),  3, ACCENT),
]))
story.append(callout_tbl)
story.append(Spacer(1, 4))

# What a session looks like
story.append(Paragraph("WHAT A SESSION LOOKS LIKE", sec_s))
story.append(Paragraph(
    "You lie back in a pressurized chamber and breathe oxygen-rich air for 60 minutes. "
    "It’s quiet, comfortable, and you can watch a show or nap. The increased pressure "
    "helps your body absorb far more oxygen than breathing normally — which supports "
    "healing, recovery, energy, and brain function.",
    body_s,
))
story.append(Spacer(1, 10))

# Stats row
stats = Table([[
    [Paragraph("SESSION LENGTH", stat_label_s), Paragraph("<b>60 minutes</b>", stat_val_s)],
    [Paragraph("HOW SOON YOU FEEL IT", stat_label_s), Paragraph("<b>4–6 sessions</b>", stat_val_s)],
    [Paragraph("BEST RESULTS", stat_label_s), Paragraph("<b>Series of 10–40</b>", stat_val_s)],
]], colWidths=[W/3, W/3, W/3])
stats.setStyle(TableStyle([
    ('VALIGN',        (0,0), (-1,-1), 'TOP'),
    ('TOPPADDING',    (0,0), (-1,-1), 8),
    ('BOTTOMPADDING', (0,0), (-1,-1), 8),
    ('LEFTPADDING',   (0,0), (-1,-1), 10),
    ('RIGHTPADDING',  (0,0), (-1,-1), 10),
    ('BOX',           (0,0), (-1,-1), 0.5, RULE_GRAY),
    ('LINEBEFORE',    (1,0), (1,-1),  0.5, RULE_GRAY),
    ('LINEBEFORE',    (2,0), (2,-1),  0.5, RULE_GRAY),
]))
story.append(stats)

# ── Drop-in options ───────────────────────────────────────────────────────────
story.append(Paragraph("DROP-IN OPTIONS — NO COMMITMENT", sec_s))
story.append(card_table([
    pricing_card(
        "SINGLE SESSION",
        "$185",
        "$185 per session",
        "Try it out, bring a friend, or come in occasionally.",
    ),
    pricing_card(
        "5-SESSION PACK",
        "$850",
        "$170 per session  •  save $75",
        "A great way to start and feel the effects build over a few weeks.",
    ),
    pricing_card(
        "10-SESSION PACK",
        "$1,600",
        "$160 per session  •  save $250",
        "Best value without an ongoing commitment. Ideal for recovery or a focused reset.",
    ),
]))

# ── Membership Offer Callout ──────────────────────────────────────────────────
offer_hdr_s = st('OfferH', fontName='Helvetica-Bold', fontSize=11, textColor=ACCENT, leading=14)
offer_s     = st('Offer',  fontName='Helvetica',      fontSize=9.5, textColor=DARK_GRAY, leading=15)
offer_val_s = st('OfferV', fontName='Helvetica-Bold',  fontSize=9.5, textColor=BLACK, leading=15)

offer_content = [
    Paragraph("INCLUDED WITH EVERY MEMBERSHIP", offer_hdr_s),
    Spacer(1, 6),
    Paragraph(
        "<b>Two Essential Lab Panels + Provider Consultations — $700 value, on us.</b>",
        offer_val_s,
    ),
    Spacer(1, 4),
    Paragraph(
        "Every HBOT membership includes two Essential bloodwork panels (normally $350 each) "
        "with a provider consultation at each draw. One at the start of your membership and "
        "one at three months — so you and your provider can track exactly how your body is responding.",
        offer_s,
    ),
]

offer_tbl = Table([[offer_content]], colWidths=[W])
offer_tbl.setStyle(TableStyle([
    ('BACKGROUND',    (0,0), (-1,-1), CALLOUT_BG),
    ('TOPPADDING',    (0,0), (-1,-1), 12),
    ('BOTTOMPADDING', (0,0), (-1,-1), 12),
    ('LEFTPADDING',   (0,0), (-1,-1), 14),
    ('RIGHTPADDING',  (0,0), (-1,-1), 14),
    ('LINEBEFORE',    (0,0), (0,-1),  3, ACCENT),
]))
story.append(offer_tbl)
story.append(Spacer(1, 4))

# ── HBOT Memberships ──────────────────────────────────────────────────────────
story.append(Paragraph("HBOT MEMBERSHIPS — BEST PER-SESSION PRICING", sec_s))
story.append(card_table([
    pricing_card(
        "ONCE A WEEK",
        "$549",
        "$137 per session  •  4 sessions",
        "Great for maintenance, sleep, and general wellness.",
        cycle="every 4 weeks",
    ),
    pricing_card(
        "TWICE A WEEK",
        "$999",
        "$125 per session  •  8 sessions",
        "For brain fog, headaches, ongoing pain, and focused improvement.",
        cycle="every 4 weeks",
    ),
    pricing_card(
        "THREE TIMES A WEEK",
        "$1,399",
        "$117 per session  •  12 sessions",
        "Our Cellular Reset pace — ideal for recovery and chronic conditions.",
        cycle="every 4 weeks",
    ),
]))

# ── Combo Memberships ─────────────────────────────────────────────────────────
story.append(Paragraph("HBOT + RED LIGHT COMBO MEMBERSHIPS — BOTH THERAPIES BUNDLED", sec_s))
story.append(card_table([
    pricing_card(
        "COMBO — 1X / WEEK",
        "$899",
        "HBOT + Red Light, each 1x/week",
        "Save about $150 vs. buying each membership separately.",
        cycle="every 4 weeks",
    ),
    pricing_card(
        "COMBO — 2X / WEEK",
        "$1,499",
        "HBOT + Red Light, each 2x/week",
        "Our most popular combo — full stack for brain fog, pain, and performance.",
        cycle="every 4 weeks",
    ),
    pricing_card(
        "COMBO — 3X / WEEK",
        "$1,999",
        "HBOT + Red Light, each 3x/week",
        "Maximum protocol — pairs with the Cellular Energy Reset.",
        cycle="every 4 weeks",
    ),
]))

# ── Unlimited Daily ───────────────────────────────────────────────────────────
story.append(Paragraph("UNLIMITED DAILY ACCESS", sec_s))

unlim_content = [
    Paragraph("UNLIMITED — HBOT + RED LIGHT", card_hdr_s),
    Spacer(1, 6),
    Paragraph("$2,999", big_price_s),
    Paragraph("EVERY 4 WEEKS", cycle_s),
    Spacer(1, 4),
    Paragraph(
        "HBOT or Red Light once per day, every day. Come as often as you want — "
        "your choice of therapy each visit. Best value for serious protocols. 3-month minimum.",
        card_desc_s,
    ),
]

unlim_tbl = Table([[unlim_content]], colWidths=[W])
unlim_tbl.setStyle(TableStyle([
    ('VALIGN',        (0,0), (-1,-1), 'TOP'),
    ('TOPPADDING',    (0,0), (-1,-1), 12),
    ('BOTTOMPADDING', (0,0), (-1,-1), 12),
    ('LEFTPADDING',   (0,0), (-1,-1), 12),
    ('RIGHTPADDING',  (0,0), (-1,-1), 12),
    ('BOX',           (0,0), (-1,-1), 0.5, RULE_GRAY),
    ('LINEABOVE',     (0,0), (-1,0),  2, ACCENT),
]))
story.append(unlim_tbl)

# ── Good to know ──────────────────────────────────────────────────────────────
story.append(Paragraph("GOOD TO KNOW", sec_s))
story.append(Paragraph("•  Memberships require a 3-month minimum, then cancel anytime.", bullet_s))
story.append(Paragraph("•  Two Essential Lab Panels + provider consultations included ($700 value) — one at signup, one at three months.", bullet_s))
story.append(Paragraph("•  Unused membership sessions roll within the same 4-week cycle.", bullet_s))
story.append(Paragraph("•  You can upgrade or downgrade at any time — we’ll pro-rate the difference.", bullet_s))
story.append(Paragraph("•  HBOT isn’t covered by insurance for most uses, but HSA/FSA cards are accepted.", bullet_s))
story.append(Paragraph("•  Members get a discount on à la carte sessions ($150 each) if they want extras.", bullet_s))

# Footer CTA strip
story.append(Spacer(1, 16))
build_cta_strip(story)

doc.build(story)
print(f"PDF generated: {output_path}")
