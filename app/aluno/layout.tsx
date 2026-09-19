import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AlunoSidebar } from "@/components/layout/aluno-sidebar";

export default async function AlunoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .maybeSingle();

  // Se o profile não existir ou estiver errado → mostrar erro, NÃO redirecionar
  if (!profile || profile.role !== "aluno" || profile.status !== "aprovado") {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-background">
        <div className="max-w-md text-center">
          <h1 className="font-serif text-2xl text-primary mb-3">
            Acesso indisponível
          </h1>
          <p className="text-slate-600 text-sm">
            A sua conta de aluno ainda não está pronta. Contacte a escola.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AlunoSidebar />
      <div className="flex-1 flex flex-col min-w-0">{children}</div>
    </div>
  );
}
