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
import { DisciplinaModal } from "@/components/admin/estrutura/disciplina-modal";
import {
  Plus,
  BookOpen,
  Loader2,
  Pencil,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import type { Area, Classe, Disciplina } from "@/types/database";

export default function DisciplinasPage() {
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [classes, setClasses] = useState<Classe[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [filtroClasse, setFiltroClasse] = useState("");
  const [filtroArea, setFiltroArea] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Disciplina | null>(null);

  async function carregar() {
    setLoading(true);
    setErro(null);
    const supabase = createClient();

    const [discRes, classesRes, areasRes] = await Promise.all([
      supabase.from("disciplinas").select("*").order("nome"),
      supabase.from("classes").select("*").order("numero"),
      supabase.from("areas").select("*").order("codigo"),
    ]);

    if (discRes.error) setErro(discRes.error.message);
    else setDisciplinas(discRes.data ?? []);

    setClasses(classesRes.data ?? []);
    setAreas(areasRes.data ?? []);
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

  // Áreas disponíveis para o filtro (dependem da classe filtrada)
  const areasDisponiveis = useMemo(() => {
    if (filtroClasse) {
      return areas.filter((a) => a.classe_id === filtroClasse);
    }
    return areas;
  }, [areas, filtroClasse]);

  const filtrados = useMemo(() => {
    return disciplinas.filter((d) => {
      if (busca.trim()) {
        const b = busca.toLowerCase();
        const match =
          d.nome.toLowerCase().includes(b) ||
          (d.codigo?.toLowerCase().includes(b) ?? false);
        if (!match) return false;
      }
      if (filtroClasse && d.classe_id !== filtroClasse) return false;
      if (filtroArea && d.area_id !== filtroArea) return false;
      if (filtroEstado) {
        if (filtroEstado === "ativo" && !d.ativo) return false;
        if (filtroEstado === "inativo" && d.ativo) return false;
      }
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disciplinas, busca, filtroClasse, filtroArea, filtroEstado]);

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
      setFiltroArea(""); // reset área quando muda classe
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
      <Header
        titulo="Disciplinas"
        subtitulo="Disciplinas por classe e área"
      />

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
            titulo="Disciplinas"
            contador={`${filtrados.length} de ${disciplinas.length} disciplina${disciplinas.length !== 1 ? "s" : ""}`}
            acao={
              <Button
                onClick={() => {
                  setEditando(null);
                  setModalAberto(true);
                }}
                disabled={semClasses}
              >
                <Plus size={18} />
                Nova disciplina
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

          {disciplinas.length > 0 && (
            <div className="mb-6">
              <Filters
                busca={busca}
                onBuscaChange={setBusca}
                buscaPlaceholder="Buscar por nome ou código..."
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
          ) : disciplinas.length === 0 ? (
            <EmptyState
              icone={<BookOpen size={24} />}
              titulo="Sem disciplinas registadas"
              descricao="Adicione as disciplinas de cada classe e área."
              acao={
                <Button
                  onClick={() => {
                    setEditando(null);
                    setModalAberto(true);
                  }}
                  disabled={semClasses}
                >
                  <Plus size={18} />
                  Criar primeira disciplina
                </Button>
              }
            />
          ) : filtrados.length === 0 ? (
            <EmptyState
              icone={<BookOpen size={24} />}
              titulo="Sem resultados"
              descricao="Nenhuma disciplina corresponde aos filtros."
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
                      Disciplina
                    </th>
                    <th className="text-left px-5 py-3 font-medium text-slate-600 hidden md:table-cell">
                      Classe
                    </th>
                    <th className="text-left px-5 py-3 font-medium text-slate-600 hidden md:table-cell">
                      Área
                    </th>
                    <th className="text-left px-5 py-3 font-medium text-slate-600 hidden lg:table-cell">
                      Carga
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
                  {filtrados.map((d) => (
                    <tr
                      key={d.id}
                      className="hover:bg-primary-50/30 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-medium shrink-0"
                            style={{ backgroundColor: d.cor }}
                          >
                            {d.codigo?.slice(0, 2) ??
                              d.nome.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="font-medium text-primary">
                            {d.nome}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-600 hidden md:table-cell">
                        {nomeClasse(d.classe_id)}
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        {d.area_id ? (
                          <Badge variant="info">
                            Área {codigoArea(d.area_id)}
                          </Badge>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-slate-600 hidden lg:table-cell">
                        {d.carga_horaria ? `${d.carga_horaria}h` : "—"}
                      </td>
                      <td className="px-5 py-4">
                        {d.ativo ? (
                          <Badge variant="success">Ativa</Badge>
                        ) : (
                          <Badge variant="outline">Inativa</Badge>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => {
                            setEditando(d);
                            setModalAberto(true);
                          }}
                          className="inline-flex items-center gap-1 text-accent hover:text-accent-600 text-sm font-medium"
                        >
                          <Pencil size={14} />
                          Editar
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

      <DisciplinaModal
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
        disciplina={editando}
        classes={classes}
        areas={areas}
        onSucesso={carregar}
      />
    </>
  );
}
