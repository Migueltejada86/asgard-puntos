import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GROK_PROVIDERS, authClient, authEnabled, signIn } from "@/lib/auth/client";
import { AsgardMark } from "@/components/asgard-mark";
import { Card, Field, GoldBtn, GhostBtn, inputClass } from "@/components/shell";
import { DEMO, type DemoBarber, type DemoClient } from "@/lib/demo";

type Search = { rol?: "cliente" | "barbero" };

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    rol: s.rol === "barbero" || s.rol === "cliente" ? s.rol : undefined,
  }),
  component: Login,
});

function Login() {
  const { rol } = Route.useSearch();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState<string>(rol === "cliente" ? DEMO.clients[0].email : DEMO.barber.email);
  const [password, setPassword] = useState<string>(DEMO.password);
  const [name, setName] = useState<string>(rol === "cliente" ? DEMO.clients[0].name : DEMO.barber.name);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [who, setWho] = useState("");

  useEffect(() => {
    if (rol) sessionStorage.setItem("asgard-rol", rol);
  }, [rol]);

  async function signInOrUp(pack: { email: string; name: string }) {
    const signed = await authClient.signIn.email({ email: pack.email, password: DEMO.password });
    if (signed.error) {
      const created = await authClient.signUp.email({
        email: pack.email,
        password: DEMO.password,
        name: pack.name,
      });
      if (created.error) throw new Error(created.error.message || "No se pudo crear la cuenta de prueba");
    }
  }

  async function enterBarber(b: DemoBarber) {
    setErr("");
    setBusy(true);
    setWho(b.name);
    sessionStorage.setItem("asgard-rol", "barbero");
    sessionStorage.removeItem("asgard-dni");
    try {
      await signInOrUp(b);
      window.location.assign("/avisos");
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
      await signInOrUp({ email: c.email, name: c.name });
      window.location.assign("/puntos");
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Error");
      setBusy(false);
    }
  }

  async function onEmail(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      if (mode === "up") {
        const { error } = await authClient.signUp.email({ email, password, name: name || email });
        if (error) throw new Error(error.message || "No se pudo crear la cuenta");
      } else {
        const { error } = await authClient.signIn.email({ email, password });
        if (error) throw new Error(error.message || "Email o contraseña incorrectos");
      }
      window.location.assign("/puntos");
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Error");
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-bg px-5 py-10 text-fg">
      <div className="mb-8 text-center text-primary">
        <AsgardMark className="mx-auto h-14 w-14" />
        <h1 className="mt-3 font-display text-2xl tracking-[0.18em] text-cream">ASGARD PUNTOS</h1>
        <p className="mt-1 text-sm text-muted">Mini base de prueba · 4 clientes</p>
      </div>

      <Card className="mb-4 space-y-4">
        <div>
          <p className="text-xs tracking-[0.18em] text-primary uppercase">Clave de prueba</p>
          <p className="mt-1 font-mono text-lg text-cream">{DEMO.password}</p>
          <p className="mt-1 text-xs text-muted">No es 1234. La usan Marcelo y los 4 clientes.</p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {DEMO.barbers.map((b) => (
            <button
              key={b.name}
              type="button"
              disabled={busy}
              onClick={() => void enterBarber(b)}
              className="min-h-12 rounded-md border border-primary bg-primary/10 px-2 text-xs font-semibold text-cream"
            >
              {busy && who === b.name ? "…" : b.name}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted">Cada barbero ve sus turnos en el celular.</p>

        <div>
          <p className="mb-2 text-xs tracking-[0.16em] text-muted uppercase">Clientes cargados</p>
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

      <Card className="space-y-4">
        {authEnabled ? (
          <>
            {GROK_PROVIDERS.map((p) => (
              <GhostBtn key={p.providerId} onClick={() => void signIn(p.providerId, { callbackURL: "/puntos" })}>
                Continuar con {p.label}
              </GhostBtn>
            ))}
            <p className="text-center text-xs tracking-widest text-muted uppercase">o con email propio</p>
            <form className="space-y-3" onSubmit={(e) => void onEmail(e)}>
              {mode === "up" ? (
                <Field label="Nombre">
                  <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required />
                </Field>
              ) : null}
              <Field label="Email">
                <input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </Field>
              <Field label="Contraseña">
                <input className={inputClass} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
              </Field>
              {err ? <p className="text-sm text-danger">{err}</p> : null}
              <GoldBtn type="submit">{busy ? "…" : mode === "up" ? "Crear cuenta" : "Entrar"}</GoldBtn>
            </form>
            <button
              type="button"
              className="w-full text-center text-sm text-cream"
              onClick={() => setMode(mode === "up" ? "in" : "up")}
            >
              {mode === "up" ? "Ya tengo cuenta" : "Crear cuenta nueva"}
            </button>
          </>
        ) : (
          <p className="text-sm text-muted">El acceso todavía no está activo.</p>
        )}
      </Card>
    </div>
  );
}
