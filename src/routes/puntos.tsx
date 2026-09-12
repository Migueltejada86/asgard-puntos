import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Cake, Clock, Scissors } from "lucide-react";
import { RedirectToSignIn, UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { AsgardMark } from "@/components/asgard-mark";
import { Card, Field, GoldBtn, Shell, inputClass } from "@/components/shell";
import { BarberNav } from "@/components/barber-nav";
import { AskLocationButton, NearShopBanner } from "@/components/near-shop";
import { DEMO } from "@/lib/demo";
import { SHOP } from "@/lib/shop";
import {
  ACTIONS,
  addPoints,
  completeOnboarding,
  deliverClaim,
  getBarberHome,
  getClientHome,
  getMyProfile,
  type ClientRow,
  type ClaimRow,
  type PrizeRow,
  type Profile,
} from "@/lib/loyalty-api";

export const Route = createFileRoute("/puntos")({ component: PuntosPage });

function PuntosPage() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg text-cream">
        <AsgardMark className="h-16 w-16 animate-pulse" />
      </div>
    );
  }
  if (!user) return <RedirectToSignIn />;
  return <PuntosApp displayName={user.displayName ?? user.primaryEmail ?? "ASGARD"} />;
}

function PuntosApp({ displayName }: { displayName: string }) {
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const [err, setErr] = useState("");

  async function reload() {
    try {
      let p = await getMyProfile();
      if (!p && typeof window !== "undefined") {
        const rol = sessionStorage.getItem("asgard-rol");
        const dni = sessionStorage.getItem("asgard-dni") ?? "";
        const demo = DEMO.clients.find((c) => c.dni === dni);
        if (rol === "cliente" && dni) {
          p = await completeOnboarding({
            data: { role: "client", displayName: demo?.name || displayName, dni },
          });
        } else if (rol === "barbero") {
          p = await completeOnboarding({
            data: { role: "barber", displayName: displayName || DEMO.barber.name, joinCode: DEMO.joinCode },
          });
        }
      }
      setProfile(p);
    } catch {
      setProfile(null);
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  if (profile === undefined) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg text-muted">Cargando ficha…</div>
    );
  }
  if (!profile) {
    return <Onboarding name={displayName} onDone={(p) => setProfile(p)} />;
  }
  if (profile.role === "barber") {
    return <BarberDesk profile={profile} onError={setErr} banner={err} />;
  }
  return <ClientDesk />;
}

function Onboarding({ name, onDone }: { name: string; onDone: (p: Profile) => void }) {
  const intended = typeof window !== "undefined" ? sessionStorage.getItem("asgard-rol") : null;
  const [role, setRole] = useState<"barber" | "client">(intended === "cliente" ? "client" : "barber");
  const [displayName, setDisplayName] = useState(name);
  const [dni, setDni] = useState(typeof window !== "undefined" ? sessionStorage.getItem("asgard-dni") ?? "" : "");
  const [joinCode, setJoinCode] = useState<string>(DEMO.joinCode);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const p = await completeOnboarding({
        data: {
          role,
          displayName,
          dni: role === "client" ? dni : undefined,
          joinCode: role === "barber" ? joinCode : undefined,
        },
      });
      if (!p) throw new Error("No se pudo crear el perfil");
      onDone(p);
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Error");
      setBusy(false);
    }
  }

  return (
    <Shell title="ASGARD Puntos">
      <Card>
        <h2 className="font-display text-xl text-cream">Quién sos</h2>
        <p className="mt-1 text-sm text-muted">El equipo entra como barbero. El cliente, con su DNI.</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            className={`min-h-12 rounded-md border ${role === "barber" ? "border-primary bg-primary/15 text-cream" : "border-border text-muted"}`}
            onClick={() => setRole("barber")}
          >
            Barbero
          </button>
          <button
            type="button"
            className={`min-h-12 rounded-md border ${role === "client" ? "border-primary bg-primary/15 text-cream" : "border-border text-muted"}`}
            onClick={() => setRole("client")}
          >
            Cliente
          </button>
        </div>
        <form className="mt-4 space-y-3" onSubmit={(e) => void submit(e)}>
          <Field label="Nombre">
            <input className={inputClass} value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
          </Field>
          {role === "barber" ? (
            <Field label="Código de equipo">
              <input className={inputClass} value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} />
            </Field>
          ) : (
            <Field label="DNI">
              <input className={inputClass} inputMode="numeric" value={dni} onChange={(e) => setDni(e.target.value)} required />
            </Field>
          )}
          {err ? <p className="text-sm text-danger">{err}</p> : null}
          <GoldBtn type="submit">{busy ? "…" : "Entrar al local"}</GoldBtn>
        </form>
      </Card>
    </Shell>
  );
}

