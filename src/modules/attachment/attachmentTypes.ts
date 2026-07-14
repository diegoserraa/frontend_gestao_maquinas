export interface Anexo {
  id: number;
  maquina_id?: number;
  ordem_servico_id?: number;

  nome_arquivo: string;
  url_arquivo: string;
  tipo_arquivo: string;

  origem:
    | "MAQUINA"
    | "OS_ABERTURA"
    | "OS_FECHAMENTO";
}