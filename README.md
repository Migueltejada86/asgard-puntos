# ASGARD Puntos

App de fidelización para **ASGARD ESTUDIO** (barbería, Alta Gracia).  
Modo prueba / portafolio: 4 clientes con puntos, un barbero, clave de demo.

Landing pública (sin tattoo, con elección de barbero):  
https://migueltejada86.github.io/asgard-estudio/

Esta app **no** va a GitHub Pages. Va a **Vercel** (gratis).

## Cuentas de prueba

Clave de todos: `Belisario#340AG`

| Rol | Email | Qué ves |
|-----|--------|---------|
| Barbero | marcelo@asgardestudio.test | Las 4 fichas y suma puntos |
| Cliente | sofia@asgardestudio.test | Tarjeta con 180 pts |
| Cliente | braian@asgardestudio.test | 130 pts |
| Cliente | lucia@asgardestudio.test | 80 pts |
| Cliente | franco@asgardestudio.test | 45 pts |

Código de equipo: `ASGARD`

## Publicar en Vercel (gratis)

1. Entrá a [vercel.com](https://vercel.com) con GitHub. Plan **Hobby**.
2. **Add New → Project** → este repo `asgard-puntos`.
3. Creá una base gratis en [neon.tech](https://neon.tech) (o el Postgres que ofrezca Vercel).
4. En Vercel → Settings → Environment Variables:

| Variable | Valor |
|----------|--------|
| `DATABASE_URL` | connection string de Neon (pooled) |
| `BETTER_AUTH_SECRET` | una frase larga cualquiera, ej. `asgard-puntos-portfolio-2026` |
| `BETTER_AUTH_URL` | la URL de Vercel, ej. `https://asgard-puntos.vercel.app` |

5. Deploy. Si cambia la URL, actualizá `BETTER_AUTH_URL` y redesplegá.

La primera visita del día puede tardar 2–3 segundos (la base gratis se duerme).

**No** subas esta carpeta al repo de la landing: rompe GitHub Pages.

## En la compu

```bash
npm install
npm run dev
```

Abrí la URL que imprime Vite. Entrá a `/login` → **Entrar como Marcelo**.
