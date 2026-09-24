import { useEffect, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { notify } from "@/lib/notify";
import { usePermissoes } from "./usePermissoes";

type Props = {
  /** precisa desta permissão */
  permissao?: string;
  /** ou de qualquer uma destas */
  qualquer?: string[];
  children: ReactNode;
  /** o que mostrar quando não pode (padrão: nada) */
  fallback?: ReactNode;
};

/** Mostra o conteúdo só se o usuário tiver a permissão. */
export function Pode({ permissao, qualquer, children, fallback = null }: Props) {
  const { pode, podeQualquer } = usePermissoes();

  const liberado = qualquer ? podeQualquer(...qualquer) : permissao ? pode(permissao) : true;

  return <>{liberado ? children : fallback}</>;
}

/** Protege uma tela: sem permissão, volta pro início com um aviso. */
export function RotaComPermissao({ permissao, qualquer, children }: Omit<Props, "fallback">) {
  const { pode, podeQualquer } = usePermissoes();

  const liberado = qualquer ? podeQualquer(...qualquer) : permissao ? pode(permissao) : true;

  useEffect(() => {
    if (!liberado) notify.error("Você não tem acesso a essa tela.");
  }, [liberado]);

  return liberado ? <>{children}</> : <Navigate to="/" replace />;
}
