import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfessorSidebar } from "@/components/layout/professor-sidebar";

export default async function ProfessorLayout({
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
    .single();

  if (
    !profile ||
    profile.role !== "funcionario" ||
    profile.status !== "aprovado"
  ) {
    redirect("/login");
  }

  // Verificar se é diretor de alguma turma
  const { count } = await supabase
    .from("turmas")
    .select("*", { count: "exact", head: true })
    .eq("diretor_turma_id", user.id);

  const isDiretor = (count ?? 0) > 0;

  return (
    <div className="flex min-h-screen bg-background">
      <ProfessorSidebar isDiretor={isDiretor} />
      <div className="flex-1 flex flex-col min-w-0">{children}</div>
    </div>
  );
}
