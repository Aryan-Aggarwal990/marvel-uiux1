# Backend guide: GFG × Marvel "The Multiverse Is Open"

This document explains the backend in beginner-friendly technical language: what each piece does,
why it exists, and **where in the code it lives**. For interview practice, see
[`INTERVIEW_PREP.md`](INTERVIEW_PREP.md).

---

## 1. Project architecture

The project is a **React 19 + TypeScript** single-page app built with **Vite 8** and deployed on
**Vercel**. The backend is **Supabase**, a hosted platform that provides:

| Supabase piece | What it is | What we use it for |
|---|---|---|
| **Supabase Auth** (GoTrue) | A ready-made authentication server | Sign up / log in / log out with email + password; issues JWTs |
| **PostgreSQL** | A relational database | Favourites, current hero world, interaction history, event registrations |
| **PostgREST** (the "Data API") | Turns database tables into a REST API automatically | The browser reads/writes tables over HTTPS |
| **Row Level Security (RLS)** | PostgreSQL feature: per-row permission rules | Each user can only touch their own rows |

There is **no custom Node/Express server**. The browser talks to Supabase directly with the
`@supabase/supabase-js` library, and security is enforced **inside the database** (RLS, constraints,
permissions). The browser is never trusted.

The backend is an **enhancement**. With no Supabase configured, the Marvel site works exactly as
before.

### Code map

```
src/
├─ lib/supabase.ts                 Creates the Supabase client (only if env vars exist; lazy-loaded)
├─ auth/
│  ├─ validation.ts                Email/password rules + friendly auth error messages
│  ├─ authContext.ts               Types + useAuth() hook
│  └─ AuthProvider.tsx             Session state: signUp / logIn / logOut / onAuthStateChange
├─ data/
│  ├─ api.ts                       One small function per database call (the "data access layer")
│  ├─ errors.ts                    PostgreSQL error codes → friendly messages (23505, 23514, …)
│  ├─ localStore.ts                Guest (logged-out) favourites + counts in localStorage
│  ├─ multiverseContext.ts         Types + useMultiverse() hook
│  └─ MultiverseDataProvider.tsx   Favourites, interactions, user state, stats, registration
├─ components/
│  ├─ AuthPanel.tsx                Log in · Sign up · Account dialog
│  ├─ Notice.tsx                   Small HUD message for backend errors
│  ├─ Navbar.tsx                   "LOG IN" / "AGENT // name" chip
│  ├─ HeroSelector.tsx             ♥ favourite toggle + stats line (existing UI)
│  └─ Registration.tsx             Existing event form, now saved to PostgreSQL
└─ main.tsx                        Provider order (below)
supabase/migrations/0001_multiverse.sql   The whole database: tables, constraints, RLS, stats function
```

**Provider order** in `src/main.tsx` (React context, each layer can use the ones above it):

```
<HeroThemeProvider>          existing: active hero + world theme (unchanged)
  <AuthProvider>             who is logged in
    <MultiverseDataProvider> the user's data (needs the hero + the user)
      <App />
```

**Separation of concerns:** authentication (`src/auth`) · database access (`src/data/api.ts`) ·
React state (`*Provider.tsx`) · UI (`src/components`).

---

## 2. Frontend → Supabase → PostgreSQL flow

Example: a logged-in user presses ♥ on Spider-Man.

```
HeroSelector (♥ click)
  → useMultiverse().toggleFavorite('spiderman')          React state (optimistic: heart turns on now)
    → api.insertFavorite(sb, 'spiderman')                data access layer
      → supabase-js: POST https://<project>.supabase.co/rest/v1/favorites
           headers: apikey = anon key, Authorization = Bearer <user's JWT>
           body:    { "character_id": "spiderman" }
        → Supabase API (PostgREST) verifies the JWT, runs the INSERT as role "authenticated"
          → PostgreSQL:
              user_id defaults to auth.uid()             (the id inside the JWT)
              RLS policy: user_id = auth.uid() ✔
              primary key (user_id, character_id): no duplicate ✔
              foreign key: 'spiderman' exists in characters ✔
        ← 201 Created   (or an error code: 23505 duplicate, 42501 not allowed, …)
    ← success: keep the heart on + log a 'favorite' interaction
      failure: roll the heart back + show a Notice
```

