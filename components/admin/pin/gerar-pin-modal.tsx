"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, RefreshCw, AlertCircle } from "lucide-react";

type GerarPinModalProps = {
  aberto: boolean;
  onFechar: () => void;
  onSucesso: () => void;
};

function gerarCodigo() {
  const ano = new Date().getFullYear();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `REIS-${ano}-${rand}`;
}

export function GerarPinModal({
  aberto,
  onFechar,
  onSucesso,
}: GerarPinModalProps) {
  const router = useRouter();
  const [codigo, setCodigo] = useState(gerarCodigo());
  const [validade, setValidade] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split("T")[0];
  });
  const [usosMaximos, setUsosMaximos] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function regenerar() {
    setCodigo(gerarCodigo());
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setLoading(true);

    const supabase = createClient();

    // Revogar PINs antigos ativos
    await supabase
      .from("pins_convite")
      .update({ ativo: false, revogado_em: new Date().toISOString() })
      .eq("ativo", true);

    // Criar novo PIN
    const { error } = await supabase.from("pins_convite").insert({
      codigo: codigo.trim().toUpperCase(),
      ativo: true,
      validade: validade || null,
      usos_maximos: usosMaximos ? parseInt(usosMaximos) : null,
      usos_atuais: 0,
    });

    if (error) {
      setErro(error.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    onSucesso();
    onFechar();
    router.refresh();
  }

  return (
    <Modal
      aberto={aberto}
      onFechar={onFechar}
      titulo="Gerar novo PIN"
      descricao="O PIN atual será revogado automaticamente."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-primary mb-2">
            Código do PIN
          </label>
          <div className="flex gap-2">
            <Input
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.toUpperCase())}
              placeholder="REIS-2026-XXXX"
              required
              disabled={loading}
            />
            <button
              type="button"
              onClick={regenerar}
              className="h-11 px-3 rounded-lg border border-border text-slate-600 hover:bg-primary-50 transition-colors shrink-0"
              title="Gerar outro código"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-primary mb-2">
            Validade
          </label>
          <Input
            type="date"
            value={validade}
            onChange={(e) => setValidade(e.target.value)}
            disabled={loading}
          />
          <p className="text-xs text-slate-500 mt-1">
            Deixe vazio para não expirar.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-primary mb-2">
            Limite de usos
          </label>
          <Input
            type="number"
            min="1"
            value={usosMaximos}
            onChange={(e) => setUsosMaximos(e.target.value)}
            placeholder="Ilimitado"
            disabled={loading}
          />
          <p className="text-xs text-slate-500 mt-1">
            Deixe vazio para usos ilimitados.
          </p>
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
                A gerar...
              </>
            ) : (
              "Gerar PIN"
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
