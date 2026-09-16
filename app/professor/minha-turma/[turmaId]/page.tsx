"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { AlunoModal } from "@/components/admin/alunos/aluno-modal";
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
  Users,
  BookOpen,
  CalendarCheck,
  Pencil,
  Plus,
  ArrowRight,
} from "lucide-react";
import type {
  Aluno,
  Area,
  Classe,
  Disciplina,
  Turma,
} from "@/types/database";

type Aba = "alunos" | "notas" | "faltas";

export default function MinhaTurmaDetalhePage() {
  const params = useParams();
  const turmaId = params.turmaId as string;

  const [turma, setTurma] = useState<Turma | null>(null);
  const [classe, setClasse] = useState<Classe | null>(null);
  const [area, setArea] = useState<Area | null>(null);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [classes, setClasses] = useState<Classe[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [semAcesso, setSemAcesso] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState<Aba>("alunos");
  const [modalAluno, setModalAluno] = useState(false);
  const [editandoAluno, setEditandoAluno] = useState<Aluno | null>(null);

  async function carregar() {
    setLoading(true);
    setErro(null);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Verificar se é diretor desta turma
    const turmaRes = await supabase
      .from("turmas")
      .select("*")
      .eq("id", turmaId)
      .eq("diretor_turma_id", user.id)
      .maybeSingle();

    if (!turmaRes.data) {
      setSemAcesso(true);
      setLoading(false);
      return;
    }

    setTurma(turmaRes.data);

    const [classeRes, areaRes, alunosRes, discRes, classesRes, areasRes] =
      await Promise.all([
        supabase
          .from("classes")
          .select("*")
          .eq("id", turmaRes.data.classe_id)
          .single(),
        turmaRes.data.area_id
          ? supabase
              .from("areas")
              .select("*")
              .eq("id", turmaRes.data.area_id)
              .single()
          : Promise.resolve({ data: null, error: null }),
        supabase
          .from("alunos")
          .select("*")
          .eq("turma_id", turmaId)
          .order("nome_completo"),
        supabase
          .from("disciplinas")
          .select("*")
          .eq("classe_id", turmaRes.data.classe_id)
          .eq("ativo", true)
          .order("nome"),
        supabase.from("classes").select("*").order("numero"),
        supabase.from("areas").select("*").order("codigo"),
      ]);

    setClasse(classeRes.data);
    setArea(areaRes.data);
    setAlunos(alunosRes.data ?? []);
    setClasses(classesRes.data ?? []);
    setAreas(areasRes.data ?? []);

    // Filtrar disciplinas por área
    let discFiltradas = discRes.data ?? [];
    if (turmaRes.data.area_id) {
      discFiltradas = discFiltradas.filter(
        (d) => d.area_id === turmaRes.data!.area_id || d.area_id === null
      );
    } else {
      discFiltradas = discFiltradas.filter((d) => d.area_id === null);
    }
    setDisciplinas(discFiltradas);
    setLoading(false);
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turmaId]);

  if (loading) {
    return (
      <>
        <Header titulo="Minha Turma" />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 size={28} className="animate-spin text-slate-400" />
        </main>
      </>
    );
  }

  if (semAcesso) {
    return (
      <>
        <Header titulo="Sem acesso" />
        <main className="flex-1 p-8">
          <div className="max-w-2xl mx-auto flex items-start gap-2 p-4 rounded-lg bg-danger-50 border border-danger/20 text-danger">
            <AlertCircle size={20} className="mt-0.5 shrink-0" />
            <span>Não é diretor desta turma.</span>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header
        titulo={turma?.nome ?? ""}
        subtitulo={`${classe?.nome ?? ""}${area ? ` · Área ${area.codigo}` : ""}`}
      />

      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <Link
            href="/professor/minha-turma"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary mb-6"
          >
            <ArrowLeft size={16} />
            Voltar
          </Link>

          {/* Cartão da turma */}
          <div className="bg-surface border border-border rounded-xl shadow-card overflow-hidden mb-6">
            <div className="px-6 py-6 flex items-center gap-4">
              <div className="w-14 h-14 rounded-lg bg-accent text-white flex items-center justify-center font-serif text-2xl shrink-0">
                {turma?.nome.slice(0, 3)}
              </div>
              <div className="flex-1">
                <h1 className="font-serif text-2xl text-primary mb-1">
                  {turma?.nome}
                </h1>
                <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                  <span>{classe?.nome}</span>
                  {area && (
                    <>
                      <span>·</span>
                      <Badge variant="info">Área {area.codigo}</Badge>
                    </>
                  )}
                  <span>·</span>
                  <span>{turma?.ano_letivo}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="font-serif text-3xl text-primary">
                  {alunos.length}
                </p>
                <p className="text-xs text-slate-500">alunos</p>
              </div>
            </div>

            {/* Abas */}
            <div className="border-t border-border flex">
              <button
                onClick={() => setAbaAtiva("alunos")}
                className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                  abaAtiva === "alunos"
                    ? "text-primary border-b-2 border-primary bg-primary-50/30"
                    : "text-slate-500 hover:text-primary"
                }`}
              >
                <Users size={16} className="inline mr-2" />
                Alunos
              </button>
              <button
                onClick={() => setAbaAtiva("notas")}
                className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                  abaAtiva === "notas"
                    ? "text-primary border-b-2 border-primary bg-primary-50/30"
                    : "text-slate-500 hover:text-primary"
                }`}
              >
                <BookOpen size={16} className="inline mr-2" />
                Notas
              </button>
              <button
                onClick={() => setAbaAtiva("faltas")}
                className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                  abaAtiva === "faltas"
                    ? "text-primary border-b-2 border-primary bg-primary-50/30"
                    : "text-slate-500 hover:text-primary"
                }`}
              >
                <CalendarCheck size={16} className="inline mr-2" />
                Faltas
              </button>
            </div>
          </div>

          {/* ABA ALUNOS */}
          {abaAtiva === "alunos" && (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-slate-500">
                  {alunos.length} aluno{alunos.length !== 1 ? "s" : ""} na turma
                </p>
                <Button
                  onClick={() => {
                    setEditandoAluno(null);
                    setModalAluno(true);
                  }}
                >
                  <Plus size={16} />
                  Novo aluno
                </Button>
              </div>

              {alunos.length === 0 ? (
                <EmptyState
                  icone={<Users size={24} />}
                  titulo="Sem alunos na turma"
                  descricao="Adicione o primeiro aluno à sua turma."
                  acao={
                    <Button
                      onClick={() => {
                        setEditandoAluno(null);
                        setModalAluno(true);
                      }}
                    >
                      <Plus size={16} />
                      Adicionar aluno
                    </Button>
                  }
                />
              ) : (
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeader>Matrícula</TableHeader>
                      <TableHeader>Nome</TableHeader>
                      <TableHeader className="hidden md:table-cell">
                        Encarregado
                      </TableHeader>
                      <TableHeader>Estado</TableHeader>
                      <TableHeader className="text-right">Ações</TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {alunos.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="font-mono text-xs text-slate-600">
                          {a.numero_matricula}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center text-xs font-medium shrink-0">
                              {a.nome_completo
                                .split(" ")
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join("")
                                .toUpperCase()}
                            </div>
                            <span className="font-medium">
                              {a.nome_completo}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-600 hidden md:table-cell">
                          {a.nome_encarregado ?? "—"}
                        </TableCell>
                        <TableCell>
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
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-3">
                            <Link
                              href={`/admin/alunos/${a.id}`}
                              className="text-primary hover:text-primary-500 text-sm font-medium"
                            >
                              Ver
                            </Link>
                            <button
                              onClick={() => {
                                setEditandoAluno(a);
                                setModalAluno(true);
                              }}
                              className="inline-flex items-center gap-1 text-accent hover:text-accent-600 text-sm font-medium"
                            >
                              <Pencil size={14} />
                              Editar
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </>
          )}

          {/* ABA NOTAS */}
          {abaAtiva === "notas" && (
            <>
              <p className="text-sm text-slate-500 mb-4">
                Escolha a disciplina para lançar/editar notas.
              </p>
              {disciplinas.length === 0 ? (
                <EmptyState
                  icone={<BookOpen size={24} />}
                  titulo="Sem disciplinas"
                  descricao="A classe desta turma não tem disciplinas."
                />
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {disciplinas.map((d) => (
                    <Link
                      key={d.id}
                      href={`/professor/notas/${turmaId}/${d.id}?trimestre=1`}
                      className="group"
                    >
                      <div className="bg-surface border border-border rounded-xl p-5 hover:border-accent/40 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white shrink-0"
                            style={{ backgroundColor: d.cor }}
                          >
                            <BookOpen size={18} />
                          </div>
                          <ArrowRight
                            size={18}
                            className="text-slate-400 group-hover:text-accent transition-colors"
                          />
                        </div>
                        <p className="font-serif text-lg text-primary mb-1">
                          {d.nome}
                        </p>
                        <p className="text-xs text-slate-500">
                          {d.codigo ?? "—"}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ABA FALTAS */}
          {abaAtiva === "faltas" && (
            <>
              <p className="text-sm text-slate-500 mb-4">
                Escolha a disciplina para registar faltas.
              </p>
              {disciplinas.length === 0 ? (
                <EmptyState
                  icone={<CalendarCheck size={24} />}
                  titulo="Sem disciplinas"
                  descricao="A classe desta turma não tem disciplinas."
                />
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {disciplinas.map((d) => (
                    <Link
                      key={d.id}
                      href={`/professor/faltas/${turmaId}/${d.id}`}
                      className="group"
                    >
                      <div className="bg-surface border border-border rounded-xl p-5 hover:border-accent/40 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white shrink-0"
                            style={{ backgroundColor: d.cor }}
                          >
                            <CalendarCheck size={18} />
                          </div>
                          <ArrowRight
                            size={18}
                            className="text-slate-400 group-hover:text-accent transition-colors"
                          />
                        </div>
                        <p className="font-serif text-lg text-primary mb-1">
                          {d.nome}
                        </p>
                        <p className="text-xs text-slate-500">
                          {d.codigo ?? "—"}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Modal de aluno */}
      <AlunoModal
        aberto={modalAluno}
        onFechar={() => setModalAluno(false)}
        aluno={editandoAluno}
        turmas={turma ? [turma] : []}
        classes={classes}
        areas={areas}
        onSucesso={carregar}
      />
    </>
  );
}
