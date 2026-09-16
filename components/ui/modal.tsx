"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type ModalProps = {
  aberto: boolean;
  onFechar: () => void;
  titulo: string;
  descricao?: string;
  children: ReactNode;
  tamanho?: "sm" | "md" | "lg";
};

export function Modal({
  aberto,
  onFechar,
  titulo,
  descricao,
  children,
  tamanho = "md",
}: ModalProps) {
  useEffect(() => {
    if (!aberto) return;
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onFechar();
    }
    document.addEventListener("keydown", onEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onEsc);
      document.body.style.overflow = "";
    };
  }, [aberto, onFechar]);

  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-primary/40 backdrop-blur-sm"
        onClick={onFechar}
      />
      <div
        className={cn(
          "relative bg-surface rounded-xl shadow-elevated w-full max-h-[90vh] overflow-y-auto",
          {
            "max-w-sm": tamanho === "sm",
            "max-w-md": tamanho === "md",
            "max-w-2xl": tamanho === "lg",
          }
        )}
      >
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-border">
          <div>
            <h2 className="font-serif text-xl text-primary">{titulo}</h2>
            {descricao && (
              <p className="text-sm text-slate-500 mt-1">{descricao}</p>
            )}
          </div>
          <button
            onClick={onFechar}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-primary-50 hover:text-primary transition-colors shrink-0"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
