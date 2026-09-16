"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Star,
  Users,
  ArrowRight,
  Loader2,
  AlertCircle,
} from "lucide-react";
import type { Area, Classe, Turma } from "@/types/database";

export default function MinhaTurmaPage() {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [classes, setClasses] = useState<Classe[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [contagens, setContagens] = useState<Record<string, number>>({});
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

      const [turmasRes, classesRes, areasRes, alunosRes] = await Promise.all([
        supabase
          .from("turmas")
          .select("*")
          .eq("diretor_turma_id", user.id)
          .order("nome"),
        supabase.from("classes").select("*"),
        supabase.from("areas").select("*"),
        supabase.from("alunos").select("turma_id"),
      ]);

      if (turmasRes.error) setErro(turmasRes.error.message);
      else setTurmas(turmasRes.data ?? []);

      setClasses(classesRes.data ?? []);
      setAreas(areasRes.data ?? []);

      // Contagem de alunos por turma
      const mapa: Record<string, number> = {};
      (alunosRes.data ?? []).forEach((a) => {
        if (a.turma_id) {
          mapa[a.turma_id] = (mapa[a.turma_id] ?? 0) + 1;
        }
      });
      setContagens(mapa);
      setLoading(false);
    }
    carregar();
  }, []);

  const nomeClasse = (id: string) =>
    classes.find((c) => c.id === id)?.nome ?? "—";
  const codigoArea = (id: string | null) =>
    id ? areas.find((a) => a.id === id)?.codigo ?? null : null;

  return (
    <>
      <Header titulo="Minha Turma" subtitulo="Turmas que dirige" />

      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          <PageHeader
            titulo="Turmas que dirijo"
            descricao="Acesso completo a alunos, notas e faltas"
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
              icone={<Star size={24} />}
              titulo="Sem turmas atribuídas"
              descricao="Ainda não é diretor de nenhuma turma."
            />
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {turmas.map((t) => (
                <Link key={t.id} href={`/professor/minha-turma/${t.id}`}>
                  <div className="bg-surface border border-border rounded-xl p-6 shadow-card hover:border-accent/40 transition-colors group">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-lg bg-accent text-white flex items-center justify-center shrink-0">
                        <Star size={22} />
                      </div>
                      <ArrowRight
                        size={18}
                        className="text-slate-400 group-hover:text-accent transition-colors"
                      />
                    </div>
                    <h3 className="font-serif text-xl text-primary mb-1">
                      {t.nome}
                    </h3>
                    <p className="text-xs text-slate-500 mb-4">
                      {nomeClasse(t.classe_id)}
                      {codigoArea(t.area_id) && ` · Área ${codigoArea(t.area_id)}`}
                      {` · ${t.ano_letivo}`}
                    </p>

                    <div className="flex items-center justify-between pt-3 border-t border-border text-sm">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Users size={14} />
                        Alunos
                      </span>
                      <Badge variant="info">
                        {contagens[t.id] ?? 0} matriculados
                      </Badge>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
