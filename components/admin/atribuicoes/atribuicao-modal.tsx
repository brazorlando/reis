"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Loader2, Check, AlertCircle } from "lucide-react";
import type { Classe, Disciplina, Profile, Turma } from "@/types/database";

type AtribuicaoModalProps = {
  aberto: boolean;
  onFechar: () => void;
  professores: Profile[];
  turmas: Turma[];
  disciplinas: Disciplina[];
  classes: Classe[];
  onSucesso: () => void;
};

export function AtribuicaoModal({
  aberto,
  onFechar,
  professores,
  turmas,
  disciplinas,
  classes,
  onSucesso,
}: AtribuicaoModalProps) {
  const [professorId, setProfessorId] = useState("");
  const [turmaId, setTurmaId] = useState("");
  const [disciplinaIds, setDisciplinaIds] = useState<string[]>([]);
  const [anoLetivo, setAnoLetivo] = useState(
    new Date().getFullYear().toString()
  );
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!aberto) return;
    setProfessorId("");
    setTurmaId("");
    setDisciplinaIds([]);
    setAnoLetivo(new Date().getFullYear().toString());
    setErro(null);
  }, [aberto]);

  // Disciplinas disponíveis para a turma escolhida
  const disciplinasDaTurma = useMemo(() => {
    const turma = turmas.find((t) => t.id === turmaId);
    if (!turma) return [];
    return disciplinas.filter((d) => {
      if (d.classe_id !== turma.classe_id) return false;
      if (turma.area_id) {
        return d.area_id === turma.area_id || d.area_id === null;
      }
      return d.area_id === null;
    });
  }, [turmaId, turmas, disciplinas]);

  function toggle(id: string) {
    setDisciplinaIds((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    if (!professorId || !turmaId || disciplinaIds.length === 0) {
      setErro("Escolha o professor, a turma e pelo menos uma disciplina.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const registos = disciplinaIds.map((disciplina_id) => ({
      professor_id: professorId,
      disciplina_id,
      turma_id: turmaId,
      ano_letivo: parseInt(anoLetivo),
      criado_por: user?.id ?? null,
    }));

    const { error } = await supabase
      .from("atribuicoes")
      .upsert(registos, {
        onConflict: "professor_id,disciplina_id,turma_id,ano_letivo",
      });

    if (error) {
      setErro(error.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    onFechar();
    onSucesso();
  }

  const turmaSelecionada = turmas.find((t) => t.id === turmaId);
  const classeTurma = turmaSelecionada
    ? classes.find((c) => c.id === turmaSelecionada.classe_id)
    : null;

  return (
    <Modal
      aberto={aberto}
      onFechar={onFechar}
      titulo="Nova atribuição"
      descricao="Atribuir professor a disciplinas de uma turma"
      tamanho="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-primary mb-2">
            Professor *
          </label>
          <Select
            value={professorId}
            onChange={(e) => setProfessorId(e.target.value)}
            required
            disabled={loading}
          >
            <option value="">— Selecione —</option>
            {professores.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome_completo}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Turma *
            </label>
            <Select
              value={turmaId}
              onChange={(e) => {
                setTurmaId(e.target.value);
                setDisciplinaIds([]);
              }}
              required
              disabled={loading}
            >
              <option value="">— Selecione —</option>
              {turmas.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome}
                  {classes.find((c) => c.id === t.classe_id)
                    ? ` (${classes.find((c) => c.id === t.classe_id)?.nome})`
                    : ""}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Ano letivo *
            </label>
            <Input
              type="number"
              value={anoLetivo}
              onChange={(e) => setAnoLetivo(e.target.value)}
              required
              disabled={loading}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-primary mb-2">
            Disciplinas ({disciplinaIds.length} selecionadas) *
          </label>
          {!turmaId ? (
            <p className="text-xs text-slate-500 p-3 border border-dashed border-border rounded-lg text-center">
              Escolha a turma primeiro.
            </p>
          ) : disciplinasDaTurma.length === 0 ? (
            <p className="text-xs text-slate-500 p-3 border border-dashed border-border rounded-lg text-center">
              Esta turma não tem disciplinas registadas.
            </p>
          ) : (
            <div className="border border-border rounded-lg max-h-64 overflow-y-auto">
              {disciplinasDaTurma.map((d) => (
                <label
                  key={d.id}
                  className="flex items-center gap-3 px-4 py-2.5 border-b border-border last:border-b-0 hover:bg-primary-50/40 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={disciplinaIds.includes(d.id)}
                    onChange={() => toggle(d.id)}
                    className="w-4 h-4 accent-accent"
                    disabled={loading}
                  />
                  <div className="flex items-center gap-2 flex-1">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: d.cor }}
                    />
                    <span className="text-sm text-primary">{d.nome}</span>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {classeTurma && (
          <div className="bg-primary-50/50 border border-border rounded-lg p-3 text-xs text-slate-600">
            <strong>Classe:</strong> {classeTurma.nome} ·{" "}
            <strong>Turma:</strong> {turmaSelecionada?.nome}
          </div>
        )}

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
                Atribuir
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
