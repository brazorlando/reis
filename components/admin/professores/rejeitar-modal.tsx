"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Loader2, X, AlertCircle } from "lucide-react";

type RejeitarModalProps = {
  aberto: boolean;
  onFechar: () => void;
  professorId: string;
  professorNome: string;
};

export function RejeitarModal({
  aberto,
  onFechar,
  professorId,
  professorNome,
}: RejeitarModalProps) {
  const router = useRouter();
  const [motivo, setMotivo] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleRejeitar() {
    if (!motivo.trim()) {
      setErro("Por favor, indique o motivo da rejeição.");
      return;
    }

    setErro(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        status: "rejeitado",
        motivo_rejeicao: motivo.trim(),
      })
      .eq("id", professorId);

    if (error) {
      setErro(error.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    setMotivo("");
    onFechar();
    router.refresh();
  }

  return (
    <Modal
      aberto={aberto}
      onFechar={onFechar}
      titulo="Rejeitar cadastro"
      descricao={`Rejeitar o pedido de ${professorNome}`}
    >
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-primary mb-2">
            Motivo da rejeição
          </label>
          <textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            rows={4}
            placeholder="Ex: Documentação incompleta, formação insuficiente..."
            className="w-full px-4 py-3 rounded-lg border border-border bg-surface text-primary placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-none"
            disabled={loading}
          />
          <p className="text-xs text-slate-500 mt-1">
            Este motivo será mostrado ao candidato.
          </p>
        </div>

        {erro && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-danger-50 border border-danger/20 text-danger text-sm">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{erro}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={onFechar} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleRejeitar} disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                A rejeitar...
              </>
            ) : (
              <>
                <X size={16} />
                Rejeitar
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
