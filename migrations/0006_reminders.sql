alter table clients add column if not exists phone text not null default '';
alter table clients add column if not exists birthday_md text;
alter table clients add column if not exists last_visit_at date;
alter table clients add column if not exists preferred_barber text;
