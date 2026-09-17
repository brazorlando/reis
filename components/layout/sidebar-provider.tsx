"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { usePathname } from "next/navigation";

type SidebarContextType = {
  aberta: boolean;
  abrir: () => void;
  fechar: () => void;
  toggle: () => void;
};

const SidebarContext = createContext<SidebarContextType | null>(null);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [aberta, setAberta] = useState(false);
  const pathname = usePathname();

  // Fechar sempre que muda de página
  useEffect(() => {
    setAberta(false);
  }, [pathname]);

  // Bloquear scroll do body quando sidebar aberta
  useEffect(() => {
    if (aberta) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [aberta]);

  return (
    <SidebarContext.Provider
      value={{
        aberta,
        abrir: () => setAberta(true),
        fechar: () => setAberta(false),
        toggle: () => setAberta((a) => !a),
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}
