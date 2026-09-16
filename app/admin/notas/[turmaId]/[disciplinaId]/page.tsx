"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
import { mediaTrimestre, corNota, estadoNota } from "@/lib/notas";
import type { Aluno, Disciplina, Nota, Turma } from "@/types/database";

type NotaEditavel = {
  aluno_id: string;
  acs1: string;
  acs2: string;
  ap: string;
};

export default function LancarNotasPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const turmaId = params.turmaId as string;
  const disciplinaId = params.disciplinaId as string;
  const trimestre = parseInt(searchParams.get("trimestre") ?? "1") as 1 | 2 | 3;

  const [turma, setTurma] = useState<Turma | null>(null);
  const [disciplina, setDisciplina] = useState<Disciplina | null>(null);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [notas, setNotas] = useState<Record<string, NotaEditavel>>({});
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function carregar() {
    setLoading(true);
    setErro(null);
    const supabase = createClient();

    const [turmaRes, discRes, alunosRes, notasRes] = await Promise.all([
      supabase.from("turmas").select("*").eq("id", turmaId).single(),
      supabase.from("disciplinas").select("*").eq("id", disciplinaId).single(),
      supabase
        .from("alunos")
        .select("*")
        .eq("turma_id", turmaId)
        .eq("status", "ativo")
        .order("nome_completo"),
      supabase
        .from("notas")
        .select("*")
        .eq("turma_id", turmaId)
        .eq("disciplina_id", disciplinaId)
        .eq("trimestre", trimestre),
    ]);

    if (turmaRes.error) setErro(turmaRes.error.message);
    else setTurma(turmaRes.data);

    if (discRes.error) setErro(discRes.error.message);
    else setDisciplina(discRes.data);

    setAlunos(alunosRes.data ?? []);

    // Preparar mapa de notas editáveis
    const notasMap: Record<string, NotaEditavel> = {};
    (alunosRes.data ?? []).forEach((a) => {
      const existente = (notasRes.data ?? []).find(
        (n) => n.aluno_id === a.id
      );
      notasMap[a.id] = {
        aluno_id: a.id,
        acs1: existente?.acs1?.toString() ?? "",
        acs2: existente?.acs2?.toString() ?? "",
        ap: existente?.ap?.toString() ?? "",
      };
    });
    setNotas(notasMap);
    setLoading(false);
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turmaId, disciplinaId, trimestre]);

  function atualizarNota(
    alunoId: string,
    campo: "acs1" | "acs2" | "ap",
    valor: string
  ) {
    // Validar: vazio ou número entre 0 e 20
    if (valor !== "") {
      const num = parseFloat(valor);
      if (isNaN(num) || num < 0 || num > 20) return;
    }
    setNotas((prev) => ({
      ...prev,
      [alunoId]: { ...prev[alunoId], [campo]: valor },
    }));
  }

  async function salvarTodas() {
    setErro(null);
    setSalvando(true);
    setSucesso(false);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Preparar registos (upsert)
    const registos = Object.values(notas).map((n) => ({
      aluno_id: n.aluno_id,
      disciplina_id: disciplinaId,
      turma_id: turmaId,
      trimestre,
      acs1: n.acs1 === "" ? null : parseFloat(n.acs1),
      acs2: n.acs2 === "" ? null : parseFloat(n.acs2),
      ap: n.ap === "" ? null : parseFloat(n.ap),
      lancado_por: user?.id ?? null,
    }));

    if (registos.length === 0) {
      setSalvando(false);
      return;
    }

    const { error } = await supabase
      .from("notas")
      .upsert(registos, {
        onConflict: "aluno_id,disciplina_id,trimestre",
      });

    if (error) {
      setErro(error.message);
      setSalvando(false);
      return;
    }

    setSucesso(true);
    setSalvando(false);
    setTimeout(() => setSucesso(false), 3000);
  }

  // Calcular estatísticas
  const stats = useMemo(() => {
    const medias = Object.values(notas)
      .map((n) =>
        mediaTrimestre({
          acs1: n.acs1 === "" ? null : parseFloat(n.acs1),
          acs2: n.acs2 === "" ? null : parseFloat(n.acs2),
          ap: n.ap === "" ? null : parseFloat(n.ap),
        })
      )
      .filter((m): m is number => m !== null);

    if (medias.length === 0) return { media: null, positivas: 0, negativas: 0 };

    const media = medias.reduce((a, b) => a + b, 0) / medias.length;
    const positivas = medias.filter((m) => m >= 10).length;
    const negativas = medias.filter((m) => m < 10).length;
    return {
      media: Number(media.toFixed(2)),
      positivas,
      negativas,
    };
  }, [notas]);

  if (loading) {
    return (
      <>
        <Header titulo="Lançar notas" />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 size={28} className="animate-spin text-slate-400" />
        </main>
      </>
    );
  }

  if (erro && !turma) {
    return (
      <>
        <Header titulo="Lançar notas" />
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
      <Header
        titulo={`${disciplina?.nome ?? ""} — ${turma?.nome ?? ""}`}
        subtitulo={`${trimestre}º trimestre`}
      />

      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          <Link
            href="/admin/notas"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary mb-6"
          >
            <ArrowLeft size={16} />
            Voltar à seleção
          </Link>

          <PageHeader
            titulo={`${alunos.length} aluno${alunos.length !== 1 ? "s" : ""}`}
            descricao={`${disciplina?.nome ?? ""} · ${turma?.nome ?? ""} · ${trimestre}º trimestre`}
            acao={
              <div className="flex items-center gap-2">
                {sucesso && (
                  <span className="inline-flex items-center gap-1.5 text-sm text-success font-medium">
                    <Check size={16} />
                    Guardado
                  </span>
                )}
                <Button onClick={salvarTodas} disabled={salvando || alunos.length === 0}>
                  {salvando ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      A guardar...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Guardar notas
                    </>
                  )}
                </Button>
              </div>
            }
          />

          {/* Erro */}
          {erro && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-danger-50 border border-danger/20 text-danger text-sm mb-6">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <span>{erro}</span>
            </div>
          )}

          {/* Estatísticas */}
          {alunos.length > 0 && stats.media !== null && (
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-surface border border-border rounded-xl p-4">
                <p className="text-xs text-slate-500 mb-1">Média da turma</p>
                <p className="font-serif text-2xl text-primary">
                  {stats.media}
                </p>
              </div>
              <div className="bg-surface border border-border rounded-xl p-4">
                <p className="text-xs text-slate-500 mb-1">Positivas</p>
                <p className="font-serif text-2xl text-success">
                  {stats.positivas}
                </p>
              </div>
              <div className="bg-surface border border-border rounded-xl p-4">
                <p className="text-xs text-slate-500 mb-1">Negativas</p>
                <p className="font-serif text-2xl text-danger">
                  {stats.negativas}
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
                  <TableHeader className="w-24 text-center">
                    1ª ACS
                  </TableHeader>
                  <TableHeader className="w-24 text-center">
                    2ª ACS
                  </TableHeader>
                  <TableHeader className="w-24 text-center">AP</TableHeader>
                  <TableHeader className="w-24 text-center">Média</TableHeader>
                  <TableHeader className="w-32 text-center">Estado</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {alunos.map((aluno, idx) => {
                  const n = notas[aluno.id] ?? {
                    acs1: "",
                    acs2: "",
                    ap: "",
                  };
                  const media = mediaTrimestre({
                    acs1: n.acs1 === "" ? null : parseFloat(n.acs1),
                    acs2: n.acs2 === "" ? null : parseFloat(n.acs2),
                    ap: n.ap === "" ? null : parseFloat(n.ap),
                  });

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
                        <input
                          type="number"
                          min="0"
                          max="20"
                          step="0.1"
                          value={n.acs1}
                          onChange={(e) =>
                            atualizarNota(aluno.id, "acs1", e.target.value)
                          }
                          placeholder="—"
                          className="w-full h-9 px-2 text-center rounded border border-border focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                      </TableCell>
                      <TableCell>
                        <input
                          type="number"
                          min="0"
                          max="20"
                          step="0.1"
                          value={n.acs2}
                          onChange={(e) =>
                            atualizarNota(aluno.id, "acs2", e.target.value)
                          }
                          placeholder="—"
                          className="w-full h-9 px-2 text-center rounded border border-border focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                      </TableCell>
                      <TableCell>
                        <input
                          type="number"
                          min="0"
                          max="20"
                          step="0.1"
                          value={n.ap}
                          onChange={(e) =>
                            atualizarNota(aluno.id, "ap", e.target.value)
                          }
                          placeholder="—"
                          className="w-full h-9 px-2 text-center rounded border border-border focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-serif text-lg text-primary">
                          {media !== null ? media.toFixed(1) : "—"}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={corNota(media)}>
                          {estadoNota(media)}
                        </Badge>
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
