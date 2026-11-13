-- MentorX: identidade, perfis e papéis de acesso.
-- Aplicar no SQL Editor do projecto Supabase antes de activar registos reais.

do $$
begin
  create type public.app_role as enum ('student', 'teacher', 'admin');
exception
  when duplicate_object then null;
end
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  avatar_url text,
  bio varchar(500),
  grade text,
  institution text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  role public.app_role not null default 'student',
  created_at timestamptz not null default now()
);

create index if not exists user_roles_role_idx on public.user_roles(role);

-- A função consulta o papel do utilizador autenticado sem expor a tabela de permissões.
create or replace function public.has_role(_role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role = _role
  );
$$;

revoke all on function public.has_role(public.app_role) from public;
grant execute on function public.has_role(public.app_role) to authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- Cada novo utilizador recebe um perfil e o papel student por omissão.
-- O papel nunca é aceite a partir dos metadados enviados pelo cliente.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  chosen_name text;
begin
  chosen_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'Estudante'
  );

  insert into public.profiles (id, full_name)
  values (new.id, chosen_name)
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, 'student')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;

grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.user_roles to authenticated;

drop policy if exists "Users can read own profile or admins can read all" on public.profiles;
create policy "Users can read own profile or admins can read all"
on public.profiles for select
to authenticated
using (id = auth.uid() or public.has_role('admin'));

drop policy if exists "Users can update own profile or admins can update all" on public.profiles;
create policy "Users can update own profile or admins can update all"
on public.profiles for update
to authenticated
using (id = auth.uid() or public.has_role('admin'))
with check (id = auth.uid() or public.has_role('admin'));

drop policy if exists "Users can read own role or admins can read all" on public.user_roles;
create policy "Users can read own role or admins can read all"
on public.user_roles for select
to authenticated
using (user_id = auth.uid() or public.has_role('admin'));

drop policy if exists "Only admins can manage roles" on public.user_roles;
create policy "Only admins can manage roles"
on public.user_roles for all
to authenticated
using (public.has_role('admin'))
with check (public.has_role('admin'));
