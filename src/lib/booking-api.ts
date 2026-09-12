import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { BARBER_WHATSAPP, waLink } from "@/lib/shop";

export const SHOP_ID = "asgard";

export const BARBERS = ["Marcelo", "Ulises", "Alexis"] as const;
export type BarberName = (typeof BARBERS)[number];

export const SERVICES = [
  { id: "corte", label: "Corte" },
  { id: "barba", label: "Barba" },
  { id: "perfilado", label: "Perfilado" },
  { id: "combo", label: "Corte + Barba" },
] as const;

export const SLOT_TIMES = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
  "21:00",
] as const;

export type SlotRow = {
  time: string;
  taken: BarberName[];
  free: BarberName[];
};

export type AppointmentRow = {
  id: string;
  barber: BarberName;
  startsAt: string;
  service: string;
  clientName: string;
  clientPhone: string;
  status: "booked" | "done" | "cancelled";
};

async function myShop(userId: string) {
  const sql = await getSql();
  const rows = await sql<{
    shop_id: string;
    role: "barber" | "client";
    display_name: string;
  }>`
    select shop_id, role, display_name from profiles where user_id = ${userId} limit 1
  `;
  const p = rows[0];
  if (!p) throw new Error("Completá tu ficha primero");
  return p;
}

function isSunday(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 15, 0, 0)).getUTCDay() === 0;
}

function slotIso(date: string, time: string) {
  return new Date(`${date}T${time}:00-03:00`).toISOString();
}

function isBarber(name: string): name is BarberName {
  return (BARBERS as readonly string[]).includes(name);
}

function occupancyForDay(taken: { barber: BarberName; starts_at: string }[], date: string) {
  const busy = new Set(
    taken.map((t) => {
      const iso = typeof t.starts_at === "string" ? t.starts_at : String(t.starts_at);
      const ar = new Date(iso).toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "America/Argentina/Buenos_Aires",
      });
      return `${t.barber}|${ar}`;
    }),
  );
  const now = Date.now();
  const slots: SlotRow[] = [];
  for (const time of SLOT_TIMES) {
    const startMs = new Date(`${date}T${time}:00-03:00`).getTime();
    if (startMs < now - 60_000) continue;
    const takenHere = BARBERS.filter((b) => busy.has(`${b}|${time}`));
    const free = BARBERS.filter((b) => !busy.has(`${b}|${time}`));
    slots.push({ time, taken: takenHere, free });
  }
  return slots;
}

export const listPublicSlots = createServerFn({ method: "POST" })
  .validator((date: string) => date)
  .handler(async ({ data: date }) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Fecha inválida");
    if (isSunday(date)) return [] as SlotRow[];
    const sql = await getSql();
    const from = slotIso(date, "00:00");
    const to = slotIso(date, "23:59");
    const taken = await sql<{ barber: BarberName; starts_at: string }>`
      select barber, starts_at from appointments
      where shop_id = ${SHOP_ID}
        and status = ${"booked"}
        and starts_at >= ${from}::timestamptz
        and starts_at <= ${to}::timestamptz
    `;
    return occupancyForDay(taken, date);
  });

