import { usePermissoes } from "@/modules/permissoes/usePermissoes";
import { useState, useEffect } from "react";
import { Loader2, Save } from "lucide-react";

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
  MachineForm,
  type MachineFormData,
} from "@/components/forms/MachineForm";

import { AttachmentUploader } from "@/modules/attachment/attachmentUploader";
import { PlanosManutencaoTab } from "@/modules/machine/PlanosManutencaoTab";
import { NovaMaquinaWizard } from "./NovaMaquinaWizard";

type Sector = {
  id: number;
  nome: string;
};

type Machine = {
  id: number;
  nome: string;
  modelo: string;
  fabricante: string;
  ano: number;
  status: string;
  setor_id: number;
  intervalo_manutencao_dias: number;
  ultima_manutencao?: string | null;
  proxima_manutencao?: string | null;
  imagem_url?: string | null;
};

// Representa um anexo já salvo no banco
export type ExistingAttachment = {
  id: number;
  nome: string;
  url: string;
  tamanho?: number;
  tipo?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  sectors: Sector[];
  machine?: Machine;
  // decide se mostra o assistente (criar) ou as abas (editar) — fixo pra
  // sessão inteira do modal, não deriva de "machine" (senão o assistente
  // "viraria" tela de editar sozinho assim que o passo 1 cria a máquina)
  novaMaquina: boolean;
  // Anexos já existentes vindos da API (só no modo edição)
  existingAttachments?: ExistingAttachment[];
  // máquina existente: cada aba salva por conta própria (ver comentário
  // acima da aba "Dados"). Máquina nova: passa pelo assistente em etapas
  // (NovaMaquinaWizard), que usa onCriarMaquina só no passo 1.
  onSaveDados: (data: MachineFormData) => Promise<void>;
  onSaveAnexos: (newFiles: File[], removedAttachmentIds: number[]) => Promise<void>;
  onCriarMaquina: (data: MachineFormData) => Promise<Machine>;
};

