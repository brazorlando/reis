import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import {
  Users,
  GraduationCap,
  School,
  BookOpen,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

export default async function AdminDashboard() {
  const supabase = await createClient();

  // Métricas
  const [
    { count: totalProfessores },
    { count: professoresPendentes },
    { count: totalAlunos },
    { count: totalTurmas },
    { count: totalDisciplinas },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("status", "aprovado"),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("status", "pendente"),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true }),
    supabase.from("turmas").select("*", { count: "exact", head: true }),
    supabase.from("disciplinas").select("*", { count: "exact", head: true }),
  ]);

  // Pendentes (últimos 5)
  const { data: pendentes } = await supabase
    .from("profiles")
    .select("id, nome_completo, email, criado_em")
    .eq("status", "pendente")
    .order("criado_em", { ascending: false })
    .limit(5);

  const cards = [
    {
      titulo: "Professores",
      valor: totalProfessores ?? 0,
      icone: Users,
      cor: "text-primary",
      bg: "bg-primary-50",
    },
    {
      titulo: "Alunos",
      valor: totalAlunos ?? 0,
      icone: GraduationCap,
      cor: "text-accent",
      bg: "bg-accent-50",
    },
    {
      titulo: "Turmas",
      valor: totalTurmas ?? 0,
      icone: School,
      cor: "text-success",
      bg: "bg-success-50",
    },
    {
      titulo: "Disciplinas",
      valor: totalDisciplinas ?? 0,
      icone: BookOpen,
      cor: "text-info",
      bg: "bg-info-50",
    },
  ];

  return (
    <>
      <Header
        titulo="Dashboard"
        subtitulo="Visão geral da escola"
      />

      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        {/* Cards de métricas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {cards.map((c) => {
            const Icone = c.icone;
            return (
              <div
                key={c.titulo}
                className="bg-surface border border-border rounded-xl p-5 shadow-card"
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-10 h-10 rounded-lg ${c.bg} flex items-center justify-center ${c.cor}`}
                  >
                    <Icone size={20} />
                  </div>
                </div>
                <p className="text-3xl font-serif text-primary mb-1">
                  {c.valor}
                </p>
                <p className="text-sm text-slate-500">{c.titulo}</p>
              </div>
            );
          })}
        </div>

        {/* Alerta de pendentes */}
        {professoresPendentes && professoresPendentes > 0 && (
          <div className="bg-accent-50 border border-accent/20 rounded-xl p-5 mb-8 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent text-white flex items-center justify-center shrink-0">
                <Clock size={20} />
              </div>
              <div>
                <p className="font-medium text-primary">
                  {professoresPendentes} cadastro
                  {professoresPendentes > 1 ? "s" : ""} pendente
                  {professoresPendentes > 1 ? "s" : ""}
                </p>
                <p className="text-sm text-slate-600">
                  Aprove ou rejeite os pedidos de registo.
                </p>
              </div>
            </div>
            <Link
              href="/admin/professores?status=pendente"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-600 transition-colors shrink-0"
            >
              Ver pendentes
              <ArrowRight size={16} />
            </Link>
          </div>
        )}

        {/* Dois painéis: pendentes + atividade */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Últimos pendentes */}
          <div className="bg-surface border border-border rounded-xl shadow-card">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h2 className="font-serif text-lg text-primary">
                Últimos cadastros
              </h2>
              <Link
                href="/admin/professores"
                className="text-xs text-accent hover:underline"
              >
                Ver todos
              </Link>
            </div>

            <div className="divide-y divide-border">
              {pendentes && pendentes.length > 0 ? (
                pendentes.map((p) => (
                  <div
                    key={p.id}
                    className="px-5 py-3 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-primary truncate">
                        {p.nome_completo}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {p.email}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-accent-50 text-accent-700 border border-accent/20 shrink-0">
                      Pendente
                    </span>
                  </div>
                ))
              ) : (
                <div className="px-5 py-8 text-center text-sm text-slate-500">
                  Sem cadastros pendentes.
                </div>
              )}
            </div>
          </div>

          {/* Atalhos rápidos */}
          <div className="bg-surface border border-border rounded-xl shadow-card">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="font-serif text-lg text-primary">
                Ações rápidas
              </h2>
            </div>

            <div className="p-5 grid grid-cols-2 gap-3">
              <AtalhoRapido
                href="/admin/pin"
                icone={CheckCircle2}
                titulo="PIN de cadastro"
                descricao="Gerir o PIN ativo"
              />
              <AtalhoRapido
                href="/admin/professores?status=pendente"
                icone={XCircle}
                titulo="Aprovações"
                descricao="Pendentes de revisão"
              />
              <AtalhoRapido
                href="/admin/estrutura/turmas"
                icone={School}
                titulo="Criar turma"
                descricao="Adicionar nova turma"
              />
              <AtalhoRapido
                href="/admin/comunicacao"
                icone={Users}
                titulo="Comunicado"
                descricao="Enviar aviso"
              />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

function AtalhoRapido({
  href,
  icone: Icone,
  titulo,
  descricao,
}: {
  href: string;
  icone: React.ComponentType<{ size?: string | number }>;
  titulo: string;
  descricao: string;
}) {
  return (
    <Link
      href={href}
      className="p-4 rounded-lg border border-border hover:border-accent/40 hover:bg-accent-50/30 transition-colors group"
    >
      <Icone
        size={20}
      />
      <p className="text-sm font-medium text-primary mt-2">{titulo}</p>
      <p className="text-xs text-slate-500 mt-0.5">{descricao}</p>
    </Link>
  );
}