export const bookPublic = createServerFn({ method: "POST" })
  .validator((d: { date: string; time: string; barber: BarberName; service: string; name: string; phone: string; note?: string }) => d)
  .handler(async ({ data }) => {
    if (!isBarber(data.barber)) throw new Error("Barbero inválido");
    if (!(SLOT_TIMES as readonly string[]).includes(data.time)) throw new Error("Horario inválido");
    if (isSunday(data.date)) throw new Error("Domingo cerrado");
    const service = SERVICES.find((s) => s.id === data.service);
    if (!service) throw new Error("Servicio inválido");
    const name = data.name.replace(/[<>]/g, "").trim().slice(0, 80);
    const phone = data.phone.replace(/[^0-9+\s\-()]/g, "").trim().slice(0, 25);
    if (name.length < 2) throw new Error("Ingresá tu nombre");
    if (phone.length < 8) throw new Error("Ingresá un WhatsApp válido");
    const starts = slotIso(data.date, data.time);
    if (new Date(starts).getTime() < Date.now() - 60_000) throw new Error("Ese horario ya pasó");

    const sql = await getSql();
    const takenBarber = await sql<{ id: string }>`
      select id from appointments
      where shop_id = ${SHOP_ID} and barber = ${data.barber}
        and starts_at = ${starts}::timestamptz and status = ${"booked"}
      limit 1
    `;
    if (takenBarber[0]) throw new Error(`${data.barber} ya tiene un turno a las ${data.time}`);

    const sameTime = await sql<{ n: number }>`
      select count(*)::int as n from appointments
      where shop_id = ${SHOP_ID}
        and starts_at = ${starts}::timestamptz
        and status = ${"booked"}
    `;
    if ((sameTime[0]?.n ?? 0) >= BARBERS.length) {
      throw new Error("Los tres barberos están ocupados a esa hora. No hay un cuarto turno.");
    }

    const note = (data.note ?? "").replace(/[<>]/g, "").trim().slice(0, 200);
    const clientName = note ? `${name} · ${note}` : name;
    const id = crypto.randomUUID();
    try {
      await sql`
        insert into appointments (
          id, shop_id, barber, starts_at, duration_min, service,
          client_name, client_phone, status
        ) values (
          ${id}, ${SHOP_ID}, ${data.barber}, ${starts}::timestamptz, ${30}, ${service.label},
          ${clientName}, ${phone}, ${"booked"}
        )
      `;
    } catch {
      throw new Error(`${data.barber} ya tiene un turno a las ${data.time}`);
    }
    const msg = `NUEVO TURNO para ${data.barber}\n${service.label}\n${name}\n${phone}\n${data.date} ${data.time}\nASGARD ESTUDIO — Belisario Roldán 340`;
    const whatsappUrl = waLink(BARBER_WHATSAPP[data.barber], msg);
    const clientMsg = `Hola ${name}! Confirmamos tu ${service.label} con ${data.barber} el ${data.date} a las ${data.time} en ASGARD ESTUDIO, Belisario Roldán 340.`;
    const clientWhatsappUrl = waLink(phone, clientMsg);
    try {
      await sql`
        update clients set preferred_barber = ${data.barber}, phone = ${phone.replace(/\D/g, "")}
        where shop_id = ${SHOP_ID} and (name = ${name} or phone = ${phone.replace(/\D/g, "")})
      `;
    } catch {
      /* columna phone puede no existir en un deploy viejo */
    }
    return { id, barber: data.barber, time: data.time, date: data.date, service: service.label, whatsappUrl, clientWhatsappUrl };

  });

export const listSlots = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((date: string) => date)
  .handler(async ({ context, data: date }) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Fecha inválida");
    if (isSunday(date)) return [] as SlotRow[];
    const me = await myShop(context.userId);
    const sql = await getSql();
    const from = slotIso(date, "00:00");
    const to = slotIso(date, "23:59");
    const taken = await sql<{ barber: BarberName; starts_at: string }>`
      select barber, starts_at from appointments
      where shop_id = ${me.shop_id}
        and status = ${"booked"}
        and starts_at >= ${from}::timestamptz
        and starts_at <= ${to}::timestamptz
    `;
    return occupancyForDay(taken, date);
  });

