import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options?: Record<string, unknown>;
          }[]
        ) {
          // 1. Atualizar o request (para os componentes abaixo)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // 2. Recriar a response com os cookies atualizados
          supabaseResponse = NextResponse.next({ request });
          // 3. Escrever os cookies na response (para o browser guardar)
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // ⚠️ IMPORTANTE: chamar getUser renova a sessão se o token expirou
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // Rotas públicas
  const rotasPublicas = ["/", "/login", "/cadastro", "/sobre", "/contacto"];
  const ehRotaPublica = rotasPublicas.some(
    (r) => path === r || path.startsWith(r + "/")
  );

  // Sem sessão em rota protegida → login
  if (!user && !ehRotaPublica && !path.startsWith("/api")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Com sessão em /login → redirecionar por role
  if (user && path === "/login") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const url = request.nextUrl.clone();
    if (profile?.role === "admin") url.pathname = "/admin";
    else if (profile?.role === "funcionario") url.pathname = "/professor";
    else if (profile?.role === "aluno") url.pathname = "/aluno";
    else url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // Verificar role em rotas protegidas
  if (
    user &&
    (path.startsWith("/admin") ||
      path.startsWith("/professor") ||
      path.startsWith("/aluno"))
  ) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, status")
      .eq("id", user.id)
      .single();

    if (!profile || profile.status !== "aprovado") {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("erro", "pendente");
      return NextResponse.redirect(url);
    }

    // Bloquear acessos cruzados
    if (profile.role === "admin" && !path.startsWith("/admin")) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin";
      return NextResponse.redirect(url);
    }
    if (profile.role === "funcionario" && path.startsWith("/admin")) {
      const url = request.nextUrl.clone();
      url.pathname = "/professor";
      return NextResponse.redirect(url);
    }
    if (
      profile.role === "aluno" &&
      (path.startsWith("/admin") || path.startsWith("/professor"))
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/aluno";
      return NextResponse.redirect(url);
    }
  }

  // ⚠️ Retornar a response com os cookies renovados
  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
