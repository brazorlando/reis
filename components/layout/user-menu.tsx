"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { User, LogOut, ChevronDown } from "lucide-react";

type UserMenuProps = {
  nome?: string;
  email?: string;
};

export function UserMenu({ nome = "Diretor", email = "" }: UserMenuProps) {
  const [aberto, setAberto] = useState(false);
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setAberto(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const iniciais = nome
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setAberto(!aberto)}
        className="flex items-center gap-2 rounded-lg pl-1 pr-2 py-1 hover:bg-primary-50 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-medium">
          {iniciais || "DR"}
        </div>
        <ChevronDown size={16} className="text-slate-500" />
      </button>

      {aberto && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-lg bg-surface border border-border shadow-elevated py-1 z-50">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-medium text-primary truncate">
              {nome}
            </p>
            {email && (
              <p className="text-xs text-slate-500 truncate">{email}</p>
            )}
          </div>

          <button
            onClick={() => {
              router.push("/admin/perfil");
              setAberto(false);
            }}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-primary-50 transition-colors"
          >
            <User size={16} />
            Meu perfil
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-danger hover:bg-danger-50 transition-colors"
          >
            <LogOut size={16} />
            Terminar sessão
          </button>
        </div>
      )}
    </div>
  );
}
