-- 1. A new status: the transcript is saved, the summary hasn't started yet
alter table public.meetings drop constraint meetings_status_check;
alter table public.meetings add constraint meetings_status_check
  check (status in ('uploaded', 'transcribing', 'transcribed', 'summarizing', 'done', 'failed'));

-- 2. How often each step was tried, and when the meeting last changed
alter table public.meetings
  add column transcribe_attempts integer not null default 0,
  add column summary_attempts integer not null default 0,
  add column updated_at timestamptz not null default now();

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger meetings_set_updated_at
before update on public.meetings
for each row execute function public.set_updated_at();

-- 3. One meeting in progress per user
create unique index meetings_one_in_progress_per_user
  on public.meetings (user_id)
  where status in ('transcribing', 'transcribed', 'summarizing');

-- 4. Start transcribing: claim the meeting and take its credit, in one step
create function public.start_transcription(p_meeting_id uuid, p_user_id uuid, p_free_credits integer)
returns text
language plpgsql
set search_path = ''
as $$
declare
  v_meeting public.meetings;
  v_balance integer;
begin
  -- Requests from the same user pass this line one at a time
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

  -- In progress for more than 10 minutes means it died: mark it failed
  update public.meetings set status = 'failed'
  where user_id = p_user_id
    and status in ('transcribing', 'transcribed', 'summarizing')
    and updated_at < now() - interval '10 minutes';

  select * into v_meeting from public.meetings
  where id = p_meeting_id and user_id = p_user_id;
  if not found then return 'not_found'; end if;

  if v_meeting.status not in ('uploaded', 'failed') or v_meeting.transcript is not null then
    return 'not_allowed';
  end if;
  if v_meeting.transcribe_attempts >= 3 then return 'too_many_attempts'; end if;
  if exists (select 1 from public.meetings where user_id = p_user_id
             and status in ('transcribing', 'transcribed', 'summarizing')) then
    return 'busy';
  end if;

  -- The credit is spent when the work starts, once per meeting; retries are free
  if not exists (select 1 from public.credit_ledger
                 where meeting_id = p_meeting_id and amount < 0) then
    select p_free_credits + coalesce(sum(amount), 0) into v_balance
    from public.credit_ledger where user_id = p_user_id;
    if v_balance < 1 then return 'no_credits'; end if;
    insert into public.credit_ledger (user_id, amount, reason, meeting_id)
    values (p_user_id, -1, 'Meeting processed', p_meeting_id);
  end if;

  update public.meetings
  set status = 'transcribing', transcribe_attempts = transcribe_attempts + 1
  where id = p_meeting_id;
  return 'ok';
end;
$$;

-- 5. Start summarizing: only after a transcript exists; never charges
create function public.start_summary(p_meeting_id uuid, p_user_id uuid)
returns text
language plpgsql
set search_path = ''
as $$
declare
  v_meeting public.meetings;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

  update public.meetings set status = 'failed'
  where user_id = p_user_id
    and status in ('transcribing', 'transcribed', 'summarizing')
    and updated_at < now() - interval '10 minutes';

  select * into v_meeting from public.meetings
  where id = p_meeting_id and user_id = p_user_id;
  if not found then return 'not_found'; end if;

  if v_meeting.transcript is null or v_meeting.status not in ('transcribed', 'failed') then
    return 'not_allowed';
  end if;
  if v_meeting.summary_attempts >= 3 then return 'too_many_attempts'; end if;
  if exists (select 1 from public.meetings where user_id = p_user_id and id <> p_meeting_id
             and status in ('transcribing', 'transcribed', 'summarizing')) then
    return 'busy';
  end if;

  update public.meetings
  set status = 'summarizing', summary_attempts = summary_attempts + 1
  where id = p_meeting_id;
  return 'ok';
end;
$$;

-- 6. Only our server may run these functions
revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.start_transcription(uuid, uuid, integer) from public, anon, authenticated;
revoke execute on function public.start_summary(uuid, uuid) from public, anon, authenticated;
grant execute on function public.start_transcription(uuid, uuid, integer) to service_role;
grant execute on function public.start_summary(uuid, uuid) to service_role;
