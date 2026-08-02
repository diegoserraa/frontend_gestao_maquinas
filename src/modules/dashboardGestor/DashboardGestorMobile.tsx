import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import {
  Inbox,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  RefreshCw,
  Wrench,
  Wallet,
  QrCode
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
} from "../dashboardGestor/DashboardGestorParts";
import type { FiltroPeriodo } from "./DashboardGestorTypes";
import { Button } from "@/components/ui/button";
import PwaScanner from "@/components/pwa/PwaScanner";
import { useState, } from "react";
import { useNavigate } from "react-router-dom";

const MEDALHA = ["🥇", "🥈", "🥉"];

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

  const preventivasVisiveis = [...preventivasMaquinas]
  .sort((a, b) => b.dias_atraso - a.dias_atraso)
  .slice(0, 5);

const preventivasRestantes = Math.max(
  0,
  preventivasMaquinas.length - preventivasVisiveis.length
);

  const maquinasData = [...maquinasParadas]
    .map((m) => ({ nome: m.nome, total: toNumber(m.total) }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);

  const custosEvolucaoData = (custos?.evolucao ?? []).map((p) => ({
    label: formatMesCurto(p.mes),
    total: toNumber(p.total),
  }));

  const criticas = toNumber(kpis.os_criticas);

  return (
    
    <div className="space-y-4">
     {/* SCANNER PWA */}
           {scannerAberto && (
             <PwaScanner
               onClose={() => setScannerAberto(false)}
              onScan={(value) => {
  setScannerAberto(false);

  alert(value);

  const qr = value.trim();

  alert(qr);

  if (qr.startsWith("http")) {
    const path = new URL(qr).pathname;

    alert(path);

    navigate(path);
    return;
  }

  navigate(`/machines/${qr}`);
}}
             />
           )}
     
           {/* BOTÃO QR — flutuante, sempre acessível independente do dashboard */}
           {/* SCANNER QR - AÇÃO RÁPIDA */}
{/* SCANNER QR */}
{/* SCANNER QR */}
<div className="w-full">
  <Button
    onClick={() => setScannerAberto(true)}
    className="
      w-full
      h-12
      rounded-xl
      gap-3
      bg-emerald-600
      hover:bg-emerald-700
      text-white
      font-semibold
      shadow-sm
      transition-all
      hover:shadow-md
    "
  >
    <div
      className="
        flex
        items-center
        justify-center
        h-8
        w-8
        rounded-lg
        bg-white/15
      "
    >
      <QrCode size={20} />
    </div>

    <span>
      Escanear Máquina
    </span>
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

      {/* KPIs — 2 colunas no mobile */}
     <div className="grid grid-cols-3 gap-2.5">
  <KpiCard
    label="OS Abertas"
    value={formatCompactNumber(kpis.os_abertas)}
    icon={<Inbox size={17} />}
    colorClass="bg-blue-50 text-blue-600"
  />

  <KpiCard
    label="Em Andamento"
    value={formatCompactNumber(kpis.os_andamento)}
    icon={<Clock size={17} />}
    colorClass="bg-amber-50 text-amber-600"
  />

  <KpiCard
    label="Críticas"
    value={formatCompactNumber(kpis.os_criticas)}
    icon={<AlertTriangle size={17} />}
    colorClass="bg-red-50 text-red-600"
    highlight={criticas > 0}
  />

  <KpiCard
    label="Finalizadas"
    value={formatCompactNumber(kpis.os_finalizadas)}
    icon={<CheckCircle2 size={17} />}
    colorClass="bg-emerald-50 text-emerald-600"
  />

  <KpiCard
    label="Preventivas"
    value={formatCompactNumber(kpis.preventivas)}
    icon={<ShieldCheck size={17} />}
    colorClass="bg-violet-50 text-violet-600"
  />

  <KpiCard
    label="Corretivas"
    value={formatCompactNumber(kpis.corretivas)}
    icon={<Wrench size={17} />}
    colorClass="bg-rose-50 text-rose-600"
  />
</div>

      {/* EVOLUÇÃO */}
      <SectionCard title="Evolução de OS" subtitle="Por dia, no período">
        {evolucaoData.length === 0 ? (
          <ChartEmptyState />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={evolucaoData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
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
        )}
      </SectionCard>

      {/* DISPONIBILIDADE */}
     <SectionCard
  title="Tempo Médio de Resolução"
  subtitle={`Média geral: ${
    tempoMedioResolucao?.resumo?.formatado ?? "0min"
  }`}
>
  {tempoMedioData.length === 0 ? (
    <ChartEmptyState />
  ) : (
    <div className="w-full overflow-x-auto">
      <div
        className="min-w-full"
        style={{
          width: tempoMedioData.length > 10
            ? `${tempoMedioData.length * 55}px`
            : "100%",
        }}
      >
        <ResponsiveContainer
          width="100%"
          height={220}
        >
          <AreaChart
            data={tempoMedioData}
            margin={{
              top: 5,
              right: 20,
              left: -10,
              bottom: 0,
            }}
          >

            <defs>
              <linearGradient
                id="tempoMedioGrad"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor="#8b5cf6"
                  stopOpacity={0.35}
                />

                <stop
                  offset="95%"
                  stopColor="#8b5cf6"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>


            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#e2e8f0"
            />


            <XAxis
              dataKey="dia"
              tick={{
                fontSize: 12,
                fill: "#94a3b8",
              }}
              axisLine={false}
              tickLine={false}
            />


            <YAxis
              tick={{
                fontSize: 12,
                fill: "#94a3b8",
              }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}h`}
            />


            <Tooltip
              formatter={(_, __, props) =>
                props.payload?.formatado ?? ""
              }
              contentStyle={{
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                fontSize: 13,
              }}
            />


            <Area
              type="monotone"
              dataKey="tempo"
              name="Tempo médio"
              stroke="#8b5cf6"
              fill="url(#tempoMedioGrad)"
              strokeWidth={2}
            />

          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )}
</SectionCard>

      {/* TIPOS DE MANUTENÇÃO */}
<SectionCard
  title="Preventivas Vencidas"
  subtitle={`${preventivasTotal} máquina${preventivasTotal === 1 ? "" : "s"} com manutenção atrasada`}
  className="border-t-4 border-t-red-500"
>
  {preventivasMaquinas.length === 0 ? (
    <ChartEmptyState label="Nenhuma preventiva vencida — tudo em dia 🎉" />
  ) : (
    <div className="h-full flex flex-col gap-4">

      {/* RESUMO */}
      <div className="flex items-center justify-between flex-wrap gap-2">

        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
          </span>

          <span className="text-2xl font-bold text-slate-800">
            {preventivasTotal}
          </span>

          <span className="text-sm text-slate-400">
            atrasada{preventivasTotal === 1 ? "" : "s"}
          </span>
        </div>

        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-red-100 text-red-700">
          Atenção necessária
        </span>

      </div>

      {/* LISTA */}
      <div className="space-y-2">

        {preventivasVisiveis.map((maquina) => {

          const critico = maquina.dias_atraso >= 30;
          const alerta = maquina.dias_atraso >= 7;

          return (
            <div
              key={maquina.maquina_id}
              className={`
                flex items-center gap-3
                rounded-xl
                border border-slate-100
                bg-white
                px-3 py-2.5
                shadow-sm
                hover:shadow-md
                transition-all
                ${
                  critico
                    ? "border-l-4 border-l-red-500"
                    : alerta
                    ? "border-l-4 border-l-amber-500"
                    : "border-l-4 border-l-blue-500"
                }
              `}
            >

              <div
                className={`
                  h-9 w-9 rounded-xl
                  flex items-center justify-center
                  shrink-0
                  ${
                    critico
                      ? "bg-red-100 text-red-600"
                      : alerta
                      ? "bg-amber-100 text-amber-600"
                      : "bg-blue-100 text-blue-600"
                  }
                `}
              >
                <AlertTriangle size={15} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-800 truncate">
                  {maquina.nome}
                </p>

                <p className="text-[11px] text-slate-400">
                  Manutenção preventiva vencida
                </p>
              </div>

              <span
                className={`
                  text-xs font-bold rounded-full px-2.5 py-1 shrink-0
                  ${
                    critico
                      ? "bg-red-100 text-red-700"
                      : alerta
                      ? "bg-amber-100 text-amber-700"
                      : "bg-blue-100 text-blue-700"
                  }
                `}
              >
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
</SectionCard>

      {/* RANKING TÉCNICOS */}
      <SectionCard title="Ranking de Técnicos" subtitle="OS finalizadas no período">
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
      </SectionCard>

      {/* MÁQUINAS COM MAIS CHAMADOS */}
      <SectionCard title="Máquinas com Mais Chamados" subtitle="Top 6 no período">
        {maquinasData.length === 0 ? (
          <ChartEmptyState />
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={maquinasData} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
              <XAxis type="number" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="nome" width={70} tick={{ fontSize: 10, fill: "#475569" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
              <Bar dataKey="total" name="Chamados" fill={CHART_COLORS.vermelho} radius={[0, 4, 4, 0]} barSize={12} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </SectionCard>

      {/* CUSTOS */}
      {custos && (
        <SectionCard title="Custos de Manutenção">
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-2.5">
              <p className="text-[10px] text-slate-500">Material</p>
              <p className="text-sm font-bold text-slate-800 truncate">{formatCurrency(custos.resumo.material)}</p>
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-2.5">
              <p className="text-[10px] text-slate-500">Terceiriz.</p>
              <p className="text-sm font-bold text-slate-800 truncate">{formatCurrency(custos.resumo.terceirizado)}</p>
            </div>
            <div className="rounded-xl bg-blue-50 border border-blue-100 p-2.5 flex flex-col items-start">
              <div className="flex items-center gap-1">
                <Wallet size={11} className="text-blue-500" />
                <p className="text-[10px] text-blue-500">Total</p>
              </div>
              <p className="text-sm font-bold text-blue-700 truncate">{formatCurrency(custos.resumo.total)}</p>
            </div>
          </div>

          {custosEvolucaoData.length > 0 && (
            <div className="mt-4">
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={custosEvolucaoData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={24} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
                  <Bar dataKey="total" name="Custo" fill={CHART_COLORS.violeta} radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {custos.maquinas.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-100">
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide mb-2">
                Custo por máquina
              </p>
              <div className="divide-y divide-slate-100">
                {[...custos.maquinas]
                  .sort((a, b) => toNumber(b.total) - toNumber(a.total))
                  .slice(0, 5)
                  .map((m) => (
                    <div key={m.nome} className="flex items-center justify-between py-2 text-xs">
                      <span className="text-slate-700 truncate">{m.nome}</span>
                      <span className="font-semibold text-slate-800">{formatCurrency(m.total)}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </SectionCard>
      )}
    </div>
  );
}