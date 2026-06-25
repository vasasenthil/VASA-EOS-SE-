-- VASA-EOS(SE) — core identity schema.
--
-- IMPORTANT (production correction): this migration originally shipped a legacy LMS schema (users,
-- schools, courses, enrolments, assignments, submissions) that (a) defined `users` with a shape the
-- live app does not use and could not seed into, and (b) defined `courses`/`assignments` that CONFLICT
-- with the real academic-module tables (scripts/046, scripts/048). It had never run against a real
-- database. It is now trimmed to the identity tables the platform actually uses, defined correctly and
-- idempotently; the academic modules own their own tables.

-- ── Identity: the users table resolveSubject()/getUserRoleAndSchool() bind the access policy to ────
create table if not exists public.users (
  id          text primary key,
  email       text not null unique,
  full_name   text not null,
  role        text not null,                 -- MINISTER / SECRETARY / ADMIN / DIRECTOR / PRINCIPAL / TEACHER / STUDENT / PARENT / …
  school_id   text,                          -- UDISE code (or null for state-tier roles)
  status      text not null default 'active',
  created_at  timestamptz default current_timestamp,
  updated_at  timestamptz default current_timestamp
);

create index if not exists idx_users_email on public.users (email);
create index if not exists idx_users_role  on public.users (role);

create table if not exists public.schools (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  state       text not null,
  city        text not null,
  created_at  timestamptz default current_timestamp,
  updated_at  timestamptz default current_timestamp
);

-- updated_at trigger (idempotent)
create or replace function trigger_set_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
declare t text;
begin
  foreach t in array array['schools','users'] loop
    execute format('drop trigger if exists set_timestamp on public.%I;', t);
    execute format('create trigger set_timestamp before update on public.%I for each row execute procedure trigger_set_timestamp();', t);
  end loop;
end $$;