Notice what the browser **doesn't** send: `user_id`. The database takes it from the verified
token, so a user can't pretend to be someone else.

---

## 3. Authentication flow

Implemented in `src/auth/AuthProvider.tsx`; UI in `src/components/AuthPanel.tsx`.

| Action | Code | What happens |
|---|---|---|
| **Sign up** | `supabase.auth.signUp({ email, password })` | Supabase Auth creates a row in its own `auth.users` table and stores a **bcrypt hash** of the password. With "Confirm email" off, it returns a session immediately. |
| **Log in** | `supabase.auth.signInWithPassword(...)` | Supabase checks the password against the hash and returns a **session**: a short-lived **JWT access token** (≈1 h) plus a **refresh token**. |
| **Stay logged in** | handled by supabase-js | The session is saved in `localStorage` and refreshed automatically before it expires. On page load, `getSession()` restores it, so a refresh keeps you logged in. |
| **Know who's logged in** | `onAuthStateChange` | Supabase calls this on sign-in, sign-out and token refresh. We copy only `{ id, email }` into React state; tokens never enter React state. |
| **Log out** | `supabase.auth.signOut()` | Revokes the refresh token on the server and clears the session. If the server is unreachable we still sign out locally. |

**Validation** (`src/auth/validation.ts`): email format, password 8–72 characters with a letter and
a number, confirm-password match. This is only for instant feedback; Supabase validates again on the
server.

**We never handle password storage.** The password goes over HTTPS straight to Supabase Auth, is
hashed with bcrypt, and never touches our tables. You can check: there is no password column
anywhere in `public`.

**Account vs. event registration**: two different things.
- **ACCOUNT** = email + password in Supabase Auth (`auth.users`). Used to log in.
- **EVENT REGISTRATION** = name, contact email, phone, branch, hero and track in
  `public.event_registrations`. It's linked to the account only through `user_id`. Its email is a
  *contact* email and can differ from the login email.

---

## 4. Database schema

All defined in `supabase/migrations/0001_multiverse.sql`.

### `characters` (public reference data)
| column | type | notes |
|---|---|---|
| `id` | text, **PK** | `'spiderman'`, `'ironman'`, … (same ids as `src/config/characters.ts`) |
| `name` | text | display name |

Only id + name. Colours, art and copy stay in `src/config/characters.ts`, the single source of truth
for visuals. This table exists so other tables can use a **foreign key**: the database refuses
unknown heroes.

### `favorites`
| column | type | notes |
|---|---|---|
| `user_id` | uuid → `auth.users(id)` | default `auth.uid()`; cascade delete |
| `character_id` | text → `characters(id)` | |
| `created_at` | timestamptz | default `now()` |
| **PK** | `(user_id, character_id)` | **one favourite per user per hero** |

### `user_state`
| column | type | notes |
|---|---|---|
| `user_id` | uuid **PK** → `auth.users(id)` | one row per user |
| `active_character_id` | text → `characters(id)` | the hero world the user is in |
| `updated_at` | timestamptz | set by a trigger on every insert/update |

### `interactions` (append-only history)
| column | type | notes |
|---|---|---|
| `id` | bigint identity **PK** | |
| `user_id` | uuid → `auth.users(id)` | default `auth.uid()` |
| `character_id` | text → `characters(id)` | |
| `interaction_type` | text | **CHECK in (`select`, `favorite`, `unfavorite`)** |
| `created_at` | timestamptz | default `now()` |

