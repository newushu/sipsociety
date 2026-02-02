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

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create policy "Profiles are viewable by owner"
  on public.profiles
  for select
  using (auth.uid() = id);

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

create policy "Admins can read pages"
  on public.pages
  for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create policy "Admins can insert pages"
  on public.pages
  for insert
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

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

create policy "Admins can read global settings"
  on public.global_settings
  for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create policy "Admins can insert global settings"
  on public.global_settings
  for insert
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

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
