import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import type { BarberName } from "@/lib/booking-api";
import { SHOP, argentinaToday, toDay, waLink } from "@/lib/shop";
import { seedDemoReminders } from "@/lib/seed-reminders";

export type ReminderKind = "birthday" | "recut" | "hour";

export type ReminderRow = {
  kind: ReminderKind;
  title: string;
  detail: string;
  name: string;
  phone: string;
  wa: string;
  barber?: string;
};

async function shopOf(userId: string) {
  const sql = await getSql();
  const rows = await sql<{ shop_id: string; role: string; display_name: string }>`
    select shop_id, role, display_name from profiles where user_id = ${userId} limit 1
  `;
  const p = rows[0];
  if (!p || p.role !== "barber") throw new Error("Solo barberos");
  return p;
}

function birthdayWindow(md: string | null, todayMd: string): "today" | "soon" | null {
  if (!md || md.length < 5) return null;
  if (md === todayMd) return "today";
  const [tm, td] = todayMd.split("-").map(Number);
  for (const add of [1, 2]) {
    const d = new Date(Date.UTC(2026, tm - 1, td));
    d.setUTCDate(d.getUTCDate() + add);
    const next = `${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
    if (md === next) return "soon";
  }
  return null;
}

export const listReminders = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const me = await shopOf(context.userId);
    await seedDemoReminders(me.shop_id);
    const sql = await getSql();
    const { md } = argentinaToday();
    const clients = await sql<{
      name: string;
      phone: string;
      birthday_md: string | null;
      last_visit_at: unknown;
      preferred_barber: string | null;
    }>`
      select name, phone, birthday_md, last_visit_at, preferred_barber
      from clients where shop_id = ${me.shop_id}
    `;

    const out: ReminderRow[] = [];
    for (const c of clients) {
      const phone = c.phone || SHOP.whatsapp;
      const whenB = birthdayWindow(c.birthday_md, md);
      if (whenB) {
        const text =
          whenB === "today"
            ? `Hola ${c.name}! En ASGARD ESTUDIO te deseamos un muy feliz cumple. Cuando quieras, te esperamos a cortarte.`
            : `Hola ${c.name}! Se viene tu cumple. En ASGARD ESTUDIO te esperamos a celebrarlo con un corte.`;
        out.push({
          kind: "birthday",
          title: whenB === "today" ? "Cumpleaños hoy" : "Cumple en 1-2 días",
          detail: c.preferred_barber ? `${c.name} · silla de ${c.preferred_barber}` : c.name,
          name: c.name,
          phone,
          wa: waLink(phone, text),
          barber: c.preferred_barber ?? undefined,
        });
      }
      const lastDay = toDay(c.last_visit_at);
      if (lastDay) {
        const last = new Date(`${lastDay}T12:00:00-03:00`).getTime();
        const due = last + SHOP.recutDays * 86400000;
        if (due <= Date.now()) {
          const barber = c.preferred_barber ? ` con ${c.preferred_barber}` : "";
          const text = `Hola ${c.name}! Pasaron ${SHOP.recutDays} días de tu último corte${barber}. ¿Reservamos el próximo en ASGARD ESTUDIO?`;
          out.push({
            kind: "recut",
            title: `Próximo corte (${SHOP.recutDays} días)`,
            detail: `${c.name} · última visita ${lastDay}`,
            name: c.name,
            phone,
            wa: waLink(phone, text),
            barber: c.preferred_barber ?? undefined,
          });
        }
      }
    }

    const from = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const to = new Date(Date.now() + 70 * 60 * 1000).toISOString();
    const soon = await sql<{
      client_name: string;
      client_phone: string;
      barber: BarberName;
      starts_at: string;
      service: string;
    }>`
      select client_name, client_phone, barber, starts_at, service
      from appointments
      where shop_id = ${me.shop_id}
        and status = ${"booked"}
        and starts_at >= ${from}::timestamptz
        and starts_at <= ${to}::timestamptz
      order by starts_at
    `;
    for (const a of soon) {
      const when = new Date(a.starts_at).toLocaleTimeString("es-AR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "America/Argentina/Buenos_Aires",
      });
      const phone = a.client_phone || SHOP.whatsapp;
      const text = `Hola ${a.client_name}! Te recordamos tu turno en ASGARD ESTUDIO a las ${when} con ${a.barber} (${a.service}). Te esperamos en Belisario Roldán 340.`;
      out.push({
        kind: "hour",
        title: "Turno en menos de 1 hora",
        detail: `${a.client_name} · ${when} · ${a.barber}`,
        name: a.client_name,
        phone,
        wa: waLink(phone, text),
        barber: a.barber,
      });
    }

    const order: Record<ReminderKind, number> = { hour: 0, birthday: 1, recut: 2 };
    out.sort((a, b) => order[a.kind] - order[b.kind]);
    return out;
  });
