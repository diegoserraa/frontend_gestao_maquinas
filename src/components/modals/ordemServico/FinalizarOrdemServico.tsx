import { useState, useEffect, useCallback } from "react";

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

import { AttachmentUploader } from "@/modules/attachment/attachmentUploader";
import type { ExistingAttachment } from "@/components/modals/machine/AdicionarEditarMachine";
import {
  getOSAttachments,
  uploadOSFechamentoAttachment,
} from "@/modules/attachment/attachmentService";
import { getPartners } from "@/modules/partner/partnerService";
import type { Partner } from "@/modules/partner/partnerTypes";
import { Loader2, DollarSign, Search, Building2, X as XIcon } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  osId: number;
  // Quando true, exige seleção de parceiro + valor do parceiro pra finalizar
  isExterno?: boolean;
  onConfirm: (
    resolucao: string,
    valorGasto: number,
    parceiro?: { id_parceiro: number; valor_parceiro: number } | null
  ) => Promise<void>;
};

function anexoToExisting(anexo: {
  id: number;
  nome_arquivo: string;
  url_arquivo: string;
  tipo_arquivo: string;
}): ExistingAttachment {
  return {
    id: anexo.id,
    nome: anexo.nome_arquivo,
    url: anexo.url_arquivo,
    tipo: anexo.tipo_arquivo,
  };
}

