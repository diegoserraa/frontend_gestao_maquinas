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
import { Loader2, Thermometer, Activity, Clock } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

import { getHistoricoAgregado } from "./monitoramentoService";
import type {
  FaixaHistorico,
  MetricaHistorico,
  PontoAgregado,
  TelemetriaAtual,
} from "./monitoramentoTypes";
import { formatarNumero } from "./monitoramentoHelpers";

type Props = {
  leitura: TelemetriaAtual | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const METRICAS: {
  chave: MetricaHistorico;
  rotulo: string;
  cor: string;
  unidade: string;
  icone: typeof Thermometer;
}[] = [
  { chave: "temperatura", rotulo: "Temperatura", cor: "#e11d48", unidade: "°C", icone: Thermometer },
  { chave: "vibracao", rotulo: "Vibração", cor: "#2563eb", unidade: "mm/s", icone: Activity },
  { chave: "horas_ligadas", rotulo: "Horas ligadas", cor: "#0f766e", unidade: "h", icone: Clock },
];

const FAIXAS: { chave: FaixaHistorico; rotulo: string }[] = [
  { chave: "1h", rotulo: "Hora" },
  { chave: "6h", rotulo: "6 horas" },
  { chave: "24h", rotulo: "Dia" },
  { chave: "7d", rotulo: "Semana" },
  { chave: "30d", rotulo: "Mês" },
];

// Cada faixa agora é 1 ponto por unidade de calendário (hora/dia/semana/mês),
// então o rótulo mostra só essa unidade — nunca duas ticks com o mesmo texto.
function rotuloEixo(iso: string, faixa: FaixaHistorico): string {
  const d = new Date(iso);

  switch (faixa) {
    case "1h": // Hora: 1 ponto por hora, minuto é sempre :00 -> não repete
      return `${d.toLocaleTimeString("pt-BR", { hour: "2-digit", hour12: false })}h`;

    case "6h": {
      // 6 horas: 1 ponto por bloco de 6h (00h/06h/12h/18h), span de vários
      // dias -> precisa da data junto, senão "00h" repetiria a cada dia
      const data = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      const hora = d.toLocaleTimeString("pt-BR", { hour: "2-digit", hour12: false });
      return `${data} ${hora}h`;
    }

    case "24h": // Dia: 1 ponto por dia -> "09/09"
    case "7d": // Semana: 1 ponto por semana (data de início da semana)
      return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

    case "30d": // Mês: 1 ponto por mês -> "ago", "set", "out"
      return d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
  }
}

export function TelemetriaHistoricoDialog({ leitura, open, onOpenChange }: Props) {
  const [pontos, setPontos] = useState<PontoAgregado[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [metrica, setMetrica] = useState<MetricaHistorico>("temperatura");
  const [faixa, setFaixa] = useState<FaixaHistorico>("24h");

  useEffect(() => {
    if (!open || !leitura) return;

    let cancelado = false;
    setCarregando(true);
    // limpa antes de buscar: nunca deixa o gráfico da faixa/métrica anterior
    // na tela rotulado com a faixa/métrica recém-selecionada
    setPontos([]);

    getHistoricoAgregado(leitura.maquina_id, faixa, metrica)
      .then((lista) => {
        if (!cancelado) setPontos(lista);
      })
      .catch(() => {
        if (!cancelado) setPontos([]);
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [open, leitura, faixa, metrica]);

  const cfg = METRICAS.find((m) => m.chave === metrica)!;

  const dados = useMemo(
    () =>
      pontos.map((p) => ({
        t: new Date(p.instante).getTime(),
        media: p.media,
        banda:
          p.minimo !== null && p.maximo !== null
            ? ([p.minimo, p.maximo] as [number, number])
            : undefined,
      })),
    [pontos]
  );

  // Ticks do eixo escolhidos por nós, de forma determinística — não
  // deixamos o auto-thinning do recharts decidir (ele corta índices meio
  // arbitrários e dá espaçamento inconsistente). Como cada faixa já é 1
  // ponto por unidade de calendário e os buckets vêm alinhados (início da
  // hora/bloco-de-6h/dia/semana/mês, não "agora"), cada tick já nasce
  // redondo — mostra todos, sem pular nenhum.
  const ticksEixo = useMemo(() => dados.map((d) => d.t), [dados]);

  // "Hora" tem 24 ticks — não cabem na horizontal sem sobrepor texto, então
  // só ela usa rótulo inclinado. As demais faixas têm poucos pontos e ficam
  // mais limpas retas, na horizontal.
  const eixoDenso = faixa === "1h";

  const stats = useMemo(() => {
    const medias = pontos
      .map((p) => p.media)
      .filter((v): v is number => v !== null && Number.isFinite(v));
    if (medias.length === 0) return null;

    const mins = pontos
      .map((p) => p.minimo)
      .filter((v): v is number => v !== null && Number.isFinite(v));
    const maxs = pontos
      .map((p) => p.maximo)
      .filter((v): v is number => v !== null && Number.isFinite(v));

    return {
      // "atual" vem sempre da leitura ao vivo (mesmo valor em qualquer aba) —
      // nunca do último ponto da série agregada, que muda de balde conforme
      // a faixa selecionada e faria o número pular ao trocar de aba. Se a
      // máquina não reporta esse metric agora, mostra "--" em vez de inventar.
      atual: leitura?.[metrica] ?? null,
      min: mins.length ? Math.min(...mins) : Math.min(...medias),
      max: maxs.length ? Math.max(...maxs) : Math.max(...medias),
      media: medias.reduce((a, b) => a + b, 0) / medias.length,
    };
  }, [pontos, leitura, metrica]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0">
        <DialogHeader>
          <DialogTitle>
            {leitura?.maquina_nome ?? `Máquina #${leitura?.maquina_id ?? ""}`}
          </DialogTitle>
          <DialogDescription>
            {leitura?.setor_nome ?? "Sem setor"} · histórico de telemetria
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 p-6">
          {/* MÉTRICA */}
          <div className="flex flex-wrap gap-2">
            {METRICAS.map((m) => {
              const Icone = m.icone;
              return (
                <button
                  key={m.chave}
                  type="button"
                  onClick={() => setMetrica(m.chave)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                    metrica === m.chave
                      ? "border-blue-200 bg-blue-50 text-blue-700"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <Icone size={13} />
                  {m.rotulo}
                </button>
              );
            })}
          </div>

          {/* FAIXA DE TEMPO */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
            {FAIXAS.map((f) => (
              <button
                key={f.chave}
                type="button"
                onClick={() => setFaixa(f.chave)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors",
                  faixa === f.chave
                    ? "bg-slate-900 text-white"
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                {f.rotulo}
              </button>
            ))}
          </div>

          {/* STATS */}
          {stats && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { label: "Atual", valor: stats.atual },
                { label: "Mínimo", valor: stats.min },
                { label: "Máximo", valor: stats.max },
                { label: "Média", valor: stats.media },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2"
                >
                  <div className="text-[10px] uppercase tracking-wide text-slate-400">
                    {s.label}
                  </div>
                  <div className="text-sm font-semibold tabular-nums text-slate-800">
                    {formatarNumero(s.valor, 2)}
                    <span className="ml-0.5 text-[10px] font-normal text-slate-400">
                      {cfg.unidade}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* GRÁFICO */}
          <div className="h-72 w-full rounded-xl border border-slate-200 bg-slate-50/40 p-3">
            {carregando && dados.length === 0 ? (
              <div className="flex h-full items-center justify-center gap-2 text-slate-400">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-xs">Carregando histórico...</span>
              </div>
            ) : dados.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-slate-400">
                Sem dados para esta faixa.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  // remonta o gráfico ao trocar faixa/métrica: evita o recharts
                  // reaproveitar eixo/ticks calculados para a seleção anterior
                  key={`${faixa}-${metrica}`}
                  data={dados}
                  // "6 horas" tem rótulo mais largo ("11/09 18h") e a última
                  // marca cai bem na borda direita do domínio — sem uma
                  // margem maior aqui, esse rótulo fica cortado
                  margin={{
                    top: 8,
                    right: faixa === "6h" ? 30 : 12,
                    bottom: eixoDenso ? 16 : 4,
                    left: -14,
                  }}
                >
                  <defs>
                    <linearGradient id="histMedia" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={cfg.cor} stopOpacity={0.25} />
                      <stop offset="100%" stopColor={cfg.cor} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="t"
                    type="number"
                    domain={["dataMin", "dataMax"]}
                    ticks={ticksEixo}
                    // interval=0: sem isso o recharts ainda aplica seu próprio
                    // corte de sobreposição por cima da lista de "ticks" que
                    // já escolhemos — teimando em pular metade mesmo com a
                    // lista explícita.
                    interval={0}
                    tickFormatter={(v) => rotuloEixo(new Date(v).toISOString(), faixa)}
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    // só "Hora" (24 ticks) precisa de texto inclinado pra
                    // caber sem sobrepor; as demais faixas têm poucos pontos
                    // e ficam retas na horizontal, mais limpas
                    angle={eixoDenso ? -40 : 0}
                    textAnchor={eixoDenso ? "end" : "middle"}
                    height={eixoDenso ? 38 : 24}
                    stroke="#e2e8f0"
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    width={50}
                    unit={cfg.unidade}
                    stroke="#e2e8f0"
                  />
                  <Tooltip
                    labelFormatter={(v) => rotuloEixo(new Date(v as number).toISOString(), faixa)}
                    formatter={(valor, nome) => {
                      if (nome === "banda" && Array.isArray(valor)) {
                        return [
                          `${formatarNumero(Number(valor[0]), 2)} – ${formatarNumero(Number(valor[1]), 2)} ${cfg.unidade}`,
                          "mín / máx",
                        ];
                      }
                      return [`${formatarNumero(Number(valor), 2)} ${cfg.unidade}`, "média"];
                    }}
                    labelStyle={{ fontSize: 11, color: "#64748b" }}
                    contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e2e8f0" }}
                  />
                  <Area
                    dataKey="banda"
                    stroke="none"
                    fill={cfg.cor}
                    fillOpacity={0.1}
                    isAnimationActive={false}
                    connectNulls
                  />
                  <Area
                    dataKey="media"
                    stroke={cfg.cor}
                    strokeWidth={2}
                    fill="url(#histMedia)"
                    isAnimationActive={false}
                    connectNulls
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          <p className="text-center text-[10px] text-slate-400">
            Linha = média do período · faixa clara = mínimo e máximo
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
