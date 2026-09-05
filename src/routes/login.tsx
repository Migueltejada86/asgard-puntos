import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { authClient } from "@/lib/auth/client";
import { AsgardMark } from "@/components/asgard-mark";
import { Card, GoldBtn } from "@/components/shell";
import { DEMO, type DemoClient } from "@/lib/demo";

type Search = { rol?: "cliente" | "barbero" };

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    rol: s.rol === "barbero" || s.rol === "cliente" ? s.rol : undefined,
  }),
  component: Login,
});

async function enterWith(pack: { email: string; name: string }) {
  const signed = await authClient.signIn.email({
    email: pack.email,
    password: DEMO.password,
  });
  if (!signed.error) return;
  const created = await authClient.signUp.email({
    email: pack.email,
    password: DEMO.password,
    name: pack.name,
  });
  if (!created.error) return;
  const retry = await authClient.signIn.email({
    email: pack.email,
    password: DEMO.password,
  });
  if (retry.error) {
    throw new Error(created.error.message || signed.error.message || "No se pudo entrar");
  }
}

function Login() {
  const { rol } = Route.useSearch();
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [who, setWho] = useState("");

  if (rol) sessionStorage.setItem("asgard-rol", rol);

  async function enterBarber() {
    setErr("");
    setBusy(true);
    setWho("Marcelo");
    sessionStorage.setItem("asgard-rol", "barbero");
    sessionStorage.removeItem("asgard-dni");
    try {
      await enterWith(DEMO.barber);
      window.location.assign("/puntos");
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Error");
      setBusy(false);
    }
  }

  async function enterClient(c: DemoClient) {
    setErr("");
    setBusy(true);
    setWho(c.name);
    sessionStorage.setItem("asgard-rol", "cliente");
    sessionStorage.setItem("asgard-dni", c.dni);
    try {
      await enterWith({ email: c.email, name: c.name });
      window.location.assign("/puntos");
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Error");
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-bg px-5 py-10 text-fg">
      <div className="mb-8 text-center text-primary">
        <AsgardMark className="mx-auto h-28 w-auto max-w-[240px]" />
        <h1 className="mt-3 font-display text-xl tracking-[0.18em] text-cream">PUNTOS</h1>
        <p className="mt-1 text-sm text-muted">Mini base de prueba · 4 clientes</p>
      </div>

      <Card className="space-y-4">
        <div>
          <p className="text-xs tracking-[0.18em] text-primary uppercase">Clave de prueba</p>
          <p className="mt-1 font-mono text-lg text-cream">{DEMO.password}</p>
          <p className="mt-1 text-xs text-muted">Tocá Marcelo. No hace falta escribir la clave.</p>
        </div>

        <GoldBtn disabled={busy} onClick={() => void enterBarber()}>
          {busy && who === "Marcelo" ? "Entrando…" : "Marcelo · ver las 4 fichas"}
        </GoldBtn>

        <div>
          <p className="mb-2 text-xs tracking-[0.16em] text-muted uppercase">Entrar como cliente</p>
          <ul className="space-y-2">
            {DEMO.clients.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void enterClient(c)}
                  className="flex min-h-12 w-full items-center justify-between rounded-md border border-border bg-elevated px-3 text-left hover:border-primary disabled:opacity-50"
                >
                  <span>
                    <span className="block text-sm text-cream">{c.name}</span>
                    <span className="text-xs text-muted">DNI {c.dni}</span>
                  </span>
                  <span className="font-display text-lg text-primary">{c.points}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        {err ? <p className="text-sm text-danger">{err}</p> : null}
      </Card>
    </div>
  );
}
