import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { DEMO } from "@/lib/demo";
import { seedDemoReminders } from "@/lib/seed-reminders";
import { SHOP, argentinaToday, toDay } from "@/lib/shop";

export const ACTIONS = [
  { id: "corte", label: "Corte de pelo", points: 20 },
  { id: "combo", label: "Corte + barba", points: 30 },
  { id: "amigo", label: "Traer un amigo", points: 15 },
  { id: "google", label: "Reseña en Google", points: 30 },
  { id: "ig", label: "Historia en IG", points: 10 },
  { id: "comunidad", label: "Unirte a la comunidad", points: 10 },
] as const;

export type Role = "barber" | "client";

export type Profile = {
  userId: string;
  role: Role;
  displayName: string;
  dni: string | null;
  shopId: string;
  shopName: string;
};

export type ClientRow = {
  id: string;
  dni: string;
  name: string;
  points: number;
};

export type PrizeRow = {
  id: string;
  name: string;
  cost: number;
  detail: string;
};

export type ClaimRow = {
  id: string;
  clientId: string;
  prizeName: string;
  code: string;
  status: "pending" | "delivered";
  dni?: string;
};

const DEFAULT_PRIZES: Omit<PrizeRow, "id">[] = [
  { name: "Perfilado gratis", cost: 80, detail: "Canjeable en tu próxima visita" },
  { name: "10% off en cortes", cost: 100, detail: "Descuento en un corte" },
  { name: "15% off en cortes", cost: 160, detail: "Descuento en un corte" },
  { name: "50% combo corte + barba", cost: 180, detail: "Mitad de precio en combo" },
  { name: "Corte gratis", cost: 250, detail: "Un corte completo de cortesía" },
];

function cleanDni(dni: string) {
  return dni.replace(/\D/g, "");
}

function code6() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

async function ensureDemoClients(shopId: string) {
  const sql = await getSql();
  for (const c of DEMO.clients) {
    await sql`
      insert into clients (id, shop_id, dni, name, points)
      values (${c.id}, ${shopId}, ${c.dni}, ${c.name}, ${c.points})
      on conflict (shop_id, dni) do update
        set name = excluded.name,
            points = greatest(clients.points, excluded.points)
    `;
  }
  for (const p of DEFAULT_PRIZES) {
    const exists = await sql<{ id: string }>`select id from prizes where shop_id = ${shopId} and name = ${p.name} limit 1`;
    if (!exists[0]) {
      await sql`
        insert into prizes (id, shop_id, name, cost, detail)
        values (${crypto.randomUUID()}, ${shopId}, ${p.name}, ${p.cost}, ${p.detail})
      `;
    }
  }
}

async function loadProfile(userId: string): Promise<Profile | null> {
  const sql = await getSql();
  const rows = await sql<{
    user_id: string;
    role: Role;
    display_name: string;
    dni: string | null;
    shop_id: string;
    shop_name: string;
  }>`
    select p.user_id, p.role, p.display_name, p.dni, p.shop_id, s.name as shop_name
    from profiles p
    join shops s on s.id = p.shop_id
    where p.user_id = ${userId}
    limit 1
  `;
  const r = rows[0];
  if (!r) return null;
  return {
    userId: r.user_id,
    role: r.role,
    displayName: r.display_name,
    dni: r.dni,
    shopId: r.shop_id,
    shopName: r.shop_name,
  };
}

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    return loadProfile(context.userId);
  });

