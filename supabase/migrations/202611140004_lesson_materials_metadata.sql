-- MentorX: metadata for private lesson materials
create table if not exists public.lesson_materials (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  uploaded_by uuid not null references auth.users(id) on delete restrict,
  file_name text not null,
  file_path text not null unique,
  mime_type text not null,
  file_size bigint not null check (file_size > 0),
  created_at timestamptz not null default now()
);

create index if not exists lesson_materials_lesson_id_idx
  on public.lesson_materials(lesson_id);

alter table public.lesson_materials enable row level security;

drop policy if exists "Staff can manage lesson material metadata" on public.lesson_materials;
create policy "Staff can manage lesson material metadata"
on public.lesson_materials
for all
to authenticated
using (public.has_role('teacher') or public.has_role('admin'))
with check (public.has_role('teacher') or public.has_role('admin'));

drop policy if exists "Students can read authorized lesson material metadata" on public.lesson_materials;
create policy "Students can read authorized lesson material metadata"
on public.lesson_materials
for select
to authenticated
using (
  exists (
    select 1
    from public.lessons l
    join public.course_modules m on m.id = l.module_id
    join public.courses c on c.id = m.course_id
    where l.id = lesson_materials.lesson_id
      and c.is_published = true
      and (
        l.is_preview = true
        or (l.is_published = true and public.is_enrolled_in_subject(c.subject_id))
      )
  )
);
