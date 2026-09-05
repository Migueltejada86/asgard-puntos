-- Mini ficha ASGARD: 4 clientes con puntos para probar el tablero.

insert into shops (id, name, join_code, owner_user_id)
values ('asgard', 'ASGARD ESTUDIO', 'ASGARD', 'asgard-public')
on conflict (id) do update set join_code = excluded.join_code, name = excluded.name;

insert into clients (id, shop_id, dni, name, points)
values
  ('cli-sofia', 'asgard', '35901876', 'Sofía Herrera', 180),
  ('cli-braian', 'asgard', '30403722', 'Braian Cortez', 130),
  ('cli-lucia', 'asgard', '38765432', 'Lucía Benítez', 80),
  ('cli-franco', 'asgard', '40111222', 'Franco Díaz', 45)
on conflict (shop_id, dni) do update
  set name = excluded.name,
      points = greatest(clients.points, excluded.points);

insert into prizes (id, shop_id, name, cost, detail)
select 'prz-perfilado', 'asgard', 'Perfilado gratis', 80, 'Canjeable en tu próxima visita'
where not exists (select 1 from prizes where shop_id = 'asgard' and name = 'Perfilado gratis');

insert into prizes (id, shop_id, name, cost, detail)
select 'prz-10', 'asgard', '10% off en cortes', 100, 'Descuento en un corte'
where not exists (select 1 from prizes where shop_id = 'asgard' and name = '10% off en cortes');

insert into prizes (id, shop_id, name, cost, detail)
select 'prz-15', 'asgard', '15% off en cortes', 160, 'Descuento en un corte'
where not exists (select 1 from prizes where shop_id = 'asgard' and name = '15% off en cortes');

insert into prizes (id, shop_id, name, cost, detail)
select 'prz-50', 'asgard', '50% combo corte + barba', 180, 'Mitad de precio en combo'
where not exists (select 1 from prizes where shop_id = 'asgard' and name = '50% combo corte + barba');

insert into prizes (id, shop_id, name, cost, detail)
select 'prz-corte', 'asgard', 'Corte gratis', 250, 'Un corte completo de cortesía'
where not exists (select 1 from prizes where shop_id = 'asgard' and name = 'Corte gratis');