### `event_registrations`
| column | type | notes |
|---|---|---|
| `id` | uuid **PK** | `gen_random_uuid()` |
| `user_id` | uuid → `auth.users(id)` | **UNIQUE**: one registration per account |
| `name` | text | CHECK 2–80 characters |
| `email` | text | CHECK email format, ≤ 254 characters (contact email, *not* the login) |
| `phone` | text | CHECK Indian mobile format `^(\+?91)?[6-9][0-9]{9}$` |
| `branch` | text | CHECK 1–60 characters |
| `character_id` | text → `characters(id)` | chosen hero (optional) |
| `track` | text | CHECK one of the four challenge tracks (optional) |
| `badge_id` | text | CHECK format like `SPID-616-1234` |
| `created_at` | timestamptz | |

**No password column.** Passwords belong to Supabase Auth only.

### `character_stats()` (read-only function)
Returns one row per hero: `character_id, selections, favorites, my_selections`, which are **counts
only**.

---

## 5. Relationships

```
auth.users (Supabase Auth)            public.characters
   │ id                                  │ id
   │                                     │
   ├──< favorites >──────────────────────┤      many-to-many (user ↔ hero), PK (user_id, character_id)
   ├──< interactions >───────────────────┤      one user → many events about many heroes
   ├──── user_state (1 : 1) ─────────────┤      active_character_id → characters
   └──── event_registrations (1 : 1) ────┘      UNIQUE (user_id); character_id → characters
```

- `ON DELETE CASCADE` from `auth.users`: deleting an account deletes that user's data.
- `ON DELETE SET NULL` for hero references in `user_state` / `event_registrations`: removing a hero
  wouldn't delete registrations.

---

## 6. Row Level Security (RLS)

**What it is:** RLS makes PostgreSQL check a rule for **every row** a query touches. With RLS
enabled, a table returns **nothing** unless a *policy* allows it. Supabase exposes the database to
the browser, so RLS is what actually protects the data.

**Where:** section 7 of `0001_multiverse.sql`.

**Key idea:** `auth.uid()` returns the user id from the verified JWT of the request. Policies
compare it with the row's `user_id`. (`(select auth.uid())` is the same thing; the sub-select lets
PostgreSQL compute it once per query instead of once per row.)

Two kinds of clause:
- **`USING (…)`**: which *existing* rows you can see / update / delete.
- **`WITH CHECK (…)`**: whether a *new or changed* row is allowed.

| Table | Policy | Plain English |
|---|---|---|
| `characters` | `select … to anon, authenticated using (true)` | Anyone can read hero ids/names; nobody can write (no write policy). |
| `favorites` | `select … using (user_id = auth.uid())` | You only see your own favourites. |
| | `insert … with check (user_id = auth.uid())` | You can only add favourites for yourself. Forging someone else's `user_id` fails with `42501`. |
| | `delete … using (user_id = auth.uid())` | You can only remove your own. Deleting someone else's affects 0 rows. |
| `user_state` | select / insert / update, all `user_id = auth.uid()` | Read, create and update only your own row. |
| `interactions` | select + insert, `user_id = auth.uid()` | Add and read your own events. **No update/delete policy**, so history can't be edited. |
| `event_registrations` | select + insert, `user_id = auth.uid()` | Create and read only your own registration. Nobody can read anyone else's name/phone/email. |

**Roles:** `anon` = logged-out visitor (request carries only the public key); `authenticated` =
logged-in user (request carries a user JWT). Section 6 of the SQL grants the minimum privileges:
`anon` can read `characters` and call `character_stats()`, and nothing else.

**Statistics without leaking data:** `character_stats()` is `SECURITY DEFINER`. It runs with its
owner's rights, so it can count *everyone's* rows even though RLS would hide them from the caller.
That's safe because the function's query is fixed and returns **only numbers per hero**. No user
ids, emails or registration details can come out of it. `set search_path = ''` stops anyone
hijacking it with look-alike objects.

---

## 7. Duplicate prevention

Enforced **by the database**, so it holds even with two tabs open, a slow network, or a hand-crafted
request. React checks are only for nice UX.