export const completeOnboarding = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { role: Role; displayName: string; dni?: string; joinCode?: string }) => d)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const existing = await loadProfile(context.userId);
    if (existing) return existing;

    const name = data.displayName.trim();
    if (name.length < 2) throw new Error("Ingresá tu nombre");

    if (data.role === "barber") {
      const code = (data.joinCode ?? "").trim().toUpperCase() || "ASGARD";
      let shopId: string | undefined;
      const found = await sql<{ id: string }>`
        select id from shops
        where join_code = ${code} or join_code = ${"ASGARD-PUBLIC"} or id = ${"asgard"}
        limit 1
      `;
      shopId = found[0]?.id;
      if (!shopId) {
        const shops = await sql<{ id: string }>`select id from shops limit 1`;
        if (shops[0]) {
          throw new Error("El local ya existe. Pedile el código de equipo a Marcelo.");
        }
        shopId = crypto.randomUUID();
        await sql`
          insert into shops (id, name, join_code, owner_user_id)
          values (${shopId}, ${"ASGARD ESTUDIO"}, ${"ASGARD"}, ${context.userId})
        `;
        for (const p of DEFAULT_PRIZES) {
          await sql`
            insert into prizes (id, shop_id, name, cost, detail)
            values (${crypto.randomUUID()}, ${shopId}, ${p.name}, ${p.cost}, ${p.detail})
          `;
        }
      }
      await sql`
        insert into profiles (user_id, role, display_name, dni, shop_id)
        values (${context.userId}, ${"barber"}, ${name}, ${null}, ${shopId})
      `;
      await ensureDemoClients(shopId);
      return loadProfile(context.userId);
    }

    const dni = cleanDni(data.dni ?? "");
    if (dni.length < 7) throw new Error("DNI inválido");
    const shops = await sql<{ id: string; name: string }>`select id, name from shops limit 1`;
    const shop = shops[0];
    if (!shop) throw new Error("El local todavía no activó el sistema. Pedile a un barbero que entre primero.");

    await ensureDemoClients(shop.id);

    const clients = await sql<{ id: string }>`
      select id from clients where shop_id = ${shop.id} and dni = ${dni} limit 1
    `;
    if (clients[0]) {
      await sql`
        update clients set claimed_by_user_id = ${context.userId}, name = ${name}
        where id = ${clients[0].id} and shop_id = ${shop.id}
          and (claimed_by_user_id is null or claimed_by_user_id = ${context.userId})
      `;
    } else {
      await sql`
        insert into clients (id, shop_id, dni, name, points, claimed_by_user_id)
        values (${crypto.randomUUID()}, ${shop.id}, ${dni}, ${name}, ${0}, ${context.userId})
      `;
    }
    await sql`
      insert into profiles (user_id, role, display_name, dni, shop_id)
      values (${context.userId}, ${"client"}, ${name}, ${dni}, ${shop.id})
    `;
    return loadProfile(context.userId);
  });

export const getClientHome = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const profile = await loadProfile(context.userId);
    if (!profile || profile.role !== "client" || !profile.dni) throw new Error("No sos cliente");
    const sql = await getSql();
    const clients = await sql<ClientRow>`
      select id, dni, name, points from clients
      where shop_id = ${profile.shopId} and dni = ${profile.dni} limit 1
    `;
    const client = clients[0];
    if (!client) throw new Error("No encontramos tu ficha");
    try {
      await seedDemoReminders(profile.shopId);
    } catch {
      /* seed de avisos es opcional para la ficha del cliente */
    }
    const extra = await sql<{
      last_visit_at: unknown;
      birthday_md: string | null;
      preferred_barber: string | null;
    }>`
      select last_visit_at, birthday_md, preferred_barber
      from clients where id = ${client.id} and shop_id = ${profile.shopId} limit 1
    `;
    const prizes = await sql<PrizeRow>`
      select id, name, cost, detail from prizes where shop_id = ${profile.shopId} order by cost
    `;
    const claims = await sql<ClaimRow>`
      select id, client_id as "clientId", prize_name as "prizeName", code, status
      from claims where shop_id = ${profile.shopId} and client_id = ${client.id}
      order by created_at desc
    `;
    const from = new Date().toISOString();
    const upcomingRows = await sql<{
      barber: string;
      starts_at: string;
      service: string;
    }>`
      select barber, starts_at, service
      from appointments
      where shop_id = ${profile.shopId}
        and status = ${"booked"}
        and starts_at >= ${from}::timestamptz
        and (
          client_user_id = ${context.userId}
          or lower(client_name) = ${client.name.toLowerCase()}
        )
      order by starts_at
      limit 1
    `;
    const lastVisit = toDay(extra[0]?.last_visit_at);
    const recutDue = lastVisit
      ? new Date(`${lastVisit}T12:00:00-03:00`).getTime() + SHOP.recutDays * 86400000 <= Date.now()
      : false;
    const { md } = argentinaToday();
    const upcoming = upcomingRows[0]
      ? {
          barber: upcomingRows[0].barber,
          startsAt: typeof upcomingRows[0].starts_at === "string" ? upcomingRows[0].starts_at : String(upcomingRows[0].starts_at),
          service: upcomingRows[0].service,
        }
      : null;
    return {
      profile,
      client,
      prizes,
      claims,
      lastVisit,
      recutDue,
      birthdayToday: extra[0]?.birthday_md === md,
      preferredBarber: extra[0]?.preferred_barber ?? null,
      upcoming,
    };
  });

