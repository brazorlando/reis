"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AprovarModal } from "@/components/admin/professores/aprovar-modal";
import { RejeitarModal } from "@/components/admin/professores/rejeitar-modal";
import {
  ArrowLeft,
  Loader2,
  Mail,
  Phone,
  Calendar,
  Briefcase,
  GraduationCap,
  FileText,
  Check,
  X,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import type { Profile } from "@/types/database";

export default function ProfessorDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [professor, setProfessor] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [modalAprovar, setModalAprovar] = useState(false);
  const [modalRejeitar, setModalRejeitar] = useState(false);

  async function carregar() {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      setErro(error.message);
    } else {
      setProfessor(data as Profile);
    }
    setLoading(false);
  }

  useEffect(() => {
    carregar();
  }, [id]);

  if (loading) {
    return (
      <>
        <Header titulo="Professor" />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 size={28} className="animate-spin text-slate-400" />
        </main>
      </>
    );
  }

  if (erro || !professor) {
    return (
      <>
        <Header titulo="Professor" />
        <main className="flex-1 p-8">
          <div className="max-w-3xl mx-auto flex items-start gap-2 p-4 rounded-lg bg-danger-50 border border-danger/20 text-danger">
            <AlertCircle size={20} className="mt-0.5 shrink-0" />
            <span>{erro ?? "Professor não encontrado."}</span>
          </div>
        </main>
      </>
    );
  }

  function badgeStatus(status: Profile["status"]) {
    switch (status) {
      case "aprovado":
        return <Badge variant="success">Aprovado</Badge>;
      case "pendente":
        return <Badge variant="warning">Pendente</Badge>;
      case "rejeitado":
        return <Badge variant="danger">Rejeitado</Badge>;
      case "suspenso":
        return <Badge variant="outline">Suspenso</Badge>;
    }
  }

  return (
    <>
      <Header titulo="Detalhe do professor" />

      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/admin/professores"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary mb-6"
          >
            <ArrowLeft size={16} />
            Voltar à lista
          </Link>

          {/* Cartão principal */}
          <div className="bg-surface border border-border rounded-xl shadow-card overflow-hidden mb-6">
            <div className="px-6 py-6 border-b border-border flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                {professor.foto_url ? (
                  <img
                    src={professor.foto_url}
                    alt={professor.nome_completo}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center font-serif text-xl">
                    {professor.nome_completo
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </div>
                )}
                <div>
                  <h1 className="font-serif text-2xl text-primary">
                    {professor.nome_completo}
                  </h1>
                  <p className="text-sm text-slate-500">{professor.email}</p>
                  <div className="mt-2">{badgeStatus(professor.status)}</div>
                </div>
              </div>

              {professor.status === "pendente" && (
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    onClick={() => setModalRejeitar(true)}
                  >
                    <X size={16} />
                    Rejeitar
                  </Button>
                  <Button onClick={() => setModalAprovar(true)}>
                    <Check size={16} />
                    Aprovar
                  </Button>
                </div>
              )}

              {professor.status === "aprovado" && (
                <Button
                  variant="outline"
                  onClick={() => setModalRejeitar(true)}
                >
                  <X size={16} />
                  Suspender
                </Button>
              )}
            </div>

            {/* Motivo de rejeição (se houver) */}
            {professor.motivo_rejeicao && (
              <div className="px-6 py-4 bg-danger-50 border-b border-danger/20">
                <p className="text-xs font-medium text-danger mb-1">
                  Motivo
                </p>
                <p className="text-sm text-danger/90">
                  {professor.motivo_rejeicao}
                </p>
              </div>
            )}

            {/* Dados */}
            <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border">
              <div className="p-6 space-y-4">
                <InfoItem
                  icone={Mail}
                  label="E-mail"
                  valor={professor.email}
                />
                <InfoItem
                  icone={Phone}
                  label="Telefone"
                  valor={professor.telefone ?? "—"}
                />
                <InfoItem
                  icone={Calendar}
                  label="Data de nascimento"
                  valor={
                    professor.data_nascimento
                      ? new Date(
                          professor.data_nascimento
                        ).toLocaleDateString("pt-MZ")
                      : "—"
                  }
                />
                <InfoItem
                  icone={FileText}
                  label="BI / Documento"
                  valor={professor.bi_documento ?? "—"}
                />
              </div>

              <div className="p-6 space-y-4">
                <InfoItem
                  icone={GraduationCap}
                  label="Formação"
                  valor={professor.formacao ?? "—"}
                />
                <InfoItem
                  icone={Briefcase}
                  label="Anos de experiência"
                  valor={
                    professor.anos_experiencia !== null
                      ? `${professor.anos_experiencia} ano(s)`
                      : "—"
                  }
                />
                <InfoItem
                  icone={Calendar}
                  label="Cadastrado em"
                  valor={new Date(professor.criado_em).toLocaleDateString(
                    "pt-MZ"
                  )}
                />
              </div>
            </div>

            {/* Documentos */}
            {(professor.cv_url || professor.diploma_url) && (
              <div className="px-6 py-5 border-t border-border">
                <p className="text-sm font-medium text-primary mb-3">
                  Documentos anexados
                </p>
                <div className="flex flex-wrap gap-2">
                  {professor.cv_url && (
                    <a
                      href={professor.cv_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm text-primary hover:bg-primary-50 transition-colors"
                    >
                      <FileText size={16} />
                      Curriculum Vitae
                      <ExternalLink size={14} className="text-slate-400" />
                    </a>
                  )}
                  {professor.diploma_url && (
                    <a
                      href={professor.diploma_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm text-primary hover:bg-primary-50 transition-colors"
                    >
                      <FileText size={16} />
                      Diploma
                      <ExternalLink size={14} className="text-slate-400" />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <AprovarModal
        aberto={modalAprovar}
        onFechar={() => {
          setModalAprovar(false);
          carregar();
        }}
        professorId={professor.id}
        professorNome={professor.nome_completo}
      />

      <RejeitarModal
        aberto={modalRejeitar}
        onFechar={() => {
          setModalRejeitar(false);
          carregar();
        }}
        professorId={professor.id}
        professorNome={professor.nome_completo}
      />
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
