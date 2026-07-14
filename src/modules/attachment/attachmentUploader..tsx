import { useState, useRef } from "react";
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
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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

  // ── objectURLs para thumbnails de novos arquivos imagem ──
  // Criados inline no render — controlados por chave fileIndex
  function getNewFileThumbUrl(file: File): string | undefined {
    if (fileType(file) !== "image") return undefined;
    return URL.createObjectURL(file);
  }

  // ── abrir preview ────────────────────────────────────────
  function openPreviewExisting(att: ExistingAttachment) {
    const t = attType(att);
    if (!canPreview(t)) { window.open(att.url, "_blank", "noopener,noreferrer"); return; }
    if (preview?.kind === "new") URL.revokeObjectURL(preview.url);
    const idx = navList.findIndex((n) => n.kind === "existing" && n.id === att.id);
    setPreview({ url: att.url, name: att.nome, size: att.tamanho, type: t, navIndex: idx, kind: "existing" });
  }

  function openPreviewNew(file: File, fileIndex: number) {
    const t = fileType(file);
    if (!canPreview(t)) { downloadFile(file); return; }
    if (preview?.kind === "new") URL.revokeObjectURL(preview.url);
    const url = URL.createObjectURL(file);
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
    if (preview.kind === "new") URL.revokeObjectURL(preview.url);
    if (target.kind === "existing") {
      const att = activeExisting.find((a) => a.id === target.id)!;
      setPreview({ url: att.url, name: att.nome, size: att.tamanho, type: target.type, navIndex: next, kind: "existing" });
    } else {
      const file = newFiles[target.fileIndex];
      const url = URL.createObjectURL(file);
      setPreview({ url, name: file.name, size: file.size, type: target.type, navIndex: next, kind: "new" });
    }
  }

  function closePreview() {
    if (preview?.kind === "new") URL.revokeObjectURL(preview.url);
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
  function addFiles(selected: File[]) {
    if (!selected.length) return;
    onChangeNewFiles([...newFiles, ...selected]);
  }

  function handleSelectFiles(e: React.ChangeEvent<HTMLInputElement>) {
    addFiles(Array.from(e.target.files || []));
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); setDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
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
        onClick={() => inputRef.current?.click()}
        className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-2xl p-8 cursor-pointer transition-all ${
          dragging ? "border-blue-500 bg-blue-50 scale-[1.01]" : "border-slate-300 hover:border-blue-400 hover:bg-blue-50"
        }`}
      >
        <Upload size={32} className={dragging ? "text-blue-500" : "text-slate-400"} />
        <div className="text-center">
          <p className="font-medium text-slate-700">
            {dragging ? "Solte os arquivos aqui" : "Clique ou arraste arquivos"}
          </p>
          <p className="text-sm text-slate-500 mt-1">PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, WEBP</p>
        </div>
        <input ref={inputRef} type="file" multiple className="hidden" onChange={handleSelectFiles} />
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

      {/* MODAL DE PREVIEW */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={closePreview}>
          <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden max-w-3xl w-full max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>

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

            <div className="flex-1 overflow-auto flex items-center justify-center bg-slate-50 min-h-0">
              {preview.type === "image" && (
                <img src={preview.url} alt="preview" className="max-w-full max-h-full object-contain p-4" />
              )}
              {preview.type === "pdf" && (
                <iframe src={preview.url} className="w-full h-full min-h-[60vh]" title="preview pdf" />
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
        </div>
      )}
    </div>
  );
}