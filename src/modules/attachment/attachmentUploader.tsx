import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Upload, X, Eye, ChevronLeft, ChevronRight, RotateCcw, ExternalLink, Download,
} from "lucide-react";
import type { ExistingAttachment } from "@/components/modals/machine/AdicionarEditarMachine";

type PreviewState = {
  url: string;
  name: string;
  size?: number;
  type: "image" | "pdf";
  navIndex: number;
  kind: "new" | "existing";
};

type NavItem =
  | { kind: "new"; fileIndex: number; type: "image" | "pdf" }
  | { kind: "existing"; id: number; type: "image" | "pdf" };

type Props = {
  newFiles: File[];
  onChangeNewFiles: (files: File[]) => void;
  existingAttachments: ExistingAttachment[];
  removedIds: number[];
  onRemoveExisting: (id: number) => void;
  onRestoreExisting: (id: number) => void;
};

// ── Comprime e normaliza fotos tiradas na hora ────────────
// Fotos de câmera saem gigantes (3-8MB, 4000x3000+) e guardam a
// orientação real num metadado EXIF em vez de nos pixels — cada
// navegador aplica essa rotação de um jeito, o que causa o efeito
// de "piscar/girar" que só aparece com fotos recém tiradas.
// createImageBitmap com imageOrientation:"from-image" já desenha os
// pixels na orientação correta, e o canvas reduz o tamanho — o
// arquivo final decodifica quase instantaneamente e nunca precisa
// re-rotacionar depois de renderizado.
async function normalizeAndCompressImage(
  file: File,
  maxDimension = 1920,
  quality = 0.82
): Promise<File> {
  const isImage =
    file.type.startsWith("image/") || /\.(jpe?g|png|webp|gif)$/i.test(file.name);

  // não mexe em PDF/DOC/etc — só imagens precisam desse tratamento
  if (!isImage) return file;

  // GIF perde a animação se for pro canvas — mantém como está
  if (file.type === "image/gif" || /\.gif$/i.test(file.name)) return file;

  try {
    if (typeof createImageBitmap !== "function") return file;

    const bitmap = await createImageBitmap(file, {
      imageOrientation: "from-image",
    });

    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const targetW = Math.max(1, Math.round(bitmap.width * scale));
    const targetH = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }

    ctx.drawImage(bitmap, 0, 0, targetW, targetH);
    bitmap.close();

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality)
    );

    if (!blob) return file;

    // se por acaso a compressão saiu maior que o original (raro,
    // acontece com imagens já muito pequenas), fica com o original
    if (blob.size >= file.size) return file;

    const newName = file.name.replace(/\.[^./\\]+$/, "") + ".jpg";
    return new File([blob], newName, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } catch (err) {
    // se der qualquer erro na compressão, segue com o arquivo original
    // em vez de travar o envio
    console.error("[AttachmentUploader] erro ao normalizar imagem:", err);
    return file;
  }
}

