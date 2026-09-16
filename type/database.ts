export type Profile = {
  id: string;
  nome_completo: string;
  email: string;
  telefone: string | null;
  bi_documento: string | null;
  data_nascimento: string | null;
  formacao: string | null;
  anos_experiencia: number | null;
  foto_url: string | null;
  cv_url: string | null;
  diploma_url: string | null;
  status: "pendente" | "aprovado" | "rejeitado" | "suspenso";
  motivo_rejeicao: string | null;
  aprovado_por: string | null;
  aprovado_em: string | null;
  role: "admin" | "funcionario" | "aluno" | "encarregado";
  criado_em: string;
  atualizado_em: string;
};

export type Cargo = {
  id: string;
  nome: string;
  descricao: string | null;
  permissoes: Record<string, boolean>;
  is_sistema: boolean;
  ativo: boolean;
  criado_em: string;
};

export type PinConvite = {
  id: string;
  codigo: string;
  ativo: boolean;
  validade: string | null;
  usos_maximos: number | null;
  usos_atuais: number;
  criado_por: string | null;
  criado_em: string;
  revogado_em: string | null;
};

export type Disciplina = {
  id: string;
  nome: string;
  codigo: string | null;
  carga_horaria: number | null;
  cor: string;
  ativo: boolean;
  criado_em: string;
};

export type Turma = {
  id: string;
  nome: string;
  ano_letivo: number;
  capacidade: number | null;
  sala: string | null;
  diretor_turma_id: string | null;
  ativo: boolean;
  criado_em: string;
};

export type PerguntaCadastro = {
  id: string;
  ordem: number;
  tipo: "texto" | "textarea" | "select" | "checkbox" | "data" | "upload" | "escala" | "sim_nao";
  pergunta: string;
  opcoes: string[];
  obrigatoria: boolean;
  ativa: boolean;
  criado_em: string;
};
