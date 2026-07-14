import { useState, useEffect } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import {
  OrdemServicoForm,
  type OrdemServicoFormData,
} from "@/components/forms/OrdemServicoForm";

import { AttachmentUploader } from "@/modules/attachment/attachmentUploader.";
import type { ExistingAttachment } from "@/components/modals/machine/AdicionarEditarMachine";

type Tecnico = {
  id: number;
  nome: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  machineId: number;
  tecnicos: Tecnico[];
  // Anexos já existentes (útil se esse modal futuramente também editar uma OS já aberta)
  existingAttachments?: ExistingAttachment[];
  onSave: (
    data: OrdemServicoFormData,
    newFiles: File[],
    removedAttachmentIds: number[]
  ) => Promise<void>;
};

export function OrdemServicoModal({
  open,
  onClose,
  machineId,
  tecnicos,
  existingAttachments = [],
  onSave,
}: Props) {
  const [loading, setLoading] = useState(false);

  // Novos arquivos selecionados pelo usuário (upload ocorre após criar a OS)
  const [newFiles, setNewFiles] = useState<File[]>([]);

  // IDs de anexos existentes marcados pra remoção (edição futura)
  const [removedIds, setRemovedIds] = useState<number[]>([]);

  // Reseta tudo ao abrir/fechar
  useEffect(() => {
    if (!open) {
      setNewFiles([]);
      setRemovedIds([]);
    }
  }, [open]);

  async function handleSubmit(data: OrdemServicoFormData) {
    try {
      setLoading(true);
      await onSave(data, newFiles, removedIds);
      setNewFiles([]);
      setRemovedIds([]);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleRemoveExisting(id: number) {
    setRemovedIds((prev) => [...prev, id]);
  }

  function handleRestoreExisting(id: number) {
    setRemovedIds((prev) => prev.filter((rid) => rid !== id));
  }

  const totalAnexos =
    newFiles.length +
    existingAttachments.filter((a) => !removedIds.includes(a.id)).length;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          setNewFiles([]);
          setRemovedIds([]);
          onClose();
        }
      }}
    >
      <DialogContent
        className="
          w-[95vw] sm:w-full sm:max-w-4xl
          max-h-[90vh] overflow-hidden
          p-0 flex flex-col rounded-2xl
        "
      >
        <DialogHeader className="px-4 sm:px-6 pt-5 sm:pt-6 pb-3 text-left shrink-0">
          <DialogTitle className="text-left text-lg sm:text-xl font-semibold">
            Nova Ordem de Serviço
          </DialogTitle>
          <DialogDescription className="text-left text-xs sm:text-sm text-slate-500">
            Registre uma nova manutenção na máquina.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="dados" className="flex flex-col flex-1 overflow-hidden">
          <div className="px-4 sm:px-6">
            <TabsList className="grid w-full grid-cols-2 bg-slate-100 p-1 rounded-xl h-10">
              <TabsTrigger
                value="dados"
                className="rounded-lg text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-blue-200 data-[state=inactive]:text-slate-500"
              >
                Dados
              </TabsTrigger>
              <TabsTrigger
                value="anexos"
                className="rounded-lg text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-blue-200 data-[state=inactive]:text-slate-500"
              >
                Anexos{totalAnexos > 0 && ` (${totalAnexos})`}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent
            value="dados"
            forceMount
            className="flex-1 overflow-y-auto px-4 sm:px-6 pb-6 mt-4 data-[state=inactive]:hidden"
          >
            <OrdemServicoForm
              machineId={machineId}
              tecnicos={tecnicos}
              loading={loading}
              onSubmit={handleSubmit}
            />
          </TabsContent>

          <TabsContent
            value="anexos"
            forceMount
            className="flex-1 overflow-y-auto px-4 sm:px-6 pb-6 mt-4 data-[state=inactive]:hidden"
          >
            <AttachmentUploader
              newFiles={newFiles}
              onChangeNewFiles={setNewFiles}
              existingAttachments={existingAttachments}
              removedIds={removedIds}
              onRemoveExisting={handleRemoveExisting}
              onRestoreExisting={handleRestoreExisting}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
