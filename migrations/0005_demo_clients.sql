update shops set join_code = 'ASGARD' where id = 'asgard';

insert into prizes (id, shop_id, name, cost, detail)
select 'prize-perfilado', 'asgard', 'Perfilado gratis', 80, 'Canjeable en tu próxima visita'
where not exists (select 1 from prizes where id = 'prize-perfilado');

insert into prizes (id, shop_id, name, cost, detail)
select 'prize-10', 'asgard', '10% off en cortes', 100, 'Descuento en un corte'
where not exists (select 1 from prizes where id = 'prize-10');

insert into prizes (id, shop_id, name, cost, detail)
select 'prize-15', 'asgard', '15% off en cortes', 160, 'Descuento en un corte'
where not exists (select 1 from prizes where id = 'prize-15');

insert into prizes (id, shop_id, name, cost, detail)
select 'prize-combo', 'asgard', '50% combo corte + barba', 180, 'Mitad de precio en combo'
where not exists (select 1 from prizes where id = 'prize-combo');

insert into prizes (id, shop_id, name, cost, detail)
select 'prize-corte', 'asgard', 'Corte gratis', 250, 'Un corte completo de cortesía'
where not exists (select 1 from prizes where id = 'prize-corte');

insert into clients (id, shop_id, dni, name, points)
select 'cli-braian', 'asgard', '30403722', 'Braian Cortez', 130
where not exists (select 1 from clients where shop_id = 'asgard' and dni = '30403722');

insert into clients (id, shop_id, dni, name, points)
select 'cli-lucia', 'asgard', '38765432', 'Lucía Benítez', 80
where not exists (select 1 from clients where shop_id = 'asgard' and dni = '38765432');

insert into clients (id, shop_id, dni, name, points)
select 'cli-franco', 'asgard', '40111222', 'Franco Díaz', 45
where not exists (select 1 from clients where shop_id = 'asgard' and dni = '40111222');

insert into clients (id, shop_id, dni, name, points)
select 'cli-sofia', 'asgard', '35901876', 'Sofía Herrera', 180
where not exists (select 1 from clients where shop_id = 'asgard' and dni = '35901876');
