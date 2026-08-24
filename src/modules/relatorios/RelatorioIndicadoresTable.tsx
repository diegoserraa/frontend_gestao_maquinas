import { useEffect, useMemo, useState } from "react";
import { Gauge, Timer, TimerReset, Wrench, ShieldCheck, CalendarDays } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Pagination } from "@/components/data/Pagination";
import { DataTableLoading } from "@/components/data/DataTableLoading";

import type { IndicadorMaquinaItem } from "../relatorios/types";

function formatarTempo(segundos?: number | string | null) {
  if (
    segundos === null ||
    segundos === undefined ||
    segundos === ""
  ) {
    return "—";
  }

  const s = Number(segundos);

  if (Number.isNaN(s)) {
    return "—";
  }

  if (s < 60) {
    return `${s.toFixed(0)}s`;
  }

  if (s < 3600) {
    return `${Math.floor(s / 60)}min`;
  }

  if (s < 86400) {
    const horas = Math.floor(s / 3600);

    const minutos = Math.floor(
      (s % 3600) / 60
    );

    return `${horas}h ${minutos}min`;
  }

  return `${(s / 86400).toFixed(1)}d`;
}

function formatarData(data?: string | null) {
  if (!data) {
    return "-";
  }

  const d = new Date(data);

  if (Number.isNaN(d.getTime())) {
    return "-";
  }

  return d.toLocaleDateString("pt-BR");
}

/* =====================================================
   SKELETON — versão em cards, pro loading no mobile
===================================================== */

function CardsLoading() {
  return (
    <div className="space-y-2.5 sm:hidden">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-[168px] rounded-xl bg-slate-100 animate-pulse"
        />
      ))}
    </div>
  );
}

/* =====================================================
   CARD — item de indicador em telas pequenas
===================================================== */

