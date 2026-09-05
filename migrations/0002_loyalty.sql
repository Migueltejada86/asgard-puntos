create table if not exists shops (
  id text primary key,
  name text not null,
  join_code text not null unique,
  owner_user_id text not null,
  created_at timestamptz not null default now()
);

create table if not exists profiles (
  user_id text primary key,
  role text not null check (role in ('barber', 'client')),
  display_name text not null,
  dni text,
  shop_id text not null references shops(id),
  created_at timestamptz not null default now()
);
create index if not exists profiles_shop_id_idx on profiles (shop_id);
create unique index if not exists profiles_shop_dni_uidx on profiles (shop_id, dni) where dni is not null;

create table if not exists clients (
  id text primary key,
  shop_id text not null references shops(id),
  dni text not null,
  name text not null,
  points integer not null default 0,
  claimed_by_user_id text,
  created_at timestamptz not null default now(),
  unique (shop_id, dni)
);
create index if not exists clients_shop_id_idx on clients (shop_id);

create table if not exists prizes (
  id text primary key,
  shop_id text not null references shops(id),
  name text not null,
  cost integer not null,
  detail text not null default ''
);
create index if not exists prizes_shop_id_idx on prizes (shop_id);

create table if not exists claims (
  id text primary key,
  shop_id text not null references shops(id),
  client_id text not null references clients(id),
  prize_id text not null,
  prize_name text not null,
  code text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);
create index if not exists claims_shop_id_idx on claims (shop_id);

create table if not exists ledger (
  id text primary key,
  shop_id text not null references shops(id),
  client_id text not null references clients(id),
  label text not null,
  delta integer not null,
  actor_user_id text not null,
  created_at timestamptz not null default now()
);
create index if not exists ledger_shop_id_idx on ledger (shop_id);
