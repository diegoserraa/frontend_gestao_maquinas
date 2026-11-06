import { useState } from "react";
import { Check, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { MachineForm, type MachineFormData } from "@/components/forms/MachineForm";
import { AttachmentUploader } from "@/modules/attachment/attachmentUploader";
import { PlanosManutencaoTab } from "@/modules/machine/PlanosManutencaoTab";
import type { Machine, Setor } from "@/modules/machine/machineTypes";

type Props = {
  sectors: Setor[];
  onCriarMaquina: (data: MachineFormData) => Promise<Machine>;
  // mesma função que a aba "Anexos" do modo editar usa — já sabe pra qual
  // máquina salvar (quem chama já atualizou a máquina selecionada)
  onSaveAnexos: (newFiles: File[], removedAttachmentIds: number[]) => Promise<void>;
  // chamado quando o assistente termina (Concluir) ou é cancelado no meio —
  // quem usa decide se fecha o modal, limpa seleção, etc.
  onConcluir: () => void;
};

const ETAPAS = [
  { numero: 1, rotulo: "Dados" },
  { numero: 2, rotulo: "Plano de Preventiva" },
  { numero: 3, rotulo: "Anexos" },
] as const;

/** Criação de máquina é um fluxo novo, do zero — diferente de editar (onde
 * a pessoa já sabe o que quer mexer e pula direto na aba). Aqui faz sentido
 * ser passo a passo, com início-meio-fim claro: cria os dados, depois
 * (opcional) um plano de manutenção, depois (opcional) uma foto/anexo. */
export function NovaMaquinaWizard({ sectors, onCriarMaquina, onSaveAnexos, onConcluir }: Props) {
  const [etapa, setEtapa] = useState<1 | 2 | 3>(1);
  const [maquinaCriada, setMaquinaCriada] = useState<Machine | null>(null);
  const [criando, setCriando] = useState(false);
  const [concluindo, setConcluindo] = useState(false);
  const [newFiles, setNewFiles] = useState<File[]>([]);

  async function handleCriar(data: MachineFormData) {
    try {
      setCriando(true);
      const criada = await onCriarMaquina(data);
      setMaquinaCriada(criada);
      setEtapa(2);
    } catch (error) {
      console.error(error);
    } finally {
      setCriando(false);
    }
  }

  async function handleConcluir() {
    try {
      setConcluindo(true);
      if (newFiles.length > 0) {
        await onSaveAnexos(newFiles, []);
      }
      onConcluir();
    } catch (error) {
      console.error(error);
    } finally {
      setConcluindo(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* INDICADOR DE ETAPAS */}
      <div className="flex items-center justify-center gap-2 px-4 pb-4 sm:px-6">
        {ETAPAS.map((e, i) => (
          <div key={e.numero} className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                  etapa === e.numero
                    ? "bg-blue-600 text-white"
                    : etapa > e.numero
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-400"
                )}
              >
                {etapa > e.numero ? <Check size={12} /> : e.numero}
              </div>
              <span className={cn("text-xs font-medium", etapa === e.numero ? "text-slate-800" : "text-slate-400")}>
                {e.rotulo}
              </span>
            </div>
            {i < ETAPAS.length - 1 && <div className="h-px w-6 bg-slate-200" />}
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6 sm:px-6">
        {etapa === 1 && <MachineForm sectors={sectors} loading={criando} onSubmit={handleCriar} />}

        {etapa === 2 && maquinaCriada && (
          <div className="space-y-4">
            <p className="text-xs text-slate-400">Etapa opcional — pode avançar sem criar nenhum plano agora.</p>
            <PlanosManutencaoTab maquinaId={maquinaCriada.id} direto />
            <EtapaRodape onAvancar={() => setEtapa(3)} rotuloAvancar="Avançar" />
          </div>
        )}

        {etapa === 3 && maquinaCriada && (
          <div className="space-y-4">
            <AttachmentUploader
              newFiles={newFiles}
              onChangeNewFiles={setNewFiles}
              existingAttachments={[]}
              removedIds={[]}
              onRemoveExisting={() => {}}
              onRestoreExisting={() => {}}
              textoRodape='Os arquivos são enviados ao clicar em "Concluir", no fim.'
            />
            <p className="text-xs text-slate-400">
              Etapa opcional — "Concluir" sem selecionar nada só fecha, sem anexar.
            </p>
            <EtapaRodape
              onVoltar={() => setEtapa(2)}
              onAvancar={handleConcluir}
              rotuloAvancar={concluindo ? "Concluindo..." : "Concluir"}
              avancarDesabilitado={concluindo}
              iconeAvancar={concluindo ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function EtapaRodape({
  onVoltar,
  onAvancar,
  rotuloAvancar,
  avancarDesabilitado,
  iconeAvancar,
}: {
  onVoltar?: () => void;
  onAvancar: () => void;
  rotuloAvancar: string;
  avancarDesabilitado?: boolean;
  iconeAvancar?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-4">
      {onVoltar ? (
        <button
          type="button"
          onClick={onVoltar}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:border-slate-300"
        >
          <ChevronLeft size={14} /> Voltar
        </button>
      ) : (
        <span />
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onAvancar}
          disabled={avancarDesabilitado}
          className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-xs font-medium text-white disabled:opacity-60"
        >
          {rotuloAvancar} {iconeAvancar ?? <ChevronRight size={14} />}
        </button>
      </div>
    </div>
  );
}
