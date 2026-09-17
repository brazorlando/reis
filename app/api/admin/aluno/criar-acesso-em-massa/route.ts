import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Buscar todos os alunos com BI mas sem acesso
    const { data: alunos, error: fetchErr } = await admin
      .from("alunos")
      .select("id, numero_matricula, nome_completo, bi_documento, user_id")
      .is("user_id", null)
      .not("bi_documento", "is", null);

    if (fetchErr) {
      return NextResponse.json(
        { erro: "Erro ao buscar alunos: " + fetchErr.message },
        { status: 500 }
      );
    }

    const resultados: {
      aluno: string;
      sucesso: boolean;
      mensagem: string;
    }[] = [];

    for (const aluno of alunos ?? []) {
      // Validar BI
      const bi = (aluno.bi_documento ?? "").trim();
      if (!bi) {
        resultados.push({
          aluno: aluno.nome_completo,
          sucesso: false,
          mensagem: "Sem BI",
        });
        continue;
      }

      const email = `${aluno.numero_matricula.toLowerCase()}@aluno.reis.local`;

      // Criar user no auth
      const { data: novoUser, error: authErr } =
        await admin.auth.admin.createUser({
          email,
          password: bi,
          email_confirm: true,
          user_metadata: {
            nome_completo: aluno.nome_completo,
            role: "aluno",
            aluno_id: aluno.id,
          },
        });

      if (authErr || !novoUser?.user?.id) {
        // Verificar se já existe na auth
        if (
          authErr?.message?.includes("already") ||
          authErr?.message?.includes("existe")
        ) {
          // Tentar buscar o user pelo email
          const { data: usersList } = await admin.auth.admin.listUsers();
          const existente = usersList?.users?.find((u) => u.email === email);

          if (existente) {
            // Associar ao aluno
            await admin.from("profiles").upsert({
              id: existente.id,
              nome_completo: aluno.nome_completo,
              email,
              role: "aluno",
              status: "aprovado",
            });

            await admin
              .from("alunos")
              .update({ user_id: existente.id })
              .eq("id", aluno.id);

            resultados.push({
              aluno: aluno.nome_completo,
              sucesso: true,
              mensagem: "Acesso ligado (já existia)",
            });
            continue;
          }
        }

        resultados.push({
          aluno: aluno.nome_completo,
          sucesso: false,
          mensagem: authErr?.message ?? "Erro ao criar",
        });
        continue;
      }

      // Criar profile
      await admin.from("profiles").upsert({
        id: novoUser.user.id,
        nome_completo: aluno.nome_completo,
        email,
        role: "aluno",
        status: "aprovado",
      });

      // Associar
      await admin
        .from("alunos")
        .update({ user_id: novoUser.user.id })
        .eq("id", aluno.id);

      resultados.push({
        aluno: aluno.nome_completo,
        sucesso: true,
        mensagem: "Acesso criado",
      });
    }

    return NextResponse.json({
      total: alunos?.length ?? 0,
      sucesso: resultados.filter((r) => r.sucesso).length,
      falhas: resultados.filter((r) => !r.sucesso).length,
      detalhes: resultados,
    });
  } catch (e) {
    return NextResponse.json(
      { erro: "Erro inesperado: " + (e as Error).message },
      { status: 500 }
    );
  }
}
