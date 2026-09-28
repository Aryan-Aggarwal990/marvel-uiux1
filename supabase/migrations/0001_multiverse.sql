-- ─────────────────────────────────────────────────────────────────────────────
--  GFG × Marvel — "The Multiverse Is Open" backend schema
--  Run once in Supabase → SQL Editor (safe to re-run: it is idempotent).
--
--  Identity: every visitor gets a Supabase *anonymous* user (no login UI), so
--  auth.uid() identifies their browser and Row Level Security can scope rows.
--  Requires: Authentication → Sign In / Providers → "Allow anonymous sign-ins".
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Characters (reference data) ───────────────────────────────────────────
-- Only id + name live here so other tables can reference valid heroes. All
-- visual data (colours, art, copy) stays in src/config/characters.ts.
create table if not exists public.characters (
  id         text primary key check (id ~ '^[a-z][a-z0-9-]{1,31}$'),
  name       text not null check (char_length(name) between 1 and 60),
  created_at timestamptz not null default now()
);

insert into public.characters (id, name) values
  ('spiderman', 'Spider-Man'),
  ('ironman',   'Iron Man'),
  ('strange',   'Doctor Strange'),
  ('panther',   'Black Panther'),
  ('thor',      'Thor'),
  ('hulk',      'Hulk'),
  ('cap',       'Captain America'),
  ('marvel',    'Captain Marvel'),
  ('wanda',     'Scarlet Witch'),
  ('loki',      'Loki'),
  ('miles',     'Miles Morales'),
  ('deadpool',  'Deadpool')
on conflict (id) do update set name = excluded.name;

