-- The meeting's summary, decisions and action items, as JSON.
alter table public.meetings add column summary jsonb;

-- Allow the new "summarizing" status between transcribing and done.
alter table public.meetings drop constraint meetings_status_check;
alter table public.meetings add constraint meetings_status_check
  check (status in ('uploaded', 'transcribing', 'summarizing', 'done', 'failed'));
