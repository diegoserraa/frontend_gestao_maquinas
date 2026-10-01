import { RefreshCcw, Home, AlertTriangle } from "lucide-react";

import { LogoIcone, LogoNome } from "@/components/brand/Logo";

type Props = {
  mensagem?: string;
};

/**
 * Tela de "algo deu errado" — puramente visual, reaproveitada por dois
 * mecanismos diferentes (por isso vive separada, não dentro de cada um):
 *
 * 1. ErrorBoundary.tsx: pega erro de qualquer coisa FORA do roteador
 *    (TooltipProvider, InstalarAppBanner...) — raro, mas existe.
 * 2. routes/index.tsx (errorElement em cada rota): pega erro de render
 *    DENTRO de uma página — o caso comum. O React Router 6+ (data router)
 *    tem o próprio mecanismo de erro embutido, que intercepta ANTES de
 *    qualquer ErrorBoundary do React que esteja por FORA do RouterProvider
 *    — confirmado testando de verdade: sem `errorElement` na rota, o app
 *    mostrava a tela genérica de "Unexpected Application Error" do próprio
 *    React Router em vez desta aqui, mesmo com o ErrorBoundary presente.
 */
export function ErrorFallback({ mensagem }: Props) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #fff1f2 0%, #f8fafc 50%, #eff6ff 100%)" }}
    >
      {/* FUNDO — mesmo tratamento decorativo do Login, só que no tom de alerta */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-rose-100/60" />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-blue-100/40" />
        <div className="absolute top-1/2 left-1/4 w-48 h-48 rounded-full bg-slate-100/80" />
      </div>

      <div className="w-full max-w-sm relative z-10">
        <div className="flex flex-col items-center mb-8">
          <LogoIcone size={56} className="mb-3" />
          <LogoNome className="text-2xl tracking-tight" />
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8">
          <div className="flex items-start gap-3 mb-5">
            <div className="shrink-0 rounded-full p-2 bg-rose-50 text-rose-600">
              <AlertTriangle size={18} />
            </div>
            <div className="min-w-0 pt-0.5">
              <h2 className="text-base font-semibold text-slate-800">
                Algo deu errado
              </h2>
              <p className="text-sm text-slate-400 mt-0.5">
                Essa tela travou por um erro inesperado. Recarregar costuma resolver.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-sm active:scale-[0.99] transition-all flex items-center justify-center gap-2"
            >
              <RefreshCcw size={15} />
              Recarregar a página
            </button>

            <button
              type="button"
              onClick={() => { window.location.href = "/"; }}
              className="w-full h-11 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-medium hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-2"
            >
              <Home size={15} />
              Ir para o início
            </button>
          </div>

          {/* detalhe técnico — escondido por padrão, só pra quem for reportar o problema */}
          <details className="mt-5 group">
            <summary className="text-xs text-slate-400 cursor-pointer select-none hover:text-slate-600 transition-colors">
              Detalhes técnicos
            </summary>
            <p className="mt-2 text-[11px] text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 break-words font-mono">
              {mensagem || "Erro sem mensagem"}
            </p>
          </details>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          MYMAQ360 • se persistir, avise o suporte
        </p>
      </div>
    </div>
  );
}
