"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import {
  Plus,
  School,
  Loader2,
  Pencil,
  AlertCircle,
  Check,
  Users,
} from "lucide-react";
import type { Turma, Profile } from "@/types/database";

export default function TurmasPage() {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [professores, setProfessores] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Turma | null>(null);

  async function carregar() {
    setLoading(true);
    const supabase = createClient();

    const [turmasRes, profsRes] = await Promise.all([
      supabase
        .from("turmas")
        .select("*")
        .order("ano_letivo", { ascending: false })
        .order("nome"),
      supabase
        .from("profiles")
        .select("*")
        .eq("status", "aprovado")
        .neq("role", "admin")
        .order("nome_completo"),
    ]);

    if (turmasRes.error) setErro(turmasRes.error.message);
    else setTurmas(turmasRes.data ?? []);

    if (!profsRes.error) setProfessores(profsRes.data ?? []);

    setLoading(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  function nomeProfessor(id: string | null) {
    if (!id) return "—";
    return (
      professores.find((p) => p.id === id)?.nome_completo ?? "Desconhecido"
    );
  }

  const anoAtual = new Date().getFullYear();

  return (
    <>
      <Header titulo="Turmas" subtitulo="Gestão das turmas da escola" />

      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="font-serif text-2xl text-primary mb-1">
                Turmas
              </h2>
              <p className="text-sm text-slate-500">
                {turmas.length} turma{turmas.length !== 1 ? "s" : ""} registada
                {turmas.length !== 1 ? "s" : ""}
              </p>
            </div>
            <Button
              onClick={() => {
                setEditando(null);
                setModalAberto(true);
              }}
            >
              <Plus size={18} />
              Nova turma
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
          ) : turmas.length === 0 ? (
            <EmptyState
              icone={<School size={24} />}
              titulo="Sem turmas"
              descricao="Crie a primeira turma da escola para começar."
              acao={
                <Button
                  onClick={() => {
                    setEditando(null);
                    setModalAberto(true);
                  }}
                >
                  <Plus size={18} />
                  Criar primeira turma
                </Button>
              }
            />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {turmas.map((t) => (
                <div
                  key={t.id}
                  className="bg-surface border border-border rounded-xl p-5 shadow-card"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-11 h-11 rounded-lg bg-primary-50 text-primary flex items-center justify-center">
                      <School size={20} />
                    </div>
                    {t.ativo ? (
                      <Badge variant="success">Ativa</Badge>
                    ) : (
                      <Badge variant="outline">Inativa</Badge>
                    )}
                  </div>

                  <h3 className="font-serif text-xl text-primary mb-1">
                    {t.nome}
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">
                    Ano letivo {t.ano_letivo}
                  </p>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Diretor de turma</span>
                      <span className="text-primary font-medium truncate ml-2 max-w-[60%] text-right">
                        {nomeProfessor(t.diretor_turma_id)}
                      </span>
                    </div>
                    {t.sala && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Sala</span>
                        <span className="text-primary">{t.sala}</span>
                      </div>
                    )}
                    {t.capacidade && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Capacidade</span>
                        <span className="text-primary flex items-center gap-1">
                          <Users size={14} />
                          {t.capacidade}
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setEditando(t);
                      setModalAberto(true);
                    }}
                    className="mt-4 inline-flex items-center gap-1.5 text-sm text-accent hover:text-accent-600 font-medium"
                  >
                    <Pencil size={14} />
                    Editar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <TurmaModal
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
        turma={editando}
        professores={professores}
        anoAtual={anoAtual}
        onSucesso={carregar}
      />
    </>
  );
}

// ============== Modal ==============

function TurmaModal({
  aberto,
  onFechar,
  turma,
  professores,
  anoAtual,
  onSucesso,
}: {
  aberto: boolean;
  onFechar: () => void;
  turma: Turma | null;
  professores: Profile[];
  anoAtual: number;
  onSucesso: () => void;
}) {
  const [nome, setNome] = useState("");
  const [anoLetivo, setAnoLetivo] = useState(anoAtual.toString());
  const [capacidade, setCapacidade] = useState("");
  const [sala, setSala] = useState("");
  const [diretorId, setDiretorId] = useState("");
  const [ativo, setAtivo] = useState(true);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (aberto) {
      setNome(turma?.nome ?? "");
      setAnoLetivo((turma?.ano_letivo ?? anoAtual).toString());
      setCapacidade(turma?.capacidade?.toString() ?? "");
      setSala(turma?.sala ?? "");
      setDiretorId(turma?.diretor_turma_id ?? "");
      setAtivo(turma?.ativo ?? true);
      setErro(null);
    }
  }, [aberto, turma, anoAtual]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setLoading(true);

    const supabase = createClient();
    const payload = {
      nome: nome.trim(),
      ano_letivo: parseInt(anoLetivo),
      capacidade: capacidade ? parseInt(capacidade) : null,
      sala: sala.trim() || null,
      diretor_turma_id: diretorId || null,
      ativo,
    };

    let error;
    if (turma) {
      ({ error } = await supabase
        .from("turmas")
        .update(payload)
        .eq("id", turma.id));
    } else {
      ({ error } = await supabase.from("turmas").insert(payload));
    }

    if (error) {
      setErro(
        error.message.includes("duplicate")
          ? "Já existe uma turma com este nome neste ano letivo."
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
      titulo={turma ? "Editar turma" : "Nova turma"}
      descricao={
        turma ? "Atualize os dados da turma" : "Adicione uma nova turma"
      }
      tamanho="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Nome da turma *
            </label>
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: 10ª A"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Ano letivo *
            </label>
            <Input
              type="number"
              value={anoLetivo}
              onChange={(e) => setAnoLetivo(e.target.value)}
              required
              disabled={loading}
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Sala
            </label>
            <Input
              value={sala}
              onChange={(e) => setSala(e.target.value)}
              placeholder="Ex: Sala 5"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Capacidade
            </label>
            <Input
              type="number"
              min="1"
              value={capacidade}
              onChange={(e) => setCapacidade(e.target.value)}
              placeholder="Ex: 40"
              disabled={loading}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-primary mb-2">
            Diretor de turma
          </label>
          <Select
            value={diretorId}
            onChange={(e) => setDiretorId(e.target.value)}
            disabled={loading}
          >
            <option value="">— Não atribuído —</option>
            {professores.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome_completo}
              </option>
            ))}
          </Select>
          {professores.length === 0 && (
            <p className="text-xs text-slate-500 mt-1">
              Ainda não há professores aprovados.
            </p>
          )}
        </div>

        {turma && (
          <label className="flex items-center gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-primary-50/40">
            <input
              type="checkbox"
              checked={ativo}
              onChange={(e) => setAtivo(e.target.checked)}
              className="w-4 h-4 accent-accent"
              disabled={loading}
            />
            <span className="text-sm text-primary">Turma ativa</span>
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
                {turma ? "Guardar" : "Criar"}
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
