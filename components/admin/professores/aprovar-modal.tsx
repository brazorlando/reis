"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Loader2, Check, AlertCircle } from "lucide-react";
import type { Cargo } from "@/types/database";

type AprovarModalProps = {
  aberto: boolean;
  onFechar: () => void;
  professorId: string;
  professorNome: string;
};

export function AprovarModal({
  aberto,
  onFechar,
  professorId,
  professorNome,
}: AprovarModalProps) {
  const router = useRouter();
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [selecionados, setSelecionados] = useState<string[]>(["Professor"]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!aberto) return;
    const supabase = createClient();
    supabase
      .from("cargos")
      .select("*")
      .eq("ativo", true)
      .order("nome")
      .then(({ data }) => setCargos((data as Cargo[]) ?? []));
  }, [aberto]);

  function toggle(id: string) {
    setSelecionados((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id]
    );
  }

  async function handleAprovar() {
    setErro(null);
    setLoading(true);

    const supabase = createClient();

    // 1. Atualizar perfil
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error: err1 } = await supabase
      .from("profiles")
      .update({
        status: "aprovado",
        aprovado_por: user?.id ?? null,
        aprovado_em: new Date().toISOString(),
        motivo_rejeicao: null,
      })
      .eq("id", professorId);

    if (err1) {
      setErro(err1.message);
      setLoading(false);
      return;
    }

    // 2. Atribuir cargos
    const cargoIds = cargos
      .filter((c) => selecionados.includes(c.nome))
      .map((c) => c.id);

    if (cargoIds.length > 0) {
      // Remove antigos (caso já existam)
      await supabase
        .from("professor_cargos")
        .delete()
        .eq("professor_id", professorId);

      await supabase.from("professor_cargos").insert(
        cargoIds.map((cargo_id) => ({
          professor_id: professorId,
          cargo_id,
          atribuido_por: user?.id ?? null,
        }))
      );
    }

    setLoading(false);
    onFechar();
    router.refresh();
  }

  return (
    <Modal
      aberto={aberto}
      onFechar={onFechar}
      titulo="Aprovar cadastro"
      descricao={`Confirmar aprovação de ${professorNome}`}
    >
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-primary mb-3">
            Atribuir cargos
          </label>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {cargos.length === 0 && (
              <p className="text-sm text-slate-500">
                A carregar cargos...
              </p>
            )}
            {cargos.map((c) => (
              <label
                key={c.id}
                className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-primary-50/40 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selecionados.includes(c.nome)}
                  onChange={() => toggle(c.nome)}
                  className="mt-0.5 w-4 h-4 accent-accent"
                />
                <div>
                  <p className="text-sm font-medium text-primary">
                    {c.nome}
                  </p>
                  {c.descricao && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      {c.descricao}
                    </p>
                  )}
                </div>
              </label>
            ))}
          </div>
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
          <Button onClick={handleAprovar} disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                A aprovar...
              </>
            ) : (
              <>
                <Check size={16} />
                Aprovar
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
