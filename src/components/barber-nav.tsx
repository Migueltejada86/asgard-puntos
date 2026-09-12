import { Link } from "@tanstack/react-router";
import { Bell, Clock, QrCode, Scissors } from "lucide-react";

export function BarberNav() {
  return (
    <nav className="mb-3 grid grid-cols-4 gap-1 text-center text-xs tracking-widest text-muted uppercase">
      <Link to="/avisos" className="py-2 text-primary">
        <Bell className="mx-auto mb-1 size-4" />
        Avisos
      </Link>
      <Link to="/turnos" className="py-2 hover:text-cream">
        <Clock className="mx-auto mb-1 size-4" />
        Turnos
      </Link>
      <Link to="/puntos" className="py-2 hover:text-cream">
        <Scissors className="mx-auto mb-1 size-4" />
        Puntos
      </Link>
      <Link to="/placas" className="py-2 hover:text-cream">
        <QrCode className="mx-auto mb-1 size-4" />
        QR
      </Link>
    </nav>
  );
}
