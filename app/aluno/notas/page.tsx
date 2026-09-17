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
import { Loader2, AlertCircle, BookOpen } from "lucide-react";
import { mediaTrimestre, mediaFinal, corNota, estadoNota } from "@/lib/notas";
import type { Aluno, Disciplina, Nota } from "@/types/database";

export default function AlunoNotasPage() {
  const [aluno, setAluno] = useState<Aluno | null>(null);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [notas, setNotas] = useState<Nota[]>([]);
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

      const notasRes = await supabase
        .from("notas")
        .select("*")
        .eq("aluno_id", alunoData.id);

      setNotas(notasRes.data ?? []);
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

  if (loading) {
    return (
      <>
        <Header titulo="Boletim" />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 size={28} className="animate-spin text-slate-400" />
        </main>
      </>
    );
  }

  if (erro) {
    return (
      <>
        <Header titulo="Boletim" />
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
      <Header titulo="Boletim" subtitulo={aluno?.numero_matricula} />

      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          {disciplinas.length === 0 ? (
            <EmptyState
              icone={<BookOpen size={24} />}
              titulo="Sem disciplinas"
              descricao="Ainda não há disciplinas registadas para a sua turma."
            />
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Disciplina</TableHeader>
                  <TableHeader className="text-center">1º Trim.</TableHeader>
                  <TableHeader className="text-center">2º Trim.</TableHeader>
                  <TableHeader className="text-center">3º Trim.</TableHeader>
                  <TableHeader className="text-center">Média final</TableHeader>
                  <TableHeader className="text-center">Estado</TableHeader>
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
                        <Badge variant={corNota(mf)}>{estadoNota(mf)}</Badge>
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
