"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import {
  ClipboardList,
  Loader2,
  AlertCircle,
  ArrowRight,
  BookOpen,
  Users,
} from "lucide-react";
import type { Classe, Disciplina, Turma } from "@/types/database";

export default function NotasPage() {
  const router = useRouter();
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [classes, setClasses] = useState<Classe[]>([]);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [turmaId, setTurmaId] = useState("");
  const [disciplinaId, setDisciplinaId] = useState("");
  const [trimestre, setTrimestre] = useState("1");

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

  // Disciplinas disponíveis para a turma escolhida
  const disciplinasDaTurma = turmas.find((t) => t.id === turmaId)
    ? disciplinas.filter((d) => {
        const turma = turmas.find((t) => t.id === turmaId);
        if (!turma) return false;
        // Disciplina pertence à classe da turma
        if (d.classe_id !== turma.classe_id) return false;
        // Se a turma tem área, a disciplina tem de ter a mesma área OU ser global à classe
        if (turma.area_id) {
          return d.area_id === turma.area_id || d.area_id === null;
        }
        // Turma sem área → só disciplinas globais à classe
        return d.area_id === null;
      })
    : [];

  function irLancar() {
    if (!turmaId || !disciplinaId || !trimestre) return;
    router.push(
      `/admin/notas/${turmaId}/${disciplinaId}?trimestre=${trimestre}`
    );
  }

  const podeContinuar = turmaId && disciplinaId && trimestre;

  return (
    <>
      <Header titulo="Notas" subtitulo="Lançamento de notas por turma" />

      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-3xl mx-auto">
          <PageHeader
            titulo="Lançamento de notas"
            descricao="Escolha a turma, a disciplina e o trimestre"
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
              descricao="Crie turmas na Estrutura antes de lançar notas."
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
              {/* Turma */}
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

              {/* Disciplina */}
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
                {turmaId && disciplinasDaTurma.length === 0 && (
                  <p className="text-xs text-slate-500 mt-1">
                    Adicione disciplinas à classe/área em{" "}
                    <Link
                      href="/admin/estrutura/disciplinas"
                      className="text-accent hover:underline"
                    >
                      Estrutura → Disciplinas
                    </Link>
                    .
                  </p>
                )}
              </div>

              {/* Trimestre */}
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Trimestre *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTrimestre(t.toString())}
                      className={`p-3 rounded-lg border text-center transition-colors ${
                        trimestre === t.toString()
                          ? "border-primary bg-primary text-white"
                          : "border-border text-primary hover:bg-primary-50"
                      }`}
                    >
                      <span className="font-serif text-lg block">{t}º</span>
                      <span className="text-xs opacity-80">Trimestre</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Continuar */}
              <div className="pt-3 border-t border-border">
                <Button
                  onClick={irLancar}
                  disabled={!podeContinuar}
                  className="w-full"
                  size="lg"
                >
                  <ClipboardList size={18} />
                  Lançar notas
                  <ArrowRight size={18} />
                </Button>
              </div>
            </div>
          )}

          {/* Info */}
          <div className="mt-6 bg-accent-50 border border-accent/20 rounded-xl p-5">
            <p className="text-sm text-primary mb-2 font-medium">
              Como funciona?
            </p>
            <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
              <li>Cada trimestre tem 3 avaliações: <strong>1ª ACS</strong>, <strong>2ª ACS</strong>, <strong>AP</strong></li>
              <li>A média do trimestre é a soma das 3, dividida por 3</li>
              <li>A média final é a média dos 3 trimestres</li>
              <li>Escala de <strong>0 a 20</strong></li>
            </ul>
          </div>
        </div>
      </main>
    </>
  );
}
