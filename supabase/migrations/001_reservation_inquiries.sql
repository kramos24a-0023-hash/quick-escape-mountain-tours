create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users(id) on delete cascade,
  customer_name text,
  customer_email text,
  reservation_id text,
  subject text not null check (char_length(trim(subject)) between 1 and 160),
  category text not null check (
    category in (
      'General Reservation Inquiry',
      'Availability',
      'Pricing',
      'Special Request',
      'Event or Group Booking',
      'Existing Reservation'
    )
  ),
  status text not null default 'Open' check (status in ('Open', 'Pending', 'Resolved', 'Closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_message_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  sender_role text not null check (sender_role in ('customer', 'admin')),
  message_text text not null check (char_length(trim(message_text)) between 1 and 2000),
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists conversations_customer_id_idx on public.conversations(customer_id);
create index if not exists conversations_status_idx on public.conversations(status);
create index if not exists conversations_category_idx on public.conversations(category);
create index if not exists conversations_last_message_at_idx on public.conversations(last_message_at desc);
create index if not exists messages_conversation_id_created_at_idx on public.messages(conversation_id, created_at);
create index if not exists messages_unread_idx on public.messages(conversation_id, is_read, sender_role);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
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

drop trigger if exists conversations_set_updated_at on public.conversations;
create trigger conversations_set_updated_at
before update on public.conversations
for each row execute function public.set_updated_at();

create or replace function public.touch_conversation_after_message()
returns trigger
language plpgsql
as $$
begin
  update public.conversations
  set last_message_at = new.created_at,
      updated_at = now()
  where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists messages_touch_conversation on public.messages;
create trigger messages_touch_conversation
after insert on public.messages
for each row execute function public.touch_conversation_after_message();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'), 'customer')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_admin(user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = user_id and role = 'admin'
  );
$$;

create or replace view public.conversation_summaries as
select
  c.*,
  latest.message_text as latest_message_text,
  count(m.id) filter (where m.is_read = false and m.sender_role = 'customer')::int as unread_count
from public.conversations c
left join lateral (
  select message_text
  from public.messages
  where conversation_id = c.id
  order by created_at desc
  limit 1
) latest on true
left join public.messages m on m.conversation_id = c.id
group by c.id, latest.message_text;

alter table public.profiles enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

drop policy if exists "Profiles are visible to self and admins" on public.profiles;
create policy "Profiles are visible to self and admins"
on public.profiles for select
using (id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "Users can update their profile" on public.profiles;
create policy "Users can update their profile"
on public.profiles for update
using (id = auth.uid())
with check (id = auth.uid() and role = 'customer');

drop policy if exists "Customers can create conversations" on public.conversations;
create policy "Customers can create conversations"
on public.conversations for insert
with check (customer_id = auth.uid());

drop policy if exists "Conversation access is limited to owner or admin" on public.conversations;
create policy "Conversation access is limited to owner or admin"
on public.conversations for select
using (customer_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "Admins can manage conversation status" on public.conversations;
create policy "Admins can manage conversation status"
on public.conversations for update
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "Customers can send messages to their conversations" on public.messages;
create policy "Customers can send messages to their conversations"
on public.messages for insert
with check (
  sender_id = auth.uid()
  and sender_role = 'customer'
  and exists (
    select 1 from public.conversations c
    where c.id = conversation_id and c.customer_id = auth.uid()
  )
);

drop policy if exists "Admins can reply to conversations" on public.messages;
create policy "Admins can reply to conversations"
on public.messages for insert
with check (
  sender_id = auth.uid()
  and sender_role = 'admin'
  and public.is_admin(auth.uid())
);

drop policy if exists "Messages are visible to owner or admin" on public.messages;
create policy "Messages are visible to owner or admin"
on public.messages for select
using (
  public.is_admin(auth.uid())
  or exists (
    select 1 from public.conversations c
    where c.id = conversation_id and c.customer_id = auth.uid()
  )
);

drop policy if exists "Conversation participants can mark messages read" on public.messages;
create policy "Conversation participants can mark messages read"
on public.messages for update
using (
  public.is_admin(auth.uid())
  or exists (
    select 1 from public.conversations c
    where c.id = conversation_id and c.customer_id = auth.uid()
  )
)
with check (
  public.is_admin(auth.uid())
  or exists (
    select 1 from public.conversations c
    where c.id = conversation_id and c.customer_id = auth.uid()
  )
);
