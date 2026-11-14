-- MentorX: estrutura académica de cursos, módulos, aulas e progresso.

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects(id) on delete cascade,
  title text not null,
  slug text not null,
  description text not null default '',
  level text not null default 'Ensino médio',
  cover_image_url text,
  is_published boolean not null default false,
  sort_order integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (subject_id, slug)
);

create table if not exists public.course_modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  description text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.course_modules(id) on delete cascade,
  title text not null,
  description text not null default '',
  lesson_type text not null default 'text'
    check (lesson_type in ('video', 'text', 'pdf', 'exercise', 'live')),
  content text not null default '',
  video_url text,
  resource_url text,
  duration_minutes integer not null default 0 check (duration_minutes >= 0),
  is_preview boolean not null default false,
  is_published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  status text not null default 'in_progress'
    check (status in ('in_progress', 'completed')),
  last_position_seconds integer not null default 0
    check (last_position_seconds >= 0),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

create index if not exists courses_subject_id_idx
  on public.courses(subject_id);
create index if not exists courses_published_idx
  on public.courses(is_published);
create index if not exists course_modules_course_id_idx
  on public.course_modules(course_id);
create index if not exists lessons_module_id_idx
  on public.lessons(module_id);
create index if not exists lessons_published_idx
  on public.lessons(is_published);
create index if not exists lesson_progress_user_id_idx
  on public.lesson_progress(user_id);
create index if not exists lesson_progress_lesson_id_idx
  on public.lesson_progress(lesson_id);

-- Função auxiliar evita depender das políticas RLS de enrollments ao validar acesso.
create or replace function public.is_enrolled_in_subject(_subject_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.enrollments
    where user_id = auth.uid()
      and subject_id = _subject_id
      and status = 'active'
  );
$$;

revoke all on function public.is_enrolled_in_subject(uuid) from public;
grant execute on function public.is_enrolled_in_subject(uuid) to authenticated;

alter table public.courses enable row level security;
alter table public.course_modules enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_progress enable row level security;

grant select, insert, update, delete on public.courses to authenticated;
grant select, insert, update, delete on public.course_modules to authenticated;
grant select, insert, update, delete on public.lessons to authenticated;
grant select, insert, update on public.lesson_progress to authenticated;

drop policy if exists "Students and staff can read accessible courses" on public.courses;
create policy "Students and staff can read accessible courses"
on public.courses for select
to authenticated
using (
  (is_published and public.is_enrolled_in_subject(subject_id))
  or public.has_role('Teacher')
  or public.has_role('Admin')
);

drop policy if exists "Teachers and admins can manage courses" on public.courses;
create policy "Teachers and admins can manage courses"
on public.courses for all
to authenticated
using (public.has_role('Teacher') or public.has_role('Admin'))
with check (public.has_role('Teacher') or public.has_role('Admin'));

drop policy if exists "Students and staff can read accessible modules" on public.course_modules;
create policy "Students and staff can read accessible modules"
on public.course_modules for select
to authenticated
using (
  exists (
    select 1
    from public.courses c
    where c.id = course_id
      and (
        (c.is_published and public.is_enrolled_in_subject(c.subject_id))
        or public.has_role('Teacher')
        or public.has_role('Admin')
      )
  )
);

drop policy if exists "Teachers and admins can manage modules" on public.course_modules;
create policy "Teachers and admins can manage modules"
on public.course_modules for all
to authenticated
using (public.has_role('Teacher') or public.has_role('Admin'))
with check (public.has_role('Teacher') or public.has_role('Admin'));

drop policy if exists "Students and staff can read accessible lessons" on public.lessons;
create policy "Students and staff can read accessible lessons"
on public.lessons for select
to authenticated
using (
  (
    is_published
    and exists (
      select 1
      from public.course_modules m
      join public.courses c on c.id = m.course_id
      where m.id = module_id
        and public.is_enrolled_in_subject(c.subject_id)
        and c.is_published
    )
  )
  or (
    is_preview
    and exists (
      select 1
      from public.course_modules m
      join public.courses c on c.id = m.course_id
      where m.id = module_id
        and c.is_published
    )
  )
  or public.has_role('Teacher')
  or public.has_role('Admin')
);

drop policy if exists "Teachers and admins can manage lessons" on public.lessons;
create policy "Teachers and admins can manage lessons"
on public.lessons for all
to authenticated
using (public.has_role('Teacher') or public.has_role('Admin'))
with check (public.has_role('Teacher') or public.has_role('Admin'));

drop policy if exists "Students can read own lesson progress" on public.lesson_progress;
create policy "Students can read own lesson progress"
on public.lesson_progress for select
to authenticated
using (user_id = auth.uid() or public.has_role('Teacher') or public.has_role('Admin'));

drop policy if exists "Students can create own lesson progress" on public.lesson_progress;
create policy "Students can create own lesson progress"
on public.lesson_progress for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.lessons l
    join public.course_modules m on m.id = l.module_id
    join public.courses c on c.id = m.course_id
    where l.id = lesson_id
      and l.is_published
      and c.is_published
      and public.is_enrolled_in_subject(c.subject_id)
  )
);

drop policy if exists "Students can update own lesson progress" on public.lesson_progress;
create policy "Students can update own lesson progress"
on public.lesson_progress for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop trigger if exists courses_set_updated_at on public.courses;
create trigger courses_set_updated_at
before update on public.courses
for each row execute function public.set_updated_at();

drop trigger if exists course_modules_set_updated_at on public.course_modules;
create trigger course_modules_set_updated_at
before update on public.course_modules
for each row execute function public.set_updated_at();

drop trigger if exists lessons_set_updated_at on public.lessons;
create trigger lessons_set_updated_at
before update on public.lessons
for each row execute function public.set_updated_at();

drop trigger if exists lesson_progress_set_updated_at on public.lesson_progress;
create trigger lesson_progress_set_updated_at
before update on public.lesson_progress
for each row execute function public.set_updated_at();
