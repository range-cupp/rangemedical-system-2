from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table,
                                 TableStyle, HRFlowable, PageBreak)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT

BLACK      = HexColor('#0A0A0A')
DARK_GRAY  = HexColor('#1A1A1A')
MID_GRAY   = HexColor('#606060')
LIGHT_GRAY = HexColor('#F4F4F4')
RULE_GRAY  = HexColor('#DDDDDD')
WHITE      = HexColor('#FFFFFF')
GREEN      = HexColor('#2E6B35')
ACCENT     = HexColor('#1A1A1A')
BLUE_BG    = HexColor('#EBF0F7')
GREEN_BG   = HexColor('#E8F5E9')
W = 7.0 * inch

def st(name, **kw):
    return ParagraphStyle(name, **kw)

clinic_s    = st('Clinic', fontName='Helvetica-Bold',    fontSize=13,  textColor=BLACK,     leading=16)
contact_s   = st('Cont',   fontName='Helvetica',         fontSize=8,   textColor=MID_GRAY,  leading=12, alignment=TA_RIGHT)
title_s     = st('Title',  fontName='Helvetica-Bold',    fontSize=17,  textColor=BLACK,     leading=21, spaceAfter=2)
subtitle_s  = st('Sub',    fontName='Helvetica-Oblique', fontSize=9.5, textColor=MID_GRAY,  leading=13)
sec_s       = st('Sec',    fontName='Helvetica-Bold',    fontSize=8,   textColor=MID_GRAY,  leading=11, spaceBefore=16, spaceAfter=3)
comp_s      = st('Comp',   fontName='Helvetica-Bold',    fontSize=12,  textColor=BLACK,     leading=15, spaceBefore=10, spaceAfter=4)
sub_s       = st('SubH',   fontName='Helvetica-Bold',    fontSize=9.5, textColor=BLACK,     leading=13, spaceBefore=8,  spaceAfter=3)
body_s      = st('Body',   fontName='Helvetica',         fontSize=9.5, textColor=DARK_GRAY, leading=16, spaceAfter=0)
bullet_s    = st('Bul',    fontName='Helvetica',         fontSize=9.5, textColor=DARK_GRAY, leading=16, leftIndent=14, firstLineIndent=-10, spaceAfter=2)
th_s        = st('TH',     fontName='Helvetica-Bold',    fontSize=8,   textColor=MID_GRAY,  leading=11)
tv_s        = st('TV',     fontName='Helvetica',         fontSize=9.5, textColor=DARK_GRAY, leading=14)
tv_bold_s   = st('TVB',    fontName='Helvetica-Bold',    fontSize=9.5, textColor=BLACK,     leading=14)
check_s     = st('Chk',    fontName='Helvetica-Bold',    fontSize=9,   textColor=GREEN,     leading=14)
rest_s      = st('Rst',    fontName='Helvetica',         fontSize=9,   textColor=MID_GRAY,  leading=14)
foot_s      = st('Foot',   fontName='Helvetica-Oblique', fontSize=8,   textColor=MID_GRAY,  leading=12)
foot_bold_s = st('FootB',  fontName='Helvetica-Bold',    fontSize=8.5, textColor=DARK_GRAY, leading=12)
note_s      = st('Note',   fontName='Helvetica-Oblique', fontSize=9,   textColor=MID_GRAY,  leading=13, spaceAfter=4)
big_num_s   = st('BigNum', fontName='Helvetica-Bold',    fontSize=22,  textColor=BLACK,     leading=26, alignment=TA_CENTER)
big_label_s = st('BigLbl', fontName='Helvetica',         fontSize=8,   textColor=MID_GRAY,  leading=11, alignment=TA_CENTER)
stage_num_s = st('StgNum', fontName='Helvetica-Bold',    fontSize=11,  textColor=WHITE,     leading=14, alignment=TA_CENTER)
stage_name_s= st('StgNm',  fontName='Helvetica-Bold',    fontSize=9.5, textColor=BLACK,     leading=13, alignment=TA_CENTER)
stage_desc_s= st('StgDsc', fontName='Helvetica',         fontSize=7.5, textColor=MID_GRAY,  leading=10, alignment=TA_CENTER)
arrow_s     = st('Arrow',  fontName='Helvetica-Bold',    fontSize=14,  textColor=MID_GRAY,  leading=16, alignment=TA_CENTER)

