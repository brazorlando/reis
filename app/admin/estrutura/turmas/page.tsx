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
import { TurmaModal } from "@/components/admin/estrutura/turma-modal";
import {
  Plus,
  Users,
  Loader2,
  Pencil,
  AlertCircle,
  ArrowLeft,
  UserCheck,
} from "lucide-react";
import type { Area, Classe, Profile, Turma } from "@/types/database";

export default function TurmasPage() {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [classes, setClasses] = useState<Classe[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [professores, setProfessores] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [filtroClasse, setFiltroClasse] = useState("");
  const [filtroArea, setFiltroArea] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Turma | null>(null);

  async function carregar() {
    setLoading(true);
    setErro(null);
    const supabase = createClient();

    const [turmasRes, classesRes, areasRes, profsRes] = await Promise.all([
      supabase
        .from("turmas")
        .select("*")
        .order("ano_letivo", { ascending: false })
        .order("nome"),
      supabase.from("classes").select("*").order("numero"),
      supabase.from("areas").select("*").order("codigo"),
      supabase
        .from("profiles")
        .select("*")
        .eq("status", "aprovado")
        .neq("role", "admin")
        .order("nome_completo"),
    ]);

    if (turmasRes.error) setErro(turmasRes.error.message);
    else setTurmas(turmasRes.data ?? []);

    setClasses(classesRes.data ?? []);
    setAreas(areasRes.data ?? []);
    setProfessores(profsRes.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  const nomeClasse = (id: string) =>
    classes.find((c) => c.id === id)?.nome ?? "—";
  const codigoArea = (id: string | null) => {
    if (!id) return null;
    return areas.find((a) => a.id === id)?.codigo ?? null;
  };
  const nomeProfessor = (id: string | null) => {
    if (!id) return null;
    return professores.find((p) => p.id === id)?.nome_completo ?? null;
  };

  const areasDisponiveis = useMemo(() => {
    if (filtroClasse) {
      return areas.filter((a) => a.classe_id === filtroClasse);
    }
    return areas;
  }, [areas, filtroClasse]);

  const filtrados = useMemo(() => {
    return turmas.filter((t) => {
      if (busca.trim()) {
        const b = busca.toLowerCase();
        if (!t.nome.toLowerCase().includes(b)) return false;
      }
      if (filtroClasse && t.classe_id !== filtroClasse) return false;
      if (filtroArea && t.area_id !== filtroArea) return false;
      if (filtroEstado) {
        if (filtroEstado === "ativo" && !t.ativo) return false;
        if (filtroEstado === "inativo" && t.ativo) return false;
      }
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turmas, busca, filtroClasse, filtroArea, filtroEstado]);

  const filtrosConfig = [
    {
      id: "classe",
      label: "Todas as classes",
      valor: filtroClasse,
      opcoes: classes.map((c) => ({ label: c.nome, valor: c.id })),
    },
    {
      id: "area",
      label: "Todas as áreas",
      valor: filtroArea,
      opcoes: areasDisponiveis.map((a) => ({
        label: `${a.codigo} — ${nomeClasse(a.classe_id)}`,
        valor: a.id,
      })),
    },
    {
      id: "estado",
      label: "Todos os estados",
      valor: filtroEstado,
      opcoes: [
        { label: "Ativas", valor: "ativo" },
        { label: "Inativas", valor: "inativo" },
      ],
    },
  ];

  function handleFiltroChange(id: string, valor: string) {
    if (id === "classe") {
      setFiltroClasse(valor);
      setFiltroArea("");
    }
    if (id === "area") setFiltroArea(valor);
    if (id === "estado") setFiltroEstado(valor);
  }

  function limparFiltros() {
    setBusca("");
    setFiltroClasse("");
    setFiltroArea("");
    setFiltroEstado("");
  }

  const semClasses = !loading && classes.length === 0;

  return (
    <>
      <Header titulo="Turmas" subtitulo="Turmas da escola" />

      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <Link
            href="/admin/estrutura"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary mb-6"
          >
            <ArrowLeft size={16} />
            Voltar à estrutura
          </Link>

          <PageHeader
            titulo="Turmas"
            contador={`${filtrados.length} de ${turmas.length} turma${turmas.length !== 1 ? "s" : ""}`}
            acao={
              <Button
                onClick={() => {
                  setEditando(null);
                  setModalAberto(true);
                }}
                disabled={semClasses}
              >
                <Plus size={18} />
                Nova turma
              </Button>
            }
          />

          {semClasses && (
            <div className="bg-accent-50 border border-accent/20 rounded-xl p-5 mb-6">
              <p className="text-sm text-primary">
                Crie primeiro uma classe em{" "}
                <Link
                  href="/admin/estrutura/classes"
                  className="text-accent hover:underline font-medium"
                >
                  Classes
                </Link>
                .
              </p>
            </div>
          )}

          {turmas.length > 0 && (
            <div className="mb-6">
              <Filters
                busca={busca}
                onBuscaChange={setBusca}
                buscaPlaceholder="Buscar por nome da turma..."
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
          ) : turmas.length === 0 ? (
            <EmptyState
              icone={<Users size={24} />}
              titulo="Sem turmas registadas"
              descricao="Gere as turmas a partir das classes e áreas existentes."
              acao={
                <Button
                  onClick={() => {
                    setEditando(null);
                    setModalAberto(true);
                  }}
                  disabled={semClasses}
                >
                  <Plus size={18} />
                  Criar primeira turma
                </Button>
              }
            />
          ) : filtrados.length === 0 ? (
            <EmptyState
              icone={<Users size={24} />}
              titulo="Sem resultados"
              descricao="Nenhuma turma corresponde aos filtros."
              acao={
                <Button variant="outline" onClick={limparFiltros}>
                  Limpar filtros
                </Button>
              }
            />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtrados.map((t) => {
                const prof = nomeProfessor(t.diretor_turma_id);
                return (
                  <div
                    key={t.id}
                    className="bg-surface border border-border rounded-xl p-5 shadow-card"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-12 h-12 rounded-lg bg-primary text-white flex items-center justify-center font-serif text-lg shrink-0">
                        {t.nome.length > 4
                          ? t.nome.slice(0, 3)
                          : t.nome}
                      </div>
                      {t.ativo ? (
                        <Badge variant="success">Ativa</Badge>
                      ) : (
                        <Badge variant="outline">Inativa</Badge>
                      )}
                    </div>

                    <h3 className="font-serif text-xl text-primary mb-1">
                      {t.nome}
                    </h3>
                    <p className="text-xs text-slate-500 mb-3">
                      {nomeClasse(t.classe_id)}
                      {codigoArea(t.area_id) && ` · Área ${codigoArea(t.area_id)}`}
                      {` · ${t.ano_letivo}`}
                    </p>

                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">
                          Diretor de turma
                        </span>
                        <span className="text-primary font-medium truncate ml-2 max-w-[60%] text-right">
                          {prof ?? "—"}
                        </span>
                      </div>
                      {t.sala && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Sala</span>
                          <span className="text-primary">{t.sala}</span>
                        </div>
                      )}
                      {t.capacidade && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Capacidade</span>
                          <span className="text-primary flex items-center gap-1">
                            <Users size={14} />
                            {t.capacidade}
                          </span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        setEditando(t);
                        setModalAberto(true);
                      }}
                      className="inline-flex items-center gap-1.5 text-sm text-accent hover:text-accent-600 font-medium"
                    >
                      <Pencil size={14} />
                      Editar
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <TurmaModal
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
        turma={editando}
        classes={classes}
        areas={areas}
        professores={professores}
        turmasExistentes={turmas}
        onSucesso={carregar}
      />
    </>
  );
}
