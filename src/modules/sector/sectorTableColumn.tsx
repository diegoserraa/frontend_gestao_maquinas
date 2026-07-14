import type { Column } from "@/components/data/DataTable";
import type { Sector } from "./setorTypes";

import {
  Pencil,
  Trash2,
} from "lucide-react";

type Props = {
  onEdit: (sector: Sector) => void;
  onDelete: (sector: Sector) => void;
};

export function getSectorTableColumns({
  onEdit,
  onDelete,
}: Props): Column<Sector>[] {
  return [
    {
      key: "nome",
      label: "Setor",
      render: (_, row) => (
        <div className="flex flex-col">
          <span className="font-medium text-slate-900">
            {row.nome}
          </span>

          <span className="text-xs text-slate-400">
            ID #{row.id}
          </span>
        </div>
      ),
    },

   {
  key: "descricao",
  label: "Descrição",
  render: (value) => (
    <div
      title={value}
      className="
        max-w-[350px]
        truncate
        text-sm
        text-slate-600
        cursor-help
      "
    >
      {value}
    </div>
  ),
},

    {
      key: "id",
      label: "Ações",
      render: (_, row) => (
        <div className="flex gap-1">
          <button
            onClick={() => onEdit(row)}
            className="p-2 rounded-md hover:bg-blue-50 text-blue-600"
          >
            <Pencil size={14} />
          </button>

          <button
            onClick={() => onDelete(row)}
            className="p-2 rounded-md hover:bg-red-50 text-red-500"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];
}