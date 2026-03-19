#!/usr/bin/env python3
"""Generate Range MSO LLC Business Structure Overview PDF."""

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table,
                                 TableStyle, HRFlowable, PageBreak, KeepTogether)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
import os

BLACK      = HexColor('#0A0A0A')
DARK_GRAY  = HexColor('#1A1A1A')
MID_GRAY   = HexColor('#606060')
LIGHT_GRAY = HexColor('#F4F4F4')
RULE_GRAY  = HexColor('#DDDDDD')
WHITE      = HexColor('#FFFFFF')
GREEN      = HexColor('#2E6B35')
ACCENT     = HexColor('#1B4D3E')
ACCENT_BG  = HexColor('#F0F5F2')
GOLD       = HexColor('#B8860B')
GOLD_BG    = HexColor('#F5F0E0')
W = 7.0 * inch

def st(name, **kw):
    return ParagraphStyle(name, **kw)

clinic_s    = st('Clinic', fontName='Helvetica-Bold',    fontSize=13,  textColor=BLACK,     leading=16)
contact_s   = st('Cont',   fontName='Helvetica',         fontSize=8,   textColor=MID_GRAY,  leading=12, alignment=TA_RIGHT)
title_s     = st('Title',  fontName='Helvetica-Bold',    fontSize=20,  textColor=BLACK,     leading=24, spaceAfter=2)
subtitle_s  = st('Sub',    fontName='Helvetica',         fontSize=10,  textColor=MID_GRAY,  leading=14)
sec_s       = st('Sec',    fontName='Helvetica-Bold',    fontSize=8,   textColor=MID_GRAY,  leading=11, spaceBefore=20, spaceAfter=3)
comp_s      = st('Comp',   fontName='Helvetica-Bold',    fontSize=13,  textColor=BLACK,     leading=16, spaceBefore=14, spaceAfter=4)
sub_s       = st('SubH',   fontName='Helvetica-Bold',    fontSize=10,  textColor=BLACK,     leading=14, spaceBefore=10, spaceAfter=3)
body_s      = st('Body',   fontName='Helvetica',         fontSize=9.5, textColor=DARK_GRAY, leading=16, spaceAfter=4)
body_i_s    = st('BodyI',  fontName='Helvetica-Oblique', fontSize=9.5, textColor=DARK_GRAY, leading=16, spaceAfter=4)
bullet_s    = st('Bul',    fontName='Helvetica',         fontSize=9.5, textColor=DARK_GRAY, leading=16, leftIndent=14, firstLineIndent=-10, spaceAfter=2)
th_s        = st('TH',     fontName='Helvetica-Bold',    fontSize=8,   textColor=MID_GRAY,  leading=11)
tv_s        = st('TV',     fontName='Helvetica',         fontSize=9.5, textColor=DARK_GRAY, leading=14)
tv_bold_s   = st('TVB',    fontName='Helvetica-Bold',    fontSize=9.5, textColor=BLACK,     leading=14)
note_s      = st('Note',   fontName='Helvetica-Oblique', fontSize=9,   textColor=ACCENT,    leading=14, spaceAfter=4,
                 leftIndent=10, borderPadding=(6, 8, 6, 8), borderColor=ACCENT, borderWidth=0)
foot_s      = st('Foot',   fontName='Helvetica-Oblique', fontSize=8,   textColor=MID_GRAY,  leading=12)
foot_bold_s = st('FootB',  fontName='Helvetica-Bold',    fontSize=8.5, textColor=DARK_GRAY, leading=12)
tag_s       = st('Tag',    fontName='Helvetica-Bold',    fontSize=7,   textColor=WHITE,     leading=10)
intro_s     = st('Intro',  fontName='Helvetica',         fontSize=10,  textColor=MID_GRAY,  leading=17, spaceAfter=12)
flow_s      = st('Flow',   fontName='Helvetica-Bold',    fontSize=9,   textColor=ACCENT,    leading=12, alignment=TA_CENTER)
flow_sub_s  = st('FlowS',  fontName='Helvetica',         fontSize=8,   textColor=MID_GRAY,  leading=11, alignment=TA_CENTER)
arrow_s     = st('Arrow',  fontName='Helvetica',         fontSize=14,  textColor=RULE_GRAY, leading=16, alignment=TA_CENTER)
confid_s    = st('Confid', fontName='Helvetica-Bold',    fontSize=7,   textColor=GOLD,      leading=10, alignment=TA_RIGHT)