export const bookSlot = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { date: string; time: string; barber: BarberName; service: string; phone?: string; clientName?: string }) => d)
  .handler(async ({ context, data }) => {
    if (!isBarber(data.barber)) throw new Error("Barbero inválido");
    if (!(SLOT_TIMES as readonly string[]).includes(data.time)) throw new Error("Horario inválido");
    if (isSunday(data.date)) throw new Error("Domingo cerrado");
    const service = SERVICES.find((s) => s.id === data.service);
    if (!service) throw new Error("Servicio inválido");
    const me = await myShop(context.userId);
    const starts = slotIso(data.date, data.time);
    if (new Date(starts).getTime() < Date.now() - 60_000) throw new Error("Ese horario ya pasó");

    const sql = await getSql();
    const takenBarber = await sql<{ id: string }>`
      select id from appointments
      where shop_id = ${me.shop_id} and barber = ${data.barber}
        and starts_at = ${starts}::timestamptz and status = ${"booked"}
      limit 1
    `;
    if (takenBarber[0]) throw new Error(`${data.barber} ya tiene un turno a las ${data.time}`);

    const sameTime = await sql<{ n: number }>`
      select count(*)::int as n from appointments
      where shop_id = ${me.shop_id}
        and starts_at = ${starts}::timestamptz
        and status = ${"booked"}
    `;
    if ((sameTime[0]?.n ?? 0) >= BARBERS.length) {
      throw new Error("Los tres barberos están ocupados a esa hora");
    }

    let clientName = (data.clientName ?? "").trim();
    let phone = (data.phone ?? "").trim();
    if (me.role === "client") {
      clientName = me.display_name;
    } else if (!clientName) {
      throw new Error("Ingresá el nombre del cliente");
    }

    const id = crypto.randomUUID();
    try {
      await sql`
        insert into appointments (
          id, shop_id, barber, starts_at, duration_min, service,
          client_name, client_phone, client_user_id, status
        ) values (
          ${id}, ${me.shop_id}, ${data.barber}, ${starts}::timestamptz, ${30}, ${service.label},
          ${clientName}, ${phone}, ${me.role === "client" ? context.userId : null}, ${"booked"}
        )
      `;
    } catch {
      throw new Error(`${data.barber} ya tiene un turno a las ${data.time}`);
    }
    const msg = `NUEVO TURNO para ${data.barber}\n${service.label}\n${clientName}\n${phone || "-"}\n${data.date} ${data.time}\nASGARD ESTUDIO — Belisario Roldán 340`;
    const whatsappUrl = waLink(BARBER_WHATSAPP[data.barber], msg);
    return { id, barber: data.barber, time: data.time, date: data.date, service: service.label, whatsappUrl };
  });

export const myAppointments = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const me = await myShop(context.userId);
    const sql = await getSql();
    const mine = BARBERS.find((b) => b.toLowerCase() === me.display_name.trim().toLowerCase());
    const rows =
      me.role === "client"
        ? await sql<{
            id: string;
            barber: BarberName;
            starts_at: string;
            service: string;
            client_name: string;
            client_phone: string;
            status: AppointmentRow["status"];
          }>`
            select id, barber, starts_at, service, client_name, client_phone, status
            from appointments
            where shop_id = ${me.shop_id}
              and client_user_id = ${context.userId}
              and status <> ${"cancelled"}
            order by starts_at
          `
        : mine
          ? await sql<{
            id: string;
            barber: BarberName;
            starts_at: string;
            service: string;
            client_name: string;
            client_phone: string;
            status: AppointmentRow["status"];
          }>`
            select id, barber, starts_at, service, client_name, client_phone, status
            from appointments
            where shop_id = ${me.shop_id}
              and barber = ${mine}
              and status <> ${"cancelled"}
            order by starts_at
          `
        : await sql<{
            id: string;
            barber: BarberName;
            starts_at: string;
            service: string;
            client_name: string;
            client_phone: string;
            status: AppointmentRow["status"];
          }>`
            select id, barber, starts_at, service, client_name, client_phone, status
            from appointments
            where shop_id = ${me.shop_id}
              and status <> ${"cancelled"}
            order by starts_at
          `;
    return rows.map((r) => ({
      id: r.id,
      barber: r.barber,
      startsAt: typeof r.starts_at === "string" ? r.starts_at : String(r.starts_at),
      service: r.service,
      clientName: r.client_name,
      clientPhone: r.client_phone,
      status: r.status,
    })) satisfies AppointmentRow[];
  });

export const cancelAppointment = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: string) => id)
  .handler(async ({ context, data: id }) => {
    const me = await myShop(context.userId);
    const sql = await getSql();
    if (me.role === "client") {
      await sql`
        update appointments set status = ${"cancelled"}
        where id = ${id} and shop_id = ${me.shop_id} and client_user_id = ${context.userId}
          and status = ${"booked"}
      `;
    } else {
      const mine = BARBERS.find((b) => b.toLowerCase() === me.display_name.trim().toLowerCase());
      if (mine) {
        await sql`
          update appointments set status = ${"cancelled"}
          where id = ${id} and shop_id = ${me.shop_id} and barber = ${mine} and status = ${"booked"}
        `;
      } else {
        await sql`
          update appointments set status = ${"cancelled"}
          where id = ${id} and shop_id = ${me.shop_id} and status = ${"booked"}
        `;
      }
    }
  });
