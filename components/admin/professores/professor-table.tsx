"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Mail, Phone } from "lucide-react";
import type { Profile } from "@/types/database";

type ProfessorTableProps = {
  professores: Profile[];
  vazio?: string;
};

function badgeStatus(status: Profile["status"]) {
  switch (status) {
    case "aprovado":
      return <Badge variant="success">Aprovado</Badge>;
    case "pendente":
      return <Badge variant="warning">Pendente</Badge>;
    case "rejeitado":
      return <Badge variant="danger">Rejeitado</Badge>;
    case "suspenso":
      return <Badge variant="outline">Suspenso</Badge>;
  }
}

export function ProfessorTable({ professores, vazio }: ProfessorTableProps) {
  if (professores.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-xl p-12 text-center">
        <p className="text-slate-500">
          {vazio ?? "Nenhum professor encontrado."}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-primary-50/50 border-b border-border">
          <tr>
            <th className="text-left px-5 py-3 font-medium text-slate-600">
              Nome
            </th>
            <th className="text-left px-5 py-3 font-medium text-slate-600 hidden md:table-cell">
              Contacto
            </th>
            <th className="text-left px-5 py-3 font-medium text-slate-600">
              Estado
            </th>
            <th className="text-right px-5 py-3 font-medium text-slate-600">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {professores.map((p) => (
            <tr key={p.id} className="hover:bg-primary-50/30 transition-colors">
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center text-xs font-medium shrink-0">
                    {p.nome_completo
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-primary truncate">
                      {p.nome_completo}
                    </p>
                    <p className="text-xs text-slate-500 truncate md:hidden">
                      {p.email}
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-5 py-4 hidden md:table-cell">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-600 text-xs">
                    <Mail size={12} />
                    <span className="truncate">{p.email}</span>
                  </div>
                  {p.telefone && (
                    <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                      <Phone size={12} />
                      <span>{p.telefone}</span>
                    </div>
                  )}
                </div>
              </td>
              <td className="px-5 py-4">{badgeStatus(p.status)}</td>
              <td className="px-5 py-4 text-right">
                <Link
                  href={`/admin/professores/${p.id}`}
                  className="inline-flex items-center gap-1.5 text-sm text-accent hover:text-accent-600 font-medium"
                >
                  Ver
                  <ArrowRight size={14} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
