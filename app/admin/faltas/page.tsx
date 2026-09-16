"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import {
  CalendarCheck,
  Loader2,
  AlertCircle,
  ArrowRight,
  Users,
} from "lucide-react";
import type { Classe, Disciplina, Turma } from "@/types/database";

export default function FaltasPage() {
  const router = useRouter();
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [classes, setClasses] = useState<Classe[]>([]);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [turmaId, setTurmaId] = useState("");
  const [disciplinaId, setDisciplinaId] = useState("");
  const [data, setData] = useState(() =>
    new Date().toISOString().split("T")[0]
  );

  async function carregar() {
    setLoading(true);
    const supabase = createClient();

    const [turmasRes, classesRes, disciplinasRes] = await Promise.all([
      supabase.from("turmas").select("*").eq("ativo", true).order("nome"),
      supabase.from("classes").select("*").order("numero"),
      supabase.from("disciplinas").select("*").eq("ativo", true).order("nome"),
    ]);

    if (turmasRes.error) setErro(turmasRes.error.message);
    else setTurmas(turmasRes.data ?? []);

    setClasses(classesRes.data ?? []);
    setDisciplinas(disciplinasRes.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  const nomeClasse = (id: string) =>
    classes.find((c) => c.id === id)?.nome ?? "—";

  const disciplinasDaTurma = turmas.find((t) => t.id === turmaId)
    ? disciplinas.filter((d) => {
        const turma = turmas.find((t) => t.id === turmaId);
        if (!turma) return false;
        if (d.classe_id !== turma.classe_id) return false;
        if (turma.area_id) {
          return d.area_id === turma.area_id || d.area_id === null;
        }
        return d.area_id === null;
      })
    : [];

  function irLancar() {
    if (!turmaId || !disciplinaId || !data) return;
    router.push(
      `/admin/faltas/${turmaId}/${disciplinaId}?data=${data}`
    );
  }

  const podeContinuar = turmaId && disciplinaId && data;

  return (
    <>
      <Header titulo="Faltas" subtitulo="Registo de presenças" />

      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-3xl mx-auto">
          <PageHeader
            titulo="Registo de faltas"
            descricao="Escolha a turma, a disciplina e a data"
          />

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
          ) : turmas.length === 0 ? (
            <EmptyState
              icone={<Users size={24} />}
              titulo="Sem turmas"
              descricao="Crie turmas na Estrutura antes de registar faltas."
              acao={
                <Link href="/admin/estrutura/turmas">
                  <Button>
                    Ir para Turmas
                    <ArrowRight size={16} />
                  </Button>
                </Link>
              }
            />
          ) : (
            <div className="bg-surface border border-border rounded-xl p-6 shadow-card space-y-5">
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Turma *
                </label>
                <Select
                  value={turmaId}
                  onChange={(e) => {
                    setTurmaId(e.target.value);
                    setDisciplinaId("");
                  }}
                >
                  <option value="">— Selecione —</option>
                  {turmas.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nome} ({nomeClasse(t.classe_id)} · {t.ano_letivo})
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Disciplina *
                </label>
                <Select
                  value={disciplinaId}
                  onChange={(e) => setDisciplinaId(e.target.value)}
                  disabled={!turmaId}
                >
                  <option value="">
                    {!turmaId
                      ? "— Escolha a turma primeiro —"
                      : disciplinasDaTurma.length === 0
                        ? "— Sem disciplinas para esta turma —"
                        : "— Selecione —"}
                  </option>
                  {disciplinasDaTurma.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nome}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Data da aula *
                </label>
                <Input
                  type="date"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                />
              </div>

              <div className="pt-3 border-t border-border">
                <Button
                  onClick={irLancar}
                  disabled={!podeContinuar}
                  className="w-full"
                  size="lg"
                >
                  <CalendarCheck size={18} />
                  Registar presenças
                  <ArrowRight size={18} />
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
