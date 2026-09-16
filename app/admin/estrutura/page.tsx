"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  GraduationCap,
  Layers,
  BookOpen,
  Users,
  Settings,
  ArrowRight,
  Check,
  Loader2,
  AlertCircle,
} from "lucide-react";

type Passo = {
  id: string;
  titulo: string;
  descricao: string;
  href: string;
  icone: typeof Settings;
  contagem: number;
  ativo: boolean;
  bloqueado: boolean;
};

export default function EstruturaPage() {
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [niveisAtivos, setNiveisAtivos] = useState(0);
  const [totalClasses, setTotalClasses] = useState(0);
  const [totalAreas, setTotalAreas] = useState(0);
  const [totalDisciplinas, setTotalDisciplinas] = useState(0);
  const [totalTurmas, setTotalTurmas] = useState(0);

  async function carregar() {
    setLoading(true);
    setErro(null);
    const supabase = createClient();

    const [niveis, classes, areas, disciplinas, turmas] = await Promise.all([
      supabase
        .from("niveis_ensino")
        .select("*", { count: "exact", head: true })
        .eq("ativo", true),
      supabase.from("classes").select("*", { count: "exact", head: true }),
      supabase.from("areas").select("*", { count: "exact", head: true }),
      supabase.from("disciplinas").select("*", { count: "exact", head: true }),
      supabase.from("turmas").select("*", { count: "exact", head: true }),
    ]);

    if (niveis.error) setErro(niveis.error.message);
    else setNiveisAtivos(niveis.count ?? 0);

    setTotalClasses(classes.count ?? 0);
    setTotalAreas(areas.count ?? 0);
    setTotalDisciplinas(disciplinas.count ?? 0);
    setTotalTurmas(turmas.count ?? 0);
    setLoading(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  const passos: Passo[] = [
    {
      id: "configuracao",
      titulo: "Configuração",
      descricao: "Ative os níveis de ensino que a escola oferece",
      href: "/admin/configuracoes",
      icone: Settings,
      contagem: niveisAtivos,
      ativo: niveisAtivos > 0,
      bloqueado: false,
    },
    {
      id: "classes",
      titulo: "Classes",
      descricao: "Adicione as classes (1ª a 12ª)",
      href: "/admin/estrutura/classes",
      icone: GraduationCap,
      contagem: totalClasses,
      ativo: totalClasses > 0,
      bloqueado: niveisAtivos === 0,
    },
    {
      id: "areas",
      titulo: "Áreas",
      descricao: "A, B, C — só para a pré-universitária",
      href: "/admin/estrutura/areas",
      icone: Layers,
      contagem: totalAreas,
      ativo: totalAreas > 0,
      bloqueado: totalClasses === 0,
    },
    {
      id: "disciplinas",
      titulo: "Disciplinas",
      descricao: "Por classe e por área",
      href: "/admin/estrutura/disciplinas",
      icone: BookOpen,
      contagem: totalDisciplinas,
      ativo: totalDisciplinas > 0,
      bloqueado: totalClasses === 0,
    },
    {
      id: "turmas",
      titulo: "Turmas",
      descricao: "Geração de turmas por classe/área",
      href: "/admin/estrutura/turmas",
      icone: Users,
      contagem: totalTurmas,
      ativo: totalTurmas > 0,
      bloqueado: totalClasses === 0,
    },
  ];

  return (
    <>
      <Header
        titulo="Estrutura Académica"
        subtitulo="Configure a escola passo a passo"
      />

      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h2 className="font-serif text-2xl text-primary mb-1">
              Estrutura da escola
            </h2>
            <p className="text-sm text-slate-500">
              Cada etapa depende da anterior. Complete-as pela ordem.
            </p>
          </div>

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
          ) : (
            <div className="space-y-3">
              {passos.map((passo, idx) => {
                const Icone = passo.icone;

                return (
                  <div
                    key={passo.id}
                    className={`bg-surface border rounded-xl p-5 flex items-center gap-5 transition-colors ${
                      passo.bloqueado
                        ? "border-border opacity-60"
                        : passo.ativo
                          ? "border-success/30 bg-success-50/20"
                          : "border-border hover:border-accent/40"
                    }`}
                  >
                    {/* Número do passo */}
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-serif text-lg shrink-0 ${
                        passo.ativo
                          ? "bg-success text-white"
                          : passo.bloqueado
                            ? "bg-primary-50 text-slate-400"
                            : "bg-primary text-white"
                      }`}
                    >
                      {passo.ativo ? <Check size={22} /> : idx + 1}
                    </div>

                    {/* Ícone + info */}
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                          passo.ativo
                            ? "bg-success-50 text-success"
                            : "bg-primary-50 text-primary"
                        }`}
                      >
                        <Icone size={20} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="font-serif text-lg text-primary">
                            {passo.titulo}
                          </h3>
                          {passo.contagem > 0 && (
                            <Badge variant="success">
                              {passo.contagem}
                            </Badge>
                          )}
                          {passo.bloqueado && (
                            <Badge variant="outline">Bloqueado</Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-500">
                          {passo.descricao}
                        </p>
                      </div>
                    </div>

                    {/* Ação */}
                    {passo.bloqueado ? (
                      <span className="text-xs text-slate-400 shrink-0">
                        Complete os anteriores
                      </span>
                    ) : (
                      <Link href={passo.href}>
                        <Button variant={passo.ativo ? "outline" : "primary"}>
                          {passo.ativo ? "Gerir" : "Começar"}
                          <ArrowRight size={16} />
                        </Button>
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
