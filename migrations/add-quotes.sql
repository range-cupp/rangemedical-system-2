-- Quotes: shareable custom pricing pages
-- Range Medical

create table if not exists quotes (
  id uuid primary key default gen_random_uuid(),
  token text unique not null,
  patient_id uuid references patients(id) on delete set null,
  recipient_name text not null,
  recipient_email text,
  recipient_phone text,
  title text,
  intro_note text,
  items jsonb not null default '[]'::jsonb,
  -- each item: { name, description, price, qty }
  subtotal_cents integer not null default 0,
  discount_cents integer not null default 0,
  total_cents integer not null default 0,
  expires_at timestamptz,
  status text not null default 'draft', -- draft | sent | viewed | accepted | expired
  created_by text,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  first_viewed_at timestamptz,
  last_viewed_at timestamptz,
  view_count integer not null default 0
);

create index if not exists quotes_token_idx on quotes(token);
create index if not exists quotes_patient_idx on quotes(patient_id);
create index if not exists quotes_created_idx on quotes(created_at desc);
