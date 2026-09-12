import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Cake, Clock, Scissors } from "lucide-react";
import { RedirectToSignIn, UserButton } from "@/lib/auth/gates";
import { Card, Shell } from "@/components/shell";
import { AskLocationButton, NearShopBanner } from "@/components/near-shop";
import { BarberNav } from "@/components/barber-nav";
import { useAsgardProfile } from "@/lib/use-asgard-profile";
import { listReminders, type ReminderKind, type ReminderRow } from "@/lib/reminders-api";

export const Route = createFileRoute("/avisos")({ component: AvisosPage });

function AvisosPage() {
  const { user, sessionPending, profile, err } = useAsgardProfile();
  if (sessionPending || profile === undefined) return <div className="min-h-dvh bg-bg" />;
  if (!user) return <RedirectToSignIn />;
  if (!profile) {
    return (
      <Shell title="Avisos">
        <p className="text-sm text-danger">{err || "No se pudo abrir el perfil."}</p>
      </Shell>
    );
  }
  if (profile.role !== "barber") return <Navigate to="/puntos" />;
  return <AvisosDesk barber={profile.displayName} />;
}

const ICONS: Record<ReminderKind, typeof Cake> = {
  birthday: Cake,
  recut: Scissors,
  hour: Clock,
};

function AvisosDesk({ barber }: { barber: string }) {
  const [rows, setRows] = useState<ReminderRow[] | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    void listReminders()
      .then(setRows)
      .catch((e: Error) => {
        setErr(e.message);
        setRows([]);
      });
  }, []);

  const mine = (rows ?? []).filter((r) => r.barber && r.barber.toLowerCase() === barber.toLowerCase());
  const others = (rows ?? []).filter((r) => !r.barber || r.barber.toLowerCase() !== barber.toLowerCase());

  return (
    <Shell
      title="Avisos"
      footer={
        <div className="border-t border-border px-4 py-3">
          <BarberNav />
          <UserButton />
        </div>
      }
    >
      <NearShopBanner />
      <p className="mt-3 text-sm text-muted">
        Silla de <span className="text-cream">{barber}</span>. WhatsApp listo: cumple, próximo corte (15 días) y 1 hora antes del turno.
      </p>
      <div className="mt-3">
        <AskLocationButton />
      </div>
      {err ? <p className="mt-3 text-sm text-danger">{err}</p> : null}
      <div className="mt-5 space-y-3">
        {rows === null ? <p className="text-sm text-muted">Cargando avisos de prueba…</p> : null}
        {rows?.length === 0 ? (
          <Card>
            <p className="text-sm text-muted">No hay avisos ahora.</p>
          </Card>
        ) : null}
        {mine.map((r, i) => (
          <ReminderCard key={`mine-${r.kind}-${r.name}-${i}`} row={r} mine />
        ))}
        {others.length ? (
          <p className="pt-2 text-xs tracking-[0.16em] text-muted uppercase">Resto del local</p>
        ) : null}
        {others.map((r, i) => (
          <ReminderCard key={`other-${r.kind}-${r.name}-${i}`} row={r} />
        ))}
      </div>
    </Shell>
  );
}

function ReminderCard({ row, mine }: { row: ReminderRow; mine?: boolean }) {
  const Icon = ICONS[row.kind];
  return (
    <Card className={`flex items-start gap-3 ${mine ? "border-primary/50" : ""}`}>
      <Icon className="mt-0.5 size-5 shrink-0 text-primary" />
      <div className="min-w-0 flex-1">
        <p className="text-xs tracking-[0.16em] text-primary uppercase">{row.title}</p>
        <p className="mt-1 text-cream">{row.detail}</p>
        <a
          href={row.wa}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-fg"
        >
          Avisar por WhatsApp
        </a>
      </div>
    </Card>
  );
}
