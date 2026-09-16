import Link from "next/link";
import Image from "next/image";
import { ArrowRight, LogIn } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-24 bg-gradient-to-b from-primary to-primary-700">
      <div className="max-w-2xl text-center">
        <div className="mb-8 flex justify-center">
          <div className="w-32 h-32 rounded-full bg-white flex items-center justify-center shadow-elevated overflow-hidden p-2">
            <Image
              src="/logo.jpg"
              alt="Escola Rei dos Reis"
              width={128}
              height={128}
              className="object-contain"
              priority
            />
          </div>
        </div>

        <h1 className="font-serif text-4xl md:text-5xl text-white mb-4">
          Reis Manager
        </h1>

        <p className="text-primary-100 text-lg mb-2">
          Sistema de Gestão Escolar
        </p>

        <p className="text-accent text-sm tracking-widest uppercase mb-12">
          Escola Rei dos Reis
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-accent text-white font-medium shadow-elevated hover:bg-accent-600 transition-colors"
          >
            <LogIn size={18} />
            Entrar no sistema
          </Link>

          <Link
            href="/cadastro"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-white/30 text-white font-medium hover:bg-white/10 transition-colors"
          >
            Cadastrar funcionário
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>

      <footer className="mt-24 text-primary-100 text-sm">
        Manga, Beira — Moçambique
      </footer>
    </main>
  );
}
