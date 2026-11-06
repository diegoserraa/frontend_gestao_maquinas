import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  Download,
  Loader2,
  FileBarChart,
  Thermometer,
  Activity,
  Gauge,
  TriangleAlert,
  CalendarRange,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { notify } from "@/lib/notify";
import { DateInput } from "@/components/ui/date-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { getMachines } from "@/modules/machine/machineService";
import type { Machine } from "@/modules/machine/machineTypes";
import { getRelatorioTelemetria } from "../../modules/monitoramento/monitoramentoService";
import {
  LIMIAR_VIBRACAO_RODANDO,
  NIVEL_UI,
  formatarHoras,
  formatarNumero,
  nivelTemperatura,
  nivelVibracao,
} from "../../modules/monitoramento/monitoramentoHelpers";
import type { RelatorioTelemetria, TelemetriaLeituraComMaquina } from "../../modules/monitoramento/monitoramentoTypes";

// limite alto o bastante pra "o mês inteiro" de uma máquina só na maioria dos
// casos reais (uma leitura a cada 8s, 24/7, dá ~324 mil/mês — por isso o teto:
// ver TelemetriaService.listarRelatorio no backend) sem travar o navegador
// ao desenhar/exportar a lista.
const LIMITE_LINHAS = 20_000;
// a cada 8s isso ainda cobre ~4h30 de leitura por máquina antes de cortar —
// uma anomalia de horas atrás não pode "sumir" só porque ficou abaixo da
// dobra sem o usuário saber que precisa rolar (ou pior, achar que a cor
// quebrou). Acima disso o navegador começa a sentir pra desenhar a tabela.
const LINHAS_NA_TELA = 2_000;

/** Pior nível (temperatura x vibração) de uma leitura, pelos limites da própria máquina dela. */
function nivelLeitura(l: TelemetriaLeituraComMaquina) {
  const t = nivelTemperatura(l.temperatura, l.limites?.temperatura);
  const v = nivelVibracao(l.vibracao, l.limites?.vibracao);
  if (t === "critico" || v === "critico") return "critico" as const;
  if (t === "atencao" || v === "atencao") return "atencao" as const;
  return "ok" as const;
}

type Preset = "hoje" | "7dias" | "mes" | "custom";

function paraISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function calcularPeriodo(preset: Preset): { desde: string; ate: string } {
  const hoje = new Date();
  const ate = paraISODate(hoje);

  if (preset === "hoje") return { desde: ate, ate };

  if (preset === "7dias") {
    const d = new Date(hoje);
    d.setDate(d.getDate() - 6);
    return { desde: paraISODate(d), ate };
  }

  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  return { desde: paraISODate(inicioMes), ate };
}

function exportarCsv(resultado: RelatorioTelemetria, nomeArquivo: string) {
  const cabecalho = ["data_hora", "maquina", "status", "temperatura_c", "vibracao_mm_s", "horas_ligadas"];
  const linhas = resultado.leituras.map((l) => [
    new Date(l.recebido_em).toLocaleString("pt-BR"),
    l.maquina_nome ?? "",
    l.vibracao !== null && l.vibracao >= LIMIAR_VIBRACAO_RODANDO ? "rodando" : "parada",
    l.temperatura ?? "",
    l.vibracao ?? "",
    l.horas_ligadas ?? "",
  ]);

  const csv = [cabecalho, ...linhas]
    .map((linha) => linha.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";"))
    .join("\r\n");

  // BOM na frente: Excel em pt-BR só reconhece acento sem perguntar com isso
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomeArquivo;
  a.click();
  URL.revokeObjectURL(url);
}

const PRESETS: [Preset, string][] = [
  ["hoje", "Hoje"],
  ["7dias", "Últimos 7 dias"],
  ["mes", "Este mês"],
  ["custom", "Personalizado"],
];

