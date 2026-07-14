import type { CardColumn } from "@/components/data/DataCard";
import type { Sector } from "./setorTypes";

import {
  Pencil,
  Trash2,
} from "lucide-react";

export function getSectorCardColumns(
  onEdit: (sector: Sector) => void,
  onDelete: (sector: Sector) => void
): CardColumn<Sector>[] {
  return [
    {
      render: (sector) => (
        <div
          className="
            w-full
            border
            border-slate-300
            rounded-xl
            bg-white
            p-4
            space-y-4
            shadow-sm
          "
        >
          <div>
               <p className="text-xs text-slate-500">
              ID #{sector.id}
            </p>
            <p className="font-medium text-slate-900">
              {sector.nome}
            </p>
          </div>

        <div>
  <p className="text-xs text-slate-500 mb-1">
    Descrição
  </p>

  <p
    title={sector.descricao}
    className="
      text-sm
      text-slate-700
      line-clamp-2
      break-all
      cursor-help
    "
  >
    {sector.descricao}
  </p>
</div>

          <div className="flex justify-end gap-1 border-t border-slate-300 pt-3">
            <button
              onClick={() => onEdit(sector)}
              className="
                p-2
                rounded-md
                border
                border-slate-300
                text-blue-600
                hover:bg-blue-50
              "
            >
              <Pencil size={14} />
            </button>

            <button
              onClick={() => onDelete(sector)}
              className="
                p-2
                rounded-md
                border
                border-slate-300
                text-red-500
                hover:bg-red-50
              "
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ),
    },
  ];
}