"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/header";
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
import { Loader2, AlertCircle, CalendarCheck } from "lucide-react";
import { contarFaltas, corFaltas } from "@/lib/faltas";
import type { Aluno, Disciplina, Falta } from "@/types/database";

export default function AlunoFaltasPage() {
  const [aluno, setAluno] = useState<Aluno | null>(null);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
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

      const { data: alunoData } = await supabase
        .from("alunos")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!alunoData) {
        setErro("Perfil não encontrado.");
        setLoading(false);
        return;
      }

      setAluno(alunoData);

      if (alunoData.turma_id) {
        const turmaRes = await supabase
          .from("turmas")
          .select("*")
          .eq("id", alunoData.turma_id)
          .single();

        if (turmaRes.data) {
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

      const faltasRes = await supabase
        .from("faltas")
        .select("*")
        .eq("aluno_id", alunoData.id);

      setFaltas(faltasRes.data ?? []);
      setLoading(false);
    }
    carregar();
  }, []);

  const faltasPorDisciplina = useMemo(() => {
    const map: Record<string, Falta[]> = {};
    faltas.forEach((f) => {
      if (!map[f.disciplina_id]) map[f.disciplina_id] = [];
      map[f.disciplina_id].push(f);
    });
    return map;
  }, [faltas]);

  const resumo = useMemo(() => contarFaltas(faltas), [faltas]);

  if (loading) {
    return (
      <>
        <Header titulo="Faltas" />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 size={28} className="animate-spin text-slate-400" />
        </main>
      </>
    );
  }

  if (erro) {
    return (
      <>
        <Header titulo="Faltas" />
        <main className="flex-1 p-8">
          <div className="max-w-2xl mx-auto flex items-start gap-2 p-4 rounded-lg bg-danger-50 border border-danger/20 text-danger">
            <AlertCircle size={20} className="mt-0.5 shrink-0" />
            <span>{erro}</span>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header titulo="Faltas" subtitulo={aluno?.numero_matricula} />

      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          {/* Estatísticas */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-surface border border-border rounded-xl p-5">
              <p className="text-xs text-slate-500 mb-2">Total</p>
              <p className="font-serif text-2xl text-primary">{resumo.total}</p>
            </div>
            <div className="bg-surface border border-border rounded-xl p-5">
              <p className="text-xs text-slate-500 mb-2">Injustificadas</p>
              <p className="font-serif text-2xl text-danger">
                {resumo.injustificadas}
              </p>
            </div>
            <div className="bg-surface border border-border rounded-xl p-5">
              <p className="text-xs text-slate-500 mb-2">Justificadas</p>
              <p className="font-serif text-2xl text-accent">
                {resumo.justificadas}
              </p>
            </div>
            <div className="bg-surface border border-border rounded-xl p-5">
              <p className="text-xs text-slate-500 mb-2">Atrasos</p>
              <p className="font-serif text-2xl text-info">{resumo.atrasos}</p>
            </div>
          </div>

          {faltas.filter((f) => f.tipo !== "presenca").length === 0 ? (
            <EmptyState
              icone={<CalendarCheck size={24} />}
              titulo="Sem faltas"
              descricao="Parabéns! Tem presença perfeita até agora."
            />
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Disciplina</TableHeader>
                  <TableHeader className="text-center">Faltas</TableHeader>
                  <TableHeader className="text-center">Justificadas</TableHeader>
                  <TableHeader className="text-center">Atrasos</TableHeader>
                  <TableHeader className="text-center">Estado</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {disciplinas.map((d) => {
                  const dFaltas = faltasPorDisciplina[d.id] ?? [];
                  const c = contarFaltas(dFaltas);

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
                        <span className="font-serif text-lg text-primary">
                          {c.total}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {c.justificadas}
                      </TableCell>
                      <TableCell className="text-center">{c.atrasos}</TableCell>
                      <TableCell className="text-center">
                        {c.total === 0 ? (
                          <Badge variant="success">Perfeito</Badge>
                        ) : (
                          <Badge variant={corFaltas(c.total)}>
                            {c.total} falta{c.total !== 1 ? "s" : ""}
                          </Badge>
                        )}
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
