/**
 * Quais botões aparecem numa O.S. — decidido pelas PERMISSÕES do usuário (definidas pelo
 * gestor) e pelo estado da O.S. O servidor confere tudo de novo; isto só evita mostrar
 * um botão que daria "acesso negado".
 */

export type OSParaAcoes = {
  status: string;
  id_tecnico?: number | null;
  execucao_externa?: boolean;
};

export type AcoesDaOS = {
  assumir: boolean;
  iniciar: boolean;
  finalizar: boolean;
  atribuir: boolean;
  definirExterno: boolean;
  cancelar: boolean;
};

const ENCERRADAS = ["FINALIZADA", "CANCELADA"];

export function acoesDaOS(
  os: OSParaAcoes,
  userId: number,
  pode: (permissao: string) => boolean
): AcoesDaOS {
  const status = String(os.status ?? "").toUpperCase();
  const externo = os.execucao_externa === true;
  const encerrada = ENCERRADAS.includes(status);

  // é a O.S. deste técnico (e não é execução externa)
  const dele = os.id_tecnico != null && os.id_tecnico === userId && !externo;
  const agirEmQualquer = pode("os.agir_em_qualquer");

  // já tem quem execute: técnico definido ou parceiro externo
  const jaTemExecutor = (os.id_tecnico != null && os.id_tecnico !== 0) || externo;

  return {
    assumir: pode("os.assumir") && status === "ABERTA" && !externo,

    iniciar: pode("os.iniciar") && status === "ATRIBUIDA" && dele,

    finalizar:
      pode("os.finalizar") &&
      ((status === "EM_ANDAMENTO" && (dele || agirEmQualquer)) || (externo && agirEmQualquer && !encerrada)),

    atribuir: pode("os.atribuir") && !encerrada && !jaTemExecutor,

    definirExterno: pode("os.definir_externo") && !encerrada && !jaTemExecutor,

    cancelar: pode("os.cancelar") && !encerrada,
  };
}
