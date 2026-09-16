"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

type SearchBarProps = {
  valor: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
};

export function SearchBar({
  valor,
  onChange,
  placeholder = "Buscar...",
  className,
}: SearchBarProps) {
  return (
    <div className={`relative ${className ?? ""}`}>
      <Search
        size={18}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
      />
      <Input
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-11 pr-11"
      />
      {valor && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:bg-primary-50 hover:text-primary transition-colors"
          aria-label="Limpar busca"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
