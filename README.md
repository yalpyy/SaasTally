# SaaSTally

**Compare software. Choose smarter.**

SaaSTally is a global software discovery platform: browse SaaS products, compare
them side by side, read independent reviews, and find credible alternatives.
Some outbound links are affiliate links — commission data is stored separately
from editorial scoring and never influences rankings.

This repository contains **Phase 1**: the public site, the design system, the
data layer, the affiliate redirect architecture, the SEO infrastructure and an
admin skeleton.

---

## Tech stack

| Layer      | Choice                                          |
| ---------- | ----------------------------------------------- |
| Framework  | Next.js (App Router) + React 19 + TypeScript     |
| Styling    | Tailwind CSS v4 (CSS-first tokens)               |
| Motion     | Motion for React (`motion/react`)                |
| Icons      | lucide-react                                     |
| Data       | Supabase (Postgres, Auth, Storage)               |
| Hosting    | Vercel                                           |

No state library, no CSS-in-JS, no component framework. Server Components are
the default; `"use client"` appears only where interaction genuinely requires it
(navbar, search, theme toggle, hero parallax, newsletter, login form).

---

## Local development

```bash
npm install
cp .env.example .env.local   # optional — the app runs without credentials
npm run dev                  # http://localhost:3000
```

Other scripts:

```bash
npm run build       # production build
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
```

### Two data modes

The app is designed to run with or without a database:

- **Mock mode** (no Supabase credentials) — services read the fixtures in
  `src/data`. The admin says so in a banner and disables create/edit actions.
  Nothing ever pretends a write succeeded.
- **Live mode** (credentials present) — the same service functions read
  Postgres. Pages are unaware of which mode is active.

The switch is `isSupabaseConfigured()` in `src/lib/supabase/config.ts`.

> Everything in `src/data` is placeholder content for UI work. Prices, ratings
> and feature claims are **not** verified vendor information — see
> `src/data/README.md`.

---

## Environment variables

Create `.env.local` (never commit it):

| Variable                                | Scope  | Purpose                                        |
| --------------------------------------- | ------ | ---------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`                  | public | Canonical URLs, sitemap, Open Graph            |
| `NEXT_PUBLIC_SUPABASE_URL`              | public | Supabase project URL                           |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`  | public | Anon key — safe in the browser, RLS protects   |
| `SUPABASE_SECRET_KEY`                   | server | Service role. Used only to insert click rows   |

`SUPABASE_SECRET_KEY` must never be prefixed with `NEXT_PUBLIC_` and must never
be imported into a Client Component. `src/lib/supabase/server.ts` is marked
`server-only` to make that a build error rather than a leak.

---

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. Run the migrations in `supabase/migrations/` in order (SQL editor, or
   `npx supabase db push`).
3. Run `supabase/seed/0001_categories.sql`. Every tool needs at least one
   category, so with that table empty the admin cannot create anything.
4. Copy the project URL and publishable key into `.env.local`.
5. Create a staff user in **Authentication → Users**, then insert the matching
   profile row (see `supabase/migrations/README.md`). Without a `profiles` row a
   signed-in user is *not* staff and cannot reach `/admin`.
6. Storage buckets (`tool-logos`, `tool-screenshots`, `article-images`,
   `authors`, `site-assets`) are created by the migration with public read and
   staff-only write.

### Security model

- RLS is enabled on every table.
- Anonymous readers see only `active` tools and `published` articles, reviews
  and comparisons.
- `affiliate_clicks` is never readable by the public.
- `affiliate_programs` is admin-read. RLS is row level, not column level, so a
  policy that let anonymous clients see active rows would have handed them the
  commission columns too — the publishable key ships in the browser. The public
  site instead gets two narrow projections: the `active_affiliate_tools` view
  (tool ids, for the sponsored label) and `active_affiliate_link()` (program id
  and destination, for `/go`). Neither can return a commercial term.
- Authorisation is enforced **server-side** in `requireStaff()`; hiding UI is
  not a security control.

### Regenerating database types

```bash
npx supabase gen types typescript --project-id <id> > src/lib/supabase/database.types.ts
```

The hand-written row types in that file exist so the app compiles before a
project is created. Services map database rows → application types in
`src/types`, so replacing the file does not ripple into pages.

---

## Project structure

```
src/
├── app/
│   ├── (site)/              # public site — shares navbar + footer
│   │   ├── page.tsx         # homepage
│   │   ├── software/  tools/[slug]/  categories/[slug]/
│   │   ├── reviews/[slug]/  compare/[slug]/  best/[slug]/
│   │   ├── articles/[slug]/ alternatives/[slug]/  search/
│   │   └── about/ contact/ privacy/ terms/ affiliate-disclosure/
│   ├── (admin)/admin/       # admin shell (sidebar + auth gate)
│   ├── (auth)/admin/login/  # sign-in, outside the gated layout
│   ├── api/search/          # search endpoint (noindex)
│   ├── go/[slug]/           # affiliate redirect
│   ├── sitemap.ts  robots.ts  opengraph-image.tsx  icon.svg
│   └── layout.tsx  error.tsx  not-found.tsx  globals.css
├── components/
│   ├── ui/                  # design system primitives
│   ├── layout/              # navbar, mobile nav, footer, providers
│   ├── marketing/           # homepage sections
│   ├── tools/ categories/ articles/ comparison/ search/ admin/
├── lib/
│   ├── supabase/            # client, server, service-role, config, types
│   ├── seo/                 # metadata builder + JSON-LD helpers
│   ├── affiliate/           # link builder (client) + programs (server)
│   ├── search/              # index + ranking
│   ├── utils/               # cn, format, markdown
│   ├── auth.ts  icons.ts  motion.ts  site.ts
├── services/                # data access — mock/live behind one API
├── data/                    # development fixtures ONLY
├── types/                   # application domain types
├── hooks/
└── middleware.ts            # refreshes the Supabase session for /admin
```