| Rule | Database mechanism | Error when broken | What the UI does |
|---|---|---|---|
| A user can favourite a hero once | `PRIMARY KEY (user_id, character_id)` on `favorites` | `23505 unique_violation` | Treats it as "already saved": the heart stays on, no error (`toggleFavorite` in `MultiverseDataProvider.tsx`) |
| A user can register once | `UNIQUE (user_id)` on `event_registrations` | `23505` on `event_registrations_one_per_user` | Loads the existing registration and shows it as "Already registered // this account" |
| Selections can repeat | *no* unique constraint on `interactions` | — | Selecting Spider-Man 5× = 5 rows (each is a separate event) |
| Unknown heroes | `FOREIGN KEY` → `characters(id)` | `23503` | "unknown hero" |
| Arbitrary interaction types | `CHECK (interaction_type in (…))` | `23514` | rejected |

**Why at the database level?** The frontend can be bypassed: anyone can call the API directly with
their token. And two requests can race. Only the database sees every write, in order, so only it
can guarantee "exactly one".

---

## 8. Interaction tracking

Where: the "Every hero selection" effect in `src/data/MultiverseDataProvider.tsx`.

- The site's existing `select()` function (`src/theme/HeroThemeProvider.tsx`) is unchanged.
  Selection can happen in 5 places (lineup, hero orbit, footer, registration picker, reset).
- The data provider **watches the active hero**. When it changes and a user is logged in:
  1. `INSERT` into `interactions` (`select`),
  2. `UPSERT` into `user_state` (insert the first time, update after that).
- Favouriting also logs `favorite` / `unfavorite`.
- **Not logged:** the hero restored when the page loads, and the hero world restored from
  `user_state` after login. Those aren't user actions.
- Logged out: selections are counted in `localStorage` only (shown as "You // n×").
- Statistics: `character_stats()` is called after writes (debounced) and shown in the lineup:
  `You // 2× · World // 42 picks · ♥ 18`.

---

## 9. Registration flow

Where: `src/components/Registration.tsx` (UI unchanged) + `saveRegistration` in the data provider.

1. **Validate in the browser**: name, email, phone (Indian mobile) and branch. Errors appear under
   each field.
2. **Require an account**: if logged out, the login dialog opens with "Log in or create an agent
   account to lock in your registration". Typed details stay in the form.
3. **Normalise**: trim the name, lower-case the email, strip spaces from the phone, to match the
   database `CHECK`s.
4. **Insert** into `event_registrations` while the "ACCESS REQUESTED" animation plays.
   `Promise.allSettled` lets the animation finish before the outcome is shown.
