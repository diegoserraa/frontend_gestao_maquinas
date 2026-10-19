export type MachineStatus = "ativa" | "inativa" | "manutencao";

// =========================
// MACHINE
// =========================

export type Machine = {
  id: number;
  nome: string;
  modelo: string;
  fabricante: string;
  ano: number;

  status: MachineStatus;

  created_at: string;

  qr_code: string;

  intervalo_manutencao_dias: number;

  ultima_manutencao: string | null;
  proxima_manutencao: string | null;

  setor_id: number;
  imagem_url: string | null;
};

// =========================
// ORDEM DE SERVIÇO
// =========================

export type OrdemStatus = "ABERTA" | "ATRIBUIDA" | "EM_ANDAMENTO" | "PAUSADA" | "FINALIZADA" | "CANCELADA";

export type TipoManutencao = "CORRETIVA" | "PREVENTIVA";

export type Prioridade = "BAIXA" | "MEDIA" | "ALTA";

export interface OrdemServico {
  id: number;
  maquina_id: number;
  descricao: string;
  status: string;
  data_abertura?: string;
  tipo_manutencao?: string;
  resolucao?: string;
  data_resolucao?: string;
  prioridade?: string;
  id_tecnico?: number | null;
  // true quando foi executada por parceiro externo (nesse caso não há técnico)
  execucao_externa?: boolean;
  valor_gasto?: number;

  // campos novos
  id_solicitante?: number;
  data_atribuicao?: string;
  id_atribuido_por?: number;
  data_inicio_atendimento?: string;
  motivo_cancelamento?: string;
  data_cancelamento?: string;

  // pausa: tempo já pausado, pausa em curso (início/motivo) e quanto ela já durou
  tempo_pausado_segundos?: number;
  pausada_em?: string | null;
  motivo_pausa?: string | null;
  pausa_atual_segundos?: number;

  // ── parceiro (preenchido só na finalização, quando a O.S. é
  //    de execução externa) ──────────────────────────────────
  id_parceiro?: number | null;
  valor_parceiro?: number | null;
}

export type OrdemServicoFormData = {
  id_solicitante?: number;
  maquina_id: number;
  descricao: string;
  status: "ABERTA";
  tipo_manutencao: "CORRETIVA" | "PREVENTIVA" | "PREDITIVA";
  prioridade: "BAIXA" | "MEDIA" | "ALTA" | "CRITICA";
  id_tecnico?: number | null;
  resolucao?: string;
};
