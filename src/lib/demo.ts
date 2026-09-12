/** Cuentas de prueba del local. No uses esta clave en producción. */
export const DEMO = {
  password: "Belisario#340AG",
  joinCode: "ASGARD",
  barber: {
    email: "marcelo@asgardestudio.com",
    name: "Marcelo",
  },
  barbers: [
    { email: "marcelo@asgardestudio.com", name: "Marcelo", phone: "5493547566940" },
    { email: "ulises@asgardestudio.com", name: "Ulises", phone: "5493547612770" },
    { email: "alexis@asgardestudio.com", name: "Alexis", phone: "5493547665135" },
  ],
  clients: [
    { id: "cli-sofia", email: "sofia@asgardestudio.com", dni: "35901876", name: "Sofía Herrera", points: 180 },
    { id: "cli-braian", email: "braian@asgardestudio.com", dni: "30403722", name: "Braian Cortez", points: 130 },
    { id: "cli-lucia", email: "lucia@asgardestudio.com", dni: "38765432", name: "Lucía Benítez", points: 80 },
    { id: "cli-franco", email: "franco@asgardestudio.com", dni: "40111222", name: "Franco Díaz", points: 45 },
  ],
} as const;

export type DemoClient = (typeof DEMO.clients)[number];
export type DemoBarber = (typeof DEMO.barbers)[number];
