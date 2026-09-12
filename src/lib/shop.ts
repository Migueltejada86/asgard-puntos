import type { BarberName } from "@/lib/booking-api";

export const SHOP = {
  name: "ASGARD ESTUDIO",
  address: "Belisario Roldán 340, Alta Gracia, Córdoba",
  lat: -31.6549,
  lng: -64.4286,
  nearMeters: 500,
  recutDays: 15,
  whatsapp: "5493547612770",
  instagram: "https://www.instagram.com/asgard.est",
  maps: "https://www.google.com/maps/search/?api=1&query=ASGARD+ESTUDIO+Belisario+Rold%C3%A1n+340,+Alta+Gracia,+C%C3%B3rdoba",
  review:
    "https://www.google.com/maps/search/?api=1&query=ASGARD+ESTUDIO+Alta+Gracia+opiniones",
} as const;

/** Celular de cada silla. La reserva abre wa.me de ese barbero. */
export const BARBER_WHATSAPP: Record<BarberName, string> = {
  Marcelo: "5493547566940",
  Ulises: "5493547612770",
  Alexis: "5493547578371",
};

export const BARBER_WA_LABEL: Record<BarberName, string> = {
  Marcelo: "+54 9 3547 56-6940",
  Ulises: "+54 9 3547 61-2770",
  Alexis: "+54 9 3547 57-8371",
};

export function barberWaShort(barber: BarberName) {
  const d = BARBER_WHATSAPP[barber];
  return `${d.slice(-6, -4)}-${d.slice(-4)}`;
}

export function waLink(phone: string, text: string) {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

export function argentinaToday() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const y = parts.find((p) => p.type === "year")?.value ?? "2026";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  const d = parts.find((p) => p.type === "day")?.value ?? "01";
  return { iso: `${y}-${m}-${d}`, md: `${m}-${d}` };
}

export function toDay(value: unknown): string | null {
  if (value == null) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Argentina/Buenos_Aires",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(value);
    const y = parts.find((p) => p.type === "year")?.value;
    const m = parts.find((p) => p.type === "month")?.value;
    const d = parts.find((p) => p.type === "day")?.value;
    return y && m && d ? `${y}-${m}-${d}` : null;
  }
  const match = String(value).match(/(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
}

export type PlateId = "google" | "instagram" | "whatsapp" | "puntos";

export type Plate = {
  id: PlateId;
  title: string;
  subtitle: string;
  href: string;
};

export function platesFor(origin: string): Plate[] {
  const base = origin.replace(/\/+$/, "");
  return [
    {
      id: "google",
      title: "Reseña en Google",
      subtitle: "Dejanos 5 estrellas",
      href: SHOP.review,
    },
    {
      id: "instagram",
      title: "Instagram",
      subtitle: "@asgard.est",
      href: SHOP.instagram,
    },
    {
      id: "whatsapp",
      title: "WhatsApp",
      subtitle: "+54 9 3547 61-2770",
      href: waLink(SHOP.whatsapp, "Hola ASGARD ESTUDIO, quiero reservar un turno."),
    },
    {
      id: "puntos",
      title: "Sistema de puntos",
      subtitle: "Mirá tu saldo y canjeá",
      href: `${base}/login?rol=cliente`,
    },
  ];
}
