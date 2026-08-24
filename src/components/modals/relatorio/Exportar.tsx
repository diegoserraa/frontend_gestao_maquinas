import { useEffect, useState } from "react";
import { FileSpreadsheet, Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type ExportarModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nomeArquivoPadrao: string;
  exportando?: boolean;
  onConfirmar: (nomeArquivo: string) => void;
};

export function ExportarModal({
  open,
  onOpenChange,
  nomeArquivoPadrao,
  exportando = false,
  onConfirmar,
}: ExportarModalProps) {
  const [nome, setNome] = useState(nomeArquivoPadrao);

  useEffect(() => {
    if (open) {
      setNome(nomeArquivoPadrao);
    }
  }, [open, nomeArquivoPadrao]);

  function confirmar() {
    const nomeFinal = nome.trim() || nomeArquivoPadrao;
    onConfirmar(nomeFinal);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="
          sm:max-w-md
          rounded-2xl
          border-slate-100
          bg-white
          shadow-xl
          p-6
        "
      >
        <DialogHeader className="space-y-3">
          <div
            className="
              h-11
              w-11
              rounded-xl
              bg-emerald-50
              text-emerald-600
              flex
              items-center
              justify-center
            "
          >
            <FileSpreadsheet size={20} />
          </div>

          <div className="space-y-1">
            <DialogTitle
              className="
                text-base
                font-semibold
                text-slate-800
              "
            >
              Exportar relatório
            </DialogTitle>

            <DialogDescription
              className="
                text-xs
                leading-relaxed
                text-slate-400
              "
            >
              Escolha o nome do arquivo Excel que será baixado.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="py-3">
          <label
            className="
              block
              mb-1.5
              text-[10px]
              font-semibold
              uppercase
              tracking-wide
              text-slate-400
            "
          >
            Nome do arquivo
          </label>

          <div className="relative">
            <Input
              autoFocus
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  confirmar();
                }
              }}
              placeholder="Ex: relatorio-agosto"
              className="
                h-10
                w-full
                rounded-xl
                border
                border-slate-200
                bg-white
                px-4
                pr-12
                text-sm
                font-medium
                text-slate-700
                shadow-sm
                placeholder:text-slate-400
                transition-all
                duration-150
                hover:border-slate-300
                hover:shadow-md
                focus:outline-none
                focus:ring-2
                focus:ring-emerald-100
                focus:border-emerald-400
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-emerald-100
                focus-visible:border-emerald-400
              "
            />

            <span
              className="
                pointer-events-none
                absolute
                right-3
                top-1/2
                -translate-y-1/2
                text-[11px]
                font-medium
                text-slate-300
              "
            >
              .xlsx
            </span>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={exportando}
            className="
              h-9
              rounded-lg
              border-slate-200
              bg-white
              px-4
              text-sm
              font-medium
              text-slate-600
              shadow-sm
              transition-all
              hover:border-slate-300
              hover:bg-slate-50
              focus:outline-none
              focus:ring-2
              focus:ring-slate-100
              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-slate-100
            "
          >
            Cancelar
          </Button>

          <Button
            type="button"
            onClick={confirmar}
            disabled={exportando}
            className="
              h-9
              gap-2
              rounded-lg
              bg-emerald-600
              px-5
              text-sm
              font-semibold
              text-white
              shadow-sm
              transition-all
              hover:bg-emerald-700
              active:scale-[0.98]
              focus:outline-none
              focus:ring-2
              focus:ring-emerald-100
              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-emerald-100
              disabled:opacity-60
            "
          >
            {exportando ? (
              <>
                <Loader2
                  size={15}
                  className="animate-spin"
                />
                Exportando...
              </>
            ) : (
              <>
                <FileSpreadsheet size={15} />
                Exportar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}