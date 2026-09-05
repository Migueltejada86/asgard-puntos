import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AsgardMark } from "@/components/asgard-mark";
import { PublicBooking } from "@/components/public-booking";
import { Card } from "@/components/shell";

export const Route = createFileRoute("/")({ component: Landing });

function Landing() {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-bg text-fg">
      <header className="sticky top-0 z-20 border-b border-border/80 bg-bg/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <a href="#inicio" className="flex items-center">
            <AsgardMark className="h-12 w-auto max-w-[180px]" />
          </a>
          <nav className="hidden items-center gap-6 text-xs tracking-[0.16em] text-muted uppercase md:flex">
            <a href="#servicios" className="hover:text-cream">Servicios</a>
            <a href="#nosotros" className="hover:text-cream">Nosotros</a>
            <a href="#reservar" className="hover:text-cream">Reservar</a>
            <a href="#reservar" className="rounded-md border border-primary px-3 py-2 text-cream">Turno</a>
            <Link to="/login" search={{ rol: "barbero" }} className="text-cream hover:text-primary">Puntos</Link>
          </nav>
          <button type="button" className="md:hidden" aria-label="Menú" onClick={() => setOpen((v) => !v)}>
            <span className="block h-0.5 w-6 bg-cream" />
            <span className="mt-1.5 block h-0.5 w-6 bg-cream" />
            <span className="mt-1.5 block h-0.5 w-6 bg-cream" />
          </button>
        </div>
        {open ? (
          <div className="flex flex-col gap-3 border-t border-border px-4 py-4 text-sm md:hidden">
            <a href="#servicios" onClick={() => setOpen(false)}>Servicios</a>
            <a href="#nosotros" onClick={() => setOpen(false)}>Nosotros</a>
            <a href="#reservar" onClick={() => setOpen(false)}>Reservar</a>
          </div>
        ) : null}
      </header>

      <section id="inicio" className="mx-auto max-w-3xl px-4 py-16 text-center">
        <div className="mb-6 flex justify-center">
          <AsgardMark className="h-44 w-auto max-w-[280px] md:h-56 md:max-w-[340px]" />
        </div>
        <p className="mx-auto mt-2 max-w-md text-base leading-relaxed text-muted">
          Elevamos tu estilo en Alta Gracia. Cortes con detalle. Tres barberos, un mismo criterio.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a href="#reservar" className="inline-flex min-h-12 items-center rounded-md bg-primary px-6 font-semibold tracking-wide text-primary-fg">
            Reservar turno
          </a>
          <Link to="/login" search={{ rol: "barbero" }} className="inline-flex min-h-12 items-center rounded-md border border-primary/50 px-6 font-medium text-cream">
            Puntos del local
          </Link>
        </div>
        <div className="mx-auto mt-12 grid max-w-lg grid-cols-3 gap-4 border-t border-border pt-6 text-sm">
          <div>
            <p className="text-[10px] tracking-widest text-muted uppercase">Horarios</p>
            <p className="text-cream">Lun a Sáb</p>
          </div>
          <div>
            <p className="text-[10px] tracking-widest text-muted uppercase">Mañana</p>
            <p className="text-cream">9:00 – 13:00</p>
          </div>
          <div>
            <p className="text-[10px] tracking-widest text-muted uppercase">Tarde</p>
            <p className="text-cream">17:00 – 21:30</p>
          </div>
        </div>
      </section>

      <section id="servicios" className="border-t border-border px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <p className="text-center text-xs tracking-[0.3em] text-primary uppercase">Servicios</p>
          <h2 className="mt-2 text-center font-display text-3xl tracking-wide text-cream">Lo que ofrecemos</h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-sm text-muted">
            Cortes y estilo en un mismo lugar. Un equipo que asesora para que el corte te quede bien a vos.
          </p>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              { t: "Corte", d: "No es solo cortar el pelo: escuchamos, asesoramos y cuidamos cada detalle para que te represente." },
              { t: "Barba", d: "Detalle fino para un look impecable. Cada cliente es único y lo tratamos así." },
              { t: "Perfilado", d: "Líneas precisas y contornos limpios. El detalle que hace la diferencia." },
            ].map((s) => (
              <Card key={s.t}>
                <h3 className="font-display text-lg text-cream">{s.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.d}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="nosotros" className="border-t border-border px-4 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-6 flex justify-center">
            <AsgardMark className="h-20 w-auto max-w-[200px]" />
          </div>
          <h2 className="font-display text-3xl tracking-wide text-cream">Somos un equipo, no solo una barbería</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            El lugar donde no solamente te cortan: te asesoran para que el corte te quede bien a vos.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Somos <span className="text-cream">Marcelo, Ulises y Alexis</span>. Tres barberos, un mismo objetivo: que salgas con un corte que te represente y te haga sentir seguro.
          </p>
        </div>
      </section>

      <section id="reservar" className="border-t border-border px-4 py-16">
        <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-2">
          <div>
            <p className="text-xs tracking-[0.3em] text-primary uppercase">Reserva</p>
            <h2 className="mt-2 font-display text-3xl tracking-wide text-cream">Te esperamos</h2>
            <p className="mt-3 text-sm text-muted">Belisario Roldán 340, Alta Gracia. Elegí barbero y horario: si Marcelo está a las 18:00, ese slot suyo queda cerrado.</p>
            <div className="mt-6 space-y-3 text-sm">
              <p className="text-cream">Lunes a sábados · 9 a 13 y 17 a 21:30</p>
              <p>
                <a className="text-primary underline" href="https://www.google.com/maps/search/?api=1&query=Belisario+Rold%C3%A1n+340,+Alta+Gracia,+C%C3%B3rdoba" target="_blank" rel="noreferrer">
                  Belisario Roldán 340, X5186 Alta Gracia
                </a>
              </p>
              <p>
                <a className="text-primary underline" href="https://wa.me/5493547612770" target="_blank" rel="noreferrer">
                  WhatsApp +54 9 3547 61-2770
                </a>
              </p>
            </div>
          </div>
          <Card>
            <h3 className="mb-4 font-display text-xl text-cream">Reservar turno</h3>
            <PublicBooking />
          </Card>
        </div>
      </section>

      <footer className="border-t border-border px-4 py-8 text-center text-xs text-muted">
        <p>© 2026 ASGARD ESTUDIO — Barbería. Alta Gracia.</p>
        <Link to="/login" search={{ rol: "barbero" }} className="mt-2 inline-block text-muted/70 hover:text-cream">
          Acceso equipo · Puntos
        </Link>
      </footer>
    </div>
  );
}
