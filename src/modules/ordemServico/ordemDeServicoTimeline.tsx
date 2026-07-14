import { useState, useEffect, useCallback } from "react";
import {
  ClipboardList, UserCheck, Wrench, CheckCircle2, XCircle,
  Paperclip, Eye, Download, ExternalLink, X,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  Loader2, AlertCircle,
} from "lucide-react";
import type { OrdemServico } from "../ordemServico/ordemServicoType";
import type { Anexo } from "@/modules/attachment/attachmentTypes";
import { getOSAttachments } from "@/modules/attachment/attachmentService";

type StatusOS = "aberta" | "atribuida" | "andamento" | "finalizada" | "cancelada";

type EventoOS = {
  id: number;
  titulo: string;
  descricao: string;
  data: string;
  status: StatusOS;
  origemAnexo?: "OS_ABERTURA" | "OS_FECHAMENTO";
};

const STATUS_CONFIG = {
  aberta: {
    icon: ClipboardList,
    bg: "bg-blue-50",
    iconColor: "text-blue-500",
    label: "bg-blue-50 text-blue-600 border-blue-100",
    text: "Aberta",
  },
  atribuida: {
    icon: UserCheck,
    bg: "bg-indigo-50",
    iconColor: "text-indigo-500",
    label: "bg-indigo-50 text-indigo-600 border-indigo-100",
    text: "Atribuída",
  },
  andamento: {
    icon: Wrench,
    bg: "bg-amber-50",
    iconColor: "text-amber-500",
    label: "bg-amber-50 text-amber-600 border-amber-100",
    text: "Em andamento",
  },
  finalizada: {
    icon: CheckCircle2,
    bg: "bg-emerald-50",
    iconColor: "text-emerald-500",
    label: "bg-emerald-50 text-emerald-600 border-emerald-100",
    text: "Finalizada",
  },
  cancelada: {
    icon: XCircle,
    bg: "bg-red-50",
    iconColor: "text-red-400",
    label: "bg-red-50 text-red-600 border-red-100",
    text: "Cancelada",
  },
} as const;

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function resolveType(nameOrMime: string): "image" | "pdf" | "other" {
  if (/\.(jpg|jpeg|png|webp|gif)$/i.test(nameOrMime) || nameOrMime.startsWith("image/")) return "image";
  if (/\.pdf$/i.test(nameOrMime) || nameOrMime === "application/pdf") return "pdf";
  return "other";
}

function anexoType(anexo: Anexo): "image" | "pdf" | "other" {
  return resolveType(anexo.tipo_arquivo ?? anexo.nome_arquivo);
}

