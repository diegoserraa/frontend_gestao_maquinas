import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  LabelList,
} from "recharts";

import {
  Inbox,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Wrench,
  Wallet,
  User
} from "lucide-react";

import { useDashboardGestor } from "../../hooks/useDashboardGestor";

import {
  KpiCard,
  SectionCard,
  DashboardSkeleton,
  DashboardErrorState,
  ChartEmptyState,
  PeriodoFilter,
  CHART_COLORS,
  toNumber,
  formatCurrency,
  formatCompactNumber,
  formatDiaCurto,
  formatMesCurto,
} from "./DashboardGestorParts";

import type { FiltroPeriodo } from "./DashboardGestorTypes";

const MEDALHA = ["🥇", "🥈", "🥉"];

// limites de severidade das preventivas vencidas
const LIMITE_CRITICO = 30;
const LIMITE_ALERTA = 7;

function severidadePreventiva(diasAtraso: number): "critico" | "alerta" | "recente" {
  if (diasAtraso >= LIMITE_CRITICO) return "critico";
  if (diasAtraso >= LIMITE_ALERTA) return "alerta";
  return "recente";
}

// estilos do card premium de Preventivas Vencidas — acento lateral +
// badge de ícone + pill, com uma paleta mais "cheia" que o resto do
// dashboard (esse card é intencionalmente diferente: é o que carrega
// mais urgência na tela)
const SEVERIDADE_STYLES = {
  critico: {
    accent: "border-l-red-500",
    icone: "bg-red-100 text-red-600",
    pill: "bg-red-50 text-red-700",
  },
  alerta: {
    accent: "border-l-amber-500",
    icone: "bg-amber-100 text-amber-600",
    pill: "bg-amber-50 text-amber-700",
  },
  recente: {
    accent: "border-l-blue-500",
    icone: "bg-blue-100 text-blue-600",
    pill: "bg-blue-50 text-blue-700",
  },
} as const;

// o hero do card muda de cor conforme a severidade mais alta presente
// no período — evita o card "gritar vermelho" quando na real só existe
// preventiva recente (baixa urgência), e mantém hero + lista sempre na
// mesma paleta em vez de conflitarem visualmente
function severidadePredominante(counts: {
  critico: number;
  alerta: number;
  recente: number;
}): "critico" | "alerta" | "recente" {
  if (counts.critico > 0) return "critico";
  if (counts.alerta > 0) return "alerta";
  return "recente";
}

const HERO_STYLES = {
  critico: {
    dot: "bg-red-500",
    topBorder: "border-t-red-400",
  },
  alerta: {
    dot: "bg-amber-500",
    topBorder: "border-t-amber-400",
  },
  recente: {
    dot: "bg-blue-500",
    topBorder: "border-t-blue-400",
  },
} as const;

// larguras mínimas dos gráficos de série temporal — abaixo desse
// tamanho o gráfico ocupa 100% do card normalmente; acima disso
// (muitos dias/meses no período) o card vira scroll horizontal em
// vez de espremer os pontos até ficar ilegível.
function chartScrollWidth(count: number, perItem: number, min: number) {
  return Math.max(count * perItem, min);
}

type Props = {
  periodo: FiltroPeriodo;
  onPeriodoChange: (periodo: FiltroPeriodo) => void;
};

