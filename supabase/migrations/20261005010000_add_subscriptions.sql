create table public.subscriptions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  polar_customer_id text not null,
  polar_subscription_id text not null unique,
  status text not null,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  updated_at timestamptz not null default now()
);

grant select on table public.subscriptions to authenticated;
grant select, insert, update, delete on table public.subscriptions to service_role;

alter table public.subscriptions enable row level security;

create policy "Users can view their own subscription."
on public.subscriptions for select
to authenticated
using ( (select auth.uid()) = user_id );
