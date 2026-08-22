import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: (motivo: string) => Promise<void>;
};

export function CancelarOrdemServicoModal({
  open,
  onClose,
  onConfirm,
}: Props) {
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

  function handleMotivoChange(
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) {
    setMotivo(e.target.value);

    if (error) {
      setError("");
    }
  }

  async function handleSubmit() {
    const motivoLimpo = motivo.trim();

    if (!motivoLimpo) {
      setError("O motivo do cancelamento é obrigatório.");
      return;
    }

    setError("");

    try {
      setLoading(true);

      await onConfirm(motivoLimpo);

      setMotivo("");
      onClose();
    } catch (err) {
      console.error("[CancelarOS] erro:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v && !loading) {
          onClose();
        }
      }}
    >
      <DialogContent
        className="
          w-[95vw] sm:w-full sm:max-w-md
          p-0
          rounded-2xl
          overflow-hidden
        "
      >
        {/* HEADER */}
        <DialogHeader className="px-4 sm:px-6 pt-5 sm:pt-6 pb-3 text-left">
          <DialogTitle className="text-left text-lg font-semibold text-slate-800">
            Cancelar Ordem de Serviço
          </DialogTitle>

          <DialogDescription className="text-left text-sm text-slate-500">
            Informe o motivo pelo qual esta ordem de serviço será cancelada.
          </DialogDescription>
        </DialogHeader>

        {/* CONTEÚDO */}
        <div className="px-4 sm:px-6 pb-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">
              Motivo do cancelamento{" "}
              <span className="text-red-400">*</span>
            </label>

            <textarea
              autoFocus
              value={motivo}
              onChange={handleMotivoChange}
              disabled={loading}
              placeholder="Descreva o motivo do cancelamento..."
              rows={4}
              className={`
                w-full
                min-h-[100px]
                rounded-xl
                border
                bg-white
                p-3
                text-sm text-slate-700
                shadow-sm
                transition-all
                hover:shadow-md
                outline-none
                focus:ring-2
                resize-none
                disabled:opacity-60
                ${
                  error
                    ? "border-red-400 focus:ring-red-100 focus:border-red-400"
                    : "border-slate-200 focus:ring-red-100 focus:border-red-400"
                }
              `}
            />

            {error && (
              <p className="text-xs text-red-500">
                {error}
              </p>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div
          className="
            flex justify-end gap-2
            px-4 sm:px-6
            py-4
            border-t border-slate-100
          "
        >
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="
              px-4 py-2
              rounded-md
              text-sm font-medium
              text-slate-600
              hover:bg-slate-100
              disabled:opacity-50
              disabled:cursor-not-allowed
              transition
            "
          >
            Voltar
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="
              px-4 py-2
              rounded-md
              bg-red-600
              text-white
              text-sm font-medium
              hover:bg-red-700
              disabled:opacity-50
              disabled:cursor-not-allowed
              transition
            "
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" />
                Cancelando...
              </span>
            ) : (
              "Confirmar cancelamento"
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}