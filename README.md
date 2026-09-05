# ASGARD Puntos

Webapp de fidelización para **ASGARD ESTUDIO**. El barbero carga puntos por visita; el cliente los canjea por servicios (perfilado, descuentos, corte gratis).

Modo prueba / portafolio: 4 clientes seed, un barbero, clave de demo.

**Live:** [asgard-puntos-d2ru.vercel.app](https://asgard-puntos-d2ru.vercel.app)  
**Landing (repo hermano):** [asgard-estudio](https://github.com/Migueltejada86/asgard-estudio) → [migueltejada86.github.io/asgard-estudio](https://migueltejada86.github.io/asgard-estudio/)

---

## Qué problema resuelve

La barbería llevaba puntos en papel / captura de pantalla. Esta app:

- identifica al cliente por DNI
- suma puntos por acción (corte, combo, referido, reseña, IG)
- canjea premios y genera un código
- el barbero marca el código como entregado
- no pisa el mismo premio pendiente dos veces

La landing pública sigue en GitHub Pages (gratis). Esta app necesita sesión + Postgres, por eso va a **Vercel Hobby + Neon**.

## Demo (sin crear cuenta)

Entrá a [/login](https://asgard-puntos-d2ru.vercel.app/login) y tocá **Marcelo · ver las 4 fichas**.  
No hace falta escribir la clave.

Clave de todas las cuentas: `Belisario#340AG`  
Código de equipo: `ASGARD`

| Rol | Quién | Email | Puntos iniciales |
|---|---|---|---|
| Barbero | Marcelo | marcelo@asgardestudio.com | — |
| Cliente | Sofía Herrera | sofia@asgardestudio.com | 180 |
| Cliente | Braian Cortez | braian@asgardestudio.com | 130 |
| Cliente | Lucía Benítez | lucia@asgardestudio.com | 80 |
| Cliente | Franco Díaz | franco@asgardestudio.com | 45 |

**Como Marcelo:** elegí una ficha → sumá un corte (`+20`) o canjeá un premio. Aparece un código. Abajo, **Entregar premio**.

**Como cliente:** en `/login` tocá Sofía / Braian / Lucía / Franco. Ves el saldo y **Canjear**.

Premios seed:

| Premio | Costo |
|---|---|
| Perfilado gratis | 80 |
| 10% off en cortes | 100 |
| 15% off en cortes | 160 |
| 50% combo corte + barba | 180 |
| Corte gratis | 250 |

## Stack

| Capa | Tech |
|---|---|
| UI | React 19, TanStack Start / Router, Tailwind 4, Cinzel + Inter |
| Auth | Better Auth (email/password), cookies `__Host-` |
| Datos | Neon Postgres (prod) / PGLite (dev sin `DATABASE_URL`) |
| SQL | migraciones en `migrations/*.sql`, se aplican en build y en runtime |
| Hosting | Vercel Hobby |

## Flujo

```
Landing Pages  --Puntos-->  /login  -->  /puntos
                                   |
                    Marcelo (barbero)     Cliente (DNI)
                    sumar / canjear       ver saldo / canjear
                    entregar código
```

Tablas principales: `shops`, `profiles`, `clients`, `prizes`, `claims`, `ledger` + esquema Better Auth (`user`, `session`, `account`).

## Cómo corre en local

```bash
git clone git@github.com:Migueltejada86/asgard-puntos.git
cd asgard-puntos
npm install
npm run dev
```

Vite sirve en `http://localhost:8080`. Sin `DATABASE_URL` usa PGLite en memoria (se borra al reiniciar).

```bash
npm run build      # vite build + migraciones si hay DATABASE_URL
npm run typecheck
```

## Deploy (gratis)

1. Repo en GitHub (este).
2. Base Neon: connection string **pooled** (`-pooler`).
3. Vercel → Import project → env:

| Variable | Valor |
|---|---|
| `DATABASE_URL` | postgres de Neon (pooled) |
| `BETTER_AUTH_SECRET` | secreto ≥ 32 caracteres |
| `BETTER_AUTH_URL` | `https://asgard-puntos-d2ru.vercel.app` (sin slash final) |

Hobby se duerme: la primera visita del día puede tardar 2–3 s.

**No** mezclar esta carpeta con el repo de la landing: `node_modules` rompe GitHub Pages.

## Estructura

```
src/
  routes/           index (landing in-app), login, puntos, api/auth
  lib/auth/         Better Auth server/client
  lib/loyalty-api.ts  server functions (puntos, canje, seed)
  lib/demo.ts       cuentas de prueba
  components/       shell + logo
migrations/         0001 auth … 0005 seed de 4 clientes
```

## Decisiones

- **DNI, no email, para la ficha:** es como el local identifica gente.
- **Un barbero ve todas las fichas; un cliente solo la suya.**
- **Canje genera código, no descuenta el servicio solo:** el barbero confirma la entrega (como el papel que usaban).
- **Seed idempotente:** `ensureDemoClients` rellena las 4 fichas si la shop está vacía.
- **Origen de auth:** `trustedOrigins` incluye `*.vercel.app` para no romper el login en Hobby.

## Repo relacionado

Landing estática (reserva WhatsApp, galería, SEO):  
[github.com/Migueltejada86/asgard-estudio](https://github.com/Migueltejada86/asgard-estudio)
