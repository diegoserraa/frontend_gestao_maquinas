import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "next-themes";
import { Search, Cpu, CircleCheck, TriangleAlert } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSectors } from "@/hooks/useSector";

import { useMonitoramentoDados } from "@/modules/monitoramento/useMonitoramentoDados";
import {
  AlertasAside,
  usePainelAlertas,
} from "@/modules/monitoramento/AlertasAside";
import { MaquinaMonitorCard } from "@/modules/monitoramento/MaquinaMonitorCard";
import { TelemetriaHistoricoDialog } from "@/modules/monitoramento/TelemetriaHistoricoDialog";
import {
  SeletorModo,
  BotaoTema,
  BotaoTelaCheia,
  AvisoDemo,
} from "@/modules/monitoramento/MonitoramentoPecas";
import {
  estaAoVivo,
  nivelGeral,
  type Nivel,
} from "@/modules/monitoramento/monitoramentoHelpers";
import type { TelemetriaAtual } from "@/modules/monitoramento/monitoramentoTypes";

const PESO: Record<Nivel, number> = { critico: 0, atencao: 1, "sem-dado": 2, ok: 3 };
const CHAVE_SEM_SETOR = "__sem_setor__";
// em vez de forçar um número fixo de colunas por breakpoint (que sobra
// estreito quando o painel de alertas está aberto do lado, espremendo os
// números até sobrepor), cada card garante pelo menos 288px — o navegador
// decide sozinho quantos cabem por linha nesse espaço
const GRID = "grid gap-3.5 grid-cols-[repeat(auto-fill,minmax(288px,1fr))]";

const CHAVE_TEMA = "mymaq360_monitoramento_escuro";

function lerTemaSalvo(): boolean {
  try {
    return localStorage.getItem(CHAVE_TEMA) === "1";
  } catch {
    return false;
  }
}

function situacao(l: TelemetriaAtual): Nivel {
  const temSinal =
    l.temperatura !== null || l.vibracao !== null || l.horas_ligadas !== null;
  if (!temSinal || !estaAoVivo(l.atualizado_em)) return "sem-dado";
  return nivelGeral(l);
}

