import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);
  const path = request.nextUrl.pathname;

  const precisaVerificar =
    path.startsWith("/admin") ||
    path.startsWith("/professor") ||
    path.startsWith("/aluno");

  if (!precisaVerificar) return response;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: () => {},
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return response;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .single();

  if (!profile) return response;

  const role = profile.role;
  const status = profile.status;

  if (status !== "aprovado") {
    return NextResponse.redirect(new URL("/login?erro=pendente", request.url));
  }

  if (role === "admin" && !path.startsWith("/admin")) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  if (role === "funcionario" && path.startsWith("/admin")) {
    return NextResponse.redirect(new URL("/professor", request.url));
  }

  if (
    role === "aluno" &&
    (path.startsWith("/admin") || path.startsWith("/professor"))
  ) {
    return NextResponse.redirect(new URL("/aluno", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
