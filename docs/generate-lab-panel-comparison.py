#!/usr/bin/env python3
"""Generate Range Medical lab panel comparison: Essential vs Elite, fully expanded.

Source of truth for marker membership: the four handout PDFs at
public/documents/panels/range_medical_{essential,elite}_{male,female}.pdf,
expanded to include every individual analyte reported on each bundle test
(CMP, Lipid Panel, CBC w/ Differential, Iron Panel).

Output is a 2-page portrait PDF with a unified comparison table grouped by
what each test measures (kidney function, electrolytes, etc.) so patients
can see the actual scope of testing.

Run:
    python3 docs/generate-lab-panel-comparison.py
"""

from pathlib import Path

from reportlab.lib.colors import HexColor, white
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (HRFlowable, Paragraph, SimpleDocTemplate,
                                 Spacer, Table, TableStyle)

OUTPUT = Path(__file__).resolve().parent / "Range-Medical-Lab-Panel-Comparison.pdf"

BLACK      = HexColor("#0A0A0A")
DARK_GRAY  = HexColor("#1A1A1A")
MID_GRAY   = HexColor("#525252")
LIGHT_GRAY = HexColor("#9A9A9A")
RULE_GRAY  = HexColor("#E5E5E5")
SHADE      = HexColor("#F4F4F4")
SUBSHADE   = HexColor("#FAFAFA")
GREEN      = HexColor("#2E6B35")

PAGE_W = 7.0 * inch  # usable width inside 0.75" margins on letter

