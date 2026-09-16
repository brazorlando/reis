import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { ProfessorTable } from "@/components/admin/professores/professor-table";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types/database";

const filtros = [
  { valor: "pendente", label: "Pendentes" },
  { valor: "aprovado", label: "Aprovados" },
  { valor: "rejeitado", label: "Rejeitados" },
  { valor: "suspenso", label: "Suspensos" },
  { valor: "todos", label: "Todos" },
];

export default async function ProfessoresPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const statusFiltro = params.status ?? "pendente";

  const supabase = await createClient();

  // Base query
  let query = supabase
    .from("profiles")
    .select("*")
    .neq("role", "admin")
    .order("criado_em", { ascending: false });

  if (statusFiltro !== "todos") {
    query = query.eq("status", statusFiltro);
  }

  const { data: professores, error } = await query;

  // Contagens por estado
  const { data: todos } = await supabase
    .from("profiles")
    .select("status")
    .neq("role", "admin");

  const contagens = {
    pendente: todos?.filter((p) => p.status === "pendente").length ?? 0,
    aprovado: todos?.filter((p) => p.status === "aprovado").length ?? 0,
    rejeitado: todos?.filter((p) => p.status === "rejeitado").length ?? 0,
    suspenso: todos?.filter((p) => p.status === "suspenso").length ?? 0,
    todos: todos?.length ?? 0,
  };

  return (
    <>
      <Header
        titulo="Professores"
        subtitulo="Gestão de funcionários da escola"
      />

      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {/* Cabeçalho */}
          <div className="mb-6">
            <h2 className="font-serif text-2xl text-primary mb-1">
              Funcionários
            </h2>
            <p className="text-sm text-slate-500">
              Aprove, rejeite ou consulte os cadastros.
            </p>
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            {filtros.map((f) => {
              const ativo = statusFiltro === f.valor;
              const contagem =
                contagens[f.valor as keyof typeof contagens] ?? 0;

              return (
                <Link
                  key={f.valor}
                  href={`/admin/professores?status=${f.valor}`}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
                    ativo
                      ? "bg-primary text-white"
                      : "bg-surface border border-border text-slate-600 hover:bg-primary-50 hover:text-primary"
                  )}
                >
                  {f.label}
                  <span
                    className={cn(
                      "px-1.5 py-0.5 rounded text-xs",
                      ativo
                        ? "bg-white/20"
                        : "bg-primary-50 text-primary"
                    )}
                  >
                    {contagem}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Erro */}
          {error && (
            <div className="bg-danger-50 border border-danger/20 rounded-lg p-4 text-danger text-sm mb-6">
              {error.message}
            </div>
          )}

          {/* Tabela */}
          <ProfessorTable
            professores={(professores as Profile[]) ?? []}
            vazio={
              statusFiltro === "pendente"
                ? "Sem cadastros pendentes. Bom trabalho!"
                : `Nenhum funcionário com estado "${statusFiltro}".`
            }
          />
        </div>
      </main>
    </>
  );
}
