import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import {
  PartnerForm,
  type PartnerFormData,
} from "@/components/forms/PartnerForm";

type Partner = {
  id: number;
  nome: string;
  cnpj?: string;
  telefone?: string;
  email?: string;
  observacoes?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  partner?: Partner;
  onSave: (
    data: PartnerFormData
  ) => Promise<void>;
};

export function PartnerModal({
  open,
  onClose,
  partner,
  onSave,
}: Props) {
  const [loading, setLoading] =
    useState(false);

  async function handleSubmit(
    data: PartnerFormData
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
            {partner
              ? "Editar Parceiro"
              : "Novo Parceiro"}
          </DialogTitle>

          <DialogDescription
            className="
              text-left
              text-xs
              sm:text-sm
              text-slate-500
            "
          >
            {partner
              ? "Atualize as informações do parceiro."
              : "Cadastre um novo parceiro no sistema."}
          </DialogDescription>
        </DialogHeader>

        <div
          className="
            px-4
            sm:px-6
            pb-6
            overflow-y-auto
            flex-1
          "
        >
          <PartnerForm
            loading={loading}
            initialData={partner}
            onSubmit={handleSubmit}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}