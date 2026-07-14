import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import {
  UserForm,
  type UserFormData,
} from "@/components/forms/UserForm";

import type { User } from "@/modules/user/userType";

type Props = {
  open: boolean;
  onClose: () => void;
  user?: User;
  onSave: (
    data: UserFormData
  ) => Promise<void>;
};

export function UserModal({
  open,
  onClose,
  user,
  onSave,
}: Props) {
  const [loading, setLoading] =
    useState(false);

  async function handleSubmit(
    data: UserFormData
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
          sm:max-w-2xl

          max-h-[85vh]
          overflow-hidden

          p-0

          flex
          flex-col

          rounded-2xl
        "
      >
        {/* HEADER */}
        <DialogHeader className="px-4 sm:px-6 pt-5 sm:pt-6 pb-3 text-left shrink-0">
          <DialogTitle className="text-left text-lg sm:text-xl font-semibold">
            {user
              ? "Editar Usuário"
              : "Novo Usuário"}
          </DialogTitle>

          <DialogDescription className="text-left text-xs sm:text-sm text-slate-500">
            {user
              ? "Atualize as informações do usuário."
              : "Cadastre um novo usuário no sistema."}
          </DialogDescription>
        </DialogHeader>

        {/* BODY */}
        <div className="px-4 sm:px-6 pb-6 overflow-y-auto flex-1">
          <UserForm
            loading={loading}
            initialData={user}
            mode={
              user
                ? "edit"
                : "create"
            }
            onSubmit={handleSubmit}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}