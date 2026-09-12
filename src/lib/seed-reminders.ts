import { getSql } from "@/lib/db";
import { SHOP, argentinaToday } from "@/lib/shop";
import { DEMO } from "@/lib/demo";

export async function seedDemoReminders(shopId: string) {
  const sql = await getSql();
  const { md } = argentinaToday();
  const [mm, dd] = md.split("-").map(Number);
  const franco = new Date(Date.UTC(2026, mm - 1, dd));
  franco.setUTCDate(franco.getUTCDate() + 2);
  const francoMd = `${String(franco.getUTCMonth() + 1).padStart(2, "0")}-${String(franco.getUTCDate()).padStart(2, "0")}`;
  const shopPhone = SHOP.whatsapp;

  await sql`
    update clients set
      phone = ${shopPhone},
      birthday_md = ${md},
      last_visit_at = null,
      preferred_barber = ${"Marcelo"}
    where shop_id = ${shopId} and dni = ${DEMO.clients[0].dni}
  `;
  await sql`
    update clients set
      phone = ${shopPhone},
      birthday_md = null,
      last_visit_at = (current_date - 16),
      preferred_barber = ${"Ulises"}
    where shop_id = ${shopId} and dni = ${DEMO.clients[1].dni}
  `;
  await sql`
    update clients set
      phone = ${shopPhone},
      birthday_md = null,
      last_visit_at = current_date,
      preferred_barber = ${"Alexis"}
    where shop_id = ${shopId} and dni = ${DEMO.clients[2].dni}
  `;
  await sql`
    update clients set
      phone = ${shopPhone},
      birthday_md = ${francoMd},
      last_visit_at = null,
      preferred_barber = ${"Marcelo"}
    where shop_id = ${shopId} and dni = ${DEMO.clients[3].dni}
  `;

  await sql`delete from appointments where id = ${"appt-demo-1h"}`;
  const in55 = new Date(Date.now() + 55 * 60 * 1000).toISOString();
  await sql`
    insert into appointments (
      id, shop_id, barber, starts_at, duration_min, service,
      client_name, client_phone, status
    ) values (
      ${"appt-demo-1h"}, ${shopId}, ${"Marcelo"}, ${in55}::timestamptz, ${30}, ${"Corte"},
      ${"Lucía Benítez"}, ${shopPhone}, ${"booked"}
    )
  `;
}
