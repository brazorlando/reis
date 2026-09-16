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
import { ClasseModal } from "@/components/admin/estrutura/classe-modal";
import {
  Plus,
  GraduationCap,
  Loader2,
  Pencil,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import type { Classe, NivelEnsino } from "@/types/database";

const nomesNivel: Record<string, string> = {
  primaria: "Primária",
  secundaria: "Secundária",
  pre_universitaria: "Pré-universitária",
};

export default function ClassesPage() {
  const [classes, setClasses] = useState<Classe[]>([]);
  const [niveisAtivos, setNiveisAtivos] = useState<NivelEnsino[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [filtroNivel, setFiltroNivel] = useState("");
  const [filtroAno, setFiltroAno] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Classe | null>(null);

  async function carregar() {
    setLoading(true);
    setErro(null);
    const supabase = createClient();

    const [classesRes, niveisRes] = await Promise.all([
      supabase
        .from("classes")
        .select("*")
        .order("ano_letivo", { ascending: false })
        .order("numero"),
      supabase.from("niveis_ensino").select("*").eq("ativo", true),
    ]);

    if (classesRes.error) setErro(classesRes.error.message);
    else setClasses(classesRes.data ?? []);

    setNiveisAtivos((niveisRes.data as NivelEnsino[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  const anos = useMemo(
    () => Array.from(new Set(classes.map((c) => c.ano_letivo))).sort((a, b) => b - a),
    [classes]
  );

  const filtrados = useMemo(() => {
    return classes.filter((c) => {
      if (busca.trim()) {
        const b = busca.toLowerCase();
        if (!c.nome.toLowerCase().includes(b)) return false;
      }
      if (filtroNivel && c.nivel_codigo !== filtroNivel) return false;
      if (filtroAno && c.ano_letivo.toString() !== filtroAno) return false;
      if (filtroEstado) {
        if (filtroEstado === "ativo" && !c.ativo) return false;
        if (filtroEstado === "inativo" && c.ativo) return false;
      }
      return true;
    });
  }, [classes, busca, filtroNivel, filtroAno, filtroEstado]);

  const filtrosConfig = [
    {
      id: "nivel",
      label: "Todos os níveis",
      valor: filtroNivel,
      opcoes: niveisAtivos.map((n) => ({
        label: n.nome,
        valor: n.codigo,
      })),
    },
    {
      id: "ano",
      label: "Todos os anos",
      valor: filtroAno,
      opcoes: anos.map((a) => ({ label: a.toString(), valor: a.toString() })),
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
    if (id === "nivel") setFiltroNivel(valor);
    if (id === "ano") setFiltroAno(valor);
    if (id === "estado") setFiltroEstado(valor);
  }

  function limparFiltros() {
    setBusca("");
    setFiltroNivel("");
    setFiltroAno("");
    setFiltroEstado("");
  }

  const nenhumNivelAtivo = !loading && niveisAtivos.length === 0;

  return (
    <>
      <Header
        titulo="Classes"
        subtitulo="Gestão das classes da escola"
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
            titulo="Classes"
            contador={`${filtrados.length} de ${classes.length} classe${classes.length !== 1 ? "s" : ""}`}
            acao={
              <Button
                onClick={() => {
                  setEditando(null);
                  setModalAberto(true);
                }}
                disabled={nenhumNivelAtivo}
              >
                <Plus size={18} />
                Nova classe
              </Button>
            }
          />

          {/* Aviso: sem níveis ativos */}
          {nenhumNivelAtivo && (
            <div className="bg-accent-50 border border-accent/20 rounded-xl p-5 mb-6">
              <p className="text-sm text-primary">
                Nenhum nível de ensino ativo. Vá a{" "}
                <Link
                  href="/admin/configuracoes"
                  className="text-accent hover:underline font-medium"
                >
                  Configurações
                </Link>{" "}
                e ative pelo menos um nível para poder criar classes.
              </p>
            </div>
          )}

          {classes.length > 0 && (
            <div className="mb-6">
              <Filters
                busca={busca}
                onBuscaChange={setBusca}
                buscaPlaceholder="Buscar por nome da classe..."
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
          ) : classes.length === 0 ? (
            <EmptyState
              icone={<GraduationCap size={24} />}
              titulo="Sem classes registadas"
              descricao="Adicione as classes da escola (1ª a 12ª)."
              acao={
                <Button
                  onClick={() => {
                    setEditando(null);
                    setModalAberto(true);
                  }}
                  disabled={nenhumNivelAtivo}
                >
                  <Plus size={18} />
                  Criar primeira classe
                </Button>
              }
            />
          ) : filtrados.length === 0 ? (
            <EmptyState
              icone={<GraduationCap size={24} />}
              titulo="Sem resultados"
              descricao="Nenhuma classe corresponde aos filtros."
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
                      Classe
                    </th>
                    <th className="text-left px-5 py-3 font-medium text-slate-600">
                      Nível
                    </th>
                    <th className="text-left px-5 py-3 font-medium text-slate-600 hidden md:table-cell">
                      Ano letivo
                    </th>
                    <th className="text-left px-5 py-3 font-medium text-slate-600 hidden lg:table-cell">
                      Capacidade/turma
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
                  {filtrados.map((c) => (
                    <tr
                      key={c.id}
                      className="hover:bg-primary-50/30 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-primary text-white flex items-center justify-center text-xs font-medium shrink-0">
                            {c.numero}ª
                          </div>
                          <span className="font-medium text-primary">
                            {c.nome}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant="info">
                          {nomesNivel[c.nivel_codigo] ?? c.nivel_codigo}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-slate-600 hidden md:table-cell">
                        {c.ano_letivo}
                      </td>
                      <td className="px-5 py-4 text-slate-600 hidden lg:table-cell">
                        {c.capacidade_por_turma ?? "—"}
                      </td>
                      <td className="px-5 py-4">
                        {c.ativo ? (
                          <Badge variant="success">Ativa</Badge>
                        ) : (
                          <Badge variant="outline">Inativa</Badge>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => {
                            setEditando(c);
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

      <ClasseModal
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
        classe={editando}
        niveisAtivos={niveisAtivos}
        onSucesso={carregar}
      />
    </>
  );
}