function BarberDesk({
  profile,
  banner,
  onError,
}: {
  profile: Profile;
  banner: string;
  onError: (s: string) => void;
}) {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [claims, setClaims] = useState<ClaimRow[]>([]);
  const [selected, setSelected] = useState<ClientRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState("");

  async function load() {
    const data = await getBarberHome();
    setClients(data.clients);
    setClaims(data.claims);
    if (selected) {
      setSelected(data.clients.find((c) => c.id === selected.id) ?? null);
    }
  }

  useEffect(() => {
    void load().catch((e) => onError(e instanceof Error ? e.message : "Error"));
  }, []);

  async function give(action: (typeof ACTIONS)[number]) {
    if (!selected) return;
    setBusy(true);
    onError("");
    try {
      const next = await addPoints({ data: { dni: selected.dni, delta: action.points, label: action.label } });
      setSelected(next);
      await load();
    } catch (ex) {
      onError(ex instanceof Error ? ex.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  async function deliver(e: React.FormEvent) {
    e.preventDefault();
    onError("");
    try {
      await deliverClaim({ data: code });
      setCode("");
      await load();
    } catch (ex) {
      onError(ex instanceof Error ? ex.message : "Error");
    }
  }

  return (
    <Shell title="Puntos" footer={<div className="border-t border-border px-4 py-3"><BarberNav /><UserButton /></div>}>
      <p className="mb-3 text-xs tracking-[0.2em] text-muted uppercase">{profile.shopName} · {profile.displayName}</p>
      {banner ? <p className="mb-3 text-sm text-danger">{banner}</p> : null}

      <div className="mb-4 flex items-end justify-between">
        <h2 className="font-display text-2xl text-cream">Clientes</h2>
        <span className="text-xs text-muted">{clients.length} fichas</span>
      </div>
      <div className="space-y-2">
        {clients.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setSelected(c)}
            className={`flex w-full items-center justify-between rounded-md border px-4 py-3 text-left ${selected?.id === c.id ? "border-primary bg-primary/10" : "border-border bg-surface"}`}
          >
            <span>
              <span className="block font-medium text-cream">{c.name}</span>
              <span className="text-xs text-muted">DNI {c.dni}</span>
            </span>
            <span className="font-display text-xl text-primary">{c.points}</span>
          </button>
        ))}
      </div>

      {selected ? (
        <Card className="mt-5 space-y-3">
          <div className="flex items-baseline justify-between">
            <h3 className="font-display text-lg text-cream">{selected.name}</h3>
            <span className="text-primary">{selected.points} pts</span>
          </div>
          <p className="text-xs text-muted">Sumar por esta visita</p>
          <div className="grid grid-cols-2 gap-2">
            {ACTIONS.map((a) => (
              <button
                key={a.id}
                type="button"
                disabled={busy}
                onClick={() => void give(a)}
                className="min-h-12 rounded-md border border-border bg-elevated px-2 text-sm text-cream hover:border-primary"
              >
                {a.label}
                <span className="mt-0.5 block text-xs text-primary">+{a.points}</span>
              </button>
            ))}
          </div>
        </Card>
      ) : (
        <p className="mt-4 text-sm text-muted">Tocá un cliente para sumarle puntos.</p>
      )}

      <Card className="mt-5">
        <h3 className="font-display text-lg text-cream">Entregar premio</h3>
        <form className="mt-3 flex gap-2" onSubmit={(e) => void deliver(e)}>
          <input className={inputClass} placeholder="Código" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
          <GoldBtn type="submit">OK</GoldBtn>
        </form>
        {claims.length ? (
          <ul className="mt-3 space-y-1 text-sm text-muted">
            {claims.map((c) => (
              <li key={c.id}>{c.prizeName} · {c.code} · DNI {c.dni}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-xs text-muted">No hay canjes pendientes.</p>
        )}
      </Card>
    </Shell>
  );
}

function ClientDesk() {
  const [data, setData] = useState<Awaited<ReturnType<typeof getClientHome>> | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    void getClientHome()
      .then(setData)
      .catch((e) => setErr(e instanceof Error ? e.message : "Error"));
  }, []);

  if (!data) {
    return (
      <Shell title="Mis puntos">
        <p className="text-sm text-muted">{err || "Cargando…"}</p>
      </Shell>
    );
  }

  const next = data.prizes.find((p: PrizeRow) => p.cost > data.client.points);
  const when = data.upcoming
    ? new Date(data.upcoming.startsAt).toLocaleTimeString("es-AR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "America/Argentina/Buenos_Aires",
      })
    : "";

  return (
    <Shell title="Mis puntos" footer={<div className="border-t border-border px-4 py-3"><UserButton /></div>}>
      <NearShopBanner />
      <div className="mt-3">
        <AskLocationButton />
      </div>
      {data.birthdayToday ? (
        <Card className="mt-4 flex items-start gap-3 border-primary/40">
          <Cake className="mt-0.5 size-5 text-primary" />
          <p className="text-sm text-cream">Feliz cumple. Hoy el local te espera cuando quieras.</p>
        </Card>
      ) : null}
      {data.upcoming ? (
        <Card className="mt-4 flex items-start gap-3">
          <Clock className="mt-0.5 size-5 text-primary" />
          <div>
            <p className="text-xs tracking-[0.16em] text-primary uppercase">Tu turno</p>
            <p className="mt-1 text-cream">
              {data.upcoming.service} con {data.upcoming.barber} a las {when}
            </p>
          </div>
        </Card>
      ) : null}
      {data.recutDue ? (
        <Card className="mt-4 flex items-start gap-3">
          <Scissors className="mt-0.5 size-5 text-primary" />
          <div>
            <p className="text-xs tracking-[0.16em] text-primary uppercase">Próximo corte</p>
            <p className="mt-1 text-sm text-cream">
              Ya pasaron {SHOP.recutDays} días. Reservá el siguiente
              {data.preferredBarber ? ` con ${data.preferredBarber}` : ""}.
            </p>
            <a href="/#reservar" className="mt-3 inline-flex min-h-11 items-center text-sm text-primary">
              Reservar turno
            </a>
          </div>
        </Card>
      ) : null}
      <div className="asgard-card mt-4 rounded-lg p-6 text-primary-fg">
        <p className="text-xs tracking-[0.2em] uppercase opacity-80">{data.profile.shopName}</p>
        <p className="mt-2 font-display text-2xl">{data.client.name}</p>
        <p className="mt-6 font-display text-5xl leading-none">{data.client.points}</p>
        <p className="mt-1 text-sm opacity-80">puntos</p>
      </div>
      {next ? (
        <p className="mt-4 text-sm text-muted">
          Te faltan {next.cost - data.client.points} pts para {next.name}.
        </p>
      ) : (
        <p className="mt-4 text-sm text-ok">Ya podés canjear un premio en el local.</p>
      )}
      <div className="mt-6 space-y-2">
        {data.prizes.map((p: PrizeRow) => (
          <div key={p.id} className="flex items-center justify-between rounded-md border border-border bg-surface px-4 py-3">
            <span>
              <span className="block text-cream">{p.name}</span>
              <span className="text-xs text-muted">{p.detail}</span>
            </span>
            <span className="text-sm text-primary">{p.cost} pts</span>
          </div>
        ))}
      </div>
      <a href="/placas" className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-md border border-primary/50 text-sm text-cream">
        Ver placas QR
      </a>
    </Shell>
  );
}
