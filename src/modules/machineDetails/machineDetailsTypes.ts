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

export type OrdemStatus = "ABERTA" | "EM_ANDAMENTO" | "FINALIZADA";

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
  id_tecnico?: number;
  valor_gasto?: number;

  // campos novos
  id_solicitante?: number;
  data_atribuicao?: string;
  id_atribuido_por?: number;
  data_inicio_atendimento?: string;
  motivo_cancelamento?: string;
  data_cancelamento?: string;

  // ── parceiro (preenchido só na finalização, quando id_tecnico
  //    aponta pro registro placeholder "Técnico Externo") ──────
  id_parceiro?: number | null;
  valor_parceiro?: number | null;
}

export type OrdemServicoFormData = {
  maquina_id: number;
  descricao: string;
  status: "ABERTA";
  tipo_manutencao: "CORRETIVA" | "PREVENTIVA" | "PREDITIVA";
  prioridade: "BAIXA" | "MEDIA" | "ALTA" | "CRITICA";
  id_tecnico?: number | null;
  resolucao?: string;
};