def section_label(text):
    return [
        Paragraph(text.upper(), sec_s),
        HRFlowable(width="100%", thickness=0.75, color=RULE_GRAY, spaceAfter=8),
    ]

def bullet(text):
    return Paragraph(f"–  {text}", bullet_s)

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

def build_footer(story):
    story.append(Spacer(1, 12))
    story.append(HRFlowable(width="100%", thickness=0.5, color=RULE_GRAY, spaceAfter=8))
    tbl = Table([[
        Paragraph("<b>Internal Use Only</b><br/>Range Medical — Confidential", foot_bold_s),
        Paragraph("This document contains proprietary financial data. Do not distribute externally.", foot_s),
    ]], colWidths=[2.2*inch, 4.8*inch])
    tbl.setStyle(TableStyle([
        ('VALIGN',(0,0),(-1,-1),'TOP'),
        ('TOPPADDING',(0,0),(-1,-1),0),('BOTTOMPADDING',(0,0),(-1,-1),0),
        ('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),0),
    ]))
    story.append(tbl)

def data_table(headers, rows, col_widths=None):
    hdr_style = st('DTH', fontName='Helvetica-Bold', fontSize=8, textColor=WHITE, leading=11)
    cell_style = st('DTC', fontName='Helvetica', fontSize=9, textColor=DARK_GRAY, leading=13)
    cell_bold  = st('DTCB', fontName='Helvetica-Bold', fontSize=9, textColor=BLACK, leading=13)
    data = [[Paragraph(h, hdr_style) for h in headers]]
    for row in rows:
        styled = []
        for i, c in enumerate(row):
            s = cell_bold if i == 0 else cell_style
            styled.append(Paragraph(str(c), s))
        data.append(styled)
    if not col_widths:
        col_widths = [W / len(headers)] * len(headers)
    tbl = Table(data, colWidths=col_widths)
    style_cmds = [
        ('BACKGROUND',    (0,0),(-1,0), ACCENT),
        ('TEXTCOLOR',     (0,0),(-1,0), WHITE),
        ('TOPPADDING',    (0,0),(-1,-1), 5),
        ('BOTTOMPADDING', (0,0),(-1,-1), 5),
        ('LEFTPADDING',   (0,0),(-1,-1), 8),
        ('RIGHTPADDING',  (0,0),(-1,-1), 8),
        ('VALIGN',        (0,0),(-1,-1), 'MIDDLE'),
        ('BOX',           (0,0),(-1,-1), 0.5, RULE_GRAY),
        ('LINEBELOW',     (0,0),(-1,-1), 0.5, RULE_GRAY),
        ('ROWBACKGROUNDS',(0,1),(-1,-1), [WHITE, LIGHT_GRAY]),
    ]
    tbl.setStyle(TableStyle(style_cmds))
    return tbl

def totals_row_table(headers, rows, col_widths=None, total_row_idx=None):
    hdr_style = st('DTH2', fontName='Helvetica-Bold', fontSize=8, textColor=WHITE, leading=11)
    cell_style = st('DTC2', fontName='Helvetica', fontSize=9, textColor=DARK_GRAY, leading=13)
    cell_bold  = st('DTCB2', fontName='Helvetica-Bold', fontSize=9, textColor=BLACK, leading=13)
    total_style = st('DTT', fontName='Helvetica-Bold', fontSize=9.5, textColor=BLACK, leading=13)
    data = [[Paragraph(h, hdr_style) for h in headers]]
    for i, row in enumerate(rows):
        styled = []
        is_total = (total_row_idx is not None and i == total_row_idx) or (total_row_idx is None and i == len(rows)-1)
        for j, c in enumerate(row):
            s = total_style if is_total else (cell_bold if j == 0 else cell_style)
            styled.append(Paragraph(str(c), s))
        data.append(styled)
    if not col_widths:
        col_widths = [W / len(headers)] * len(headers)
    tbl = Table(data, colWidths=col_widths)
    style_cmds = [
        ('BACKGROUND',    (0,0),(-1,0), ACCENT),
        ('TEXTCOLOR',     (0,0),(-1,0), WHITE),
        ('TOPPADDING',    (0,0),(-1,-1), 5),
        ('BOTTOMPADDING', (0,0),(-1,-1), 5),
        ('LEFTPADDING',   (0,0),(-1,-1), 8),
        ('RIGHTPADDING',  (0,0),(-1,-1), 8),
        ('VALIGN',        (0,0),(-1,-1), 'MIDDLE'),
        ('BOX',           (0,0),(-1,-1), 0.5, RULE_GRAY),
        ('LINEBELOW',     (0,0),(-1,-1), 0.5, RULE_GRAY),
        ('ROWBACKGROUNDS',(0,1),(-1,-1), [WHITE, LIGHT_GRAY]),
    ]
    tr = total_row_idx if total_row_idx is not None else len(rows) - 1
    style_cmds.append(('BACKGROUND', (0, tr+1), (-1, tr+1), GREEN_BG))
    style_cmds.append(('LINEABOVE', (0, tr+1), (-1, tr+1), 1, ACCENT))
    tbl.setStyle(TableStyle(style_cmds))
    return tbl

OUTPUT_PATH = "/Users/chriscupp/Code/rangemedical-system-2/docs/Range-Medical-Money-Model.pdf"

doc = SimpleDocTemplate(
    OUTPUT_PATH,
    pagesize=letter,
    rightMargin=0.75*inch, leftMargin=0.75*inch,
    topMargin=0.65*inch,   bottomMargin=0.65*inch,
)
story = []

# ── PAGE 1: TITLE + THE SPINE ────────────────────────────────────────────────
build_header(story)
story.append(Paragraph("MONEY MODEL &amp; OFFER ARCHITECTURE", title_s))
story.append(Paragraph("Internal Strategy Document — May 2026", subtitle_s))
story.append(Spacer(1, 20))

story += section_label("The Spine")
story.append(Paragraph("Every patient follows one path. Each stage feeds the next.", body_s))
story.append(Spacer(1, 14))

spine_data = [
    ["1", "ATTRACTION", "Discounted front-of-house\nservices build trust"],
    ["→", "", ""],
    ["2", "ASSESSMENT", "$197 consultation\ncredits toward labs/program"],
    ["→", "", ""],
    ["3", "LAB PANELS", "Essential ($350) or\nElite ($750) bloodwork"],
    ["→", "", ""],
    ["4", "TREATMENT", "WL, HRT, or Recovery\nprogram enrollment"],
    ["→", "", ""],
    ["5", "DOWNSELL", "Payment plan or Phase 1\nif full program is too much"],
    ["→", "", ""],
    ["6", "CONTINUITY", "$249/4wk membership\nannual labs + check-ins"],
]

spine_cells = []
for item in spine_data:
    if item[0] == "→":
        spine_cells.append([Paragraph("→", arrow_s)])
    else:
        num_bg = Table([[Paragraph(item[0], stage_num_s)]], colWidths=[0.28*inch], rowHeights=[0.28*inch])
        num_bg.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (0,0), ACCENT),
            ('ALIGN', (0,0), (0,0), 'CENTER'),
            ('VALIGN', (0,0), (0,0), 'MIDDLE'),
            ('TOPPADDING', (0,0), (0,0), 2),
            ('BOTTOMPADDING', (0,0), (0,0), 2),
            ('LEFTPADDING', (0,0), (0,0), 0),
            ('RIGHTPADDING', (0,0), (0,0), 0),
        ]))
        cell_content = Table([
            [num_bg],
            [Paragraph(item[1], stage_name_s)],
            [Paragraph(item[2], stage_desc_s)],
        ], colWidths=[0.95*inch])
        cell_content.setStyle(TableStyle([
            ('ALIGN', (0,0), (0,-1), 'CENTER'),
            ('VALIGN', (0,0), (0,-1), 'MIDDLE'),
            ('TOPPADDING', (0,0), (0,-1), 2),
            ('BOTTOMPADDING', (0,0), (0,-1), 2),
        ]))
        spine_cells.append([cell_content])

