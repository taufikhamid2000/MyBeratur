-- =====================================================
-- MyBeratur — user profiles for auth
-- =====================================================
-- Lives in the shared `master_db` Supabase project alongside the
-- portfolio's own tables — namespaced by table name only, no shared
-- foreign keys with portfolio tables.
--
-- Table prefix note: the app's existing (pre-auth) scaffolding in
-- src/lib/supabaseApi.ts already references `nogipin_branches` and
-- `nogipin_queues` — an older project name for this app that the
-- Supabase-side table prefix never got renamed away from. This
-- migration follows that existing convention (`nogipin_`) rather than
-- introducing a second, inconsistent `myberatur_` prefix.
--
-- Field names match the app's existing data model exactly so the
-- queue-eligibility/category-selection code (src/data/userCategories.ts,
-- src/data/branches.ts) can read a user's profile without any changes:
--   - state_id: same integer id + meaning as Branch.state_id
--     (src/data/branches.ts) and State.id (src/data/states.ts).
--   - date_of_birth: raw date, so any future age-based priority check
--     (e.g. warga emas / senior-citizen auto-priority for the "Khas"
--     category in src/data/userCategories.ts) computes age itself
--     rather than trusting a client-submitted age number.
-- =====================================================

create table if not exists public.nogipin_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  date_of_birth date,
  state_id integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists nogipin_profiles_state_id_idx on public.nogipin_profiles (state_id);

-- ---------- updated_at trigger ----------
-- Reuses the shared public.set_updated_at() function already defined
-- for other apps in this Supabase project (see e.g. duitduit's
-- 20260709000000_create_duitduit_schema.sql). Defined defensively here
-- too, in case this project is ever pointed at a fresh database.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_nogipin_profiles_updated_at on public.nogipin_profiles;
create trigger set_nogipin_profiles_updated_at
  before update on public.nogipin_profiles
  for each row execute function public.set_updated_at();

-- ---------- RLS: strictly own-row only ----------
alter table public.nogipin_profiles enable row level security;

drop policy if exists "Users manage their own profile" on public.nogipin_profiles;
create policy "Users manage their own profile" on public.nogipin_profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);
