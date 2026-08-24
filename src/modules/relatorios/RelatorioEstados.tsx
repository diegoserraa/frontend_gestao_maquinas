import { AlertTriangle, FileSearch, Loader2 } from "lucide-react";

export function RelatorioLoading() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <Loader2 size={24} className="text-blue-500 animate-spin" />
      <p className="text-sm text-slate-500">Carregando relatório...</p>
    </div>
  );
}

export function RelatorioErro({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center">
        <AlertTriangle size={22} />
      </div>
      <div>
        <p className="font-medium text-slate-700 text-sm">Não foi possível carregar o relatório</p>
        <p className="text-xs text-slate-400 mt-1">Verifique os filtros e tente novamente</p>
      </div>
      <button
        onClick={onRetry}
        className="mt-1 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition"
      >
        Tentar novamente
      </button>
    </div>
  );
}

export function RelatorioVazio() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="h-12 w-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center">
        <FileSearch size={22} />
      </div>
      <div>
        <p className="font-medium text-slate-700 text-sm">Nenhum resultado encontrado</p>
        <p className="text-xs text-slate-400 mt-1">Ajuste os filtros e clique em visualizar</p>
      </div>
    </div>
  );
}

export function RelatorioEstadoInicial() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="h-14 w-14 rounded-2xl bg-slate-50 text-slate-300 flex items-center justify-center">
        <FileSearch size={26} />
      </div>
      <div>
        <p className="font-medium text-slate-600 text-sm">Defina os filtros acima</p>
        <p className="text-xs text-slate-400 mt-1">Clique em "Visualizar" para pré-visualizar o relatório</p>
      </div>
    </div>
  );
}
