import { useEffect, useMemo, useState } from "react";
import { Card, Field, GoldBtn, Shell, inputClass } from "@/components/shell";
import {
  BARBERS,
  SERVICES,
  bookSlot,
  cancelAppointment,
  listSlots,
  myAppointments,
  type AppointmentRow,
  type BarberName,
  type SlotRow,
} from "@/lib/booking-api";

function todayISO() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const d = parts.find((p) => p.type === "day")?.value;
  return `${y}-${m}-${d}`;
}

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function BookTurn({
  onBack,
  asBarber,
}: {
  onBack: () => void;
  asBarber: boolean;
}) {
  const [date, setDate] = useState(todayISO);
  const [slots, setSlots] = useState<SlotRow[]>([]);
  const [service, setService] = useState("corte");
  const [barber, setBarber] = useState<BarberName | "">("");
  const [time, setTime] = useState("");
  const [walkName, setWalkName] = useState("");
  const [phone, setPhone] = useState("");
  const [msg, setMsg] = useState("");
  const [mine, setMine] = useState<AppointmentRow[]>([]);

  function load() {
    void listSlots({ data: date }).then(setSlots).catch((e: Error) => setMsg(e.message));
    void myAppointments().then(setMine).catch(() => setMine([]));
  }
  useEffect(load, [date]);

  const selected = slots.find((s) => s.time === time);
  const freeForTime = selected?.free ?? [];

  const upcoming = useMemo(
    () => mine.filter((a) => a.status === "booked" && new Date(a.startsAt).getTime() >= Date.now() - 60_000),
    [mine],
  );

  return (
    <Shell title="Reservar turno" onBack={onBack}>
      <Card className="space-y-4">
        <p className="text-sm text-muted">Tres sillas: Marcelo, Ulises y Alexis. Un barbero, un turno por horario.</p>
        <Field label="Servicio">
          <select className={inputClass} value={service} onChange={(e) => setService(e.target.value)}>
            {SERVICES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Fecha">
          <input
            className={inputClass}
            type="date"
            min={todayISO()}
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setTime("");
              setBarber("");
            }}
          />
        </Field>
        {asBarber ? (
          <Field label="Cliente (si es walk-in)">
            <input className={inputClass} value={walkName} onChange={(e) => setWalkName(e.target.value)} placeholder="Nombre" />
          </Field>
        ) : (
          <Field label="WhatsApp">
            <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+54 9 …" />
          </Field>
        )}
        <div>
          <p className="mb-2 text-xs font-medium tracking-[0.16em] text-muted uppercase">Horario</p>
          {slots.length === 0 ? (
            <p className="text-sm text-muted">Cerrado o sin horarios (domingo no hay atención).</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {slots.map((s) => {
                const full = s.free.length === 0;
                return (
                  <button
                    key={s.time}
                    type="button"
                    disabled={full}
                    onClick={() => {
                      setTime(s.time);
                      setBarber(s.free.length === 1 ? s.free[0] : "");
                    }}
                    className={`min-h-11 rounded-md border text-sm ${
                      time === s.time
                        ? "border-primary bg-primary/20 text-cream"
                        : full
                          ? "border-border text-muted opacity-40"
                          : "border-border text-fg"
                    }`}
                  >
                    {s.time}
                    <span className="mt-0.5 block text-[10px] text-muted">{full ? "completo" : `${s.free.length} libre${s.free.length === 1 ? "" : "s"}`}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        {time ? (
          <div>
            <p className="mb-2 text-xs font-medium tracking-[0.16em] text-muted uppercase">Barbero</p>
            <div className="grid grid-cols-3 gap-2">
              {BARBERS.map((b) => {
                const ok = freeForTime.includes(b);
                return (
                  <button
                    key={b}
                    type="button"
                    disabled={!ok}
                    onClick={() => setBarber(b)}
                    className={`min-h-12 rounded-md border text-sm ${
                      barber === b
                        ? "border-primary bg-primary/20 text-cream"
                        : ok
                          ? "border-border"
                          : "border-border text-muted opacity-35"
                    }`}
                  >
                    {b}
                    {!ok ? <span className="block text-[10px]">ocupado</span> : null}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
        {msg ? <p className="text-sm text-cream">{msg}</p> : null}
        <GoldBtn
          onClick={() => {
            if (!barber || !time) {
              setMsg("Elegí horario y barbero");
              return;
            }
            setMsg("");
            void bookSlot({
              data: {
                date,
                time,
                barber,
                service,
                phone: asBarber ? "" : phone,
                clientName: asBarber ? walkName : undefined,
              },
            })
              .then((r) => {
                setMsg(`Listo: ${r.service} con ${r.barber} el ${r.date} a las ${r.time}`);
                setTime("");
                setBarber("");
                load();
              })
              .catch((e: Error) => setMsg(e.message));
          }}
        >
          Confirmar turno
        </GoldBtn>
      </Card>
      {upcoming.length > 0 ? (
        <div className="mt-6 space-y-2">
          <p className="text-xs tracking-widest text-muted uppercase">Tus turnos</p>
          {upcoming.map((a) => (
            <Card key={a.id} className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium">{a.service} · {a.barber}</p>
                <p className="text-xs text-muted">{formatWhen(a.startsAt)}{asBarber ? ` · ${a.clientName}` : ""}</p>
              </div>
              <button type="button" className="text-xs text-danger" onClick={() => void cancelAppointment({ data: a.id }).then(load)}>
                Cancelar
              </button>
            </Card>
          ))}
        </div>
      ) : null}
    </Shell>
  );
}

export function BarberAgenda({ onBack }: { onBack: () => void }) {
  const [date, setDate] = useState(todayISO);
  const [rows, setRows] = useState<AppointmentRow[]>([]);
  const [filter, setFilter] = useState<BarberName | "todos">("todos");

  function load() {
    void myAppointments().then(setRows);
  }
  useEffect(load, []);

  const day = rows.filter((a) => {
    const d = new Date(a.startsAt).toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" });
    return d === date && a.status !== "cancelled";
  });
  const shown = filter === "todos" ? day : day.filter((a) => a.barber === filter);

  return (
    <Shell title="Agenda" onBack={onBack}>
      <Field label="Día">
        <input className={inputClass} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </Field>
      <div className="my-3 grid grid-cols-4 gap-1">
        {(["todos", ...BARBERS] as const).map((b) => (
          <button
            key={b}
            type="button"
            onClick={() => setFilter(b)}
            className={`min-h-10 rounded-md border text-xs ${filter === b ? "border-primary bg-primary/20 text-cream" : "border-border"}`}
          >
            {b === "todos" ? "Todos" : b}
          </button>
        ))}
      </div>
      <p className="mb-3 text-xs text-muted">{shown.length} turno{shown.length === 1 ? "" : "s"} · máximo 3 a la misma hora (uno por barbero)</p>
      <div className="mt-4 space-y-2">
        {shown.length === 0 ? (
          <p className="text-sm text-muted">No hay turnos ese día.</p>
        ) : (
          shown
            .slice()
            .sort((a, b) => a.startsAt.localeCompare(b.startsAt) || a.barber.localeCompare(b.barber))
            .map((a) => (
              <Card key={a.id}>
                <p className="font-medium">{formatWhen(a.startsAt)}</p>
                <p className="text-sm text-cream">{a.barber} · {a.service}</p>
                <p className="text-xs text-muted">{a.clientName} {a.clientPhone}</p>
                {a.status === "booked" ? (
                  <button type="button" className="mt-2 text-xs text-danger" onClick={() => void cancelAppointment({ data: a.id }).then(load)}>
                    Cancelar
                  </button>
                ) : null}
              </Card>
            ))
        )}
      </div>
    </Shell>
  );
}
