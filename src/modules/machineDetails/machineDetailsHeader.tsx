import { useState, useEffect, useCallback } from "react";
import {
  ChevronDown,
  ChevronUp,
  Paperclip,
  X,
  Eye,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  AlertCircle,
} from "lucide-react";

import type { Machine } from "./machineDetailsTypes";
import type { Setor } from "@/modules/machine/machineTypes";
import type { Anexo } from "@/modules/attachment/attachmentTypes";
import { getMachineAttachments } from "@/modules/attachment/attachmentService";

const statusStyles = {
  ativa: "bg-green-50 text-green-700 ring-1 ring-green-200",
  manutencao: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  inativa: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
} as const;

function resolveType(nameOrMime: string): "image" | "pdf" | "other" {
  if (/\.(jpg|jpeg|png|webp|gif)$/i.test(nameOrMime) || nameOrMime.startsWith("image/")) return "image";
  if (/\.pdf$/i.test(nameOrMime) || nameOrMime === "application/pdf") return "pdf";
  return "other";
}

function anexoType(anexo: Anexo) {
  return resolveType(anexo.tipo_arquivo ?? anexo.nome_arquivo);
}

export function MachineDetailsHeader({
  machine,
  sectors,
}: {
  machine: Machine;
  sectors: Setor[];
}) {
  const [open, setOpen] = useState(false);
  const [attachmentsOpen, setAttachmentsOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  const [attachments, setAttachments] = useState<Anexo[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [attachmentsError, setAttachmentsError] = useState<string | null>(null);
  const [loadedOnce, setLoadedOnce] = useState(false);

  const setorNome = sectors.find(
    (s) => s.id === machine.setor_id
  )?.nome;

  const statusKey = (machine.status?.toLowerCase() || "inativa") as
    | "ativa"
    | "manutencao"
    | "inativa";

  const fetchAttachments = useCallback(async () => {
    setLoadingAttachments(true);
    setAttachmentsError(null);
    try {
      const data = await getMachineAttachments(machine.id);
      setAttachments(data);
      setLoadedOnce(true);
    } catch (err) {
      console.error(err);
      setAttachmentsError("Não foi possível carregar os anexos.");
    } finally {
      setLoadingAttachments(false);
    }
  }, [machine.id]);

  // Busca a contagem assim que o card monta, pra já mostrar no botão
  useEffect(() => {
    fetchAttachments();
  }, [fetchAttachments]);

  function handleOpenAttachments() {
    setAttachmentsOpen(true);
    // Se a primeira busca falhou ou ainda não rodou, tenta de novo ao abrir
    if (!loadedOnce || attachmentsError) {
      fetchAttachments();
    }
  }

  const previewable = attachments.filter((a) => anexoType(a) !== "other");
  const current = previewIndex !== null ? previewable[previewIndex] : null;

  function openAttachment(anexo: Anexo) {
    const t = anexoType(anexo);
    if (t === "other") {
      window.open(anexo.url_arquivo, "_blank", "noopener,noreferrer");
      return;
    }
    const idx = previewable.findIndex((a) => a.id === anexo.id);
    setPreviewIndex(idx);
  }

  function navigate(direction: "prev" | "next") {
    if (previewIndex === null) return;
    const next =
      direction === "prev"
        ? (previewIndex - 1 + previewable.length) % previewable.length
        : (previewIndex + 1) % previewable.length;
    setPreviewIndex(next);
  }

  return (
    <div
      className="
        w-full
        bg-gradient-to-br
        from-blue-50
        via-white
        to-blue-100
        border
        border-slate-300/60
        rounded-xl
        shadow-sm
        overflow-hidden
      "
    >
      {/* HEADER MOBILE */}
      <button
        onClick={() => setOpen(!open)}
        className="
          sm:hidden
          w-full
          flex
          items-center
          justify-between
          px-4
          py-3
        "
      >
        <div>
          <h1 className="text-sm font-semibold text-slate-900 text-left">
            {machine.nome}
          </h1>

          <span className="text-xs text-slate-500">
            ID #{machine.id}
          </span>
        </div>

        {open ? (
          <ChevronUp size={18} />
        ) : (
          <ChevronDown size={18} />
        )}
      </button>

      <div
        className={`
          transition-all duration-300 overflow-hidden
          ${open ? "max-h-[700px] opacity-100" : "max-h-0 opacity-0"}
          sm:max-h-none
          sm:opacity-100
        `}
      >
        <div className="flex flex-col sm:flex-row">

          {/* FOTO */}
          <div
            className="
              w-full
              sm:w-[120px]
              sm:shrink-0
              border-b
              sm:border-b-0
              sm:border-r
              border-slate-200
            "
          >
            {machine.imagem_url ? (
              <img
                src={machine.imagem_url}
                alt={machine.nome}
                className="
                  w-full
                  h-[90px]
                  sm:h-full
                  object-cover
                "
              />
            ) : (
              <div
                className="
                  w-full
                  h-[90px]
                  sm:h-full
                  flex
                  items-center
                  justify-center
                  text-slate-400
                  text-xs
                  bg-slate-100
                "
              >
                Sem foto
              </div>
            )}
          </div>

          {/* CONTEÚDO */}
          <div className="flex-1">
            {/* TOPO */}
            <div className="px-4 pt-3">
              <div className="flex flex-wrap items-center justify-between gap-2">

                <div>
                  <h1 className="hidden sm:block text-sm font-semibold text-slate-900">
                    {machine.nome}
                  </h1>

                  <span className="hidden sm:block text-[11px] text-slate-500">
                    ID #{machine.id}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-xs px-3 py-1 rounded-md bg-indigo-50 text-indigo-600 border border-indigo-100">
                    <span className="text-indigo-400 font-medium">
                      Setor:
                    </span>{" "}
                    {setorNome ?? "—"}
                  </div>

                  <span
                    className={`
                      px-2 py-1
                      rounded-full
                      text-[10px]
                      font-medium
                      ${statusStyles[statusKey]}
                    `}
                  >
                    {machine.status}
                  </span>

                  {/* BOTÃO DE ANEXOS — com destaque, antes do QR Code */}
                  <button
                    type="button"
                    onClick={handleOpenAttachments}
                    className="
                      relative
                      flex items-center gap-1.5
                      text-xs font-semibold
                      pl-2.5 pr-3 py-1.5
                      rounded-md
                      bg-blue-600
                      text-white
                      shadow-sm
                      shadow-blue-600/20
                      hover:bg-blue-700
                      active:scale-[0.97]
                      transition-all
                    "
                  >
                    <Paperclip size={13} />
                    Ver anexos
                    {attachments.length > 0 && (
                      <span
                        className="
                          flex items-center justify-center
                          min-w-[16px] h-4 px-1
                          rounded-full
                          bg-white
                          text-blue-700
                          text-[10px]
                          font-bold
                          leading-none
                        "
                      >
                        {attachments.length}
                      </span>
                    )}
                  </button>

                  {machine.qr_code && (
                    <div className="p-1 bg-slate-50 border border-slate-200 rounded-md">
                      <img
                        src={machine.qr_code}
                        alt="QR Code"
                        className="w-8 h-8"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* DADOS */}
            <div
              className="
                grid
                grid-cols-2
                sm:grid-cols-3
                gap-x-4
                gap-y-2
                px-4
                py-6
                text-[12px]
                sm:text-[11px]
              "
            >
              <div>
                <span className="text-slate-500">Modelo:</span>{" "}
                {machine.modelo}
              </div>

              <div>
                <span className="text-slate-500">Fabricante:</span>{" "}
                {machine.fabricante}
              </div>

              <div>
                <span className="text-slate-500">Ano:</span>{" "}
                {machine.ano}
              </div>

              <div>
                <span className="text-slate-500">Intervalo:</span>{" "}
                {machine.intervalo_manutencao_dias}d
              </div>

              <div>
                <span className="text-slate-500">Última:</span>{" "}
                {machine.ultima_manutencao
                  ? new Date(machine.ultima_manutencao).toLocaleDateString("pt-BR")
                  : "—"}
              </div>

              <div>
                <span className="text-slate-500">Próxima:</span>{" "}
                {machine.proxima_manutencao
                  ? new Date(machine.proxima_manutencao).toLocaleDateString("pt-BR")
                  : "—"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL - LISTA DE ANEXOS JÁ ENVIADOS */}
      {attachmentsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setAttachmentsOpen(false)}
        >
          <div
            className="relative bg-white rounded-2xl shadow-2xl overflow-hidden max-w-md w-full max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 shrink-0">
              <p className="text-sm font-semibold text-slate-800">
                Anexos
                {attachments.length > 0 && (
                  <span className="ml-1.5 text-xs font-normal text-slate-400">
                    ({attachments.length})
                  </span>
                )}
              </p>
              <button
                type="button"
                onClick={() => setAttachmentsOpen(false)}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 transition"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {loadingAttachments && (
                <div className="flex flex-col items-center justify-center gap-2 py-10 text-slate-400">
                  <Loader2 size={20} className="animate-spin" />
                  <p className="text-xs">Carregando anexos...</p>
                </div>
              )}

              {!loadingAttachments && attachmentsError && (
                <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                  <AlertCircle size={20} className="text-rose-400" />
                  <p className="text-xs text-slate-500">{attachmentsError}</p>
                  <button
                    type="button"
                    onClick={fetchAttachments}
                    className="text-xs font-medium text-blue-600 hover:underline"
                  >
                    Tentar novamente
                  </button>
                </div>
              )}

              {!loadingAttachments && !attachmentsError && attachments.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-6">
                  Nenhum anexo cadastrado.
                </p>
              )}

              {!loadingAttachments && !attachmentsError && attachments.map((anexo) => {
                const t = anexoType(anexo);
                const isImg = t === "image";
                return (
                  <div
                    key={anexo.id}
                    onClick={() => openAttachment(anexo)}
                    className="flex items-center gap-3 p-2 border border-slate-200 rounded-xl bg-white cursor-pointer hover:border-blue-200 hover:bg-blue-50/40 transition"
                  >
                    {isImg ? (
                      <img
                        src={anexo.url_arquivo}
                        alt={anexo.nome_arquivo}
                        className="h-10 w-10 rounded-lg object-cover border border-slate-200 shrink-0"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 text-lg">
                        {t === "pdf" ? "📄" : "📎"}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-700 truncate">{anexo.nome_arquivo}</p>
                    </div>
                    {t === "other" ? (
                      <Download size={15} className="text-slate-400 shrink-0" />
                    ) : (
                      <Eye size={15} className="text-blue-400 shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL - PREVIEW DE IMAGEM / PDF */}
      {current && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setPreviewIndex(null)}
        >
          <div
            className="relative bg-white rounded-2xl shadow-2xl overflow-hidden max-w-3xl w-full max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 shrink-0">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-800 truncate">{current.nome_arquivo}</p>
                {previewable.length > 1 && (
                  <p className="text-xs text-slate-400">
                    {previewIndex! + 1} de {previewable.length}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 ml-3 shrink-0">
                <button
                  type="button"
                  onClick={() => window.open(current.url_arquivo, "_blank")}
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 transition"
                  title="Abrir em nova aba"
                >
                  <ExternalLink size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewIndex(null)}
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 transition"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto flex items-center justify-center bg-slate-50 min-h-0">
              {anexoType(current) === "image" ? (
                <img src={current.url_arquivo} alt="preview" className="max-w-full max-h-full object-contain p-4" />
              ) : (
                <iframe src={current.url_arquivo} className="w-full h-full min-h-[60vh]" title="preview pdf" />
              )}
            </div>

            {previewable.length > 1 && (
              <div className="flex items-center justify-center gap-3 px-4 py-3 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => navigate("prev")}
                  className="h-8 w-8 rounded-lg flex items-center justify-center border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs text-slate-500">{previewIndex! + 1} / {previewable.length}</span>
                <button
                  type="button"
                  onClick={() => navigate("next")}
                  className="h-8 w-8 rounded-lg flex items-center justify-center border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