// ── Sub-componente: botão + lista expansível de anexos ───
function AnexosEvento({
  anexos,
  loading,
  error,
  onRetry,
  onOpenPreview,
}: {
  anexos: Anexo[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onOpenPreview: (anexo: Anexo) => void;
}) {
  const [open, setOpen] = useState(false);

  const label = loading
    ? "Carregando..."
    : anexos.length > 0
    ? `${anexos.length} anexo${anexos.length > 1 ? "s" : ""}`
    : "Sem anexos";

  return (
    <div className="mt-2">
      {/* botão toggle */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={loading}
        className="flex items-center gap-1.5 text-xs text-blue-500 hover:text-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading
          ? <Loader2 size={12} className="animate-spin" />
          : <Paperclip size={12} />
        }
        {label}
        {!loading && (open ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
      </button>

      {/* conteúdo expansível */}
      {open && (
        <div className="mt-2 flex flex-col gap-1.5">
          {error && (
            <div className="flex items-center gap-2 text-xs text-rose-500">
              <AlertCircle size={12} />
              {error}
              <button
                type="button"
                onClick={onRetry}
                className="underline hover:text-rose-700"
              >
                Tentar novamente
              </button>
            </div>
          )}

          {!error && anexos.length === 0 && (
            <p className="text-xs text-slate-400 italic">Nenhum anexo.</p>
          )}

          {!error && anexos.map((anexo) => {
            const t = anexoType(anexo);
            const isImg = t === "image";
            const canPreview = t !== "other";

            return (
              <div
                key={anexo.id}
                className="flex items-center gap-2 p-2 rounded-lg border border-slate-100 bg-white hover:border-blue-200 hover:bg-blue-50/30 transition"
              >
                {/* thumbnail ou emoji */}
                {isImg ? (
                  <div
                    onClick={() => onOpenPreview(anexo)}
                    className="w-8 h-8 rounded-md overflow-hidden border border-slate-200 shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <img
                      src={anexo.url_arquivo}
                      alt={anexo.nome_arquivo}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-md bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 text-base">
                    {t === "pdf" ? "📄" : /\.(doc|docx)/i.test(anexo.nome_arquivo) ? "📝" : /\.(xls|xlsx)/i.test(anexo.nome_arquivo) ? "📊" : "📎"}
                  </div>
                )}

                {/* nome */}
                <p className="flex-1 min-w-0 text-xs text-slate-700 truncate">
                  {anexo.nome_arquivo}
                </p>

                {/* ação */}
                {canPreview ? (
                  <button
                    type="button"
                    onClick={() => onOpenPreview(anexo)}
                    className="h-6 w-6 rounded-md flex items-center justify-center text-blue-500 hover:bg-blue-50 transition shrink-0"
                    title="Visualizar"
                  >
                    <Eye size={13} />
                  </button>
                ) : (
                  
                    <a href={anexo.url_arquivo}
                    download={anexo.nome_arquivo}
                    target="_blank"
                    rel="noreferrer"
                    className="h-6 w-6 rounded-md flex items-center justify-center text-slate-500 hover:bg-slate-100 transition shrink-0"
                    title="Baixar"
                  >
                    <Download size={13} />
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Componente principal ─────────────────────────────────
interface Props {
  os: OrdemServico;
  onClose?: () => void;
}

export function OrdemServicoTimeline({ os, onClose }: Props) {
  const [anexos, setAnexos] = useState<Anexo[]>([]);
  const [loadingAnexos, setLoadingAnexos] = useState(true);
  const [anexosError, setAnexosError] = useState<string | null>(null);

  // Preview modal
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  const fetchAnexos = useCallback(async () => {
    setLoadingAnexos(true);
    setAnexosError(null);
    try {
      const data = await getOSAttachments(os.id);
      setAnexos(data);
    } catch {
      setAnexosError("Não foi possível carregar os anexos.");
    } finally {
      setLoadingAnexos(false);
    }
  }, [os.id]);

  useEffect(() => {
    fetchAnexos();
  }, [fetchAnexos]);

  const anexosAbertura = anexos.filter((a) => a.origem === "OS_ABERTURA");
  const anexosFechamento = anexos.filter((a) => a.origem === "OS_FECHAMENTO");

  // Lista de previewáveis para navegação no modal
  const previewable = anexos.filter((a) => anexoType(a) !== "other");
  const current = previewIndex !== null ? previewable[previewIndex] : null;

  function openPreview(anexo: Anexo) {
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

  // ── monta eventos ────────────────────────────────────────
  const eventos: EventoOS[] = [];

  eventos.push({
    id: 1,
    titulo: "Abertura da OS",
    descricao: os.descricao,
    data: os.data_abertura ?? new Date().toISOString(),
    status: "aberta",
    origemAnexo: "OS_ABERTURA",
  });

  if (os.data_atribuicao) {
    eventos.push({
      id: 2,
      titulo: "Atribuição ao técnico",
      descricao: os.id_tecnico
        ? `OS designada ao técnico #${os.id_tecnico}`
        : "Ordem de serviço designada para um técnico responsável",
      data: os.data_atribuicao,
      status: "atribuida",
    });
  }

  if (os.data_inicio_atendimento) {
    eventos.push({
      id: 3,
      titulo: "Em andamento",
      descricao: "Técnico iniciou o atendimento",
      data: os.data_inicio_atendimento,
      status: "andamento",
    });
  }

  if (os.data_resolucao && os.status?.toUpperCase() === "FINALIZADA") {
    eventos.push({
      id: 4,
      titulo: "Finalização",
      descricao: os.resolucao ?? "Serviço concluído com sucesso",
      data: os.data_resolucao,
      status: "finalizada",
      origemAnexo: "OS_FECHAMENTO",
    });
  }

  if (os.data_cancelamento && os.status?.toUpperCase() === "CANCELADA") {
    eventos.push({
      id: 4,
      titulo: "Cancelamento",
      descricao: os.motivo_cancelamento ?? "Ordem de serviço cancelada",
      data: os.data_cancelamento,
      status: "cancelada",
      origemAnexo: "OS_FECHAMENTO",
    });
  }

  return (
    <>
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm w-full">

        {/* HEADER */}
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 rounded-t-2xl flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <span className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
              Ordem de Serviço
            </span>
            <h2 className="text-lg font-bold text-slate-900 truncate">
              OS #{os.id}
            </h2>

          </div>
          <button
            onClick={onClose}
            style={{ lineHeight: 1 }}
            className="flex-shrink-0 mt-1 w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:bg-slate-200 hover:text-slate-600"
            aria-label="Fechar"
          >
            <span style={{ fontSize: 18, fontWeight: 300, letterSpacing: 0 }}>×</span>
          </button>
        </div>

        {/* TIMELINE */}
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          <div className="flex flex-col">
            {eventos.map((ev, index) => {
              const isLast = index === eventos.length - 1;
              const cfg = STATUS_CONFIG[ev.status];
              const Icon = cfg.icon;

              const anexosEvento =
                ev.origemAnexo === "OS_ABERTURA"
                  ? anexosAbertura
                  : ev.origemAnexo === "OS_FECHAMENTO"
                  ? anexosFechamento
                  : null;

              return (
                <div key={ev.id} className="flex gap-3">

                  {/* ÍCONE + LINHA */}
                  <div className="flex flex-col items-center">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center border border-slate-200 ${cfg.bg}`}>
                      <Icon size={16} className={cfg.iconColor} />
                    </div>
                    {!isLast && <div className="w-px flex-1 bg-slate-200 my-1" />}
                  </div>

                  {/* CONTEÚDO */}
                  <div className={`flex-1 min-w-0 ${isLast ? "pb-0" : "pb-3"}`}>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-slate-900">{ev.titulo}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${cfg.label}`}>
                        {cfg.text}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed mb-1">{ev.descricao}</p>
                    <span className="text-[11px] text-slate-400">{formatDate(ev.data)}</span>

                    {/* ANEXOS — só abertura e finalização/cancelamento */}
                    {anexosEvento !== null && (
                      <AnexosEvento
                        anexos={anexosEvento}
                        loading={loadingAnexos}
                        error={anexosError}
                        onRetry={fetchAnexos}
                        onOpenPreview={openPreview}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* MODAL DE PREVIEW — mesmo padrão do sistema */}
      {current && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
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
    </>
  );
}