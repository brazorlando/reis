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
  Shield,
  Loader2,
  Pencil,
  AlertCircle,
  Check,
  Users,
} from "lucide-react";
import type { Cargo, Profile } from "@/types/database";

type CargoComUso = Cargo & { quantidade: number };

export default function CargosPage() {
  const [cargos, setCargos] = useState<CargoComUso[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Cargo | null>(null);
  const [detalhesAberto, setDetalhesAberto] = useState<Cargo | null>(null);

  async function carregar() {
    setLoading(true);
    const supabase = createClient();

    const { data: cargosData, error } = await supabase
      .from("cargos")
      .select("*")
      .order("is_sistema", { ascending: false })
      .order("nome");

    if (error) {
      setErro(error.message);
      setLoading(false);
      return;
    }

    // Buscar contagem de uso por cargo
    const { data: atribuicoes } = await supabase
      .from("professor_cargos")
      .select("cargo_id");

    const contagens: Record<string, number> = {};
    (atribuicoes ?? []).forEach((a) => {
      contagens[a.cargo_id] = (contagens[a.cargo_id] ?? 0) + 1;
    });

    setCargos(
      (cargosData ?? []).map((c) => ({
        ...c,
        quantidade: contagens[c.id] ?? 0,
      }))
    );
    setLoading(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  function abrirNovo() {
    setEditando(null);
    setModalAberto(true);
  }

  function abrirEditar(c: Cargo) {
    if (c.is_sistema) return;
    setEditando(c);
    setModalAberto(true);
  }

  return (
    <>
      <Header titulo="Cargos" subtitulo="Funções atribuíveis aos funcionários" />

      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="font-serif text-2xl text-primary mb-1">
                Cargos
              </h2>
              <p className="text-sm text-slate-500">
                {cargos.length} cargo{cargos.length !== 1 ? "s" : ""}{" "}
                registado{cargos.length !== 1 ? "s" : ""}
              </p>
            </div>
            <Button onClick={abrirNovo}>
              <Plus size={18} />
              Novo cargo
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
          ) : cargos.length === 0 ? (
            <EmptyState
              icone={<Shield size={24} />}
              titulo="Sem cargos"
              descricao="Crie cargos para atribuir aos funcionários."
              acao={
                <Button onClick={abrirNovo}>
                  <Plus size={18} />
                  Criar primeiro cargo
                </Button>
              }
            />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {cargos.map((c) => (
                <div
                  key={c.id}
                  className="bg-surface border border-border rounded-xl p-5 shadow-card flex flex-col"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-11 h-11 rounded-lg bg-primary-50 text-primary flex items-center justify-center">
                      <Shield size={20} />
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {c.is_sistema && (
                        <Badge variant="info">Sistema</Badge>
                      )}
                      {!c.ativo && <Badge variant="outline">Inativo</Badge>}
                    </div>
                  </div>

                  <h3 className="font-serif text-lg text-primary mb-1">
                    {c.nome}
                  </h3>
                  {c.descricao && (
                    <p className="text-sm text-slate-500 mb-4 line-clamp-2">
                      {c.descricao}
                    </p>
                  )}

                  <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
                    <button
                      onClick={() => setDetalhesAberto(c)}
                      className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-primary"
                    >
                      <Users size={14} />
                      {c.quantidade} funcionário{c.quantidade !== 1 ? "s" : ""}
                    </button>

                    {!c.is_sistema && (
                      <button
                        onClick={() => abrirEditar(c)}
                        className="inline-flex items-center gap-1.5 text-sm text-accent hover:text-accent-600 font-medium"
                      >
                        <Pencil size={14} />
                        Editar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <CargoModal
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
        cargo={editando}
        onSucesso={carregar}
      />

      <DetalhesCargoModal
        cargo={detalhesAberto}
        onFechar={() => setDetalhesAberto(null)}
      />
    </>
  );
}

// ============== Modal: Criar/Editar Cargo ==============

function CargoModal({
  aberto,
  onFechar,
  cargo,
  onSucesso,
}: {
  aberto: boolean;
  onFechar: () => void;
  cargo: Cargo | null;
  onSucesso: () => void;
}) {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [ativo, setAtivo] = useState(true);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (aberto) {
      setNome(cargo?.nome ?? "");
      setDescricao(cargo?.descricao ?? "");
      setAtivo(cargo?.ativo ?? true);
      setErro(null);
    }
  }, [aberto, cargo]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setLoading(true);

    const supabase = createClient();
    const payload = {
      nome: nome.trim(),
      descricao: descricao.trim() || null,
      ativo,
      is_sistema: false,
    };

    let error;
    if (cargo) {
      ({ error } = await supabase
        .from("cargos")
        .update({ nome: payload.nome, descricao: payload.descricao, ativo: payload.ativo })
        .eq("id", cargo.id));
    } else {
      ({ error } = await supabase.from("cargos").insert(payload));
    }

    if (error) {
      setErro(
        error.message.includes("duplicate")
          ? "Já existe um cargo com este nome."
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
      titulo={cargo ? "Editar cargo" : "Novo cargo"}
      descricao={
        cargo
          ? "Atualize os dados do cargo"
          : "Adicione uma nova função atribuível"
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
            placeholder="Ex: Coordenador de Matemática"
            required
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-primary mb-2">
            Descrição
          </label>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={3}
            placeholder="Breve descrição das responsabilidades"
            className="w-full px-4 py-3 rounded-lg border border-border bg-surface text-primary placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-none"
            disabled={loading}
          />
        </div>

        {cargo && (
          <label className="flex items-center gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-primary-50/40">
            <input
              type="checkbox"
              checked={ativo}
              onChange={(e) => setAtivo(e.target.checked)}
              className="w-4 h-4 accent-accent"
              disabled={loading}
            />
            <span className="text-sm text-primary">Cargo ativo</span>
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
                {cargo ? "Guardar" : "Criar"}
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ============== Modal: Detalhes do Cargo ==============

function DetalhesCargoModal({
  cargo,
  onFechar,
}: {
  cargo: Cargo | null;
  onFechar: () => void;
}) {
  const [professores, setProfessores] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!cargo) return;
    setLoading(true);
    const supabase = createClient();
    supabase
      .from("professor_cargos")
      .select("professor_id, profiles:professor_id(*)")
      .eq("cargo_id", cargo.id)
      .then(({ data }) => {
        setProfessores(
          (data ?? [])
            .map((row) => row.profiles as unknown as Profile)
            .filter(Boolean)
        );
        setLoading(false);
      });
  }, [cargo]);

  if (!cargo) return null;

  return (
    <Modal
      aberto={!!cargo}
      onFechar={onFechar}
      titulo={cargo.nome}
      descricao={`Funcionários com este cargo (${professores.length})`}
    >
      {loading ? (
        <div className="flex items-center justify-center py-8 text-slate-500">
          <Loader2 size={20} className="animate-spin" />
        </div>
      ) : professores.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-6">
          Nenhum funcionário com este cargo ainda.
        </p>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {professores.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-border"
            >
              <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center text-xs font-medium shrink-0">
                {p.nome_completo
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-primary truncate">
                  {p.nome_completo}
                </p>
                <p className="text-xs text-slate-500 truncate">{p.email}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
