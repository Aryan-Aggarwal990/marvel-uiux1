# Interview preparation: GFG × Marvel "The Multiverse Is Open"

Technical details are in [`BACKEND.md`](BACKEND.md). This file is for *talking* about the project.

---

## A. 30-second introduction

> "I built the event microsite for our GeeksForGeeks Student Chapter's Marvel-themed event at Bennett
> University. The frontend is React and TypeScript with GSAP animations: you pick one of 12 Marvel
> heroes and the whole site re-themes itself. I then turned it into a full-stack app with Supabase.
> Users can sign up and log in, save favourite heroes, and register for the event. Everything is
> stored in PostgreSQL and protected with Row Level Security, so each user can only access their
> own data. And if the backend goes down, the site still works."

## B. 1-minute technical explanation

> "The frontend is React 19 with TypeScript, built with Vite and deployed on Vercel. For the backend
> I used Supabase instead of writing my own server. Supabase gives me PostgreSQL, an authentication
> service and an auto-generated REST API.
>
> Authentication is Supabase Auth with email and password. Passwords are hashed with bcrypt by
> Supabase; my database never sees them. After login the browser holds a JWT, and every request
> sends it.
>
> I designed five tables: characters, favorites, user_state, interactions and event_registrations.
> Security is enforced in the database with Row Level Security: each policy compares the row's
> user_id with auth.uid(), the id inside the JWT. Duplicates are prevented by constraints: a
> composite primary key on (user_id, character_id) for favourites, and UNIQUE(user_id) for
> registrations. The frontend reads the PostgreSQL error code, 23505, to show 'already saved'
> instead of a crash.
>
> Worldwide statistics come from a SECURITY DEFINER function that returns only counts, so no
> private data leaks. And the backend is optional: with timeouts and a localStorage fallback, the
> UI never depends on Supabase to render."

## C. Architecture

```
Browser (React + TypeScript, deployed on Vercel)
│
├─ HeroThemeProvider   the existing hero/theme engine (12 heroes, animations)
├─ AuthProvider        who is logged in (Supabase Auth session)
├─ MultiverseDataProvider   favourites, interactions, user state, stats, registration
│     └─ api.ts        one function per database call
│
└─ supabase-js ── HTTPS ──► Supabase
                             ├─ Auth (GoTrue): sign up / log in → JWT
                             ├─ Data API (PostgREST): REST over tables
                             └─ PostgreSQL: tables + constraints + RLS + character_stats()
```
No custom server: the browser talks to Supabase directly, and **the database enforces security**.

## D. Frontend → backend → database data flow

1. User clicks ♥ on Spider-Man (`HeroSelector.tsx`).
2. `toggleFavorite()` in `MultiverseDataProvider.tsx` turns the heart on straight away (optimistic
   update).