export default function Relatorios() {
  const [maquinas, setMaquinas] = useState<Machine[]>([]);
  const [maquinaId, setMaquinaId] = useState<string>("all");
  const [preset, setPreset] = useState<Preset>("mes");
  const [desde, setDesde] = useState("");
  const [ate, setAte] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [resultado, setResultado] = useState<RelatorioTelemetria | null>(null);
  const [soForaDaFaixa, setSoForaDaFaixa] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState<"todas" | "rodando" | "parada">("todas");

  useEffect(() => {
    getMachines()
      .then(setMaquinas)
      .catch(() => notify.error("Erro ao carregar máquinas"));
  }, []);

  // troca de preset (exceto "custom") já recalcula De/Até na hora — "custom"
  // é o próprio usuário escolhendo, não sobrescreve o que ele digitou
  useEffect(() => {
    if (preset === "custom") return;
    const { desde: d, ate: a } = calcularPeriodo(preset);
    setDesde(d);
    setAte(a);
  }, [preset]);

  async function buscar(desdeAtual = desde, ateAtual = ate, maquinaAtual = maquinaId) {
    setCarregando(true);
    try {
      const dados = await getRelatorioTelemetria({
        maquinaId: maquinaAtual === "all" ? null : Number(maquinaAtual),
        desde: desdeAtual ? `${desdeAtual}T00:00:00` : null,
        ate: ateAtual ? `${ateAtual}T23:59:59` : null,
        limite: LIMITE_LINHAS,
      });
      setResultado(dados);
    } catch {
      notify.error("Erro ao gerar relatório");
    } finally {
      setCarregando(false);
    }
  }

  // primeira carga: mês atual, todas as máquinas — já chega mostrando algo
  useEffect(() => {
    const { desde: d, ate: a } = calcularPeriodo("mes");
    setDesde(d);
    setAte(a);
    buscar(d, a, "all");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const maquinaNome = useMemo(
    () => (maquinaId === "all" ? "todas as máquinas" : maquinas.find((m) => String(m.id) === maquinaId)?.nome ?? ""),
    [maquinaId, maquinas]
  );

  const grafico = useMemo(
    () =>
      (resultado?.porDia ?? []).map((p) => ({
        ...p,
        rotulo: new Date(p.dia).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      })),
    [resultado]
  );

  // calculado sobre TODAS as leituras carregadas (até o limite de exportação),
  // não só as que acabam renderizadas na tela — senão uma anomalia fora da
  // "dobra" sumiria sem o usuário saber que precisa rolar ou filtrar
  const leiturasAnalisadas = useMemo(
    () =>
      (resultado?.leituras ?? []).map((l) => ({
        l,
        nivel: nivelLeitura(l),
        rodando: l.vibracao !== null && l.vibracao >= LIMIAR_VIBRACAO_RODANDO,
      })),
    [resultado]
  );
  const totalForaDaFaixa = useMemo(
    () => leiturasAnalisadas.filter((x) => x.nivel !== "ok").length,
    [leiturasAnalisadas]
  );
  const leiturasExibidas = useMemo(() => {
    let lista = leiturasAnalisadas;
    if (soForaDaFaixa) lista = lista.filter((x) => x.nivel !== "ok");
    if (filtroStatus !== "todas") lista = lista.filter((x) => x.rodando === (filtroStatus === "rodando"));
    return lista;
  }, [leiturasAnalisadas, soForaDaFaixa, filtroStatus]);

  // trocar o filtro (data/máquina) pode fazer a contagem cair a zero — sem
  // isso, o filtro "só fora da faixa" ficava ligado com a tabela vazia e sem
  // nenhum controle visível pra desligar de novo (o botão só aparecia com
  // contagem > 0)
  useEffect(() => {
    if (soForaDaFaixa && totalForaDaFaixa === 0) setSoForaDaFaixa(false);
  }, [soForaDaFaixa, totalForaDaFaixa]);

  function exportar() {
    if (!resultado || resultado.leituras.length === 0) {
      notify.error("Nada pra exportar com esse filtro");
      return;
    }
    const nome = `telemetria_${maquinaId === "all" ? "todas" : maquinaNome.replace(/\s+/g, "_")}_${desde}_a_${ate}.csv`;
    exportarCsv(resultado, nome);
  }

  return (
    <div className="space-y-6">
      {/* FILTROS */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-1.5">
          {PRESETS.map(([valor, rotulo]) => (
            <button
              key={valor}
              type="button"
              onClick={() => setPreset(valor)}
              className={cn(
                "rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all duration-150",
                preset === valor
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
              )}
            >
              {rotulo}
            </button>
          ))}
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Máquina</label>
            <Select value={maquinaId} onValueChange={setMaquinaId}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Máquina" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as máquinas</SelectItem>
                {maquinas.map((m) => (
                  <SelectItem key={m.id} value={String(m.id)}>
                    {m.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">De</label>
            <DateInput
              value={desde}
              onChange={(v) => {
                setPreset("custom");
                setDesde(v);
              }}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Até</label>
            <DateInput
              value={ate}
              onChange={(v) => {
                setPreset("custom");
                setAte(v);
              }}
            />
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={() => buscar()}
              disabled={carregando}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 text-sm font-semibold text-white shadow-sm shadow-blue-500/20 transition-all duration-150 hover:shadow-md disabled:opacity-60"
            >
              {carregando ? <Loader2 size={15} className="animate-spin" /> : <FileBarChart size={15} />}
              Gerar
            </button>
          </div>
        </div>
      </div>

      {carregando && !resultado ? (
        <div className="flex items-center justify-center gap-2 py-16 text-slate-400">
          <Loader2 size={16} className="animate-spin" />
          <span className="text-sm">Carregando...</span>
        </div>
      ) : !resultado || resultado.resumo.total_leituras === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white py-16 text-slate-400">
          <FileBarChart size={26} />
          <p className="text-sm">Nenhuma leitura nesse período.</p>
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <CartaoKpi
              icone={CalendarRange}
              corIcone="bg-slate-100 text-slate-600"
              rotulo="Leituras no período"
              valor={resultado.resumo.total_leituras.toLocaleString("pt-BR")}
            />
            <CartaoKpi
              icone={Thermometer}
              corIcone="bg-rose-50 text-rose-600"
              rotulo="Temperatura média (rodando)"
              valor={`${formatarNumero(resultado.resumo.temperatura.media, 1)} °C`}
              detalhe={`mín ${formatarNumero(resultado.resumo.temperatura.minimo, 1)} · máx ${formatarNumero(resultado.resumo.temperatura.maximo, 1)}`}
            />
            <CartaoKpi
              icone={Activity}
              corIcone="bg-blue-50 text-blue-600"
              rotulo="Vibração média (rodando)"
              valor={`${formatarNumero(resultado.resumo.vibracao.media, 2)} mm/s`}
              detalhe={`mín ${formatarNumero(resultado.resumo.vibracao.minimo, 2)} · máx ${formatarNumero(resultado.resumo.vibracao.maximo, 2)}`}
            />
            <CartaoKpi
              icone={Gauge}
              corIcone="bg-indigo-50 text-indigo-600"
              rotulo="Horas trabalhadas"
              valor={resultado.resumo.horas ? formatarHoras(resultado.resumo.horas.trabalhadas) : "—"}
              detalhe={resultado.resumo.horas ? undefined : "selecione 1 máquina"}
            />
          </div>
          <p className="-mt-2 text-[11px] text-slate-400">
            Temperatura e vibração acima são só de quando a máquina estava rodando de verdade —
            tempo parada (sensor ligado, máquina desligada) não entra na média nem no gráfico,
            senão ela ficaria mascarada.
          </p>

          {/* TENDÊNCIA */}
          {grafico.length > 1 && (
            <div className="grid gap-4 lg:grid-cols-2">
              <GraficoTendencia
                titulo="Temperatura por dia"
                icone={Thermometer}
                cor="#f43f5e"
                dados={grafico}
                campo="temperatura"
                unidade="°C"
                casas={1}
              />
              <GraficoTendencia
                titulo="Vibração por dia"
                icone={Activity}
                cor="#3b82f6"
                dados={grafico}
                campo="vibracao"
                unidade="mm/s"
                casas={2}
              />
            </div>
          )}

          {resultado.truncado && (
            <p className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-700">
              <TriangleAlert size={14} className="shrink-0" />
              Esse período tem mais leituras do que o limite de exportação ({LIMITE_LINHAS.toLocaleString("pt-BR")}).
              Os cartões e o gráfico acima já são do período inteiro; pra extrair tudo sem cortar,
              filtre por um intervalo menor (ex.: um dia por vez).
            </p>
          )}

          {/* TABELA + EXPORTAR */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/60 p-4">
              <div>
                <p className="text-sm text-slate-600">
                  Mostrando{" "}
                  <span className="font-semibold text-slate-800">
                    {Math.min(leiturasExibidas.length, LINHAS_NA_TELA).toLocaleString("pt-BR")}
                  </span>{" "}
                  de <span className="font-semibold text-slate-800">{leiturasExibidas.length.toLocaleString("pt-BR")}</span>{" "}
                  leitura(s)
                  {filtroStatus !== "todas" ? ` ${filtroStatus === "rodando" ? "rodando" : "parada"}` : ""}
                  {soForaDaFaixa ? " fora da faixa" : filtroStatus === "todas" ? " carregadas" : ""}
                  {maquinaId === "all" ? "" : ` de ${maquinaNome}`}.
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full bg-amber-400" /> acima do limite de atenção
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full bg-rose-500" /> acima do limite crítico
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-0.5 rounded-xl border border-slate-200 bg-white p-0.5">
                  {(
                    [
                      ["todas", "Todas"],
                      ["rodando", "Rodando"],
                      ["parada", "Parada"],
                    ] as const
                  ).map(([valor, rotulo]) => (
                    <button
                      key={valor}
                      type="button"
                      onClick={() => setFiltroStatus(valor)}
                      className={cn(
                        "rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors",
                        filtroStatus === valor ? "bg-slate-800 text-white" : "text-slate-500 hover:bg-slate-100"
                      )}
                    >
                      {rotulo}
                    </button>
                  ))}
                </div>

                {/* sempre visível (não só quando há anomalia): senão, ao trocar
                    o filtro pra um período sem nenhuma fora da faixa, o botão
                    sumia e não tinha como desmarcar o "só fora da faixa" que
                    tivesse ficado ligado de antes — ver o useEffect acima */}
                <button
                  type="button"
                  onClick={() => setSoForaDaFaixa((v) => !v)}
                  disabled={totalForaDaFaixa === 0}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold shadow-sm transition-all duration-150",
                    totalForaDaFaixa === 0
                      ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400"
                      : soForaDaFaixa
                      ? "border-rose-300 bg-rose-600 text-white hover:bg-rose-700"
                      : "border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-300 hover:bg-rose-100"
                  )}
                >
                  {soForaDaFaixa ? <X size={14} /> : <TriangleAlert size={14} />}
                  {totalForaDaFaixa === 0
                    ? "Nenhuma fora da faixa"
                    : soForaDaFaixa
                    ? "Mostrando só fora da faixa — clique pra ver todas"
                    : `${totalForaDaFaixa.toLocaleString("pt-BR")} fora da faixa — ver só essas`}
                </button>
                <button
                  type="button"
                  onClick={exportar}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-all duration-150 hover:bg-emerald-700 hover:shadow-md"
                >
                  <Download size={14} /> Exportar CSV ({resultado.leituras.length.toLocaleString("pt-BR")})
                </button>
              </div>
            </div>

            <div className="max-h-[480px] overflow-auto">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-2.5">Data/hora</th>
                    {maquinaId === "all" && <th className="px-4 py-2.5">Máquina</th>}
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5">Temperatura</th>
                    <th className="px-4 py-2.5">Vibração</th>
                    <th className="px-4 py-2.5">Horímetro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leiturasExibidas.slice(0, LINHAS_NA_TELA).map(({ l, nivel }) => (
                    <LinhaLeitura key={l.id} l={l} nivel={nivel} mostrarMaquina={maquinaId === "all"} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function LinhaLeitura({
  l,
  nivel,
  mostrarMaquina,
}: {
  l: TelemetriaLeituraComMaquina;
  nivel: "ok" | "atencao" | "critico";
  mostrarMaquina: boolean;
}) {
  const nivelTemp = nivelTemperatura(l.temperatura, l.limites?.temperatura);
  const nivelVib = nivelVibracao(l.vibracao, l.limites?.vibracao);
  const rodando = l.vibracao !== null && l.vibracao >= LIMIAR_VIBRACAO_RODANDO;

  return (
    <tr
      className={cn(
        "text-slate-700 transition-colors",
        nivel === "critico"
          ? "bg-rose-50/70 hover:bg-rose-50"
          : nivel === "atencao"
          ? "bg-amber-50/60 hover:bg-amber-50"
          : "hover:bg-slate-50/80"
      )}
    >
      <td className="whitespace-nowrap px-4 py-2 text-xs text-slate-500">
        {new Date(l.recebido_em).toLocaleString("pt-BR")}
      </td>
      {mostrarMaquina && <td className="truncate px-4 py-2">{l.maquina_nome ?? "—"}</td>}
      <td className="px-4 py-2">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold",
            rodando ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
          )}
        >
          <span className={cn("size-1.5 rounded-full", rodando ? "bg-emerald-500" : "bg-slate-400")} />
          {rodando ? "Rodando" : "Parada"}
        </span>
      </td>
      <td
        className={cn(
          "px-4 py-2 tabular-nums",
          nivelTemp !== "ok" && nivelTemp !== "sem-dado" && cn("rounded-md font-semibold", NIVEL_UI[nivelTemp].texto)
        )}
      >
        {formatarNumero(l.temperatura, 1)} °C
      </td>
      <td
        className={cn(
          "px-4 py-2 tabular-nums",
          nivelVib !== "ok" && nivelVib !== "sem-dado" && cn("rounded-md font-semibold", NIVEL_UI[nivelVib].texto)
        )}
      >
        {formatarNumero(l.vibracao, 2)} mm/s
      </td>
      <td className="px-4 py-2 tabular-nums">{formatarHoras(l.horas_ligadas)}</td>
    </tr>
  );
}

function CartaoKpi({
  icone: Icone,
  corIcone,
  rotulo,
  valor,
  detalhe,
}: {
  icone: typeof Thermometer;
  corIcone: string;
  rotulo: string;
  valor: string;
  detalhe?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", corIcone)}>
          <Icone size={18} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-slate-400">{rotulo}</p>
          <p className="text-xl font-bold tabular-nums text-slate-900">{valor}</p>
        </div>
      </div>
      {detalhe && <p className="mt-2 pl-[52px] text-xs text-slate-400">{detalhe}</p>}
    </div>
  );
}

function GraficoTendencia({
  titulo,
  icone: Icone,
  cor,
  dados,
  campo,
  unidade,
  casas,
}: {
  titulo: string;
  icone: typeof Thermometer;
  cor: string;
  dados: { rotulo: string; temperatura: number | null; vibracao: number | null }[];
  campo: "temperatura" | "vibracao";
  unidade: string;
  casas: number;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
        <Icone size={15} style={{ color: cor }} />
        {titulo}
      </div>
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={dados} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
            <defs>
              <linearGradient id={`grad-${campo}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={cor} stopOpacity={0.3} />
                <stop offset="100%" stopColor={cor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="rotulo" tick={{ fontSize: 10, fill: "#94a3b8" }} stroke="#e2e8f0" />
            <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} width={44} stroke="#e2e8f0" />
            <Tooltip
              formatter={(valor) => [`${formatarNumero(Number(valor), casas)} ${unidade}`, "média"]}
              labelStyle={{ fontSize: 11, color: "#64748b" }}
              contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e2e8f0" }}
            />
            <Area
              dataKey={campo}
              stroke={cor}
              strokeWidth={2.5}
              fill={`url(#grad-${campo})`}
              // SEM connectNulls: dia em que a máquina não rodou nada vira um
              // buraco de verdade na linha, não uma ponte escondendo que
              // faltou dado (ver FILTER em TelemetriaRepository.listarRelatorio)
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
