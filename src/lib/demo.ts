/** Cuentas de prueba del local. No uses esta clave en producción. */
export const DEMO = {
  password: "Belisario#340AG",
  joinCode: "ASGARD",
  barber: {
    email: "marcelo@asgardestudio.test",
    name: "Marcelo",
  },
  clients: [
    { id: "cli-sofia", email: "sofia@asgardestudio.test", dni: "35901876", name: "Sofía Herrera", points: 180 },
    { id: "cli-braian", email: "braian@asgardestudio.test", dni: "30403722", name: "Braian Cortez", points: 130 },
    { id: "cli-lucia", email: "lucia@asgardestudio.test", dni: "38765432", name: "Lucía Benítez", points: 80 },
    { id: "cli-franco", email: "franco@asgardestudio.test", dni: "40111222", name: "Franco Díaz", points: 45 },
  ],
} as const;

export type DemoClient = (typeof DEMO.clients)[number];
