import type { TiebreakMethod } from "./types";

export type TiebreakInfo = {
  shortLabel: string;
  name: string;
  description: string;
};

export const TIEBREAK_INFO = {
  DE: {
    shortLabel: "ED",
    name: "Encuentro Directo",
    description:
      "Si dos participantes empatan en puntos, queda arriba quien ganó la partida entre ellos. En empates múltiples se evalúan las partidas entre los jugadores empatados.",
  },
  TN: {
    shortLabel: "TN",
    name: "Tablas con Negras",
    description:
      "Similar al encuentro directo, pero si la partida terminó en tablas, gana el desempate quien jugó con piezas negras.",
  },
  SB: {
    shortLabel: "SB",
    name: "Sonneborn-Berger",
    description:
      "Suma los puntos finales de los rivales vencidos y la mitad de los puntos de los rivales contra los que se empató.",
  },
  Buchholz: {
    shortLabel: "BU",
    name: "Buchholz",
    description: "Suma los puntos finales de todos los rivales enfrentados.",
  },
  Koya: {
    shortLabel: "KO",
    name: "Koya",
    description:
      "Cuenta los puntos logrados contra rivales que terminaron con al menos el 50% de los puntos posibles.",
  },
  PN: {
    shortLabel: "PN",
    name: "Partidas Ganadas con Negras",
    description: "Cuenta las victorias conseguidas jugando con piezas negras.",
  },
} satisfies Record<TiebreakMethod, TiebreakInfo>;
