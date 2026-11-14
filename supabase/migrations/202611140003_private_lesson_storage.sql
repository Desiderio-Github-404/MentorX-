-- MentorX: armazenamento privado de materiais das aulas.
-- Os objectos seguem o formato: <lesson_id>/<nome-do-ficheiro>.

insert into storage.buckets (
  id, name, public, file_size_limit, allowed_mime_types
)
values (
  'lesson-materials', 'lesson-materials', false, 52428800,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg', 'image/png', 'image/webp'
  ]
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Staff can upload lesson materials" on storage.objects;
create policy "Staff can upload lesson materials"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'lesson-materials'
  and (public.has_role('teacher') or public.has_role('admin'))
);

drop policy if exists "Students and staff can read lesson materials" on storage.objects;
create policy "Students and staff can read lesson materials"
on storage.objects for select to authenticated
using (
  bucket_id = 'lesson-materials'
  and (
    public.has_role('teacher')
    or public.has_role('admin')
    or exists (
      select 1
      from public.lessons l
      join public.course_modules m on m.id = l.module_id
      join public.courses c on c.id = m.course_id
      where l.id::text = split_part(storage.objects.name, '/', 1)
        and c.is_published
        and (
          (l.is_published and public.is_enrolled_in_subject(c.subject_id))
          or l.is_preview
        )
    )
  )
);

drop policy if exists "Staff can update lesson materials" on storage.objects;
create policy "Staff can update lesson materials"
on storage.objects for update to authenticated
using (
  bucket_id = 'lesson-materials'
  and (public.has_role('teacher') or public.has_role('admin'))
)
with check (
  bucket_id = 'lesson-materials'
  and (public.has_role('teacher') or public.has_role('admin'))
);

drop policy if exists "Staff can delete lesson materials" on storage.objects;
create policy "Staff can delete lesson materials"
on storage.objects for delete to authenticated
using (
  bucket_id = 'lesson-materials'
  and (public.has_role('teacher') or public.has_role('admin'))
);
