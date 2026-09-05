import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Screen =
  | "home"
  | "client-gate"
  | "client-home"
  | "client-prizes"
  | "client-mine"
  | "barber-gate"
  | "barber-menu"
  | "add-points"
  | "manage-prizes"
  | "backup"
  | "scan-prize";

export type Client = {
  dni: string;
  name: string;
  points: number;
};

export type Prize = {
  id: string;
  name: string;
  cost: number;
  detail: string;
};

export type Claim = {
  id: string;
  dni: string;
  prizeId: string;
  prizeName: string;
  code: string;
  status: "pending" | "delivered";
  createdAt: string;
};

export type Ledger = {
  id: string;
  dni: string;
  label: string;
  delta: number;
  at: string;
  barber: string;
};

export const ACTIONS = [
  { id: "corte", label: "Corte de pelo", points: 20 },
  { id: "combo", label: "Corte + barba", points: 30 },
  { id: "amigo", label: "Traer un amigo", points: 15 },
  { id: "google", label: "Reseña en Google", points: 30 },
  { id: "ig", label: "Historia en IG", points: 10 },
  { id: "comunidad", label: "Unirte a la comunidad", points: 10 },
] as const;

const DEFAULT_PRIZES: Prize[] = [
  { id: "p1", name: "Perfilado gratis", cost: 80, detail: "Canjeable en tu próxima visita" },
  { id: "p2", name: "10% off en cortes", cost: 100, detail: "Descuento en un corte" },
  { id: "p3", name: "15% off en cortes", cost: 160, detail: "Descuento en un corte" },
  { id: "p4", name: "50% combo corte + barba", cost: 180, detail: "Mitad de precio en combo" },
  { id: "p5", name: "Corte gratis", cost: 250, detail: "Un corte completo de cortesía" },
];

const DEFAULT_CLIENTS: Client[] = [
  { dni: "30403722", name: "Braian Cortez", points: 130 },
  { dni: "35111222", name: "Lucas Méndez", points: 40 },
  { dni: "28900411", name: "Diego Rivas", points: 210 },
];

const PIN = "1234";
const BARBERS = ["Marcelo", "Ulises", "Alexis"] as const;

function code6() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

type State = {
  screen: Screen;
  clients: Client[];
  prizes: Prize[];
  claims: Claim[];
  ledger: Ledger[];
  sessionDni: string | null;
  barber: string | null;
  go: (s: Screen) => void;
  loginClient: (dni: string) => { ok: true } | { ok: false; error: string };
  registerClient: (dni: string, name: string) => { ok: true } | { ok: false; error: string };
  loginBarber: (pin: string, barber: string) => boolean;
  logout: () => void;
  addPoints: (dni: string, delta: number, label: string) => { ok: true; client: Client } | { ok: false; error: string };
  findClient: (dni: string) => Client | undefined;
  claimPrize: (prizeId: string) => { ok: true; claim: Claim } | { ok: false; error: string };
  deliverClaim: (code: string) => { ok: true; claim: Claim } | { ok: false; error: string };
  upsertPrize: (p: Prize) => void;
  removePrize: (id: string) => void;
  exportJson: () => string;
  importJson: (raw: string) => { ok: true } | { ok: false; error: string };
};

