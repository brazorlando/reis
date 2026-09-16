"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Filters } from "@/components/ui/filters";
import { PageHeader } from "@/components/ui/page-header";
import { AtribuicaoModal } from "@/components/admin/atribuicoes/atribuicao-modal";
import {
  Plus,
  Link2,
  Loader2,
  Trash2,
  AlertCircle,
  UserCheck,
} from "lucide-react";
import type {
  Atribuicao,
  Classe,
  Disciplina,
  Profile,
  Turma,
} from "@/types/database";

export default function AtribuicoesPage() {
  const [atribuicoes, setAtribuicoes] = useState<Atribuicao[]>([]);
  const [professores, setProfessores] = useState<Profile[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [classes, setClasses] = useState<Classe[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [filtroProfessor, setFiltroProfessor] = useState("");
  const [filtroTurma, setFiltroTurma] = useState("");
  const [modalAberto, setModalAberto] = useState(false);

  async function carregar() {
    setLoading(true);
    setErro(null);
    const supabase = createClient();

    const [atrRes, profRes, turmasRes, discRes, classesRes] =
      await Promise.all([
        supabase
          .from("atribuicoes")
          .select("*")
          .order("criado_em", { ascending: false }),
        supabase
          .from("profiles")
          .select("*")
          .eq("status", "aprovado")
          .neq("role", "admin")
          .order("nome_completo"),
        supabase.from("turmas").select("*").order("nome"),
        supabase.from("disciplinas").select("*").order("nome"),
        supabase.from("classes").select("*").order("numero"),
      ]);

    if (atrRes.error) setErro(atrRes.error.message);
    else setAtribuicoes(atrRes.data ?? []);

    setProfessores(profRes.data ?? []);
    setTurmas(turmasRes.data ?? []);
    setDisciplinas(discRes.data ?? []);
    setClasses(classesRes.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  const nomeProfessor = (id: string) =>
    professores.find((p) => p.id === id)?.nome_completo ?? "—";
  const nomeTurma = (id: string) => {
    const t = turmas.find((x) => x.id === id);
    if (!t) return "—";
    const c = classes.find((x) => x.id === t.classe_id);
    return `${t.nome} (${c?.nome ?? ""})`;
  };
  const nomeDisciplina = (id: string) =>
    disciplinas.find((d) => d.id === id)?.nome ?? "—";

  const filtrados = useMemo(() => {
    return atribuicoes.filter((a) => {
      if (busca.trim()) {
        const b = busca.toLowerCase();
        const match =
          nomeProfessor(a.professor_id).toLowerCase().includes(b) ||
          nomeTurma(a.turma_id).toLowerCase().includes(b) ||
          nomeDisciplina(a.disciplina_id).toLowerCase().includes(b);
        if (!match) return false;
      }
      if (filtroProfessor && a.professor_id !== filtroProfessor) return false;
      if (filtroTurma && a.turma_id !== filtroTurma) return false;
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [atribuicoes, busca, filtroProfessor, filtroTurma]);

  const filtrosConfig = [
    {
      id: "professor",
      label: "Todos os professores",
      valor: filtroProfessor,
      opcoes: professores.map((p) => ({
        label: p.nome_completo,
        valor: p.id,
      })),
    },
    {
      id: "turma",
      label: "Todas as turmas",
      valor: filtroTurma,
      opcoes: turmas.map((t) => ({ label: t.nome, valor: t.id })),
    },
  ];

  function handleFiltroChange(id: string, valor: string) {
    if (id === "professor") setFiltroProfessor(valor);
    if (id === "turma") setFiltroTurma(valor);
  }

  function limparFiltros() {
    setBusca("");
    setFiltroProfessor("");
    setFiltroTurma("");
  }

  async function remover(id: string) {
    if (!confirm("Remover esta atribuição?")) return;
    const supabase = createClient();
    const { error } = await supabase.from("atribuicoes").delete().eq("id", id);
    if (error) {
      setErro(error.message);
      return;
    }
    carregar();
  }

  return (
    <>
      <Header
        titulo="Atribuições"
        subtitulo="Professores ↔ Disciplinas ↔ Turmas"
      />

      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <PageHeader
            titulo="Atribuições"
            contador={`${filtrados.length} de ${atribuicoes.length} atribuiç${atribuicoes.length !== 1 ? "ões" : "ão"}`}
            acao={
              <Button onClick={() => setModalAberto(true)}>
                <Plus size={18} />
                Nova atribuição
              </Button>
            }
          />

          {atribuicoes.length > 0 && (
            <div className="mb-6">
              <Filters
                busca={busca}
                onBuscaChange={setBusca}
                buscaPlaceholder="Buscar por professor, turma ou disciplina..."
                filtros={filtrosConfig}
                onFiltroChange={handleFiltroChange}
                onLimpar={limparFiltros}
              />
            </div>
          )}

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
          ) : atribuicoes.length === 0 ? (
            <EmptyState
              icone={<Link2 size={24} />}
              titulo="Sem atribuições"
              descricao="Atribua professores às turmas e disciplinas para que possam lançar notas."
              acao={
                <Button onClick={() => setModalAberto(true)}>
                  <Plus size={18} />
                  Criar primeira atribuição
                </Button>
              }
            />
          ) : filtrados.length === 0 ? (
            <EmptyState
              icone={<Link2 size={24} />}
              titulo="Sem resultados"
              descricao="Nenhuma atribuição corresponde aos filtros."
              acao={
                <Button variant="outline" onClick={limparFiltros}>
                  Limpar filtros
                </Button>
              }
            />
          ) : (
            <div className="bg-surface border border-border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-primary-50/50 border-b border-border">
                  <tr>
                    <th className="text-left px-5 py-3 font-medium text-slate-600">
                      Professor
                    </th>
                    <th className="text-left px-5 py-3 font-medium text-slate-600">
                      Disciplina
                    </th>
                    <th className="text-left px-5 py-3 font-medium text-slate-600">
                      Turma
                    </th>
                    <th className="text-left px-5 py-3 font-medium text-slate-600 hidden md:table-cell">
                      Ano letivo
                    </th>
                    <th className="text-right px-5 py-3 font-medium text-slate-600">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtrados.map((a) => (
                    <tr
                      key={a.id}
                      className="hover:bg-primary-50/30 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <UserCheck size={14} className="text-slate-400" />
                          <span className="font-medium text-primary">
                            {nomeProfessor(a.professor_id)}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {nomeDisciplina(a.disciplina_id)}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {nomeTurma(a.turma_id)}
                      </td>
                      <td className="px-5 py-4 text-slate-600 hidden md:table-cell">
                        {a.ano_letivo}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => remover(a.id)}
                          className="inline-flex items-center gap-1 text-danger hover:text-danger-600 text-sm font-medium"
                        >
                          <Trash2 size={14} />
                          Remover
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <AtribuicaoModal
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
        professores={professores}
        turmas={turmas}
        disciplinas={disciplinas}
        classes={classes}
        onSucesso={carregar}
      />
    </>
  );
}
