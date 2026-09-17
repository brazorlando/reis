"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Loader2,
  AlertCircle,
  User,
  Mail,
  Phone,
  Calendar,
  FileText,
  LogOut,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { Aluno, Area, Classe, Turma } from "@/types/database";

export default function AlunoPerfilPage() {
  const router = useRouter();
  const [aluno, setAluno] = useState<Aluno | null>(null);
  const [turma, setTurma] = useState<Turma | null>(null);
  const [classe, setClasse] = useState<Classe | null>(null);
  const [area, setArea] = useState<Area | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function carregar() {
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
          setTurma(turmaRes.data);

          const [c, a] = await Promise.all([
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

          setClasse(c.data);
          setArea(a.data);
        }
      }

      setLoading(false);
    }
    carregar();
  }, []);

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  if (loading) {
    return (
      <>
        <Header titulo="Perfil" />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 size={28} className="animate-spin text-slate-400" />
        </main>
      </>
    );
  }

  if (erro || !aluno) {
    return (
      <>
        <Header titulo="Perfil" />
        <main className="flex-1 p-8">
          <div className="max-w-2xl mx-auto flex items-start gap-2 p-4 rounded-lg bg-danger-50 border border-danger/20 text-danger">
            <AlertCircle size={20} className="mt-0.5 shrink-0" />
            <span>{erro ?? "Erro"}</span>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header titulo="Perfil" subtitulo="Os seus dados" />

      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {/* Cartão principal */}
          <div className="bg-surface border border-border rounded-xl shadow-card overflow-hidden mb-6">
            <div className="px-6 py-6">
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
                    {turma && <span>· {turma.nome}</span>}
                    {classe && <span>· {classe.nome}</span>}
                    {area && <Badge variant="info">Área {area.codigo}</Badge>}
                  </div>
                </div>
              </div>
            </div>
          </div>

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
                    ? new Date(aluno.data_nascimento).toLocaleDateString("pt-MZ")
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
                label="Documento"
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
                Encarregado
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
          </div>

          {/* Logout */}
          <div className="mt-6 text-center">
            <Button variant="outline" onClick={logout}>
              <LogOut size={16} />
              Terminar sessão
            </Button>
          </div>
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
