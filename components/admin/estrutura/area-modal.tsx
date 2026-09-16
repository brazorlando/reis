"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Loader2, Check, AlertCircle } from "lucide-react";
import type { Area, Classe } from "@/types/database";

type AreaModalProps = {
  aberto: boolean;
  onFechar: () => void;
  area: Area | null;
  classes: Classe[];
  onSucesso: () => void;
};

const codigosDisponiveis = ["A", "B", "C"] as const;

export function AreaModal({
  aberto,
  onFechar,
  area,
  classes,
  onSucesso,
}: AreaModalProps) {
  const [classeId, setClasseId] = useState("");
  const [codigo, setCodigo] = useState<"A" | "B" | "C">("A");
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [ativo, setAtivo] = useState(true);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!aberto) return;
    setErro(null);

    if (area) {
      setClasseId(area.classe_id);
      setCodigo(area.codigo);
      setNome(area.nome ?? "");
      setDescricao(area.descricao ?? "");
      setAtivo(area.ativo);
    } else {
      setClasseId(classes[0]?.id ?? "");
      setCodigo("A");
      setNome("");
      setDescricao("");
      setAtivo(true);
    }
  }, [aberto, area, classes]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    if (!classeId) {
      setErro("Selecione a classe.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const payload = {
      classe_id: classeId,
      codigo,
      nome: nome.trim() || null,
      descricao: descricao.trim() || null,
      ativo,
    };

    let error;
    if (area) {
      ({ error } = await supabase
        .from("areas")
        .update(payload)
        .eq("id", area.id));
    } else {
      ({ error } = await supabase.from("areas").insert(payload));
    }

    if (error) {
      setErro(
        error.message.includes("duplicate")
          ? "Já existe uma área com este código nesta classe."
          : error.message
      );
      setLoading(false);
      return;
    }

    setLoading(false);
    onFechar();
    onSucesso();
  }

  return (
    <Modal
      aberto={aberto}
      onFechar={onFechar}
      titulo={area ? "Editar área" : "Nova área"}
      descricao={
        area
          ? "Atualize os dados da área"
          : "Adicione uma área A, B ou C"
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-primary mb-2">
            Classe *
          </label>
          <Select
            value={classeId}
            onChange={(e) => setClasseId(e.target.value)}
            required
            disabled={loading}
          >
            <option value="">— Selecione —</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome} ({c.ano_letivo})
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-primary mb-2">
            Código *
          </label>
          <div className="grid grid-cols-3 gap-2">
            {codigosDisponiveis.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCodigo(c)}
                disabled={loading}
                className={`p-3 rounded-lg border text-center font-serif text-xl transition-colors ${
                  codigo === c
                    ? "border-primary bg-primary text-white"
                    : "border-border text-primary hover:bg-primary-50"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-primary mb-2">
            Nome (opcional)
          </label>
          <Input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex: Ciências e Tecnologias"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-primary mb-2">
            Descrição (opcional)
          </label>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={2}
            placeholder="Breve descrição da área"
            className="w-full px-4 py-3 rounded-lg border border-border bg-surface text-primary placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-none"
            disabled={loading}
          />
        </div>

        {area && (
          <label className="flex items-center gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-primary-50/40">
            <input
              type="checkbox"
              checked={ativo}
              onChange={(e) => setAtivo(e.target.checked)}
              className="w-4 h-4 accent-accent"
              disabled={loading}
            />
            <span className="text-sm text-primary">Área ativa</span>
          </label>
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
                {area ? "Guardar" : "Criar área"}
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
