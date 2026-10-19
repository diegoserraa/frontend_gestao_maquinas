import { Component, type ErrorInfo, type ReactNode } from "react";

import { ErrorFallback } from "@/components/ErrorFallback";

type Props = {
  children: ReactNode;
};

type State = {
  erro: Error | null;
};

/**
 * Rede de segurança pra qualquer coisa FORA do roteador (TooltipProvider,
 * InstalarAppBanner...) — o caso comum de erro dentro de uma página é pego
 * pelo `errorElement` de cada rota (routes/index.tsx), que intercepta antes
 * disso aqui (ver o comentário em ErrorFallback.tsx pro porquê). Mantido
 * como última rede de segurança mesmo assim — não custa nada ter as duas.
 *
 * Precisa ser componente de classe — getDerivedStateFromError/
 * componentDidCatch não têm equivalente em hooks ainda.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { erro: null };

  static getDerivedStateFromError(erro: Error): State {
    return { erro };
  }

  componentDidCatch(erro: Error, info: ErrorInfo) {
    // console por enquanto — quando o Sentry entrar (já está na lista de
    // pendências do projeto), é só chamar ele aqui também, sem mexer em
    // mais nada
    console.error("Erro não tratado capturado pelo ErrorBoundary:", erro, info.componentStack);
  }

  render() {
    if (!this.state.erro) return this.props.children;
    return <ErrorFallback mensagem={this.state.erro.message} />;
  }
}
