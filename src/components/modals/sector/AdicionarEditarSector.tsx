import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import {
  SectorForm,
  type SectorFormData,
} from "@/components/forms/SectorForm";

type Sector = {
  id: number;
  nome: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  sector?: Sector;
  onSave: (
    data: SectorFormData
  ) => Promise<void>;
};

export function SectorModal({
  open,
  onClose,
  sector,
  onSave,
}: Props) {
  const [loading, setLoading] =
    useState(false);

  async function handleSubmit(
    data: SectorFormData
  ) {
    try {
      setLoading(true);

      await onSave(data);

      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) =>
        !v && onClose()
      }
    >
      <DialogContent
        className="
          w-[95vw]
          sm:w-full
          sm:max-w-lg

          max-h-[85vh]

          overflow-hidden

          p-0

          flex
          flex-col

          rounded-2xl
        "
      >
        {/* HEADER */}
        <DialogHeader
          className="
            px-4
            sm:px-6
            pt-5
            sm:pt-6
            pb-3
            text-left
            shrink-0
          "
        >
          <DialogTitle
            className="
              text-left
              text-lg
              sm:text-xl
              font-semibold
            "
          >
            {sector
              ? "Editar Setor"
              : "Novo Setor"}
          </DialogTitle>

          <DialogDescription
            className="
              text-left
              text-xs
              sm:text-sm
              text-slate-500
            "
          >
            {sector
              ? "Atualize as informações do setor."
              : "Cadastre um novo setor no sistema."}
          </DialogDescription>
        </DialogHeader>

        {/* BODY */}
        <div
          className="
            px-4
            sm:px-6
            pb-6
            overflow-y-auto
            flex-1
          "
        >
          <SectorForm
            loading={loading}
            initialData={sector}
            onSubmit={handleSubmit}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}