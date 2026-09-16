"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, LogIn, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErro(
        error.message === "Invalid login credentials"
          ? "E-mail ou senha incorretos."
          : error.message
      );
      setLoading(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <main className="min-h-screen grid lg:grid-cols-2">
      {/* Coluna esquerda — institucional */}
      <div className="hidden lg:flex flex-col justify-between bg-primary text-white p-12">
        <div>
          <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-6">
            <span className="font-serif text-primary text-2xl font-bold">RR</span>
          </div>
          <h1 className="font-serif text-4xl mb-3">Reis Manager</h1>
          <p className="text-primary-100 text-lg">
            Sistema de Gestão Escolar
          </p>
        </div>
        <div>
          <p className="text-accent text-sm tracking-widest uppercase mb-2">
            Escola Rei dos Reis
          </p>
          <p className="text-primary-100 text-sm">
            Buscai primeiro o reino de Deus
          </p>
        </div>
      </div>

      {/* Coluna direita — formulário */}
      <div className="flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="font-serif text-3xl text-primary mb-2">
              Bem-vindo de volta
            </h2>
            <p className="text-slate-600">
              Entre com as suas credenciais para acessar o sistema.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                E-mail
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@reisdosreis.co.mz"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                Senha
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>

            {erro && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-danger-50 border border-danger/20 text-danger text-sm">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <span>{erro}</span>
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Entrando...
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  Entrar
                </>
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            Problemas para acessar? Contacte a secretaria da escola.
          </p>
        </div>
      </div>
    </main>
  );
}
