"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Loader2, Check, AlertCircle, Wand2 } from "lucide-react";
import type { Area, Classe, Profile, Turma } from "@/types/database";

type TurmaModalProps = {
  aberto: boolean;
  onFechar: () => void;
  turma: Turma | null;
  classes: Classe[];
  areas: Area[];
  professores: Profile[];
  turmasExistentes: Turma[];
  onSucesso: () => void;
};

export function TurmaModal({
  aberto,
  onFechar,
  turma,
  classes,
  areas,
  professores,
  turmasExistentes,
  onSucesso,
}: TurmaModalProps) {
  const [classeId, setClasseId] = useState("");
  const [areaId, setAreaId] = useState("");
  const [nome, setNome] = useState("");
  const [anoLetivo, setAnoLetivo] = useState(
    new Date().getFullYear().toString()
  );
  const [capacidade, setCapacidade] = useState("");
  const [sala, setSala] = useState("");
  const [diretorId, setDiretorId] = useState("");
  const [ativo, setAtivo] = useState(true);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!aberto) return;
    setErro(null);

    if (turma) {
      setClasseId(turma.classe_id);
      setAreaId(turma.area_id ?? "");
      setNome(turma.nome);
      setAnoLetivo(turma.ano_letivo.toString());
      setCapacidade(turma.capacidade?.toString() ?? "");
      setSala(turma.sala ?? "");
      setDiretorId(turma.diretor_turma_id ?? "");
      setAtivo(turma.ativo);
    } else {
      setClasseId(classes[0]?.id ?? "");
      setAreaId("");
      setNome("");
      setAnoLetivo(new Date().getFullYear().toString());
      setCapacidade("");
      setSala("");
      setDiretorId("");
      setAtivo(true);
    }
  }, [aberto, turma, classes]);

  // Classe selecionada + áreas dela
  const classeSelecionada = classes.find((c) => c.id === classeId);
  const areasDaClasse = useMemo(
    () => areas.filter((a) => a.classe_id === classeId),
    [areas, classeId]
  );
  const temAreas = areasDaClasse.length > 0;

  // Reset área quando muda classe
  useEffect(() => {
    if (areaId && !areasDaClasse.some((a) => a.id === areaId)) {
      setAreaId("");
    }
  }, [classeId, areasDaClasse, areaId]);

  // Capacidade herdada da classe
  useEffect(() => {
    if (!turma && classeSelecionada?.capacidade_por_turma) {
      setCapacidade(classeSelecionada.capacidade_por_turma.toString());
    }
  }, [classeSelecionada, turma]);

  // Sugerir próximo nome (A01, A02 ou 5ª A, 5ª B)
  function gerarProximoNome(): string {
    if (!classeSelecionada) return "";

    const codigoArea = areasDaClasse.find((a) => a.id === areaId)?.codigo;

    if (codigoArea) {
      // Formato: A01, A02, B01...
      const prefixo = codigoArea;
      const mesmoGrupo = turmasExistentes.filter(
        (t) =>
          t.classe_id === classeId &&
          t.area_id === areaId &&
          t.ano_letivo === parseInt(anoLetivo)
      );
      const proximo = mesmoGrupo.length + 1;
      return `${prefixo}${proximo.toString().padStart(2, "0")}`;
    } else {
      // Formato: 5ª A, 5ª B...
      const numeroClasse = classeSelecionada.numero;
      const mesmoGrupo = turmasExistentes.filter(
        (t) =>
          t.classe_id === classeId &&
          !t.area_id &&
          t.ano_letivo === parseInt(anoLetivo)
      );
      const letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      const proximaLetra = letras[mesmoGrupo.length] ?? "?";
      return `${numeroClasse}ª ${proximaLetra}`;
    }
  }

  function aplicarSugestao() {
    const sugestao = gerarProximoNome();
    if (sugestao) setNome(sugestao);
  }

  // Verificar se precisa de área
  const classePrecisaArea =
    classeSelecionada?.nivel_codigo === "pre_universitaria";
  const areaObrigatoria = classePrecisaArea && temAreas;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    if (!classeId || !nome.trim()) {
      setErro("Selecione a classe e indique o nome da turma.");
      return;
    }

    if (areaObrigatoria && !areaId) {
      setErro("Esta classe requer uma área. Selecione a área.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const payload = {
      nome: nome.trim(),
      classe_id: classeId,
      area_id: areaId || null,
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
          ? "Já existe uma turma com este nome nesta classe."
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
        turma
          ? "Atualize os dados da turma"
          : "Crie uma turma a partir de uma classe"
      }
      tamanho="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Classe + Área */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Classe *
            </label>
            <Select
              value={classeId}
              onChange={(e) => setClasseId(e.target.value)}
              required
              disabled={loading}
            >
              <option value="">— Selecione —</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome} ({c.ano_letivo})
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Área {areaObrigatoria && "*"}
            </label>
            <Select
              value={areaId}
              onChange={(e) => setAreaId(e.target.value)}
              disabled={loading || !temAreas}
              required={areaObrigatoria}
            >
              <option value="">
                {!temAreas
                  ? "— Sem áreas nesta classe —"
                  : "— Selecione a área —"}
              </option>
              {areasDaClasse.map((a) => (
                <option key={a.id} value={a.id}>
                  Área {a.codigo}
                  {a.nome ? ` — ${a.nome}` : ""}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {/* Nome com sugestão */}
        <div>
          <label className="block text-sm font-medium text-primary mb-2">
            Nome da turma *
          </label>
          <div className="flex gap-2">
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: A01, 5ª A"
              required
              disabled={loading}
            />
            <button
              type="button"
              onClick={aplicarSugestao}
              disabled={loading || !classeId}
              className="h-11 px-3 rounded-lg border border-border text-slate-600 hover:bg-primary-50 transition-colors shrink-0 flex items-center gap-1.5 text-sm"
              title="Sugerir próximo nome"
            >
              <Wand2 size={16} />
              Sugerir
            </button>
          </div>
          {classeId && (
            <p className="text-xs text-slate-500 mt-1">
              Sugestão automática: <strong>{gerarProximoNome() || "—"}</strong>
            </p>
          )}
        </div>

        {/* Ano + Capacidade */}
        <div className="grid sm:grid-cols-2 gap-4">
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
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Capacidade
            </label>
            <Input
              type="number"
              min="1"
              value={capacidade}
              onChange={(e) => setCapacidade(e.target.value)}
              placeholder="Ex: 50"
              disabled={loading}
            />
          </div>
        </div>

        {/* Sala */}
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

        {/* Diretor de turma */}
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
                {turma ? "Guardar" : "Criar turma"}
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