export const claimPrize = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((prizeId: string) => prizeId)
  .handler(async ({ context, data: prizeId }) => {
    const profile = await loadProfile(context.userId);
    if (!profile || profile.role !== "client" || !profile.dni) throw new Error("No sos cliente");
    const sql = await getSql();
    const clients = await sql<ClientRow>`
      select id, dni, name, points from clients
      where shop_id = ${profile.shopId} and dni = ${profile.dni} limit 1
    `;
    const client = clients[0];
    const prizes = await sql<PrizeRow>`select id, name, cost, detail from prizes where id = ${prizeId} and shop_id = ${profile.shopId} limit 1`;
    const prize = prizes[0];
    if (!client || !prize) throw new Error("Premio no disponible");
    if (client.points < prize.cost) throw new Error("Todavía no te alcanzan los puntos");
    const pending = await sql<{ id: string }>`
      select id from claims
      where shop_id = ${profile.shopId} and client_id = ${client.id} and prize_id = ${prize.id} and status = ${"pending"}
      limit 1
    `;
    if (pending[0]) throw new Error("Ya tenés este premio pendiente de canje");
    const code = code6();
    const claimId = crypto.randomUUID();
    await sql`update clients set points = points - ${prize.cost} where id = ${client.id} and shop_id = ${profile.shopId}`;
    await sql`
      insert into claims (id, shop_id, client_id, prize_id, prize_name, code, status)
      values (${claimId}, ${profile.shopId}, ${client.id}, ${prize.id}, ${prize.name}, ${code}, ${"pending"})
    `;
    await sql`
      insert into ledger (id, shop_id, client_id, label, delta, actor_user_id)
      values (${crypto.randomUUID()}, ${profile.shopId}, ${client.id}, ${"Canje: " + prize.name}, ${-prize.cost}, ${context.userId})
    `;
    return { code, prizeName: prize.name };
  });

export const lookupClient = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((dni: string) => cleanDni(dni))
  .handler(async ({ context, data: dni }) => {
    const profile = await loadProfile(context.userId);
    if (!profile || profile.role !== "barber") throw new Error("Solo barberos");
    if (dni.length < 7) return null;
    const sql = await getSql();
    const rows = await sql<ClientRow>`
      select id, dni, name, points from clients where shop_id = ${profile.shopId} and dni = ${dni} limit 1
    `;
    return rows[0] ?? null;
  });

export const registerClient = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { dni: string; name: string }) => ({ dni: cleanDni(d.dni), name: d.name.trim() }))
  .handler(async ({ context, data }) => {
    const profile = await loadProfile(context.userId);
    if (!profile || profile.role !== "barber") throw new Error("Solo barberos");
    if (data.dni.length < 7) throw new Error("DNI inválido");
    if (data.name.length < 3) throw new Error("Ingresá el nombre completo");
    const sql = await getSql();
    const exists = await sql<{ id: string }>`
      select id from clients where shop_id = ${profile.shopId} and dni = ${data.dni} limit 1
    `;
    if (exists[0]) throw new Error("Ese DNI ya está cargado");
    const id = crypto.randomUUID();
    await sql`
      insert into clients (id, shop_id, dni, name, points)
      values (${id}, ${profile.shopId}, ${data.dni}, ${data.name}, ${0})
    `;
    return { id, dni: data.dni, name: data.name, points: 0 } satisfies ClientRow;
  });

export const addPoints = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { dni: string; delta: number; label: string }) => ({
    dni: cleanDni(d.dni),
    delta: Number(d.delta),
    label: d.label.trim().slice(0, 80),
  }))
  .handler(async ({ context, data }) => {
    const profile = await loadProfile(context.userId);
    if (!profile || profile.role !== "barber") throw new Error("Solo barberos");
    if (!Number.isFinite(data.delta) || data.delta === 0) throw new Error("Cantidad inválida");
    const sql = await getSql();
    const rows = await sql<ClientRow>`
      select id, dni, name, points from clients where shop_id = ${profile.shopId} and dni = ${data.dni} limit 1
    `;
    const client = rows[0];
    if (!client) throw new Error("Cliente no encontrado. Registralo primero.");
    await sql`update clients set points = greatest(0, points + ${data.delta}) where id = ${client.id} and shop_id = ${profile.shopId}`;
    if (data.delta > 0 && /corte|barba|combo|perfilado/i.test(data.label)) {
      await sql`
        update clients set last_visit_at = current_date, preferred_barber = ${profile.displayName}
        where id = ${client.id} and shop_id = ${profile.shopId}
      `;
    }
    await sql`
      insert into ledger (id, shop_id, client_id, label, delta, actor_user_id)
      values (${crypto.randomUUID()}, ${profile.shopId}, ${client.id}, ${data.label || "Carga"}, ${data.delta}, ${context.userId})
    `;
    const next = await sql<ClientRow>`
      select id, dni, name, points from clients where id = ${client.id} and shop_id = ${profile.shopId} limit 1
    `;
    return next[0];
  });

