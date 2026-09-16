"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Mail,
  Phone,
  Calendar,
  FileText,
  User,
  BookOpen,
  TrendingUp,
  Award,
} from "lucide-react";
import {
  mediaTrimestre,
  mediaFinal,
  corNota,
  estadoNota,
} from "@/lib/notas";
import type {
  Aluno,
  Area,
  Classe,
  Disciplina,
  Nota,
  Turma,
} from "@/types/database";

export default function AlunoDetalhePage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;

  const [aluno, setAluno] = useState<Aluno | null>(null);
  const [turma, setTurma] = useState<Turma | null>(null);
  const [classe, setClasse] = useState<Classe | null>(null);
  const [area, setArea] = useState<Area | null>(null);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [notas, setNotas] = useState<Nota[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [abaAtiva, setAbaAtiva] = useState<"boletim" | "dados">("boletim");

  async function carregar() {
    setLoading(true);
    setErro(null);
    const supabase = createClient();

    const alunoRes = await supabase
      .from("alunos")
      .select("*")
      .eq("id", id)
      .single();

    if (alunoRes.error) {
      setErro(alunoRes.error.message);
      setLoading(false);
      return;
    }

    setAluno(alunoRes.data);

    // Buscar turma, classe, área
    if (alunoRes.data.turma_id) {
      const turmaRes = await supabase
        .from("turmas")
        .select("*")
        .eq("id", alunoRes.data.turma_id)
        .single();

      if (turmaRes.data) {
        setTurma(turmaRes.data);

        const [classeRes, areaRes] = await Promise.all([
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
        ]);

        setClasse(classeRes.data);
        setArea(areaRes.data);

        // Buscar disciplinas da turma
        let discQuery = supabase
          .from("disciplinas")
          .select("*")
          .eq("classe_id", turmaRes.data.classe_id)
          .eq("ativo", true)
          .order("nome");

        if (turmaRes.data.area_id) {
          discQuery = discQuery.or(
            `area_id.eq.${turmaRes.data.area_id},area_id.is.null`
          );
        } else {
          discQuery = discQuery.is("area_id", null);
        }

        const discRes = await discQuery;
        setDisciplinas(discRes.data ?? []);
      }
    }

    // Buscar notas do aluno
    const notasRes = await supabase
      .from("notas")
      .select("*")
      .eq("aluno_id", id);

    setNotas(notasRes.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const notasPorDisciplina = useMemo(() => {
    const map: Record<string, Nota[]> = {};
    notas.forEach((n) => {
      if (!map[n.disciplina_id]) map[n.disciplina_id] = [];
      map[n.disciplina_id].push(n);
    });
    return map;
  }, [notas]);

  const estatisticas = useMemo(() => {
    if (notas.length === 0) return null;

    const mediasFinais = disciplinas
      .map((d) => mediaFinal(notasPorDisciplina[d.id] ?? []))
      .filter((m): m is number => m !== null);

    if (mediasFinais.length === 0) return null;

    const mediaGeral =
      mediasFinais.reduce((a, b) => a + b, 0) / mediasFinais.length;
    const positivas = mediasFinais.filter((m) => m >= 10).length;
    const negativas = mediasFinais.filter((m) => m < 10).length;
    const melhor = Math.max(...mediasFinais);

    return {
      mediaGeral: Number(mediaGeral.toFixed(2)),
      positivas,
      negativas,
      melhor: Number(melhor.toFixed(2)),
      totalDisciplinas: disciplinas.length,
    };
  }, [notas, disciplinas, notasPorDisciplina]);

  if (loading) {
    return (
      <>
        <Header titulo="Aluno" />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 size={28} className="animate-spin text-slate-400" />
        </main>
      </>
    );
  }

  if (erro || !aluno) {
    return (
      <>
        <Header titulo="Aluno" />
        <main className="flex-1 p-8">
          <div className="max-w-3xl mx-auto flex items-start gap-2 p-4 rounded-lg bg-danger-50 border border-danger/20 text-danger">
            <AlertCircle size={20} className="mt-0.5 shrink-0" />
            <span>{erro ?? "Aluno não encontrado."}</span>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header titulo={aluno.nome_completo} subtitulo={aluno.numero_matricula} />

      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <Link
            href="/admin/alunos"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary mb-6"
          >
            <ArrowLeft size={16} />
            Voltar à lista
          </Link>

          {/* Cartão do aluno */}
          <div className="bg-surface border border-border rounded-xl shadow-card overflow-hidden mb-6">
            <div className="px-6 py-6 flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center font-serif text-xl shrink-0">
                  {aluno.nome_completo
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </div>
                <div>
                  <h1 className="font-serif text-2xl text-primary mb-1">
                    {aluno.nome_completo}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                    <span className="font-mono">{aluno.numero_matricula}</span>
                    {turma && (
                      <>
                        <span>·</span>
                        <span>{turma.nome}</span>
                      </>
                    )}
                    {classe && (
                      <>
                        <span>·</span>
                        <span>{classe.nome}</span>
                      </>
                    )}
                    {area && (
                      <>
                        <span>·</span>
                        <Badge variant="info">Área {area.codigo}</Badge>
                      </>
                    )}
                  </div>
                  <div className="mt-2">
                    <Badge
                      variant={
                        aluno.status === "ativo"
                          ? "success"
                          : aluno.status === "suspenso"
                            ? "warning"
                            : "outline"
                      }
                    >
                      {aluno.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Abas */}
            <div className="border-t border-border flex">
              <button
                onClick={() => setAbaAtiva("boletim")}
                className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                  abaAtiva === "boletim"
                    ? "text-primary border-b-2 border-primary bg-primary-50/30"
                    : "text-slate-500 hover:text-primary"
                }`}
              >
                <BookOpen size={16} className="inline mr-2" />
                Boletim
              </button>
              <button
                onClick={() => setAbaAtiva("dados")}
                className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                  abaAtiva === "dados"
                    ? "text-primary border-b-2 border-primary bg-primary-50/30"
                    : "text-slate-500 hover:text-primary"
                }`}
              >
                <User size={16} className="inline mr-2" />
                Dados pessoais
              </button>
            </div>
          </div>

          {/* ABA BOLETIM */}
          {abaAtiva === "boletim" && (
            <>
              {disciplinas.length === 0 ? (
                <EmptyState
                  icone={<BookOpen size={24} />}
                  titulo="Sem disciplinas"
                  descricao="Esta turma não tem disciplinas registadas."
                  acao={
                    <Link href="/admin/estrutura/disciplinas">
                      <Button>Ir para Disciplinas</Button>
                    </Link>
                  }
                />
              ) : (
                <>
                  {/* Estatísticas */}
                  {estatisticas && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      <div className="bg-surface border border-border rounded-xl p-5">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp size={16} className="text-primary" />
                          <p className="text-xs text-slate-500">
                            Média geral
                          </p>
                        </div>
                        <p className="font-serif text-2xl text-primary">
                          {estatisticas.mediaGeral}
                        </p>
                      </div>
                      <div className="bg-surface border border-border rounded-xl p-5">
                        <div className="flex items-center gap-2 mb-2">
                          <Award size={16} className="text-success" />
                          <p className="text-xs text-slate-500">
                            Melhor média
                          </p>
                        </div>
                        <p className="font-serif text-2xl text-success">
                          {estatisticas.melhor}
                        </p>
                      </div>
                      <div className="bg-surface border border-border rounded-xl p-5">
                        <p className="text-xs text-slate-500 mb-2">
                          Disciplinas positivas
                        </p>
                        <p className="font-serif text-2xl text-success">
                          {estatisticas.positivas}
                          <span className="text-sm text-slate-400">
                            /{estatisticas.totalDisciplinas}
                          </span>
                        </p>
                      </div>
                      <div className="bg-surface border border-border rounded-xl p-5">
                        <p className="text-xs text-slate-500 mb-2">
                          Disciplinas negativas
                        </p>
                        <p className="font-serif text-2xl text-danger">
                          {estatisticas.negativas}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Tabela de boletim */}
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableHeader>Disciplina</TableHeader>
                        <TableHeader className="text-center">
                          1º Trim.
                        </TableHeader>
                        <TableHeader className="text-center">
                          2º Trim.
                        </TableHeader>
                        <TableHeader className="text-center">
                          3º Trim.
                        </TableHeader>
                        <TableHeader className="text-center">
                          Média final
                        </TableHeader>
                        <TableHeader className="text-center">
                          Estado
                        </TableHeader>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {disciplinas.map((d) => {
                        const dNotas = notasPorDisciplina[d.id] ?? [];
                        const t1 = dNotas.find((n) => n.trimestre === 1);
                        const t2 = dNotas.find((n) => n.trimestre === 2);
                        const t3 = dNotas.find((n) => n.trimestre === 3);

                        const m1 = t1 ? mediaTrimestre(t1) : null;
                        const m2 = t2 ? mediaTrimestre(t2) : null;
                        const m3 = t3 ? mediaTrimestre(t3) : null;
                        const mf = mediaFinal(dNotas);

                        return (
                          <TableRow key={d.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-3 h-3 rounded-full shrink-0"
                                  style={{ backgroundColor: d.cor }}
                                />
                                <span className="font-medium">{d.nome}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              {m1 !== null ? m1.toFixed(1) : "—"}
                            </TableCell>
                            <TableCell className="text-center">
                              {m2 !== null ? m2.toFixed(1) : "—"}
                            </TableCell>
                            <TableCell className="text-center">
                              {m3 !== null ? m3.toFixed(1) : "—"}
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="font-serif text-lg text-primary">
                                {mf !== null ? mf.toFixed(1) : "—"}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant={corNota(mf)}>
                                {estadoNota(mf)}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </>
              )}
            </>
          )}

          {/* ABA DADOS */}
          {abaAtiva === "dados" && (
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="bg-surface border border-border rounded-xl p-6 shadow-card space-y-5">
                <h3 className="font-serif text-lg text-primary border-b border-border pb-3">
                  Informação pessoal
                </h3>
                <InfoItem
                  icone={Calendar}
                  label="Data de nascimento"
                  valor={
                    aluno.data_nascimento
                      ? new Date(aluno.data_nascimento).toLocaleDateString(
                          "pt-MZ"
                        )
                      : "—"
                  }
                />
                <InfoItem
                  icone={User}
                  label="Género"
                  valor={
                    aluno.genero === "M"
                      ? "Masculino"
                      : aluno.genero === "F"
                        ? "Feminino"
                        : "—"
                  }
                />
                <InfoItem
                  icone={FileText}
                  label="BI / Documento"
                  valor={aluno.bi_documento ?? "—"}
                />
                <InfoItem
                  icone={User}
                  label="Endereço"
                  valor={aluno.endereco ?? "—"}
                />
              </div>

              <div className="bg-surface border border-border rounded-xl p-6 shadow-card space-y-5">
                <h3 className="font-serif text-lg text-primary border-b border-border pb-3">
                  Encarregado de educação
                </h3>
                <InfoItem
                  icone={User}
                  label="Nome"
                  valor={aluno.nome_encarregado ?? "—"}
                />
                <InfoItem
                  icone={Phone}
                  label="Telefone"
                  valor={aluno.telefone_encarregado ?? "—"}
                />
                <InfoItem
                  icone={Mail}
                  label="E-mail"
                  valor={aluno.email_encarregado ?? "—"}
                />
              </div>

              {aluno.observacoes && (
                <div className="sm:col-span-2 bg-surface border border-border rounded-xl p-6 shadow-card">
                  <h3 className="font-serif text-lg text-primary border-b border-border pb-3 mb-4">
                    Observações
                  </h3>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">
                    {aluno.observacoes}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}

function InfoItem({
  icone: Icone,
  label,
  valor,
}: {
  icone: React.ComponentType<{ size?: string | number; className?: string }>;
  label: string;
  valor: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
        <Icone size={14} />
        <span>{label}</span>
      </div>
      <p className="text-sm text-primary">{valor}</p>
    </div>
  );
}