### Architectural decisions worth knowing

**Route groups over a `/admin` middleware wall.** `(site)` and `(admin)` get
different chrome without nesting the whole site one level deeper. The login page
lives in `(auth)` so it is not wrapped by the gated admin layout — otherwise
redirecting an unauthenticated user to `/admin/login` would loop.

**Services, not direct queries in pages.** Every page calls `src/services/*`.
That is the only place that knows whether data comes from Postgres or fixtures,
and it is where the Supabase query lives when you switch a section to live data.

**Affiliate URLs never reach the browser.** Product CTAs point at `/go/[slug]`.
The route resolves the active program server-side, records an anonymous
aggregate click, and 302s. Vendor destinations are not present in page markup,
which also means changing a partner link is a database edit, not a deploy.

**One motion vocabulary.** All timings and variants live in `src/lib/motion.ts`,
and `MotionConfig reducedMotion="user"` in the root layout means no component
has to branch on the accessibility preference. The marquee and skeletons are
plain CSS — Motion is not loaded for decoration that CSS can do.

**Two first-class themes.** Light mode is a separate palette, not an inversion:
it uses a darker brand green for contrast on white and softer shadows. A tiny
blocking script applies the theme before paint, so there is no flash.

**Honest structured data.** JSON-LD helpers only emit nodes for data that
exists. There is no `aggregateRating` anywhere, because we do not have user
ratings to aggregate. A named author is credited as a `Person`; the house
byline stays an `Organization`, because it is one.

**One scoring scale.** Everything editorial is out of 10: `tools.rating`,
`reviews.score` and the review breakdown criteria. A tool rating and a review
score are still separate figures — the rating is the catalogue's summary and
exists for tools we have not reviewed, the score is what a review argues for —
but they are in the same units, so a reader moving between a card and a review
is not comparing fifths to tenths.

---

## Admin architecture

| Route                 | Purpose                                     | Access |
| --------------------- | ------------------------------------------- | ------ |
| `/admin`              | Dashboard: counts, recent content           | staff  |
| `/admin/tools`        | Tool catalogue — create, edit and import    | staff  |
| `/admin/categories`   | Category table (read-only)                  | staff  |
| `/admin/articles`     | Articles — create and edit                  | staff  |
| `/admin/reviews`      | Reviews — create and edit                   | staff  |
| `/admin/comparisons`  | Comparisons — create and edit               | staff  |
| `/admin/best`         | Best lists — create, order and edit         | staff  |
| `/admin/authors`      | Author bylines — create and edit            | staff  |
| `/admin/affiliate`    | Programs, commission terms — admin only     | admin  |
| `/admin/media`        | Storage bucket overview                     | staff  |
| `/admin/settings`     | Environment + site settings                 | admin  |
| `/admin/login`        | Supabase Auth sign-in                       | public |

Roles are `admin` (everything) and `editor` (content, no commercial or site
configuration). `requireStaff("admin")` is called at the top of admin-only
pages; the sidebar hides those links as a convenience, not as the control.

In development without Supabase, `/admin` opens with a labelled local profile so
the UI can be built. In production without Supabase, `/admin` is closed.

---

## Affiliate redirect architecture

```
CTA click  →  /go/[slug]?s=<page>&t=<type>&p=<position>
           →  resolve active affiliate_programs row (server)
           →  insert aggregate row into affiliate_clicks (service role)
           →  302 to the vendor
```

Recorded: program id, source page, source type, CTA position, broad device type,
country (from the edge header, when available).

Deliberately **not** recorded: IP addresses, user agent strings, cookies,
identifiers of any kind. `/go/*` is `noindex, nofollow` and `no-store`, and is
excluded from the sitemap and robots.

If a tool has no active program, the redirect still sends the visitor to the
vendor's own site — a dead CTA is worse than an unattributed click.

---

## Deploying to Vercel

1. Push the repository to GitHub and import it in Vercel. No custom server, no
   special build settings.
2. Add all four environment variables under **Settings → Environment Variables**
   (Production, Preview and Development).
3. Set `NEXT_PUBLIC_SITE_URL` to the production domain — canonical tags, the
   sitemap and OG images all derive from it.
4. Point `saastally.com` at the project and set it as the primary domain.
5. After the first deploy, submit `https://saastally.com/sitemap.xml` in Search
   Console.

> Note: `generateStaticParams` and `sitemap.ts` read through the service layer,
> which uses the cookie-free anonymous client (`createReadSupabase`). They build
> statically in both modes. Public pages revalidate hourly, and the admin
> actions call `revalidatePath` for the rows they touch, so an edit is live
> without a deploy.

---

## Roadmap

Phase 1 is deliberately conservative. Nothing below is implemented, and nothing
below is blocked by the current architecture:

- **Tool Finder** — guided questionnaire producing a shortlist
- **SaaSTally Score** — published, versioned scoring rubric
- **Deals and pricing history** — requires a price snapshot table
- **User accounts** — bookmarks, "My Stack", saved comparisons, price alerts
- **Software spending calculator**
- **AI recommendations** — on top of Tool Finder, not instead of it
- **Newsletter** — UI exists; needs an email provider
- **Localisation** — English is primary; routes and content types are already
  slug-based, so a locale segment can be added without reshaping the schema

---

## Content standards

- State the criteria before the conclusion.
- Never claim hands-on testing unless the author actually tested it.
- Publish who a tool is *not* for.
- Confirm pricing with the vendor before publishing; label anything unverified.
- Commission rate is never an input to ranking, ordering or scoring.
