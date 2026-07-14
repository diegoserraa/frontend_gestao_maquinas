import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import React from "react";

export type Column<T> = {
  key: keyof T;
  label: string;
  render?: (value: any, row: T) => React.ReactNode;
};

interface Props<T> {
  columns: Column<T>[];
  data: T[];
  onRowDoubleClick?: (row: T) => void;
}

export function DataTable<T extends object>({
  columns,
  data,
  onRowDoubleClick,
}: Props<T>) {
  return (
    <div className="rounded-xl border border-blue-100 bg-white shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-blue-50">
          <TableRow>
            {columns.map((col) => (
              <TableHead key={String(col.key)}>
                {col.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>

        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="p-6 text-center text-slate-400"
              >
                Nenhuma informação encontrada
              </TableCell>
            </TableRow>
          ) : (
            data.map((row, i) => (
              <TableRow
                key={i}
                className="hover:bg-slate-50 transition cursor-pointer"
                onDoubleClick={() => onRowDoubleClick?.(row)}
              >
                {columns.map((col) => (
                  <TableCell key={String(col.key)}>
                    {/* 🔥 FIX PRINCIPAL: evita clique do botão ser engolido pela linha */}
                    <div
                      onMouseDown={(e) => {
                        e.stopPropagation();
                      }}
                      onClick={(e) => {
                        if (
                          (e.target as HTMLElement).closest("button")
                        ) {
                          e.stopPropagation();
                        }
                      }}
                    >
                      {col.render
                        ? col.render(row[col.key], row)
                        : String(row[col.key] ?? "-")}
                    </div>
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}