# Sections are top-level groupings. Each has a list of rows.
# A row is either:
#   ("marker", label, essential_state, elite_state)
#   ("subhead", label)   — italic sub-grouping label inside a bundle
# states: "yes" = ✓ | "no" = — | a custom string is rendered verbatim
SECTIONS = [
    ("Comprehensive Metabolic Panel (CMP) — 17 markers", "Liver, kidneys, blood sugar, electrolytes, proteins", [
        ("subhead", "Blood sugar"),
        ("marker", "Glucose",                      "yes", "yes"),
        ("subhead", "Kidney function"),
        ("marker", "BUN (Blood Urea Nitrogen)",    "yes", "yes"),
        ("marker", "Creatinine",                    "yes", "yes"),
        ("marker", "eGFR (kidney filtration rate)","yes", "yes"),
        ("subhead", "Electrolytes & minerals"),
        ("marker", "Sodium",                        "yes", "yes"),
        ("marker", "Potassium",                     "yes", "yes"),
        ("marker", "Chloride",                      "yes", "yes"),
        ("marker", "CO2 (Bicarbonate)",             "yes", "yes"),
        ("marker", "Calcium",                       "yes", "yes"),
        ("subhead", "Proteins"),
        ("marker", "Total Protein",                 "yes", "yes"),
        ("marker", "Albumin",                       "yes", "yes"),
        ("marker", "Globulin",                      "yes", "yes"),
        ("marker", "A/G Ratio",                     "yes", "yes"),
        ("subhead", "Liver enzymes"),
        ("marker", "AST (SGOT)",                    "yes", "yes"),
        ("marker", "ALT (SGPT)",                    "yes", "yes"),
        ("marker", "Alkaline Phosphatase (ALP)",    "yes", "yes"),
        ("marker", "Total Bilirubin",               "yes", "yes"),
    ]),
    ("Lipid Panel — 6 markers", "Cholesterol &amp; heart disease risk", [
        ("subhead", "Cholesterol"),
        ("marker", "Total Cholesterol",             "yes", "yes"),
        ("marker", "HDL Cholesterol",               "yes", "yes"),
        ("marker", "LDL Cholesterol",               "yes", "yes"),
        ("marker", "Non-HDL Cholesterol",           "yes", "yes"),
        ("subhead", "Triglycerides &amp; ratios"),
        ("marker", "Triglycerides",                 "yes", "yes"),
        ("marker", "Total Cholesterol / HDL Ratio", "yes", "yes"),
    ]),
    ("Complete Blood Count (CBC) with Differential — 20 markers", "Blood cells, anemia, immune function", [
        ("subhead", "Red blood cells"),
        ("marker", "Red Blood Cells (RBC)",         "yes", "yes"),
        ("marker", "Hemoglobin",                    "yes", "yes"),
        ("marker", "Hematocrit",                    "yes", "yes"),
        ("marker", "MCV — mean cell volume",        "yes", "yes"),
        ("marker", "MCH — mean cell hemoglobin",    "yes", "yes"),
        ("marker", "MCHC — concentration",          "yes", "yes"),
        ("marker", "RDW — distribution width",      "yes", "yes"),
        ("subhead", "White blood cells (5-part differential)"),
        ("marker", "White Blood Cells (WBC)",       "yes", "yes"),
        ("marker", "Neutrophils %",                 "yes", "yes"),
        ("marker", "Lymphocytes %",                 "yes", "yes"),
        ("marker", "Monocytes %",                   "yes", "yes"),
        ("marker", "Eosinophils %",                 "yes", "yes"),
        ("marker", "Basophils %",                   "yes", "yes"),
        ("marker", "Neutrophils (absolute)",        "yes", "yes"),
        ("marker", "Lymphocytes (absolute)",        "yes", "yes"),
        ("marker", "Monocytes (absolute)",          "yes", "yes"),
        ("marker", "Eosinophils (absolute)",        "yes", "yes"),
        ("marker", "Basophils (absolute)",          "yes", "yes"),
        ("subhead", "Platelets"),
        ("marker", "Platelet Count",                "yes", "yes"),
        ("marker", "MPV — mean platelet volume",    "yes", "yes"),
    ]),
    ("Hormones", "Sex hormones, adrenal, growth, prostate", [
        ("subhead", "Sex hormones"),
        ("marker", "Total Testosterone",                                  "yes", "yes"),
        ("marker", "Free Testosterone",                                   "yes", "yes"),
        ("marker", "Estradiol (E2)",                                       "yes", "yes"),
        ("marker", "Progesterone <i>(women)</i>",                          "yes", "yes"),
        ("marker", "SHBG (Sex Hormone Binding Globulin)",                  "yes", "yes"),
        ("marker", "FSH <i>(women in Essential; both in Elite)</i>",       "yes", "yes"),
        ("marker", "LH",                                                    "no",  "yes"),
        ("subhead", "Adrenal &amp; growth"),
        ("marker", "DHEA-S",                                                "no",  "yes"),
        ("marker", "Cortisol",                                              "no",  "yes"),
        ("marker", "IGF-1 (growth hormone marker)",                         "no",  "yes"),
        ("subhead", "Prostate <i>(men)</i>"),
        ("marker", "Total PSA",                                             "yes", "yes"),
        ("marker", "Free PSA",                                              "no",  "yes"),
    ]),
    ("Thyroid", "Energy, metabolism, autoimmune", [
        ("marker", "TSH (Thyroid Stimulating Hormone)",                     "yes", "yes"),
        ("marker", "Free T3",                                               "yes", "yes"),
        ("marker", "T4 Total <i>(Essential)</i>",                           "yes", "no"),
        ("marker", "Free T4 <i>(Elite — clinical upgrade)</i>",             "no",  "yes"),
        ("marker", "TPO Antibodies (autoimmune thyroid)",                   "yes", "yes"),
        ("marker", "Thyroglobulin Antibodies",                              "no",  "yes"),
    ]),
    ("Metabolism", "Blood sugar, insulin sensitivity, gout, liver", [
        ("marker", "Fasting Insulin",                                       "yes", "yes"),
        ("marker", "HbA1c (3-month glucose average)",                       "yes", "yes"),
        ("marker", "Uric Acid (gout risk)",                                 "no",  "yes"),
        ("marker", "GGT (detailed liver health)",                           "no",  "yes"),
    ]),
    ("Heart Health <i>(Elite only)</i>", "Advanced cardiovascular markers", [
        ("marker", "Apolipoprotein A-1 (good cholesterol protein)",         "no",  "yes"),
        ("marker", "Apolipoprotein B (key heart risk marker)",              "no",  "yes"),
        ("marker", "Lipoprotein(a) — genetic heart risk",                   "no",  "yes"),
        ("marker", "Homocysteine — vascular health",                        "no",  "yes"),
    ]),
    ("Inflammation <i>(Elite only)</i>", "Hidden inflammation markers", [
        ("marker", "hs-CRP (high-sensitivity C-reactive protein)",          "no",  "yes"),
        ("marker", "Sed Rate (ESR)",                                         "no",  "yes"),
    ]),
    ("Vitamins, Minerals &amp; Iron Panel", "Nutrient status &amp; iron stores", [
        ("subhead", "Vitamins"),
        ("marker", "Vitamin D (25-Hydroxy)",                                "yes", "yes"),
        ("marker", "Vitamin B-12",                                          "no",  "yes"),
        ("marker", "Folate",                                                "no",  "yes"),
        ("subhead", "Minerals"),
        ("marker", "Magnesium",                                             "no",  "yes"),
        ("subhead", "Iron Panel <i>(3 markers)</i>"),
        ("marker", "Serum Iron",                                            "no",  "yes"),
        ("marker", "TIBC (Total Iron-Binding Capacity)",                    "no",  "yes"),
        ("marker", "Transferrin Saturation",                                "no",  "yes"),
        ("marker", "Ferritin (iron storage)",                               "no",  "yes"),
    ]),
]


