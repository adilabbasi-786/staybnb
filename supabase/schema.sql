-- Run this in the Supabase SQL editor (Dashboard → SQL).
-- Creates profiles, listings, bookings, storage bucket policies, and auth trigger.

-- Extensions
create extension if not exists "uuid-ossp";

-- Profiles (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  email text not null default '',
  role text not null default 'guest' check (role in ('guest', 'host')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Listings
create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  price numeric(12,2) not null check (price >= 0),
  location text not null,
  host_id uuid not null references public.profiles (id) on delete cascade,
  images text[] not null default '{}',
  max_guests int not null default 2 check (max_guests >= 1),
  created_at timestamptz not null default now()
);

create index if not exists listings_host_id_idx on public.listings (host_id);
create index if not exists listings_location_idx on public.listings using gin (to_tsvector('english', location));

alter table public.listings enable row level security;

create policy "Listings are viewable by everyone"
  on public.listings for select
  using (true);

create policy "Hosts can insert listings"
  on public.listings for insert
  with check (auth.uid() = host_id);

create policy "Hosts can update own listings"
  on public.listings for update
  using (auth.uid() = host_id);

create policy "Hosts can delete own listings"
  on public.listings for delete
  using (auth.uid() = host_id);

-- Bookings
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  check_in date not null,
  check_out date not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled')),
  payment_note text not null default 'Payment will be collected in cash upon arrival.',
  created_at timestamptz not null default now(),
  constraint check_out_after_check_in check (check_out > check_in)
);

create index if not exists bookings_listing_id_idx on public.bookings (listing_id);
create index if not exists bookings_user_id_idx on public.bookings (user_id);

alter table public.bookings enable row level security;

create policy "Guests see own bookings"
  on public.bookings for select
  using (auth.uid() = user_id);

create policy "Hosts see bookings for their listings"
  on public.bookings for select
  using (
    exists (
      select 1 from public.listings l
      where l.id = bookings.listing_id and l.host_id = auth.uid()
    )
  );

create policy "Guests can create bookings"
  on public.bookings for insert
  with check (auth.uid() = user_id);

create policy "Users can cancel own bookings"
  on public.bookings for update
  using (auth.uid() = user_id);

-- New user → profile
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.email, ''),
    case
      when (new.raw_user_meta_data->>'role') in ('guest', 'host')
      then (new.raw_user_meta_data->>'role')
      else 'guest'
    end
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Storage: create bucket "listing-images" in Dashboard → Storage, set public.
-- Then run policies (adjust bucket name if different):

insert into storage.buckets (id, name, public)
values ('listing-images', 'listing-images', true)
on conflict (id) do nothing;

create policy "Listing images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'listing-images');

create policy "Authenticated users can upload listing images"
  on storage.objects for insert
  with check (
    bucket_id = 'listing-images'
    and auth.role() = 'authenticated'
  );

create policy "Users can update own uploads in listing-images"
  on storage.objects for update
  using (bucket_id = 'listing-images' and auth.uid() = owner);

create policy "Users can delete own uploads in listing-images"
  on storage.objects for delete
  using (bucket_id = 'listing-images' and auth.uid() = owner);