flow_row = []
for cell in spine_cells:
    flow_row.append(cell[0])

col_w = []
for item in spine_data:
    if item[0] == "→":
        col_w.append(0.22*inch)
    else:
        col_w.append(0.95*inch)

spine_tbl = Table([flow_row], colWidths=col_w)
spine_tbl.setStyle(TableStyle([
    ('ALIGN', (0,0), (-1,-1), 'CENTER'),
    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ('BACKGROUND', (0,0), (-1,-1), LIGHT_GRAY),
    ('BOX', (0,0), (-1,-1), 0.5, RULE_GRAY),
    ('TOPPADDING', (0,0), (-1,-1), 10),
    ('BOTTOMPADDING', (0,0), (-1,-1), 10),
]))
story.append(spine_tbl)

story.append(Spacer(1, 20))
story += section_label("Key Metrics at a Glance")

metrics = [
    ["$7,080", "Year 1 Revenue\n(WL patient)"],
    ["$3,784", "Year 1 Revenue\n(HRT patient)"],
    ["81.0%", "WL Gross Margin\n(full journey)"],
    ["95.4%", "Continued Care\nMargin"],
]
m_cells = []
for m in metrics:
    cell = Table([
        [Paragraph(m[0], big_num_s)],
        [Paragraph(m[1], big_label_s)],
    ], colWidths=[W/4 - 0.1*inch])
    cell.setStyle(TableStyle([
        ('ALIGN', (0,0), (0,-1), 'CENTER'),
        ('TOPPADDING', (0,0), (0,-1), 6),
        ('BOTTOMPADDING', (0,0), (0,-1), 6),
    ]))
    m_cells.append(cell)

