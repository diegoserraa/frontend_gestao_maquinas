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
} from "recharts";
import {
  Inbox,
  Clock,
  CheckCircle2,
  ShieldCheck,
  Wrench,
  Wallet,
  QrCode,
  User,
  ChevronDown,
} from "lucide-react";

import { useDashboardGestor } from "../../hooks/useDashboardGestor";
import {
  KpiCard,
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
} from "../dashboardGestor/DashboardGestorParts";
import type { FiltroPeriodo } from "./DashboardGestorTypes";
import { Button } from "@/components/ui/button";
import PwaScanner from "@/components/pwa/PwaScanner";
import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";

const MEDALHA = ["🥇", "🥈", "🥉"];

// limites de severidade das preventivas vencidas — mesma lógica do Desktop
const LIMITE_CRITICO = 30;
const LIMITE_ALERTA = 7;

function severidadePreventiva(diasAtraso: number): "critico" | "alerta" | "recente" {
  if (diasAtraso >= LIMITE_CRITICO) return "critico";
  if (diasAtraso >= LIMITE_ALERTA) return "alerta";
  return "recente";
}

const SEVERIDADE_STYLES = {
  critico: { icone: "bg-red-100 text-red-600", pill: "bg-red-100 text-red-700", accent: "border-l-red-500" },
  alerta: { icone: "bg-amber-100 text-amber-600", pill: "bg-amber-100 text-amber-700", accent: "border-l-amber-500" },
  recente: { icone: "bg-blue-100 text-blue-600", pill: "bg-blue-100 text-blue-700", accent: "border-l-blue-500" },
} as const;

// hero muda de cor conforme a severidade mais alta presente — igual ao Desktop
function severidadePredominante(counts: { critico: number; alerta: number; recente: number }) {
  if (counts.critico > 0) return "critico";
  if (counts.alerta > 0) return "alerta";
  return "recente";
}

const HERO_STYLES = {
  critico: { dot: "bg-red-500", topBorder: "border-t-red-400" },
  alerta: { dot: "bg-amber-500", topBorder: "border-t-amber-400" },
  recente: { dot: "bg-blue-500", topBorder: "border-t-blue-400" },
} as const;

// larguras mínimas dos gráficos de série temporal
function chartScrollWidth(count: number, perItem: number, min: number) {
  return Math.max(count * perItem, min);
}

