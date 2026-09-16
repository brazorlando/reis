"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Loader2, Check, AlertCircle } from "lucide-react";
import type { Area, Classe, Disciplina } from "@/types/database";

type DisciplinaModalProps = {
  aberto: boolean;
  onFechar: () => void;
  disciplina: Disciplina | null;
  classes: Classe[];
  areas: Area[];
  onSucesso: () => void;
};

const CORES_SUGERIDAS = [
  "#0D1B3E",
  "#D98E2B",
  "#5A9E3E",
  "#4FA8D5",
  "#B91C1C",
  "#7C3AED",
  "#0891B2",
  "#EA580C",
  "#0F766E",
  "#9333EA",
];

export function DisciplinaModal({
  aberto,
  onFechar,
  disciplina,
  classes,
  areas,
  onSucesso,
}: DisciplinaModalProps) {
  const [classeId, setClasseId] = useState("");
  const [areaId, setAreaId] = useState("");
  const [nome, setNome] = useState("");
  const [codigo, setCodigo] = useState("");
  const [carga, setCarga] = useState("");
  const [cor, setCor] = useState(CORES_SUGERIDAS[0]);
  const [ativo, setAtivo] = useState(true);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!aberto) return;
    setErro(null);

    if (disciplina) {
      setClasseId(disciplina.classe_id);
      setAreaId(disciplina.area_id ?? "");
      setNome(disciplina.nome);
      setCodigo(disciplina.codigo ?? "");
      setCarga(disciplina.carga_horaria?.toString() ?? "");
      setCor(disciplina.cor);
      setAtivo(disciplina.ativo);
    } else {
      setClasseId(classes[0]?.id ?? "");
      setAreaId("");
      setNome("");
      setCodigo("");
      setCarga("");
      setCor(CORES_SUGERIDAS[0]);
      setAtivo(true);
    }
  }, [aberto, disciplina, classes]);

  // Áreas disponíveis para a classe escolhida
  const areasDaClasse = useMemo(
    () => areas.filter((a) => a.classe_id === classeId),
    [areas, classeId]
  );

  // Reset área quando muda classe
  useEffect(() => {
    if (areaId && !areasDaClasse.some((a) => a.id === areaId)) {
      setAreaId("");
    }
  }, [classeId, areasDaClasse, areaId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    if (!classeId || !nome.trim()) {
      setErro("Selecione a classe e indique o nome da disciplina.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const payload = {
      nome: nome.trim(),
      codigo: codigo.trim() || null,
      carga_horaria: carga ? parseInt(carga) : null,
      cor,
      classe_id: classeId,
      area_id: areaId || null,
      ativo,
    };

    let error;
    if (disciplina) {
      ({ error } = await supabase
        .from("disciplinas")
        .update(payload)
        .eq("id", disciplina.id));
    } else {
      ({ error } = await supabase.from("disciplinas").insert(payload));
    }

    if (error) {
      setErro(
        error.message.includes("duplicate")
          ? "Já existe esta disciplina para esta classe/área."
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
      titulo={disciplina ? "Editar disciplina" : "Nova disciplina"}
      descricao={
        disciplina
          ? "Atualize os dados da disciplina"
          : "Adicione uma disciplina a uma classe ou área"
      }
      tamanho="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Classe + Área */}
        <div className="grid sm:grid-cols-2 gap-4">
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
              Área {areasDaClasse.length === 0 && "(sem áreas)"}
            </label>
            <Select
              value={areaId}
              onChange={(e) => setAreaId(e.target.value)}
              disabled={loading || areasDaClasse.length === 0}
            >
              <option value="">
                {areasDaClasse.length === 0
                  ? "— Sem áreas nesta classe —"
                  : "— Nenhuma (global à classe) —"}
              </option>
              {areasDaClasse.map((a) => (
                <option key={a.id} value={a.id}>
                  Área {a.codigo}
                  {a.nome ? ` — ${a.nome}` : ""}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {/* Nome + Código */}
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-primary mb-2">
              Nome da disciplina *
            </label>
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Matemática"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Código
            </label>
            <Input
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.toUpperCase())}
              placeholder="MAT"
              maxLength={5}
              disabled={loading}
            />
          </div>
        </div>

        {/* Carga */}
        <div>
          <label className="block text-sm font-medium text-primary mb-2">
            Carga horária semanal
          </label>
          <Input
            type="number"
            min="1"
            max="40"
            value={carga}
            onChange={(e) => setCarga(e.target.value)}
            placeholder="Ex: 6"
            disabled={loading}
          />
        </div>

        {/* Cor */}
        <div>
          <label className="block text-sm font-medium text-primary mb-2">
            Cor
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {CORES_SUGERIDAS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCor(c)}
                disabled={loading}
                className={`w-9 h-9 rounded-lg border-2 transition-all ${
                  cor === c
                    ? "border-primary scale-110"
                    : "border-transparent"
                }`}
                style={{ backgroundColor: c }}
                aria-label={`Selecionar cor ${c}`}
              />
            ))}
          </div>
          <Input
            value={cor}
            onChange={(e) => setCor(e.target.value)}
            placeholder="#0D1B3E"
            disabled={loading}
            className="font-mono"
          />
        </div>

        {disciplina && (
          <label className="flex items-center gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-primary-50/40">
            <input
              type="checkbox"
              checked={ativo}
              onChange={(e) => setAtivo(e.target.checked)}
              className="w-4 h-4 accent-accent"
              disabled={loading}
            />
            <span className="text-sm text-primary">Disciplina ativa</span>
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
                {disciplina ? "Guardar" : "Criar disciplina"}
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