5. **Result**:
   - success → "WELCOME, HERO." confirmation, read back from PostgreSQL;
   - `23505` → "Already registered // this account" with the existing details;
   - `23514` → "details rejected by the server" (the database's own validation);
   - network → "signal lost — check your connection", with the form kept.
6. When logged in, the confirmation is **always read from PostgreSQL**, so it survives refreshes
   and disappears on logout.

With no backend configured, the form stays simulated, as before.

---

## 10. Environment variables

| Variable | Where | Secret? |
|---|---|---|
| `VITE_SUPABASE_URL` | `.env.local` (local), Vercel settings (deployed) | No, it's public |
| `VITE_SUPABASE_ANON_KEY` | same | No, it's public by design |
| `SUPABASE_SERVICE_ROLE_KEY` | **never in this project** | **Yes**, it bypasses RLS |

- Vite exposes **only** variables that start with `VITE_` to browser code (`import.meta.env`),
  and bakes them into the JavaScript **at build time**. Anyone can read them in DevTools.
- **Why the anon key is OK in the browser:** it only identifies the project and gives the `anon`
  role. Everything it can do is limited by RLS and the grants above. It's designed to be public.
- **Why the service-role key must never be exposed:** it has the `service_role` role, which
  **bypasses RLS**. Anyone holding it could read every registration and delete every table. Never
  put it in the frontend, never prefix it with `VITE_`, never commit it.
- `.gitignore` ignores `.env` and `.env.*` (except `.env.example`), so real values can't be committed.
- `.env.example` shows the variable names with placeholder values.

---

## 11. Error handling

**Principle:** the backend is an enhancement. The Marvel UI never waits for Supabase and never shows
a blank screen.

| Situation | Behaviour | Where |
|---|---|---|
| No env vars | Backend code is removed at build time. Login chip hidden, hearts use localStorage, registration simulated. | `backendConfigured` in `src/lib/supabase.ts` |
| Supabase slow | Every call has a timeout (8–10 s) via `withTimeout()`. | `src/lib/supabase.ts` |
| Supabase unreachable, logged out | Site renders; login shows "Signal lost…"; hearts stay local. | `describeAuthError`, `AuthProvider.tsx` |
| Database unreachable while logged in | Notice: "Couldn't load your saved data… Changes stay on this device"; favourites fall back to localStorage and merge on the next successful login. | provider `status === 'offline'` |
| Auth errors | Wrong password, existing account, weak password, rate limit, unconfirmed email → friendly text. | `src/auth/validation.ts` |
| Database errors | `23505` duplicate, `23514` invalid, `23503` unknown hero, `42501` not allowed → friendly text. | `src/data/errors.ts` |
| Favourite fails | Optimistic update rolled back + Notice. | `toggleFavorite` |
| Invalid input | Field-level messages before any request; the database re-validates with `CHECK`s. | `Registration.tsx`, `validation.ts` |

In development, problems are also logged to the console as `[multiverse backend] …`. Production
builds stay quiet.

---

## 12. Local setup

```bash
npm install
cp .env.example .env.local        # git-ignored
# edit .env.local:
#   VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
#   VITE_SUPABASE_ANON_KEY=<anon / publishable key>
npm run dev                       # http://localhost:5173
```

**Manual test checklist** (after the Supabase setup below):
1. Click **LOG IN → Sign up**, create an account → the chip shows `AGENT // yourname`.
2. Refresh → still logged in.
3. ♥ a hero → Supabase **Table Editor → favorites** shows the row.
4. ♥ the same hero in a second tab, then in the first → still one row (primary key).
5. Un-♥ → the row disappears.
6. Select heroes a few times → `interactions` gets one `select` row per selection; `user_state` updates.
7. Fill the registration form → row in `event_registrations`; submit again from another tab →
   "Already registered".
8. Log out → your data disappears from the page. Log in again → it's back, including your hero world.
9. Break the URL in `.env.local` (e.g. `https://offline.invalid`), restart `npm run dev` → the site
   still loads and works locally.

Checks before pushing: `npm run build` (typecheck + production build) and `npm run lint`.

---

## 13. Supabase dashboard setup

1. **Create a project**: supabase.com → New project (pick a region close to your users, e.g. Mumbai).
2. **Enable email/password sign-in**: Authentication → Sign In / Providers → **Email**: enabled.
   - For a quick demo: turn **Confirm email off**, so sign-up logs in immediately. Supabase's
     built-in email sender only allows a few emails per hour.
   - For real use: keep it on and set up custom SMTP. The app already handles "check your inbox".
   - Optional: set **Minimum password length** to 8 to match the form.
3. **URL configuration**: Authentication → URL Configuration → **Site URL**
   `https://marvel-uiux1.vercel.app`; add `http://localhost:5173` to **Redirect URLs**. These are
   used by confirmation and password emails.
4. **Create the database**: SQL Editor → New query → paste the whole of
   `supabase/migrations/0001_multiverse.sql` → **Run**. It's safe to run again. If it stops with
   "Found objects from the earlier anonymous-auth version…", nothing was changed. Remove those old
   objects manually (or ask) and run it again.
5. **Get the keys**: Project Settings → API (or the **Connect** button): **Project URL** and the
   **anon / publishable** key → `.env.local` / Vercel. Leave the service-role key alone.
6. Look at your data any time in **Table Editor**, and at users in **Authentication → Users**.

---

## 14. Vercel deployment

1. Vercel → project → **Settings → Environment Variables** → add `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_ANON_KEY` for **Production** and **Preview** (and Development if you use `vercel dev`).
2. Vite bakes these in at **build time**, so after adding or changing them you need a new deployment.
3. Safe rollout:
   - Push the branch / open the PR. Vercel builds a **Preview** URL.
   - Add the Preview URL to Supabase **Redirect URLs** if you want email links to work there.
   - Test the full flow on the Preview URL.
   - Merge to `main` → production deploy at `https://marvel-uiux1.vercel.app`.
4. **Rollback:** Vercel → Deployments → previous deployment → *Promote to Production*. Or remove the
   two variables and redeploy, and the site runs without a backend, exactly as before.

No `vercel.json` is needed: Vercel auto-detects Vite (`npm run build`, output `dist`).

---

## 15. Security considerations

- **Authentication** is Supabase Auth: bcrypt password hashes, short-lived JWTs, refresh tokens,
  built-in rate limits on auth endpoints.
- **Authorisation** is RLS in PostgreSQL: every table, every request, based on `auth.uid()`.
- **Least privilege**: explicit grants. Logged-out visitors can only read `characters` and aggregate
  stats; interactions have no update/delete.
- **Input validation** happens twice: in the browser (UX) and in the database (`CHECK`,
  `FOREIGN KEY`, `UNIQUE`). A tampered request is rejected (tested).
- **Secrets**: only public values in the frontend; `.env*` git-ignored; no service-role key anywhere.
- **Privacy**: statistics return counts only; registrations (names, phones, emails) are readable only
  by their owner, and by project admins in the dashboard.
- **Session storage**: supabase-js keeps the session in `localStorage`. If an attacker could run
  JavaScript on the page (XSS), they could read it. React escapes output by default and the app has
  no `dangerouslySetInnerHTML`.
- **Known limitation, no rate limiting on our tables**: a logged-in user could spam `select`
  interactions and inflate the statistics. See future improvements.

---

## 16. Future improvements

- **Rate limiting / anti-spam** for interactions: a trigger or policy limiting events per user per
  minute, or counting at most one selection per hero per minute in the stats.
- **Email confirmation + custom SMTP**, and **password reset** (`resetPasswordForEmail` plus an
  update-password screen).
- **CAPTCHA** on sign-up (Supabase supports hCaptcha / Cloudflare Turnstile).
- **Edit / cancel registration**: an `update` policy plus UI, and an admin view for organisers
  (e.g. a separate `admins` table and policy).
- **Generated TypeScript types** for the database (`supabase gen types typescript`) instead of
  hand-written ones.
- **Automated tests in CI**: run the migration and an RLS test suite against a local Supabase
  (`supabase start`) on every PR.
- **Realtime**: live-updating worldwide counts with Supabase Realtime.
- **Materialised stats**: pre-aggregated counters if traffic grows (the counts are computed per
  request today).
- **Account deletion** from the UI (cascades already delete the user's rows).

---

## How this was tested

Against a real local Supabase stack (Supabase Postgres 17 image + Supabase Auth v2.180 + PostgREST
v12, behind a small gateway), using the real `supabase-js`:

- **Database/RLS suite, 40 checks**: sign-up and duplicate email; wrong password; duplicate
  favourite (`23505`); forged `user_id` (`42501`); cross-user reads and deletes blocked; `CHECK`
  on interaction type, email and phone; one registration per user (`23505`); guest access limited
  to `characters` and stats; stats contain counts only; logout removes access; passwords stored
  only as bcrypt hashes; no password column in `public`.
- **Browser suites (Playwright)**:
  - Auth, 16 checks on desktop and mobile.
  - Favourites / interactions / user_state, 21 checks, verified with SQL.
  - Registration, 19 checks, including a DB-level duplicate and a tampered request.
  - Failure modes, 17 checks: no backend, Supabase down, database down while logged in.
- `npm run build` (TypeScript + Vite) and `npm run lint` (oxlint): clean.
