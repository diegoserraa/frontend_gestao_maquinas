import { useEffect, useMemo, useState } from "react";
import { UserRound, Inbox, CheckCircle2, Flame, Timer } from "lucide-react";

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

import type { ProdutividadeTecnicoItem } from "../relatorios/types";

function formatarTempo(segundos?: number | string | null) {
  if (segundos === null || segundos === undefined || segundos === "") {
    return "—";
  }

  const s = Number(segundos);
  if (Number.isNaN(s)) return "—";

  if (s < 60) return `${s.toFixed(0)}s`;
  if (s < 3600) return `${Math.floor(s / 60)}min`;
  if (s < 86400) {
    const horas = Math.floor(s / 3600);
    const minutos = Math.floor((s % 3600) / 60);
    return `${horas}h ${minutos}min`;
  }
  return `${(s / 86400).toFixed(1)}d`;
}

/* =====================================================
   SKELETON — versão em cards, pro loading no mobile
===================================================== */

function CardsLoading() {
  return (
    <div className="space-y-2.5 sm:hidden">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-[136px] rounded-xl bg-slate-100 animate-pulse" />
      ))}
    </div>
  );
}

/* =====================================================
   CARD — item de técnico em telas pequenas
===================================================== */

function ProdutividadeTecnicoCard({ item }: { item: ProdutividadeTecnicoItem }) {
  const emAberto = Number(item.os_em_aberto);

  return (
    <div className="relative overflow-hidden rounded-xl bg-white ring-1 ring-slate-200/70 shadow-sm">
      <div
        className={`absolute left-0 top-0 h-full w-1 opacity-80 ${
          emAberto > 0 ? "bg-amber-400" : "bg-emerald-400"
        }`}
      />

      <div className="pl-4 pr-3.5 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500 ring-1 ring-inset ring-slate-200/70">
            <UserRound size={14} strokeWidth={1.8} />
          </div>
          <p className="min-w-0 text-[13px] font-semibold text-slate-900 truncate">
            {item.tecnico_nome}
          </p>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-amber-50/70 px-2 py-1.5 text-center">
            <p className="text-[9px] font-semibold uppercase tracking-wide text-amber-600">Em aberto</p>
            <p className="text-sm font-bold text-amber-700 tabular-nums">{item.os_em_aberto}</p>
          </div>

          <div className="rounded-lg bg-emerald-50/70 px-2 py-1.5 text-center">
            <p className="text-[9px] font-semibold uppercase tracking-wide text-emerald-500">Finaliz.</p>
            <p className="text-sm font-bold text-emerald-700 tabular-nums">{item.os_finalizadas}</p>
          </div>

          <div className="rounded-lg bg-rose-50/70 px-2 py-1.5 text-center">
            <p className="text-[9px] font-semibold uppercase tracking-wide text-rose-500">Alta prior.</p>
            <p className="text-sm font-bold text-rose-700 tabular-nums">{item.os_finalizadas_prioritarias}</p>
          </div>
        </div>

        <div className="mt-2.5 flex items-center gap-1.5 rounded-lg border border-slate-100 px-2 py-1.5">
          <Timer size={12} className="text-slate-400 shrink-0" />
          <p className="text-xs font-semibold text-slate-700">
            {formatarTempo(item.tempo_medio_atendimento_segundos)}
            <span className="ml-1 font-normal text-slate-400">tempo médio de atendimento</span>
          </p>
        </div>
      </div>
    </div>
  );
}

type Props = {
  dados: ProdutividadeTecnicoItem[];
  loading?: boolean;
};

export function RelatorioProdutividadeTecnicoTable({ dados, loading = false }: Props) {
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
          {/* TABELA — telas sm+ */}
          <div className="hidden sm:block overflow-x-auto -mx-1 px-1">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Técnico
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 text-right">
                    Em aberto (agora)
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 text-right">
                    Finalizadas no período
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 text-right">
                    Finaliz. alta prioridade
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Tempo médio de atendimento
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-sm text-slate-500">
                      Nenhum técnico encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((item) => (
                    <TableRow key={item.tecnico_id} className="hover:bg-slate-50/60">
                      <TableCell className="text-xs font-semibold text-slate-700 max-w-[200px] truncate">
                        {item.tecnico_nome}
                      </TableCell>
                      <TableCell className="text-xs text-right tabular-nums">
                        <span
                          className={`inline-flex items-center gap-1 font-semibold ${
                            Number(item.os_em_aberto) > 0 ? "text-amber-700" : "text-slate-400"
                          }`}
                        >
                          {Number(item.os_em_aberto) > 0 ? (
                            <Flame size={11} />
                          ) : (
                            <CheckCircle2 size={11} className="text-emerald-500" />
                          )}
                          {item.os_em_aberto}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-slate-700 text-right tabular-nums">
                        {item.os_finalizadas}
                      </TableCell>
                      <TableCell className="text-xs text-slate-700 text-right tabular-nums">
                        {item.os_finalizadas_prioritarias}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {formatarTempo(item.tempo_medio_atendimento_segundos)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* CARDS — telas < sm */}
          <div className="sm:hidden">
            {paginatedData.length === 0 ? (
              <div className="flex min-h-[140px] items-center justify-center rounded-xl bg-white ring-1 ring-slate-200/70">
                <div className="text-center px-4">
                  <Inbox size={20} className="mx-auto text-slate-300" />
                  <p className="mt-1.5 text-sm text-slate-500">Nenhum técnico encontrado.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {paginatedData.map((item) => (
                  <ProdutividadeTecnicoCard key={item.tecnico_id} item={item} />
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
