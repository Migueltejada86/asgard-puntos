import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";

export function Shell({
  children,
  title,
  onBack,
  footer,
}: {
  children: ReactNode;
  title?: string;
  onBack?: () => void;
  footer?: ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-bg text-fg">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border/80 bg-bg/90 px-4 py-3 backdrop-blur">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex size-11 items-center justify-center rounded-md border border-border text-cream"
            aria-label="Volver"
          >
            <ArrowLeft className="size-5" />
          </button>
        ) : (
          <span className="size-11" />
        )}
        <h1 className="flex-1 text-center font-display text-sm font-semibold tracking-[0.22em] text-cream uppercase">
          {title ?? "ASGARD"}
        </h1>
        <span className="size-11" />
      </header>
      <div className="flex-1 px-4 py-5">{children}</div>
      {footer}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border border-border bg-surface p-5 shadow-[0_12px_40px_rgba(0,0,0,0.35)] ${className}`}>
      {children}
    </div>
  );
}

export function GoldBtn({
  children,
  onClick,
  type = "button",
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 font-semibold tracking-wide text-primary-fg transition hover:bg-cream disabled:opacity-40"
    >
      {children}
    </button>
  );
}

export function GhostBtn({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md border border-primary/50 px-4 font-medium tracking-wide text-cream transition hover:border-primary hover:bg-primary/10"
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium tracking-[0.16em] text-muted uppercase">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "min-h-12 w-full rounded-md border border-border bg-elevated px-3 text-fg outline-none placeholder:text-muted/70 focus:border-primary";
