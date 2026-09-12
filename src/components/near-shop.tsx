import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import { SHOP, haversineMeters } from "@/lib/shop";

export function NearShopBanner() {
  const [meters, setMeters] = useState<number | null>(null);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const m = haversineMeters(pos.coords.latitude, pos.coords.longitude, SHOP.lat, SHOP.lng);
        setMeters(Math.round(m));
        if (m <= SHOP.nearMeters && "Notification" in window && Notification.permission === "granted") {
          new Notification("ASGARD ESTUDIO", {
            body: `Estás a ${Math.round(m)} m del local. Pasá, sentate.`,
          });
        }
      },
      () => setDenied(true),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30_000 },
    );
  }, []);

  if (denied || meters === null) return null;
  if (meters > SHOP.nearMeters) return null;

  return (
    <div className="flex items-center gap-3 rounded-md border border-primary/40 bg-primary/10 px-4 py-3 text-sm text-cream">
      <MapPin className="size-5 shrink-0 text-primary" />
      <p>
        Estás a <span className="text-primary">{meters} m</span> de ASGARD. {SHOP.address}.
      </p>
    </div>
  );
}

export function AskLocationButton() {
  const [label, setLabel] = useState("Avisame si estoy cerca");

  async function ask() {
    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }
    if (!navigator.geolocation) {
      setLabel("Este celular no da ubicación");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const m = Math.round(haversineMeters(pos.coords.latitude, pos.coords.longitude, SHOP.lat, SHOP.lng));
        if (m <= SHOP.nearMeters) {
          setLabel(`Estás a ${m} m — pasá`);
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification("ASGARD ESTUDIO", { body: `Estás a ${m} m del local. Pasá, sentate.` });
          }
        } else {
          setLabel(`Estás a ${m} m del local`);
        }
      },
      () => setLabel("Activá la ubicación para el aviso"),
    );
  }

  return (
    <button
      type="button"
      onClick={() => void ask()}
      className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md border border-primary/50 px-4 text-sm text-cream"
    >
      <MapPin className="size-4 text-primary" />
      {label}
    </button>
  );
}