metrics_tbl = Table([m_cells], colWidths=[W/4]*4)
metrics_tbl.setStyle(TableStyle([
    ('BOX', (0,0), (-1,-1), 0.5, RULE_GRAY),
    ('LINEBEFORE', (1,0), (1,0), 0.5, RULE_GRAY),
    ('LINEBEFORE', (2,0), (2,0), 0.5, RULE_GRAY),
    ('LINEBEFORE', (3,0), (3,0), 0.5, RULE_GRAY),
    ('BACKGROUND', (0,0), (-1,-1), LIGHT_GRAY),
    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
]))
story.append(metrics_tbl)

build_footer(story)
story.append(PageBreak())

# ── PAGE 2: ATTRACTION + ASSESSMENT ──────────────────────────────────────────
build_header(story)
story.append(Paragraph("STAGES 1 &amp; 2 — ATTRACTION + ASSESSMENT", title_s))
story.append(Spacer(1, 10))

story += section_label("Stage 1: Attraction — Front-of-House Services")
story.append(Paragraph("Discounted services get new patients through the door. Every attraction service is profitable even at promotional pricing.", body_s))
story.append(Spacer(1, 8))

story.append(data_table(
    ["Service", "COGS", "Full Price", "Gross Profit", "Margin"],
    [
        ["B12 Injection",     "$5.13",   "$35",  "$29.87",  "85.3%"],
        ["Range IV",          "$58.54",  "$225", "$166.46", "74.0%"],
        ["Glutathione Push",  "$9.94",   "$75",  "$65.06",  "86.7%"],
        ["NAD+ IV (500mg)",   "$110.72", "$399", "$288.28", "72.2%"],
    ],
    col_widths=[1.6*inch, 0.9*inch, 0.9*inch, 1.2*inch, 0.9*inch]
))

story.append(Spacer(1, 6))
story.append(Paragraph("<i>Purpose: Collect contact info, build trust, create opportunity to introduce the Range Assessment.</i>", note_s))

