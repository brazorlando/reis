"use client";

import { SearchBar } from "./search-bar";
import { FilterBar, type FiltroConfig } from "./filter-bar";

type FiltersProps = {
  busca: string;
  onBuscaChange: (v: string) => void;
  buscaPlaceholder?: string;
  filtros: FiltroConfig[];
  onFiltroChange: (id: string, valor: string) => void;
  onLimpar?: () => void;
  className?: string;
};

export function Filters({
  busca,
  onBuscaChange,
  buscaPlaceholder,
  filtros,
  onFiltroChange,
  onLimpar,
  className,
}: FiltersProps) {
  return (
    <div className={`space-y-3 ${className ?? ""}`}>
      <SearchBar
        valor={busca}
        onChange={onBuscaChange}
        placeholder={buscaPlaceholder ?? "Buscar..."}
      />
      {filtros.length > 0 && (
        <FilterBar
          filtros={filtros}
          onChange={onFiltroChange}
          onLimpar={onLimpar}
        />
      )}
    </div>
  );
}