function IndicadorMaquinaCard({ item }: { item: IndicadorMaquinaItem }) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-white ring-1 ring-slate-200/70 shadow-sm">
      <div className="absolute left-0 top-0 h-full w-1 bg-violet-400 opacity-80" />

      <div className="pl-4 pr-3.5 py-3.5">
        {/* HEADER */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500 ring-1 ring-inset ring-slate-200/70">
            <Gauge size={14} strokeWidth={1.8} />
          </div>

          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-slate-900 truncate">
              {item.maquina_nome}
            </p>
            <p className="text-[11px] text-slate-400 truncate">
              {item.setor_nome ?? "-"}
            </p>
          </div>
        </div>

        {/* OS: ABERTAS / TOTAL / FINALIZADAS */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-blue-50/70 px-2 py-1.5 text-center">
            <p className="text-[9px] font-semibold uppercase tracking-wide text-blue-500">
              Abertas
            </p>
            <p className="text-sm font-bold text-blue-700 tabular-nums">
              {item.os_abertas}
            </p>
          </div>

          <div className="rounded-lg bg-slate-50 px-2 py-1.5 text-center">
            <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
              Total
            </p>
            <p className="text-sm font-bold text-slate-700 tabular-nums">
              {item.total_os}
            </p>
          </div>

          <div className="rounded-lg bg-emerald-50/70 px-2 py-1.5 text-center">
            <p className="text-[9px] font-semibold uppercase tracking-wide text-emerald-500">
              Finaliz.
            </p>
            <p className="text-sm font-bold text-emerald-700 tabular-nums">
              {item.os_finalizadas}
            </p>
          </div>
        </div>

        {/* MTTR / MTBF */}
        <div className="mt-2.5 grid grid-cols-2 gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-100 px-2 py-1.5">
            <Timer size={12} className="text-slate-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                MTTR
              </p>
              <p className="text-xs font-semibold text-slate-700 truncate">
                {formatarTempo(item.mttr_segundos)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 rounded-lg border border-slate-100 px-2 py-1.5">
            <TimerReset size={12} className="text-slate-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                MTBF
              </p>
              <p className="text-xs font-semibold text-slate-700 truncate">
                {formatarTempo(item.mtbf_segundos)}
              </p>
            </div>
          </div>
        </div>

        {/* RODAPÉ */}
        <div className="mt-3 flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
              <Wrench size={11} className="text-rose-400" />
              {item.corretivas} corretiva{Number(item.corretivas) === 1 ? "" : "s"}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
              <ShieldCheck size={11} className="text-violet-400" />
              {item.preventivas} preventiva{Number(item.preventivas) === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400">
          <CalendarDays size={12} strokeWidth={1.8} />
          <span>Última manutenção: {formatarData(item.ultima_manutencao)}</span>
        </div>
      </div>
    </div>
  );
}

type Props = {
  dados: IndicadorMaquinaItem[];
  loading?: boolean;
};

export function RelatorioIndicadoresTable({
  dados,
  loading = false,
}: Props) {
  /* =====================================================
     PAGINAÇÃO
  ===================================================== */

  const [page, setPage] = useState(1);

  const [pageSize, setPageSize] = useState(5);

  /* =====================================================
     RESET DA PÁGINA
  ===================================================== */

  useEffect(() => {
    setPage(1);
  }, [dados, pageSize]);

  /* =====================================================
     DADOS PAGINADOS
  ===================================================== */

  const paginatedData = useMemo(() => {
    const inicio =
      (page - 1) * pageSize;

    const fim =
      page * pageSize;

    return dados.slice(inicio, fim);
  }, [
    dados,
    page,
    pageSize,
  ]);

  return (
    <div className="w-full">

      {/* =================================================
          LOADING
          MESMO PADRÃO DE SETORES E MÁQUINAS
      ================================================= */}

      {loading ? (
        <>
          <div className="hidden sm:block">
            <DataTableLoading />
          </div>
          <CardsLoading />
        </>
      ) : (
        <>
          {/* =================================================
              TABELA — telas sm+
          ================================================= */}

          <div className="hidden sm:block overflow-x-auto -mx-1 px-1">

            <Table>

              <TableHeader>

                <TableRow className="hover:bg-transparent">

                  <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Máquina
                  </TableHead>

                  <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Setor
                  </TableHead>

                  <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 text-right">
                    Abertas
                  </TableHead>

                  <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 text-right">
                    Total
                  </TableHead>

                  <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 text-right">
                    Finalizadas
                  </TableHead>

                  <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    MTTR
                  </TableHead>

                  <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    MTBF
                  </TableHead>

                  <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 text-right">
                    Corretivas
                  </TableHead>

                  <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 text-right">
                    Preventivas
                  </TableHead>

                  <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Última Manutenção
                  </TableHead>

                </TableRow>

              </TableHeader>

              <TableBody>

                {paginatedData.length === 0 ? (

                  <TableRow>

                    <TableCell
                      colSpan={10}
                      className="h-24 text-center text-sm text-slate-500"
                    >
                      Nenhum indicador encontrado.
                    </TableCell>

                  </TableRow>

                ) : (

                  paginatedData.map(
                    (item, index) => (

                      <TableRow
                        key={`${item.maquina_nome}-${index}`}
                        className="hover:bg-slate-50/60"
                      >

                        <TableCell className="text-xs font-semibold text-slate-700 max-w-[180px] truncate">
                          {item.maquina_nome}
                        </TableCell>

                        <TableCell className="text-xs text-slate-500">
                          {item.setor_nome ?? "-"}
                        </TableCell>

                        <TableCell className="text-xs text-slate-700 text-right tabular-nums">
                          {item.os_abertas}
                        </TableCell>

                        <TableCell className="text-xs text-slate-700 text-right tabular-nums">
                          {item.total_os}
                        </TableCell>

                        <TableCell className="text-xs text-slate-700 text-right tabular-nums">
                          {item.os_finalizadas}
                        </TableCell>

                        <TableCell className="text-xs text-slate-500">
                          {formatarTempo(
                            item.mttr_segundos
                          )}
                        </TableCell>

                        <TableCell className="text-xs text-slate-500">
                          {formatarTempo(
                            item.mtbf_segundos
                          )}
                        </TableCell>

                        <TableCell className="text-xs text-slate-700 text-right tabular-nums">
                          {item.corretivas}
                        </TableCell>

                        <TableCell className="text-xs text-slate-700 text-right tabular-nums">
                          {item.preventivas}
                        </TableCell>

                        <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                          {formatarData(
                            item.ultima_manutencao
                          )}
                        </TableCell>

                      </TableRow>

                    )
                  )

                )}

              </TableBody>

            </Table>

          </div>

          {/* =================================================
              CARDS — telas < sm
          ================================================= */}

          <div className="sm:hidden">
            {paginatedData.length === 0 ? (
              <div className="flex min-h-[140px] items-center justify-center rounded-xl bg-white ring-1 ring-slate-200/70">
                <p className="text-sm text-slate-500 text-center px-4">
                  Nenhum indicador encontrado.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {paginatedData.map((item, index) => (
                  <IndicadorMaquinaCard
                    key={`${item.maquina_nome}-${index}`}
                    item={item}
                  />
                ))}
              </div>
            )}
          </div>

          {/* =================================================
              PAGINAÇÃO
          ================================================= */}

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
