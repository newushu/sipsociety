-- Profiles table for role-based access
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text default 'viewer',
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

grant select, update on public.profiles to authenticated;

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

drop policy if exists "Profiles are viewable by owner" on public.profiles;
create policy "Profiles are viewable by owner"
  on public.profiles
  for select
  using (auth.uid() = id);

drop policy if exists "Profiles are updateable by owner" on public.profiles;
create policy "Profiles are updateable by owner"
  on public.profiles
  for update
  using (auth.uid() = id);

-- Pages table with draft + published JSON
create table if not exists public.pages (
  slug text primary key,
  title text,
  draft jsonb,
  published jsonb,
  updated_at timestamptz default now()
);

alter table public.pages enable row level security;

grant select, insert, update on public.pages to authenticated;
grant select on public.pages to anon;

drop policy if exists "Admins can read pages" on public.pages;
create policy "Admins can read pages"
  on public.pages
  for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

drop policy if exists "Public can read published pages" on public.pages;
create policy "Public can read published pages"
  on public.pages
  for select
  using (published is not null);

drop policy if exists "Admins can insert pages" on public.pages;
create policy "Admins can insert pages"
  on public.pages
  for insert
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

drop policy if exists "Admins can update pages" on public.pages;
create policy "Admins can update pages"
  on public.pages
  for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Public view for published content only
create or replace view public.published_pages as
select slug, title, published as content, updated_at
from public.pages
where published is not null;

grant select on public.published_pages to anon;
grant select on public.published_pages to authenticated;

-- Global settings (logo, motto, shared metadata)
create table if not exists public.global_settings (
  key text primary key,
  draft jsonb,
  published jsonb,
  updated_at timestamptz default now()
);

alter table public.global_settings enable row level security;

grant select, insert, update on public.global_settings to authenticated;

drop policy if exists "Admins can read global settings" on public.global_settings;
create policy "Admins can read global settings"
  on public.global_settings
  for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

drop policy if exists "Admins can insert global settings" on public.global_settings;
create policy "Admins can insert global settings"
  on public.global_settings
  for insert
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

drop policy if exists "Admins can update global settings" on public.global_settings;
create policy "Admins can update global settings"
  on public.global_settings
  for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create or replace view public.published_global_settings as
select key, published as content, updated_at
from public.global_settings
where published is not null;

grant select on public.published_global_settings to anon;
grant select on public.published_global_settings to authenticated;

-- Job positions + applications
do $$
begin
  if not exists (select 1 from pg_type where typname = 'job_application_status') then
    create type public.job_application_status as enum (
      'applied',
      'interviewed',
      'shortlisted',
      'accepted',
      'working',
      'rejected'
    );
  end if;
end $$;

do $$
begin
  if exists (select 1 from pg_type where typname = 'job_application_status') then
    if not exists (
      select 1
      from pg_enum
      where enumlabel = 'resume_viewed'
      and enumtypid = 'job_application_status'::regtype
    ) then
      -- resume_viewed removed from enum
    end if;
    if not exists (
      select 1
      from pg_enum
      where enumlabel = 'rejected'
      and enumtypid = 'job_application_status'::regtype
    ) then
      alter type public.job_application_status add value 'rejected' after 'working';
    end if;
  end if;
end $$;

create table if not exists public.job_positions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  is_active boolean default true,
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.job_positions
  add column if not exists description text;