story.append(Spacer(1, 16))
story += section_label("Stage 2: Range Assessment — $197")

story.append(Paragraph("Comprehensive symptoms review, written plan, and provider consultation. The $197 credits toward any lab panel or treatment program.", body_s))
story.append(Spacer(1, 8))

assess_data = [
    [Paragraph("<b>Price</b>", tv_bold_s), Paragraph("$197", tv_s)],
    [Paragraph("<b>COGS</b>", tv_bold_s), Paragraph("Provider time only — no lab cost", tv_s)],
    [Paragraph("<b>Credit</b>", tv_bold_s), Paragraph("Full $197 applies toward Essential Panel, Elite Panel, or any treatment program", tv_s)],
    [Paragraph("<b>Conversion Target</b>", tv_bold_s), Paragraph("Assessment → Lab Panel → Treatment Program", tv_s)],
]
assess_tbl = Table(assess_data, colWidths=[1.6*inch, 5.4*inch])
assess_tbl.setStyle(TableStyle([
    ('TOPPADDING', (0,0), (-1,-1), 5),
    ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ('LEFTPADDING', (0,0), (-1,-1), 10),
    ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ('ROWBACKGROUNDS', (0,0), (-1,-1), [LIGHT_GRAY, WHITE]),
    ('BOX', (0,0), (-1,-1), 0.5, RULE_GRAY),
    ('LINEBELOW', (0,0), (-1,-2), 0.5, RULE_GRAY),
]))
story.append(assess_tbl)

build_footer(story)
story.append(PageBreak())

# ── PAGE 3: LAB PANELS ───────────────────────────────────────────────────────
build_header(story)
story.append(Paragraph("STAGE 3 — LAB PANELS", title_s))
story.append(Spacer(1, 10))

story += section_label("Standard Entry for All Programs")
story.append(Paragraph("Every treatment path starts with the Essential Panel. Patients can optionally upgrade to Elite for deeper biomarker analysis.", body_s))
story.append(Spacer(1, 8))

story.append(data_table(
    ["Panel", "Markers", "COGS", "Patient Price", "Gross Profit", "Margin"],
    [
        ["Essential (standard)", "15", "$149.03", "$350", "$200.97", "57.4%"],
        ["Elite (upgrade)",      "36", "$346.01", "$750", "$403.99", "53.9%"],
    ],
    col_widths=[1.5*inch, 0.7*inch, 0.8*inch, 1.0*inch, 1.0*inch, 0.7*inch]
))

story.append(Spacer(1, 12))
story += section_label("Essential Panel — 15 Biomarkers")
story.append(Paragraph("CMP (17 biomarkers)  •  Lipid Panel (6)  •  CBC with Differential (20)  •  Estradiol  •  HbA1c  •  Fasting Insulin  •  PSA Total  •  SHBG  •  Free T3  •  Total T4  •  Free Testosterone  •  Total Testosterone  •  TPO Antibodies  •  TSH  •  Vitamin D", body_s))

story.append(Spacer(1, 8))
story += section_label("Elite Panel — 36 Biomarkers")
story.append(Paragraph("Everything in Essential, plus: ApoA-1  •  ApoB  •  CRP-HS  •  Cortisol  •  DHEA-S  •  Ferritin  •  Folate  •  FSH  •  GGT  •  Homocysteine  •  IGF-1  •  Iron &amp; TIBC  •  LH  •  Lipoprotein(a)  •  Magnesium  •  PSA Free  •  Sed Rate  •  Free T4  •  Thyroglobulin AB  •  Uric Acid  •  Vitamin B-12", body_s))

story.append(Spacer(1, 14))
story += section_label("Combined Assessment + Labs Economics")

story.append(totals_row_table(
    ["Path", "Total Collected", "Lab COGS", "Gross Profit"],
    [
        ["Assessment + Essential", "$350", "$149.03", "$200.97"],
        ["Assessment + Elite",     "$750", "$346.01", "$403.99"],
    ],
    col_widths=[2.2*inch, 1.4*inch, 1.2*inch, 1.2*inch],
    total_row_idx=1
))

