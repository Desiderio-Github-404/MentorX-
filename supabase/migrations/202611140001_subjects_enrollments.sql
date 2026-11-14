-- MentorX: catálogo de disciplinas e matrículas de estudantes.

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  level text not null default 'Ensino médio',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'cancelled')),
  created_at timestamptz not null default now(),
  unique (user_id, subject_id)
);

create index if not exists enrollments_user_id_idx on public.enrollments(user_id);
create index if not exists enrollments_subject_id_idx on public.enrollments(subject_id);

insert into public.subjects (name, slug, description, level)
values
  ('Matemática', 'matematica', 'Desenvolve o raciocínio lógico, aprende a resolver problemas e domina os principais conteúdos matemáticos.', 'Ensino médio'),
  ('Física', 'fisica', 'Compreende os fenómenos físicos, as leis da natureza e a aplicação da ciência no quotidiano.', 'Ensino médio'),
  ('Electrónica', 'electronica', 'Estuda circuitos, componentes, sistemas analógicos e digitais e aplicações electrónicas.', 'Ensino médio'),
  ('Informática', 'informatica', 'Aprende fundamentos de computação, ferramentas digitais, sistemas e programação.', 'Ensino médio'),
  ('Telecomunicações', 'telecomunicacoes', 'Explora redes, transmissão de sinais, sistemas de comunicação e tecnologias de telecomunicações.', 'Ensino médio'),
  ('Química', 'quimica', 'Estuda a matéria, as suas propriedades, transformações e aplicações práticas.', 'Ensino médio')
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  level = excluded.level;

alter table public.subjects enable row level security;
alter table public.enrollments enable row level security;

grant select on public.subjects to authenticated;
grant insert, update, delete on public.subjects to authenticated;
grant select, insert on public.enrollments to authenticated;

drop policy if exists "Authenticated users can read active subjects" on public.subjects;
create policy "Authenticated users can read active subjects"
on public.subjects for select
to authenticated
using (is_active or public.has_role('admin'));

drop policy if exists "Admins can manage subjects" on public.subjects;
create policy "Admins can manage subjects"
on public.subjects for all
to authenticated
using (public.has_role('admin'))
with check (public.has_role('admin'));

drop policy if exists "Users can read own enrollments or admins can read all" on public.enrollments;
create policy "Users can read own enrollments or admins can read all"
on public.enrollments for select
to authenticated
using (user_id = auth.uid() or public.has_role('admin'));

drop policy if exists "Students can enroll themselves in active subjects" on public.enrollments;
create policy "Students can enroll themselves in active subjects"
on public.enrollments for insert
to authenticated
with check (
  user_id = auth.uid()
  and status = 'active'
  and exists (
    select 1 from public.subjects
    where id = subject_id and is_active = true
  )
  and exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = 'student'
  )
);
