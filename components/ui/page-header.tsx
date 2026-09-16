import type { ReactNode } from "react";

type PageHeaderProps = {
  titulo: string;
  descricao?: string;
  contador?: string;
  acao?: ReactNode;
};

export function PageHeader({
  titulo,
  descricao,
  contador,
  acao,
}: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h2 className="font-serif text-2xl text-primary mb-1">{titulo}</h2>
        {(descricao || contador) && (
          <p className="text-sm text-slate-500">
            {contador ?? descricao}
          </p>
        )}
      </div>
      {acao && <div className="shrink-0">{acao}</div>}
    </div>
  );
}