story.append(Spacer(1, 6))
story.append(Paragraph("<i>Both paths are solidly profitable. Lab results create clinical urgency that drives program enrollment.</i>", note_s))

build_footer(story)
story.append(PageBreak())

# ── PAGE 4: MEDICAL WEIGHT LOSS ──────────────────────────────────────────────
build_header(story)
story.append(Paragraph("STAGE 4A — MEDICAL WEIGHT LOSS PROGRAM", title_s))
story.append(Paragraph("Billed in 4-injection (4-week) blocks. Three internal tiers by lbs to lose.", subtitle_s))
story.append(Spacer(1, 10))

story += section_label("Tirzepatide — Per 4-Week Block")
story.append(data_table(
    ["Dose", "Block Revenue", "COGS", "Profit", "Margin"],
    [
        ["2.5mg (start)", "$400", "$51.30",  "$348.70", "87.2%"],
        ["5mg",           "$548", "$101.30", "$446.70", "81.5%"],
        ["7.5mg",         "$600", "$151.30", "$448.70", "74.8%"],
        ["10mg",          "$648", "$201.30", "$446.70", "68.9%"],
        ["12.5mg (max)",  "$700", "$251.30", "$448.70", "64.1%"],
    ],
    col_widths=[1.3*inch, 1.2*inch, 1.0*inch, 1.0*inch, 0.9*inch]
))

story.append(Spacer(1, 12))
story += section_label("Retatrutide — Per 4-Week Block")
story.append(data_table(
    ["Dose", "Block Revenue", "COGS", "Profit", "Margin"],
    [
        ["1mg (start)", "$250",  "$29.30",  "$220.70", "88.3%"],
        ["2mg",         "$500",  "$57.30",  "$442.70", "88.5%"],
        ["4mg",         "$600",  "$113.30", "$486.70", "81.1%"],
        ["8mg",         "$748",  "$225.30", "$522.70", "69.9%"],
        ["12mg (max)",  "$860",  "$337.30", "$522.70", "60.8%"],
    ],
    col_widths=[1.3*inch, 1.2*inch, 1.0*inch, 1.0*inch, 0.9*inch]
))

story.append(Spacer(1, 12))
story += section_label("Full Program Tiers (Tirzepatide, Weekly Dosing)")
story.append(data_table(
    ["Tier", "Blocks", "Revenue", "COGS", "Profit", "Margin"],
    [
        ["24-week", "6",  "$3,296", "$1,048", "$2,248", "68.2%"],
        ["32-week", "8",  "$4,596", "$1,498", "$3,098", "67.4%"],
        ["48-week", "12", "$7,096", "$2,468", "$4,628", "65.2%"],
    ],
    col_widths=[1.0*inch, 0.7*inch, 1.0*inch, 1.0*inch, 1.0*inch, 0.8*inch]
))
story.append(Spacer(1, 4))
story.append(Paragraph("<i>Follow-up labs use WL Panel ($70.03 each). Initial Essential Panel is separate (Stage 3). COGS = medication ($5/mg Tirz) + supplies + follow-up labs.</i>", note_s))

build_footer(story)
story.append(PageBreak())

# ── PAGE 5: HRT + RECOVERY ───────────────────────────────────────────────────
build_header(story)
story.append(Paragraph("STAGES 4B &amp; 4C — HRT + RECOVERY", title_s))
story.append(Spacer(1, 10))

story += section_label("Hormone Optimization Program — Per 4-Week Block (Ongoing)")
story.append(Paragraph("Initial labs = Essential Panel (Stage 3). Follow-ups use Post Panels ($52.98 male / $43.98 female).", body_s))
story.append(Spacer(1, 6))

