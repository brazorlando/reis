import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { aluno_id, documento } = await request.json();

    if (!aluno_id || !documento) {
      return NextResponse.json(
        { erro: "Dados incompletos." },
        { status: 400 }
      );
    }

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Buscar aluno
    const { data: aluno, error: alunoErr } = await admin
      .from("alunos")
      .select("id, numero_matricula, bi_documento, user_id")
      .eq("id", aluno_id)
      .single();

    if (alunoErr || !aluno) {
      return NextResponse.json(
        { erro: "Aluno não encontrado." },
        { status: 404 }
      );
    }

    if (!aluno.user_id) {
      return NextResponse.json(
        { erro: "Ainda não tem acesso. Contacte a escola." },
        { status: 403 }
      );
    }

    // Validar documento
    if ((aluno.bi_documento ?? "").trim() !== documento.trim()) {
      return NextResponse.json(
        { erro: "Documento incorreto." },
        { status: 401 }
      );
    }

    // Criar cliente Supabase com cookies
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
       cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (
            cookiesToSet: {
              name: string;
              value: string;
              options?: Record<string, unknown>;
            }[]
          ) => {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const email = `${aluno.numero_matricula.toLowerCase()}@aluno.reis.local`;

    const { error: loginErr } = await supabase.auth.signInWithPassword({
      email,
      password: documento.trim(),
    });

    if (loginErr) {
      return NextResponse.json(
        { erro: "Erro ao iniciar sessão." },
        { status: 401 }
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
