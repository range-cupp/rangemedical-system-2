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
