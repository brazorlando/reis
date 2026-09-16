import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-24 bg-gradient-to-b from-primary to-primary-700">
      <div className="max-w-2xl text-center">
        <div className="mb-8 flex justify-center">
          <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-elevated">
            <span className="font-serif text-primary text-3xl font-bold">
              RR
            </span>
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

        <div className="inline-block px-6 py-3 rounded-lg bg-accent text-white font-medium shadow-elevated">
          Em construção
        </div>
      </div>

      <footer className="mt-24 text-primary-100 text-sm">
        Manga, Beira — Moçambique
      </footer>
    </main>
  );
}
