import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Image as ImageIcon,
  ExternalLink,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  RotateCcw,
} from "lucide-react";

import type { Anexo } from "@/modules/attachment/attachmentTypes";
import { getOSAttachments } from "@/modules/attachment/attachmentService";

type Props = {
  osId: number;
};

function resolveType(nameOrMime: string): "image" | "pdf" | "other" {
  if (/\.(jpg|jpeg|png|webp|gif)$/i.test(nameOrMime) || nameOrMime.startsWith("image/")) {
    return "image";
  }
  if (/\.pdf$/i.test(nameOrMime) || nameOrMime === "application/pdf") {
    return "pdf";
  }
  return "other";
}

function anexoType(anexo: Anexo): "image" | "pdf" | "other" {
  return resolveType(anexo.tipo_arquivo ?? anexo.nome_arquivo);
}

// quantas miniaturas mostrar de cada vez, por seção — 2 linhas de 4
// numa grade previsível, com setinhas pra paginar o resto
const PAGE_SIZE = 8;

function Thumb({ anexo, onOpen }: { anexo: Anexo; onOpen: (anexo: Anexo) => void }) {
  const isImg = anexoType(anexo) === "image";

  return (
    <button
      type="button"
      onClick={() => onOpen(anexo)}
      title={anexo.nome_arquivo}
     className="
  group h-16 w-16 rounded-lg overflow-hidden
  border border-slate-200 bg-slate-50
  hover:border-blue-300 transition-colors
"
    >
      {isImg ? (
        <img
          src={anexo.url_arquivo}
          alt={anexo.nome_arquivo}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
        />
      ) : (
        <div className="h-full flex items-center justify-center text-xl">📄</div>
      )}
    </button>
  );
}

// ── uma seção de fotos (abertura OU fechamento) ───────────
// título neutro em uppercase (mesmo padrão de rótulo já usado no
// resto da tela), grid pequeno de miniaturas, e setinhas de página
// só aparecem quando há mais fotos do que cabe numa página
function PhotoSection({
  titulo,
  anexos,
  onOpen,
}: {
  titulo: string;
  anexos: Anexo[];
  onOpen: (anexo: Anexo) => void;
}) {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(anexos.length / PAGE_SIZE));
  const visible = anexos.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  function prevPage() {
    setPage((p) => (p === 0 ? totalPages - 1 : p - 1));
  }

  function nextPage() {
    setPage((p) => (p === totalPages - 1 ? 0 : p + 1));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{titulo}</p>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400">
            {anexos.length} foto{anexos.length === 1 ? "" : "s"}
          </span>

          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={prevPage}
                aria-label={`${titulo} — página anterior`}
                className="h-6 w-6 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 transition"
              >
                <ChevronLeft size={13} />
              </button>
              <span className="text-[11px] text-slate-400 tabular-nums w-8 text-center">
                {page + 1}/{totalPages}
              </span>
              <button
                type="button"
                onClick={nextPage}
                aria-label={`${titulo} — próxima página`}
                className="h-6 w-6 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 transition"
              >
                <ChevronRight size={13} />
              </button>
            </div>
          )}
        </div>
      </div>

      {anexos.length === 0 ? (
        <div className="h-20 rounded-xl border border-dashed border-slate-200 flex items-center justify-center text-xs text-slate-400">
          Nenhuma foto
        </div>
      ) : (
       <div className="flex flex-wrap gap-1.5">
  {visible.map((anexo) => (
    <Thumb key={anexo.id} anexo={anexo} onOpen={onOpen} />
  ))}
</div>
      )}
    </div>
  );
}

