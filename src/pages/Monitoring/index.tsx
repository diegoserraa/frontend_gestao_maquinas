import { useCallback, useMemo, useState } from "react";
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
  SeletorExibicao,
  AvisoDemo,
  type ModoExibicao,
} from "@/modules/monitoramento/MonitoramentoPecas";
import {
  estaAoVivo,
  nivelGeral,
  type Nivel,
} from "@/modules/monitoramento/monitoramentoHelpers";
import type { TelemetriaAtual } from "@/modules/monitoramento/monitoramentoTypes";

const PESO: Record<Nivel, number> = { critico: 0, atencao: 1, "sem-dado": 2, ok: 3 };
const CHAVE_SEM_SETOR = "__sem_setor__";
const GRID_CHEIO =
  "grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5";
const GRID_COM_ASIDE =
  "grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4";
// modo exposição: poucas colunas de propósito — cards grandes valem mais que
// caber muitas máquinas na mesma linha (é uma vitrine, não uma planilha)
const GRID_EXPOSICAO = "grid gap-5 sm:grid-cols-2 xl:grid-cols-3";

const CHAVE_EXIBICAO = "mymaq360_monitoramento_exibicao";

function lerExibicaoSalva(): ModoExibicao {
  try {
    return localStorage.getItem(CHAVE_EXIBICAO) === "exposicao" ? "exposicao" : "normal";
  } catch {
    return "normal";
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
  const [exibicao, setExibicaoState] = useState<ModoExibicao>(lerExibicaoSalva);

  const exposicao = exibicao === "exposicao";

  // lembra a escolha — útil pra não ter que reativar toda vez que abrir a tela
  // de novo no dia da feira
  function setExibicao(m: ModoExibicao) {
    setExibicaoState(m);
    try {
      localStorage.setItem(CHAVE_EXIBICAO, m);
    } catch {
      // localStorage indisponível (aba privada, etc.) — só não persiste, sem quebrar nada
    }
  }

  const temAside = alertas.length > 0 && !exposicao;

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

  const grid = exposicao ? GRID_EXPOSICAO : temAside ? GRID_COM_ASIDE : GRID_CHEIO;

  const conteudo = (
    <div className="space-y-5">
      {/* CABEÇALHO */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className={exposicao ? "text-3xl font-bold text-slate-50" : "text-xl font-semibold text-slate-900"}>
            Monitoramento
          </h1>
          <p className={exposicao ? "text-sm text-slate-400" : "text-sm text-slate-500"}>
            Estado das máquinas em tempo real
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SeletorModo modo={modo} onChange={setModo} escuro={exposicao} />
          <SeletorExibicao valor={exibicao} onChange={setExibicao} />
        </div>
      </div>

      {demoAtivo && !exposicao && <AvisoDemo />}

      <ResumoTopo {...contagem} exposicao={exposicao} />

      {/* FILTROS — escondidos no modo exposição: é uma vitrine de tudo, não uma
          busca de trabalho, e simplifica a tela pra quem só vai olhar de longe */}
      {leituras.length > 4 && !exposicao && (
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar máquina..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div className="w-full sm:w-52">
            <Select value={setorFiltro} onValueChange={setSetorFiltro}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Setor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os setores</SelectItem>
                {opcoesSetor.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
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
        <div className={grid}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className={
                exposicao
                  ? "h-56 animate-pulse rounded-3xl border border-white/10 bg-white/5"
                  : "h-36 animate-pulse rounded-2xl border border-slate-200 bg-slate-100"
              }
            />
          ))}
        </div>
      ) : grupos.length === 0 ? (
        <div
          className={
            exposicao
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
                  exposicao
                    ? "mb-3 flex items-baseline gap-2 border-b border-white/10 pb-1.5"
                    : "mb-3 flex items-baseline gap-2 border-b border-slate-200 pb-1.5"
                }
              >
                <h2
                  className={
                    exposicao
                      ? "text-xs font-semibold uppercase tracking-wide text-slate-400"
                      : "text-xs font-semibold uppercase tracking-wide text-slate-500"
                  }
                >
                  {g.nome}
                </h2>
                <span className={exposicao ? "text-xs text-slate-600" : "text-xs text-slate-300"}>
                  {g.itens.length}
                </span>
              </div>
              <div className={grid}>
                {g.itens.map((l) => (
                  <MaquinaMonitorCard
                    key={l.maquina_id}
                    leitura={l}
                    historico={historico[l.maquina_id] ?? []}
                    onAbrir={abrirHistorico}
                    exposicao={exposicao}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div
      className={cn(
        "w-full transition-colors duration-300",
        // sangra por cima do padding do MainLayout (p-6) pra tomar conta da
        // tela inteira de verdade — uma "vitrine" com borda clara ao redor
        // não convence ninguém
        exposicao &&
          "relative -m-6 min-h-[calc(100vh-4rem)] overflow-hidden bg-slate-950 p-6"
      )}
    >
      {exposicao && (
        <>
          <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" aria-hidden />
          <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-indigo-600/10 blur-3xl" aria-hidden />
        </>
      )}

      <div className="relative">
        {temAside ? (
          <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-5">
            <aside className="order-1 mb-5 lg:order-2 lg:mb-0">
              <div className="lg:sticky lg:top-4">
                <AlertasAside
                  alertas={alertas}
                  onMudou={recarregar}
                />
              </div>
            </aside>
            <div className="order-2 min-w-0 lg:order-1">{conteudo}</div>
          </div>
        ) : (
          conteudo
        )}
      </div>

      <TelemetriaHistoricoDialog
        leitura={selecionada}
        open={historicoAberto}
        onOpenChange={setHistoricoAberto}
      />
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
  exposicao = false,
}: {
  total: number;
  normal: number;
  atencao: number;
  critico: number;
  semSinal: number;
  exposicao?: boolean;
}) {
  const paletas = exposicao
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
    <div className={cn("rounded-2xl border px-4 py-3", exposicao && "backdrop-blur", cor)}>
      <div className="flex items-center gap-2">
        <Icone size={exposicao ? 22 : 18} />
        <span className={exposicao ? "text-lg font-bold" : "text-sm font-semibold"}>{frase}</span>
      </div>
      {total > 0 && (
        <p className={cn("mt-1 opacity-80", exposicao ? "text-sm" : "text-xs")}>
          {total} máquinas · {normal} normal · {atencao} atenção · {critico} crítico
          {semSinal > 0 && ` · ${semSinal} sem sinal`}
        </p>
      )}
    </div>
  );
}
