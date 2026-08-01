create table if not exists public.policies (
  id text primary key default concat('POL-', extract(year from now()), '-', substr(md5(random()::text), 1, 4)),
  title text not null,
  policy_domain text not null,
  version text not null default '1.0',
  abstract_en text not null,
  abstract_hi text,
  keywords text[] not null default '{}',
  target_audience text[] not null default '{}',
  lead_drafter text not null default 'System User',
  nep_thrust_areas text[] not null default '{}',
  nep_alignment_justification text,
  draft_policy_document jsonb,
  annexures jsonb[],
  internal_review_committee text[] not null default '{}',
  status text not null default 'Draft',
  version_history jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  last_modified timestamptz not null default now()
);

alter table public.policies add column if not exists version_history jsonb not null default '[]'::jsonb;
create index if not exists idx_policies_status on public.policies(status);
create index if not exists idx_policies_policy_domain on public.policies(policy_domain);
create index if not exists idx_policies_last_modified on public.policies(last_modified desc);
alter table public.policies enable row level security;

drop policy if exists "Authenticated users can view policies" on public.policies;
create policy "Authenticated users can view policies" on public.policies for select to authenticated using (true);

create or replace function public.set_policy_last_modified() returns trigger language plpgsql as $$
begin new.last_modified = now(); return new; end;
$$;
drop trigger if exists policies_set_last_modified on public.policies;
create trigger policies_set_last_modified before update on public.policies for each row execute function public.set_policy_last_modified();
