#!/usr/bin/env python3
"""Generate System Updates PDF for Range Medical."""

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

# Extra style for numbered items
num_s       = st('Num',    fontName='Helvetica-Bold',    fontSize=11,  textColor=BLACK,     leading=15, spaceBefore=14, spaceAfter=4)
detail_s    = st('Detail', fontName='Helvetica',         fontSize=9.5, textColor=DARK_GRAY, leading=16, spaceAfter=2, leftIndent=14)
detail_b_s  = st('DetailB',fontName='Helvetica-Bold',    fontSize=9.5, textColor=DARK_GRAY, leading=16, spaceAfter=2, leftIndent=14)

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

def build_header(story):
    hdr = Table([[
        Paragraph("RANGE MEDICAL", clinic_s),
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
    story.append(Spacer(1, 20))
    story.append(HRFlowable(width="100%", thickness=0.5, color=RULE_GRAY, spaceAfter=8))
    tbl = Table([[
        Paragraph("<b>Questions or concerns?</b><br/>Call or text: (949) 997-3988<br/>range-medical.com", foot_bold_s),
        Paragraph(
            "This document is intended for Range Medical staff only. "
            "For questions about any of these updates, contact Chris.",
            foot_s),
    ]], colWidths=[2.2*inch, 4.8*inch])
    tbl.setStyle(TableStyle([
        ('VALIGN',(0,0),(-1,-1),'TOP'),
        ('TOPPADDING',(0,0),(-1,-1),0),('BOTTOMPADDING',(0,0),(-1,-1),0),
        ('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),0),
    ]))
    story.append(tbl)

# ── BUILD DOCUMENT ───────────────────────────────────────────────────────────

OUTPUT_PATH = "public/docs/system-updates-march-2026.pdf"

doc = SimpleDocTemplate(
    OUTPUT_PATH,
    pagesize=letter,
    rightMargin=0.75*inch, leftMargin=0.75*inch,
    topMargin=0.65*inch,   bottomMargin=0.65*inch,
)
story = []
build_header(story)

# Title
story.append(Paragraph("CRM System Updates", title_s))
story.append(Paragraph("Summary of recent fixes and improvements \u2014 March 2026", subtitle_s))
story.append(Spacer(1, 14))

# --- #1: Doctor Reference Fix ---
story += section_label("Update 1")
story.append(Paragraph("1.  Doctor Reference Fix", num_s))
story.append(Paragraph(
    "Evan\u2019s doctor reference has been corrected. Doctor assignment fields are specifically "
    "for Dr. Burgess. The only instance where Evan was incorrectly listed as a doctor was in the "
    "lab review \u2014 this has now been fixed.",
    body_s))
story.append(Spacer(1, 4))
story.append(bullet("Lab review now correctly shows Dr. Burgess as the reviewing provider"))
story.append(bullet("No other areas were affected"))

# --- #2: HIPAA Capitalization ---
story += section_label("Update 2")
story.append(Paragraph("2.  HIPAA Capitalization", num_s))
story.append(Paragraph(
    "All patient-facing instances of \u201cHIPAA\u201d in the system are already correctly capitalized. "
    "The lowercase occurrences (<i>hipaa</i>) are internal string identifiers used in code \u2014 consent types, "
    "form IDs, URL paths, and database values \u2014 and must remain lowercase for the system to function correctly.",
    body_s))
story.append(Spacer(1, 4))
story.append(bullet("Display-facing text (labels, titles, descriptions) \u2014 all use \u201cHIPAA\u201d in caps"))
story.append(bullet("Internal code identifiers \u2014 remain lowercase by design"))

# --- #3: Auto-Create Appointment from Encounter Note ---
story += section_label("Update 3")
story.append(Paragraph("3.  Auto-Create Appointment from Encounter Notes", num_s))
story.append(Paragraph(
    "When a staff member creates an encounter note via the Standalone Encounter Modal on a patient page, "
    "the system now automatically creates a corresponding appointment if one doesn\u2019t already exist for that day.",
    body_s))
story.append(Spacer(1, 4))
story.append(Paragraph("How it works:", sub_s))
story.append(bullet("After saving the note, the system checks if the patient already has an appointment that day"))
story.append(bullet("If no appointment exists, one is automatically created with the following details:"))
story.append(Spacer(1, 2))

appt_rows = [
    ("Provider",     "Whoever created the note (Dr. Burgess, Evan, Lily, etc.)"),
    ("Service",      "The encounter service type selected in the note"),
    ("Status",       "Completed (since the visit already happened)"),
    ("Source",       "encounter_note (distinguishes auto-created visits)"),
    ("Time",         "The note\u2019s timestamp or current time"),
    ("Duration",     "30 minutes (default)"),
]
story.append(info_table(appt_rows, col1=1.4*inch))
story.append(Spacer(1, 6))
story.append(bullet("The note is linked back to the new appointment"))
story.append(bullet("An appointment event is logged for the audit trail"))
story.append(bullet("No availability checks or patient notifications are triggered (documenting a past visit)"))
story.append(bullet("If an appointment already exists that day (excluding cancelled/no-show), creation is skipped"))
story.append(bullet("Wrapped in error handling so it never blocks the note from saving"))

# --- #4: Internal & Clinical Notes Fix ---
story += section_label("Update 4")
story.append(Paragraph("4.  Internal &amp; Clinical Notes Fix", num_s))
story.append(Paragraph(
    "Two changes were made to prevent notes from being categorized incorrectly.",
    body_s))
story.append(Spacer(1, 4))
story.append(Paragraph("Data fix:", sub_s))
story.append(bullet("Brittany Smith\u2019s notes were corrected \u2014 the clinical note (assessment) is now in the Clinical section and the internal note (pickup log) is in the Internal section"))
story.append(Spacer(1, 4))
story.append(Paragraph("Workflow improvement:", sub_s))
story.append(bullet("The category toggle buttons have been removed from the Add Note modal"))
story.append(bullet("The category is now locked based on which section you click \u201cAdd Note\u201d from (Clinical or Internal)"))
story.append(bullet("A non-clickable indicator shows which type you\u2019re adding, preventing accidental switches"))

# --- #5: Deleting Rescheduled Appointments ---
story += section_label("Update 5")
story.append(Paragraph("5.  Deleting Rescheduled Appointments", num_s))
story.append(Paragraph(
    "Previously, deleting a rescheduled appointment would fail silently due to a database constraint.",
    body_s))
story.append(Spacer(1, 4))
story.append(Paragraph("Root cause:", sub_s))
story.append(bullet("When an appointment is rescheduled, the new appointment has a foreign key (<i>rescheduled_from</i>) pointing back to the original"))
story.append(bullet("Postgres blocked the delete because of that FK constraint, and the error was being swallowed silently"))
story.append(Spacer(1, 4))
story.append(Paragraph("Fix:", sub_s))
story.append(bullet("Before deleting, the system now clears any <i>rescheduled_from</i> references pointing to the appointment being deleted"))
story.append(bullet("Both delete handlers now show an alert if the delete fails, instead of failing silently"))

# --- #6: Clinical Note Deletion ---
story += section_label("Update 6")
story.append(Paragraph("6.  Clinical Note Deletion", num_s))
story.append(Paragraph(
    "Clinical notes can now be deleted. Access is restricted for safety:",
    body_s))
story.append(Spacer(1, 4))
story.append(bullet("The requesting user (whoever created the note) can delete it"))
story.append(bullet("Admin users can delete any clinical note"))
story.append(bullet("All other users cannot delete clinical notes they did not create"))

# Footer
build_footer(story)
doc.build(story)
print(f"PDF generated: {OUTPUT_PATH}")
