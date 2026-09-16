"use client";

import { X, Filter } from "lucide-react";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type FiltroOpcao = {
  label: string;
  valor: string;
};

export type FiltroConfig = {
  id: string;
  label: string;
  valor: string;
  opcoes: FiltroOpcao[];
};

type FilterBarProps = {
  filtros: FiltroConfig[];
  onChange: (id: string, valor: string) => void;
  onLimpar?: () => void;
  className?: string;
};

export function FilterBar({
  filtros,
  onChange,
  onLimpar,
  className,
}: FilterBarProps) {
  const algumAtivo = filtros.some((f) => f.valor !== "");

  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Filter size={16} />
        <span className="font-medium">Filtros:</span>
      </div>

      {filtros.map((f) => (
        <div key={f.id} className="relative">
          <Select
            value={f.valor}
            onChange={(e) => onChange(f.id, e.target.value)}
            className="h-9 text-sm min-w-[160px] pr-8"
          >
            <option value="">{f.label}</option>
            {f.opcoes.map((op) => (
              <option key={op.valor} value={op.valor}>
                {op.label}
              </option>
            ))}
          </Select>
        </div>
      ))}

      {algumAtivo && onLimpar && (
        <button
          type="button"
          onClick={onLimpar}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary transition-colors"
        >
          <X size={14} />
          Limpar filtros
        </button>
      )}
    </div>
  );
}
