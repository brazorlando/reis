import type { EscolaConfig } from "@/types/database";

/**
 * Configuração padrão (fallback) caso a tabela ainda não esteja carregada.
 */
export const ESCOLA_PADRAO: EscolaConfig = {
  id: "",
  nome: "Escola Rei dos Reis",
  slogan: "Buscai primeiro o reino de Deus",
  logo_url: "/logo.jpg",
  favicon_url: null,
  logo_estilo: "redondo",
  cor_primaria: "#0D1B3E",
  cor_accent: "#D98E2B",
  telefone: null,
  email: null,
  endereco: null,
  facebook_url: null,
  instagram_url: null,
  whatsapp_numero: null,
  atualizado_em: "",
};

/**
 * Extensões de imagem permitidas.
 */
export const EXTENSOES_PERMITIDAS = [
  "jpg",
  "jpeg",
  "png",
  "webp",
  "ico",
  "svg",
];

/**
 * Valida extensão do ficheiro.
 */
export function extensaoValida(nome: string): boolean {
  const ext = nome.split(".").pop()?.toLowerCase() ?? "";
  return EXTENSOES_PERMITIDAS.includes(ext);
}

/**
 * Gera nome único para o ficheiro no storage.
 */
export function gerarNomeFicheiro(original: string, prefixo?: string): string {
  const ext = original.split(".").pop()?.toLowerCase() ?? "jpg";
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const prefix = prefixo ? `${prefixo}-` : "";
  return `${prefix}${timestamp}-${random}.${ext}`;
}

/**
 * Classes CSS do estilo de logo.
 */
export function classesLogo(estilo: EscolaConfig["logo_estilo"]): string {
  switch (estilo) {
    case "redondo":
      return "rounded-full";
    case "quadrado":
      return "rounded-xl";
    case "retangular":
      return "rounded-none";
    default:
      return "rounded-xl";
  }
}
