import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export type ImagemAmpliada = { src: string; titulo: string } | null;

/**
 * Visualizador de imagem em tela cheia (foto da máquina ou QR Code) — via portal,
 * pra não ficar preso ao overflow/rolagem da tabela (era exatamente isso que cortava
 * o zoom da última linha antes: um hover:scale que cresce "dentro" da célula, e
 * qualquer contêiner com overflow escondido no caminho corta o resultado). Mesmo
 * padrão do visualizador de fotos da O.S., só que genérico pra uma imagem só.
 */
export function ImagemAmpliadaModal({ aberto, onClose }: { aberto: ImagemAmpliada; onClose: () => void }) {
  useEffect(() => {
    if (!aberto) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [aberto, onClose]);

  // trava o scroll do body enquanto aberto, preservando a posição de rolagem
  useEffect(() => {
    if (!aberto) return;

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
  }, [aberto]);

  if (!aberto) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/85 p-4 sm:p-8"
      onClick={onClose}
    >
      <div
        className="relative flex w-full max-w-2xl flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex w-full items-center justify-between px-1">
          <p className="truncate text-sm font-medium text-white">{aberto.titulo}</p>
          <button
            type="button"
            onClick={onClose}
            title="Fechar"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/80 transition hover:bg-white/10"
          >
            <X size={18} />
          </button>
        </div>

        <img
          src={aberto.src}
          alt={aberto.titulo}
          className="max-h-[75vh] max-w-full rounded-xl bg-white object-contain shadow-2xl"
        />
      </div>
    </div>,
    document.body
  );
}