export function MachineModal({
  open,
  onClose,
  sectors,
  machine,
  novaMaquina,
  existingAttachments = [],
  onSaveDados,
  onSaveAnexos,
  onCriarMaquina,
}: Props) {
  const { pode } = usePermissoes();
  const mostrarPlanos = pode("maquinas.editar");
  const mostrarAnexos = pode("anexos.ver");
  const totalAbas = 1 + (mostrarPlanos ? 1 : 0) + (mostrarAnexos ? 1 : 0);
  const colunasAbas = totalAbas === 3 ? "grid-cols-3" : totalAbas === 2 ? "grid-cols-2" : "grid-cols-1";

  const [salvandoDados, setSalvandoDados] = useState(false);
  const [salvandoAnexos, setSalvandoAnexos] = useState(false);

  // Novos arquivos selecionados pelo usuário
  const [newFiles, setNewFiles] = useState<File[]>([]);

  // IDs de anexos existentes que o usuário marcou pra remover
  const [removedIds, setRemovedIds] = useState<number[]>([]);

  // Reseta tudo ao abrir/fechar
  useEffect(() => {
    if (!open) {
      setNewFiles([]);
      setRemovedIds([]);
    }
  }, [open]);

  // Aba "Dados": salva só os dados da máquina, sozinha. Pra máquina NOVA
  // (ainda sem id), isto é o que cria o registro — o modal continua aberto
  // depois (o pai atualiza "machine", o título vira "Editar", e as outras
  // abas passam a funcionar). Pra máquina existente, o pai fecha o modal
  // depois de salvar — fluxo rápido de "só editei o nome" continua 1 clique.
  async function handleSubmitDados(data: MachineFormData) {
    try {
      setSalvandoDados(true);
      await onSaveDados(data);
    } catch (error) {
      console.error(error);
    } finally {
      setSalvandoDados(false);
    }
  }

  // Aba "Anexos": salva sozinha, sem fechar — igual Planos, é uma lista que
  // a pessoa pode mexer mais de uma vez na mesma visita (anexar agora,
  // perceber que esqueceu um arquivo, anexar mais um depois).
  async function handleSalvarAnexos() {
    try {
      setSalvandoAnexos(true);
      await onSaveAnexos(newFiles, removedIds);
      setNewFiles([]);
      setRemovedIds([]);
    } catch (error) {
      console.error(error);
    } finally {
      setSalvandoAnexos(false);
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
  const haAnexosPendentes = newFiles.length > 0 || removedIds.length > 0;

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
            {novaMaquina ? "Nova Máquina" : "Editar Máquina"}
          </DialogTitle>
          <DialogDescription className="text-left text-xs sm:text-sm text-slate-500">
            {novaMaquina
              ? "Cadastre uma nova máquina no sistema."
              : "Atualize as informações da máquina."}
          </DialogDescription>
        </DialogHeader>

        {novaMaquina ? (
          <NovaMaquinaWizard
            sectors={sectors}
            onCriarMaquina={onCriarMaquina}
            onSaveAnexos={onSaveAnexos}
            onConcluir={onClose}
          />
        ) : (
        <Tabs defaultValue="dados" className="flex flex-col flex-1 overflow-hidden">
          <div className="px-4 sm:px-6">
<TabsList className={`grid w-full ${colunasAbas} bg-slate-100 p-1 rounded-xl h-10`}>
  <TabsTrigger
    value="dados"
    className="rounded-lg text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-blue-200 data-[state=inactive]:text-slate-500"
  >
    Dados
  </TabsTrigger>
  {mostrarPlanos && (
<TabsTrigger
    value="planos"
    className="rounded-lg text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-blue-200 data-[state=inactive]:text-slate-500"
  >
    Plano de Preventiva
  </TabsTrigger>
)}
  {mostrarAnexos && (
<TabsTrigger
    value="anexos"
    className="rounded-lg text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-blue-200 data-[state=inactive]:text-slate-500"
  >
    Anexos{totalAnexos > 0 && ` (${totalAnexos})`}
  </TabsTrigger>
)}
</TabsList>
          </div>

          <TabsContent
            value="dados"
            forceMount
            className="flex-1 overflow-y-auto px-4 sm:px-6 pb-6 mt-4 data-[state=inactive]:hidden"
          >
            <MachineForm
              sectors={sectors}
              loading={salvandoDados}
              initialData={machine}
              onSubmit={handleSubmitDados}
            />
          </TabsContent>

          {mostrarPlanos && (
<TabsContent
            value="planos"
            className="flex-1 overflow-y-auto px-4 sm:px-6 pb-6 mt-4 data-[state=inactive]:hidden"
          >
            <PlanosManutencaoTab maquinaId={machine?.id} onSalvou={onClose} />
          </TabsContent>
)}

          {mostrarAnexos && (
<TabsContent
            value="anexos"
            forceMount
            className="flex-1 overflow-y-auto px-4 sm:px-6 pb-6 mt-4 data-[state=inactive]:hidden"
          >
            {/* máquina nova passa pelo NovaMaquinaWizard, não por aqui — chegando
                nesta aba a máquina sempre já existe */}
            <div className="space-y-4">
              <AttachmentUploader
                newFiles={newFiles}
                onChangeNewFiles={setNewFiles}
                existingAttachments={existingAttachments}
                removedIds={removedIds}
                onRemoveExisting={handleRemoveExisting}
                onRestoreExisting={handleRestoreExisting}
                textoRodape='Os arquivos só são enviados/removidos de verdade ao clicar em "Salvar anexos", abaixo.'
              />

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSalvarAnexos}
                  disabled={salvandoAnexos || !haAnexosPendentes}
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                >
                  {salvandoAnexos ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                  Salvar anexos
                </button>
              </div>
            </div>
          </TabsContent>
)}
        </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
