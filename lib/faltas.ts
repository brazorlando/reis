import type { Falta } from "@/types/database";

export function contarFaltas(faltas: Falta[]) {
  const total = faltas.filter(
    (f) => f.tipo === "falta" || f.tipo === "falta_justificada"
  ).length;
  const justificadas = faltas.filter(
    (f) => f.tipo === "falta_justificada"
  ).length;
  const injustificadas = faltas.filter((f) => f.tipo === "falta").length;
  const atrasos = faltas.filter((f) => f.tipo === "atraso").length;

  return {
    total,
    justificadas,
    injustificadas,
    atrasos,
  };
}

export function corFaltas(total: number) {
  if (total === 0) return "success" as const;
  if (total <= 5) return "warning" as const;
  return "danger" as const;
}

export const tipoFaltaLabel: Record<Falta["tipo"], string> = {
  presenca: "Presença",
  falta: "Falta",
  falta_justificada: "Falta justificada",
  atraso: "Atraso",
};
