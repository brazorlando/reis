"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Loader2, Check, AlertCircle } from "lucide-react";
import type { Classe, NivelEnsino } from "@/types/database";

type ClasseModalProps = {
  aberto: boolean;
  onFechar: () => void;
  classe: Classe | null;
  niveisAtivos: NivelEnsino[];
  onSucesso: () => void;
};

const anosPorNivel: Record<string, number[]> = {
  primaria: [1, 2, 3, 4, 5, 6],
  secundaria: [7, 8, 9],
  pre_universitaria: [10, 11, 12],
};

const nomesNivel: Record<string, string> = {
  primaria: "Primária",
  secundaria: "Secundária",
  pre_universitaria: "Pré-universitária",
};

export function ClasseModal({
  aberto,
  onFechar,
  classe,
  niveisAtivos,
  onSucesso,
}: ClasseModalProps) {
  const [nivelCodigo, setNivelCodigo] = useState("");
  const [numero, setNumero] = useState("");
  const [anoLetivo, setAnoLetivo] = useState(new Date().getFullYear().toString());
  const [capacidade, setCapacidade] = useState("50");
  const [ativo, setAtivo] = useState(true);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!aberto) return;
    setErro(null);

    if (classe) {
      setNivelCodigo(classe.nivel_codigo);
      setNumero(classe.numero.toString());
      setAnoLetivo(classe.ano_letivo.toString());
      setCapacidade(classe.capacidade_por_turma?.toString() ?? "50");
      setAtivo(classe.ativo);
    } else {
      setNivelCodigo(niveisAtivos[0]?.codigo ?? "");
      setNumero("");
      setAnoLetivo(new Date().getFullYear().toString());
      setCapacidade("50");
      setAtivo(true);
    }
  }, [aberto, classe, niveisAtivos]);

  // Anos disponíveis para o nível escolhido
  const anosDisponiveis = nivelCodigo ? anosPorNivel[nivelCodigo] ?? [] : [];

  // Se o ano atual não pertence ao nível, reset
  useEffect(() => {
    if (numero && !anosDisponiveis.includes(parseInt(numero))) {
      setNumero("");
    }
  }, [nivelCodigo, anosDisponiveis, numero]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    if (!nivelCodigo || !numero) {
      setErro("Selecione o nível e o número da classe.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const numeroInt = parseInt(numero);
    const nome = `${numeroInt}ª classe`;

    const payload = {
      numero: numeroInt,
      nome,
      nivel_codigo: nivelCodigo,
      ano_letivo: parseInt(anoLetivo),
      capacidade_por_turma: capacidade ? parseInt(capacidade) : null,
      ativo,
    };

    let error;
    if (classe) {
      ({ error } = await supabase
        .from("classes")
        .update(payload)
        .eq("id", classe.id));
    } else {
      ({ error } = await supabase.from("classes").insert(payload));
    }

    if (error) {
      setErro(
        error.message.includes("duplicate")
          ? "Já existe esta classe neste ano letivo."
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
      titulo={classe ? "Editar classe" : "Nova classe"}
      descricao={
        classe
          ? "Atualize os dados da classe"
          : "Adicione uma nova classe à escola"
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Nível */}
        <div>
          <label className="block text-sm font-medium text-primary mb-2">
            Nível de ensino *
          </label>
          <Select
            value={nivelCodigo}
            onChange={(e) => setNivelCodigo(e.target.value)}
            required
            disabled={loading}
          >
            <option value="">— Selecione —</option>
            {niveisAtivos.map((n) => (
              <option key={n.codigo} value={n.codigo}>
                {nomesNivel[n.codigo] ?? n.nome}
              </option>
            ))}
          </Select>
        </div>

        {/* Número da classe */}
        <div>
          <label className="block text-sm font-medium text-primary mb-2">
            Classe *
          </label>
          <Select
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            required
            disabled={loading || !nivelCodigo}
          >
            <option value="">— Selecione —</option>
            {anosDisponiveis.map((a) => (
              <option key={a} value={a.toString()}>
                {a}ª classe
              </option>
            ))}
          </Select>
          {!nivelCodigo && (
            <p className="text-xs text-slate-500 mt-1">
              Escolha primeiro o nível de ensino.
            </p>
          )}
        </div>

        {/* Ano letivo + capacidade */}
        <div className="grid sm:grid-cols-2 gap-4">
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
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Capacidade por turma
            </label>
            <Input
              type="number"
              min="1"
              value={capacidade}
              onChange={(e) => setCapacidade(e.target.value)}
              placeholder="Ex: 50"
              disabled={loading}
            />
            <p className="text-xs text-slate-500 mt-1">
              Usada para gerar turmas automaticamente.
            </p>
          </div>
        </div>

        {classe && (
          <label className="flex items-center gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-primary-50/40">
            <input
              type="checkbox"
              checked={ativo}
              onChange={(e) => setAtivo(e.target.checked)}
              className="w-4 h-4 accent-accent"
              disabled={loading}
            />
            <span className="text-sm text-primary">Classe ativa</span>
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
                {classe ? "Guardar" : "Criar classe"}
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
