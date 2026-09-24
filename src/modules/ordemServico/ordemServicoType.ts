export type OrdemServicoFormData = {
  maquina_id: number;
  descricao: string;
  status: "ABERTA";
  tipo_manutencao:
    | "CORRETIVA"
    | "PREVENTIVA"
    | "PREDITIVA";

  prioridade:
    | "BAIXA"
    | "MEDIA"
    | "ALTA"
    | "CRITICA";

  id_tecnico?: number | null;
  resolucao?: string;
};

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

  // pausa: tempo já pausado (pausas encerradas), início/motivo da pausa em curso e quanto ela já durou
  tempo_pausado_segundos?: number;
  pausada_em?: string | null;
  motivo_pausa?: string | null;
  pausa_atual_segundos?: number;

  // nome de quem abriu a O.S. (vem da API)
  solicitante_nome?: string | null;
}