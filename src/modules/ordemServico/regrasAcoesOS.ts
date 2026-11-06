/**
 * Quais botões aparecem numa O.S. — decidido pelas PERMISSÕES do usuário (definidas pelo
 * gestor), pelo TIPO dele e pelo estado da O.S. O servidor confere tudo de novo; isto só evita
 * mostrar um botão que daria "acesso negado".
 *
 * Regra do sistema: o gestor não faz manutenção. Ele atribui (a um técnico ou a um parceiro
 * externo), cancela e só finaliza O.S. de técnico externo. Assumir, iniciar e pausar/retomar
 * são do técnico.
 */

export type OSParaAcoes = {
  status: string;
  id_tecnico?: number | null;
  execucao_externa?: boolean;
};

export type AcoesDaOS = {
  assumir: boolean;
  iniciar: boolean;
  pausar: boolean;
  retomar: boolean;
  finalizar: boolean;
  atribuir: boolean;
  definirExterno: boolean;
  cancelar: boolean;
};

const ENCERRADAS = ["FINALIZADA", "CANCELADA"];

export function acoesDaOS(
  os: OSParaAcoes,
  userId: number,
  pode: (permissao: string) => boolean,
  papel?: string | null
): AcoesDaOS {
  const status = String(os.status ?? "").toUpperCase();
  const externo = os.execucao_externa === true;
  const encerrada = ENCERRADAS.includes(status);
  const ehGestor = papel === "GESTOR";

  // é a O.S. deste técnico (e não é execução externa)
  const dele = os.id_tecnico != null && os.id_tecnico === userId && !externo;
  const agirEmQualquer = pode("os.agir_em_qualquer");
  const podeAgirNela = dele || agirEmQualquer;

  // já tem quem execute: técnico definido ou parceiro externo
  const jaTemExecutor = (os.id_tecnico != null && os.id_tecnico !== 0) || externo;

  // execução: o gestor fica de fora (não faz manutenção)
  const executa = !ehGestor;

  return {
    assumir: executa && pode("os.assumir") && status === "ABERTA" && !externo,

    iniciar: executa && pode("os.iniciar") && status === "ATRIBUIDA" && dele,

    pausar: executa && pode("os.pausar") && status === "EM_ANDAMENTO" && podeAgirNela,

    retomar: executa && pode("os.pausar") && status === "PAUSADA" && podeAgirNela,

    finalizar:
      pode("os.finalizar") &&
      // gestor: só a O.S. de técnico externo. Os demais: técnico na dele em andamento, ou quem age em qualquer
      (ehGestor
        ? externo && agirEmQualquer && !encerrada && status !== "PAUSADA"
        : (status === "EM_ANDAMENTO" && podeAgirNela) || (externo && agirEmQualquer && !encerrada && status !== "PAUSADA")),

    atribuir: pode("os.atribuir") && !encerrada && !jaTemExecutor,

    definirExterno: pode("os.definir_externo") && !encerrada && !jaTemExecutor,

    cancelar: pode("os.cancelar") && !encerrada,
  };
}
