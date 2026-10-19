export type TipoGatilhoPreventiva = "DIAS" | "HORAS";

export type PlanoManutencao = {
  id: number;
  maquina_id: number;
  descricao: string;
  tipo_gatilho: TipoGatilhoPreventiva;
  intervalo_dias?: number | null;
  intervalo_horas?: number | null;
  proxima_data?: string | null;
  horas_referencia?: number | string | null;
  ultima_manutencao?: string | null;
  ativo: boolean;
};

export type NovoPlanoManutencao = {
  descricao: string;
  tipo_gatilho: TipoGatilhoPreventiva;
  intervalo_dias?: number;
  intervalo_horas?: number;
  // opcional, só DIAS — quando foi feita a última vez (AAAA-MM-DD); vazio = conta a partir de hoje
  ultima_manutencao?: string;
  ativo?: boolean;
};

export type ResultadoClonagemPlanos = {
  criados: PlanoManutencao[];
  ignorados: { descricao: string; motivo: string }[];
};