export function DashboardGestorDesktop({ periodo, onPeriodoChange }: Props) {
  const {
    loading,
    erro,
    atualizadoEm,
    kpis,
    evolucao,
    tempoMedioResolucao,
    maquinasParadas,
    preventivasVencidas,
    rankingTecnicos,
    custos,
    refetch,
  } = useDashboardGestor(periodo.dataInicio, periodo.dataFim);

  if (erro) return <DashboardErrorState onRetry={refetch} />;
  if (loading || !kpis) return <DashboardSkeleton />;

  const evolucaoData = evolucao.map((p) => ({
    label: formatDiaCurto(p.dia),
    total: toNumber(p.total),
  }));

  const tempoMedioData =
    tempoMedioResolucao?.evolucao?.map((item) => ({
      dia: formatDiaCurto(item.dia),
      tempo: Number((item.segundos / 3600).toFixed(2)),
      formatado: item.formatado,
    })) ?? [];

  const maquinasData = [...maquinasParadas]
    .map((m) => ({ nome: m.nome, total: toNumber(m.total) }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  const custosEvolucaoData = (custos?.evolucao ?? []).map((p) => ({
    label: formatMesCurto(p.mes),
    total: toNumber(p.total),
  }));

  const atribuidas = toNumber(kpis.os_atribuidas);

  const maxTecnicoTotal = Math.max(...rankingTecnicos.map((t) => toNumber(t.total)), 1);

  const evolucaoWidth = chartScrollWidth(evolucaoData.length, 42, 480);
  const tempoMedioWidth = chartScrollWidth(tempoMedioData.length, 42, 480);
  const custosWidth = chartScrollWidth(custosEvolucaoData.length, 70, 320);

  // ── PREVENTIVAS VENCIDAS — dados derivados ────────────────
  const preventivasMaquinas = preventivasVencidas?.maquinas ?? [];
  const preventivasTotal = preventivasVencidas?.resumo?.total ?? preventivasMaquinas.length;

  const preventivasCriticas = preventivasMaquinas.filter((m) => severidadePreventiva(m.dias_atraso) === "critico").length;
  const preventivasAlertas = preventivasMaquinas.filter((m) => severidadePreventiva(m.dias_atraso) === "alerta").length;
  const preventivasRecentes = preventivasMaquinas.filter((m) => severidadePreventiva(m.dias_atraso) === "recente").length;

  const heroSeveridade = severidadePredominante({
    critico: preventivasCriticas,
    alerta: preventivasAlertas,
    recente: preventivasRecentes,
  });
  const hero = HERO_STYLES[heroSeveridade];

  const preventivasBorderColor =
    preventivasMaquinas.length === 0 ? "border-t-emerald-400" : HERO_STYLES[heroSeveridade].topBorder;

  // cópia antes de ordenar — sort() muta o array original
  const preventivasOrdenadas = [...preventivasMaquinas].sort((a, b) => b.dias_atraso - a.dias_atraso);
  const preventivasVisiveis = preventivasOrdenadas.slice(0, 6);
  const preventivasRestantes = preventivasOrdenadas.length - preventivasVisiveis.length;

  return (
    <div className="space-y-6">
      {/* estilo local: remove o contorno de foco preto que o Recharts
          desenha ao clicar no gráfico (accessibilityLayer) e estiliza a
          scrollbar horizontal dos cards com scroll */}
      <style>{`
        .chart-scroll {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 transparent;
        }
        .chart-scroll::-webkit-scrollbar { height: 6px; }
        .chart-scroll::-webkit-scrollbar-track { background: transparent; }
        .chart-scroll::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 9999px;
        }
        .chart-scroll::-webkit-scrollbar-thumb:hover { background-color: #94a3b8; }
        .recharts-wrapper:focus,
        .recharts-wrapper *:focus,
        .recharts-surface:focus,
        .recharts-surface *:focus {
          outline: none !important;
        }
      `}</style>

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Dashboard</h1>
          <p className="text-sm text-slate-500">
            Visão geral 
          </p>
        </div>

        <PeriodoFilter dataInicio={periodo.dataInicio} dataFim={periodo.dataFim} onChange={onPeriodoChange} />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <KpiCard
          label="OS Abertas"
          value={formatCompactNumber(kpis.os_abertas)}
          icon={<Inbox size={20} />}
          colorClass="bg-blue-50 text-blue-600"
        />
        <KpiCard
          label="Em Andamento"
          value={formatCompactNumber(kpis.os_andamento)}
          icon={<Clock size={20} />}
          colorClass="bg-amber-50 text-amber-600"
        />
        <KpiCard
          label="Atribuídas"
          value={formatCompactNumber(kpis.os_atribuidas)}
          icon={<User size={20} />}
          colorClass="bg-gradient-to-br from-cyan-50 to-sky-100 text-cyan-700"
        />
        <KpiCard
          label="Finalizadas"
          value={formatCompactNumber(kpis.os_finalizadas)}
          icon={<CheckCircle2 size={20} />}
          colorClass="bg-emerald-50 text-emerald-600"
        />
        <KpiCard
          label="Preventivas"
          value={formatCompactNumber(kpis.preventivas)}
          icon={<ShieldCheck size={20} />}
          colorClass="bg-violet-50 text-violet-600"
        />
        <KpiCard
          label="Corretivas"
          value={formatCompactNumber(kpis.corretivas)}
          icon={<Wrench size={20} />}
          colorClass="bg-rose-50 text-rose-600"
        />
      </div>

      {/* EVOLUÇÃO + TEMPO MÉDIO — 50/50 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <SectionCard
          title="Evolução de Ordens de Serviço"
          subtitle="Total de OS abertas por dia, no período"
          className="border-t-4 border-t-blue-400 min-w-0"
        >
          {evolucaoData.length === 0 ? (
            <ChartEmptyState />
          ) : (
            <div className="chart-scroll overflow-x-auto -mx-1 px-1">
              <div style={{ minWidth: evolucaoWidth }}>
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart
                    data={evolucaoData}
                    margin={{ top: 0, right: 10, left: -20, bottom: 0 }}
                    accessibilityLayer={false}
                  >
                    <defs>
                      <linearGradient id="evolucaoGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.azul} stopOpacity={0.35} />
                        <stop offset="95%" stopColor={CHART_COLORS.azul} stopOpacity={0} />
                      </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />

                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <YAxis
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />

                    <Tooltip
                      contentStyle={{
                        borderRadius: 8,
                        border: "1px solid #e2e8f0",
                        fontSize: 12,
                      }}
                    />

                    <Area
                      type="monotone"
                      dataKey="total"
                      name="OS"
                      stroke={CHART_COLORS.azul}
                      fill="url(#evolucaoGrad)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Tempo Médio de Resolução"
          subtitle={`Média geral: ${tempoMedioResolucao?.resumo?.formatado ?? "0min"}`}
          className="border-t-4 border-t-violet-400 min-w-0"
        >
          {tempoMedioData.length === 0 ? (
            <ChartEmptyState />
          ) : (
            <div className="chart-scroll overflow-x-auto -mx-1 px-1">
              <div style={{ minWidth: tempoMedioWidth }}>
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart
                    data={tempoMedioData}
                    margin={{ top: 0, right: 10, left: -20, bottom: 0 }}
                    accessibilityLayer={false}
                  >
                    <defs>
                      <linearGradient id="tempoMedioGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.violeta} stopOpacity={0.35} />
                        <stop offset="95%" stopColor={CHART_COLORS.violeta} stopOpacity={0} />
                      </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />

                    <XAxis
                      dataKey="dia"
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <YAxis
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `${v}h`}
                    />

                    <Tooltip
                      formatter={(_value, _name, props) => [
                        props?.payload?.formatado ?? "",
                        "Tempo médio",
                      ]}
                      contentStyle={{
                        borderRadius: 8,
                        border: "1px solid #e2e8f0",
                        fontSize: 12,
                      }}
                    />

                    <Area
                      type="monotone"
                      dataKey="tempo"
                      name="Tempo médio"
                      stroke={CHART_COLORS.violeta}
                      fill="url(#tempoMedioGrad)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </SectionCard>
      </div>

      {/* PREVENTIVAS VENCIDAS + RANKING + MÁQUINAS PARADAS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SectionCard
          title="Preventivas Vencidas"
          subtitle={`${preventivasTotal} máquina${preventivasTotal === 1 ? "" : "s"} com manutenção atrasada`}
          className={`border-t-4 ${preventivasBorderColor}`}
        >
          {preventivasMaquinas.length === 0 ? (
            <ChartEmptyState label="Nenhuma preventiva vencida — tudo em dia 🎉" />
          ) : (
            <div className="h-full flex flex-col gap-4">
              {/* INDICADOR — sem bloco/banner, só um "status dot" pulsante
                  (mesma linguagem de indicadores de status usada em
                  dashboards premium) + o total e os chips de severidade,
                  na mesma paleta neutra do resto do card */}
              <div className="flex items-center justify-between flex-wrap gap-2 shrink-0">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-2.5 w-2.5">
                    <span
                      className={`absolute inline-flex h-full w-full rounded-full ${hero.dot} opacity-75 animate-ping`}
                    />
                    <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${hero.dot}`} />
                  </span>
                  <span className="text-2xl font-bold text-slate-800 tabular-nums">{preventivasTotal}</span>
                  <span className="text-sm text-slate-400">
                    atrasada{preventivasTotal === 1 ? "" : "s"}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {preventivasCriticas > 0 && (
                    <span className={`text-[11px] font-semibold px-2 py-1 rounded-full ${SEVERIDADE_STYLES.critico.pill}`}>
                      {preventivasCriticas} crítica{preventivasCriticas === 1 ? "" : "s"}
                    </span>
                  )}
                  {preventivasAlertas > 0 && (
                    <span className={`text-[11px] font-semibold px-2 py-1 rounded-full ${SEVERIDADE_STYLES.alerta.pill}`}>
                      {preventivasAlertas} atenção
                    </span>
                  )}
                  {preventivasRecentes > 0 && (
                    <span className={`text-[11px] font-semibold px-2 py-1 rounded-full ${SEVERIDADE_STYLES.recente.pill}`}>
                      {preventivasRecentes} recente{preventivasRecentes === 1 ? "" : "s"}
                    </span>
                  )}
                </div>
              </div>

              {/* LISTA — cards individuais com acento lateral, em vez da
                  barra de fundo proporcional usada no Ranking de Técnicos */}
              <div className="space-y-2 shrink-0">
                {preventivasVisiveis.map((maquina) => {
                  const sev = severidadePreventiva(maquina.dias_atraso);
                  const styles = SEVERIDADE_STYLES[sev];

                  return (
                    <div
                      key={maquina.maquina_id}
                      className={`
                        flex items-center gap-3 rounded-xl border border-slate-100 bg-white
                        pl-3 pr-3 py-2.5 border-l-4 ${styles.accent}
                        shadow-sm hover:shadow-md hover:-translate-y-0.5
                        transition-all duration-200
                      `}
                    >
                      <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${styles.icone}`}>
                        <Wrench size={15} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-800 truncate">{maquina.nome}</p>
                        <p className="text-[11px] text-slate-400">Manutenção preventiva vencida</p>
                      </div>
                      <span className={`text-xs font-bold rounded-full px-2.5 py-1 shrink-0 ${styles.pill}`}>
                        {maquina.dias_atraso}d
                      </span>
                    </div>
                  );
                })}
              </div>

              {preventivasRestantes > 0 ? (
                <p className="text-center text-xs text-slate-400 pt-1">
                  +{preventivasRestantes} outra{preventivasRestantes === 1 ? "" : "s"} máquina
                  {preventivasRestantes === 1 ? "" : "s"} atrasada{preventivasRestantes === 1 ? "" : "s"}
                </p>
              ) : (
                preventivasVisiveis.length <= 3 && (
                  // preenche o espaço sobrando quando a lista é curta, em
                  // vez de deixar um vão em branco embaixo (o grid estica
                  // o card pra mesma altura dos vizinhos)
                  <div className="flex-1 min-h-[56px] flex items-center justify-center rounded-xl border border-dashed border-slate-200">
                    <p className="text-xs text-slate-400 text-center px-4">
                      As demais máquinas estão com a preventiva em dia ✅
                    </p>
                  </div>
                )
              )}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Ranking de Técnicos"
          subtitle="OS finalizadas no período"
          className="border-t-4 border-t-emerald-400"
        >
          {rankingTecnicos.length === 0 ? (
            <ChartEmptyState />
          ) : (
            <div className="space-y-1.5">
              {rankingTecnicos.slice(0, 6).map((tec, i) => {
                const pct = (toNumber(tec.total) / maxTecnicoTotal) * 100;
                return (
                  <div key={tec.id} className="relative rounded-lg overflow-hidden group">
                    <div
                      className="absolute inset-y-0 left-0 bg-emerald-50 transition-all duration-300 group-hover:bg-emerald-100"
                      style={{ width: `${pct}%` }}
                    />
                    <div className="relative flex items-center gap-3 py-2 px-2">
                      <span className="w-6 text-center text-sm shrink-0">
                        {i < 3 ? MEDALHA[i] : <span className="text-slate-400 font-medium">{i + 1}º</span>}
                      </span>
                      <span className="flex-1 text-sm text-slate-700 truncate font-medium">{tec.nome}</span>
                      <span className="text-sm font-bold text-slate-800 shrink-0">{formatCompactNumber(tec.total)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Máquinas com Mais Chamados"
          subtitle="Top 8 no período"
          className="border-t-4 border-t-red-400"
        >
          {maquinasData.length === 0 ? (
            <ChartEmptyState />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={maquinasData}
                layout="vertical"
                margin={{ top: 0, right: 24, left: 0, bottom: 0 }}
                accessibilityLayer={false}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} hide />
                <YAxis
                  type="category"
                  dataKey="nome"
                  width={90}
                  tick={{ fontSize: 11, fill: "#475569" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13 }} />
                <Bar dataKey="total" name="Chamados" fill={CHART_COLORS.vermelho} radius={[0, 4, 4, 0]} barSize={14}>
                  <LabelList dataKey="total" position="right" style={{ fontSize: 11, fill: "#475569", fontWeight: 600 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </SectionCard>
      </div>

      {/* CUSTOS — gráfico e lista lado a lado, em vez de empilhados,
          pra ocupar bem menos altura na tela */}
      {custos && (
        <SectionCard
          title="Custos de Manutenção"
          subtitle="Material, terceirizado e evolução mensal"
          className="border-t-4 border-t-slate-300"
        >
          {/* resumo — linha única e compacta */}
          <div className="grid grid-cols-3 gap-2.5 mb-4">
            <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
              <p className="text-[11px] text-slate-500">Material</p>
              <p className="text-sm font-bold text-slate-800 truncate">{formatCurrency(custos.resumo.material)}</p>
            </div>
            <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
              <p className="text-[11px] text-slate-500">Terceirizado</p>
              <p className="text-sm font-bold text-slate-800 truncate">{formatCurrency(custos.resumo.terceirizado)}</p>
            </div>
            <div className="rounded-lg bg-blue-50 border border-blue-100 px-3 py-2">
              <p className="text-[11px] text-blue-500">Total</p>
              <p className="text-sm font-bold text-blue-700 truncate">{formatCurrency(custos.resumo.total)}</p>
            </div>
          </div>

          {/* evolução mensal + custo por máquina, lado a lado */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-3 min-w-0">
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-1.5">
                Evolução mensal
              </p>
              {custosEvolucaoData.length === 0 ? (
                <ChartEmptyState />
              ) : (
                <div className="chart-scroll overflow-x-auto -mx-1 px-1">
                  <div style={{ minWidth: custosWidth }}>
                    <ResponsiveContainer width="100%" height={150}>
                      <BarChart
                        data={custosEvolucaoData}
                        margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
                        accessibilityLayer={false}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${v}`} />
                        <Tooltip
                          formatter={(value) => formatCurrency(Number(value))}
                          contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13 }}
                          cursor={{ fill: "#f8fafc" }}
                        />
                        <Bar dataKey="total" name="Custo" fill={CHART_COLORS.violeta} radius={[4, 4, 0, 0]} barSize={24} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>

            {custos.maquinas.length > 0 && (
              <div className="lg:col-span-2 min-w-0">
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-1.5">
                  Custo por máquina
                </p>
                <div className="divide-y divide-slate-100 max-h-[150px] overflow-y-auto pr-1">
                  {[...custos.maquinas]
                    .sort((a, b) => toNumber(b.total) - toNumber(a.total))
                    .slice(0, 6)
                    .map((m) => (
                      <div key={m.nome} className="flex items-center justify-between py-1.5 text-sm">
                        <span className="text-slate-700 truncate">{m.nome}</span>
                        <span className="font-semibold text-slate-800 tabular-nums shrink-0 pl-2">
                          {formatCurrency(m.total)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </SectionCard>
      )}
    </div>
  );
}