// ── Thumbnail ou ícone emoji dependendo do tipo ──────────
function FileThumb({
  src,
  name,
  mime,
  onClick,
}: {
  src?: string;
  name: string;
  mime?: string;
  onClick?: () => void;
}) {
  function getEmoji(n: string, m?: string) {
    const ref = m ?? n;
    if (/\.pdf$/i.test(ref) || ref === "application/pdf") return "📄";
    if (/\.(doc|docx)/i.test(n) || /word/i.test(ref)) return "📝";
    if (/\.(xls|xlsx)/i.test(n) || /sheet|excel/i.test(ref)) return "📊";
    return "📎";
  }

  if (src) {
    return (
      <div
        onClick={onClick}
        className={`h-10 w-10 rounded-lg overflow-hidden border border-slate-200 shrink-0 ${onClick ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}`}
      >
        <img src={src} alt={name} className="w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <div className="h-10 w-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 text-lg">
      {getEmoji(name, mime)}
    </div>
  );
}

export function AttachmentUploader({
  newFiles,
  onChangeNewFiles,
  existingAttachments,
  removedIds,
  onRemoveExisting,
  onRestoreExisting,
}: Props) {
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [previewLoaded, setPreviewLoaded] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── trava o scroll do body enquanto o preview está aberto ─
  // Evita que a barra de endereço do celular esconder/aparecer
  // dispare um resize/reflow no meio da animação, e evita o
  // "rubber-band"/bounce do Safari iOS quando a página por trás
  // ainda pode ser arrastada — outra causa clássica de tremor em
  // overlay fixed no mobile.
  useEffect(() => {
    if (!preview) return;

    const original = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
      overscrollBehavior: document.body.style.overscrollBehavior,
    };
    const scrollY = window.scrollY;

    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    document.body.style.overscrollBehavior = "contain";

    return () => {
      document.body.style.overflow = original.overflow;
      document.body.style.position = original.position;
      document.body.style.top = original.top;
      document.body.style.width = original.width;
      document.body.style.overscrollBehavior = original.overscrollBehavior;
      window.scrollTo(0, scrollY);
    };
  }, [preview]);

  // reseta o estado de "carregado" sempre que a URL do preview muda
  useEffect(() => {
    setPreviewLoaded(false);
  }, [preview?.url]);

  // ── cache de object URLs pra thumbnails ───────────────────
  // Sem isso, toda re-renderização criava uma blob URL NOVA pro
  // mesmo arquivo (URL.createObjectURL dentro do render), o navegador
  // tratava como imagem diferente e recarregava/redecodificava —
  // esse é o "piscar até estabilizar" no celular. Agora a URL só é
  // criada uma vez por arquivo e só é liberada quando ele sai da lista.
  const thumbUrlsRef = useRef<Map<File, string>>(new Map());
  const [, forceThumbUpdate] = useState(0);

  useEffect(() => {
    const cache = thumbUrlsRef.current;

    // libera URLs de arquivos que não estão mais na lista
    for (const [file, url] of cache) {
      if (!newFiles.includes(file)) {
        URL.revokeObjectURL(url);
        cache.delete(file);
      }
    }

    // cria URL só pros arquivos novos que ainda não têm uma
    let changed = false;
    newFiles.forEach((file) => {
      const isImage =
        /\.(jpg|jpeg|png|webp|gif)$/i.test(file.name) || file.type.startsWith("image/");
      if (isImage && !cache.has(file)) {
        cache.set(file, URL.createObjectURL(file));
        changed = true;
      }
    });

    if (changed) forceThumbUpdate((n) => n + 1);

    // libera tudo ao desmontar
    return () => {
      if (newFiles.length === 0) {
        for (const url of cache.values()) URL.revokeObjectURL(url);
        cache.clear();
      }
    };
  }, [newFiles]);

  const activeExisting = existingAttachments.filter((a) => !removedIds.includes(a.id));
  const removedExisting = existingAttachments.filter((a) => removedIds.includes(a.id));

  // ── helpers de tipo ──────────────────────────────────────
  function resolveType(nameOrMime: string): "image" | "pdf" | "other" {
    if (/\.(jpg|jpeg|png|webp|gif)$/i.test(nameOrMime) || nameOrMime.startsWith("image/")) return "image";
    if (/\.pdf$/i.test(nameOrMime) || nameOrMime === "application/pdf") return "pdf";
    return "other";
  }

  function fileType(file: File): "image" | "pdf" | "other" {
    return resolveType(file.type || file.name);
  }

  function attType(att: ExistingAttachment): "image" | "pdf" | "other" {
    return resolveType(att.tipo ?? att.nome);
  }

  function canPreview(t: "image" | "pdf" | "other"): t is "image" | "pdf" {
    return t === "image" || t === "pdf";
  }

  // ── lista unificada para navegação ───────────────────────
  const navList: NavItem[] = [
    ...activeExisting
      .filter((a) => canPreview(attType(a)))
      .map((a) => ({ kind: "existing" as const, id: a.id, type: attType(a) as "image" | "pdf" })),
    ...newFiles
      .map((f, i) => ({ kind: "new" as const, fileIndex: i, type: fileType(f) }))
      .filter((x): x is { kind: "new"; fileIndex: number; type: "image" | "pdf" } => canPreview(x.type)),
  ];

  // ── busca a URL cacheada (não cria nada durante o render) ─
  const getNewFileThumbUrl = useCallback((file: File): string | undefined => {
    return thumbUrlsRef.current.get(file);
  }, []);

  // ── abrir preview ────────────────────────────────────────
  function openPreviewExisting(att: ExistingAttachment) {
    const t = attType(att);
    if (!canPreview(t)) { window.open(att.url, "_blank", "noopener,noreferrer"); return; }
    const idx = navList.findIndex((n) => n.kind === "existing" && n.id === att.id);
    setPreview({ url: att.url, name: att.nome, size: att.tamanho, type: t, navIndex: idx, kind: "existing" });
  }

  function openPreviewNew(file: File, fileIndex: number) {
    const t = fileType(file);
    if (!canPreview(t)) { downloadFile(file); return; }
    // reaproveita a URL já cacheada pra imagem; só cria na hora pra PDF (não tem thumb)
    const url = thumbUrlsRef.current.get(file) ?? URL.createObjectURL(file);
    const idx = navList.findIndex((n) => n.kind === "new" && n.fileIndex === fileIndex);
    setPreview({ url, name: file.name, size: file.size, type: t, navIndex: idx, kind: "new" });
  }

  function navigatePreview(direction: "prev" | "next") {
    if (!preview) return;
    const next =
      direction === "prev"
        ? (preview.navIndex - 1 + navList.length) % navList.length
        : (preview.navIndex + 1) % navList.length;
    const target = navList[next];
    if (target.kind === "existing") {
      const att = activeExisting.find((a) => a.id === target.id)!;
      setPreview({ url: att.url, name: att.nome, size: att.tamanho, type: target.type, navIndex: next, kind: "existing" });
    } else {
      const file = newFiles[target.fileIndex];
      const url = thumbUrlsRef.current.get(file) ?? URL.createObjectURL(file);
      setPreview({ url, name: file.name, size: file.size, type: target.type, navIndex: next, kind: "new" });
    }
  }

  function closePreview() {
    setPreview(null);
  }

  // ── download para arquivos "other" ───────────────────────
  function downloadFile(file: File) {
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url; a.download = file.name; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // ── adicionar arquivos ───────────────────────────────────
  const [processingFiles, setProcessingFiles] = useState(false);

  async function addFiles(selected: File[]) {
    if (!selected.length) return;

    setProcessingFiles(true);
    try {
      const processed = await Promise.all(
        selected.map((f) => normalizeAndCompressImage(f))
      );
      onChangeNewFiles([...newFiles, ...processed]);
    } finally {
      setProcessingFiles(false);
    }
  }

  function handleSelectFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    void addFiles(files);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); setDragging(false);
    void addFiles(Array.from(e.dataTransfer.files));
  }

  function handleRemoveNew(index: number) {
    const navIdx = navList.findIndex((n) => n.kind === "new" && n.fileIndex === index);
    if (preview?.kind === "new" && preview.navIndex === navIdx) closePreview();
    onChangeNewFiles(newFiles.filter((_, i) => i !== index));
  }

  // ── helpers de UI ────────────────────────────────────────
  function formatSize(bytes?: number) {
    if (!bytes) return "";
    const kb = bytes / 1024;
    return kb < 1024 ? `${kb.toFixed(1)} KB` : `${(kb / 1024).toFixed(1)} MB`;
  }

  const totalVisible = activeExisting.length + newFiles.length;

  return (
    <div className="space-y-4">

      {/* DROPZONE */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onClick={() => !processingFiles && inputRef.current?.click()}
        className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-2xl p-8 transition-all ${
          processingFiles
            ? "border-blue-300 bg-blue-50/60 cursor-wait"
            : dragging
              ? "border-blue-500 bg-blue-50 scale-[1.01] cursor-pointer"
              : "border-slate-300 hover:border-blue-400 hover:bg-blue-50 cursor-pointer"
        }`}
      >
        {processingFiles ? (
          <>
            <div className="h-8 w-8 rounded-full border-2 border-blue-200 border-t-blue-500 animate-spin" />
            <div className="text-center">
              <p className="font-medium text-slate-700">Otimizando imagem...</p>
              <p className="text-sm text-slate-500 mt-1">Reduzindo tamanho pra um envio mais rápido</p>
            </div>
          </>
        ) : (
          <>
            <Upload size={32} className={dragging ? "text-blue-500" : "text-slate-400"} />
            <div className="text-center">
              <p className="font-medium text-slate-700">
                {dragging ? "Solte os arquivos aqui" : "Clique ou arraste arquivos"}
              </p>
              <p className="text-sm text-slate-500 mt-1">PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, WEBP</p>
            </div>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          multiple
          disabled={processingFiles}
          className="hidden"
          onChange={handleSelectFiles}
        />
      </div>

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-slate-700">Arquivos</h3>
        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
          {totalVisible} arquivo(s)
        </span>
      </div>

      {totalVisible === 0 && removedExisting.length === 0 && (
        <div className="border rounded-xl p-6 text-center text-sm text-slate-500">
          Nenhum arquivo selecionado.
        </div>
      )}

      {/* EXISTENTES ATIVOS */}
      {activeExisting.length > 0 && (
        <div className="space-y-2">
          {activeExisting.map((att) => {
            const t = attType(att);
            const isImg = t === "image";
            return (
              <div key={`existing-${att.id}`} className="flex items-center justify-between gap-3 p-3 border border-slate-200 rounded-xl bg-white">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <FileThumb
                    src={isImg ? att.url : undefined}
                    name={att.nome}
                    mime={att.tipo}
                    onClick={isImg ? () => openPreviewExisting(att) : undefined}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{att.nome}</p>
                    <p className="text-xs text-slate-400">
                      {formatSize(att.tamanho)}<span className="ml-1.5 text-slate-300">· salvo</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {canPreview(t) ? (
                    <button type="button" onClick={() => openPreviewExisting(att)}
                      className="h-8 w-8 rounded-lg flex items-center justify-center text-blue-500 hover:bg-blue-50 transition" title="Visualizar">
                      <Eye size={15} />
                    </button>
                  ) : (
                    <a href={att.url} download={att.nome} target="_blank" rel="noreferrer"
                      className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 transition" title="Baixar">
                      <Download size={15} />
                    </a>
                  )}
                  <button type="button" onClick={() => onRemoveExisting(att.id)}
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50 transition">
                    <X size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* NOVOS */}
      {newFiles.length > 0 && (
        <div className="space-y-2">
          {activeExisting.length > 0 && (
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide px-1">Novos</p>
          )}
          {newFiles.map((file, index) => {
            const t = fileType(file);
            const isImg = t === "image";
            const thumbUrl = isImg ? getNewFileThumbUrl(file) : undefined;
            return (
              <div key={`new-${file.name}-${index}`} className="flex items-center justify-between gap-3 p-3 border border-blue-100 rounded-xl bg-blue-50/40">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <FileThumb
                    src={thumbUrl}
                    name={file.name}
                    mime={file.type}
                    onClick={isImg ? () => openPreviewNew(file, index) : undefined}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{file.name}</p>
                    <p className="text-xs text-slate-400">
                      {formatSize(file.size)}<span className="ml-1.5 text-blue-400">· novo</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {canPreview(t) ? (
                    <button type="button" onClick={() => openPreviewNew(file, index)}
                      className="h-8 w-8 rounded-lg flex items-center justify-center text-blue-500 hover:bg-blue-100 transition" title="Visualizar">
                      <Eye size={15} />
                    </button>
                  ) : (
                    <button type="button" onClick={() => downloadFile(file)}
                      className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 transition" title="Baixar">
                      <Download size={15} />
                    </button>
                  )}
                  <button type="button" onClick={() => handleRemoveNew(index)}
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50 transition">
                    <X size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* REMOVIDOS */}
      {removedExisting.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide px-1">Serão removidos ao salvar</p>
          {removedExisting.map((att) => {
            const isImg = attType(att) === "image";
            return (
              <div key={`removed-${att.id}`} className="flex items-center justify-between gap-3 p-3 border border-slate-200 rounded-xl bg-slate-50 opacity-50">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <FileThumb
                    src={isImg ? att.url : undefined}
                    name={att.nome}
                    mime={att.tipo}
                  />
                  <p className="text-sm text-slate-500 truncate line-through">{att.nome}</p>
                </div>
                <button type="button" onClick={() => onRestoreExisting(att.id)}
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-200 transition shrink-0">
                  <RotateCcw size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-slate-400">
        Os arquivos serão enviados automaticamente após salvar a máquina.
      </p>

      {/* MODAL DE PREVIEW — via portal, pra sair da árvore do Dialog
          (o DialogContent do shadcn tem "transform" pra centralizar,
          e isso faz qualquer "position: fixed" dentro dele deixar de
          ser fixo à tela de verdade — no celular isso aparece como a
          tela inteira tremendo quando a barra de endereço recolhe/expande) */}
      {preview && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 transform-gpu"
          style={{ overscrollBehavior: "contain" }}
          onClick={closePreview}
        >
          <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden max-w-3xl w-full max-h-[85vh] flex flex-col transform-gpu" onClick={(e) => e.stopPropagation()}>

            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 shrink-0">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-800 truncate">{preview.name}</p>
                <p className="text-xs text-slate-400">
                  {formatSize(preview.size)}
                  {navList.length > 1 && (
                    <span className="ml-2 text-slate-300">· {preview.navIndex + 1} de {navList.length}</span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-1 ml-3 shrink-0">
                <button type="button" onClick={() => window.open(preview.url, "_blank")}
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 transition" title="Abrir em nova aba">
                  <ExternalLink size={15} />
                </button>
                <button type="button" onClick={closePreview}
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 transition">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* altura fixa reservada ANTES da imagem carregar — isso impede
                o layout de "pular"/piscar enquanto o conteúdo é decodificado */}
            <div className="relative flex-1 min-h-[50vh] overflow-auto flex items-center justify-center bg-slate-50">
              {!previewLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-8 w-8 rounded-full border-2 border-slate-200 border-t-blue-500 animate-spin" />
                </div>
              )}

              {preview.type === "image" && (
                <img
                  key={preview.url}
                  src={preview.url}
                  alt="preview"
                  decoding="async"
                  onLoad={() => setPreviewLoaded(true)}
                  className={`max-w-full max-h-full object-contain p-4 transition-opacity duration-200 ${
                    previewLoaded ? "opacity-100" : "opacity-0"
                  }`}
                />
              )}
              {preview.type === "pdf" && (
                <iframe
                  key={preview.url}
                  src={preview.url}
                  onLoad={() => setPreviewLoaded(true)}
                  className={`w-full h-full min-h-[60vh] transition-opacity duration-200 ${
                    previewLoaded ? "opacity-100" : "opacity-0"
                  }`}
                  title="preview pdf"
                />
              )}
            </div>

            {navList.length > 1 && (
              <div className="flex items-center justify-center gap-3 px-4 py-3 border-t border-slate-100 shrink-0">
                <button type="button" onClick={() => navigatePreview("prev")}
                  className="h-8 w-8 rounded-lg flex items-center justify-center border border-slate-200 text-slate-600 hover:bg-slate-50 transition">
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs text-slate-500">{preview.navIndex + 1} / {navList.length}</span>
                <button type="button" onClick={() => navigatePreview("next")}
                  className="h-8 w-8 rounded-lg flex items-center justify-center border border-slate-200 text-slate-600 hover:bg-slate-50 transition">
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