export function OSPhotosGallery({ osId }: Props) {
  const [anexos, setAnexos] = useState<Anexo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  const fetchAnexos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getOSAttachments(osId);
      setAnexos(data ?? []);
    } catch (err) {
      console.error("Erro ao buscar fotos da OS:", err);
      setError("Não foi possível carregar as fotos.");
    } finally {
      setLoading(false);
    }
  }, [osId]);

  useEffect(() => {
    fetchAnexos();
  }, [fetchAnexos]);

  const anexosAbertura = anexos.filter((a) => a.origem === "OS_ABERTURA");
  const anexosFechamento = anexos.filter((a) => a.origem === "OS_FECHAMENTO");

  // navegação do modal considera as duas seções juntas, na ordem: abertura -> fechamento
  const previewable = [...anexosAbertura, ...anexosFechamento].filter((a) => anexoType(a) !== "other");
  const current = previewIndex !== null ? previewable[previewIndex] : null;

  function openPreview(anexo: Anexo) {
    if (anexoType(anexo) === "other") {
      window.open(anexo.url_arquivo, "_blank", "noopener,noreferrer");
      return;
    }
    const idx = previewable.findIndex((a) => a.id === anexo.id);
    setPreviewIndex(idx);
  }

  function navigate(direction: "prev" | "next") {
    setPreviewIndex((idx) => {
      if (idx === null || previewable.length === 0) return idx;
      return direction === "prev"
        ? (idx - 1 + previewable.length) % previewable.length
        : (idx + 1) % previewable.length;
    });
  }

  // fecha com Esc, navega com as setas do teclado
  useEffect(() => {
    if (previewIndex === null) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setPreviewIndex(null);
      if (e.key === "ArrowLeft") navigate("prev");
      if (e.key === "ArrowRight") navigate("next");
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewIndex, previewable.length]);

  // trava o scroll do body enquanto o modal está aberto, preservando a
  // posição de rolagem (evita o "pulo" ao fechar no mobile)
  useEffect(() => {
    if (previewIndex === null) return;

    const original = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
    };
    const scrollY = window.scrollY;

    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";

    return () => {
      document.body.style.overflow = original.overflow;
      document.body.style.position = original.position;
      document.body.style.top = original.top;
      document.body.style.width = original.width;
      window.scrollTo(0, scrollY);
    };
  }, [previewIndex]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-4">
        <ImageIcon size={17} className="text-slate-400" />
        <h2 className="font-semibold text-slate-800 text-sm">Fotos da manutenção</h2>
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 py-10 text-slate-400">
          <Loader2 size={16} className="animate-spin" />
          <span className="text-sm">Carregando fotos...</span>
        </div>
      )}

      {!loading && error && (
        <div className="flex flex-col items-center justify-center gap-2 py-10 text-slate-400">
          <AlertCircle size={20} className="text-amber-400" />
          <p className="text-sm">{error}</p>
          <button
            onClick={fetchAnexos}
            className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            <RotateCcw size={13} />
            Tentar de novo
          </button>
        </div>
      )}

      {!loading && !error && anexos.length === 0 && (
        <div className="h-28 rounded-xl border border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-sm">
          Nenhuma foto anexada
        </div>
      )}

      {!loading && !error && anexos.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-4">
          <PhotoSection titulo="Fotos da abertura" anexos={anexosAbertura} onOpen={openPreview} />
          <PhotoSection titulo="Fotos da execução/fechamento" anexos={anexosFechamento} onOpen={openPreview} />
        </div>
      )}

      {/* MODAL FULLSCREEN — via portal, fora de qualquer container
          transformado (evita o bug de "tremer" no mobile quando esse
          componente é usado dentro de outro container com transform) */}
      {current &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-2 sm:p-6"
            onClick={() => setPreviewIndex(null)}
          >
            <div
              className="relative bg-black rounded-xl sm:rounded-2xl overflow-hidden w-full h-full sm:w-auto sm:h-auto sm:max-w-4xl sm:max-h-[85vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 py-3 shrink-0 bg-black/60 text-white">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{current.nome_arquivo}</p>
                  {previewable.length > 1 && (
                    <p className="text-xs text-white/60">
                      {previewIndex! + 1} de {previewable.length}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 ml-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => window.open(current.url_arquivo, "_blank")}
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-white/80 hover:bg-white/10 transition"
                    title="Abrir original"
                  >
                    <ExternalLink size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewIndex(null)}
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-white/80 hover:bg-white/10 transition"
                    title="Fechar"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="flex-1 min-h-0 flex items-center justify-center overflow-auto">
                {anexoType(current) === "image" ? (
                  <img src={current.url_arquivo} alt={current.nome_arquivo} className="max-w-full max-h-full object-contain" />
                ) : (
                  <iframe src={current.url_arquivo} className="w-full h-full min-h-[60vh] bg-white" title="preview" />
                )}
              </div>

              {previewable.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => navigate("prev")}
                    className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition"
                    aria-label="Foto anterior"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("next")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition"
                    aria-label="Próxima foto"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