def section_label(text):
    return [
        Paragraph(text.upper(), sec_s),
        HRFlowable(width="100%", thickness=0.75, color=RULE_GRAY, spaceAfter=8),
    ]

def info_table(rows, col1=1.8*inch):
    col2 = W - col1
    data = [[Paragraph(l, tv_bold_s), Paragraph(v, tv_s)] for l, v in rows]
    tbl = Table(data, colWidths=[col1, col2])
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

def bullet(text):
    return Paragraph(f"\u2013  {text}", bullet_s)

def investor_note(text):
    data = [[Paragraph(text, note_s)]]
    tbl = Table(data, colWidths=[W - 0.2*inch])
    tbl.setStyle(TableStyle([
        ('BACKGROUND',  (0,0), (-1,-1), ACCENT_BG),
        ('LEFTPADDING', (0,0), (-1,-1), 14),
        ('RIGHTPADDING',(0,0), (-1,-1), 12),
        ('TOPPADDING',  (0,0), (-1,-1), 8),
        ('BOTTOMPADDING',(0,0),(-1,-1), 8),
        ('LINEBELOW',   (0,0), (-1,-1), 0, WHITE),
        ('LINEBEFORE',  (0,0), (0,-1),  2.5, ACCENT),
    ]))
    return tbl

def entity_card(tag_text, title, desc, tag_color=ACCENT, stats=None):
    elements = []
    tag_data = [[Paragraph(tag_text.upper(), tag_s)]]
    tag_tbl = Table(tag_data, colWidths=[None])
    tag_tbl.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), tag_color),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
    ]))

    card_elements = [
        [tag_tbl],
        [Paragraph(title, comp_s)],
        [Paragraph(desc, body_s)],
    ]
    if stats:
        card_elements.append([Paragraph(stats, st('Stats', fontName='Helvetica', fontSize=8.5, textColor=MID_GRAY, leading=12))])

    card_tbl = Table(card_elements, colWidths=[W])
    card_tbl.setStyle(TableStyle([
        ('BOX',           (0,0), (-1,-1), 0.75, RULE_GRAY),
        ('LEFTPADDING',   (0,0), (-1,-1), 16),
        ('RIGHTPADDING',  (0,0), (-1,-1), 16),
        ('TOPPADDING',    (0,0), (0,0),   12),
        ('BOTTOMPADDING', (-1,-1),(-1,-1), 12),
        ('BACKGROUND',    (0,0), (-1,-1), WHITE),
    ]))
    return card_tbl

