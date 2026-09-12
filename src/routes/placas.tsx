import { createFileRoute, Link } from "@tanstack/react-router";
import { Gift, Instagram, MessageCircle, Printer, Star } from "lucide-react";
import { AsgardMark } from "@/components/asgard-mark";
import { QrImg } from "@/components/qr-img";
import { platesFor, type PlateId } from "@/lib/shop";

export const Route = createFileRoute("/placas")({ component: Placas });

const ICONS: Record<PlateId, typeof Star> = {
  google: Star,
  instagram: Instagram,
  whatsapp: MessageCircle,
  puntos: Gift,
};

function Placas() {
  const origin = typeof window === "undefined" ? "https://asgard-puntos-d2ru.vercel.app" : window.location.origin;
  const plates = platesFor(origin);

  return (
    <div className="min-h-dvh bg-bg text-fg print:bg-white print:text-black">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 print:hidden">
        <Link to="/" className="flex items-center gap-2 text-primary">
          <AsgardMark className="h-10 w-10" />
          <span className="font-display text-sm tracking-[0.2em] text-cream">ASGARD</span>
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex min-h-11 items-center gap-2 rounded-md border border-primary px-4 text-sm text-primary"
        >
          <Printer className="size-4" />
          Imprimir placas
        </button>
      </header>

      <main className="mx-auto grid max-w-5xl gap-6 px-4 py-6 sm:grid-cols-2 print:grid-cols-2">
        {plates.map((p) => {
          const Icon = ICONS[p.id];
          return (
            <article
              key={p.id}
              className="print-plate break-inside-avoid rounded-lg border border-primary/40 bg-surface p-8 text-center print:border-black print:bg-white"
            >
              <AsgardMark className="mx-auto h-10 w-10 text-primary print:text-black" />
              <p className="mt-3 font-display text-xs tracking-[0.28em] text-primary print:text-black">ASGARD ESTUDIO</p>
              <h1 className="mt-3 flex items-center justify-center gap-2 font-display text-2xl tracking-wide text-cream print:text-black">
                <Icon className="size-5 text-primary print:text-black" />
                {p.title}
              </h1>
              <p className="mt-1 text-sm text-muted print:text-neutral-600">{p.subtitle}</p>
              <div className="mt-6">
                <QrImg data={p.href} size={220} alt={`QR ${p.title}`} />
              </div>
              <p className="mt-4 break-all text-xs text-muted print:text-neutral-700">{p.href}</p>
              <a
                href={p.href}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex min-h-11 items-center rounded-md bg-primary px-5 text-sm font-semibold text-primary-fg print:hidden"
              >
                Abrir
              </a>
            </article>
          );
        })}
      </main>
      <p className="px-4 pb-10 text-center text-xs text-muted print:hidden">
        Tres placas de mostrador (Google, Instagram, WhatsApp) y una para el sistema de puntos. Imprimí y pegalas en el local.
      </p>
    </div>
  );
}