def st(name, **kw):
    return ParagraphStyle(name, **kw)


clinic_s    = st("Clinic",   fontName="Helvetica-Bold",    fontSize=12,  textColor=BLACK,     leading=15)
contact_s   = st("Contact",  fontName="Helvetica",         fontSize=8,   textColor=MID_GRAY,  leading=11, alignment=TA_RIGHT)
title_s     = st("Title",    fontName="Helvetica-Bold",    fontSize=15,  textColor=BLACK,     leading=18, alignment=TA_CENTER, spaceAfter=1)
sub_s       = st("Sub",      fontName="Helvetica",         fontSize=8,   textColor=MID_GRAY,  leading=10, alignment=TA_CENTER, spaceAfter=1)
count_s     = st("Count",    fontName="Helvetica-Bold",    fontSize=9,   textColor=BLACK,     leading=11, alignment=TA_CENTER, spaceAfter=4)
sec_s       = st("Sec",      fontName="Helvetica-Bold",    fontSize=7.5, textColor=BLACK,     leading=9)
subhead_s   = st("Subhead",  fontName="Helvetica-Bold",    fontSize=6.5, textColor=MID_GRAY,  leading=7)
marker_s    = st("Marker",   fontName="Helvetica",         fontSize=7,   textColor=DARK_GRAY, leading=8, leftIndent=8)
hdr_panel_s = st("HdrPnl",   fontName="Helvetica-Bold",    fontSize=7.5, textColor=white,     leading=10, alignment=TA_CENTER)
chk_s       = st("Chk",      fontName="Helvetica-Bold",    fontSize=8,   textColor=GREEN,     leading=10, alignment=TA_CENTER)
dash_s      = st("Dash",     fontName="Helvetica",         fontSize=8,   textColor=LIGHT_GRAY,leading=10, alignment=TA_CENTER)
custom_s    = st("Custom",   fontName="Helvetica-Bold",    fontSize=6.5, textColor=GREEN,     leading=8, alignment=TA_CENTER)


