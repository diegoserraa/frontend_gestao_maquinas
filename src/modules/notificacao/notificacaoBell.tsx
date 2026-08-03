import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Loader2,
  Inbox,
  Settings2,
  Wrench,
  AlertTriangle,
  ListChecks,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import type { Notificacao } from "@/modules/notificacao/notificacaoType";
import {
  getContadorNotificacoes,
  getNotificacoes,
  marcarNotificacaoComoLida,
  marcarTodasNotificacoesComoLidas,
  excluirNotificacao,
} from "@/modules/notificacao/notificacaoService";
import { getUser } from "@/modules/login/loginStorage";

// ── Aparência por tipo de notificação ─────────────────────
// "tipo" é uma string livre vinda do backend (ex: "os_atribuida",
// "os_finalizada", "alerta", "sistema"...). Mapeamos os padrões mais
// comuns pra um ícone/cor; qualquer coisa fora disso cai no fallback.
// Só aplicamos a cor quando a notificação ainda está não lida — lida
// sempre vira cinza neutro (ver renderLista).
function getTipoStyle(tipo: string) {
  const t = tipo.toLowerCase();

  if (t.includes("atribu"))
    return { Icon: Wrench, color: "text-blue-600", bg: "bg-blue-100" };

  if (t.includes("finaliz") || t.includes("conclu"))
    return { Icon: CheckCheck, color: "text-emerald-600", bg: "bg-emerald-100" };

  if (t.includes("alerta") || t.includes("urgente") || t.includes("atras"))
    return { Icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-100" };

  return { Icon: Settings2, color: "text-slate-500", bg: "bg-slate-100" };
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return "agora mesmo";

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `há ${diffMin} min`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `há ${diffHour}h`;

  const diffDay = Math.floor(diffHour / 24);
  if (diffDay === 1) return "ontem";
  if (diffDay < 7) return `há ${diffDay} dias`;

  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

// Checkbox visual simples, sem depender de um componente externo
function CheckboxVisual({ checked }: { checked: boolean }) {
  return (
    <span
      className={`
        h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-colors
        ${checked ? "bg-blue-600 border-blue-600" : "bg-white border-slate-300"}
      `}
    >
      {checked && <Check size={11} className="text-white" strokeWidth={3} />}
    </span>
  );
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const [contador, setContador] = useState(0);

  const [lista, setLista] = useState<Notificacao[]>([]);
  const [loadingLista, setLoadingLista] = useState(false);

  const [marcandoTodas, setMarcandoTodas] = useState(false);
  const [excluindoId, setExcluindoId] = useState<number | null>(null);

  // ── seleção múltipla ─────────────────────────────────────
  const [selectionMode, setSelectionMode] = useState(false);
  const [selecionados, setSelecionados] = useState<Set<number>>(new Set());
  const [excluindoSelecionados, setExcluindoSelecionados] = useState(false);

  // evita refazer a busca toda vez que reabre o dropdown
  const carregouLista = useRef(false);

  const usuarioId: number | undefined = getUser()?.id;

  /* ── responsividade ─────────────────────────────────────── */
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /* ── fechar ao clicar fora / Esc ────────────────────────── */
  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        handleClose();
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  /* ── contador do sino (polling leve) ────────────────────── */
  const carregarContador = useCallback(async () => {
    if (!usuarioId) return;

    try {
      const response = await getContadorNotificacoes(usuarioId);
      setContador(response.total ?? 0);
    } catch (error) {
      console.error("Erro contador notificações", error);
    }
  }, [usuarioId]);

  useEffect(() => {
    carregarContador();
    const interval = setInterval(carregarContador, 30000);
    return () => clearInterval(interval);
  }, [carregarContador]);

  async function carregarLista(force = false) {
    if (!usuarioId) return;
    if (carregouLista.current && !force) return;

    setLoadingLista(true);
    try {
      const data: Notificacao[] = await getNotificacoes(usuarioId);
      setLista(data ?? []);
      carregouLista.current = true;

      // mantém o badge do sino sincronizado com a realidade da lista
      setContador((data ?? []).filter((n) => !n.lida).length);
    } catch (error) {
      console.error("Erro ao buscar notificações", error);
    } finally {
      setLoadingLista(false);
    }
  }

  function handleOpen() {
    setOpen(true);
    carregarLista();
  }

  function handleClose() {
    setOpen(false);
    setSelectionMode(false);
    setSelecionados(new Set());
  }

  function handleToggle() {
    if (open) {
      handleClose();
    } else {
      handleOpen();
    }
  }

  // não lidas primeiro (mais recentes), depois as lidas
  const listaOrdenada = useMemo(() => {
    return [...lista].sort((a, b) => {
      if (a.lida !== b.lida) return a.lida ? 1 : -1;
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });
  }, [lista]);

  const naoLidasCount = useMemo(
    () => lista.filter((n) => !n.lida).length,
    [lista]
  );

  const todasSelecionadas =
    listaOrdenada.length > 0 && selecionados.size === listaOrdenada.length;

async function handleClicarNotificacao(notificacao: Notificacao) {

  console.log("🔔 CLICOU:", notificacao);
  console.log("➡️ URL:", notificacao.url);

  // marca visualmente como lida
  setLista((atual) =>
    atual.map((n) =>
      n.id === notificacao.id
        ? { ...n, lida: true }
        : n
    )
  );

  setContador((valor) =>
    Math.max(0, valor - 1)
  );

  // REDIRECIONA IMEDIATAMENTE
  if (notificacao.url) {

    const url = notificacao.url.startsWith("/")
      ? notificacao.url
      : `/${notificacao.url}`;

    console.log("🚀 Navegando para:", url);

    navigate(url);
    handleClose();

  } else {
    console.warn("⚠️ Notificação sem URL");
  }

  // marca como lida em segundo plano
  try {
    await marcarNotificacaoComoLida(notificacao.id);
    console.log("✅ Marcada como lida");
  } catch (error) {
    console.error("Erro ao marcar como lida:", error);
  }
}

  async function handleMarcarTodas() {
    if (!usuarioId || naoLidasCount === 0) return;

    setMarcandoTodas(true);
    try {
      await marcarTodasNotificacoesComoLidas(usuarioId);

      setLista((atual) => atual.map((n) => ({ ...n, lida: true })));
      setContador(0);
    } catch (error) {
      console.error("Erro ao marcar todas como lidas", error);
    } finally {
      setMarcandoTodas(false);
    }
  }

  async function handleExcluir(e: React.MouseEvent, notificacao: Notificacao) {
    e.stopPropagation();

    setExcluindoId(notificacao.id);
    try {
      await excluirNotificacao(notificacao.id);

      setLista((atual) => atual.filter((n) => n.id !== notificacao.id));

      if (!notificacao.lida) {
        setContador((valor) => Math.max(0, valor - 1));
      }
    } catch (error) {
      console.error("Erro ao excluir notificação", error);
    } finally {
      setExcluindoId(null);
    }
  }

  function handleToggleSelectionMode() {
    setSelectionMode((v) => !v);
    setSelecionados(new Set());
  }

  function toggleSelecionado(id: number) {
    setSelecionados((atual) => {
      const novo = new Set(atual);
      if (novo.has(id)) {
        novo.delete(id);
      } else {
        novo.add(id);
      }
      return novo;
    });
  }

  function toggleSelecionarTodas() {
    setSelecionados((atual) => {
      if (atual.size === listaOrdenada.length) return new Set();
      return new Set(listaOrdenada.map((n) => n.id));
    });
  }

  async function handleExcluirSelecionados() {
    if (selecionados.size === 0) return;

    setExcluindoSelecionados(true);
    const ids = Array.from(selecionados);

    try {
      const resultados = await Promise.allSettled(
        ids.map((id) => excluirNotificacao(id))
      );

      const idsRemovidos = ids.filter(
        (_, i) => resultados[i].status === "fulfilled"
      );
      const idsRemovidosSet = new Set(idsRemovidos);

      const removidas = lista.filter((n) => idsRemovidosSet.has(n.id));
      const naoLidasRemovidas = removidas.filter((n) => !n.lida).length;

      setLista((atual) => atual.filter((n) => !idsRemovidosSet.has(n.id)));
      setContador((valor) => Math.max(0, valor - naoLidasRemovidas));

      const falhas = resultados.filter((r) => r.status === "rejected").length;
      if (falhas > 0) {
        console.error(`${falhas} notificação(ões) não puderam ser excluídas`);
      }

      setSelecionados(new Set());
      setSelectionMode(false);
    } finally {
      setExcluindoSelecionados(false);
    }
  }

  function renderLista() {
    if (loadingLista) {
      return (
        <div className="flex items-center justify-center gap-2 py-14 text-slate-400">
          <Loader2 size={16} className="animate-spin" />
          <span className="text-xs">Carregando...</span>
        </div>
      );
    }

    if (listaOrdenada.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center gap-2 py-14 text-slate-300">
          <Inbox size={30} />
          <p className="text-xs text-slate-400">Nenhuma notificação ainda</p>
        </div>
      );
    }

    return (
      <div className="divide-y divide-slate-100">
        {listaOrdenada.map((item) => {
          const tipoStyle = getTipoStyle(item.tipo);
          const isExcluindo = excluindoId === item.id;
          const naoLida = !item.lida;
          const isSelecionada = selecionados.has(item.id);

          // não lida = mantém a cor do tipo; lida = vira cinza neutro (ícone incluso)
          const iconBg = naoLida ? tipoStyle.bg : "bg-slate-100";
          const iconColor = naoLida ? tipoStyle.color : "text-slate-400";

          return (
            <div
              key={item.id}
              className={[
                "group relative flex items-start gap-3 pl-3 pr-2 sm:pr-3 py-3",
                "border-l-[3px] transition-colors",
                naoLida
                  ? "border-l-blue-500 bg-blue-50/50 hover:bg-blue-50"
                  : "border-l-slate-300 bg-slate-50 hover:bg-slate-100",
                isExcluindo ? "opacity-40 pointer-events-none" : "",
                isSelecionada ? "ring-1 ring-inset ring-blue-300" : "",
              ].join(" ")}
            >
              {selectionMode && (
                <button
                  type="button"
                  onClick={() => toggleSelecionado(item.id)}
                  className="flex items-center pt-1.5 shrink-0"
                  aria-label="Selecionar notificação"
                >
                  <CheckboxVisual checked={isSelecionada} />
                </button>
              )}

              <button
                type="button"
                onClick={() =>
                  selectionMode
                    ? toggleSelecionado(item.id)
                    : handleClicarNotificacao(item)
                }
                className="flex flex-1 min-w-0 gap-3 text-left"
              >
                <div
                  className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${iconBg} ${iconColor}`}
                >
                  <tipoStyle.Icon size={15} />
                </div>

                <div className="min-w-0 flex-1 pr-6">
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={`text-sm truncate ${
                        naoLida
                          ? "font-semibold text-slate-800"
                          : "font-medium text-slate-500"
                      }`}
                    >
                      {item.titulo}
                    </p>
                    {naoLida && (
                      <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                    )}
                  </div>

                  <p
                    className={`text-xs mt-0.5 line-clamp-2 break-words ${
                      naoLida ? "text-slate-600" : "text-slate-400"
                    }`}
                  >
                    {item.mensagem}
                  </p>

                  <p className="text-[11px] text-slate-400 mt-1">
                    {formatRelativeTime(item.created_at)}
                  </p>
                </div>
              </button>

              {!selectionMode && (
                <button
                  type="button"
                  onClick={(e) => handleExcluir(e, item)}
                  title="Excluir"
                  className="
                    absolute right-2 top-2 h-7 w-7 rounded-lg
                    flex items-center justify-center
                    text-slate-300 hover:text-red-500 hover:bg-red-50
                    opacity-100 sm:opacity-0 sm:group-hover:opacity-100
                    transition
                  "
                >
                  {isExcluindo ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Trash2 size={13} />
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="relative" ref={containerRef}>
      {/* SINO */}
      <button
        type="button"
        onClick={handleToggle}
        aria-label="Notificações"
        aria-expanded={open}
        className="
          relative w-9 h-9 shrink-0 flex items-center justify-center
          rounded-lg bg-white border border-slate-200
          hover:bg-blue-50 hover:border-blue-200 transition shadow-sm
        "
      >
        <Bell size={18} className="text-slate-600" />

        {contador > 0 && (
          <span
            className="
              absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1
              rounded-full bg-red-500 text-white text-[10px] font-bold
              flex items-center justify-center leading-none
              ring-2 ring-white
            "
          >
            {contador > 99 ? "99+" : contador}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* overlay escuro só no mobile, ajuda a fechar por toque fora */}
          {isMobile && (
            <div
              className="fixed inset-0 bg-slate-900/20 z-40"
              onClick={handleClose}
            />
          )}

          {/* PAINEL — posicionamento e borda 100% sob nosso controle,
              sem depender de nenhum componente externo */}
          <div
            className={[
              "z-50 bg-white rounded-2xl overflow-hidden flex flex-col",
              "shadow-[0_16px_48px_-12px_rgba(15,23,42,0.25)]",
              isMobile
                ? "fixed inset-x-2 top-16 max-h-[75vh]"
                : "absolute right-0 mt-2 w-[400px] max-h-[480px]",
            ].join(" ")}
            style={{ border: "1px solid #e2e8f0" }}
          >
            {/* HEADER */}
            <div className="flex items-center justify-between gap-3 px-4 pt-3.5 pb-3 border-b border-slate-100 bg-gradient-to-r from-white to-blue-50/50 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <h3 className="font-semibold text-sm text-slate-800 shrink-0">
                  Notificações
                </h3>
                {naoLidasCount > 0 && (
                  <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 shrink-0">
                    {naoLidasCount} nova{naoLidasCount > 1 ? "s" : ""}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {!selectionMode && (
                  <button
                    type="button"
                    onClick={handleMarcarTodas}
                    disabled={naoLidasCount === 0 || marcandoTodas}
                    className="
                      flex items-center gap-1.5 text-[11px] font-medium whitespace-nowrap
                      text-blue-600 hover:text-blue-700
                      disabled:text-slate-300 disabled:cursor-not-allowed
                      transition
                    "
                  >
                    {marcandoTodas ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Check size={12} />
                    )}
                    Marcar todas
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleToggleSelectionMode}
                  disabled={listaOrdenada.length === 0}
                  title={
                    selectionMode ? "Cancelar seleção" : "Selecionar notificações"
                  }
                  className="
                    flex items-center gap-1.5 text-[11px] font-medium whitespace-nowrap
                    text-slate-500 hover:text-slate-700
                    disabled:text-slate-300 disabled:cursor-not-allowed
                    transition
                  "
                >
                  {selectionMode ? <X size={13} /> : <ListChecks size={13} />}
                  {selectionMode ? "Cancelar" : "Selecionar"}
                </button>
              </div>
            </div>

            {/* BARRA DE SELEÇÃO — só aparece em modo de seleção */}
            {selectionMode && (
              <div className="flex items-center justify-between gap-3 px-4 py-2 border-b border-slate-100 bg-slate-50 shrink-0">
                <button
                  type="button"
                  onClick={toggleSelecionarTodas}
                  className="flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-slate-800"
                >
                  <CheckboxVisual checked={todasSelecionadas} />
                  Selecionar todas
                </button>

                <button
                  type="button"
                  onClick={handleExcluirSelecionados}
                  disabled={selecionados.size === 0 || excluindoSelecionados}
                  className="
                    flex items-center gap-1.5 text-xs font-medium
                    text-red-600 hover:text-red-700
                    disabled:text-slate-300 disabled:cursor-not-allowed
                    transition
                  "
                >
                  {excluindoSelecionados ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Trash2 size={12} />
                  )}
                  Excluir {selecionados.size > 0 && `(${selecionados.size})`}
                </button>
              </div>
            )}

            {/* LISTA ÚNICA — não lida = azul, lida = cinza (fundo, texto e ícone).
                Clicar marca como lida (muda de cor no lugar, não some). */}
            <div className="overflow-y-auto flex-1 min-h-0">{renderLista()}</div>
          </div>
        </>
      )}
    </div>
  );
}
