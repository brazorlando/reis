"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Loader2,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  UserCheck,
  Lock,
} from "lucide-react";

type Resultado = {
  id: string;
  nome_completo: string;
  numero_matricula: string;
  turma_nome: string | null;
  classe_nome: string | null;
};

type Passo = "buscar" | "documento";

export default function LoginAlunoPage() {
  const router = useRouter();
  const [passo, setPasso] = useState<Passo>("buscar");
  const [busca, setBusca] = useState("");
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [procurando, setProcurando] = useState(false);
  const [alunoSelecionado, setAlunoSelecionado] = useState<Resultado | null>(
    null
  );
  const [documento, setDocumento] = useState("");
  const [entrando, setEntrando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Busca live com debounce
  useEffect(() => {
    if (passo !== "buscar") return;
    if (busca.trim().length < 2) {
      setResultados([]);
      return;
    }

    setProcurando(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/aluno/buscar?q=${encodeURIComponent(busca.trim())}`
        );
        const data = await res.json();
        setResultados(data.resultados ?? []);
      } catch {
        setResultados([]);
      } finally {
        setProcurando(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [busca, passo]);

  function selecionarAluno(a: Resultado) {
    setAlunoSelecionado(a);
    setPasso("documento");
    setDocumento("");
    setErro(null);
  }

  function voltar() {
    setPasso("buscar");
    setAlunoSelecionado(null);
    setDocumento("");
    setErro(null);
  }

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    if (!alunoSelecionado) return;

    setErro(null);
    setEntrando(true);

    try {
      const res = await fetch("/api/aluno/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aluno_id: alunoSelecionado.id,
          documento: documento.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErro(data.erro ?? "Documento incorreto.");
        setEntrando(false);
        return;
      }

      router.push("/aluno");
      router.refresh();
    } catch {
      setErro("Erro de rede. Tente novamente.");
      setEntrando(false);
    }
  }

  return (
    <main className="min-h-screen grid lg:grid-cols-2">
      {/* Coluna esquerda */}
      <div className="hidden lg:flex flex-col justify-between bg-primary text-white p-12">
        <div>
          <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center mb-6 overflow-hidden p-2">
            <Image
              src="/logo.jpg"
              alt="Escola Rei dos Reis"
              width={96}
              height={96}
              className="object-contain"
              priority
            />
          </div>
          <h1 className="font-serif text-4xl mb-3">Portal do Aluno</h1>
          <p className="text-primary-100 text-lg">
            Acesse as suas notas e faltas
          </p>
        </div>
        <div>
          <p className="text-accent text-sm tracking-widest uppercase mb-2">
            Escola Rei dos Reis
          </p>
          <p className="text-primary-100 text-sm italic">
            Buscai primeiro o reino de Deus
          </p>
        </div>
      </div>

      {/* Coluna direita */}
      <div className="flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary mb-6"
          >
            <ArrowLeft size={16} />
            Voltar
          </Link>

          {/* PASSO 1: Busca */}
          {passo === "buscar" && (
            <>
              <div className="mb-8">
                <h2 className="font-serif text-3xl text-primary mb-2">
                  Procurar-me
                </h2>
                <p className="text-slate-600 text-sm">
                  Digite o seu nome completo para encontrar a sua conta.
                </p>
              </div>

              <div className="relative mb-4">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <Input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Ex: João Manuel Silva"
                  className="pl-11"
                  autoFocus
                />
                {procurando && (
                  <Loader2
                    size={16}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 animate-spin"
                  />
                )}
              </div>

              {busca.trim().length >= 2 && !procurando && (
                <div className="border border-border rounded-lg overflow-hidden bg-surface">
                  {resultados.length === 0 ? (
                    <div className="p-6 text-center">
                      <p className="text-sm text-slate-500">
                        Nenhum aluno encontrado com "{busca}".
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Verifique a escrita ou contacte a escola.
                      </p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-border">
                      {resultados.map((r) => (
                        <li key={r.id}>
                          <button
                            onClick={() => selecionarAluno(r)}
                            className="w-full text-left px-4 py-3 hover:bg-primary-50/50 transition-colors flex items-center gap-3"
                          >
                            <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center text-xs font-medium shrink-0">
                              {r.nome_completo
                                .split(" ")
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join("")
                                .toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-primary truncate">
                                {r.nome_completo}
                              </p>
                              <p className="text-xs text-slate-500">
                                {r.turma_nome ?? "Sem turma"}
                                {r.classe_nome && ` · ${r.classe_nome}`}
                              </p>
                            </div>
                            <ArrowRight
                              size={16}
                              className="text-slate-400 shrink-0"
                            />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {busca.trim().length < 2 && (
                <p className="text-xs text-slate-500 text-center py-8">
                  Digite pelo menos 2 letras para começar.
                </p>
              )}
            </>
          )}

          {/* PASSO 2: Documento */}
          {passo === "documento" && alunoSelecionado && (
            <>
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-serif text-lg shrink-0">
                    {alunoSelecionado.nome_completo
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-primary truncate">
                      {alunoSelecionado.nome_completo}
                    </p>
                    <p className="text-xs text-slate-500">
                      {alunoSelecionado.turma_nome ?? "Sem turma"}
                      {alunoSelecionado.classe_nome &&
                        ` · ${alunoSelecionado.classe_nome}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <Lock size={16} className="text-accent" />
                  <h2 className="font-serif text-2xl text-primary">
                    Confirmar identidade
                  </h2>
                </div>
                <p className="text-slate-600 text-sm">
                  Digite o número do seu BI (ou documento de identidade).
                </p>
              </div>

              <form onSubmit={entrar} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">
                    Número do documento
                  </label>
                  <Input
                    value={documento}
                    onChange={(e) => setDocumento(e.target.value)}
                    placeholder="Ex: 123456789A"
                    required
                    autoFocus
                    disabled={entrando}
                  />
                </div>

                {erro && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-danger-50 border border-danger/20 text-danger text-sm">
                    <AlertCircle size={18} className="mt-0.5 shrink-0" />
                    <span>{erro}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={entrando}
                  className="w-full"
                  size="lg"
                >
                  {entrando ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      A entrar...
                    </>
                  ) : (
                    <>
                      <UserCheck size={18} />
                      Entrar
                    </>
                  )}
                </Button>

                <button
                  type="button"
                  onClick={voltar}
                  className="w-full text-sm text-slate-500 hover:text-primary transition-colors"
                >
                  Não sou eu — procurar outro nome
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
