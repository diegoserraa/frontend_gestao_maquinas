import { useNavigate } from "react-router-dom";
import { Inbox, OctagonPause, Eye } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import type { MaquinaParadaAgora } from "./DashboardGestorTypes";

type Props = {
  aberto: boolean;
  onClose: () => void;
  maquinas: MaquinaParadaAgora[];
};

/** "há 2h 15min" — só pra dar noção de urgência, sem cronômetro rodando (v1 enxuto). */
function haQuantoTempo(dataAbertura: string) {
  const inicio = new Date(dataAbertura).getTime();
  if (Number.isNaN(inicio)) return "";

  const minutosTotais = Math.max(0, Math.floor((Date.now() - inicio) / 60000));
  const horas = Math.floor(minutosTotais / 60);
  const minutos = minutosTotais % 60;

  if (horas === 0) return `há ${minutos} min`;
  if (minutos === 0) return `há ${horas}h`;
  return `há ${horas}h ${minutos}min`;
}

/**
 * Clicar em "Máquinas paradas agora" no dashboard já mostra QUAIS máquinas são — sem isso o
 * gestor via só o número e tinha que adivinhar. Timeline histórica por máquina fica pra v1.1,
 * aqui é só o estado atual (mesmo dado que o card já usa para contar).
 */
export function MaquinasParadasModal({ aberto, onClose, maquinas }: Props) {
  const navigate = useNavigate();

  function abrir(osId: number) {
    onClose();
    navigate(`/ordens-servico/${osId}`);
  }

  return (
    <Dialog open={aberto} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="flex max-h-[85vh] w-[96vw] flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-lg">
        <DialogHeader className="shrink-0 border-b px-4 pb-4 pt-5 text-left sm:px-6 sm:pt-6">
          <DialogTitle className="flex items-center gap-2 text-left text-lg font-semibold">
            <OctagonPause size={18} className="text-rose-500" />
            Máquinas paradas agora
          </DialogTitle>
          <DialogDescription className="text-left text-sm text-slate-500">
            {maquinas.length === 0
              ? "Nenhuma máquina parada no momento."
              : `${maquinas.length} máquina${maquinas.length === 1 ? "" : "s"} parada${maquinas.length === 1 ? "" : "s"} agora`}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/60 p-4 sm:p-6">
          {maquinas.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <span className="flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <Inbox size={18} aria-hidden="true" />
              </span>
              <p className="text-sm text-slate-500">Tudo funcionando — nenhuma máquina parada.</p>
            </div>
          )}

          {maquinas.length > 0 && (
            <div className="flex flex-col gap-3">
              {maquinas.map((m) => (
                <div
                  key={m.osId}
                  className="rounded-xl bg-white p-4 ring-1 ring-slate-200/70"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {m.maquinaNome}
                      </p>
                      <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-rose-600">
                        parada {haQuantoTempo(m.dataAbertura)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => abrir(m.osId)}
                      className="
                        inline-flex h-7 shrink-0 items-center gap-1.5
                        rounded-md px-2.5
                        text-[11px] font-medium text-slate-500
                        transition-colors
                        hover:bg-slate-50 hover:text-slate-900
                        focus:outline-none focus:ring-2 focus:ring-slate-200
                      "
                    >
                      <Eye size={13} strokeWidth={1.8} />
                      OS #{m.osId}
                    </button>
                  </div>

                  {m.motivoParada && (
                    <p className="mt-2 line-clamp-2 border-t border-slate-100 pt-2 text-[12px] leading-5 text-slate-500">
                      {m.motivoParada}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
