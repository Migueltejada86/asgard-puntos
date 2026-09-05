import { useEffect, useState } from "react";
import { Field, GoldBtn, inputClass } from "@/components/shell";
import {
  BARBERS,
  SERVICES,
  bookPublic,
  listPublicSlots,
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
  return `${parts.find((p) => p.type === "year")?.value}-${parts.find((p) => p.type === "month")?.value}-${parts.find((p) => p.type === "day")?.value}`;
}

export function PublicBooking() {
  const [date, setDate] = useState(todayISO);
  const [slots, setSlots] = useState<SlotRow[]>([]);
  const [service, setService] = useState("corte");
  const [barber, setBarber] = useState<BarberName | "">("");
  const [time, setTime] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState("");

  function load() {
    void listPublicSlots({ data: date })
      .then((s) => {
        setSlots(s);
        setTime("");
        setBarber("");
      })
      .catch((e: Error) => setMsg(e.message));
  }
  useEffect(load, [date]);

  const selected = slots.find((s) => s.time === time);
  const freeForTime = selected?.free ?? [];

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        setMsg("");
        setOk("");
        if (!barber || !time) {
          setMsg("Elegí horario y barbero.");
          return;
        }
        void bookPublic({
          data: { date, time, barber, service, name, phone, note },
        })
          .then((r) => {
            setOk(`Turno confirmado: ${r.service} con ${r.barber} el ${r.date} a las ${r.time}.`);
            setName("");
            setPhone("");
            setNote("");
            setTime("");
            setBarber("");
            load();
          })
          .catch((err: Error) => setMsg(err.message));
      }}
    >
      <p className="text-sm text-muted">
        Marcelo, Ulises y Alexis. Un barbero no puede tener dos clientes a la misma hora. Máximo tres turnos en un horario.
      </p>
      <Field label="Nombre">
        <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} autoComplete="name" />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="WhatsApp">
          <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} required inputMode="tel" placeholder="+54 9 …" />
        </Field>
        <Field label="Servicio">
          <select className={inputClass} value={service} onChange={(e) => setService(e.target.value)}>
            {SERVICES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Fecha">
        <input
          className={inputClass}
          type="date"
          min={todayISO()}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </Field>
      <div>
        <p className="mb-2 text-xs font-medium tracking-[0.16em] text-muted uppercase">Horario</p>
        {slots.length === 0 ? (
          <p className="text-sm text-muted">Cerrado (domingo) o sin horarios disponibles.</p>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
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
                  <span className="mt-0.5 block text-[10px] text-muted">
                    {full ? "completo" : `${s.free.length}/3`}
                  </span>
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
              const available = freeForTime.includes(b);
              return (
                <button
                  key={b}
                  type="button"
                  disabled={!available}
                  onClick={() => setBarber(b)}
                  className={`min-h-12 rounded-md border text-sm ${
                    barber === b
                      ? "border-primary bg-primary/20 text-cream"
                      : available
                        ? "border-border"
                        : "border-border text-muted opacity-35"
                  }`}
                >
                  {b}
                  {!available ? <span className="block text-[10px]">ocupado</span> : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
      <Field label="Comentario (opcional)">
        <textarea className={`${inputClass} min-h-20 py-2`} value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} placeholder="Preferencias de corte" />
      </Field>
      {msg ? <p className="text-sm text-danger">{msg}</p> : null}
      {ok ? <p className="text-sm text-cream">{ok}</p> : null}
      <GoldBtn type="submit">Confirmar reserva</GoldBtn>
    </form>
  );
}
