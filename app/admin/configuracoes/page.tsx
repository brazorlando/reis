"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Check, AlertCircle, BookOpen, School, GraduationCap } from "lucide-react";
import type { NivelEnsino } from "@/types/database";

const iconesNivel = {
  primaria: BookOpen,
  secundaria: School,
  pre_universitaria: GraduationCap,
};

const descricoesNivel = {
  primaria: "Da 1ª à 6ª classe. Turmas diretas, sem áreas.",
  secundaria: "Da 7ª à 9ª classe. Turmas diretas, sem áreas.",
  pre_universitaria: "Da 10ª à 12ª classe. Com áreas A, B, C.",
};

export default function ConfiguracoesPage() {
  const [niveis, setNiveis] = useState<NivelEnsino[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function carregar() {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("niveis_ensino")
      .select("*")
      .order("codigo");

    if (error) setErro(error.message);
    else setNiveis((data as NivelEnsino[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  async function toggleNivel(codigo: NivelEnsino["codigo"]) {
    setSalvando(codigo);
    setErro(null);

    const nivel = niveis.find((n) => n.codigo === codigo);
    if (!nivel) return;

    const supabase = createClient();
    const { error } = await supabase
      .from("niveis_ensino")
      .update({ ativo: !nivel.ativo })
      .eq("codigo", codigo);

    if (error) {
      setErro(error.message);
    } else {
      setNiveis((prev) =>
        prev.map((n) =>
          n.codigo === codigo ? { ...n, ativo: !n.ativo } : n
        )
      );
    }
    setSalvando(null);
  }

  const ativos = niveis.filter((n) => n.ativo).length;

  return (
    <>
      <Header
        titulo="Configuração"
        subtitulo="Ativar/desativar níveis de ensino"
      />

      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h2 className="font-serif text-2xl text-primary mb-1">
              Níveis de ensino
            </h2>
            <p className="text-sm text-slate-500">
              {ativos > 0
                ? `${ativos} nível${ativos > 1 ? "is" : ""} ativo${ativos > 1 ? "s" : ""}. Altere quando necessário.`
                : "Ative pelo menos um nível para começar a configurar a estrutura."}
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
              {niveis.map((nivel) => {
                const Icone = iconesNivel[nivel.codigo];
                const descricao = descricoesNivel[nivel.codigo];
                const salvandoEste = salvando === nivel.codigo;

                return (
                  <div
                    key={nivel.id}
                    className={`bg-surface border rounded-xl p-5 flex items-center gap-5 transition-colors ${
                      nivel.ativo
                        ? "border-success/30 bg-success-50/20"
                        : "border-border"
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${
                        nivel.ativo
                          ? "bg-success text-white"
                          : "bg-primary-50 text-primary"
                      }`}
                    >
                      <Icone size={22} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-serif text-lg text-primary">
                          {nivel.nome}
                        </h3>
                        {nivel.ativo ? (
                          <Badge variant="success">Ativo</Badge>
                        ) : (
                          <Badge variant="outline">Inativo</Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-500">{descricao}</p>
                    </div>

                    <Button
                      variant={nivel.ativo ? "outline" : "primary"}
                      onClick={() => toggleNivel(nivel.codigo)}
                      disabled={salvandoEste}
                    >
                      {salvandoEste ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : nivel.ativo ? (
                        "Desativar"
                      ) : (
                        <>
                          <Check size={16} />
                          Ativar
                        </>
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          {!loading && ativos > 0 && (
            <div className="mt-8 bg-accent-50 border border-accent/20 rounded-xl p-5">
              <p className="text-sm text-primary">
                <strong>Próximo passo:</strong> com pelo menos um nível ativo,
                já pode criar as classes em{" "}
                <a
                  href="/admin/estrutura/classes"
                  className="text-accent hover:underline font-medium"
                >
                  Estrutura → Classes
                </a>
                .
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
