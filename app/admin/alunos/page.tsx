"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Filters } from "@/components/ui/filters";
import { PageHeader } from "@/components/ui/page-header";
import { AlunoModal } from "@/components/admin/alunos/aluno-modal";
import {
  Plus,
  GraduationCap,
  Loader2,
  Pencil,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import type { Aluno, Area, Classe, Turma } from "@/types/database";

export default function AlunosPage() {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [classes, setClasses] = useState<Classe[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [filtroTurma, setFiltroTurma] = useState("");
  const [filtroClasse, setFiltroClasse] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroGenero, setFiltroGenero] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Aluno | null>(null);

  async function carregar() {
    setLoading(true);
    setErro(null);
    const supabase = createClient();

    const [alunosRes, turmasRes, classesRes, areasRes] = await Promise.all([
      supabase.from("alunos").select("*").order("nome_completo"),
      supabase.from("turmas").select("*").order("nome"),
      supabase.from("classes").select("*").order("numero"),
      supabase.from("areas").select("*").order("codigo"),
    ]);

    if (alunosRes.error) setErro(alunosRes.error.message);
    else setAlunos(alunosRes.data ?? []);

    setTurmas(turmasRes.data ?? []);
    setClasses(classesRes.data ?? []);
    setAreas(areasRes.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  const turmaInfo = (turmaId: string | null) => {
    if (!turmaId) return null;
    const turma = turmas.find((t) => t.id === turmaId);
    if (!turma) return null;
    const classe = classes.find((c) => c.id === turma.classe_id);
    const area = turma.area_id
      ? areas.find((a) => a.id === turma.area_id)
      : null;
    return {
      nome: turma.nome,
      classe: classe?.nome ?? "—",
      area: area?.codigo ?? null,
    };
  };

  const turmasDisponiveis = useMemo(() => {
    if (filtroClasse) {
      return turmas.filter((t) => t.classe_id === filtroClasse);
    }
    return turmas;
  }, [turmas, filtroClasse]);

  const filtrados = useMemo(() => {
    return alunos.filter((a) => {
      if (busca.trim()) {
        const b = busca.toLowerCase();
        const match =
          a.nome_completo.toLowerCase().includes(b) ||
          a.numero_matricula.toLowerCase().includes(b) ||
          (a.nome_encarregado?.toLowerCase().includes(b) ?? false);
        if (!match) return false;
      }

      if (filtroTurma && a.turma_id !== filtroTurma) return false;

      if (filtroClasse) {
        const turma = turmas.find((t) => t.id === a.turma_id);
        if (!turma || turma.classe_id !== filtroClasse) return false;
      }

      if (filtroEstado && a.status !== filtroEstado) return false;
      if (filtroGenero && a.genero !== filtroGenero) return false;

      return true;
    });
  }, [alunos, busca, filtroTurma, filtroClasse, filtroEstado, filtroGenero, turmas]);

  const filtrosConfig = [
    {
      id: "classe",
      label: "Todas as classes",
      valor: filtroClasse,
      opcoes: classes.map((c) => ({ label: c.nome, valor: c.id })),
    },
    {
      id: "turma",
      label: "Todas as turmas",
      valor: filtroTurma,
      opcoes: turmasDisponiveis.map((t) => ({
        label: t.nome,
        valor: t.id,
      })),
    },
    {
      id: "estado",
      label: "Todos os estados",
      valor: filtroEstado,
      opcoes: [
        { label: "Ativo", valor: "ativo" },
        { label: "Transferido", valor: "transferido" },
        { label: "Suspenso", valor: "suspenso" },
        { label: "Inativo", valor: "inativo" },
      ],
    },
    {
      id: "genero",
      label: "Todos os géneros",
      valor: filtroGenero,
      opcoes: [
        { label: "Masculino", valor: "M" },
        { label: "Feminino", valor: "F" },
      ],
    },
  ];

  function handleFiltroChange(id: string, valor: string) {
    if (id === "classe") {
      setFiltroClasse(valor);
      setFiltroTurma("");
    }
    if (id === "turma") setFiltroTurma(valor);
    if (id === "estado") setFiltroEstado(valor);
    if (id === "genero") setFiltroGenero(valor);
  }

  function limparFiltros() {
    setBusca("");
    setFiltroClasse("");
    setFiltroTurma("");
    setFiltroEstado("");
    setFiltroGenero("");
  }

  return (
    <>
      <Header titulo="Alunos" subtitulo="Gestão de alunos da escola" />

      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <PageHeader
            titulo="Alunos"
            contador={`${filtrados.length} de ${alunos.length} aluno${alunos.length !== 1 ? "s" : ""}`}
            acao={
              <Button
                onClick={() => {
                  setEditando(null);
                  setModalAberto(true);
                }}
              >
                <Plus size={18} />
                Novo aluno
              </Button>
            }
          />

          {alunos.length > 0 && (
            <div className="mb-6">
              <Filters
                busca={busca}
                onBuscaChange={setBusca}
                buscaPlaceholder="Buscar por nome, matrícula ou encarregado..."
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
          ) : alunos.length === 0 ? (
            <EmptyState
              icone={<GraduationCap size={24} />}
              titulo="Sem alunos registados"
              descricao="Comece por adicionar os alunos da escola."
              acao={
                <Button
                  onClick={() => {
                    setEditando(null);
                    setModalAberto(true);
                  }}
                >
                  <Plus size={18} />
                  Adicionar primeiro aluno
                </Button>
              }
            />
          ) : filtrados.length === 0 ? (
            <EmptyState
              icone={<GraduationCap size={24} />}
              titulo="Sem resultados"
              descricao="Nenhum aluno corresponde aos filtros aplicados."
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
                      Matrícula
                    </th>
                    <th className="text-left px-5 py-3 font-medium text-slate-600">
                      Nome
                    </th>
                    <th className="text-left px-5 py-3 font-medium text-slate-600 hidden md:table-cell">
                      Turma
                    </th>
                    <th className="text-left px-5 py-3 font-medium text-slate-600 hidden lg:table-cell">
                      Encarregado
                    </th>
                    <th className="text-left px-5 py-3 font-medium text-slate-600">
                      Estado
                    </th>
                    <th className="text-right px-5 py-3 font-medium text-slate-600">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtrados.map((a) => {
                    const info = turmaInfo(a.turma_id);
                    return (
                      <tr
                        key={a.id}
                        className="hover:bg-primary-50/30 transition-colors"
                      >
                        <td className="px-5 py-4 font-mono text-xs text-slate-600">
                          {a.numero_matricula}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center text-xs font-medium shrink-0">
                              {a.nome_completo
                                .split(" ")
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join("")
                                .toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-primary truncate">
                                {a.nome_completo}
                              </p>
                              <p className="text-xs text-slate-500 md:hidden">
                                {info?.nome ?? "Sem turma"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 hidden md:table-cell">
                          {info ? (
                            <div>
                              <p className="text-primary font-medium">
                                {info.nome}
                              </p>
                              <p className="text-xs text-slate-500">
                                {info.classe}
                                {info.area && ` · Área ${info.area}`}
                              </p>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs">
                              Sem turma
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-slate-600 hidden lg:table-cell">
                          {a.nome_encarregado ?? "—"}
                        </td>
                        <td className="px-5 py-4">
                          <Badge
                            variant={
                              a.status === "ativo"
                                ? "success"
                                : a.status === "suspenso"
                                  ? "warning"
                                  : "outline"
                            }
                          >
                            {a.status}
                          </Badge>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-3">
                            {a.id && (
                              <Link
                                href={`/admin/alunos/${a.id}`}
                                className="inline-flex items-center gap-1 text-primary hover:text-primary-500 text-sm font-medium"
                              >
                                Ver
                                <ArrowRight size={14} />
                              </Link>
                            )}
                            <button
                              onClick={() => {
                                setEditando(a);
                                setModalAberto(true);
                              }}
                              className="inline-flex items-center gap-1 text-accent hover:text-accent-600 text-sm font-medium"
                            >
                              <Pencil size={14} />
                              Editar
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <AlunoModal
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
        aluno={editando}
        turmas={turmas}
        classes={classes}
        areas={areas}
        onSucesso={carregar}
      />
    </>
  );
}
