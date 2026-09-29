-- 1. The meetings table
create table public.meetings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null,
  file_path text not null,
  file_size bigint not null,
  status text not null default 'uploaded'
    check (status in ('uploaded', 'transcribing', 'done', 'failed')),
  created_at timestamptz not null default now()
);

-- 2. Lock one: grants — who can reach the table, and what they may do
-- Start from nothing: this project's defaults give anon and authenticated
-- full access to every new table, so remove that before granting.
revoke all on table public.meetings from anon, authenticated;
-- Logged-in users: read and delete, and add a meeting by filling in only these three columns
grant select, delete on table public.meetings to authenticated;
grant insert (title, file_path, file_size) on table public.meetings to authenticated;
-- Our own server (from Lesson 10): everything
grant select, insert, update, delete on table public.meetings to service_role;

-- 3. Lock two: Row Level Security — each user only touches their own rows
alter table public.meetings enable row level security;

create policy "Users can view their own meetings."
on public.meetings for select
to authenticated
using ( (select auth.uid()) = user_id );

create policy "Users can create their own meetings."
on public.meetings for insert
to authenticated
with check ( (select auth.uid()) = user_id );

create policy "Users can delete their own meetings."
on public.meetings for delete
to authenticated
using ( (select auth.uid()) = user_id );

-- 4. A private bucket for recordings: 25 MB max, audio files only
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('recordings', 'recordings', false, 26214400, array['audio/*']);

-- 5. Each user can only upload, see, and delete files in a folder named after their own user ID
create policy "Users can upload their own recordings."
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'recordings' and
  (storage.foldername(name))[1] = (select auth.jwt()->>'sub')
);

create policy "Users can view their own recordings."
on storage.objects for select
to authenticated
using (
  bucket_id = 'recordings' and
  (storage.foldername(name))[1] = (select auth.jwt()->>'sub')
);

create policy "Users can delete their own recordings."
on storage.objects for delete
to authenticated
using (
  bucket_id = 'recordings' and
  (storage.foldername(name))[1] = (select auth.jwt()->>'sub')
);
