import { createClient } from "@/lib/supabase/client";
import { extensaoValida, gerarNomeFicheiro } from "@/lib/escola";

type UploadResult = {
  url: string | null;
  erro: string | null;
};

/**
 * Faz upload de um ficheiro para um bucket do Supabase.
 */
export async function uploadFicheiro(
  file: File,
  bucket: "assets" | "alunos",
  prefixo?: string
): Promise<UploadResult> {
  // Validar extensão
  if (!extensaoValida(file.name)) {
    return {
      url: null,
      erro: "Formato não permitido. Use JPG, PNG, WEBP, ICO ou SVG.",
    };
  }

  const supabase = createClient();
  const nome = gerarNomeFicheiro(file.name, prefixo);

  const { error } = await supabase.storage.from(bucket).upload(nome, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    return { url: null, erro: "Erro ao enviar: " + error.message };
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(nome);
  return { url: data.publicUrl, erro: null };
}

/**
 * Apaga um ficheiro do bucket (extrai o nome do URL).
 */
export async function apagarFicheiro(
  url: string,
  bucket: "assets" | "alunos"
): Promise<void> {
  try {
    const nome = url.split("/").pop();
    if (!nome) return;
    const supabase = createClient();
    await supabase.storage.from(bucket).remove([nome]);
  } catch {
    // Ignora erros silenciosamente
  }
}
