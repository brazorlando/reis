"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Loader2, Check, AlertCircle } from "lucide-react";
import type { Cargo } from "@/types/database";

type AtribuirCargosModalProps = {
  aberto: boolean;
  onFechar: () => void;
  professorId: string;
  professorNome: string;
};

export function AtribuirCargosModal({
  aberto,
  onFechar,
  professorId,
  professorNome,
}: AtribuirCargosModalProps) {
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!aberto) return;
    setCarregando(true);
    const supabase = createClient();

    Promise.all([
      supabase
        .from("cargos")
        .select("*")
        .eq("ativo", true)
        .order("nome"),
      supabase
        .from("professor_cargos")
        .select("cargo_id")
        .eq("professor_id", professorId),
    ]).then(([cargosRes, meusRes]) => {
      setCargos((cargosRes.data as Cargo[]) ?? []);
      setSelecionados((meusRes.data ?? []).map((r) => r.cargo_id));
      setCarregando(false);
    });
  }, [aberto, professorId]);

  function toggle(id: string) {
    setSelecionados((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id]
    );
  }

  async function handleGuardar() {
    setErro(null);
    setLoading(true);

    const supabase = createClient();

    // Apagar todos e reinserir
    await supabase
      .from("professor_cargos")
      .delete()
      .eq("professor_id", professorId);

    if (selecionados.length > 0) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error } = await supabase.from("professor_cargos").insert(
        selecionados.map((cargo_id) => ({
          professor_id: professorId,
          cargo_id,
          atribuido_por: user?.id ?? null,
        }))
      );

      if (error) {
        setErro(error.message);
        setLoading(false);
        return;
      }
    }

    setLoading(false);
    onFechar();
  }

  return (
    <Modal
      aberto={aberto}
      onFechar={onFechar}
      titulo="Atribuir cargos"
      descricao={professorNome}
    >
      {carregando ? (
        <div className="flex items-center justify-center py-8 text-slate-500">
          <Loader2 size={20} className="animate-spin" />
        </div>
      ) : (
        <div className="space-y-5">
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {cargos.map((c) => (
              <label
                key={c.id}
                className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-primary-50/40 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selecionados.includes(c.id)}
                  onChange={() => toggle(c.id)}
                  className="mt-0.5 w-4 h-4 accent-accent"
                />
                <div>
                  <p className="text-sm font-medium text-primary">{c.nome}</p>
                  {c.descricao && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      {c.descricao}
                    </p>
                  )}
                </div>
              </label>
            ))}
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
            <Button onClick={handleGuardar} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  A guardar...
                </>
              ) : (
                <>
                  <Check size={16} />
                  Guardar
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
