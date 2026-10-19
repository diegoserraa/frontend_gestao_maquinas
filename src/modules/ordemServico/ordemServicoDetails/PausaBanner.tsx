import { PauseCircle } from "lucide-react";

import { useAgora } from "@/hooks/useAgora";
import type { OrdemServico } from "@/modules/ordemServico/ordemServicoType";
import {
  estaPausada,
  formatarCronometro,
  formatarSegundos,
  segundosDaPausaAtual,
  segundosPausados,
} from "@/modules/ordemServico/pausaOSLogica";

/**
 * Faixa "Atendimento pausado" com o motivo e um cronômetro ao vivo.
 * Só aparece enquanto a O.S. está pausada; o cronômetro só roda nesse caso.
 */
export function PausaBanner({ os }: { os: OrdemServico }) {
  const pausada = estaPausada(os);
  const agora = useAgora(pausada);

  if (!pausada) return null;

  const naPausaAtual = segundosDaPausaAtual(os, agora);
  const total = segundosPausados(os, agora);
  const houveOutras = total > naPausaAtual;

  return (
    <div
      role="status"
      className="
        flex flex-col gap-3
        rounded-2xl border border-orange-200 bg-orange-50/80
        p-3.5 sm:flex-row sm:items-center sm:justify-between sm:p-4
      "
    >
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
          <PauseCircle size={20} aria-hidden="true" />
        </span>

        <div className="min-w-0">
          <p className="text-sm font-semibold text-orange-800">Atendimento pausado</p>
          <p className="mt-0.5 break-words text-xs text-orange-700/90 sm:text-sm">
            {os.motivo_pausa ? <>Motivo: {os.motivo_pausa}</> : "Sem motivo informado"}
          </p>
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-4 rounded-xl bg-white/70 px-3 py-2 sm:block sm:text-right">
        <p className="text-[10px] font-medium uppercase tracking-wide text-orange-600/80">Parada há</p>
        <p
          className="font-mono text-xl font-bold tabular-nums text-orange-700 sm:text-2xl"
          aria-label={`Parada há ${formatarSegundos(naPausaAtual)}`}
        >
          {formatarCronometro(naPausaAtual)}
        </p>
        {houveOutras && (
          <p className="text-[10px] text-orange-600/80">no total: {formatarSegundos(total)}</p>
        )}
      </div>
    </div>
  );
}
