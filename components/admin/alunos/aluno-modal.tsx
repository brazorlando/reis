"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Loader2, Check, AlertCircle } from "lucide-react";
import type { Aluno, Area, Classe, Turma } from "@/types/database";

type AlunoModalProps = {
  aberto: boolean;
  onFechar: () => void;
  aluno: Aluno | null;
  turmas: Turma[];
  classes: Classe[];
  areas: Area[];
  onSucesso: () => void;
};

export function AlunoModal({
  aberto,
  onFechar,
  aluno,
  turmas,
  classes,
  areas,
  onSucesso,
}: AlunoModalProps) {
  const [form, setForm] = useState({
    nome_completo: "",
    data_nascimento: "",
    genero: "" as "" | "M" | "F",
    bi_documento: "",
    turma_id: "",
    ano_letivo: new Date().getFullYear().toString(),
    nome_encarregado: "",
    telefone_encarregado: "",
    email_encarregado: "",
    endereco: "",
    status: "ativo" as Aluno["status"],
    observacoes: "",
  });
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!aberto) return;
    setErro(null);

    setForm({
      nome_completo: aluno?.nome_completo ?? "",
      data_nascimento: aluno?.data_nascimento ?? "",
      genero: aluno?.genero ?? "",
      bi_documento: aluno?.bi_documento ?? "",
      turma_id: aluno?.turma_id ?? "",
      ano_letivo: (aluno?.ano_letivo ?? new Date().getFullYear()).toString(),
      nome_encarregado: aluno?.nome_encarregado ?? "",
      telefone_encarregado: aluno?.telefone_encarregado ?? "",
      email_encarregado: aluno?.email_encarregado ?? "",
      endereco: aluno?.endereco ?? "",
      status: aluno?.status ?? "ativo",
      observacoes: aluno?.observacoes ?? "",
    });
  }, [aberto, aluno]);

  function atualizar<K extends keyof typeof form>(
    campo: K,
    valor: (typeof form)[K]
  ) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  // Turmas agrupadas por classe para o select
  const turmasAgrupadas = useMemo(() => {
    const grupos: Record<string, { classe: Classe; turmas: Turma[] }> = {};
    turmas.forEach((t) => {
      const classe = classes.find((c) => c.id === t.classe_id);
      if (!classe) return;
      if (!grupos[classe.id]) {
        grupos[classe.id] = { classe, turmas: [] };
      }
      grupos[classe.id].turmas.push(t);
    });
    return Object.values(grupos).sort(
      (a, b) => a.classe.numero - b.classe.numero
    );
  }, [turmas, classes]);

  function labelTurma(t: Turma) {
    const area = t.area_id ? areas.find((a) => a.id === t.area_id) : null;
    return `${t.nome}${area ? ` (Área ${area.codigo})` : ""}`;
  }

    async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    if (!form.nome_completo.trim()) {
      setErro("O nome é obrigatório.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Validação robusta de UUIDs
    function idValido(v: string | null | undefined): string | null {
      if (!v) return null;
      const s = String(v).trim();
      if (s === "" || s === "undefined" || s === "null") return null;
      return s;
    }

    const turmaId = idValido(form.turma_id);
    const criadoPor = idValido(user?.id);

    const payload: Record<string, unknown> = {
      nome_completo: form.nome_completo.trim(),
      data_nascimento: form.data_nascimento || null,
      genero: form.genero || null,
      bi_documento: form.bi_documento.trim() || null,
      turma_id: turmaId,
      ano_letivo: parseInt(form.ano_letivo) || new Date().getFullYear(),
      nome_encarregado: form.nome_encarregado.trim() || null,
      telefone_encarregado: form.telefone_encarregado.trim() || null,
      email_encarregado: form.email_encarregado.trim() || null,
      endereco: form.endereco.trim() || null,
      status: form.status,
      observacoes: form.observacoes.trim() || null,
    };

    let error;
    if (aluno) {
      ({ error } = await supabase
        .from("alunos")
        .update(payload)
        .eq("id", aluno.id));
    } else {
      const { data: mat, error: matErr } = await supabase.rpc(
        "gerar_matricula"
      );

      if (matErr) {
        setErro("Erro ao gerar matrícula: " + matErr.message);
        setLoading(false);
        return;
      }

      payload.numero_matricula =
        mat ?? `RR-${form.ano_letivo}-${Date.now()}`;
      payload.criado_por = criadoPor;

      ({ error } = await supabase.from("alunos").insert(payload));
    }

    if (error) {
      setErro(
        error.message.includes("duplicate")
          ? "Já existe um aluno com este número de matrícula."
          : error.message
      );
      setLoading(false);
      return;
    }

    // Criar acesso se for aluno novo com BI
    if (!aluno && payload.bi_documento) {
      const { data: novoAluno } = await supabase
        .from("alunos")
        .select("id")
        .eq("numero_matricula", payload.numero_matricula)
        .maybeSingle();

      if (novoAluno?.id) {
        await fetch("/api/admin/aluno/criar-acesso", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ aluno_id: novoAluno.id }),
        });
      }
    }

    setLoading(false);
    onFechar();
    onSucesso();
  }

  return (
    <Modal
      aberto={aberto}
      onFechar={onFechar}
      titulo={aluno ? "Editar aluno" : "Novo aluno"}
      descricao={
        aluno
          ? `Matrícula: ${aluno.numero_matricula}`
          : "A matrícula será gerada automaticamente"
      }
      tamanho="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Nome */}
        <div>
          <label className="block text-sm font-medium text-primary mb-2">
            Nome completo *
          </label>
          <Input
            value={form.nome_completo}
            onChange={(e) => atualizar("nome_completo", e.target.value)}
            placeholder="Nome do aluno"
            required
            disabled={loading}
          />
        </div>

        {/* Nascimento + Género */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Data de nascimento
            </label>
            <Input
              type="date"
              value={form.data_nascimento}
              onChange={(e) => atualizar("data_nascimento", e.target.value)}
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Género
            </label>
            <Select
              value={form.genero}
              onChange={(e) =>
                atualizar("genero", e.target.value as "" | "M" | "F")
              }
              disabled={loading}
            >
              <option value="">— Não indicado —</option>
              <option value="M">Masculino</option>
              <option value="F">Feminino</option>
            </Select>
          </div>
        </div>

        {/* BI */}
        <div>
          <label className="block text-sm font-medium text-primary mb-2">
            Nº de BI / Documento
          </label>
          <Input
            value={form.bi_documento}
            onChange={(e) => atualizar("bi_documento", e.target.value)}
            placeholder="Ex: 123456789A"
            disabled={loading}
          />
        </div>

        {/* Turma + Ano letivo */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Turma
            </label>
            <Select
              value={form.turma_id}
              onChange={(e) => atualizar("turma_id", e.target.value)}
              disabled={loading}
            >
              <option value="">— Sem turma —</option>
              {turmasAgrupadas.map((grupo) => (
                <optgroup key={grupo.classe.id} label={grupo.classe.nome}>
                  {grupo.turmas.map((t) => (
                    <option key={t.id} value={t.id}>
                      {labelTurma(t)}
                    </option>
                  ))}
                </optgroup>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Ano letivo *
            </label>
            <Input
              type="number"
              value={form.ano_letivo}
              onChange={(e) => atualizar("ano_letivo", e.target.value)}
              required
              disabled={loading}
            />
          </div>
        </div>

        {/* Estado (só edição) */}
        {aluno && (
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Estado
            </label>
            <Select
              value={form.status}
              onChange={(e) =>
                atualizar("status", e.target.value as Aluno["status"])
              }
              disabled={loading}
            >
              <option value="ativo">Ativo</option>
              <option value="transferido">Transferido</option>
              <option value="suspenso">Suspenso</option>
              <option value="inativo">Inativo</option>
            </Select>
          </div>
        )}

        {/* Encarregado */}
        <div className="border-t border-border pt-5">
          <p className="text-sm font-medium text-primary mb-3">
            Encarregado de educação
          </p>
          <div className="space-y-4">
            <Input
              value={form.nome_encarregado}
              onChange={(e) => atualizar("nome_encarregado", e.target.value)}
              placeholder="Nome do encarregado"
              disabled={loading}
            />
            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                value={form.telefone_encarregado}
                onChange={(e) =>
                  atualizar("telefone_encarregado", e.target.value)
                }
                placeholder="Telefone"
                disabled={loading}
              />
              <Input
                type="email"
                value={form.email_encarregado}
                onChange={(e) =>
                  atualizar("email_encarregado", e.target.value)
                }
                placeholder="E-mail"
                disabled={loading}
              />
            </div>
            <Input
              value={form.endereco}
              onChange={(e) => atualizar("endereco", e.target.value)}
              placeholder="Endereço"
              disabled={loading}
            />
          </div>
        </div>

        {/* Observações */}
        <div>
          <label className="block text-sm font-medium text-primary mb-2">
            Observações
          </label>
          <textarea
            value={form.observacoes}
            onChange={(e) => atualizar("observacoes", e.target.value)}
            rows={2}
            placeholder="Notas internas sobre o aluno"
            className="w-full px-4 py-3 rounded-lg border border-border bg-surface text-primary placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-none"
            disabled={loading}
          />
        </div>

        {erro && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-danger-50 border border-danger/20 text-danger text-sm">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{erro}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onFechar}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                A guardar...
              </>
            ) : (
              <>
                <Check size={16} />
                {aluno ? "Guardar" : "Criar aluno"}
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
