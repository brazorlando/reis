"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Save,
  Check,
  Users,
} from "lucide-react";
import type { Aluno, Disciplina, Falta, Turma } from "@/types/database";

type EstadoAluno = Falta["tipo"] | "";

export default function LancarFaltasPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const turmaId = params.turmaId as string;
  const disciplinaId = params.disciplinaId as string;
  const data = searchParams.get("data") ?? new Date().toISOString().split("T")[0];

  const [turma, setTurma] = useState<Turma | null>(null);
  const [disciplina, setDisciplina] = useState<Disciplina | null>(null);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [estados, setEstados] = useState<Record<string, EstadoAluno>>({});
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function carregar() {
    setLoading(true);
    setErro(null);
    const supabase = createClient();

    const [turmaRes, discRes, alunosRes, faltasRes] = await Promise.all([
      supabase.from("turmas").select("*").eq("id", turmaId).single(),
      supabase.from("disciplinas").select("*").eq("id", disciplinaId).single(),
      supabase
        .from("alunos")
        .select("*")
        .eq("turma_id", turmaId)
        .eq("status", "ativo")
        .order("nome_completo"),
      supabase
        .from("faltas")
        .select("*")
        .eq("turma_id", turmaId)
        .eq("disciplina_id", disciplinaId)
        .eq("data", data),
    ]);

    if (turmaRes.error) setErro(turmaRes.error.message);
    else setTurma(turmaRes.data);

    if (discRes.error) setErro(discRes.error.message);
    else setDisciplina(discRes.data);

    setAlunos(alunosRes.data ?? []);

    // Preencher com estados existentes ou "presenca" por defeito
    const map: Record<string, EstadoAluno> = {};
    (alunosRes.data ?? []).forEach((a) => {
      const existente = (faltasRes.data ?? []).find(
        (f) => f.aluno_id === a.id
      );
      map[a.id] = existente?.tipo ?? "presenca";
    });
    setEstados(map);
    setLoading(false);
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turmaId, disciplinaId, data]);

  function marcar(alunoId: string, tipo: EstadoAluno) {
    setEstados((prev) => ({ ...prev, [alunoId]: tipo }));
  }

  function marcarTodos(tipo: EstadoAluno) {
    const novo: Record<string, EstadoAluno> = {};
    alunos.forEach((a) => {
      novo[a.id] = tipo;
    });
    setEstados(novo);
  }

  async function salvar() {
    setErro(null);
    setSalvando(true);
    setSucesso(false);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Apagar registos existentes para esta turma/disciplina/data
    await supabase
      .from("faltas")
      .delete()
      .eq("turma_id", turmaId)
      .eq("disciplina_id", disciplinaId)
      .eq("data", data);

    // Inserir todos (incluindo presenças)
    const registos = Object.entries(estados)
      .filter(([, tipo]) => tipo !== "")
      .map(([aluno_id, tipo]) => ({
        aluno_id,
        disciplina_id: disciplinaId,
        turma_id: turmaId,
        data,
        tipo: tipo as Falta["tipo"],
        lancado_por: user?.id ?? null,
      }));

    if (registos.length === 0) {
      setSalvando(false);
      return;
    }

    const { error } = await supabase.from("faltas").insert(registos);

    if (error) {
      setErro(error.message);
      setSalvando(false);
      return;
    }

    setSucesso(true);
    setSalvando(false);
    setTimeout(() => setSucesso(false), 3000);
  }

  const stats = useMemo(() => {
    const valores = Object.values(estados);
    return {
      presencas: valores.filter((v) => v === "presenca").length,
      faltas: valores.filter((v) => v === "falta").length,
      justificadas: valores.filter((v) => v === "falta_justificada").length,
      atrasos: valores.filter((v) => v === "atraso").length,
    };
  }, [estados]);

  if (loading) {
    return (
      <>
        <Header titulo="Registar faltas" />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 size={28} className="animate-spin text-slate-400" />
        </main>
      </>
    );
  }

  const dataFormatada = new Date(data + "T00:00:00").toLocaleDateString(
    "pt-MZ",
    { day: "2-digit", month: "long", year: "numeric" }
  );

  return (
    <>
      <Header
        titulo={`${disciplina?.nome ?? ""} — ${turma?.nome ?? ""}`}
        subtitulo={dataFormatada}
      />

      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          <Link
            href="/admin/faltas"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary mb-6"
          >
            <ArrowLeft size={16} />
            Voltar à seleção
          </Link>

          <PageHeader
            titulo={`${alunos.length} aluno${alunos.length !== 1 ? "s" : ""}`}
            descricao={`${disciplina?.nome ?? ""} · ${turma?.nome ?? ""} · ${dataFormatada}`}
            acao={
              <div className="flex items-center gap-2">
                {sucesso && (
                  <span className="inline-flex items-center gap-1.5 text-sm text-success font-medium">
                    <Check size={16} />
                    Guardado
                  </span>
                )}
                <Button onClick={salvar} disabled={salvando || alunos.length === 0}>
                  {salvando ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      A guardar...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Guardar
                    </>
                  )}
                </Button>
              </div>
            }
          />

          {erro && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-danger-50 border border-danger/20 text-danger text-sm mb-6">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <span>{erro}</span>
            </div>
          )}

          {/* Ações rápidas */}
          {alunos.length > 0 && (
            <div className="bg-surface border border-border rounded-xl p-4 mb-6 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span>Marcar todos como:</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => marcarTodos("presenca")}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-success-50 text-success border border-success/20 hover:bg-success-100 transition-colors"
                >
                  Todos presentes
                </button>
                <button
                  onClick={() => marcarTodos("falta")}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-danger-50 text-danger border border-danger/20 hover:bg-danger-100 transition-colors"
                >
                  Todos ausentes
                </button>
              </div>
            </div>
          )}

          {/* Estatísticas */}
          {alunos.length > 0 && (
            <div className="grid grid-cols-4 gap-3 mb-6">
              <div className="bg-surface border border-border rounded-xl p-4">
                <p className="text-xs text-slate-500 mb-1">Presentes</p>
                <p className="font-serif text-2xl text-success">
                  {stats.presencas}
                </p>
              </div>
              <div className="bg-surface border border-border rounded-xl p-4">
                <p className="text-xs text-slate-500 mb-1">Faltas</p>
                <p className="font-serif text-2xl text-danger">
                  {stats.faltas}
                </p>
              </div>
              <div className="bg-surface border border-border rounded-xl p-4">
                <p className="text-xs text-slate-500 mb-1">Justificadas</p>
                <p className="font-serif text-2xl text-warning">
                  {stats.justificadas}
                </p>
              </div>
              <div className="bg-surface border border-border rounded-xl p-4">
                <p className="text-xs text-slate-500 mb-1">Atrasos</p>
                <p className="font-serif text-2xl text-info">
                  {stats.atrasos}
                </p>
              </div>
            </div>
          )}

          {/* Tabela */}
          {alunos.length === 0 ? (
            <EmptyState
              icone={<Users size={24} />}
              titulo="Sem alunos na turma"
              descricao="Adicione alunos a esta turma em Alunos."
              acao={
                <Link href="/admin/alunos">
                  <Button>Ir para Alunos</Button>
                </Link>
              }
            />
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader className="w-12">#</TableHeader>
                  <TableHeader>Aluno</TableHeader>
                  <TableHeader className="text-center">
                    Estado
                  </TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {alunos.map((aluno, idx) => {
                  const estado = estados[aluno.id] ?? "";
                  return (
                    <TableRow key={aluno.id}>
                      <TableCell className="text-slate-400">
                        {idx + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-slate-500">
                            {aluno.numero_matricula}
                          </span>
                          <span className="font-medium">
                            {aluno.nome_completo}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1 flex-wrap">
                          {(
                            [
                              { valor: "presenca", label: "Presente", cor: "success" },
                              { valor: "falta", label: "Falta", cor: "danger" },
                              {
                                valor: "falta_justificada",
                                label: "Justificada",
                                cor: "warning",
                              },
                              { valor: "atraso", label: "Atraso", cor: "info" },
                            ] as const
                          ).map((op) => (
                            <button
                              key={op.valor}
                              onClick={() => marcar(aluno.id, op.valor)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                                estado === op.valor
                                  ? op.cor === "success"
                                    ? "bg-success text-white border-success"
                                    : op.cor === "danger"
                                      ? "bg-danger text-white border-danger"
                                      : op.cor === "warning"
                                        ? "bg-accent text-white border-accent"
                                        : "bg-info text-white border-info"
                                  : "bg-surface border-border text-slate-600 hover:bg-primary-50"
                              }`}
                            >
                              {op.label}
                            </button>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </main>
    </>
  );
}