// ── card expansível/recolhível ──────────────────────────────
// Substitui o SectionCard fixo nos cards de conteúdo (a partir da
// Evolução) por uma versão com cabeçalho clicável: seta gira e o
// conteúdo recolhe com uma animação de altura suave via CSS Grid
// (grid-template-rows 0fr → 1fr), sem precisar medir altura em JS
// nem depender de nenhuma lib nova.
function CollapsibleSection({
  title,
  subtitle,
  borderClass,
  defaultOpen = true,
  children,
}: {
  title: string;
  subtitle?: string;
  borderClass: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm p-4 border-t-4 ${borderClass}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 text-left"
      >
        <div className="min-w-0">
          <h3 className="font-semibold text-sm text-slate-800">{title}</h3>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5 truncate">{subtitle}</p>}
        </div>
        <ChevronDown
          size={18}
          className={`shrink-0 text-slate-400 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <div
        className={`grid transition-all duration-300 ease-in-out ${
          open ? "grid-rows-[1fr] opacity-100 mt-3" : "grid-rows-[0fr] opacity-0 mt-0"
        }`}
      >
        <div className="overflow-hidden min-h-0">{children}</div>
      </div>
    </div>
  );
}

type Props = {
  periodo: FiltroPeriodo;
  onPeriodoChange: (periodo: FiltroPeriodo) => void;
};

export function DashboardGestorMobile({ periodo, onPeriodoChange }: Props) {
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
  const [scannerAberto, setScannerAberto] = useState(false);
  const navigate = useNavigate();

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
  const preventivasBorderColor = preventivasMaquinas.length === 0 ? "border-t-emerald-400" : hero.topBorder;

  const preventivasVisiveis = [...preventivasMaquinas].sort((a, b) => b.dias_atraso - a.dias_atraso).slice(0, 5);
  const preventivasRestantes = Math.max(0, preventivasMaquinas.length - preventivasVisiveis.length);

  const maquinasData = [...maquinasParadas]
    .map((m) => ({ nome: m.nome, total: toNumber(m.total) }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);

  const custosEvolucaoData = (custos?.evolucao ?? []).map((p) => ({
    label: formatMesCurto(p.mes),
    total: toNumber(p.total),
  }));

  const evolucaoWidth = chartScrollWidth(evolucaoData.length, 36, 320);
  const tempoMedioWidth = chartScrollWidth(tempoMedioData.length, 36, 320);
  const custosWidth = chartScrollWidth(custosEvolucaoData.length, 56, 280);

  return (
    <div className="space-y-4 overflow-x-hidden">
      {/* mesmo estilo local do Desktop: remove o contorno de foco preto
          do Recharts ao clicar no gráfico, e estiliza a scrollbar
          horizontal dos cards com scroll */}
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

      {/* SCANNER PWA */}
      {scannerAberto && (
        <PwaScanner
          onClose={() => setScannerAberto(false)}
          onScan={(value) => {
            console.log("QR lido:", value);
            setScannerAberto(false);

            if (value.startsWith("http://") || value.startsWith("https://")) {
              window.location.href = value;
              return;
            }

            navigate(`/machines/${value}`);
          }}
        />
      )}

      {/* SCANNER QR */}
      <div className="w-full">
        <Button
          onClick={() => setScannerAberto(true)}
          className="
            w-full h-12 rounded-xl gap-3
            bg-emerald-600 hover:bg-emerald-700
            text-white font-semibold shadow-sm
            transition-all hover:shadow-md
          "
        >
          <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-white/15">
            <QrCode size={20} />
          </div>
          <span>Escanear Máquina</span>
        </Button>
      </div>

      {/* HEADER */}
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Dashboard</h1>
        <p className="text-xs text-slate-500">
          Visão geral do seu sistema
          {atualizadoEm && (
            <span className="text-slate-400">
              {" "}
              · {atualizadoEm.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </p>
      </div>

      {/* FILTRO */}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <PeriodoFilter dataInicio={periodo.dataInicio} dataFim={periodo.dataFim} onChange={onPeriodoChange} />
        </div>
      </div>

      {/* KPIs — 3 colunas no mobile */}
      <div className="grid grid-cols-3 gap-2.5">
        <KpiCard label="OS Abertas" value={formatCompactNumber(kpis.os_abertas)} icon={<Inbox size={17} />} colorClass="bg-blue-50 text-blue-600" />
        <KpiCard label="Em Andamento" value={formatCompactNumber(kpis.os_andamento)} icon={<Clock size={17} />} colorClass="bg-amber-50 text-amber-600" />
        <KpiCard
          label="Atribuídas"
          value={formatCompactNumber(kpis.os_atribuidas)}
          icon={<User size={20} />}
          colorClass="bg-gradient-to-br from-cyan-50 to-sky-100 text-cyan-700"
        />
        <KpiCard label="Finalizadas" value={formatCompactNumber(kpis.os_finalizadas)} icon={<CheckCircle2 size={17} />} colorClass="bg-emerald-50 text-emerald-600" />
        <KpiCard label="Preventivas" value={formatCompactNumber(kpis.preventivas)} icon={<ShieldCheck size={17} />} colorClass="bg-violet-50 text-violet-600" />
        <KpiCard label="Corretivas" value={formatCompactNumber(kpis.corretivas)} icon={<Wrench size={17} />} colorClass="bg-rose-50 text-rose-600" />
      </div>

      {/* EVOLUÇÃO */}
      <CollapsibleSection title="Evolução de OS" subtitle="Por dia, no período" borderClass="border-t-blue-400">
        {evolucaoData.length === 0 ? (
          <ChartEmptyState />
        ) : (
          <div className="chart-scroll overflow-x-auto">
            <div style={{ minWidth: evolucaoWidth }}>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={evolucaoData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }} accessibilityLayer={false}>
                  <defs>
                    <linearGradient id="evolucaoGradMobile" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.azul} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={CHART_COLORS.azul} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} width={24} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
                  <Area type="monotone" dataKey="total" name="OS" stroke={CHART_COLORS.azul} fill="url(#evolucaoGradMobile)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </CollapsibleSection>

      {/* TEMPO MÉDIO DE RESOLUÇÃO */}
      <CollapsibleSection
        title="Tempo Médio de Resolução"
        subtitle={`Média geral: ${tempoMedioResolucao?.resumo?.formatado ?? "0min"}`}
        borderClass="border-t-violet-400"
      >
        {tempoMedioData.length === 0 ? (
          <ChartEmptyState />
        ) : (
          <div className="chart-scroll overflow-x-auto">
            <div style={{ minWidth: tempoMedioWidth }}>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={tempoMedioData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }} accessibilityLayer={false}>
                  <defs>
                    <linearGradient id="tempoMedioGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="dia" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}h`} />
                  <Tooltip
                    formatter={(_value, _name, props) => [props?.payload?.formatado ?? "", "Tempo médio"]}
                    contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13 }}
                  />
                  <Area type="monotone" dataKey="tempo" name="Tempo médio" stroke="#8b5cf6" fill="url(#tempoMedioGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </CollapsibleSection>

      {/* PREVENTIVAS VENCIDAS */}
      <CollapsibleSection
        title="Preventivas Vencidas"
        subtitle={`${preventivasTotal} máquina${preventivasTotal === 1 ? "" : "s"} com manutenção atrasada`}
        borderClass={preventivasBorderColor}
      >
        {preventivasMaquinas.length === 0 ? (
          <ChartEmptyState label="Nenhuma preventiva vencida — tudo em dia 🎉" />
        ) : (
          <div className="h-full flex flex-col gap-4">
            {/* RESUMO */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className={`absolute inline-flex h-full w-full rounded-full ${hero.dot} opacity-75 animate-ping`} />
                  <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${hero.dot}`} />
                </span>
                <span className="text-2xl font-bold text-slate-800 tabular-nums">{preventivasTotal}</span>
                <span className="text-sm text-slate-400">atrasada{preventivasTotal === 1 ? "" : "s"}</span>
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

            {/* LISTA */}
            <div className="space-y-2">
              {preventivasVisiveis.map((maquina) => {
                const sev = severidadePreventiva(maquina.dias_atraso);
                const styles = SEVERIDADE_STYLES[sev];

                return (
                  <div
                    key={maquina.maquina_id}
                    className={`flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-3 py-2.5 shadow-sm hover:shadow-md transition-all border-l-4 ${styles.accent}`}
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

            {preventivasRestantes > 0 && (
              <p className="text-center text-xs text-slate-400">
                +{preventivasRestantes} outra{preventivasRestantes === 1 ? "" : "s"} máquina
                {preventivasRestantes === 1 ? "" : "s"} atrasada{preventivasRestantes === 1 ? "" : "s"}
              </p>
            )}
          </div>
        )}
      </CollapsibleSection>

      {/* RANKING TÉCNICOS */}
      <CollapsibleSection title="Ranking de Técnicos" subtitle="OS finalizadas no período" borderClass="border-t-emerald-400">
        {rankingTecnicos.length === 0 ? (
          <ChartEmptyState />
        ) : (
          <div className="space-y-1">
            {rankingTecnicos.slice(0, 6).map((tec, i) => (
              <div key={tec.id} className="flex items-center gap-3 py-2 px-1 rounded-lg active:bg-slate-50 transition">
                <span className="w-6 text-center text-sm shrink-0">
                  {i < 3 ? MEDALHA[i] : <span className="text-slate-400 font-medium">{i + 1}º</span>}
                </span>
                <span className="flex-1 text-sm text-slate-700 truncate">{tec.nome}</span>
                <span className="text-sm font-semibold text-slate-800 shrink-0">{formatCompactNumber(tec.total)}</span>
              </div>
            ))}
          </div>
        )}
      </CollapsibleSection>

      {/* MÁQUINAS COM MAIS CHAMADOS */}
      <CollapsibleSection title="Máquinas com Mais Chamados" subtitle="Top 6 no período" borderClass="border-t-red-400">
        {maquinasData.length === 0 ? (
          <ChartEmptyState />
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={maquinasData} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }} accessibilityLayer={false}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
              <XAxis type="number" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="nome" width={70} tick={{ fontSize: 10, fill: "#475569" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
              <Bar dataKey="total" name="Chamados" fill={CHART_COLORS.vermelho} radius={[0, 4, 4, 0]} barSize={12} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CollapsibleSection>

      {/* CUSTOS */}
      {custos && (
        <CollapsibleSection title="Custos de Manutenção" borderClass="border-t-slate-300">
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-2">
              <p className="text-[10px] text-slate-500">Material</p>
              <p className="text-sm font-bold text-slate-800 truncate">{formatCurrency(custos.resumo.material)}</p>
            </div>
            <div className="rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-2">
              <p className="text-[10px] text-slate-500">Terceiriz.</p>
              <p className="text-sm font-bold text-slate-800 truncate">{formatCurrency(custos.resumo.terceirizado)}</p>
            </div>
            <div className="rounded-lg bg-blue-50 border border-blue-100 px-2.5 py-2">
              <div className="flex items-center gap-1">
                <Wallet size={10} className="text-blue-500" />
                <p className="text-[10px] text-blue-500">Total</p>
              </div>
              <p className="text-sm font-bold text-blue-700 truncate">{formatCurrency(custos.resumo.total)}</p>
            </div>
          </div>

          {custosEvolucaoData.length > 0 && (
            <div className="mt-4">
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide mb-1.5">Evolução mensal</p>
              <div className="chart-scroll overflow-x-auto">
                <div style={{ minWidth: custosWidth }}>
                  <ResponsiveContainer width="100%" height={140}>
                    <BarChart data={custosEvolucaoData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }} accessibilityLayer={false}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={24} />
                      <Tooltip
                        formatter={(value) => formatCurrency(Number(value))}
                        contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
                        cursor={{ fill: "#f8fafc" }}
                      />
                      <Bar dataKey="total" name="Custo" fill={CHART_COLORS.violeta} radius={[4, 4, 0, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {custos.maquinas.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-100">
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide mb-2">Custo por máquina</p>
              <div className="divide-y divide-slate-100 max-h-[150px] overflow-y-auto pr-1">
                {[...custos.maquinas]
                  .sort((a, b) => toNumber(b.total) - toNumber(a.total))
                  .slice(0, 5)
                  .map((m) => (
                    <div key={m.nome} className="flex items-center justify-between py-1.5 text-xs">
                      <span className="text-slate-700 truncate">{m.nome}</span>
                      <span className="font-semibold text-slate-800 tabular-nums shrink-0 pl-2">{formatCurrency(m.total)}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </CollapsibleSection>
      )}
    </div>
  );
}
