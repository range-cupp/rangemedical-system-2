# Range Medical System

Internal clinic management system for Range Medical (regenerative medicine clinic).

## Tech Stack

- **Framework:** Next.js 14 (Pages Router)
- **Database:** Supabase (PostgreSQL)
- **Hosting:** Vercel
- **Styling:** Inline styles + `styles/globals.css` (no CSS modules, no Tailwind)
- **Icons:** lucide-react
- **Charts:** recharts
- **Email:** Resend
- **CRM Integration:** GoHighLevel (GHL) API
- **Language:** JavaScript (JSX), no TypeScript

## Commands

```bash
npm run dev    # Start dev server
npm run build  # Production build
npm run lint   # ESLint
```

## Project Structure

```
pages/                  # Next.js pages (Pages Router)
  admin/                # Admin dashboard, protocols, purchases, patients
    patient/[id].js     # Individual patient detail page
    protocols/          # Protocol management
    purchases/          # Purchase tracking
    service-log.js      # Service log (single source of truth for sessions)
    command-center.js   # Command center dashboard
  api/                  # API routes
    cron/               # Vercel cron jobs (link-forms, complete-protocols, reminders)
    webhooks/           # GHL webhook handlers
    protocol/           # Protocol CRUD
    service-log/        # Service log API
    labs/               # Lab management
    patient/            # Patient API
  consent/              # Patient consent forms (public-facing)
  portal/               # Patient portal
  onboard/              # Patient onboarding
  dashboard/            # Dashboard views
  *.jsx                 # Public service pages (iv-therapy, weight-loss, etc.)
components/
  AdminLayout.js        # Shared admin layout with nav + sharedStyles export
  ServiceLogContent.js  # Service log component
  RangeMedicalSystem.js # Legacy command center component
lib/
  supabase.js           # Supabase client (uses NEXT_PUBLIC_SUPABASE_URL)
  protocol-config.js    # Single source of truth for all protocol/medication options
  ghl-sync.js           # GoHighLevel CRM sync utility
  protocol-tracking.js  # Protocol tracking helpers
data/
  servicePageData.js    # Service page content
  researchStudies.js    # Research study data
sql/                    # SQL table definitions
migrations/             # SQL migration scripts
scripts/                # One-off utility scripts
```

## Key Conventions

### Styling
- Admin pages use **inline styles** via JavaScript objects — not CSS classes
- Shared styles are exported from `components/AdminLayout.js` as `sharedStyles`
- Use the `sharedStyles` object for cards, tables, buttons, modals, badges, forms, etc.
- Public-facing pages use CSS classes from `styles/globals.css`

### Data / Config
- `lib/protocol-config.js` is the **single source of truth** for all medication options, dosages, durations, categories, and colors — always import from here, never hardcode
- Protocol categories: `hrt`, `weight_loss`, `peptide`, `iv`, `hbot`, `rlt`, `injection`
- Category colors/styles: use `CATEGORY_COLORS` and `getCategoryStyle()` from protocol-config

### Database
- Supabase client is initialized in `lib/supabase.js` (client-side with anon key)
- API routes that need elevated access use `SUPABASE_SERVICE_ROLE_KEY` (server-side only)
- Main tables: `patients`, `protocols`, `labs`, `symptoms`, `service_logs`, `consent_forms`, `purchases`
- Patient IDs are UUIDs; patients also have `ghl_contact_id` for CRM linking

### API Routes
- Server-side Supabase calls use `createClient` with service role key directly in the route
- GHL integration uses API key from `process.env.GHL_API_KEY`
- Cron jobs are configured in `vercel.json` and run via `/api/cron/*`
- Webhooks receive data from GHL at `/api/webhooks/*`

### Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (server-side only)
- `GHL_API_KEY` — GoHighLevel API key
- `GHL_LOCATION_ID` — GoHighLevel location ID
- `RESEND_API_KEY` — Resend email API key
- `CRON_SECRET` — Secret for cron job auth

### Component Patterns
- Admin pages wrap content in `<AdminLayout title="Page Title">`
- Modals use `sharedStyles.modalOverlay`, `sharedStyles.modal`, etc.
- State management is local (useState/useEffect) — no global state library
- Data fetching happens in `useEffect` with Supabase client calls