export const listPrizes = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const profile = await loadProfile(context.userId);
    if (!profile) throw new Error("Sin perfil");
    const sql = await getSql();
    return sql<PrizeRow>`
      select id, name, cost, detail from prizes where shop_id = ${profile.shopId} order by cost
    `;
  });

export const upsertPrize = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { id?: string; name: string; cost: number; detail: string }) => d)
  .handler(async ({ context, data }) => {
    const profile = await loadProfile(context.userId);
    if (!profile || profile.role !== "barber") throw new Error("Solo barberos");
    const sql = await getSql();
    const name = data.name.trim();
    const cost = Number(data.cost) || 0;
    const detail = data.detail.trim() || "Premio ASGARD";
    if (!name) throw new Error("Nombre requerido");
    if (data.id) {
      await sql`
        update prizes set name = ${name}, cost = ${cost}, detail = ${detail}
        where id = ${data.id} and shop_id = ${profile.shopId}
      `;
      return data.id;
    }
    const id = crypto.randomUUID();
    await sql`
      insert into prizes (id, shop_id, name, cost, detail)
      values (${id}, ${profile.shopId}, ${name}, ${cost}, ${detail})
    `;
    return id;
  });

export const removePrize = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: string) => id)
  .handler(async ({ context, data: id }) => {
    const profile = await loadProfile(context.userId);
    if (!profile || profile.role !== "barber") throw new Error("Solo barberos");
    const sql = await getSql();
    await sql`delete from prizes where id = ${id} and shop_id = ${profile.shopId}`;
  });

export const listPendingClaims = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const profile = await loadProfile(context.userId);
    if (!profile || profile.role !== "barber") throw new Error("Solo barberos");
    const sql = await getSql();
    return sql<ClaimRow>`
      select cl.id, cl.client_id as "clientId", cl.prize_name as "prizeName", cl.code, cl.status, c.dni
      from claims cl
      join clients c on c.id = cl.client_id
      where cl.shop_id = ${profile.shopId} and cl.status = ${"pending"}
      order by cl.created_at desc
    `;
  });

export const deliverClaim = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((code: string) => code.trim().toUpperCase())
  .handler(async ({ context, data: code }) => {
    const profile = await loadProfile(context.userId);
    if (!profile || profile.role !== "barber") throw new Error("Solo barberos");
    const sql = await getSql();
    const rows = await sql<{ id: string; prize_name: string; status: string }>`
      select id, prize_name, status from claims where shop_id = ${profile.shopId} and code = ${code} limit 1
    `;
    const c = rows[0];
    if (!c) throw new Error("Código no válido");
    if (c.status === "delivered") throw new Error("Ese premio ya fue entregado");
    await sql`update claims set status = ${"delivered"} where id = ${c.id} and shop_id = ${profile.shopId}`;
    return { prizeName: c.prize_name };
  });

export const listClients = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const profile = await loadProfile(context.userId);
    if (!profile || profile.role !== "barber") throw new Error("Solo barberos");
    await ensureDemoClients(profile.shopId);
    const sql = await getSql();
    return sql<ClientRow>`
      select id, dni, name, points from clients
      where shop_id = ${profile.shopId}
      order by points desc, name
    `;
  });

export const getBarberHome = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const profile = await loadProfile(context.userId);
    if (!profile || profile.role !== "barber") throw new Error("Solo barberos");
    await ensureDemoClients(profile.shopId);
    const sql = await getSql();
    const clients = await sql<ClientRow>`
      select id, dni, name, points from clients
      where shop_id = ${profile.shopId}
      order by points desc, name
    `;
    const prizes = await sql<PrizeRow>`
      select id, name, cost, detail from prizes where shop_id = ${profile.shopId} order by cost
    `;
    const claims = await sql<ClaimRow>`
      select cl.id, cl.client_id as "clientId", cl.prize_name as "prizeName", cl.code, cl.status, c.dni
      from claims cl
      join clients c on c.id = cl.client_id
      where cl.shop_id = ${profile.shopId} and cl.status = ${"pending"}
      order by cl.created_at desc
    `;
    return { profile, clients, prizes, claims };
  });

export const exportShop = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const profile = await loadProfile(context.userId);
    if (!profile || profile.role !== "barber") throw new Error("Solo barberos");
    const sql = await getSql();
    const clients = await sql`select dni, name, points from clients where shop_id = ${profile.shopId} order by name`;
    const prizes = await sql`select name, cost, detail from prizes where shop_id = ${profile.shopId} order by cost`;
    return JSON.stringify({ shop: profile.shopName, clients, prizes }, null, 2);
  });