export const useLoyalty = create<State>()(
  persist(
    (set, get) => ({
      screen: "home",
      clients: DEFAULT_CLIENTS,
      prizes: DEFAULT_PRIZES,
      claims: [],
      ledger: [],
      sessionDni: null,
      barber: null,
      go: (screen) => set({ screen }),
      loginClient: (dni) => {
        const clean = dni.replace(/\D/g, "");
        const c = get().clients.find((x) => x.dni === clean);
        if (!c) return { ok: false, error: "No encontramos ese DNI. Pedile al barbero que te sume la primera visita." };
        set({ sessionDni: c.dni, screen: "client-home" });
        return { ok: true };
      },
      registerClient: (dni, name) => {
        const clean = dni.replace(/\D/g, "");
        const n = name.trim();
        if (clean.length < 7) return { ok: false, error: "DNI inválido" };
        if (n.length < 3) return { ok: false, error: "Ingresá el nombre completo" };
        if (get().clients.some((x) => x.dni === clean)) return { ok: false, error: "Ese DNI ya está cargado" };
        const client: Client = { dni: clean, name: n, points: 0 };
        set((s) => ({ clients: [...s.clients, client] }));
        return { ok: true };
      },
      loginBarber: (pin, barber) => {
        if (pin !== PIN) return false;
        if (!BARBERS.includes(barber as (typeof BARBERS)[number])) return false;
        set({ barber, screen: "barber-menu" });
        return true;
      },
      logout: () => set({ screen: "home", sessionDni: null, barber: null }),
      findClient: (dni) => get().clients.find((c) => c.dni === dni.replace(/\D/g, "")),
      addPoints: (dni, delta, label) => {
        const clean = dni.replace(/\D/g, "");
        if (!Number.isFinite(delta) || delta === 0) return { ok: false, error: "Cantidad inválida" };
        const client = get().clients.find((c) => c.dni === clean);
        if (!client) return { ok: false, error: "Cliente no encontrado. Registralo primero." };
        const next = { ...client, points: Math.max(0, client.points + delta) };
        const entry: Ledger = {
          id: crypto.randomUUID(),
          dni: clean,
          label,
          delta,
          at: new Date().toISOString(),
          barber: get().barber ?? "ASGARD",
        };
        set((s) => ({
          clients: s.clients.map((c) => (c.dni === clean ? next : c)),
          ledger: [entry, ...s.ledger].slice(0, 400),
        }));
        return { ok: true, client: next };
      },
      claimPrize: (prizeId) => {
        const dni = get().sessionDni;
        if (!dni) return { ok: false, error: "Sesión vencida" };
        const prize = get().prizes.find((p) => p.id === prizeId);
        const client = get().clients.find((c) => c.dni === dni);
        if (!prize || !client) return { ok: false, error: "Premio no disponible" };
        if (client.points < prize.cost) return { ok: false, error: "Todavía no te alcanzan los puntos" };
        const pending = get().claims.find((c) => c.dni === dni && c.prizeId === prizeId && c.status === "pending");
        if (pending) return { ok: false, error: "Ya tenés este premio pendiente de canje" };
        const claim: Claim = {
          id: crypto.randomUUID(),
          dni,
          prizeId,
          prizeName: prize.name,
          code: code6(),
          status: "pending",
          createdAt: new Date().toISOString(),
        };
        set((s) => ({
          clients: s.clients.map((c) => (c.dni === dni ? { ...c, points: c.points - prize.cost } : c)),
          claims: [claim, ...s.claims],
          ledger: [
            {
              id: crypto.randomUUID(),
              dni,
              label: `Canje: ${prize.name}`,
              delta: -prize.cost,
              at: new Date().toISOString(),
              barber: "cliente",
            },
            ...s.ledger,
          ],
        }));
        return { ok: true, claim };
      },
      deliverClaim: (code) => {
        const c = get().claims.find((x) => x.code.toUpperCase() === code.trim().toUpperCase());
        if (!c) return { ok: false, error: "Código no válido" };
        if (c.status === "delivered") return { ok: false, error: "Ese premio ya fue entregado" };
        const next = { ...c, status: "delivered" as const };
        set((s) => ({ claims: s.claims.map((x) => (x.id === c.id ? next : x)) }));
        return { ok: true, claim: next };
      },
      upsertPrize: (p) =>
        set((s) => {
          const exists = s.prizes.some((x) => x.id === p.id);
          return { prizes: exists ? s.prizes.map((x) => (x.id === p.id ? p : x)) : [...s.prizes, p] };
        }),
      removePrize: (id) => set((s) => ({ prizes: s.prizes.filter((p) => p.id !== id) })),
      exportJson: () =>
        JSON.stringify(
          {
            clients: get().clients,
            prizes: get().prizes,
            claims: get().claims,
            ledger: get().ledger,
          },
          null,
          2,
        ),
      importJson: (raw) => {
        try {
          const data = JSON.parse(raw) as Partial<Pick<State, "clients" | "prizes" | "claims" | "ledger">>;
          if (!Array.isArray(data.clients) || !Array.isArray(data.prizes)) {
            return { ok: false, error: "Archivo incompleto" };
          }
          set({
            clients: data.clients,
            prizes: data.prizes,
            claims: data.claims ?? [],
            ledger: data.ledger ?? [],
          });
          return { ok: true };
        } catch {
          return { ok: false, error: "JSON inválido" };
        }
      },
    }),
    {
      name: "asgard-puntos-v1",
      partialize: (s) => ({
        clients: s.clients,
        prizes: s.prizes,
        claims: s.claims,
        ledger: s.ledger,
      }),
    },
  ),
);

export { PIN, BARBERS };

export function nextPrize(points: number, prizes: Prize[]) {
  const sorted = [...prizes].sort((a, b) => a.cost - b.cost);
  return sorted.find((p) => p.cost > points) ?? sorted[sorted.length - 1];
}
