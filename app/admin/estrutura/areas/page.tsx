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
import { AreaModal } from "@/components/admin/estrutura/area-modal";
import {
  Plus,
  Layers,
  Loader2,
  Pencil,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import type { Area, Classe } from "@/types/database";

export default function AreasPage() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [classes, setClasses] = useState<Classe[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [filtroClasse, setFiltroClasse] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Area | null>(null);

  async function carregar() {
    setLoading(true);
    setErro(null);
    const supabase = createClient();

    const [areasRes, classesRes] = await Promise.all([
      supabase.from("areas").select("*").order("codigo"),
      supabase
        .from("classes")
        .select("*")
        .eq("nivel_codigo", "pre_universitaria")
        .order("numero"),
    ]);

    if (areasRes.error) setErro(areasRes.error.message);
    else setAreas(areasRes.data ?? []);

    if (classesRes.error) setErro(classesRes.error.message);
    else setClasses(classesRes.data ?? []);

    setLoading(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  const nomeClasse = (id: string) =>
    classes.find((c) => c.id === id)?.nome ?? "—";

  const filtrados = useMemo(() => {
    return areas.filter((a) => {
      if (busca.trim()) {
        const b = busca.toLowerCase();
        const match =
          a.codigo.toLowerCase().includes(b) ||
          (a.nome?.toLowerCase().includes(b) ?? false) ||
          nomeClasse(a.classe_id).toLowerCase().includes(b);
        if (!match) return false;
      }
      if (filtroClasse && a.classe_id !== filtroClasse) return false;
      if (filtroEstado) {
        if (filtroEstado === "ativo" && !a.ativo) return false;
        if (filtroEstado === "inativo" && a.ativo) return false;
      }
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [areas, busca, filtroClasse, filtroEstado, classes]);

  const filtrosConfig = [
    {
      id: "classe",
      label: "Todas as classes",
      valor: filtroClasse,
      opcoes: classes.map((c) => ({ label: c.nome, valor: c.id })),
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
    if (id === "classe") setFiltroClasse(valor);
    if (id === "estado") setFiltroEstado(valor);
  }

  function limparFiltros() {
    setBusca("");
    setFiltroClasse("");
    setFiltroEstado("");
  }

  const semClassesPreUniv = !loading && classes.length === 0;

  return (
    <>
      <Header
        titulo="Áreas"
        subtitulo="Áreas A, B, C da pré-universitária"
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
            titulo="Áreas"
            contador={`${filtrados.length} de ${areas.length} área${areas.length !== 1 ? "s" : ""}`}
            acao={
              <Button
                onClick={() => {
                  setEditando(null);
                  setModalAberto(true);
                }}
                disabled={semClassesPreUniv}
              >
                <Plus size={18} />
                Nova área
              </Button>
            }
          />

          {semClassesPreUniv && (
            <div className="bg-accent-50 border border-accent/20 rounded-xl p-5 mb-6">
              <p className="text-sm text-primary">
                Sem classes da <strong>pré-universitária</strong>. Crie primeiro
                uma classe de 10ª, 11ª ou 12ª em{" "}
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

          {areas.length > 0 && (
            <div className="mb-6">
              <Filters
                busca={busca}
                onBuscaChange={setBusca}
                buscaPlaceholder="Buscar por código, nome ou classe..."
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
          ) : areas.length === 0 ? (
            <EmptyState
              icone={<Layers size={24} />}
              titulo="Sem áreas registadas"
              descricao="Adicione as áreas A, B, C para as classes da pré-universitária."
              acao={
                <Button
                  onClick={() => {
                    setEditando(null);
                    setModalAberto(true);
                  }}
                  disabled={semClassesPreUniv}
                >
                  <Plus size={18} />
                  Criar primeira área
                </Button>
              }
            />
          ) : filtrados.length === 0 ? (
            <EmptyState
              icone={<Layers size={24} />}
              titulo="Sem resultados"
              descricao="Nenhuma área corresponde aos filtros."
              acao={
                <Button variant="outline" onClick={limparFiltros}>
                  Limpar filtros
                </Button>
              }
            />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtrados.map((a) => (
                <div
                  key={a.id}
                  className="bg-surface border border-border rounded-xl p-5 shadow-card"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 rounded-lg bg-primary text-white flex items-center justify-center font-serif text-xl shrink-0">
                      {a.codigo}
                    </div>
                    {a.ativo ? (
                      <Badge variant="success">Ativa</Badge>
                    ) : (
                      <Badge variant="outline">Inativa</Badge>
                    )}
                  </div>

                  <h3 className="font-serif text-lg text-primary mb-1">
                    Área {a.codigo}
                    {a.nome ? ` — ${a.nome}` : ""}
                  </h3>
                  <p className="text-xs text-slate-500 mb-3">
                    {nomeClasse(a.classe_id)}
                  </p>

                  {a.descricao && (
                    <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                      {a.descricao}
                    </p>
                  )}

                  <button
                    onClick={() => {
                      setEditando(a);
                      setModalAberto(true);
                    }}
                    className="mt-2 inline-flex items-center gap-1.5 text-sm text-accent hover:text-accent-600 font-medium"
                  >
                    <Pencil size={14} />
                    Editar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <AreaModal
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
        area={editando}
        classes={classes}
        onSucesso={carregar}
      />
    </>
  );
}
