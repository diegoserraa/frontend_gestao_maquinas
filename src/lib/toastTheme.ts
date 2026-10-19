import { useEffect, useState } from "react";

/**
 * Tema do toast (sonner), isolado de propósito — NÃO usa a classe `.dark`
 * na <html> (nem next-themes, nem nada parecido). O projeto tem um aviso
 * deliberado em index.css: vários componentes shadcn (Button, Badge, Input,
 * Tabs...) já vêm com classes `dark:` de fábrica, inertes só porque `.dark`
 * nunca é aplicada em lugar nenhum. Uma vez já tentamos ligar isso via
 * next-themes (attribute="class") pra sincronizar o toast com o tema da
 * tela de Monitoramento — e isso reativou aquelas classes adormecidas no
 * app inteiro (o menu lateral, por exemplo, ficou com as cores erradas).
 *
 * Esse módulo é só um pub-sub minúsculo: guarda o tema atual em memória e
 * avisa quem estiver ouvindo. Nada global no DOM, nada que vaze pra fora
 * do toast.
 */

type Tema = "light" | "dark";

let temaAtual: Tema = "light";
const ouvintes = new Set<() => void>();

export function setToastTheme(tema: Tema) {
  if (temaAtual === tema) return;
  temaAtual = tema;
  ouvintes.forEach((fn) => fn());
}

export function useToastTheme(): Tema {
  const [tema, setTema] = useState(temaAtual);

  useEffect(() => {
    const ouvinte = () => setTema(temaAtual);
    ouvintes.add(ouvinte);
    ouvinte(); // sincroniza caso tenha mudado entre o render e o efeito
    return () => {
      ouvintes.delete(ouvinte);
    };
  }, []);

  return tema;
}
