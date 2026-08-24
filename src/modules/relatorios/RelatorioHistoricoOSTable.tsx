import { useEffect, useMemo, useState } from "react";
import { Wrench, CalendarDays, User } from "lucide-react";

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

import type { OrdemServicoRelatorioItem } from "../relatorios/types";

const STATUS_STYLES: Record<string, string> = {
  aberta: "bg-blue-50 text-blue-700 border-blue-100",
  aberto: "bg-blue-50 text-blue-700 border-blue-100",

  atribuida: "bg-cyan-50 text-cyan-700 border-cyan-100",

  andamento: "bg-amber-50 text-amber-700 border-amber-100",
  em_andamento: "bg-amber-50 text-amber-700 border-amber-100",

  finalizada: "bg-emerald-50 text-emerald-700 border-emerald-100",
  finalizado: "bg-emerald-50 text-emerald-700 border-emerald-100",

  cancelada: "bg-slate-100 text-slate-500 border-slate-200",
  cancelado: "bg-slate-100 text-slate-500 border-slate-200",
};

// versão da paleta de status usada como acento lateral + bolinha nos
// cards mobile — mesma lógica de cor do badge, só que resolvida pra
// um "dot" sólido em vez de bg claro + texto.
const STATUS_DOT: Record<string, string> = {
  aberta: "bg-blue-500",
  aberto: "bg-blue-500",
  atribuida: "bg-cyan-500",
  andamento: "bg-amber-500",
  em_andamento: "bg-amber-500",
  finalizada: "bg-emerald-500",
  finalizado: "bg-emerald-500",
  cancelada: "bg-slate-400",
  cancelado: "bg-slate-400",
};

const PRIORIDADE_STYLES: Record<string, string> = {
  alta: "bg-rose-50 text-rose-700 border-rose-100",
  urgente: "bg-rose-50 text-rose-700 border-rose-100",

  media: "bg-amber-50 text-amber-700 border-amber-100",
  média: "bg-amber-50 text-amber-700 border-amber-100",

  baixa: "bg-slate-100 text-slate-500 border-slate-200",
};

function normalizar(valor?: string | null) {
  return (valor ?? "")
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_");
}

function formatarData(data?: string | null) {
  if (!data) return "-";

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
          className="h-[104px] rounded-xl bg-slate-100 animate-pulse"
        />
      ))}
    </div>
  );
}

/* =====================================================
   CARD — item de OS em telas pequenas
===================================================== */

