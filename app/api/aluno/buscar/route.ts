import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() ?? "";

    if (q.length < 2) {
      return NextResponse.json({ resultados: [] });
    }

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Buscar alunos ativos que tenham acesso (user_id) e nome bate
    const { data, error } = await admin
      .from("alunos")
      .select(
        `
        id, nome_completo, numero_matricula, turma_id,
        turmas:turma_id (
          id, nome,
          classes:classe_id (nome, numero)
        )
      `
      )
      .ilike("nome_completo", `%${q}%`)
      .not("user_id", "is", null)
      .eq("status", "ativo")
      .order("nome_completo")
      .limit(8);

    if (error) {
      return NextResponse.json(
        { erro: "Erro na busca." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      resultados: (data ?? []).map((a) => {
        const turma = a.turmas as unknown as
          | { nome: string; classes: { nome: string } | null }
          | null;
        return {
          id: a.id,
          nome_completo: a.nome_completo,
          numero_matricula: a.numero_matricula,
          turma_nome: turma?.nome ?? null,
          classe_nome: turma?.classes?.nome ?? null,
        };
      }),
    });
  } catch {
    return NextResponse.json(
      { erro: "Erro inesperado." },
      { status: 500 }
    );
  }
}
