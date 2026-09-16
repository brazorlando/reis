"use client";

import { useState } from "react";
import { Copy, Check, KeyRound, Calendar, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { PinConvite } from "@/types/database";

type PinCardProps = {
  pin: PinConvite;
};

export function PinCard({ pin }: PinCardProps) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    await navigator.clipboard.writeText(pin.codigo);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  const dataValidade = pin.validade
    ? new Date(pin.validade).toLocaleDateString("pt-MZ", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "Sem validade";

  const restantes =
    pin.usos_maximos !== null ? pin.usos_maximos - pin.usos_atuais : null;

  return (
    <div className="bg-surface border border-border rounded-xl shadow-card overflow-hidden">
      {/* Cabeçalho */}
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-accent-50 text-accent flex items-center justify-center">
            <KeyRound size={18} />
          </div>
          <div>
            <p className="text-sm font-medium text-primary">PIN Ativo</p>
            <p className="text-xs text-slate-500">
              Partilhe com os funcionários
            </p>
          </div>
        </div>
        <Badge variant="success">Ativo</Badge>
      </div>

      {/* PIN em destaque */}
      <div className="px-6 py-8 text-center bg-gradient-to-b from-accent-50/40 to-transparent">
        <p className="text-xs uppercase tracking-widest text-accent-700 mb-3">
          Código
        </p>
        <p className="font-serif text-4xl md:text-5xl text-primary tracking-wider select-all">
          {pin.codigo}
        </p>

        <button
          onClick={copiar}
          className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-500 transition-colors"
        >
          {copiado ? (
            <>
              <Check size={16} />
              Copiado!
            </>
          ) : (
            <>
              <Copy size={16} />
              Copiar PIN
            </>
          )}
        </button>
      </div>

      {/* Detalhes */}
      <div className="px-6 py-4 border-t border-border grid grid-cols-2 gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <Calendar size={14} />
            Validade
          </div>
          <p className="text-sm text-primary font-medium">{dataValidade}</p>
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <Users size={14} />
            Usos
          </div>
          <p className="text-sm text-primary font-medium">
            {pin.usos_atuais}
            {pin.usos_maximos !== null ? ` / ${pin.usos_maximos}` : " usos"}
            {restantes !== null && restantes > 0 && (
              <span className="text-slate-500 font-normal">
                {" "}
                ({restantes} restantes)
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
