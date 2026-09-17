import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function idValido(v: unknown): string | null {
  if (!v) return null;
  const s = String(v).trim();
  if (s === "" || s === "undefined" || s === "null") return null;
  return s;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const aluno_id = idValido(body.aluno_id);

    if (!aluno_id) {
      return NextResponse.json(
        { erro: "ID do aluno inválido." },
        { status: 400 }
      );
    }

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: aluno, error: alunoErr } = await admin
      .from("alunos")
      .select("id, numero_matricula, nome_completo, bi_documento, user_id")
      .eq("id", aluno_id)
      .single();

    if (alunoErr || !aluno) {
      return NextResponse.json(
        { erro: "Aluno não encontrado." },
        { status: 404 }
      );
    }

    if (aluno.user_id) {
      return NextResponse.json({ sucesso: true, ja_existe: true });
    }

    if (!aluno.bi_documento || aluno.bi_documento.trim() === "") {
      return NextResponse.json(
        { erro: "Adicione o documento (BI) antes de criar o acesso." },
        { status: 400 }
      );
    }

    const email = `${aluno.numero_matricula.toLowerCase()}@aluno.reis.local`;
    const senha = aluno.bi_documento.trim();

    const { data: novoUser, error: authErr } =
      await admin.auth.admin.createUser({
        email,
        password: senha,
        email_confirm: true,
        user_metadata: {
          nome_completo: aluno.nome_completo,
          role: "aluno",
          aluno_id: aluno.id,
        },
      });

    if (authErr || !novoUser || !novoUser.user || !novoUser.user.id) {
      return NextResponse.json(
        { erro: authErr?.message ?? "Erro ao criar acesso no auth." },
        { status: 500 }
      );
    }

    const userId = idValido(novoUser.user.id);
    if (!userId) {
      return NextResponse.json(
        { erro: "Erro: o servidor não retornou um ID válido." },
        { status: 500 }
      );
    }

    const { error: profErr } = await admin.from("profiles").upsert(
      {
        id: userId,
        nome_completo: aluno.nome_completo,
        email,
        role: "aluno",
        status: "aprovado",
      },
      { onConflict: "id" }
    );

    if (profErr) {
      return NextResponse.json(
        { erro: "Erro ao criar perfil: " + profErr.message },
        { status: 500 }
      );
    }

    const { error: updErr } = await admin
      .from("alunos")
      .update({ user_id: userId })
      .eq("id", aluno.id);

    if (updErr) {
      return NextResponse.json(
        { erro: "Conta criada, mas erro ao associar: " + updErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ sucesso: true });
  } catch (e) {
    return NextResponse.json(
      { erro: "Erro inesperado: " + (e as Error).message },
      { status: 500 }
    );
  }
}
