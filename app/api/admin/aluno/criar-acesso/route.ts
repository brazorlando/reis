import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { aluno_id } = await request.json();

    if (!aluno_id) {
      return NextResponse.json(
        { erro: "ID do aluno obrigatório." },
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

    if (!aluno.bi_documento) {
      return NextResponse.json(
        { erro: "Adicione o documento (BI) antes de criar o acesso." },
        { status: 400 }
      );
    }

    const email = `${aluno.numero_matricula.toLowerCase()}@aluno.reis.local`;
    const senha = aluno.bi_documento.trim();

    // Criar utilizador no auth
    const { data: novoUser, error: authErr } = await admin.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
      user_metadata: {
        nome_completo: aluno.nome_completo,
        role: "aluno",
        aluno_id: aluno.id,
      },
    });

    if (authErr || !novoUser.user) {
      return NextResponse.json(
        { erro: authErr?.message ?? "Erro ao criar acesso." },
        { status: 500 }
      );
    }

    // Criar profile (para consistência com o resto do sistema)
    await admin.from("profiles").upsert({
      id: novoUser.user.id,
      nome_completo: aluno.nome_completo,
      email,
      role: "aluno",
      status: "aprovado",
    });

    // Atualizar aluno com user_id
    const { error: updErr } = await admin
      .from("alunos")
      .update({ user_id: novoUser.user.id })
      .eq("id", aluno.id);

    if (updErr) {
      return NextResponse.json(
        { erro: "Conta criada, mas erro ao associar ao aluno." },
        { status: 500 }
      );
    }

    return NextResponse.json({ sucesso: true });
  } catch {
    return NextResponse.json(
      { erro: "Erro inesperado." },
      { status: 500 }
    );
  }
}
