-- ─────────────────────────────────────────────────────────────────────────────
--  GFG × Marvel — "The Multiverse Is Open" · database schema
--
--  Run once in Supabase → SQL Editor → New query → paste → Run.
--  Safe to re-run: every statement is idempotent and nothing is ever dropped.
--
--  Identity model
--    Users sign up / log in with email + password through Supabase Auth.
--    Supabase Auth owns the `auth.users` table and stores password *hashes*;
--    this schema never stores passwords. Every private row below has a
--    `user_id` that references auth.users(id), and Row Level Security compares
--    it with auth.uid() — the id inside the logged-in user's JWT.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 0. Safety guard ──────────────────────────────────────────────────────────
-- An earlier, unmerged version of this project used anonymous sign-ins and
-- created `public.registrations` + a `private` schema. If those exist, stop
-- instead of guessing: nothing is deleted automatically.
do $$
begin
  if to_regclass('public.registrations') is not null
     or exists (select 1 from pg_namespace where nspname = 'private') then
    raise exception 'Found objects from the earlier anonymous-auth version (public.registrations or schema "private"). Nothing was changed. Review/remove them manually, then re-run this script.';
  end if;
end
$$;

-- ── 1. Characters: public reference data ─────────────────────────────────────
-- Only id + name, so other tables can reference valid heroes with a foreign key.
-- Colours, artwork and copy stay in src/config/characters.ts (source of truth).
create table if not exists public.characters (
  id   text primary key check (id ~ '^[a-z][a-z0-9-]{1,31}$'),
  name text not null check (char_length(name) between 1 and 60)
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

-- ── 2. Favourites ────────────────────────────────────────────────────────────
-- DUPLICATE PREVENTION: the composite primary key (user_id, character_id)
-- means the same user can favourite the same hero only once. A second insert
-- fails with error 23505 (unique_violation) — enforced by the database, not React.
create table if not exists public.favorites (
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  character_id text not null references public.characters (id) on delete cascade,
  created_at   timestamptz not null default now(),
  constraint favorites_pkey primary key (user_id, character_id)
);
create index if not exists favorites_character_idx on public.favorites (character_id);

-- ── 3. User state: the hero world each user is currently in ──────────────────
-- One row per user (user_id is the primary key), updated on every selection.
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

-- ── 4. Interactions: append-only event history ───────────────────────────────
-- Duplicates ARE allowed (selecting Spider-Man 5 times = 5 events).
-- The CHECK constraint whitelists interaction types at the database level.
create table if not exists public.interactions (
  id               bigint generated always as identity primary key,
  user_id          uuid not null default auth.uid() references auth.users (id) on delete cascade,
  character_id     text not null references public.characters (id) on delete cascade,
  interaction_type text not null check (interaction_type in ('select', 'favorite', 'unfavorite')),
  created_at       timestamptz not null default now()
);
create index if not exists interactions_character_type_idx on public.interactions (character_id, interaction_type);
create index if not exists interactions_user_idx on public.interactions (user_id);

-- ── 5. Event registrations (separate from the login account) ─────────────────
-- ACCOUNT = email + password in Supabase Auth.
-- EVENT REGISTRATION = the form's details, stored here. No password column.
-- DUPLICATE PREVENTION: UNIQUE (user_id) → one registration per account.
create table if not exists public.event_registrations (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name         text not null check (char_length(btrim(name)) between 2 and 80),
  email        text not null check (char_length(email) <= 254 and email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]{2,}$'),
  phone        text not null check (phone ~ '^(\+?91)?[6-9][0-9]{9}$'),
  branch       text not null check (char_length(btrim(branch)) between 1 and 60),
  character_id text references public.characters (id) on delete set null,
  track        text check (track in ('The Engineer', 'The Agile Mind', 'The Strategist', 'The Tactician')),
  badge_id     text not null check (badge_id ~ '^[A-Z]{3,4}-616-[0-9]{4}$'),
  created_at   timestamptz not null default now(),
  constraint event_registrations_one_per_user unique (user_id)
);

-- ── 6. Privileges (least privilege) ──────────────────────────────────────────
-- Supabase grants broad table privileges by default; narrow them explicitly.
-- `anon` = logged-out visitors, `authenticated` = logged-in users.
revoke all on public.characters, public.favorites, public.user_state, public.interactions, public.event_registrations from anon, authenticated;

grant select                 on public.characters          to anon, authenticated;
grant select, insert, delete on public.favorites           to authenticated;
grant select, insert, update on public.user_state          to authenticated;
grant select, insert         on public.interactions        to authenticated;
grant select, insert         on public.event_registrations to authenticated;

-- ── 7. Row Level Security ────────────────────────────────────────────────────
-- With RLS enabled a table returns NO rows unless a policy allows it.
-- `(select auth.uid())` = id of the logged-in user from their JWT.
alter table public.characters          enable row level security;
alter table public.favorites           enable row level security;
alter table public.user_state          enable row level security;
alter table public.interactions        enable row level security;
alter table public.event_registrations enable row level security;

-- characters: public reference data, readable by everyone, writable by no one.
drop policy if exists "characters: anyone can read" on public.characters;
create policy "characters: anyone can read" on public.characters
  for select to anon, authenticated using (true);

-- favorites: a user can only see, add and remove their own rows.
drop policy if exists "favorites: read own" on public.favorites;
create policy "favorites: read own" on public.favorites
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "favorites: add own" on public.favorites;
create policy "favorites: add own" on public.favorites
  for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists "favorites: remove own" on public.favorites;
create policy "favorites: remove own" on public.favorites
  for delete to authenticated using (user_id = (select auth.uid()));

-- user_state: read, create and update only your own row.
drop policy if exists "user_state: read own" on public.user_state;
create policy "user_state: read own" on public.user_state
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "user_state: create own" on public.user_state;
create policy "user_state: create own" on public.user_state
  for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists "user_state: update own" on public.user_state;
create policy "user_state: update own" on public.user_state
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- interactions: add and read your own; no update/delete policy → history is immutable.
drop policy if exists "interactions: read own" on public.interactions;
create policy "interactions: read own" on public.interactions
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "interactions: add own" on public.interactions;
create policy "interactions: add own" on public.interactions
  for insert to authenticated with check (user_id = (select auth.uid()));

-- event_registrations: create and read only your own registration.
drop policy if exists "event_registrations: read own" on public.event_registrations;
create policy "event_registrations: read own" on public.event_registrations
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "event_registrations: create own" on public.event_registrations;
create policy "event_registrations: create own" on public.event_registrations
  for insert to authenticated with check (user_id = (select auth.uid()));

-- ── 8. Safe aggregate statistics ─────────────────────────────────────────────
-- SECURITY DEFINER runs with the owner's rights so it can COUNT everyone's rows,
-- but the query is fixed and returns only numbers per hero — never user ids,
-- emails or registration details. search_path is pinned so it can't be hijacked.
create or replace function public.character_stats()
returns table (character_id text, selections bigint, favorites bigint, my_selections bigint)
language sql stable security definer set search_path = '' as $$
  select
    c.id,
    (select count(*) from public.interactions i where i.character_id = c.id and i.interaction_type = 'select'),
    (select count(*) from public.favorites f where f.character_id = c.id),
    -- auth.uid() is null for logged-out visitors, so this is 0 for them
    (select count(*) from public.interactions i
       where i.character_id = c.id and i.interaction_type = 'select' and i.user_id = auth.uid())
  from public.characters c
  order by c.id;
$$;

revoke execute on function public.character_stats() from public;
grant execute on function public.character_stats() to anon, authenticated;
