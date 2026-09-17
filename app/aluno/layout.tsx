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
    .single();

  if (!profile || profile.role !== "aluno" || profile.status !== "aprovado") {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AlunoSidebar />
      <div className="flex-1 flex flex-col min-w-0">{children}</div>
    </div>
  );
}
