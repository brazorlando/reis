import type { ReactNode } from "react";

type EmptyStateProps = {
  titulo: string;
  descricao?: string;
  acao?: ReactNode;
  icone?: ReactNode;
};

export function EmptyState({
  titulo,
  descricao,
  acao,
  icone,
}: EmptyStateProps) {
  return (
    <div className="bg-surface border border-border rounded-xl p-12 text-center">
      {icone && (
        <div className="w-14 h-14 rounded-full bg-primary-50 text-primary flex items-center justify-center mx-auto mb-4">
          {icone}
        </div>
      )}
      <h3 className="font-serif text-lg text-primary mb-1">{titulo}</h3>
      {descricao && (
        <p className="text-sm text-slate-500 mb-5 max-w-md mx-auto">
          {descricao}
        </p>
      )}
      {acao && <div className="flex justify-center">{acao}</div>}
    </div>
  );
}
