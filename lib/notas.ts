import type { Nota } from "@/types/database";

/**
 * Média de um trimestre = (ACS1 + ACS2 + AP) / 3
 * Ignora avaliações que ainda não foram lançadas.
 */
export function mediaTrimestre(
  nota: Pick<Nota, "acs1" | "acs2" | "ap">
): number | null {
  const valores = [nota.acs1, nota.acs2, nota.ap].filter(
    (v): v is number => v !== null
  );
  if (valores.length === 0) return null;
  const soma = valores.reduce((a, b) => a + b, 0);
  return Number((soma / valores.length).toFixed(2));
}

/**
 * Média final = (T1 + T2 + T3) / 3
 * Só conta trimestres com média já lançada.
 */
export function mediaFinal(
  notas: Pick<Nota, "trimestre" | "acs1" | "acs2" | "ap">[]
): number | null {
  const medias = notas
    .map((n) => mediaTrimestre(n))
    .filter((v): v is number => v !== null);
  if (medias.length === 0) return null;
  const soma = medias.reduce((a, b) => a + b, 0);
  return Number((soma / medias.length).toFixed(2));
}

/**
 * Cor da nota para o badge (0-20).
 */
export function corNota(media: number | null): "success" | "warning" | "danger" | "outline" {
  if (media === null) return "outline";
  if (media >= 14) return "success";      // Bom
  if (media >= 10) return "warning";      // Suficiente
  return "danger";                         // Negativa
}

/**
 * Texto do estado da nota.
 */
export function estadoNota(media: number | null): string {
  if (media === null) return "Sem nota";
  if (media >= 14) return "Aprovado";
  if (media >= 10) return "Suficiente";
  return "Reprovado";
}
