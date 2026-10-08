import { useRouteError, isRouteErrorResponse } from "react-router-dom";

import { ErrorFallback } from "@/components/ErrorFallback";

/**
 * errorElement das rotas — é ESTE que pega de verdade um erro de render
 * dentro de uma página (o ErrorBoundary de fora do RouterProvider não
 * chega a ver esse erro; o React Router intercepta antes). Sem isso, o
 * usuário via a tela genérica de "Unexpected Application Error" do
 * próprio React Router em vez do visual do sistema.
 */
export function RouteError() {
  const erro = useRouteError();

  const mensagem = isRouteErrorResponse(erro)
    ? `${erro.status} ${erro.statusText}`
    : erro instanceof Error
    ? erro.message
    : String(erro);

  return <ErrorFallback mensagem={mensagem} />;
}
