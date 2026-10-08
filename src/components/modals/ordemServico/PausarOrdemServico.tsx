import { useEffect, useState } from "react";
import { Loader2, PauseCircle } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: (motivo: string) => Promise<void>;
};

/** Pausar o atendimento: o motivo é obrigatório e o tempo parado deixa de contar como tempo de reparo. */
export function PausarOrdemServicoModal({ open, onClose, onConfirm }: Props) {
  const [motivo, setMotivo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setMotivo("");
      setError("");
      setLoading(false);
    }
  }, [open]);

  async function handleSubmit() {
    const motivoLimpo = motivo.trim();

    if (!motivoLimpo) {
      setError("Informe o motivo da pausa.");
      return;
    }

    setError("");

    try {
      setLoading(true);
      await onConfirm(motivoLimpo);
      onClose();
    } catch (err) {
      console.error("[PausarOS] erro:", err);
      setError("Não foi possível pausar a O.S. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v && !loading) onClose();
      }}
    >
      <DialogContent className="w-[95vw] sm:w-full sm:max-w-md p-0 rounded-2xl overflow-hidden">
        <DialogHeader className="px-4 sm:px-6 pt-5 sm:pt-6 pb-3 text-left">
          <DialogTitle className="flex items-center gap-2 text-left text-lg font-semibold text-slate-800">
            <span className="flex size-8 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
              <PauseCircle size={18} aria-hidden="true" />
            </span>
            Pausar atendimento
          </DialogTitle>

          <DialogDescription className="text-left text-sm text-slate-500">
            O tempo em que a O.S. ficar pausada é registrado à parte e não conta como tempo de reparo.
          </DialogDescription>
        </DialogHeader>

        <div className="px-4 sm:px-6 pb-5">
          <div className="space-y-1.5">
            <label htmlFor="motivo-pausa" className="text-sm font-medium text-slate-700">
              Motivo da pausa <span className="text-red-400">*</span>
            </label>

            <textarea
              id="motivo-pausa"
              autoFocus
              value={motivo}
              onChange={(e) => {
                setMotivo(e.target.value);
                if (error) setError("");
              }}
              disabled={loading}
              maxLength={1000}
              placeholder="Ex.: aguardando peça, fim do expediente, liberação da máquina..."
              rows={4}
              className={`
                w-full min-h-[100px] rounded-xl border bg-white p-3 text-sm text-slate-700
                shadow-sm transition-all hover:shadow-md outline-none focus:ring-2 resize-none
                disabled:opacity-60
                ${
                  error
                    ? "border-red-400 focus:ring-red-100 focus:border-red-400"
                    : "border-slate-200 focus:ring-orange-100 focus:border-orange-400"
                }
              `}
            />

            {error && (
              <p role="alert" className="text-xs text-red-500">
                {error}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end px-4 sm:px-6 py-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Voltar
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 rounded-md bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={14} className="animate-spin" />
                Pausando...
              </span>
            ) : (
              "Confirmar pausa"
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
