// =====================================================
// REIS MANAGER — Tipos da Base de Dados
// =====================================================

// ---------- PROFILES ----------
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

// ---------- CARGOS ----------
export type Cargo = {
  id: string;
  nome: string;
  descricao: string | null;
  permissoes: Record<string, boolean>;
  is_sistema: boolean;
  ativo: boolean;
  criado_em: string;
};

export type ProfessorCargo = {
  id: string;
  professor_id: string;
  cargo_id: string;
  atribuido_por: string | null;
  atribuido_em: string;
};

// ---------- PIN ----------
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

// ---------- NÍVEIS DE ENSINO ----------
export type NivelEnsino = {
  id: string;
  codigo: "primaria" | "secundaria" | "pre_universitaria";
  nome: string;
  descricao: string | null;
  ativo: boolean;
  criado_em: string;
};

// ---------- CLASSES ----------
export type Classe = {
  id: string;
  numero: number;
  nome: string;
  nivel_codigo: "primaria" | "secundaria" | "pre_universitaria";
  ano_letivo: number;
  capacidade_por_turma: number | null;
  ativo: boolean;
  criado_em: string;
};

// ---------- ÁREAS ----------
export type Area = {
  id: string;
  classe_id: string;
  codigo: "A" | "B" | "C";
  nome: string | null;
  descricao: string | null;
  ativo: boolean;
  criado_em: string;
};

// ---------- DISCIPLINAS ----------
export type Disciplina = {
  id: string;
  nome: string;
  codigo: string | null;
  carga_horaria: number | null;
  cor: string;
  classe_id: string;
  area_id: string | null;
  ativo: boolean;
  criado_em: string;
};

// ---------- TURMAS ----------
export type Turma = {
  id: string;
  nome: string;
  classe_id: string;
  area_id: string | null;
  ano_letivo: number;
  capacidade: number | null;
  sala: string | null;
  diretor_turma_id: string | null;
  ativo: boolean;
  criado_em: string;
};

// ---------- ALUNOS ----------
export type Aluno = {
  id: string;
  user_id: string | null;
  numero_matricula: string;
  nome_completo: string;
  data_nascimento: string | null;
  genero: "M" | "F" | null;
  nome_encarregado: string | null;
  telefone_encarregado: string | null;
  email_encarregado: string | null;
  endereco: string | null;
  bi_documento: string | null;
  foto_url: string | null;
  turma_id: string | null;
  ano_letivo: number;
  status: "ativo" | "transferido" | "suspenso" | "inativo";
  observacoes: string | null;
  criado_por: string | null;
  criado_em: string;
  atualizado_em: string;
};

// ---------- COMUNICADOS ----------
export type Comunicado = {
  id: string;
  autor_id: string;
  titulo: string;
  conteudo: string;
  tipo: "global" | "grupo" | "individual";
  destinatarios: string[];
  prioridade: "normal" | "urgente" | "informativo";
  anexo_url: string | null;
  agendado_para: string | null;
  criado_em: string;
};

// ---------- PERGUNTAS DE CADASTRO ----------
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

// ---------- NOTAS ----------
export type Nota = {
  id: string;
  aluno_id: string;
  disciplina_id: string;
  turma_id: string;
  trimestre: 1 | 2 | 3;
  acs1: number | null;
  acs2: number | null;
  ap: number | null;
  lancado_por: string | null;
  criado_em: string;
  atualizado_em: string;
};

export type NotaComMedia = Nota & {
  media: number | null;
};

// ---------- FALTAS ----------
export type Falta = {
  id: string;
  aluno_id: string;
  disciplina_id: string;
  turma_id: string;
  data: string;
  tipo: "presenca" | "falta" | "falta_justificada" | "atraso";
  observacao: string | null;
  lancado_por: string | null;
  criado_em: string;
  atualizado_em: string;
};

// ---------- ATRIBUIÇÕES ----------
export type Atribuicao = {
  id: string;
  professor_id: string;
  disciplina_id: string;
  turma_id: string;
  ano_letivo: number;
  criado_por: string | null;
  criado_em: string;
};
