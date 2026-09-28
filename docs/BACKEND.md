# Supabase backend (optional enhancement)

The site works without any backend. When Supabase is configured, it also:

- saves each visitor's **favourite heroes** (heart toggle in the Choose Your Hero lineup)
- saves the **hero world** they're currently in
- logs anonymous **interactions** (`select`, `favorite`, `unfavorite`) with timestamps
- shows **personal and worldwide counts** in the lineup ("You // 3× · World // 1,204 picks · ♥ 41")
- **saves event registrations** from the existing form

Visitors never see a login screen. Each browser silently gets a Supabase **anonymous user**, so
Row Level Security can make sure people only ever touch their own rows.

---

## How it fits the existing code

| Piece | File |
|---|---|
| Optional client (created only when env vars exist, lazy-loaded) | `src/lib/supabase.ts` |
| Typed table calls + input validation | `src/data/api.ts` |
| Local fallback (favourites + personal counts) | `src/data/localStore.ts` |
| Background sync, anonymous session, stats | `src/data/MultiverseDataProvider.tsx` |
| React context / hook (`useMultiverse`) | `src/data/multiverseContext.ts` |
| Database schema, RLS, stats function | `supabase/migrations/0001_multiverse.sql` |

The hero engine (`src/theme/*`) is unchanged. `MultiverseDataProvider` sits inside it in
`src/main.tsx` and records a selection whenever the active hero changes.

### Fail-safe behaviour

| Situation | What happens |
|---|---|
| No env vars (e.g. current deploy) | Backend code is removed at build time. Favourites and personal counts use local storage. Registration stays simulated, as before. |
| Configured, Supabase unreachable / anonymous sign-ins disabled | The site renders normally. Favourites and counts use local storage; worldwide counts are hidden. Registration shows the existing "Transmission failed … Please try again." line rather than pretending to succeed. |
| Configured and online | Everything is saved; worldwide counts appear. |

Nothing waits for Supabase before the page renders, and every request has a timeout. Errors are
logged to the console **in development only** (prefixed `[multiverse backend]`).

---

## Setup

### 1. Create a Supabase project
1. Go to https://supabase.com → **New project**. Pick a name, a database password (store it
   safely) and the region closest to your users (e.g. Mumbai for India).
2. Wait for the project to finish provisioning.

### 2. Enable anonymous sign-ins
**Authentication → Sign In / Providers → Allow anonymous sign-ins → On → Save.**

Without this, the site still works, but the backend stays offline (local storage only).

Recommended while you're there: **Authentication → Attack Protection → enable CAPTCHA** (e.g.
Cloudflare Turnstile) once the site is public. The default anonymous sign-in rate limit is
30/hour per IP.

### 3. Create the tables (run the SQL)
**SQL Editor → New query →** paste the entire contents of
[`supabase/migrations/0001_multiverse.sql`](../supabase/migrations/0001_multiverse.sql) **→ Run.**

It creates:

| Table / function | Purpose | Browser (anon key) can |
|---|---|---|
| `characters` | 12 hero ids + names (FK target; visuals stay in `src/config/characters.ts`) | read |
| `favorites` | user × hero, primary key prevents duplicates | read / add / remove **own** |
| `user_state` | the hero world each user is in | read / create / update **own** |
| `interactions` | append-only event log (`select`/`favorite`/`unfavorite`) | read / add **own** (max 30/min) |
| `registrations` | event sign-ups (name, email, phone, branch, hero, track, badge id) | add / read **own** (max 5 per user) |
| `character_stats()` | worldwide selections + favourites, plus the caller's own selections | call (counts only) |

The script is idempotent: re-running it is safe and doesn't duplicate data.

> Adding a hero later? Add it to `src/config/characters.ts` **and** insert its `id`/`name`
> into `public.characters` (the insert at the top of the SQL file shows the format).

### 4. Local environment variables
Find the values in **Project Settings → API** (or the **Connect** button):

- **Project URL** → `VITE_SUPABASE_URL`
- **anon public** key (or the newer **publishable** key, `sb_publishable_…`) → `VITE_SUPABASE_ANON_KEY`

```bash
cp .env.example .env.local   # .env.local is git-ignored
# edit .env.local and paste the two values
```

**Never** use the `service_role` / secret key anywhere in this project. The frontend doesn't
need it.

### 5. Test locally
```bash
npm install
npm run dev          # http://localhost:5173
```
1. Open the site, go to **Choose Your Hero**, select a hero and press a few ♥ buttons.
2. In Supabase **Table Editor**, check `favorites`, `interactions` and `user_state`. Rows
   appear within a second or two. **Authentication → Users** shows an anonymous user.
3. Refresh the page: hearts stay on and the lineup shows "You // n× · World // …".
4. Submit the registration form, then check the `registrations` table.
5. Failure test: set `VITE_SUPABASE_URL=https://offline.invalid` in `.env.local` and restart
   `npm run dev`. The site should work normally; the console shows
   `[multiverse backend] backend unavailable — using local storage only`.

Useful SQL:
```sql
select * from public.character_stats() order by selections desc;
select name, email, phone, branch, character_id, track, badge_id, created_at
  from public.registrations order by created_at desc;
```
(Organisers can also export `registrations` as CSV from the Table Editor.)

### 6. Add the variables to Vercel
**Vercel → your project → Settings → Environment Variables:**

| Key | Value | Environments |
|---|---|---|
| `VITE_SUPABASE_URL` | your Project URL | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY` | your anon / publishable key | Production, Preview, Development |

Vite bakes these in **at build time**, so a new deployment is required after adding or
changing them.

### 7. Redeploy safely
1. Push the branch and open a pull request. Vercel builds a **Preview deployment** for it,
   using the Preview env vars.
2. Test the preview URL: select heroes, favourite, register, and check the Supabase tables.
3. Merge the PR into `main`. Vercel then deploys production at the usual URL.
4. If anything looks wrong, use **Vercel → Deployments → previous deployment → ⋯ → Promote to
   Production** (instant rollback). Or remove the two env vars and redeploy: the site then runs
   exactly as it did before the backend existed.

---

## Security notes
- **Public key only.** The anon/publishable key is designed to be public; Row Level Security
  protects the data. It appears in the built JavaScript, which is expected.
- **RLS on every table.** Users can only read and write their own rows (`auth.uid()`). Nobody
  can read other people's favourites or registrations through the API. Organisers use the
  dashboard.
- **Column-level grants.** The browser can only send specific columns. `user_id`, ids and
  timestamps always come from database defaults and can't be forged.
- **Validation in the database.** Heroes must exist; interaction types are whitelisted; name,
  email, phone (Indian mobile format), branch, track and badge id are checked by constraints.
  The app normalises input (trim, lower-case email, digits-only phone) before sending.
- **Abuse limits.** 30 interactions per user per minute and 5 registrations per anonymous user.
  A determined attacker can still create new anonymous users, so enable CAPTCHA and keep
  Supabase's auth rate limits on.
- **Personal data.** Registrations contain names, emails and phone numbers. Only project
  members can see them in the dashboard. Consider adding a one-line privacy note to the form
  and deleting the data after the event.
- **Anonymous users accumulate.** Optional cleanup, e.g. monthly in the SQL editor
  (registrations are kept; their `user_id` becomes null):
  ```sql
  delete from auth.users where is_anonymous and created_at < now() - interval '60 days';
  ```
