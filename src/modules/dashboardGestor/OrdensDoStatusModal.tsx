import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Inbox, Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { listarOrdensServico } from "@/modules/ordemServico/ordemServicoService";
import { OrdemServicoCard, type OrdemServicoResumo } from "./OrdemServicoCard";

export type FiltroDoCard = {
  /** um dos status bate = entra na lista (ex.: ["ABERTA"], ou vários para "Preventivas Vencidas") */
  status?: string[];
  tipo?: "PREVENTIVA" | "CORRETIVA";
  /** mesmo período do dashboard, pra a lista bater com o número do card */
  dataInicio: string;
  dataFim: string;
};

type Props = {
  aberto: boolean;
  onClose: () => void;
  titulo: string;
  filtro: FiltroDoCard | null;
};

/** A.S. abre até as 23:59:59 do último dia — sem isso, o dia final ficava de fora (comparação de texto). */
const fimDoDia = (data: string) => `${data}T23:59:59`;

/**
 * Ordens de serviço por trás de um número do dashboard (ex.: "2 OS Abertas") — clicar no card do
 * dashboard já mostra quais são, sem precisar ir atrás em outro lugar.
 */
export function OrdensDoStatusModal({ aberto, onClose, titulo, filtro }: Props) {
  const navigate = useNavigate();
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ordens, setOrdens] = useState<OrdemServicoResumo[]>([]);

  useEffect(() => {
    if (!aberto || !filtro) return;

    let ativo = true;
    setCarregando(true);
    setErro(null);

    listarOrdensServico()
      .then((todas) => {
        if (!ativo) return;

        const filtradas = todas.filter((o) => {
          const dentroDoPeriodo = o.data_abertura >= filtro.dataInicio && o.data_abertura <= fimDoDia(filtro.dataFim);
          if (!dentroDoPeriodo) return false;
          if (filtro.status && !filtro.status.includes(o.status)) return false;
          if (filtro.tipo && o.tipo_manutencao !== filtro.tipo) return false;
          // "Preventivas"/"Corretivas" contam por tipo, sem as canceladas (mesma regra do
          // card, em DashboardRepository.obterKPIs) — canceladas têm o card próprio delas.
          if (filtro.tipo && o.status === "CANCELADA") return false;
          return true;
        });

        setOrdens(filtradas.map((o) => ({ ...o, numero: String(o.id) })));
      })
      .catch((e) => ativo && setErro(e instanceof Error ? e.message : "Não foi possível carregar as ordens de serviço."))
      .finally(() => ativo && setCarregando(false));

    return () => {
      ativo = false;
    };
  }, [aberto, filtro]);

  function abrir(ordem: OrdemServicoResumo) {
    onClose();
    navigate(`/ordens-servico/${ordem.id}`);
  }

  return (
    <Dialog open={aberto} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="flex max-h-[85vh] w-[96vw] flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-2xl">
        <DialogHeader className="shrink-0 border-b px-4 pb-4 pt-5 text-left sm:px-6 sm:pt-6">
          <DialogTitle className="text-left text-lg font-semibold">{titulo}</DialogTitle>
          <DialogDescription className="text-left text-sm text-slate-500">
            {carregando ? "Carregando..." : `${ordens.length} ordem${ordens.length === 1 ? "" : "s"} de serviço, no período selecionado`}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/60 p-4 sm:p-6">
          {carregando && (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-400" aria-busy="true">
              <Loader2 size={16} className="animate-spin" /> Carregando...
            </div>
          )}

          {erro && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {erro}
            </div>
          )}

          {!carregando && !erro && ordens.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <span className="flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <Inbox size={18} aria-hidden="true" />
              </span>
              <p className="text-sm text-slate-500">Nenhuma ordem de serviço encontrada.</p>
            </div>
          )}

          {!carregando && !erro && ordens.length > 0 && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {ordens.map((ordem) => (
                <OrdemServicoCard key={ordem.id} ordem={ordem} onVisualizar={abrir} />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