export default function Monitoring() {
  const { leituras, historico, carregando, demoAtivo, modo, setModo } =
    useMonitoramentoDados();
  const { alertas, recarregar } = usePainelAlertas();
  const { sectors } = useSectors();

  const [busca, setBusca] = useState("");
  const [setorFiltro, setSetorFiltro] = useState("all");
  const [selecionada, setSelecionada] = useState<TelemetriaAtual | null>(null);
  const [historicoAberto, setHistoricoAberto] = useState(false);
  const [escuro, setEscuroState] = useState<boolean>(lerTemaSalvo);
  const [telaCheia, setTelaCheia] = useState(false);
  const { setTheme } = useTheme();

  // lembra o tema escolhido — não precisa reativar toda vez que abrir a tela de novo
  function setEscuro(v: boolean) {
    setEscuroState(v);
    try {
      localStorage.setItem(CHAVE_TEMA, v ? "1" : "0");
    } catch {
      // localStorage indisponível (aba privada, etc.) — só não persiste, sem quebrar nada
    }
  }

  // o toast (sonner) é global e não sabe nada sobre esta tela — sincroniza o
  // tema dele com o nosso pra não abrir uma notificação clara em cima do
  // fundo escuro (ex.: "O.S. aberta" depois de agir num alerta). Ao sair
  // desta tela, devolve pro claro — nenhuma outra tela do sistema tem
  // modo escuro ainda.
  useEffect(() => {
    setTheme(escuro ? "dark" : "light");
    return () => setTheme("light");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [escuro]);

  // tela cheia de verdade (Fullscreen API) além de esconder o menu/cabeçalho do
  // sistema — some tudo que não é máquina. Não é obrigatório o navegador aceitar
  // (precisa ser chamado direto num clique do usuário); mesmo se recusar, o
  // overlay por cima do menu já resolve a parte visual sozinho.
  function alternarTelaCheia(v: boolean) {
    setTelaCheia(v);
    try {
      if (v) document.documentElement.requestFullscreen?.();
      else if (document.fullscreenElement) document.exitFullscreen?.();
    } catch {
      // sem suporte/permissão — o overlay continua funcionando do mesmo jeito
    }
  }

  // se o usuário sair da tela cheia pelo Esc (nativo do navegador), acompanha o estado
  useEffect(() => {
    function aoMudar() {
      if (!document.fullscreenElement) setTelaCheia(false);
    }
    document.addEventListener("fullscreenchange", aoMudar);
    return () => document.removeEventListener("fullscreenchange", aoMudar);
  }, []);

  const temAside = alertas.length > 0 && !telaCheia;
  const modoEfetivo: "demo" | "real" = demoAtivo ? "demo" : "real";

  const contagem = useMemo(() => {
    let critico = 0, atencao = 0, semSinal = 0;
    for (const l of leituras) {
      const s = situacao(l);
      if (s === "critico") critico++;
      else if (s === "atencao") atencao++;
      else if (s === "sem-dado") semSinal++;
    }
    return {
      total: leituras.length,
      critico,
      atencao,
      semSinal,
      normal: Math.max(leituras.length - critico - atencao - semSinal, 0),
    };
  }, [leituras]);

  const opcoesSetor = useMemo(() => {
    const mapa = new Map<string, string>();
    for (const s of sectors) mapa.set(String(s.id), s.nome);
    for (const l of leituras) {
      if (l.setor_id != null && l.setor_nome && !mapa.has(String(l.setor_id)))
        mapa.set(String(l.setor_id), l.setor_nome);
    }
    return [...mapa.entries()]
      .map(([id, nome]) => ({ id, nome }))
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [sectors, leituras]);

  const grupos = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const visiveis = leituras.filter((l) => {
      const casaBusca =
        !termo ||
        (l.maquina_nome ?? "").toLowerCase().includes(termo) ||
        (l.setor_nome ?? "").toLowerCase().includes(termo);
      const casaSetor =
        setorFiltro === "all" || String(l.setor_id ?? "") === setorFiltro;
      return casaBusca && casaSetor;
    });

    const porSetor = new Map<string, TelemetriaAtual[]>();
    for (const l of visiveis) {
      const chave = l.setor_id != null ? String(l.setor_id) : CHAVE_SEM_SETOR;
      if (!porSetor.has(chave)) porSetor.set(chave, []);
      porSetor.get(chave)!.push(l);
    }

    const ordena = (itens: TelemetriaAtual[]) =>
      [...itens].sort(
        (a, b) =>
          PESO[situacao(a)] - PESO[situacao(b)] ||
          (a.maquina_nome ?? "").localeCompare(b.maquina_nome ?? "")
      );

    const nomes = new Map(opcoesSetor.map((s) => [s.id, s.nome]));
    return [...porSetor.keys()]
      .sort((a, b) => {
        if (a === CHAVE_SEM_SETOR) return 1;
        if (b === CHAVE_SEM_SETOR) return -1;
        return (nomes.get(a) ?? "").localeCompare(nomes.get(b) ?? "");
      })
      .map((chave) => ({
        chave,
        nome:
          chave === CHAVE_SEM_SETOR ? "Sem setor" : nomes.get(chave) ?? "Setor",
        itens: ordena(porSetor.get(chave)!),
      }));
  }, [leituras, busca, setorFiltro, opcoesSetor]);

  const abrirHistorico = useCallback((l: TelemetriaAtual) => {
    setSelecionada(l);
    setHistoricoAberto(true);
  }, []);

  const conteudo = (
    <div className="space-y-5">
      {/* CABEÇALHO */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className={escuro ? "text-3xl font-bold text-slate-50" : "text-xl font-semibold text-slate-900"}>
            Monitoramento
          </h1>
          <p className={escuro ? "text-sm text-slate-400" : "text-sm text-slate-500"}>
            Estado das máquinas em tempo real
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SeletorModo modo={modo} modoEfetivo={modoEfetivo} onChange={setModo} escuro={escuro} />
          <BotaoTema escuro={escuro} onChange={setEscuro} />
          <BotaoTelaCheia ativo={telaCheia} onChange={alternarTelaCheia} escuro={escuro} />
        </div>
      </div>

      {demoAtivo && !telaCheia && <AvisoDemo escuro={escuro} />}

      <ResumoTopo {...contagem} escuro={escuro} />

      {/* FILTROS — ficam disponíveis em qualquer modo, inclusive tela cheia:
          filtrar por setor faz sentido mesmo numa demonstração/exposição */}
      {leituras.length > 4 && (
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search
              size={16}
              className={cn(
                "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2",
                escuro ? "text-slate-500" : "text-slate-400"
              )}
            />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar máquina..."
              className={cn(
                "h-10 w-full rounded-xl border pl-9 pr-3 text-sm outline-none transition-colors",
                escuro
                  ? "border-white/10 bg-white/5 text-slate-100 placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                  : "border-slate-200 bg-white text-slate-700 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              )}
            />
          </div>
          <div className="w-full sm:w-52">
            <Select value={setorFiltro} onValueChange={setSetorFiltro}>
              <SelectTrigger
                className={cn(
                  "h-10",
                  escuro && "border-white/10 bg-white/5 text-slate-100 hover:border-white/20 [&_svg]:text-slate-400"
                )}
              >
                <SelectValue placeholder="Setor" />
              </SelectTrigger>
              <SelectContent className={cn(escuro && "border-white/10 bg-slate-900 text-slate-100")}>
                <SelectItem
                  value="all"
                  className={cn(escuro && "text-slate-200 focus:bg-white/10 focus:text-white data-[state=checked]:bg-blue-500/20 data-[state=checked]:text-blue-300")}
                >
                  Todos os setores
                </SelectItem>
                {opcoesSetor.map((s) => (
                  <SelectItem
                    key={s.id}
                    value={s.id}
                    className={cn(escuro && "text-slate-200 focus:bg-white/10 focus:text-white data-[state=checked]:bg-blue-500/20 data-[state=checked]:text-blue-300")}
                  >
                    {s.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* GRADE POR SETOR */}
      {carregando ? (
        <div className={GRID}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className={
                escuro
                  ? "h-56 animate-pulse rounded-3xl border border-white/10 bg-white/5"
                  : "h-56 animate-pulse rounded-3xl border border-slate-200 bg-slate-100"
              }
            />
          ))}
        </div>
      ) : grupos.length === 0 ? (
        <div
          className={
            escuro
              ? "flex flex-col items-center gap-2 rounded-3xl border border-dashed border-white/10 bg-white/5 py-16 text-slate-500"
              : "flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-slate-400"
          }
        >
          <Cpu size={26} />
          <p className="text-sm">Nenhuma máquina para monitorar.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grupos.map((g) => (
            <section key={g.chave}>
              <div
                className={
                  escuro
                    ? "mb-3 flex items-baseline gap-2 border-b border-white/10 pb-1.5"
                    : "mb-3 flex items-baseline gap-2 border-b border-slate-200 pb-1.5"
                }
              >
                <h2
                  className={
                    escuro
                      ? "text-xs font-semibold uppercase tracking-wide text-slate-400"
                      : "text-xs font-semibold uppercase tracking-wide text-slate-500"
                  }
                >
                  {g.nome}
                </h2>
                <span className={escuro ? "text-xs text-slate-600" : "text-xs text-slate-300"}>
                  {g.itens.length}
                </span>
              </div>
              <div className={GRID}>
                {g.itens.map((l) => (
                  <MaquinaMonitorCard
                    key={l.maquina_id}
                    leitura={l}
                    historico={historico[l.maquina_id] ?? []}
                    onAbrir={abrirHistorico}
                    escuro={escuro}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );

  const corpo = (
    <div className="relative">
      {temAside ? (
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-5">
          <aside className="order-1 mb-5 lg:order-2 lg:mb-0">
            <div className="lg:sticky lg:top-4">
              <AlertasAside
                alertas={alertas}
                onMudou={recarregar}
                escuro={escuro}
              />
            </div>
          </aside>
          <div className="order-2 min-w-0 lg:order-1">{conteudo}</div>
        </div>
      ) : (
        conteudo
      )}
    </div>
  );

  const dialogo = (
    <TelemetriaHistoricoDialog
      leitura={selecionada}
      open={historicoAberto}
      onOpenChange={setHistoricoAberto}
    />
  );

  // TELA CHEIA — portal pro body: fica por cima do menu/cabeçalho do sistema
  // (que continuam ali embaixo, só não aparecem), sem precisar mexer no
  // MainLayout pra escondê-los.
  // z-40 (não z-9999!): o Dialog e o Select do shadcn também são portados pro
  // body e usam z-50 — se este overlay tivesse um z-index maior que o deles,
  // o modal de histórico e o dropdown de setor ficariam renderizados POR BAIXO
  // dele (inacessíveis a um clique real, mesmo abertos no estado do React).
  // z-40 já é suficiente pra cobrir o menu/cabeçalho normais (sem z-index).
  if (telaCheia) {
    return createPortal(
      <div
        className={cn(
          "fixed inset-0 z-40 overflow-y-auto p-6",
          escuro
            ? "bg-slate-950"
            : "bg-slate-50"
        )}
      >
        {escuro && (
          <>
            <div className="pointer-events-none fixed -top-24 -left-24 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" aria-hidden />
            <div className="pointer-events-none fixed -bottom-24 -right-24 h-96 w-96 rounded-full bg-indigo-600/10 blur-3xl" aria-hidden />
          </>
        )}
        <div className="relative mx-auto max-w-[1800px]">{corpo}</div>
        {dialogo}
      </div>,
      document.body
    );
  }

  return (
    <div
      className={cn(
        "w-full transition-colors duration-300",
        // sangra por cima do padding do MainLayout (p-6) pra tomar conta da
        // área de conteúdo inteira — uma seção escura com borda clara ao
        // redor não convence ninguém
        escuro && "relative -m-6 min-h-[calc(100vh-4rem)] overflow-hidden bg-slate-950 p-6"
      )}
    >
      {escuro && (
        <>
          <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" aria-hidden />
          <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-indigo-600/10 blur-3xl" aria-hidden />
        </>
      )}

      {corpo}
      {dialogo}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function ResumoTopo({
  total,
  normal,
  atencao,
  critico,
  semSinal,
  escuro = false,
}: {
  total: number;
  normal: number;
  atencao: number;
  critico: number;
  semSinal: number;
  escuro?: boolean;
}) {
  const paletas = escuro
    ? {
        ok: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
        critico: "border-rose-400/50 bg-rose-500/10 text-rose-300",
        atencao: "border-amber-400/40 bg-amber-500/10 text-amber-300",
        neutro: "border-white/10 bg-white/5 text-slate-400",
      }
    : {
        ok: "border-emerald-200 bg-emerald-50 text-emerald-800",
        critico: "border-rose-200 bg-rose-50 text-rose-800",
        atencao: "border-amber-200 bg-amber-50 text-amber-800",
        neutro: "border-slate-200 bg-slate-50 text-slate-600",
      };

  let cor = paletas.ok;
  let Icone = CircleCheck;
  let frase = `Todas as ${total} máquinas operando normalmente`;

  if (critico > 0) {
    cor = paletas.critico;
    Icone = TriangleAlert;
    frase = `${critico} máquina${critico > 1 ? "s" : ""} em estado crítico — precisa de ação`;
  } else if (atencao > 0) {
    cor = paletas.atencao;
    Icone = TriangleAlert;
    frase = `${atencao} máquina${atencao > 1 ? "s" : ""} em atenção`;
  } else if (total === 0) {
    cor = paletas.neutro;
    frase = "Nenhuma máquina monitorada";
  } else if (semSinal === total) {
    cor = paletas.neutro;
    frase = "Nenhuma máquina enviando dados";
  }

  return (
    <div className={cn("rounded-2xl border px-4 py-3", escuro && "backdrop-blur", cor)}>
      <div className="flex items-center gap-2">
        <Icone size={escuro ? 22 : 18} />
        <span className={escuro ? "text-lg font-bold" : "text-sm font-semibold"}>{frase}</span>
      </div>
      {total > 0 && (
        <p className={cn("mt-1 opacity-80", escuro ? "text-sm" : "text-xs")}>
          {total} máquinas · {normal} normal · {atencao} atenção · {critico} crítico
          {semSinal > 0 && ` · ${semSinal} sem sinal`}
        </p>
      )}
    </div>
  );
}
