"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Users,
  ClipboardList,
  CalendarCheck,
  BookOpen,
  ArrowRight,
  Loader2,
  AlertCircle,
  Star,
} from "lucide-react";
import type {
  Atribuicao,
  Classe,
  Disciplina,
  Turma,
} from "@/types/database";

export default function ProfessorDashboard() {
  const [atribuicoes, setAtribuicoes] = useState<Atribuicao[]>([]);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [classes, setClasses] = useState<Classe[]>([]);
  const [turmasDiretor, setTurmasDiretor] = useState<Turma[]>([]);
  const [nomeProfessor, setNomeProfessor] = useState("");
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function carregar() {
      setLoading(true);
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const [profileRes, atrRes, discRes, turmasRes, classesRes, diretorRes] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("nome_completo")
            .eq("id", user.id)
            .single(),
          supabase
            .from("atribuicoes")
            .select("*")
            .eq("professor_id", user.id),
          supabase.from("disciplinas").select("*"),
          supabase.from("turmas").select("*").eq("ativo", true),
          supabase.from("classes").select("*"),
          supabase.from("turmas").select("*").eq("diretor_turma_id", user.id),
        ]);

      setNomeProfessor(profileRes.data?.nome_completo ?? "");
      setAtribuicoes(atrRes.data ?? []);
      setDisciplinas(discRes.data ?? []);
      setTurmas(turmasRes.data ?? []);
      setClasses(classesRes.data ?? []);
      setTurmasDiretor(diretorRes.data ?? []);
      setLoading(false);
    }
    carregar();
  }, []);

  const nomeDisciplina = (id: string) =>
    disciplinas.find((d) => d.id === id)?.nome ?? "—";
  const nomeTurma = (id: string) => {
    const t = turmas.find((x) => x.id === id);
    if (!t) return "—";
    const c = classes.find((x) => x.id === t.classe_id);
    return `${t.nome} (${c?.nome ?? ""})`;
  };

  const turmasUnicas = Array.from(
    new Set(atribuicoes.map((a) => a.turma_id))
  );

  const disciplinasUnicas = Array.from(
    new Set(atribuicoes.map((a) => a.disciplina_id))
  );

  const primeiroNome = nomeProfessor.split(" ")[0] || "Professor";
  const isDiretor = turmasDiretor.length > 0;

  return (
    <>
      <Header titulo={`Olá, ${primeiroNome}`} subtitulo="Portal do Professor" />

      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {erro && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-danger-50 border border-danger/20 text-danger text-sm mb-6">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <span>{erro}</span>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-20 text-slate-500">
              <Loader2 size={24} className="animate-spin" />
            </div>
          ) : (
            <>
              {/* Aviso diretor de turma */}
              {isDiretor && (
                <div className="bg-accent-50 border border-accent/20 rounded-xl p-5 mb-6 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-accent text-white flex items-center justify-center shrink-0">
                      <Star size={20} />
                    </div>
                    <div>
                      <p className="font-medium text-primary">
                        É diretor de {turmasDiretor.length} turma
                        {turmasDiretor.length > 1 ? "s" : ""}
                      </p>
                      <p className="text-sm text-slate-600">
                        Tem acesso completo à sua turma.
                      </p>
                    </div>
                  </div>
                  <Link href="/professor/minha-turma">
                    <Button variant="accent">
                      Minha Turma
                      <ArrowRight size={16} />
                    </Button>
                  </Link>
                </div>
              )}

              {/* Métricas */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="bg-surface border border-border rounded-xl p-5">
                  <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary flex items-center justify-center mb-4">
                    <Users size={20} />
                  </div>
                  <p className="font-serif text-3xl text-primary mb-1">
                    {turmasUnicas.length}
                  </p>
                  <p className="text-sm text-slate-500">Turmas</p>
                </div>
                <div className="bg-surface border border-border rounded-xl p-5">
                  <div className="w-10 h-10 rounded-lg bg-accent-50 text-accent flex items-center justify-center mb-4">
                    <BookOpen size={20} />
                  </div>
                  <p className="font-serif text-3xl text-primary mb-1">
                    {disciplinasUnicas.length}
                  </p>
                  <p className="text-sm text-slate-500">Disciplinas</p>
                </div>
                <div className="bg-surface border border-border rounded-xl p-5">
                  <div className="w-10 h-10 rounded-lg bg-success-50 text-success flex items-center justify-center mb-4">
                    <ClipboardList size={20} />
                  </div>
                  <p className="font-serif text-3xl text-primary mb-1">
                    {atribuicoes.length}
                  </p>
                  <p className="text-sm text-slate-500">Atribuições</p>
                </div>
              </div>

              {/* Ações rápidas */}
              <div className="grid sm:grid-cols-2 gap-4 mb-8">
                <Link href="/professor/notas" className="group">
                  <div className="bg-surface border border-border rounded-xl p-6 hover:border-accent/40 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-lg bg-accent-50 text-accent flex items-center justify-center">
                        <ClipboardList size={20} />
                      </div>
                      <ArrowRight
                        size={18}
                        className="text-slate-400 group-hover:text-accent transition-colors"
                      />
                    </div>
                    <p className="font-serif text-lg text-primary mb-1">
                      Lançar notas
                    </p>
                    <p className="text-sm text-slate-500">
                      Registe as notas das suas turmas
                    </p>
                  </div>
                </Link>

                <Link href="/professor/faltas" className="group">
                  <div className="bg-surface border border-border rounded-xl p-6 hover:border-accent/40 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-lg bg-info-50 text-info flex items-center justify-center">
                        <CalendarCheck size={20} />
                      </div>
                      <ArrowRight
                        size={18}
                        className="text-slate-400 group-hover:text-accent transition-colors"
                      />
                    </div>
                    <p className="font-serif text-lg text-primary mb-1">
                      Registar faltas
                    </p>
                    <p className="text-sm text-slate-500">
                      Marque presenças e faltas
                    </p>
                  </div>
                </Link>
              </div>

              {/* Atribuições */}
              <PageHeader titulo="Minhas atribuições" />

              {atribuicoes.length === 0 ? (
                <EmptyState
                  icone={<BookOpen size={24} />}
                  titulo="Sem atribuições"
                  descricao="O diretor ainda não lhe atribuiu turmas ou disciplinas. Aguarde ou contacte a direção."
                />
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {atribuicoes.map((a) => (
                    <div
                      key={a.id}
                      className="bg-surface border border-border rounded-xl p-5"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-primary text-white flex items-center justify-center shrink-0">
                          <BookOpen size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-primary truncate">
                            {nomeDisciplina(a.disciplina_id)}
                          </p>
                          <p className="text-xs text-slate-500">
                            {nomeTurma(a.turma_id)} · {a.ano_letivo}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-3 border-t border-border">
                        <Link
                          href={`/professor/notas/${a.turma_id}/${a.disciplina_id}`}
                          className="text-xs text-accent hover:underline font-medium"
                        >
                          Notas
                        </Link>
                        <span className="text-slate-300">·</span>
                        <Link
                          href={`/professor/faltas/${a.turma_id}/${a.disciplina_id}`}
                          className="text-xs text-accent hover:underline font-medium"
                        >
                          Faltas
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}
