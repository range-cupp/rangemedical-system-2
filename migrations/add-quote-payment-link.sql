-- Quote → payment link conversion
-- When a patient accepts a quote, we create a Stripe Checkout Session and
-- store the URL so we can share/resend it. For comparison quotes, record
-- which option (0, 1, 2) they accepted.
-- Range Medical

alter table quotes add column if not exists accepted_option_index integer;
alter table quotes add column if not exists stripe_session_id text;
alter table quotes add column if not exists stripe_session_url text;
alter table quotes add column if not exists payment_link_created_at timestamptz;
alter table quotes add column if not exists paid_at timestamptz;

-- status values: draft | sent | viewed | accepted | paid | expired
