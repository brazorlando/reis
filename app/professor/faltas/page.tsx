"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/header";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Filters } from "@/components/ui/filters";
import {
  BookOpen,
  Loader2,
  AlertCircle,
  ArrowRight,
  CalendarCheck,
} from "lucide-react";
import type {
  Atribuicao,
  Classe,
  Disciplina,
  Turma,
} from "@/types/database";

export default function ProfessorFaltasPage() {
  const [atribuicoes, setAtribuicoes] = useState<Atribuicao[]>([]);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [classes, setClasses] = useState<Classe[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [filtroTurma, setFiltroTurma] = useState("");

  useEffect(() => {
    async function carregar() {
      setLoading(true);
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const [atrRes, discRes, turmasRes, classesRes] = await Promise.all([
        supabase.from("atribuicoes").select("*").eq("professor_id", user.id),
        supabase.from("disciplinas").select("*"),
        supabase.from("turmas").select("*").eq("ativo", true),
        supabase.from("classes").select("*"),
      ]);

      if (atrRes.error) setErro(atrRes.error.message);
      else setAtribuicoes(atrRes.data ?? []);

      setDisciplinas(discRes.data ?? []);
      setTurmas(turmasRes.data ?? []);
      setClasses(classesRes.data ?? []);
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

  const turmasUnicas = Array.from(new Set(atribuicoes.map((a) => a.turma_id)));

  const filtrados = atribuicoes.filter((a) => {
    if (busca.trim()) {
      const b = busca.toLowerCase();
      const match =
        nomeDisciplina(a.disciplina_id).toLowerCase().includes(b) ||
        nomeTurma(a.turma_id).toLowerCase().includes(b);
      if (!match) return false;
    }
    if (filtroTurma && a.turma_id !== filtroTurma) return false;
    return true;
  });

  const filtrosConfig = [
    {
      id: "turma",
      label: "Todas as turmas",
      valor: filtroTurma,
      opcoes: turmasUnicas.map((id) => {
        const t = turmas.find((x) => x.id === id);
        return { label: t?.nome ?? "—", valor: id };
      }),
    },
  ];

  return (
    <>
      <Header titulo="Lançar Faltas" subtitulo="Escolha uma atribuição" />

      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          <PageHeader
            titulo="Minhas atribuições"
            descricao="Escolha a turma e a disciplina para registar faltas"
          />

          {erro && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-danger-50 border border-danger/20 text-danger text-sm mb-6">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <span>{erro}</span>
            </div>
          )}

          {atribuicoes.length > 0 && (
            <div className="mb-6">
              <Filters
                busca={busca}
                onBuscaChange={setBusca}
                buscaPlaceholder="Buscar por turma ou disciplina..."
                filtros={filtrosConfig}
                onFiltroChange={(id, v) => {
                  if (id === "turma") setFiltroTurma(v);
                }}
                onLimpar={() => {
                  setBusca("");
                  setFiltroTurma("");
                }}
              />
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-20 text-slate-500">
              <Loader2 size={24} className="animate-spin" />
            </div>
          ) : atribuicoes.length === 0 ? (
            <EmptyState
              icone={<CalendarCheck size={24} />}
              titulo="Sem atribuições"
              descricao="O diretor ainda não lhe atribuiu disciplinas ou turmas."
            />
          ) : filtrados.length === 0 ? (
            <EmptyState
              icone={<CalendarCheck size={24} />}
              titulo="Sem resultados"
              descricao="Nenhuma atribuição corresponde aos filtros."
            />
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {filtrados.map((a) => (
                <Link
                  key={a.id}
                  href={`/professor/faltas/${a.turma_id}/${a.disciplina_id}`}
                  className="group"
                >
                  <div className="bg-surface border border-border rounded-xl p-5 hover:border-accent/40 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-lg bg-primary text-white flex items-center justify-center shrink-0">
                        <BookOpen size={18} />
                      </div>
                      <ArrowRight
                        size={18}
                        className="text-slate-400 group-hover:text-accent transition-colors"
                      />
                    </div>
                    <p className="font-serif text-lg text-primary mb-1">
                      {nomeDisciplina(a.disciplina_id)}
                    </p>
                    <p className="text-sm text-slate-500">
                      {nomeTurma(a.turma_id)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