-- ── 2. Favourites (one row per user × hero) ──────────────────────────────────
create table if not exists public.favorites (
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  character_id text not null references public.characters (id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (user_id, character_id)
);
create index if not exists favorites_character_idx on public.favorites (character_id);

-- ── 3. User state (the world the user is currently in) ───────────────────────
create table if not exists public.user_state (
  user_id             uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  active_character_id text references public.characters (id) on delete set null,
  updated_at          timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists user_state_touch on public.user_state;
create trigger user_state_touch before insert or update on public.user_state
  for each row execute function public.touch_updated_at();

-- ── 4. Interactions (anonymous event log) ────────────────────────────────────
create table if not exists public.interactions (
  id               bigint generated always as identity primary key,
  user_id          uuid not null default auth.uid() references auth.users (id) on delete cascade,
  character_id     text not null references public.characters (id) on delete cascade,
  interaction_type text not null check (interaction_type in ('select', 'favorite', 'unfavorite')),
  created_at       timestamptz not null default now()
);
create index if not exists interactions_character_type_idx on public.interactions (character_id, interaction_type);
create index if not exists interactions_user_time_idx on public.interactions (user_id, created_at desc);

-- ── 5. Registrations (the event sign-up form) ────────────────────────────────
create table if not exists public.registrations (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid default auth.uid() references auth.users (id) on delete set null,
  name         text not null check (char_length(btrim(name)) between 2 and 80),
  email        text not null check (char_length(email) <= 254 and email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]{2,}$'),
  phone        text not null check (phone ~ '^(\+?91)?[6-9][0-9]{9}$'),
  branch       text not null check (char_length(btrim(branch)) between 1 and 60),
  character_id text references public.characters (id) on delete set null,
  track        text check (track in ('The Engineer', 'The Agile Mind', 'The Strategist', 'The Tactician')),
  badge_id     text not null check (badge_id ~ '^[A-Z]{3,4}-616-[0-9]{4}$'),
  created_at   timestamptz not null default now()
);
create index if not exists registrations_user_idx on public.registrations (user_id);
create index if not exists registrations_email_idx on public.registrations (lower(email));

-- ── 6. Privileges: least privilege, column-level where it matters ────────────
-- Clients may only send the listed columns; user_id / ids / timestamps always
-- come from defaults, so they cannot be forged.
revoke all on public.characters, public.favorites, public.user_state, public.interactions, public.registrations from anon, authenticated;

grant select on public.characters to anon, authenticated;

grant select, delete on public.favorites to authenticated;
grant insert (character_id) on public.favorites to authenticated;

grant select on public.user_state to authenticated;
grant insert (active_character_id), update (active_character_id) on public.user_state to authenticated;

grant select on public.interactions to authenticated;
grant insert (character_id, interaction_type) on public.interactions to authenticated;

grant select on public.registrations to authenticated;
grant insert (name, email, phone, branch, character_id, track, badge_id) on public.registrations to authenticated;

-- ── 7. Throttle helpers ──────────────────────────────────────────────────────
-- Policies can't count rows of their own table (Postgres reports recursion), so
-- the counts run in SECURITY DEFINER helpers. They live in a `private` schema,
-- which the Supabase Data API does not expose, and only ever count the caller's
-- own rows.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create or replace function private.recent_interaction_count()
returns bigint language sql stable security definer set search_path = '' as $$
  select count(*) from public.interactions
  where user_id = auth.uid() and created_at > now() - interval '1 minute';
$$;

create or replace function private.registration_count()
returns bigint language sql stable security definer set search_path = '' as $$
  select count(*) from public.registrations where user_id = auth.uid();
$$;

revoke execute on function private.recent_interaction_count(), private.registration_count() from public;
grant execute on function private.recent_interaction_count(), private.registration_count() to authenticated;

-- ── 8. Row Level Security ────────────────────────────────────────────────────
alter table public.characters    enable row level security;
alter table public.favorites     enable row level security;
alter table public.user_state    enable row level security;
alter table public.interactions  enable row level security;
alter table public.registrations enable row level security;

drop policy if exists "characters are public" on public.characters;
create policy "characters are public" on public.characters
  for select to anon, authenticated using (true);

drop policy if exists "read own favorites" on public.favorites;
create policy "read own favorites" on public.favorites
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "add own favorites" on public.favorites;
create policy "add own favorites" on public.favorites
  for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists "remove own favorites" on public.favorites;
create policy "remove own favorites" on public.favorites
  for delete to authenticated using (user_id = (select auth.uid()));

drop policy if exists "read own state" on public.user_state;
create policy "read own state" on public.user_state
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "create own state" on public.user_state;
create policy "create own state" on public.user_state
  for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists "update own state" on public.user_state;
create policy "update own state" on public.user_state
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Interactions: append-only, own rows, max 30 events per user per minute.
drop policy if exists "read own interactions" on public.interactions;
create policy "read own interactions" on public.interactions
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "log own interactions" on public.interactions;
create policy "log own interactions" on public.interactions
  for insert to authenticated with check (
    user_id = (select auth.uid()) and (select private.recent_interaction_count()) < 30
  );

-- Registrations: insert + read own only (organisers read all via the dashboard),
-- max 5 registrations per anonymous user.
drop policy if exists "read own registrations" on public.registrations;
create policy "read own registrations" on public.registrations
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "create own registration" on public.registrations;
create policy "create own registration" on public.registrations
  for insert to authenticated with check (
    user_id = (select auth.uid()) and (select private.registration_count()) < 5
  );

-- ── 9. Aggregate stats (counts only — never exposes other users' rows) ───────
create or replace function public.character_stats()
returns table (character_id text, selections bigint, favorites bigint, my_selections bigint)
language sql stable security definer set search_path = '' as $$
  select
    c.id,
    (select count(*) from public.interactions i where i.character_id = c.id and i.interaction_type = 'select'),
    (select count(*) from public.favorites f where f.character_id = c.id),
    (select count(*) from public.interactions i
       where i.character_id = c.id and i.interaction_type = 'select' and i.user_id = auth.uid())
  from public.characters c
  order by c.id;
$$;

revoke execute on function public.character_stats() from public;
grant execute on function public.character_stats() to anon, authenticated;
