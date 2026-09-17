"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  CalendarCheck,
  TrendingUp,
  Award,
  ArrowRight,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { mediaFinal, corNota, estadoNota } from "@/lib/notas";
import { contarFaltas } from "@/lib/faltas";
import type {
  Aluno,
  Area,
  Classe,
  Disciplina,
  Falta,
  Nota,
  Turma,
} from "@/types/database";

export default function AlunoDashboard() {
  const [aluno, setAluno] = useState<Aluno | null>(null);
  const [turma, setTurma] = useState<Turma | null>(null);
  const [classe, setClasse] = useState<Classe | null>(null);
  const [area, setArea] = useState<Area | null>(null);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [notas, setNotas] = useState<Nota[]>([]);
  const [faltas, setFaltas] = useState<Falta[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function carregar() {
      setLoading(true);
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Encontrar o aluno pelo user_id
      const { data: alunoData, error: alunoErr } = await supabase
        .from("alunos")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (alunoErr || !alunoData) {
        setErro("Perfil de aluno não encontrado.");
        setLoading(false);
        return;
      }

      setAluno(alunoData);

      // Turma, classe, área
      if (alunoData.turma_id) {
        const turmaRes = await supabase
          .from("turmas")
          .select("*")
          .eq("id", alunoData.turma_id)
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

      // Notas + faltas
      const [notasRes, faltasRes] = await Promise.all([
        supabase.from("notas").select("*").eq("aluno_id", alunoData.id),
        supabase.from("faltas").select("*").eq("aluno_id", alunoData.id),
      ]);

      setNotas(notasRes.data ?? []);
      setFaltas(faltasRes.data ?? []);
      setLoading(false);
    }
    carregar();
  }, []);

  const notasPorDisciplina = useMemo(() => {
    const map: Record<string, Nota[]> = {};
    notas.forEach((n) => {
      if (!map[n.disciplina_id]) map[n.disciplina_id] = [];
      map[n.disciplina_id].push(n);
    });
    return map;
  }, [notas]);

  const estatisticas = useMemo(() => {
    const mediasFinais = disciplinas
      .map((d) => mediaFinal(notasPorDisciplina[d.id] ?? []))
      .filter((m): m is number => m !== null);

    if (mediasFinais.length === 0) return null;

    const mediaGeral =
      mediasFinais.reduce((a, b) => a + b, 0) / mediasFinais.length;

    return {
      mediaGeral: Number(mediaGeral.toFixed(2)),
      melhor: Number(Math.max(...mediasFinais).toFixed(2)),
      positivas: mediasFinais.filter((m) => m >= 10).length,
      negativas: mediasFinais.filter((m) => m < 10).length,
    };
  }, [disciplinas, notasPorDisciplina]);

  const resumoFaltas = useMemo(() => contarFaltas(faltas), [faltas]);

  if (loading) {
    return (
      <>
        <Header titulo="Início" />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 size={28} className="animate-spin text-slate-400" />
        </main>
      </>
    );
  }

  if (erro || !aluno) {
    return (
      <>
        <Header titulo="Início" />
        <main className="flex-1 p-8">
          <div className="max-w-2xl mx-auto flex items-start gap-2 p-4 rounded-lg bg-danger-50 border border-danger/20 text-danger">
            <AlertCircle size={20} className="mt-0.5 shrink-0" />
            <span>{erro ?? "Erro ao carregar."}</span>
          </div>
        </main>
      </>
    );
  }

  const primeiroNome = aluno.nome_completo.split(" ")[0];

  return (
    <>
      <Header titulo={`Olá, ${primeiroNome}`} subtitulo="Portal do Aluno" />

      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          {/* Cartão identificação */}
          <div className="bg-surface border border-border rounded-xl shadow-card p-6 mb-6">
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
              </div>
            </div>
          </div>

          {/* Métricas */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-surface border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={16} className="text-primary" />
                <p className="text-xs text-slate-500">Média geral</p>
              </div>
              <p className="font-serif text-2xl text-primary">
                {estatisticas?.mediaGeral ?? "—"}
              </p>
            </div>
            <div className="bg-surface border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <Award size={16} className="text-success" />
                <p className="text-xs text-slate-500">Melhor média</p>
              </div>
              <p className="font-serif text-2xl text-success">
                {estatisticas?.melhor ?? "—"}
              </p>
            </div>
            <div className="bg-surface border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen size={16} className="text-primary" />
                <p className="text-xs text-slate-500">Disciplinas</p>
              </div>
              <p className="font-serif text-2xl text-primary">
                {disciplinas.length}
              </p>
            </div>
            <div className="bg-surface border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <CalendarCheck size={16} className="text-danger" />
                <p className="text-xs text-slate-500">Faltas</p>
              </div>
              <p className="font-serif text-2xl text-danger">
                {resumoFaltas.total}
              </p>
            </div>
          </div>

          {/* Ações */}
          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            <Link href="/aluno/notas" className="group">
              <div className="bg-surface border border-border rounded-xl p-6 hover:border-accent/40 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-accent-50 text-accent flex items-center justify-center">
                    <BookOpen size={20} />
                  </div>
                  <ArrowRight
                    size={18}
                    className="text-slate-400 group-hover:text-accent transition-colors"
                  />
                </div>
                <p className="font-serif text-lg text-primary mb-1">
                  Ver boletim
                </p>
                <p className="text-sm text-slate-500">
                  Consulte as suas notas por trimestre
                </p>
              </div>
            </Link>

            <Link href="/aluno/faltas" className="group">
              <div className="bg-surface border border-border rounded-xl p-6 hover:border-accent/40 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-info-50 text-info flex items-center justify-center">
                    <CalendarCheck size={20} />
                  </div>
                  <ArrowRight
                    size={18}
                    className="text-slate-400 group-hover:text-accent transition-colors"
                  />
                </div>
                <p className="font-serif text-lg text-primary mb-1">
                  Ver faltas
                </p>
                <p className="text-sm text-slate-500">
                  Resumo das suas faltas por disciplina
                </p>
              </div>
            </Link>
          </div>

          {/* Prévia do boletim */}
          {disciplinas.length > 0 && (
            <div className="bg-surface border border-border rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <h2 className="font-serif text-lg text-primary">
                  Resumo por disciplina
                </h2>
                <Link
                  href="/aluno/notas"
                  className="text-xs text-accent hover:underline"
                >
                  Ver tudo
                </Link>
              </div>
              <div className="divide-y divide-border">
                {disciplinas.slice(0, 5).map((d) => {
                  const mf = mediaFinal(notasPorDisciplina[d.id] ?? []);
                  return (
                    <div
                      key={d.id}
                      className="px-5 py-3 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: d.cor }}
                        />
                        <span className="text-sm font-medium text-primary truncate">
                          {d.nome}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-serif text-lg text-primary">
                          {mf !== null ? mf.toFixed(1) : "—"}
                        </span>
                        <Badge variant={corNota(mf)}>{estadoNota(mf)}</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
