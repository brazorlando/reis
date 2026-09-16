"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import {
  Plus,
  BookOpen,
  Loader2,
  Pencil,
  AlertCircle,
  Check,
} from "lucide-react";
import type { Disciplina } from "@/types/database";

export default function DisciplinasPage() {
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Disciplina | null>(null);

  async function carregar() {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("disciplinas")
      .select("*")
      .order("nome");

    if (error) setErro(error.message);
    else setDisciplinas(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  function abrirNova() {
    setEditando(null);
    setModalAberto(true);
  }

  function abrirEditar(d: Disciplina) {
    setEditando(d);
    setModalAberto(true);
  }

  return (
    <>
      <Header
        titulo="Disciplinas"
        subtitulo="Gestão das disciplinas da escola"
      />

      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="font-serif text-2xl text-primary mb-1">
                Disciplinas
              </h2>
              <p className="text-sm text-slate-500">
                {disciplinas.length} disciplina
                {disciplinas.length !== 1 ? "s" : ""} registada
                {disciplinas.length !== 1 ? "s" : ""}
              </p>
            </div>
            <Button onClick={abrirNova}>
              <Plus size={18} />
              Nova disciplina
            </Button>
          </div>

          {erro && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-danger-50 border border-danger/20 text-danger text-sm mb-6">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <span>{erro}</span>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-20 text-slate-500">
              <Loader2 size={24} className="animate-spin" />
            </div>
          ) : disciplinas.length === 0 ? (
            <EmptyState
              icone={<BookOpen size={24} />}
              titulo="Sem disciplinas"
              descricao="Comece por criar as disciplinas que a escola oferece."
              acao={
                <Button onClick={abrirNova}>
                  <Plus size={18} />
                  Criar primeira disciplina
                </Button>
              }
            />
          ) : (
            <div className="bg-surface border border-border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-primary-50/50 border-b border-border">
                  <tr>
                    <th className="text-left px-5 py-3 font-medium text-slate-600">
                      Disciplina
                    </th>
                    <th className="text-left px-5 py-3 font-medium text-slate-600 hidden md:table-cell">
                      Código
                    </th>
                    <th className="text-left px-5 py-3 font-medium text-slate-600 hidden md:table-cell">
                      Carga
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
                  {disciplinas.map((d) => (
                    <tr
                      key={d.id}
                      className="hover:bg-primary-50/30 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-medium shrink-0"
                            style={{ backgroundColor: d.cor }}
                          >
                            {d.codigo?.slice(0, 2) ??
                              d.nome.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="font-medium text-primary">
                            {d.nome}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-600 hidden md:table-cell">
                        {d.codigo ?? "—"}
                      </td>
                      <td className="px-5 py-4 text-slate-600 hidden md:table-cell">
                        {d.carga_horaria ? `${d.carga_horaria}h/sem` : "—"}
                      </td>
                      <td className="px-5 py-4">
                        {d.ativo ? (
                          <Badge variant="success">Ativa</Badge>
                        ) : (
                          <Badge variant="outline">Inativa</Badge>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => abrirEditar(d)}
                          className="inline-flex items-center gap-1.5 text-sm text-accent hover:text-accent-600 font-medium"
                        >
                          <Pencil size={14} />
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <DisciplinaModal
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
        disciplina={editando}
        onSucesso={carregar}
      />
    </>
  );
}

// ============== Modal ==============

function DisciplinaModal({
  aberto,
  onFechar,
  disciplina,
  onSucesso,
}: {
  aberto: boolean;
  onFechar: () => void;
  disciplina: Disciplina | null;
  onSucesso: () => void;
}) {
  const [nome, setNome] = useState("");
  const [codigo, setCodigo] = useState("");
  const [carga, setCarga] = useState("");
  const [cor, setCor] = useState("#0D1B3E");
  const [ativo, setAtivo] = useState(true);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (aberto) {
      setNome(disciplina?.nome ?? "");
      setCodigo(disciplina?.codigo ?? "");
      setCarga(disciplina?.carga_horaria?.toString() ?? "");
      setCor(disciplina?.cor ?? "#0D1B3E");
      setAtivo(disciplina?.ativo ?? true);
      setErro(null);
    }
  }, [aberto, disciplina]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setLoading(true);

    const supabase = createClient();
    const payload = {
      nome: nome.trim(),
      codigo: codigo.trim() || null,
      carga_horaria: carga ? parseInt(carga) : null,
      cor,
      ativo,
    };

    let error;
    if (disciplina) {
      ({ error } = await supabase
        .from("disciplinas")
        .update(payload)
        .eq("id", disciplina.id));
    } else {
      ({ error } = await supabase.from("disciplinas").insert(payload));
    }

    if (error) {
      setErro(
        error.message.includes("duplicate")
          ? "Já existe uma disciplina com este nome."
          : error.message
      );
      setLoading(false);
      return;
    }

    setLoading(false);
    onFechar();
    onSucesso();
  }

  return (
    <Modal
      aberto={aberto}
      onFechar={onFechar}
      titulo={disciplina ? "Editar disciplina" : "Nova disciplina"}
      descricao={
        disciplina
          ? "Atualize os dados da disciplina"
          : "Adicione uma nova disciplina"
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-primary mb-2">
            Nome *
          </label>
          <Input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex: Matemática"
            required
            disabled={loading}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Código
            </label>
            <Input
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.toUpperCase())}
              placeholder="MAT"
              maxLength={5}
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Carga (h/semana)
            </label>
            <Input
              type="number"
              min="1"
              max="40"
              value={carga}
              onChange={(e) => setCarga(e.target.value)}
              placeholder="6"
              disabled={loading}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-primary mb-2">
            Cor
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={cor}
              onChange={(e) => setCor(e.target.value)}
              className="w-12 h-11 rounded-lg border border-border cursor-pointer"
              disabled={loading}
            />
            <Input
              value={cor}
              onChange={(e) => setCor(e.target.value)}
              placeholder="#0D1B3E"
              disabled={loading}
            />
          </div>
        </div>

        {disciplina && (
          <label className="flex items-center gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-primary-50/40">
            <input
              type="checkbox"
              checked={ativo}
              onChange={(e) => setAtivo(e.target.checked)}
              className="w-4 h-4 accent-accent"
              disabled={loading}
            />
            <span className="text-sm text-primary">
              Disciplina ativa
            </span>
          </label>
        )}

        {erro && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-danger-50 border border-danger/20 text-danger text-sm">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{erro}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onFechar}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                A guardar...
              </>
            ) : (
              <>
                <Check size={16} />
                {disciplina ? "Guardar" : "Criar"}
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
