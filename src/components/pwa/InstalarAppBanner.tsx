import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";

import { LogoIcone } from "@/components/brand/Logo";

/** Evento que o Chrome/Android dispara quando o app pode ser instalado (não existe tipo pronto no DOM lib). */
type EventoDeInstalar = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const CHAVE_DISPENSADO = "mymaq360_instalar_dispensado";

function estaInstalado(): boolean {
  try {
    return window.matchMedia("(display-mode: standalone)").matches || (window.navigator as unknown as { standalone?: boolean }).standalone === true;
  } catch {
    return false;
  }
}

const ehIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);

/**
 * Convite para instalar o app na tela inicial, num jeito mais fácil de achar do que o menu do
 * navegador. Só aparece no celular (a tela pequena é a pista de que é um celular), quando o app
 * ainda não está instalado, e some se a pessoa fechar (guarda a escolha, não pergunta de novo).
 */
export function InstalarAppBanner() {
  const [evento, setEvento] = useState<EventoDeInstalar | null>(null);
  const [mostrarPassoAPasso, setMostrarPassoAPasso] = useState(false);
  const [dispensado, setDispensado] = useState(() => {
    try {
      return localStorage.getItem(CHAVE_DISPENSADO) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (estaInstalado()) return;

    // iPhone: nunca tem o botão de instalar automático (a Apple não oferece essa função em
    // nenhum navegador do aparelho, nem Chrome — todos usam o motor da Safari por baixo). Prioriza
    // sempre o passo a passo manual, sem depender do evento abaixo.
    if (ehIOS()) {
      setMostrarPassoAPasso(true);
      return;
    }

    // Android/Chrome: o navegador avisa quando pode instalar; guardamos o evento para acionar no clique
    function aoOferecer(e: Event) {
      e.preventDefault();
      setEvento(e as EventoDeInstalar);
    }
    window.addEventListener("beforeinstallprompt", aoOferecer);

    return () => window.removeEventListener("beforeinstallprompt", aoOferecer);
  }, []);

  function dispensar() {
    setDispensado(true);
    try {
      localStorage.setItem(CHAVE_DISPENSADO, "1");
    } catch {
      // sem localStorage: só não lembra na próxima visita
    }
  }

  async function instalar() {
    if (!evento) return;
    await evento.prompt();
    await evento.userChoice.catch(() => null);
    setEvento(null);
  }

  if (dispensado || estaInstalado() || (!evento && !mostrarPassoAPasso)) return null;

  return (
    <div
      role="complementary"
      aria-label="Instalar o aplicativo"
      className="sm:hidden fixed inset-x-3 bottom-3 z-40 flex items-center gap-3 rounded-2xl border border-blue-100 bg-white p-3 shadow-lg"
    >
      <LogoIcone size={36} className="shrink-0" />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-900">Instalar o MYMAQ360</p>
        {evento ? (
          <p className="truncate text-xs text-slate-500">Acesso rápido, direto da tela inicial</p>
        ) : (
          <p className="flex items-center gap-1 text-xs text-slate-500">
            Toque em <Share size={12} aria-hidden="true" /> e depois em "Adicionar à Tela de Início"
          </p>
        )}
      </div>

      {evento && (
        <button
          type="button"
          onClick={instalar}
          className="flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Download size={14} aria-hidden="true" /> Instalar
        </button>
      )}

      <button
        type="button"
        onClick={dispensar}
        aria-label="Fechar aviso de instalação"
        className="flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-600"
      >
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