// ── Máscara de valor monetário brasileiro ────────────────
// Mantém sempre o formato "1.234,56" enquanto digita
function applyMask(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";

  const cents = parseInt(digits, 10);
  return (cents / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function parseValor(masked: string): number {
  if (!masked.trim()) return 0;
  const normalized = masked.replace(/\./g, "").replace(",", ".");
  const num = parseFloat(normalized);
  return Number.isNaN(num) ? 0 : num;
}

export function FinalizarOrdemServicoModal({
  open,
  onClose,
  osId,
  isExterno = false,
  onConfirm,
}: Props) {
  const [resolucao, setResolucao] = useState("");
  const [valorGasto, setValorGasto] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    resolucao?: string;
    parceiro?: string;
  }>({});

  // ── Anexos (só de fechamento) ─────────────────────────────
  const [existingAttachments, setExistingAttachments] = useState<ExistingAttachment[]>([]);
  const [removedIds, setRemovedIds] = useState<number[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [newFiles, setNewFiles] = useState<File[]>([]);

  // ── Parceiro (técnico externo) ────────────────────────────
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loadingPartners, setLoadingPartners] = useState(false);
  const [partnerSearch, setPartnerSearch] = useState("");
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [valorParceiro, setValorParceiro] = useState("");

  const fetchAttachments = useCallback(async () => {
    if (!osId) return;
    setLoadingAttachments(true);
    try {
      const data = await getOSAttachments(osId);
      const fechamento = (data ?? []).filter(
        (a) => a.origem === "OS_FECHAMENTO"
      );
      setExistingAttachments(fechamento.map(anexoToExisting));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAttachments(false);
    }
  }, [osId]);

  const fetchPartners = useCallback(async () => {
    setLoadingPartners(true);
    try {
      const data = await getPartners();
      setPartners(data ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPartners(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchAttachments();
      if (isExterno) fetchPartners();
    } else {
      setResolucao("");
      setValorGasto("");
      setNewFiles([]);
      setRemovedIds([]);
      setErrors({});
      setSelectedPartner(null);
      setPartnerSearch("");
      setValorParceiro("");
    }
  }, [open, isExterno, fetchAttachments, fetchPartners]);

  function handleRemoveExisting(id: number) {
    setRemovedIds((prev) => [...prev, id]);
  }

  function handleRestoreExisting(id: number) {
    setRemovedIds((prev) => prev.filter((rid) => rid !== id));
  }

  function handleValorChange(e: React.ChangeEvent<HTMLInputElement>) {
    setValorGasto(applyMask(e.target.value));
  }

  function handleValorParceiroChange(e: React.ChangeEvent<HTMLInputElement>) {
    setValorParceiro(applyMask(e.target.value));
  }

  function selectPartner(partner: Partner) {
    setSelectedPartner(partner);
    if (errors.parceiro) setErrors((prev) => ({ ...prev, parceiro: undefined }));
  }

  const filteredPartners = partners.filter((p) => {
    const q = partnerSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      p.nome?.toLowerCase().includes(q) ||
      p.cnpj?.toLowerCase().includes(q)
    );
  });

  async function handleSubmit() {
    const newErrors: typeof errors = {};

    if (!resolucao.trim()) {
      newErrors.resolucao = "A resolução é obrigatória.";
    }

    if (isExterno && !selectedPartner) {
      newErrors.parceiro = "Selecione o parceiro responsável pela execução.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    const valorGastoParsed = parseValor(valorGasto);

    const parceiroPayload =
      isExterno && selectedPartner
        ? {
            id_parceiro: selectedPartner.id,
            valor_parceiro: parseValor(valorParceiro),
          }
        : null;

    try {
      setLoading(true);

      if (newFiles.length > 0) {
        await Promise.all(
          newFiles.map((file) => uploadOSFechamentoAttachment(osId, file))
        );
      }

      await onConfirm(resolucao, valorGastoParsed, parceiroPayload);

      setResolucao("");
      setValorGasto("");
      setValorParceiro("");
      setSelectedPartner(null);
      setNewFiles([]);
      setRemovedIds([]);
      onClose();
    } catch (err) {
      console.error("[FinalizarOS] erro:", err);
    } finally {
      setLoading(false);
    }
  }

  const totalAnexos =
    newFiles.length +
    existingAttachments.filter((a) => !removedIds.includes(a.id)).length;

  const canSubmit =
    !loading &&
    resolucao.trim().length > 0 &&
    (!isExterno || !!selectedPartner);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent
        className="
          w-[95vw] sm:w-full sm:max-w-3xl
          max-h-[85vh] overflow-hidden
          p-0 flex flex-col rounded-2xl
        "
      >
        <DialogHeader className="px-4 sm:px-6 pt-5 sm:pt-6 pb-3 text-left shrink-0">
          <DialogTitle className="text-left text-lg font-semibold">
            Finalizar Ordem de Serviço
          </DialogTitle>
          <DialogDescription className="text-left text-sm text-slate-500">
            {isExterno
              ? "Selecione o parceiro responsável e descreva a resolução."
              : "Descreva a resolução aplicada na manutenção."}
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

          {/* TAB DADOS */}
          <TabsContent
            value="dados"
            forceMount
            className="flex-1 overflow-y-auto px-4 sm:px-6 pb-6 mt-4 data-[state=inactive]:hidden"
          >
            <div className="space-y-5">

              {/* PARCEIRO — só quando execução externa */}
              {isExterno && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">
                    Parceiro responsável <span className="text-red-400">*</span>
                  </label>

                  {selectedPartner ? (
                    <div className="flex items-center justify-between gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3.5 py-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-8 w-8 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
                          <Building2 size={15} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-violet-800 truncate">
                            {selectedPartner.nome}
                          </p>
                          {selectedPartner.cnpj && (
                            <p className="text-[11px] text-violet-500 truncate">
                              {selectedPartner.cnpj}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedPartner(null)}
                        className="h-7 w-7 rounded-lg flex items-center justify-center text-violet-500 hover:bg-violet-100 transition shrink-0"
                      >
                        <XIcon size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 shadow-sm transition-all hover:shadow-md focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-500">
                        <Search size={15} className="text-slate-400 shrink-0" />
                        <input
                          type="text"
                          value={partnerSearch}
                          onChange={(e) => setPartnerSearch(e.target.value)}
                          placeholder="Buscar parceiro por nome ou CNPJ..."
                          className="w-full text-sm text-slate-700 outline-none bg-transparent"
                        />
                      </div>

                      <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100">
                        {loadingPartners && (
                          <div className="flex items-center justify-center gap-2 py-6 text-slate-400">
                            <Loader2 size={16} className="animate-spin" />
                            <span className="text-xs">Carregando parceiros...</span>
                          </div>
                        )}

                        {!loadingPartners && filteredPartners.length === 0 && (
                          <p className="text-xs text-slate-400 text-center py-6">
                            Nenhum parceiro encontrado.
                          </p>
                        )}

                        {!loadingPartners &&
                          filteredPartners.map((partner) => (
                            <button
                              key={partner.id}
                              type="button"
                              onClick={() => selectPartner(partner)}
                              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left hover:bg-blue-50/60 transition"
                            >
                              <div className="h-7 w-7 rounded-md bg-slate-50 text-slate-400 flex items-center justify-center shrink-0">
                                <Building2 size={13} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm text-slate-700 truncate">{partner.nome}</p>
                                {partner.cnpj && (
                                  <p className="text-[11px] text-slate-400 truncate">{partner.cnpj}</p>
                                )}
                              </div>
                            </button>
                          ))}
                      </div>
                    </>
                  )}

                  {errors.parceiro && (
                    <p className="text-xs text-red-500">{errors.parceiro}</p>
                  )}
                </div>
              )}

              {/* RESOLUÇÃO */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">
                  Resolução <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={resolucao}
                  onChange={(e) => {
                    setResolucao(e.target.value);
                    if (errors.resolucao) setErrors((prev) => ({ ...prev, resolucao: undefined }));
                  }}
                  placeholder="Descreva o que foi feito na manutenção..."
                  className={`
                    w-full min-h-[70px] sm:min-h-[90px]
                    rounded-xl border bg-white p-3
                    text-sm text-slate-700 shadow-sm
                    transition-all hover:shadow-md
                    outline-none focus:ring-2
                    ${errors.resolucao
                      ? "border-red-400 focus:ring-red-100 focus:border-red-400"
                      : "border-slate-200 focus:ring-blue-100 focus:border-blue-500"
                    }
                  `}
                />
                {errors.resolucao && (
                  <p className="text-xs text-red-500">{errors.resolucao}</p>
                )}
              </div>

              {/* VALORES — lado a lado, inclusive em telas pequenas */}
              <div className="grid grid-cols-2 gap-3">
                {/* VALOR GASTO (peças/insumos, sempre existe) */}
                <div className="space-y-1.5 min-w-0">
                  <label className="text-sm font-medium text-slate-700">
                    Valor gasto {isExterno ? "(peças)" : "na manutenção"}
                  </label>
                  <div className="flex items-center gap-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 shadow-sm transition-all hover:shadow-md focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-500">
                    <span className="text-sm text-slate-400 shrink-0">R$</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={valorGasto}
                      onChange={handleValorChange}
                      placeholder="0,00"
                      className="w-full min-w-0 text-sm text-slate-700 outline-none bg-transparent"
                    />
                  </div>
                </div>

                {/* VALOR PARCEIRO — só quando execução externa */}
                {isExterno && (
                  <div className="space-y-1.5 min-w-0">
                    <label className="text-sm font-medium text-slate-700">
                      Valor do parceiro
                    </label>
                    <div className="flex items-center gap-1.5 h-11 w-full rounded-xl border border-violet-200 bg-white px-3 shadow-sm transition-all hover:shadow-md focus-within:ring-2 focus-within:ring-violet-100 focus-within:border-violet-500">
                      <span className="text-sm text-violet-400 shrink-0">R$</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={valorParceiro}
                        onChange={handleValorParceiroChange}
                        placeholder="0,00"
                        className="w-full min-w-0 text-sm text-slate-700 outline-none bg-transparent"
                      />
                    </div>
                  </div>
                )}
              </div>

              <p className="text-xs text-slate-400">
                Usado nos relatórios de custo por máquina{isExterno ? " e por parceiro" : ""}.
              </p>
            </div>
          </TabsContent>

          {/* TAB ANEXOS */}
          <TabsContent
            value="anexos"
            forceMount
            className="flex-1 overflow-y-auto px-4 sm:px-6 pb-6 mt-4 data-[state=inactive]:hidden"
          >
            {loadingAttachments ? (
              <div className="flex flex-col items-center justify-center gap-2 py-10 text-slate-400">
                <Loader2 size={20} className="animate-spin" />
                <p className="text-xs">Carregando anexos...</p>
              </div>
            ) : (
              <AttachmentUploader
                newFiles={newFiles}
                onChangeNewFiles={setNewFiles}
                existingAttachments={existingAttachments}
                removedIds={removedIds}
                onRemoveExisting={handleRemoveExisting}
                onRestoreExisting={handleRestoreExisting}
              />
            )}
          </TabsContent>
        </Tabs>

        {/* FOOTER */}
        <div className="flex justify-end gap-2 px-4 sm:px-6 py-4 border-t border-slate-100 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-100 transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" />
                Finalizando...
              </span>
            ) : (
              "Finalizar"
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
