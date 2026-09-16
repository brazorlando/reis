import { UserMenu } from "./user-menu";
import { Bell } from "lucide-react";

type HeaderProps = {
  titulo: string;
  subtitulo?: string;
};

export function Header({ titulo, subtitulo }: HeaderProps) {
  return (
    <header className="h-16 shrink-0 bg-surface border-b border-border flex items-center justify-between px-6">
      <div>
        <h1 className="font-serif text-xl text-primary">{titulo}</h1>
        {subtitulo && (
          <p className="text-xs text-slate-500">{subtitulo}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
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