def build_header(story):
    hdr = Table([[
        Paragraph("RANGE MEDICAL", clinic_s),
        Paragraph(
            "range-medical.com  •  (949) 997-3988<br/>"
            "1901 Westcliff Dr, Suite 10, Newport Beach, CA",
            contact_s,
        ),
    ]], colWidths=[2.6 * inch, PAGE_W - 2.6 * inch])
    hdr.setStyle(TableStyle([
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING",   (0, 0), (-1, -1), 0),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 0),
        ("TOPPADDING",    (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(hdr)
    story.append(HRFlowable(width="100%", thickness=1.0, color=BLACK, spaceAfter=8))


def state_cell(state):
    if state == "yes":
        return Paragraph("✓", chk_s)
    if state == "no":
        return Paragraph("—", dash_s)
    return Paragraph(state, custom_s)


def build_table():
    col_widths = [4.4 * inch, 1.3 * inch, 1.3 * inch]
    data = []
    style_cmds = [
        ("BACKGROUND",    (0, 0), (-1, 0),  BLACK),
        ("ALIGN",         (1, 0), (-1, 0),  "CENTER"),
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING",   (0, 0), (-1, -1), 7),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 7),
        ("TOPPADDING",    (0, 0), (-1, -1), 1),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
        ("LINEBELOW",     (0, 0), (-1, 0),  0.5, BLACK),
    ]

    # Header row
    data.append([
        Paragraph("<b>BIOMARKER</b>", hdr_panel_s),
        Paragraph("<b>ESSENTIAL</b><br/><font color='#CCCCCC' size='7'>$350 · ~55 markers</font>", hdr_panel_s),
        Paragraph("<b>ELITE</b><br/><font color='#CCCCCC' size='7'>$750 · ~75 markers</font>", hdr_panel_s),
    ])
    style_cmds.append(("ALIGN", (0, 0), (0, 0), "LEFT"))

    row_idx = 1
    for section_name, tagline, rows in SECTIONS:
        # Section header row (with tagline)
        section_html = f"<b>{section_name.upper()}</b><br/><font color='#525252' size='7'><i>{tagline}</i></font>"
        data.append([
            Paragraph(section_html, sec_s),
            Paragraph("", marker_s),
            Paragraph("", marker_s),
        ])
        style_cmds += [
            ("BACKGROUND",    (0, row_idx), (-1, row_idx), SHADE),
            ("LINEABOVE",     (0, row_idx), (-1, row_idx), 0.5, RULE_GRAY),
            ("TOPPADDING",    (0, row_idx), (-1, row_idx), 3),
            ("BOTTOMPADDING", (0, row_idx), (-1, row_idx), 2),
        ]
        row_idx += 1

        for row in rows:
            if row[0] == "subhead":
                _, label = row
                data.append([
                    Paragraph(f"<b>{label}</b>", subhead_s),
                    Paragraph("", marker_s),
                    Paragraph("", marker_s),
                ])
                style_cmds += [
                    ("BACKGROUND",    (0, row_idx), (-1, row_idx), SUBSHADE),
                    ("TOPPADDING",    (0, row_idx), (-1, row_idx), 2),
                    ("BOTTOMPADDING", (0, row_idx), (-1, row_idx), 0),
                ]
                row_idx += 1
            else:
                _, label, essential, elite = row
                data.append([
                    Paragraph(label, marker_s),
                    state_cell(essential),
                    state_cell(elite),
                ])
                row_idx += 1

    tbl = Table(data, colWidths=col_widths, repeatRows=1)
    tbl.setStyle(TableStyle(style_cmds))
    return tbl


def main():
    doc = SimpleDocTemplate(
        str(OUTPUT),
        pagesize=letter,
        leftMargin=0.75 * inch,
        rightMargin=0.75 * inch,
        topMargin=0.45 * inch,
        bottomMargin=0.4 * inch,
        title="Range Medical — Lab Panel Comparison",
        author="Range Medical",
    )
    story = []
    build_header(story)

    story.append(Paragraph("Lab Panel Comparison", title_s))
    story.append(Paragraph(
        "Essential vs. Elite — every biomarker, grouped by what the test actually measures.",
        sub_s,
    ))
    story.append(Paragraph(
        "Essential ($350) — ~55 biomarkers &nbsp;·&nbsp; Elite ($750) — ~75 biomarkers",
        count_s,
    ))
    story.append(build_table())

    doc.build(story)
    print(f"Wrote {OUTPUT}")


if __name__ == "__main__":
    main()