### Service Log
- The Service Log is the **single source of truth** for all session tracking (IV, HBOT, RLT, injections, peptide pickups, weight loss pickups, HRT pickups)
- Do not add session counting to GHL webhooks or other systems

### Protocol PDF Visual Style — NON-NEGOTIABLE
- **Section headers:** Small-caps gray label (8pt, letter-spacing) + 0.75pt rule. NEVER use solid black/filled bars for section headers.
- **Clinic name in header:** 13pt bold, left-aligned. Never large display size.
- **Contact info:** 8pt right-aligned, same header row as clinic name.
- **Body leading:** 16pt minimum. Never compress body text.
- **Checkmarks:** Use unicode ✓ (U+2713) in green #2E6B35. Never literal text like "[check]".
- **Dashes:** Use proper em dash — (U+2014) and en dash – (U+2013). Never `--`.
- **Bullets:** Use en dash – (U+2013) + two spaces. Never asterisks or hyphens.
- **Every compound section must include:** What It Is, Administration, Expected Benefits (bulleted), Timeline table, Side Effects (bulleted). Never omit these sections.

### PDF Generation — Required Base Template

Do NOT write ReportLab styling from scratch. Always start from this base template and populate it with patient/protocol data. The visual output must match this exactly.

```python
# --- BASE TEMPLATE (copy verbatim, then fill in patient data) ---
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
    story.append(HRFlowable(width="100%", thickness=0.5, color=RULE_GRAY, spaceAfter=8))
    tbl = Table([[
        Paragraph("<b>Questions or concerns?</b><br/>Call or text: (949) 997-3988<br/>range-medical.com", foot_bold_s),
        Paragraph(
            "This document is intended for Range Medical patients only and is not a substitute "
            "for personalized medical advice. Do not adjust your dose without consulting your provider.",
            foot_s),
    ]], colWidths=[2.2*inch, 4.8*inch])
    tbl.setStyle(TableStyle([
        ('VALIGN',(0,0),(-1,-1),'TOP'),
        ('TOPPADDING',(0,0),(-1,-1),0),('BOTTOMPADDING',(0,0),(-1,-1),0),
        ('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),0),
    ]))
    story.append(tbl)

# ── POPULATE BELOW — do not change anything above this line ──────────────────
doc = SimpleDocTemplate(
    OUTPUT_PATH,   # replace with actual output path
    pagesize=letter,
    rightMargin=0.75*inch, leftMargin=0.75*inch,
    topMargin=0.65*inch,   bottomMargin=0.65*inch,
)
story = []
build_header(story)

# Title
story.append(Paragraph("DOCUMENT TITLE HERE", title_s))
story.append(Paragraph("Subtitle here", subtitle_s))
story.append(Spacer(1, 14))

# Patient info
story += section_label("Patient Information")
story.append(info_table([
    ("Patient Name",         PATIENT_NAME),
    ("Plan Issued",          ISSUE_DATE),
    ("Prescribing Provider", "Dr. Burgess, Range Medical"),
    ("Protocol Type",        PROTOCOL_TYPE),
]))

# ... add sections here using section_label(), info_table(), bullet() ...
build_footer(story)
doc.build(story)
# --- END BASE TEMPLATE ---
```

**RULES:**
- Never use solid filled color bars for section headers
- Never set clinic name font size above 13pt
- Never use literal text like "[check]" — use \u2713 for checkmarks
- Never use "--" — use \u2014 (em dash) or \u2013 (en dash)
- Body text leading is always 16. Never compress it.
- All table colWidths must be explicitly set
- Section headers are always: small gray all-caps label + 0.75pt rule
- Checklist items in schedule tables use check_s style in GREEN
- Rest days use rest_s style in MID_GRAY

### Assessment Flow
- Assessment is FREE — no pricing on the assessment itself
- Lab panel pricing (Essential $350, Elite $750) stays on energy results screen
- Flow: Door selector → Contact info → 5 questions → Results → Medical Intake → Confirmation
- Injury path intake = full (medical history, meds, allergies, surgical, emergency contact)
- Energy path intake = light (meds, allergies, conditions, emergency contact)
- Initial submit (`/api/assessment/submit`) = creates GHL contact + sends SMS alert
- Completion submit (`/api/assessment/complete`) = saves intake + generates PDF + sends consolidated email
- One consolidated email per completed assessment (not separate emails per step)
