-- ============================================================================
-- Persistent rate limiting
--
-- Serverless deployments run many isolated instances, so in-memory counters are
-- not a reliable limit. This table plus the atomic `consume_rate_limit` function
-- provides a shared fixed-window counter that every instance uses.
--
-- Keys are opaque (the application hashes the client identifier before calling),
-- so no raw IP addresses are stored. Rows are operational only and can be pruned
-- by `expires_at`.
-- ============================================================================

create table if not exists public.rate_limits (
  key text primary key,
  window_start timestamptz not null,
  count integer not null default 0,
  expires_at timestamptz not null
);

create index if not exists rate_limits_expires_at_idx
  on public.rate_limits (expires_at);

-- ----------------------------------------------------------------------------
-- Atomic fixed-window counter
--
-- Increments the counter for the current window and returns whether the request
-- is within the limit. The single `insert ... on conflict do update` takes a row
-- lock, so concurrent calls across instances are serialized and cannot exceed
-- the limit.
-- ----------------------------------------------------------------------------
create or replace function public.consume_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_window_start timestamptz;
  v_count integer;
begin
  if p_key is null or p_key = '' or p_limit is null or p_limit < 1
     or p_window_seconds is null or p_window_seconds < 1 then
    return false;
  end if;

  v_window_start := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );

  insert into public.rate_limits as rl (key, window_start, count, expires_at)
  values (
    p_key,
    v_window_start,
    1,
    v_window_start + make_interval(secs => p_window_seconds * 2)
  )
  on conflict (key) do update
    set count = case when rl.window_start = excluded.window_start then rl.count + 1 else 1 end,
        window_start = excluded.window_start,
        expires_at = excluded.expires_at
  returning count into v_count;

  return v_count <= p_limit;
end;
$$;

-- ----------------------------------------------------------------------------
-- Row Level Security and grants
--
-- The table and function are server-only: the browser can never read or write
-- them, and only the service role may execute the counter function.
-- ----------------------------------------------------------------------------
alter table public.rate_limits enable row level security;

revoke all on public.rate_limits from anon, authenticated;
grant select, insert, update, delete on public.rate_limits to service_role;

revoke all on function public.consume_rate_limit(text, integer, integer) from public;
grant execute on function public.consume_rate_limit(text, integer, integer) to service_role;

-- Housekeeping:
--
--   delete from public.rate_limits where expires_at < now() - interval '1 day';