story.append(data_table(
    ["", "COGS/Block", "Price/Block", "Profit/Block", "Margin"],
    [
        ["Male",   "$35.63", "$249", "$213.37", "85.7%"],
        ["Female", "$20.19", "$249", "$228.81", "91.9%"],
    ],
    col_widths=[1.0*inch, 1.2*inch, 1.2*inch, 1.2*inch, 0.9*inch]
))

story.append(Spacer(1, 12))
story += section_label("Year 1 HRT Economics (13 Cycles)")
story.append(data_table(
    ["", "Revenue", "COGS", "Profit", "Margin"],
    [
        ["Male",   "$3,237", "$463", "$2,774", "85.7%"],
        ["Female", "$3,237", "$262", "$2,975", "91.9%"],
    ],
    col_widths=[1.0*inch, 1.2*inch, 1.2*inch, 1.2*inch, 0.9*inch]
))
story.append(Spacer(1, 4))
story.append(Paragraph("<i>Male COGS includes Testosterone Cypionate ($11.84/4wk), supplies ($2.60), and amortized Post Panels. Female COGS = supplies + amortized Post Panels only.</i>", note_s))

story.append(Spacer(1, 16))
story += section_label("Recovery & Peptide Therapy Program")
story.append(Paragraph("Initial labs = Essential Panel (Stage 3). Sessions are IV-based with peptide protocols.", body_s))
story.append(Spacer(1, 6))

story.append(data_table(
    ["Service", "COGS", "Price", "Profit", "Margin"],
    [
        ["Range IV",         "$58.54",  "$225", "$166.46", "74.0%"],
        ["NAD+ IV (500mg)",  "$110.72", "$399", "$288.28", "72.2%"],
        ["Glutathione Push", "$9.94",   "$75",  "$65.06",  "86.7%"],
        ["B12 Injection",    "$5.13",   "$35",  "$29.87",  "85.3%"],
    ],
    col_widths=[1.4*inch, 1.0*inch, 0.9*inch, 1.0*inch, 0.9*inch]
))

build_footer(story)
story.append(PageBreak())

# ── PAGE 6: DOWNSELL + CONTINUED CARE ────────────────────────────────────────
build_header(story)
story.append(Paragraph("STAGES 5 &amp; 6 — DOWNSELL + CONTINUED CARE", title_s))
story.append(Spacer(1, 10))

story += section_label("Stage 5: Downsell")
story.append(Paragraph("If a patient cannot commit to the full program, two options preserve margin per dollar collected:", body_s))
story.append(Spacer(1, 6))

story.append(bullet("<b>Payment Plan</b> — Same total price, spread across more 4-week billing cycles. Lower per-block payment, identical margin per dollar."))
story.append(bullet("<b>Phase 1 Only</b> — Shorter commitment (first 8–12 weeks). Patient can re-enroll for the next phase. Captures partial revenue vs. losing the patient entirely."))

story.append(Spacer(1, 4))
story.append(Paragraph("<i>Downsell preserves margin rate — it captures fewer dollars or slower, but never at a lower percentage.</i>", note_s))

story.append(Spacer(1, 16))
story += section_label("Stage 6: Range Continued Care Membership — $249 / 4 Weeks")
story.append(Paragraph("Post-program continuity. Annual labs, provider check-ins, member pricing on services. The highest-margin stage of the entire journey.", body_s))
story.append(Spacer(1, 8))

cc_data = [
    [Paragraph("<b>Billing</b>", tv_bold_s), Paragraph("$249 every 4 weeks (13 cycles/year)", tv_s)],
    [Paragraph("<b>Includes</b>", tv_bold_s), Paragraph("Annual Essential Panel labs + provider check-ins + member pricing", tv_s)],
    [Paragraph("<b>Lab COGS (amortized)</b>", tv_bold_s), Paragraph("$149.03 / 13 cycles = $11.46 per cycle", tv_s)],
    [Paragraph("<b>Profit per Cycle</b>", tv_bold_s), Paragraph("$237.54", tv_s)],
    [Paragraph("<b>Margin</b>", tv_bold_s), Paragraph("95.4%", tv_s)],
]
cc_tbl = Table(cc_data, colWidths=[2.0*inch, 5.0*inch])
cc_tbl.setStyle(TableStyle([
    ('TOPPADDING', (0,0), (-1,-1), 5),
    ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ('LEFTPADDING', (0,0), (-1,-1), 10),
    ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ('ROWBACKGROUNDS', (0,0), (-1,-1), [LIGHT_GRAY, WHITE]),
    ('BOX', (0,0), (-1,-1), 0.5, RULE_GRAY),
    ('LINEBELOW', (0,0), (-1,-2), 0.5, RULE_GRAY),
]))
story.append(cc_tbl)

