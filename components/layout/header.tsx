"use client";

import { Menu, Bell } from "lucide-react";
import { UserMenu } from "./user-menu";
import { useSidebar } from "./sidebar-provider";

type HeaderProps = {
  titulo: string;
  subtitulo?: string;
};

export function Header({ titulo, subtitulo }: HeaderProps) {
  const sidebar = useSidebar();

  return (
    <header className="h-16 shrink-0 bg-surface border-b border-border flex items-center justify-between px-4 lg:px-6 gap-3 sticky top-0 z-30">
      <div className="flex items-center gap-3 min-w-0">
        {sidebar && (
          <button
            onClick={sidebar.toggle}
            className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center text-slate-600 hover:bg-primary-50 hover:text-primary transition-colors shrink-0"
            aria-label="Abrir menu"
          >
            <Menu size={20} />
          </button>
        )}

        <div className="min-w-0">
          <h1 className="font-serif text-lg lg:text-xl text-primary truncate">
            {titulo}
          </h1>
          {subtitulo && (
            <p className="text-xs text-slate-500 truncate">{subtitulo}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 lg:gap-3 shrink-0">
        <button
          className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:bg-primary-50 hover:text-primary transition-colors"
          aria-label="Notificações"
        >
          <Bell size={18} />
        </button>

        <UserMenu />
      </div>
    </header>
  );
}