create table if not exists public.job_applications (
  id uuid primary key default gen_random_uuid(),
  position_id uuid references public.job_positions(id) on delete set null,
  first_name text not null,
  last_name text not null,
  contact_email text,
  contact_phone text,
  applicant_fit text,
  resume_link text,
  resume_path text,
  status public.job_application_status default 'applied',
  resume_view_count int default 0,
  resume_last_viewed_at timestamptz,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.job_applications
  add column if not exists resume_view_count int default 0;
alter table public.job_applications
  add column if not exists resume_last_viewed_at timestamptz;
alter table public.job_applications
  add column if not exists contact_email text;
alter table public.job_applications
  add column if not exists contact_phone text;
alter table public.job_applications
  add column if not exists applicant_fit text;
alter table public.job_applications
  add column if not exists notes text;

create index if not exists job_applications_position_id_idx
  on public.job_applications(position_id);

create index if not exists job_applications_status_idx
  on public.job_applications(status);

alter table public.job_positions enable row level security;
alter table public.job_applications enable row level security;

grant select, insert, update, delete on public.job_positions to authenticated;
grant select on public.job_positions to anon;

grant select, insert, update, delete on public.job_applications to authenticated;
grant insert on public.job_applications to anon;

drop policy if exists "Public can read active positions" on public.job_positions;
create policy "Public can read active positions"
  on public.job_positions
  for select
  using (is_active = true);

drop policy if exists "Admins can manage positions" on public.job_positions;
create policy "Admins can manage positions"
  on public.job_positions
  for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

drop policy if exists "Public can submit applications" on public.job_applications;
create policy "Public can submit applications"
  on public.job_applications
  for insert
  with check (
    position_id is null
    or exists (
      select 1 from public.job_positions
      where job_positions.id = position_id and job_positions.is_active = true
    )
  );

drop policy if exists "Admins can read applications" on public.job_applications;
create policy "Admins can read applications"
  on public.job_applications
  for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

drop policy if exists "Admins can update applications" on public.job_applications;
create policy "Admins can update applications"
  on public.job_applications
  for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

drop policy if exists "Admins can delete applications" on public.job_applications;
create policy "Admins can delete applications"
  on public.job_applications
  for delete
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Draft history snapshots (app-managed: autosave, manual save, publish)
do $$
begin
  if not exists (select 1 from pg_type where typname = 'draft_history_source') then
    create type public.draft_history_source as enum (
      'auto',
      'draft',
      'publish'
    );
  end if;
end $$;

create table if not exists public.page_draft_history (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  draft jsonb not null,
  source public.draft_history_source not null default 'auto',
  created_at timestamptz default now()
);

alter table public.page_draft_history
  add column if not exists source public.draft_history_source not null default 'auto';

create index if not exists page_draft_history_slug_idx
  on public.page_draft_history(slug);

alter table public.page_draft_history enable row level security;

grant select on public.page_draft_history to authenticated;

drop policy if exists "Admins can read draft history" on public.page_draft_history;
create policy "Admins can read draft history"
  on public.page_draft_history
  for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create or replace function public.snapshot_draft_history()
returns trigger as $$
declare
  last_draft jsonb;
  last_snapshot timestamptz;
begin
  if new.draft is null then
    return new;
  end if;

  select max(created_at)
    into last_snapshot
  from public.page_draft_history
  where slug = new.slug;

  if last_snapshot is not null and last_snapshot > (now() - interval '10 minutes') then
    return new;
  end if;

  select draft
    into last_draft
  from public.page_draft_history
  where slug = new.slug
  order by created_at desc
  limit 1;

  if last_draft is not null and last_draft = new.draft then
    return new;
  end if;

  insert into public.page_draft_history (slug, draft)
  values (new.slug, new.draft);

  return new;
end;
$$ language plpgsql security definer;

create or replace function public.snapshot_draft_history_force(
  target_slug text,
  target_draft jsonb,
  target_source public.draft_history_source default 'draft'
)
returns void as $$
begin
  if target_draft is null then
    return;
  end if;
  insert into public.page_draft_history (slug, draft, source)
  values (target_slug, target_draft, target_source);
end;
$$ language plpgsql security definer;
grant execute on function public.snapshot_draft_history_force(text, jsonb, public.draft_history_source) to authenticated;

drop trigger if exists on_pages_draft_snapshot on public.pages;
-- Draft history is managed in the app layer (manual save, publish, autosave).

-- Global settings draft history (app-managed: autosave, manual save, publish)
create table if not exists public.global_settings_history (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  draft jsonb not null,
  source public.draft_history_source not null default 'auto',
  created_at timestamptz default now()
);

alter table public.global_settings_history
  add column if not exists source public.draft_history_source not null default 'auto';

create index if not exists global_settings_history_key_idx
  on public.global_settings_history(key);

alter table public.global_settings_history enable row level security;

grant select on public.global_settings_history to authenticated;

drop policy if exists "Admins can read global settings history" on public.global_settings_history;
create policy "Admins can read global settings history"
  on public.global_settings_history
  for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create or replace function public.snapshot_global_settings_history()
returns trigger as $$
declare
  last_draft jsonb;
  last_snapshot timestamptz;
begin
  if new.draft is null then
    return new;
  end if;

  select max(created_at)
    into last_snapshot
  from public.global_settings_history
  where key = new.key;

  if last_snapshot is not null and last_snapshot > (now() - interval '10 minutes') then
    return new;
  end if;

  select draft
    into last_draft
  from public.global_settings_history
  where key = new.key
  order by created_at desc
  limit 1;

  if last_draft is not null and last_draft = new.draft then
    return new;
  end if;

  insert into public.global_settings_history (key, draft)
  values (new.key, new.draft);

  return new;
end;
$$ language plpgsql security definer;

create or replace function public.snapshot_global_settings_history_force(
  target_key text,
  target_draft jsonb,
  target_source public.draft_history_source default 'draft'
)
returns void as $$
begin
  if target_draft is null then
    return;
  end if;
  insert into public.global_settings_history (key, draft, source)
  values (target_key, target_draft, target_source);
end;
$$ language plpgsql security definer;
grant execute on function public.snapshot_global_settings_history_force(
  text,
  jsonb,
  public.draft_history_source
) to authenticated;

drop trigger if exists on_global_settings_draft_snapshot on public.global_settings;
-- Draft history is managed in the app layer (manual save, publish, autosave).

insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false)
on conflict (id) do nothing;

drop policy if exists "Public can upload resumes" on storage.objects;
create policy "Public can upload resumes"
  on storage.objects
  for insert
  with check (
    bucket_id = 'resumes'
    and (auth.role() = 'anon' or auth.role() = 'authenticated')
  );

drop policy if exists "Admins can read resumes" on storage.objects;
create policy "Admins can read resumes"
  on storage.objects
  for select
  using (
    bucket_id = 'resumes'
    and exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

drop policy if exists "Admins can delete resumes" on storage.objects;
create policy "Admins can delete resumes"
  on storage.objects
  for delete
  using (
    bucket_id = 'resumes'
    and exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Gallery likes (public tally)
create table if not exists public.gallery_likes (
  id uuid primary key default gen_random_uuid(),
  item_id text not null,
  created_at timestamptz default now()
);

create index if not exists gallery_likes_item_id_idx
  on public.gallery_likes(item_id);

alter table public.gallery_likes enable row level security;

grant select, insert on public.gallery_likes to anon;
grant select, insert on public.gallery_likes to authenticated;

drop policy if exists "Public can read gallery likes" on public.gallery_likes;
create policy "Public can read gallery likes"
  on public.gallery_likes
  for select
  using (true);

drop policy if exists "Public can add gallery likes" on public.gallery_likes;
create policy "Public can add gallery likes"
  on public.gallery_likes
  for insert
  with check (item_id is not null);
