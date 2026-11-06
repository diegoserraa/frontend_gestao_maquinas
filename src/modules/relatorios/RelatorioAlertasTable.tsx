import { useEffect, useMemo, useState } from "react";
import { Thermometer, Activity, WifiOff, Inbox } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/data/Pagination";
import { DataTableLoading } from "@/components/data/DataTableLoading";

import type { AlertaMonitoramentoItem } from "../relatorios/types";

const ICONE_CHAVE: Record<string, typeof Thermometer> = {
  temperatura: Thermometer,
  vibracao: Activity,
  sinal: WifiOff,
};

const ROTULO_CHAVE: Record<string, string> = {
  temperatura: "Temperatura",
  vibracao: "Vibração",
  sinal: "Sem sinal",
};

const NIVEL_STYLES: Record<string, string> = {
  atencao: "bg-amber-50 text-amber-700 border-amber-100",
  critico: "bg-rose-50 text-rose-700 border-rose-100",
  sem_sinal: "bg-slate-100 text-slate-500 border-slate-200",
};

const ROTULO_NIVEL: Record<string, string> = {
  atencao: "Atenção",
  critico: "Crítico",
  sem_sinal: "Sem sinal",
};

const STATUS_STYLES: Record<string, string> = {
  aberto: "bg-blue-50 text-blue-700 border-blue-100",
  resolvido: "bg-emerald-50 text-emerald-700 border-emerald-100",
  convertido: "bg-violet-50 text-violet-700 border-violet-100",
};

const ROTULO_STATUS: Record<string, string> = {
  aberto: "Aberto",
  resolvido: "Resolvido",
  convertido: "Virou O.S.",
};

function formatarDuracao(segundos: number | string) {
  const s = Number(segundos);
  if (Number.isNaN(s)) return "—";
  if (s < 60) return `${Math.round(s)}s`;
  if (s < 3600) return `${Math.floor(s / 60)}min`;
  if (s < 86400) {
    const horas = Math.floor(s / 3600);
    const minutos = Math.floor((s % 3600) / 60);
    return `${horas}h ${minutos}min`;
  }
  return `${(s / 86400).toFixed(1)}d`;
}

function formatarDataHora(iso?: string | null) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function CardsLoading() {
  return (
    <div className="space-y-2.5 sm:hidden">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-[128px] rounded-xl bg-slate-100 animate-pulse" />
      ))}
    </div>
  );
}

function AlertaCard({ item }: { item: AlertaMonitoramentoItem }) {
  const Icone = ICONE_CHAVE[item.chave] ?? Activity;

  return (
    <div className="relative overflow-hidden rounded-xl bg-white ring-1 ring-slate-200/70 shadow-sm">
      <div
        className={`absolute left-0 top-0 h-full w-1 opacity-80 ${
          item.nivel === "critico" ? "bg-rose-400" : item.nivel === "atencao" ? "bg-amber-400" : "bg-slate-300"
        }`}
      />

      <div className="pl-4 pr-3.5 py-3.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500 ring-1 ring-inset ring-slate-200/70">
              <Icone size={14} strokeWidth={1.8} />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-slate-900 truncate">{item.maquina_nome}</p>
              <p className="text-[11px] text-slate-400 truncate">{item.setor_nome ?? "-"}</p>
            </div>
          </div>

          <Badge variant="outline" className={`text-[10px] shrink-0 ${NIVEL_STYLES[item.nivel] ?? ""}`}>
            {ROTULO_NIVEL[item.nivel] ?? item.nivel}
          </Badge>
        </div>

        <div className="mt-2.5 flex items-center justify-between gap-2 text-xs">
          <span className="text-slate-500">
            {ROTULO_CHAVE[item.chave] ?? item.chave}
            {item.valor !== null && item.valor !== undefined && (
              <span className="ml-1 font-semibold text-slate-700">{Number(item.valor).toFixed(1)}</span>
            )}
          </span>
          <span className="font-semibold text-slate-700">{formatarDuracao(item.duracao_segundos)}</span>
        </div>

        <div className="mt-2.5 flex items-center justify-between gap-2 pt-2.5 border-t border-slate-100">
          <Badge variant="outline" className={`text-[10px] ${STATUS_STYLES[item.status] ?? ""}`}>
            {ROTULO_STATUS[item.status] ?? item.status}
          </Badge>
          <span className="text-[11px] text-slate-400">{formatarDataHora(item.aberto_em)}</span>
        </div>
      </div>
    </div>
  );
}

type Props = {
  dados: AlertaMonitoramentoItem[];
  loading?: boolean;
};

export function RelatorioAlertasTable({ dados, loading = false }: Props) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  useEffect(() => {
    setPage(1);
  }, [dados, pageSize]);

  const paginatedData = useMemo(() => {
    const inicio = (page - 1) * pageSize;
    const fim = page * pageSize;
    return dados.slice(inicio, fim);
  }, [dados, page, pageSize]);

  return (
    <div className="w-full">
      {loading ? (
        <>
          <div className="hidden sm:block">
            <DataTableLoading />
          </div>
          <CardsLoading />
        </>
      ) : (
        <>
          <div className="hidden sm:block overflow-x-auto -mx-1 px-1">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Máquina</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Setor</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Métrica</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Nível</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 text-right">Valor</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 text-right">Duração</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Status</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Aberto em</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-sm text-slate-500">
                      Nenhum alerta encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((item) => {
                    const Icone = ICONE_CHAVE[item.chave] ?? Activity;
                    return (
                      <TableRow key={item.id} className="hover:bg-slate-50/60">
                        <TableCell className="text-xs font-semibold text-slate-700 max-w-[180px] truncate">
                          {item.maquina_nome}
                        </TableCell>
                        <TableCell className="text-xs text-slate-500">{item.setor_nome ?? "-"}</TableCell>
                        <TableCell className="text-xs text-slate-600">
                          <span className="inline-flex items-center gap-1.5">
                            <Icone size={12} className="text-slate-400" />
                            {ROTULO_CHAVE[item.chave] ?? item.chave}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-[10px] ${NIVEL_STYLES[item.nivel] ?? ""}`}>
                            {ROTULO_NIVEL[item.nivel] ?? item.nivel}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-slate-700 text-right tabular-nums">
                          {item.valor !== null && item.valor !== undefined ? Number(item.valor).toFixed(1) : "-"}
                        </TableCell>
                        <TableCell className="text-xs text-slate-700 text-right tabular-nums">
                          {formatarDuracao(item.duracao_segundos)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-[10px] ${STATUS_STYLES[item.status] ?? ""}`}>
                            {ROTULO_STATUS[item.status] ?? item.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                          {formatarDataHora(item.aberto_em)}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <div className="sm:hidden">
            {paginatedData.length === 0 ? (
              <div className="flex min-h-[140px] items-center justify-center rounded-xl bg-white ring-1 ring-slate-200/70">
                <div className="text-center px-4">
                  <Inbox size={20} className="mx-auto text-slate-300" />
                  <p className="mt-1.5 text-sm text-slate-500">Nenhum alerta encontrado.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {paginatedData.map((item) => (
                  <AlertaCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>

          <Pagination
            page={page}
            totalItems={dados.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </>
      )}
    </div>
  );
}
