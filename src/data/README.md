# Development fixtures

Everything in this folder is **mock content used for local development and UI
work only**. It is not verified editorial data.

- Prices, ratings and feature claims are **placeholders**. They must not be
  presented to users as verified, current information.
- `src/services/*` read from these fixtures only when Supabase is not
  configured (`isSupabaseConfigured() === false`). When credentials exist, the
  same functions read from Postgres instead and these files are ignored.
- Before launch, delete or replace every record here with researched editorial
  content stored in Supabase.
