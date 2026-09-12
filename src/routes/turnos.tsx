import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RedirectToSignIn, UserButton } from "@/lib/auth/gates";
import { Card, Shell } from "@/components/shell";
import { BarberNav } from "@/components/barber-nav";
import { cancelAppointment, myAppointments, type AppointmentRow } from "@/lib/booking-api";
import { BARBER_WHATSAPP, waLink } from "@/lib/shop";
import { useAsgardProfile } from "@/lib/use-asgard-profile";

export const Route = createFileRoute("/turnos")({ component: TurnosPage });

function TurnosPage() {
  const { user, sessionPending, profile, err } = useAsgardProfile();
  if (sessionPending || profile === undefined) return <div className="min-h-dvh bg-bg" />;
  if (!user) return <RedirectToSignIn />;
  if (!profile) {
    return (
      <Shell title="Mis turnos">
        <p className="text-sm text-danger">{err || "No se pudo abrir el perfil."}</p>
      </Shell>
    );
  }
  if (profile.role !== "barber") return <Navigate to="/puntos" />;
  return <TurnosDesk barber={profile.displayName} />;
}

function formatWhen(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Argentina/Buenos_Aires",
  });
}

function TurnosDesk({ barber }: { barber: string }) {
  const [rows, setRows] = useState<AppointmentRow[] | null>(null);
  const [err, setErr] = useState("");

  function load() {
    void myAppointments()
      .then(setRows)
      .catch((e: Error) => setErr(e.message));
  }

  useEffect(load, []);

  const upcoming = (rows ?? []).filter((r) => r.status === "booked" && new Date(r.startsAt).getTime() >= Date.now() - 30 * 60 * 1000);

  return (
    <Shell
      title="Mis turnos"
      footer={
        <div className="border-t border-border px-4 py-3">
          <BarberNav />
          <UserButton />
        </div>
      }
    >
      <p className="text-sm text-muted">
        Celular de <span className="text-cream">{barber}</span>: solo los turnos de tu silla. Al reservar, también te llega el WhatsApp.
      </p>
      {err ? <p className="mt-3 text-sm text-danger">{err}</p> : null}
      <div className="mt-5 space-y-3">
        {rows === null ? <p className="text-sm text-muted">Cargando…</p> : null}
        {rows && upcoming.length === 0 ? (
          <Card>
            <p className="text-sm text-muted">No tenés turnos próximos. Los de los otros barberos no entran acá.</p>
          </Card>
        ) : null}
        {upcoming.map((r) => {
          const wa = r.clientPhone
            ? waLink(
                r.clientPhone,
                `Hola ${r.clientName}! Te confirmo tu ${r.service} con ${r.barber} el ${formatWhen(r.startsAt)} en ASGARD ESTUDIO.`,
              )
            : waLink(
                BARBER_WHATSAPP[r.barber],
                `Turno ${r.service} — ${r.clientName} — ${formatWhen(r.startsAt)}`,
              );
          return (
            <Card key={r.id}>
              <p className="text-xs tracking-[0.16em] text-primary uppercase">{r.barber}</p>
              <p className="mt-1 font-display text-lg text-cream">{r.clientName}</p>
              <p className="text-sm text-muted">
                {r.service} · {formatWhen(r.startsAt)}
              </p>
              <div className="mt-3 flex gap-2">
                <a
                  href={wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 flex-1 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-fg"
                >
                  WhatsApp
                </a>
                <button
                  type="button"
                  className="min-h-11 rounded-md border border-border px-3 text-xs text-muted"
                  onClick={() => {
                    void cancelAppointment({ data: r.id }).then(load);
                  }}
                >
                  Cancelar
                </button>
              </div>
            </Card>
          );
        })}
      </div>
    </Shell>
  );
}
