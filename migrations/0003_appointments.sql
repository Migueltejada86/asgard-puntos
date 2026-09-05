create table if not exists appointments (
  id text primary key,
  shop_id text not null references shops(id),
  barber text not null check (barber in ('Marcelo', 'Ulises', 'Alexis')),
  starts_at timestamptz not null,
  duration_min integer not null default 30,
  service text not null,
  client_name text not null,
  client_phone text not null default '',
  client_user_id text,
  status text not null default 'booked' check (status in ('booked', 'done', 'cancelled')),
  created_at timestamptz not null default now()
);

create unique index if not exists appointments_barber_slot_uidx
  on appointments (shop_id, barber, starts_at)
  where status <> 'cancelled';

create index if not exists appointments_shop_day_idx
  on appointments (shop_id, starts_at);
