"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  CalendarCheck,
  BookOpen,
  Star,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "./sidebar-provider";

const items = [
  { titulo: "Dashboard", href: "/professor", icone: LayoutDashboard },
  {
    titulo: "Minha Turma",
    href: "/professor/minha-turma",
    icone: Star,
    apenasDiretor: true,
  },
  { titulo: "Minhas Turmas", href: "/professor/turmas", icone: Users },
  { titulo: "Lançar Notas", href: "/professor/notas", icone: ClipboardList },
  { titulo: "Lançar Faltas", href: "/professor/faltas", icone: CalendarCheck },
  { titulo: "Disciplinas", href: "/professor/disciplinas", icone: BookOpen },
];

export function ProfessorSidebar({ isDiretor }: { isDiretor: boolean }) {
  const pathname = usePathname();
  const sidebar = useSidebar();
  const aberta = sidebar?.aberta ?? false;

  const visiveis = items.filter(
    (i) => !i.apenasDiretor || (i.apenasDiretor && isDiretor)
  );

  return (
    <>
      {aberta && (
        <div
          className="fixed inset-0 bg-primary/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => sidebar?.fechar()}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-screen w-64 shrink-0 flex flex-col",
          "bg-primary text-white",
          "transition-transform duration-300 ease-in-out",
          "lg:sticky lg:top-0 lg:translate-x-0 lg:z-auto",
          aberta ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          onClick={() => sidebar?.fechar()}
          className="lg:hidden absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-white/70 hover:bg-white/10 transition-colors"
          aria-label="Fechar menu"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 px-6 py-6 border-b border-white/10">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center overflow-hidden p-1 shrink-0">
            <Image
              src="/logo.jpg"
              alt="Reis dos Reis"
              width={40}
              height={40}
              className="object-contain"
            />
          </div>
          <div className="leading-tight">
            <p className="font-serif text-lg">Reis Manager</p>
            <p className="text-xs text-primary-100">
              {isDiretor ? "Diretor de Turma" : "Professor"}
            </p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {visiveis.map((item) => {
            const ativo =
              pathname === item.href ||
              (item.href !== "/professor" && pathname.startsWith(item.href));
            const Icone = item.icone;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                  ativo
                    ? "bg-white/10 text-white"
                    : "text-primary-100 hover:bg-white/5 hover:text-white"
                )}
              >
                <Icone size={18} className="shrink-0" />
                <span>{item.titulo}</span>
              </Link>
            );
          })}
        </nav>

        <div className="px-6 py-4 border-t border-white/10">
          <p className="text-xs text-primary-100">Escola Rei dos Reis</p>
          <p className="text-xs text-primary-100/60 italic">
            Buscai primeiro o reino de Deus
          </p>
        </div>
      </aside>
    </>
  );
}