story.append(Spacer(1, 12))
story += section_label("Year 1 Continued Care Economics")

story.append(totals_row_table(
    ["", "Revenue", "COGS", "Profit", "Margin"],
    [
        ["Year 1 (13 cycles)", "$3,237", "$149", "$3,088", "95.4%"],
    ],
    col_widths=[1.6*inch, 1.0*inch, 1.0*inch, 1.0*inch, 0.9*inch],
    total_row_idx=0
))

story.append(Spacer(1, 4))
story.append(Paragraph("<i>Patient can upgrade to Elite Panel ($750) for annual labs at additional cost. Continued Care is the long-term revenue engine of the practice.</i>", note_s))

build_footer(story)
story.append(PageBreak())

# ── PAGE 7: FULL PATIENT JOURNEY ─────────────────────────────────────────────
build_header(story)
story.append(Paragraph("FULL PATIENT JOURNEY ECONOMICS", title_s))
story.append(Spacer(1, 10))

story += section_label("Weight Loss Patient — Essential Labs, 24-Week Tirzepatide")

story.append(totals_row_table(
    ["Stage", "Revenue", "COGS", "Gross Profit"],
    [
        ["Assessment",             "$197",   "$0",     "$197"],
        ["Essential Labs",         "$350",   "$149",   "$201"],
        ["WL Program (24 wks)",    "$3,296", "$1,048", "$2,248"],
        ["Continued Care (Yr 1)",  "$3,237", "$149",   "$3,088"],
        ["TOTAL YEAR 1",           "$7,080", "$1,346", "$5,734 (81.0%)"],
    ],
    col_widths=[2.2*inch, 1.2*inch, 1.2*inch, 1.6*inch]
))

story.append(Spacer(1, 14))
story += section_label("Weight Loss Patient — Elite Labs Upgrade")

story.append(totals_row_table(
    ["Stage", "Revenue", "COGS", "Gross Profit"],
    [
        ["Assessment",             "$197",   "$0",     "$197"],
        ["Elite Labs",             "$750",   "$346",   "$404"],
        ["WL Program (24 wks)",    "$3,296", "$1,048", "$2,248"],
        ["Continued Care (Yr 1)",  "$3,237", "$149",   "$3,088"],
        ["TOTAL YEAR 1",           "$7,480", "$1,543", "$5,937 (79.4%)"],
    ],
    col_widths=[2.2*inch, 1.2*inch, 1.2*inch, 1.6*inch]
))

story.append(Spacer(1, 14))
story += section_label("HRT Patient — Male, Essential Labs")

story.append(totals_row_table(
    ["Stage", "Revenue", "COGS", "Gross Profit"],
    [
        ["Assessment",             "$197",   "$0",   "$197"],
        ["Essential Labs",         "$350",   "$149", "$201"],
        ["HRT Program (13 cycles)","$3,237", "$463", "$2,774"],
        ["TOTAL YEAR 1",           "$3,784", "$612", "$3,172 (83.8%)"],
    ],
    col_widths=[2.2*inch, 1.2*inch, 1.2*inch, 1.6*inch]
))

story.append(Spacer(1, 14))
story.append(Paragraph("<i>All COGS are direct costs from supplier invoices. Provider time, rent, and overhead are not included in these margins. See cogs/COGS-MASTER-REFERENCE.md for full supplier cost breakdown.</i>", note_s))

build_footer(story)
doc.build(story)
print(f"PDF saved to {OUTPUT_PATH}")
