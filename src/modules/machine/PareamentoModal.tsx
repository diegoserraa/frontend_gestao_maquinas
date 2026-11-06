import { useEffect, useState } from "react";
import { Loader2, RefreshCw, Wifi } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { gerarPareamento } from "./machineService";
import type { Machine } from "./machineTypes";

type Props = {
  open: boolean;
  onClose: () => void;
  maquina: Machine | null;
};

/** mm:ss até expirar — atualiza a cada segundo */
function useContagemRegressiva(expiraEm: string | null) {
  const [segundos, setSegundos] = useState<number | null>(null);

  useEffect(() => {
    if (!expiraEm) {
      setSegundos(null);
      return;
    }
    const alvo = new Date(expiraEm).getTime();
    const tick = () => setSegundos(Math.max(0, Math.round((alvo - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiraEm]);

  return segundos;
}

/**
 * Gera um PIN de 6 dígitos pra vincular um ESP32 novo a esta máquina —
 * a pessoa digita esse código na telinha de configuração da placa (WiFi
 * + pareamento), sem precisar editar firmware nem regravar nada.
 */
export function PareamentoModal({ open, onClose, maquina }: Props) {
  const [codigo, setCodigo] = useState<string | null>(null);
  const [expiraEm, setExpiraEm] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const segundosRestantes = useContagemRegressiva(expiraEm);
  const expirado = segundosRestantes === 0;

  async function gerar() {
    if (!maquina) return;
    setOcupado(true);
    setErro(null);
    try {
      const r = await gerarPareamento(maquina.id);
      setCodigo(r.codigo);
      setExpiraEm(r.expira_em);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível gerar o código.");
    } finally {
      setOcupado(false);
    }
  }

  useEffect(() => {
    if (!open) {
      setCodigo(null);
      setExpiraEm(null);
      setErro(null);
      return;
    }
    gerar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, maquina?.id]);

  const codigoFormatado = codigo ? `${codigo.slice(0, 3)} ${codigo.slice(3)}` : null;
  const mmss = segundosRestantes !== null ? `${Math.floor(segundosRestantes / 60)}:${String(segundosRestantes % 60).padStart(2, "0")}` : null;

  return (
    <Dialog open={open} onOpenChange={(aberto) => !aberto && onClose()}>
      <DialogContent className="w-[96vw] rounded-2xl sm:max-w-sm">
        <DialogHeader className="text-left">
          <div className="flex items-center gap-3 pr-8">
            <span
              aria-hidden="true"
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm"
            >
              <Wifi size={20} />
            </span>
            <div className="min-w-0">
              <DialogTitle className="text-left text-lg font-semibold">Vincular sensor</DialogTitle>
              <DialogDescription className="text-left text-xs text-slate-500 sm:text-sm">
                {maquina?.nome ?? "Máquina"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {ocupado && !codigo ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-400" aria-busy="true">
              <Loader2 size={16} className="animate-spin" /> Gerando código...
            </div>
          ) : erro ? (
            <div role="alert" className="rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-xs text-red-600">
              {erro}
            </div>
          ) : (
            codigoFormatado && (
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-5 text-center">
                <p
                  className={`font-mono text-4xl font-bold tracking-[0.15em] ${expirado ? "text-slate-300" : "text-slate-900"}`}
                >
                  {codigoFormatado}
                </p>
                <p className={`mt-2 text-xs font-medium ${expirado ? "text-red-500" : "text-slate-400"}`}>
                  {expirado ? "código expirado" : `expira em ${mmss}`}
                </p>
              </div>
            )
          )}

          <ol className="list-decimal space-y-1 pl-4 text-xs text-slate-500">
            <li>Ligue o ESP32 (ele entra sozinho em modo de configuração se ainda não tiver rede salva).</li>
            <li>Na telinha dele, escolha o WiFi e digite a senha.</li>
            <li>Digite este código de 6 dígitos quando ela pedir.</li>
          </ol>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t pt-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose} className="h-10 w-full sm:h-9 sm:w-auto">
            Fechar
          </Button>
          <Button
            type="button"
            onClick={gerar}
            disabled={ocupado}
            className="h-10 w-full gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white sm:h-9 sm:w-auto"
          >
            {ocupado ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            Gerar novo código
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
