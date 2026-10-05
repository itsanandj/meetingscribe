create table public.credit_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  amount integer not null,
  reason text not null,
  meeting_id uuid references public.meetings (id) on delete set null,
  polar_order_id text unique,
  created_at timestamptz not null default now()
);

-- A meeting can only ever be charged once, however many times it's tried
create unique index credit_ledger_one_charge_per_meeting
  on public.credit_ledger (meeting_id) where amount < 0;

grant select on table public.credit_ledger to authenticated;
grant select, insert, update, delete on table public.credit_ledger to service_role;

alter table public.credit_ledger enable row level security;

create policy "Users can view their own credits."
on public.credit_ledger for select
to authenticated
using ( (select auth.uid()) = user_id );