def entity_card_row(cards):
    """cards = list of (tag, title, desc, color) tuples"""
    n = len(cards)
    col_w = (W - (n-1)*0.15*inch) / n
    row_data = []
    for tag, title, desc, color in cards:
        cell_elements = []
        tag_data = [[Paragraph(tag.upper(), tag_s)]]
        tag_tbl = Table(tag_data, colWidths=[None])
        tag_tbl.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), color),
            ('LEFTPADDING', (0,0), (-1,-1), 6),
            ('RIGHTPADDING', (0,0), (-1,-1), 6),
            ('TOPPADDING', (0,0), (-1,-1), 2),
            ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ]))
        inner = Table([
            [tag_tbl],
            [Paragraph(f"<b>{title}</b>", st('CT', fontName='Helvetica-Bold', fontSize=11, textColor=BLACK, leading=14, spaceBefore=6))],
            [Paragraph(desc, st('CD', fontName='Helvetica', fontSize=8.5, textColor=MID_GRAY, leading=13))],
        ], colWidths=[col_w - 0.3*inch])
        inner.setStyle(TableStyle([
            ('LEFTPADDING',   (0,0), (-1,-1), 10),
            ('RIGHTPADDING',  (0,0), (-1,-1), 10),
            ('TOPPADDING',    (0,0), (0,0),   8),
            ('BOTTOMPADDING', (-1,-1),(-1,-1), 8),
            ('BOX',           (0,0), (-1,-1), 0.75, RULE_GRAY),
            ('BACKGROUND',    (0,0), (-1,-1), WHITE),
        ]))
        row_data.append(inner)

    tbl = Table([row_data], colWidths=[col_w]*n)
    tbl.setStyle(TableStyle([
        ('LEFTPADDING',  (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING',   (0,0), (-1,-1), 0),
        ('BOTTOMPADDING',(0,0), (-1,-1), 0),
        ('VALIGN',       (0,0), (-1,-1), 'TOP'),
    ]))
    return tbl

def detail_block(title, paragraphs, note_text=None):
    """Create a detail explanation block."""
    elements = []
    elements.append(Spacer(1, 6))
    inner = []
    inner.append([Paragraph(title, sub_s)])
    for p in paragraphs:
        inner.append([Paragraph(p, body_s)])
    if note_text:
        inner.append([investor_note(note_text)])
        inner.append([Spacer(1, 2)])

    detail_tbl = Table(inner, colWidths=[W - 0.4*inch])
    detail_tbl.setStyle(TableStyle([
        ('BACKGROUND',    (0,0), (-1,-1), LIGHT_GRAY),
        ('BOX',           (0,0), (-1,-1), 0.5, RULE_GRAY),
        ('LEFTPADDING',   (0,0), (-1,-1), 18),
        ('RIGHTPADDING',  (0,0), (-1,-1), 18),
        ('TOPPADDING',    (0,0), (0,0),   14),
        ('BOTTOMPADDING', (-1,-1),(-1,-1), 14),
    ]))
    elements.append(detail_tbl)
    elements.append(Spacer(1, 8))
    return elements

def build_header(story):
    hdr = Table([[
        Paragraph("RANGE MSO BUSINESS MODEL", clinic_s),
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
    story.append(Spacer(1, 16))
    story.append(HRFlowable(width="100%", thickness=0.5, color=RULE_GRAY, spaceAfter=8))
    tbl = Table([[
        Paragraph("<b>Questions or concerns?</b><br/>Call or text: (949) 997-3988<br/>range-medical.com", foot_bold_s),
        Paragraph(
            "This document is not a substitute for personalized legal or financial advice.",
            foot_s),
    ]], colWidths=[2.2*inch, 4.8*inch])
    tbl.setStyle(TableStyle([
        ('VALIGN',(0,0),(-1,-1),'TOP'),
        ('TOPPADDING',(0,0),(-1,-1),0),('BOTTOMPADDING',(0,0),(-1,-1),0),
        ('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),0),
    ]))
    story.append(tbl)


# ── BUILD THE PDF ──────────────────────────────────────────────────────────────

OUTPUT_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                           "public", "Range-MSO-Overview.pdf")

doc = SimpleDocTemplate(
    OUTPUT_PATH,
    pagesize=letter,
    rightMargin=0.75*inch, leftMargin=0.75*inch,
    topMargin=0.65*inch,   bottomMargin=0.65*inch,
)
story = []
build_header(story)

# ── Title
story.append(Paragraph("Range MSO LLC", title_s))
story.append(Paragraph("Management Services Organization \u2022 Newport Beach, CA", subtitle_s))
story.append(Spacer(1, 16))

# ── Intro
story.append(Paragraph(
    "Range MSO LLC is a <b>Management Services Organization</b> that owns the technology, equipment, "
    "intellectual property, and brand behind the Range Medical network. The MSO provides management services "
    "to independently owned physician practices (PCs) through long-term Management Services Agreements. "
    "This structure separates the <b>scalable business assets</b> from the <b>clinical operations</b> \u2014 "
    "creating a model that is easier to grow, easier to value, and easier to acquire.",
    intro_s
))
story.append(Spacer(1, 8))


# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 1: HOLDING ENTITY
# ═══════════════════════════════════════════════════════════════════════════════
story += section_label("Holding Entity")

story.append(entity_card(
    "Holding Entity", "Range MSO LLC",
    "California LLC \u2014 owns all non-clinical business assets, provides management services to affiliated physician practices",
    ACCENT,
    "2 locations  \u2022  3 proprietary assets  \u2022  MSA revenue model"
))

story += detail_block(
    "Why an MSO?",
    [
        "In healthcare, physicians must own the clinical practice \u2014 but the <i>business</i> behind the practice "
        "can be owned separately. The MSO structure allows Range Medical to separate scalable assets (software, "
        "equipment, brand, IP) from the clinical entity, which is subject to regulatory restrictions on ownership.",

        "This matters because <b>MSOs trade at 8\u201312x EBITDA</b> in acquisition, while standalone medical practices "
        "typically trade at 1\u20132x. The premium reflects the fact that an MSO\u2019s revenue comes from long-term management "
        "contracts with predictable fee structures \u2014 not from the clinical license of any single physician. Software, "
        "IP, equipment, and brand transfer cleanly in a sale.",
    ],
    "The MSO is the investable entity. It holds the assets that create enterprise value and generate management fee revenue from every PC in the network."
)

# Arrow down
story.append(Paragraph("\u25BC", arrow_s))
story.append(Spacer(1, 4))


# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 2: MSO-OWNED ASSETS
# ═══════════════════════════════════════════════════════════════════════════════
story += section_label("MSO-Owned Assets")

story.append(entity_card_row([
    ("Technology", "Range System", "Proprietary clinic management software \u2014 CRM, patient tracking, lab integration, protocol management", ACCENT),
    ("Clinical IP", "Range Recovery Method", "Proprietary clinical protocols for regenerative medicine, peptide therapy, HRT, performance optimization", ACCENT),
    ("Equipment", "Equipment Portfolio", "HBOT chambers, red light therapy, DEXA scanning, IV therapy stations \u2014 deployed across locations", ACCENT),
]))

# Range System detail
story += detail_block(
    "Range System \u2014 Proprietary Software Platform",
    [
        "The Range System is a custom-built clinic management platform that handles patient intake, protocol management, "
        "lab result tracking, service logging, automated communications, and operational workflows. It replaces generic "
        "EMR/CRM software with a purpose-built system designed around regenerative medicine workflows.",

        "The software is owned at the MSO level and <b>licensed to each PC via the Management Services Agreement</b>. "
        "This creates a SaaS-like revenue layer: the MSO charges a software licensing fee on top of the base management "
        "fee for each location. As the network grows, software revenue scales with zero marginal cost per additional location.",
    ],
    "Software ownership at the MSO level means the technology asset transfers cleanly in an acquisition. It also creates a recurring revenue stream that is independent of any single physician or location."
)

# Range Recovery Method detail
story += detail_block(
    "Range Recovery Method \u2014 Clinical Intellectual Property",
    [
        "The Range Recovery Method is the proprietary clinical protocol system behind all Range Medical treatments. "
        "It encompasses standardized protocols for hormone replacement therapy, peptide therapy, IV therapy, hyperbaric "
        "oxygen therapy, red light therapy, and performance optimization programs.",

        "Critically, this IP <b>vests in the MSO, not in any individual</b>. Clinical protocols developed by affiliated "
        "physicians become MSO property under the operating agreement. This means the clinical methodology \u2014 the core "
        "differentiator that drives patient outcomes and word-of-mouth growth \u2014 is a transferable business asset.",
    ],
    "In an acquisition, the clinical IP transfers with the MSO. No individual can walk away with the protocols. This is the difference between buying a brand and buying a practice that depends on one doctor\u2019s personal knowledge."
)

# Equipment detail
story += detail_block(
    "Equipment Portfolio \u2014 MSO-Level Asset Ownership",
    [
        "All major clinical equipment \u2014 hyperbaric oxygen therapy chambers, red light therapy devices, DEXA body "
        "composition scanners, and IV therapy stations \u2014 is purchased and owned by the MSO, then deployed to PC "
        "locations under the Management Services Agreement.",

        "MSO-level ownership serves two purposes: it <b>protects equipment from clinical liability</b> (malpractice "
        "claims against a PC cannot reach MSO-held assets), and it <b>consolidates all capital assets on one balance "
        "sheet</b> for cleaner financial reporting and simpler asset transfer in a sale.",
    ],
    "Equipment stays with the MSO regardless of what happens at the PC level. If a physician leaves or a PC transitions, the equipment remains an MSO asset \u2014 deployed to the next affiliated practice."
)


# ═══════════════════════════════════════════════════════════════════════════════
# MSA FLOW
# ═══════════════════════════════════════════════════════════════════════════════
story.append(Spacer(1, 4))

# MSA flow box
msa_data = [
    [Paragraph("Management Services Agreement", flow_s)],
    [Paragraph("Fees flow up \u2022 Services flow down", flow_sub_s)],
]
msa_box = Table(msa_data, colWidths=[3.5*inch])
msa_box.setStyle(TableStyle([
    ('BACKGROUND',    (0,0), (-1,-1), ACCENT_BG),
    ('BOX',           (0,0), (-1,-1), 0.75, HexColor('#2E6B3533')),
    ('ALIGN',         (0,0), (-1,-1), 'CENTER'),
    ('LEFTPADDING',   (0,0), (-1,-1), 14),
    ('RIGHTPADDING',  (0,0), (-1,-1), 14),
    ('TOPPADDING',    (0,0), (0,0),   8),
    ('BOTTOMPADDING', (-1,-1),(-1,-1), 8),
]))

flow_row = Table([[
    Paragraph("", body_s),
    msa_box,
    Paragraph("", body_s),
]], colWidths=[1.75*inch, 3.5*inch, 1.75*inch])
flow_row.setStyle(TableStyle([
    ('ALIGN', (0,0), (-1,-1), 'CENTER'),
    ('VALIGN',(0,0), (-1,-1), 'MIDDLE'),
    ('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),0),
]))
story.append(flow_row)
story.append(Spacer(1, 4))

story += detail_block(
    "Management Services Agreement (MSA)",
    [
        "The MSA is the contract that connects the MSO to each affiliated physician practice. It defines the relationship: "
        "the MSO provides management services (software, equipment, staffing, billing, marketing, compliance infrastructure), "
        "and the PC pays a recurring management fee for those services.",

        "This is the <b>core revenue mechanism</b> of the MSO model. Management fees are structured as a percentage of "
        "collections or a flat monthly rate \u2014 creating predictable, recurring revenue that is contractually defined and "
        "not dependent on patient volume at any single location.",

        "The MSA also defines service-level obligations, term length, renewal conditions, and termination provisions. "
        "Each new PC in the Range Medical network signs the same standard MSA, making expansion repeatable.",
    ],
    "The MSA is what makes the MSO model work. It converts clinical revenue into management fee revenue at the MSO level \u2014 the entity investors own. The longer the MSA term and the more PCs under contract, the more predictable and valuable the revenue stream."
)

# Arrows
story.append(Paragraph("\u25B2 Fees     \u25BC Services", st('Arrows', fontName='Helvetica-Bold', fontSize=9, textColor=ACCENT, leading=12, alignment=TA_CENTER)))
story.append(Spacer(1, 8))


# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 3: AFFILIATED PHYSICIAN PRACTICES
# ═══════════════════════════════════════════════════════════════════════════════
story += section_label("Affiliated Physician Practices")

story.append(entity_card_row([
    ("Operational", "Newport Beach Medical PC",
     "Physician-owned professional corporation \u2022 Full-service regenerative medicine clinic \u2022 1901 Westcliff Dr, Newport Beach",
     HexColor('#2A2A2A')),
    ("Under Development", "San Clemente Medical PC",
     "Physician-owned professional corporation \u2022 Co-located with Sunday Red / Tiger Woods brand \u2022 San Clemente, CA",
     GOLD),
]))

story += detail_block(
    "Newport Beach Medical PC",
    [
        "The Newport Beach PC is a physician-owned professional corporation that operates the clinical practice at "
        "1901 Westcliff Drive, Suite 10 in Newport Beach. The physician of record owns and controls the PC, as required "
        "by California medical practice law. The PC handles all patient care, prescribing, and clinical decision-making.",

        "The MSO provides management services to the Newport Beach PC under a long-term Management Services Agreement. "
        "The PC pays a management fee to the MSO in exchange for the Range System software, equipment access, operational "
        "staffing, billing, marketing, and compliance infrastructure. The physician focuses on medicine; the MSO handles the business.",
    ],
    "This separation is key to the model. The PC generates clinical revenue. The MSO captures management fee revenue. The MSO\u2019s value scales with the number of PCs under contract \u2014 not with the number of patients at any single location."
)

story += detail_block(
    "San Clemente Medical PC",
    [
        "The San Clemente location is under development as the second PC in the Range Medical network. This location will be "
        "<b>co-located with the Sunday Red / Tiger Woods brand</b> \u2014 a premium performance and wellness facility that provides "
        "built-in foot traffic, brand credibility, and a high-value patient demographic.",

        "The San Clemente PC will operate under the same MSA structure as Newport Beach: physician-owned PC, management services "
        "provided by the MSO, same software platform, same clinical protocols, same equipment portfolio. This is the repeatable "
        "expansion model \u2014 each new location plugs into the existing MSO infrastructure.",
    ],
    "The Sunday Red co-location represents a significant brand and distribution advantage. The MSO captures management fee revenue from this location just like Newport Beach \u2014 expanding the revenue base without expanding the overhead proportionally."
)


# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 4: HOW REVENUE FLOWS
# ═══════════════════════════════════════════════════════════════════════════════
story.append(PageBreak())
build_header(story)

story += section_label("How Revenue Flows")

flow_steps = [
    ("1", "Patients Visit PC", "Patients receive care at the physician-owned practice location"),
    ("2", "PC Collects Revenue", "Clinical revenue from services, treatments, and programs"),
    ("3", "MSA Fee to MSO", "PC pays recurring management fee to the MSO per the MSA"),
    ("4", "MSO Scales", "Each new PC adds another management fee stream to the MSO"),
]

col_w = W / 4
flow_cells = []
for num, title, desc in flow_steps:
    cell = Table([
        [Paragraph(f"<b>{num}</b>", st('Num', fontName='Helvetica-Bold', fontSize=18, textColor=ACCENT, leading=22, alignment=TA_CENTER))],
        [Paragraph(f"<b>{title}</b>", st('FT', fontName='Helvetica-Bold', fontSize=9.5, textColor=BLACK, leading=13, alignment=TA_CENTER))],
        [Paragraph(desc, st('FD', fontName='Helvetica', fontSize=8, textColor=MID_GRAY, leading=12, alignment=TA_CENTER))],
    ], colWidths=[col_w - 0.2*inch])
    cell.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), LIGHT_GRAY),
        ('BOX', (0,0), (-1,-1), 0.5, RULE_GRAY),
        ('TOPPADDING', (0,0), (0,0), 12),
        ('BOTTOMPADDING', (-1,-1), (-1,-1), 12),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    flow_cells.append(cell)

flow_tbl = Table([flow_cells], colWidths=[col_w]*4)
flow_tbl.setStyle(TableStyle([
    ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ('LEFTPADDING', (0,0), (-1,-1), 2),
    ('RIGHTPADDING', (0,0), (-1,-1), 2),
]))
story.append(flow_tbl)
story.append(Spacer(1, 20))


# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 5: WHY THIS STRUCTURE
# ═══════════════════════════════════════════════════════════════════════════════
story += section_label("Why This Structure")

story.append(entity_card_row([
    ("Valuation", "8\u201312x EBITDA", "MSOs trade at premium multiples vs. 1\u20132x for standalone practices", ACCENT),
    ("Scalability", "Repeatable Model", "Same MSA, same software, same protocols \u2014 each new location plugs in", ACCENT),
    ("Protection", "Asset Separation", "MSO assets shielded from clinical liability \u2014 clean transfer in acquisition", ACCENT),
]))

story += detail_block(
    "Premium Valuation Multiples",
    [
        "Standalone medical practices typically sell for 1\u20132x EBITDA because their value is tied to a specific physician, "
        "location, and patient panel. When the doctor leaves, the value walks out the door.",

        "MSOs trade at <b>8\u201312x EBITDA</b> because they own the transferable assets: software, IP, brand, equipment, and "
        "long-term management contracts. The revenue is contractual, the assets are transferable, and the model is not dependent "
        "on any single clinician. Private equity and strategic acquirers pay premium multiples for this structure because it "
        "de-risks the investment.",
    ],
    "The entire Range Medical business model is designed to build enterprise value at the MSO level \u2014 where the valuation multiples reward scalable, asset-heavy, contract-based business models."
)

story += detail_block(
    "Repeatable Expansion Model",
    [
        "Every new Range Medical location follows the same playbook: a physician-owned PC signs a standard Management Services "
        "Agreement, gets access to the Range System software, deploys MSO-owned equipment, and operates under the Range Recovery "
        "Method protocols.",

        "The MSO doesn\u2019t need to rebuild infrastructure for each location. The software platform, clinical protocols, compliance "
        "frameworks, and operational playbooks are <b>already built</b>. Each new PC adds management fee revenue to the MSO with "
        "minimal incremental overhead.",
    ],
    "Scalability is the multiplier. The fixed costs of the MSO (software development, IP, brand) are amortized across every PC in the network. Margin improves with each new location."
)

story += detail_block(
    "Asset Protection Through Separation",
    [
        "By holding technology, equipment, and IP at the MSO level \u2014 separate from the clinical entities \u2014 Range Medical "
        "creates a structural liability shield. Clinical malpractice claims against a PC cannot reach MSO-held assets. The software, "
        "equipment, and brand remain protected regardless of clinical outcomes at any individual location.",

        "In an acquisition, this separation means the <b>buyer acquires the MSO and gets all the valuable assets</b> without "
        "inheriting the clinical liabilities of any individual practice. The PCs can transition, physicians can change, but the "
        "MSO\u2019s assets and contracts remain intact.",
    ],
    "Asset separation is not just a legal nicety \u2014 it\u2019s a structural requirement for premium valuation. Acquirers need to know exactly what they\u2019re buying and that it\u2019s insulated from clinical risk."
)


# ── Footer
build_footer(story)

# ── Build
doc.build(story)
print(f"PDF generated: {OUTPUT_PATH}")