3. `insertFavorite()` in `api.ts` calls `supabase.from('favorites').insert({ character_id })`.
4. supabase-js sends `POST /rest/v1/favorites` with the anon key and the user's JWT.
5. Supabase verifies the JWT and runs the INSERT as the `authenticated` role.
6. PostgreSQL fills `user_id = auth.uid()`, checks the RLS policy, the primary key and the foreign key.
7. Success → keep the heart and log a `favorite` interaction. Error → roll back and show a notice.
   (`23505` means it's already a favourite, which counts as success.)

## E. What is React?

A JavaScript library for building UIs from **components**: functions that return what the screen
should look like for the current **state**. When state changes, React re-renders the affected parts.
Here, for example, `HeroSelector` re-renders when the favourites set changes. We share state
between components with **Context** (`AuthProvider`, `MultiverseDataProvider`) instead of passing
props through every level.

## F. What is TypeScript?

JavaScript with **static types**, checked at build time. For example, `HeroId` is a union of the 12
hero ids, so `select('batman')` is a compile error. `npm run build` runs `tsc` first, so type errors
block the deploy.

## G. What is an API?

An **Application Programming Interface**: a defined way for one program to ask another for data or
actions. Here the browser uses Supabase's REST API (`GET/POST/DELETE /rest/v1/<table>`) and Auth API
(`/auth/v1/signup`, `/auth/v1/token`). supabase-js wraps those HTTP calls in functions like
`.from('favorites').insert(...)`.

## H. What is Supabase?

An open-source **Backend-as-a-Service** built around PostgreSQL. It provides a hosted database,
authentication, an auto-generated REST API (PostgREST), storage and realtime, so I didn't have to
write and host my own server. It's often described as an open-source alternative to Firebase, but
with a relational SQL database.

## I. What is PostgreSQL?

A powerful open-source **relational database**: data in tables with rows and columns, queried with
SQL, with **constraints** (primary keys, foreign keys, UNIQUE, CHECK), **transactions**
(all-or-nothing writes) and features like **Row Level Security**.

## J. What is authentication?

Proving **who you are**. Here: email + password to Supabase Auth, which returns a JWT that proves
your identity on every request.

## K. What is authorization?

Deciding **what you're allowed to do** once we know who you are. Here: RLS policies like
`user_id = auth.uid()`. You're authenticated as user A, and you're authorised to read only A's
favourites.

## L. What is RLS?

**Row Level Security**, a PostgreSQL feature that attaches rules to tables so every query only
sees or changes the rows a policy allows. With RLS on and no policy, a table returns nothing. In
Supabase it's essential, because the database is reachable from the browser.
Example: `create policy "favorites: read own" on favorites for select to authenticated using (user_id = (select auth.uid()));`

## M. Why use database constraints?

Because **the database is the last line of defence and the single place every write passes
through**. The frontend can be bypassed (anyone can call the API with their token), and two requests
can race. Constraints (`PRIMARY KEY`, `UNIQUE`, `FOREIGN KEY`, `CHECK`) guarantee data rules no
matter which client wrote the data. I tested this by tampering with a request after the browser's
validation had passed, and the `CHECK` constraint rejected it.

## N. Why prevent duplicates at the database level?

React can only check what *it* knows. With two tabs open, both can think "not favourited yet" and
both insert. Only the database sees both inserts in order, and the primary key rejects the second
with `23505`. The UI then treats `23505` as "already saved". I tested exactly this: I inserted a
favourite behind the UI's back, then clicked ♥, and there was still exactly one row with no error
shown.

## O. Why use environment variables?

To keep configuration (project URL, keys) **out of the source code**. You can have different values
locally, on preview and in production without code changes, and real values never get committed
(`.env*` is in `.gitignore`; `.env.example` has placeholders). Note: `VITE_` variables are *not*
secret. Vite bakes them into the browser bundle, which is fine for the URL and anon key.

## P. Why shouldn't the service-role key be exposed?

The service-role key uses Postgres's `service_role`, which **bypasses Row Level Security**. Anyone
with it could read every user's registration (names, phones, emails) or delete every table. The anon
key is safe to publish because it's restricted by RLS and grants; the service-role key is not. It
belongs only on trusted servers, never in frontend code or a `VITE_` variable.

## Q. What happens when Supabase is unavailable?

The site still loads. Nothing in the UI waits for Supabase:
- with no env vars, backend code is removed at build time;
- every call has a timeout (`withTimeout`);
- logged out: login shows "Signal lost…", hearts save to localStorage;
- logged in with the database down: a notice explains, favourites are saved on the device and merged
  into the account on the next successful login;
- failed writes roll back the optimistic UI.

All of this was tested with automated browser tests.

## R. Why Supabase instead of a Node/Express backend?

- **Time and scope**: auth, database, API and hosting out of the box. An Express server would need
  me to build login, password hashing, sessions/JWTs, validation, a REST layer and hosting myself.
- **Security by default**: bcrypt and JWT handled by a battle-tested auth server; RLS enforced in
  the database itself.
- **Fits the frontend**: Vercel serves the static React app, and Supabase is the backend. No server
  to maintain.
- **Still real SQL**: PostgreSQL with constraints and policies, not a proprietary NoSQL store, so
  the skills transfer.

Trade-off: business logic that can't be expressed in SQL/RLS would need Edge Functions or a server.

## S. Limitations of this architecture

- **No rate limiting on our tables**: a logged-in user could spam `select` interactions and inflate
  the stats (documented; future: trigger/policy-based throttling).
- **Logic lives in the client + database**: complex server-side workflows (payments, emails to
  organisers) would need Supabase Edge Functions or a small server.
- **Stats computed per request**: fine at event scale; at high traffic you'd pre-aggregate.
- **Session in localStorage**: convenient, but readable by injected scripts if the site ever had an
  XSS bug.
- **Vendor dependency** on Supabase (mitigated: it's open source and plain PostgreSQL).
- Email confirmation is off for the demo; production should enable it with custom SMTP.

---

## T. Likely interview questions (with answers)

1. **How does a user's favourite end up linked to *their* account?**
   `favorites.user_id` has `default auth.uid()`. PostgreSQL fills it from the JWT, and the RLS
   `with check (user_id = auth.uid())` rejects any other value. The frontend never sends a user id.

2. **What stops user A from reading user B's registration?**
   RLS on `event_registrations`: `for select using (user_id = auth.uid())`. B's rows are invisible to
   A. My test signs in as B and gets 0 rows.

3. **What is `auth.uid()`?**
   A Supabase SQL function that returns the `sub` (user id) claim from the verified JWT of the current
   request. It's `NULL` for logged-out visitors.

4. **What happens if someone favourites the same hero twice?**
   The composite primary key `(user_id, character_id)` rejects the second insert with error `23505`.
   My `toggleFavorite` catches it with `isDuplicate()` and treats it as already saved.

5. **Why is the favourites key composite instead of a separate id?**
   The pair (user, hero) *is* the identity of a favourite. Making it the primary key gives uniqueness
   and an index in one step.

6. **How do you prevent double registration?**
   `constraint event_registrations_one_per_user unique (user_id)`. On `23505` the app loads the existing
   registration and shows "Already registered // this account".

7. **Why are interactions allowed to duplicate?**
   Each row is an *event* (Spider-Man selected at 10:02, again at 10:05). History needs every event,
   so there's no unique constraint, just a `CHECK` on the type.

8. **How do you stop arbitrary interaction types like `'hack'`?**
   `check (interaction_type in ('select', 'favorite', 'unfavorite'))`. The database rejects anything
   else with `23514`.

9. **How do you show worldwide stats without exposing other users' data?**
   `character_stats()` is `SECURITY DEFINER`, so it can count all rows, but it returns only
   `character_id, selections, favorites, my_selections`. It never returns ids or emails.
   `search_path` is pinned for safety.

10. **What is `SECURITY DEFINER` and why is it risky?**
    The function runs with its owner's privileges instead of the caller's. It's risky if the function
    returned raw rows or took unchecked input. Mine takes no input and returns only counts.

11. **Where are passwords stored?**
    Only in Supabase Auth's `auth.users.encrypted_password`, as a **bcrypt hash**. My schema has no
    password column; my test checks that the stored value starts with `$2a$` and isn't the plaintext.

12. **How does the app stay logged in after a refresh?**
    supabase-js stores the session (access JWT + refresh token) in localStorage. On load,
    `getSession()` restores it (refreshing if expired), and `onAuthStateChange` updates React.

13. **How does React know the user logged in or out?**
    `AuthProvider` subscribes to `supabase.auth.onAuthStateChange` and stores `{ id, email }` in
    context; any component calls `useAuth()`.

14. **What's the difference between the anon key and the JWT?**
    The anon key identifies the *project* (role `anon`). After login, the user's JWT identifies the
    *user* (role `authenticated`, `sub` = user id). Requests send both.

15. **Authentication vs authorization in your project?**
    Authentication: Supabase Auth checks the email and password and issues a JWT. Authorization: RLS
    policies decide which rows that user may read or write.

16. **Why is event registration separate from the account?**
    Different purposes. The account (email + password) is for logging in and is owned by Supabase
    Auth. The registration is event data (name, phone, branch, hero) in my own table, linked only by
    `user_id`. Its email is a contact email, and no password is ever stored with it.

17. **What is an optimistic update and why use it?**
    The UI changes immediately (heart turns on), then the request runs. On failure it rolls back
    and shows a notice. The app feels instant, and it stays correct.

18. **What if the database is down while a user is logged in?**
    Loading account data fails → status `offline` → a notice explains → favourites save to
    localStorage → on the next successful login they're merged into the account (duplicates
    ignored thanks to the primary key).

19. **What happens to guest favourites when someone logs in?**
    Each guest favourite is inserted for the account. `23505` duplicates are ignored, then the
    guest list is cleared and PostgreSQL becomes the source of truth.

20. **Why is the character data duplicated in SQL?**
    Only `id` and `name` are, so other tables can use a **foreign key** (no favouriting a hero that
    doesn't exist, error `23503`). All visual data stays in `src/config/characters.ts`.

21. **How did you test RLS?**
    Against a real local Supabase stack (Postgres + Auth + PostgREST) using supabase-js, with two
    users and a guest: 40 checks. For example, forging `user_id` → `42501`, B deleting A's rows →
    0 affected, guest reading favourites → denied.

22. **Why are `VITE_` variables visible in the browser, and is that a problem?**
    Vite inlines them into the bundle at build time. That's fine for the URL and anon key, which are
    public by design. It would be a problem for the service-role key, which is why it's never used.

23. **What does `(select auth.uid())` in a policy do differently from `auth.uid()`?**
    Same value, but the sub-select lets PostgreSQL evaluate it once per query instead of once per row,
    a performance best practice from Supabase.

24. **What would you improve next?**
    Rate-limit interactions, enable email confirmation with custom SMTP, add password reset, generate
    TypeScript types from the schema, run the RLS test suite in CI, and add an organiser admin view.

25. **Why use `Promise.allSettled` in the registration submit?**
    The "ACCESS REQUESTED" animation and the database insert run in parallel. `allSettled` waits for
    both, even if the insert fails quickly, so the animation always finishes before the success or
    error state appears.

---

### Numbers worth remembering
- 12 heroes · 5 tables · 11 RLS policies · 1 stats function
- Error codes: **23505** duplicate · **23514** check failed · **23503** unknown reference · **42501** permission denied
- Tests: 40 database/RLS · 16 auth · 21 favourites/interactions · 19 registration · 17 failure modes
