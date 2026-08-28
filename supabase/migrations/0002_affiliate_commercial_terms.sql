-- ===========================================================================
-- 0002 — Close the commercial-terms leak on affiliate_programs
--
-- 0001 gave anonymous clients `for select using (status = 'active')`. RLS is
-- row level, not column level, so that policy handed every visitor the whole
-- row: commission_type, commission_value, cookie_days, network and the raw
-- affiliate_url. The publishable key ships in the browser, so anyone could
-- read our commercial terms straight off the REST endpoint.
--
-- The fix keeps the two things the public site genuinely needs, and nothing
-- else:
--
--   1. `active_affiliate_tools` — which tools have an active program, so the
--      catalogue can render the "Sponsored" label. Tool ids only.
--   2. `active_affiliate_link(text)` — the destination for /go/[slug]. The URL
--      is observable anyway (it is the Location header of a redirect anyone
--      can follow), so exposing it through a narrow function costs nothing
--      while the commission columns stay unreadable.
--
-- Both are owner-rights (security definer) on purpose: they exist precisely to
-- expose a safe projection of a table the caller may not read. Neither returns
-- a commission column, and the editorial firewall is unaffected — ranking code
-- still never sees commercial data.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- Commercial terms become admin-only.
-- ---------------------------------------------------------------------------
drop policy if exists affiliate_programs_public_read on public.affiliate_programs;

create policy affiliate_programs_admin_read on public.affiliate_programs
  for select using (public.is_admin());

-- ---------------------------------------------------------------------------
-- 1. Which tools carry an active program (no commercial data).
-- ---------------------------------------------------------------------------
create or replace view public.active_affiliate_tools as
  select tool_id
  from public.affiliate_programs
  where status = 'active';

-- Owner rights, deliberately: the view is the sanctioned projection.
alter view public.active_affiliate_tools set (security_invoker = false);

revoke all on public.active_affiliate_tools from anon, authenticated;
grant select on public.active_affiliate_tools to anon, authenticated;

comment on view public.active_affiliate_tools is
  'Tool ids with an active affiliate program. Exposes no commercial terms; '
  'used only to render the sponsored label.';

-- ---------------------------------------------------------------------------
-- 2. Redirect destination for /go/[slug].
-- ---------------------------------------------------------------------------
create or replace function public.active_affiliate_link(tool_slug text)
returns table (id uuid, affiliate_url text)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.affiliate_url
  from public.affiliate_programs p
  join public.tools t on t.id = p.tool_id
  where p.status = 'active'
    and t.active
    and t.slug = tool_slug
  limit 1;
$$;

revoke all on function public.active_affiliate_link(text) from public;
grant execute on function public.active_affiliate_link(text) to anon, authenticated;

comment on function public.active_affiliate_link(text) is
  'Resolves the redirect target for /go/[slug]. Returns the program id and '
  'destination only — never commission_type, commission_value or cookie_days.';
