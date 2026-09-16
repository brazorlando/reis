"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PinCard } from "@/components/admin/pin/pin-card";
import { GerarPinModal } from "@/components/admin/pin/gerar-pin-modal";
import { Loader2, Plus, KeyRound, AlertCircle } from "lucide-react";
import type { PinConvite } from "@/types/database";

export default function PinPage() {
  const [pinAtivo, setPinAtivo] = useState<PinConvite | null>(null);
  const [historico, setHistorico] = useState<PinConvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function carregar() {
    setLoading(true);
    setErro(null);
    const supabase = createClient();

    const { data: ativo, error: err1 } = await supabase
      .from("pins_convite")
      .select("*")
      .eq("ativo", true)
      .order("criado_em", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (err1) {
      setErro(err1.message);
      setLoading(false);
      return;
    }

    const { data: antigos, error: err2 } = await supabase
      .from("pins_convite")
      .select("*")
      .eq("ativo", false)
      .order("criado_em", { ascending: false })
      .limit(10);

    if (err2) {
      setErro(err2.message);
      setLoading(false);
      return;
    }

    setPinAtivo(ativo);
    setHistorico(antigos ?? []);
    setLoading(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  return (
    <>
      <Header titulo="PIN de Cadastro" subtitulo="Gestão do código de convite" />

      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          {/* Cabeçalho da página */}
          <div className="flex items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="font-serif text-2xl text-primary mb-1">
                Código de convite
              </h2>
              <p className="text-sm text-slate-500">
                Compartilhe este PIN com os funcionários que devem se cadastrar.
              </p>
            </div>
            <Button onClick={() => setModalAberto(true)}>
              <Plus size={18} />
              Gerar novo PIN
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20 text-slate-500">
              <Loader2 size={24} className="animate-spin" />
            </div>
          ) : erro ? (
            <div className="flex items-start gap-2 p-4 rounded-lg bg-danger-50 border border-danger/20 text-danger">
              <AlertCircle size={20} className="mt-0.5 shrink-0" />
              <span>{erro}</span>
            </div>
          ) : (
            <>
              {/* PIN Ativo */}
              {pinAtivo ? (
                <div className="grid lg:grid-cols-3 gap-6 mb-10">
                  <div className="lg:col-span-2">
                    <PinCard pin={pinAtivo} />
                  </div>

                  <div className="bg-surface border border-border rounded-xl p-6 shadow-card">
                    <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary flex items-center justify-center mb-4">
                      <KeyRound size={20} />
                    </div>
                    <h3 className="font-serif text-lg text-primary mb-2">
                      Como funciona?
                    </h3>
                    <ol className="text-sm text-slate-600 space-y-2 list-decimal list-inside">
                      <li>Copie o PIN acima.</li>
                      <li>Envie ao funcionário por WhatsApp ou e-mail.</li>
                      <li>
                        Ele acede a{" "}
                        <span className="font-medium text-primary">
                          reis-one.vercel.app/cadastro
                        </span>
                      </li>
                      <li>Insere o PIN e preenche o formulário.</li>
                      <li>
                        O pedido aparece em{" "}
                        <span className="font-medium text-primary">
                          Professores → Pendentes
                        </span>{" "}
                        para aprovação.
                      </li>
                    </ol>
                  </div>
                </div>
              ) : (
                <div className="bg-accent-50 border border-accent/20 rounded-xl p-8 text-center mb-10">
                  <div className="w-12 h-12 rounded-full bg-accent text-white flex items-center justify-center mx-auto mb-4">
                    <KeyRound size={22} />
                  </div>
                  <h3 className="font-serif text-xl text-primary mb-2">
                    Nenhum PIN ativo
                  </h3>
                  <p className="text-sm text-slate-600 mb-5">
                    Crie um PIN para permitir o cadastro de funcionários.
                  </p>
                  <Button onClick={() => setModalAberto(true)}>
                    <Plus size={18} />
                    Gerar primeiro PIN
                  </Button>
                </div>
              )}

              {/* Histórico */}
              {historico.length > 0 && (
                <div>
                  <h3 className="font-serif text-lg text-primary mb-4">
                    Histórico
                  </h3>
                  <div className="bg-surface border border-border rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-primary-50/50 border-b border-border">
                        <tr>
                          <th className="text-left px-5 py-3 font-medium text-slate-600">
                            Código
                          </th>
                          <th className="text-left px-5 py-3 font-medium text-slate-600">
                            Validade
                          </th>
                          <th className="text-left px-5 py-3 font-medium text-slate-600">
                            Usos
                          </th>
                          <th className="text-left px-5 py-3 font-medium text-slate-600">
                            Estado
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {historico.map((p) => (
                          <tr key={p.id}>
                            <td className="px-5 py-3 font-medium text-primary">
                              {p.codigo}
                            </td>
                            <td className="px-5 py-3 text-slate-600">
                              {p.validade
                                ? new Date(p.validade).toLocaleDateString("pt-MZ")
                                : "—"}
                            </td>
                            <td className="px-5 py-3 text-slate-600">
                              {p.usos_atuais}
                              {p.usos_maximos !== null
                                ? ` / ${p.usos_maximos}`
                                : ""}
                            </td>
                            <td className="px-5 py-3">
                              <Badge variant="outline">Revogado</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <GerarPinModal
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
        onSucesso={carregar}
      />
    </>
  );
}