function OrdemServicoCardRelatorio({
  item,
}: {
  item: OrdemServicoRelatorioItem;
}) {
  const statusKey = normalizar(item.status);
  const prioridadeKey = normalizar(item.prioridade);

  const statusClass =
    STATUS_STYLES[statusKey] ??
    "bg-slate-100 text-slate-500 border-slate-200";

  const statusDot = STATUS_DOT[statusKey] ?? "bg-slate-400";

  const prioridadeClass =
    PRIORIDADE_STYLES[prioridadeKey] ??
    "bg-slate-100 text-slate-500 border-slate-200";

  return (
    <div className="relative overflow-hidden rounded-xl bg-white ring-1 ring-slate-200/70 shadow-sm">
      <div
        className={`absolute left-0 top-0 h-full w-1 ${statusDot} opacity-80`}
      />

      <div className="pl-4 pr-3.5 py-3.5">
        {/* HEADER */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500 ring-1 ring-inset ring-slate-200/70">
              <Wrench size={14} strokeWidth={1.8} />
            </div>

            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-slate-900 tabular-nums truncate">
                OS #{item.id}
              </p>
              <p className="text-[11px] text-slate-400 truncate">
                {item.maquina_nome}
              </p>
            </div>
          </div>

          <Badge
            variant="outline"
            className={`shrink-0 text-[10px] font-semibold ${statusClass}`}
          >
            {item.status}
          </Badge>
        </div>

        {/* META */}
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-slate-500">
          <span className="text-slate-400">{item.setor_nome ?? "-"}</span>

          {item.tecnico_nome && (
            <span className="inline-flex items-center gap-1">
              <User size={11} className="text-slate-300" />
              {item.tecnico_nome}
            </span>
          )}

          {item.tipo_manutencao && (
            <span className="text-slate-400">{item.tipo_manutencao}</span>
          )}
        </div>

        {/* RODAPÉ */}
        <div className="mt-3 flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <Badge
            variant="outline"
            className={`text-[10px] font-semibold ${prioridadeClass}`}
          >
            {item.prioridade ?? "-"}
          </Badge>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <CalendarDays size={12} strokeWidth={1.8} />
            <span>{formatarData(item.data_abertura)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =====================================================
   COMPONENTE PRINCIPAL
===================================================== */

export function RelatorioHistoricoOSTable({
  dados,
  loading = false,
}: {
  dados: OrdemServicoRelatorioItem[];
  loading?: boolean;
}) {
  /* =====================================================
     PAGINAÇÃO
  ===================================================== */

  const [page, setPage] = useState(1);

  const [pageSize, setPageSize] = useState(5);

  /* =====================================================
     VOLTAR PARA PRIMEIRA PÁGINA
     QUANDO OS DADOS OU TAMANHO MUDAR
  ===================================================== */

  useEffect(() => {
    setPage(1);
  }, [dados, pageSize]);

  /* =====================================================
     DADOS PAGINADOS
  ===================================================== */

  const paginatedData = useMemo(() => {
    const inicio = (page - 1) * pageSize;

    const fim = page * pageSize;

    return dados.slice(inicio, fim);
  }, [dados, page, pageSize]);

  /* =====================================================
     TABELA / CARDS
  ===================================================== */

  return (
    <div className="w-full">
      {/* =====================================================
          TABELA — telas sm+
      ===================================================== */}

      <div className="hidden sm:block overflow-x-auto -mx-1 px-1">
        {loading ? (
          <DataTableLoading />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  OS
                </TableHead>

                <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Máquina
                </TableHead>

                <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Setor
                </TableHead>

                <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Técnico
                </TableHead>

                <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Status
                </TableHead>

                <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Tipo
                </TableHead>

                <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Prioridade
                </TableHead>

                <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Abertura
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="h-24 text-center text-sm text-slate-500"
                  >
                    Nenhuma ordem de serviço encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((item) => {
                  const statusClass =
                    STATUS_STYLES[normalizar(item.status)] ??
                    "bg-slate-100 text-slate-500 border-slate-200";

                  const prioridadeClass =
                    PRIORIDADE_STYLES[normalizar(item.prioridade)] ??
                    "bg-slate-100 text-slate-500 border-slate-200";

                  return (
                    <TableRow key={item.id} className="hover:bg-slate-50/60">
                      <TableCell className="text-xs font-semibold text-slate-700 tabular-nums">
                        #{item.id}
                      </TableCell>

                      <TableCell className="text-xs text-slate-700 max-w-[180px] truncate">
                        {item.maquina_nome}
                      </TableCell>

                      <TableCell className="text-xs text-slate-500">
                        {item.setor_nome ?? "-"}
                      </TableCell>

                      <TableCell className="text-xs text-slate-500">
                        {item.tecnico_nome ?? "-"}
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-semibold ${statusClass}`}
                        >
                          {item.status}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-xs text-slate-500">
                        {item.tipo_manutencao ?? "-"}
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-semibold ${prioridadeClass}`}
                        >
                          {item.prioridade ?? "-"}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                        {formatarData(item.data_abertura)}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* =====================================================
          CARDS — telas < sm
      ===================================================== */}

      <div className="sm:hidden">
        {loading ? (
          <CardsLoading />
        ) : paginatedData.length === 0 ? (
          <div className="flex min-h-[140px] items-center justify-center rounded-xl bg-white ring-1 ring-slate-200/70">
            <p className="text-sm text-slate-500 text-center px-4">
              Nenhuma ordem de serviço encontrada.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {paginatedData.map((item) => (
              <OrdemServicoCardRelatorio key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>

      {/* =====================================================
          PAGINAÇÃO
      ===================================================== */}

      {!loading && (
        <Pagination
          page={page}
          totalItems={dados.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      )}
    </div>
  );
}
