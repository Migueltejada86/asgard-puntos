insert into shops (id, name, join_code, owner_user_id)
select 'asgard', 'ASGARD ESTUDIO', 'ASGARD-PUBLIC', 'asgard-public'
where not exists (select 1 from shops where id = 'asgard');
