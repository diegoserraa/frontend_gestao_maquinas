import type { Column } from "@/components/data/DataTable";

import type { Partner } from "./partnerTypes";

import {
  Pencil,
  Trash2,
} from "lucide-react";

type Props = {
  onEdit: (
    partner: Partner
  ) => void;

  onDelete: (
    partner: Partner
  ) => void;
};

export function getPartnerTableColumns({
  onEdit,
  onDelete,
}: Props): Column<Partner>[] {
  return [
    {
      key: "nome",
      label: "Parceiro",
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
      key: "cnpj",
      label: "CNPJ",
      render: (value) => (
        <span className="text-sm text-slate-600">
          {value || "-"}
        </span>
      ),
    },

    {
      key: "telefone",
      label: "Telefone",
      render: (value) => (
        <span className="text-sm text-slate-600">
          {value || "-"}
        </span>
      ),
    },

    {
      key: "email",
      label: "E-mail",
      render: (value) => (
        <div
          title={String(value)}
          className="
            max-w-[250px]
            truncate
            text-sm
            text-slate-600
          "
        >
          {value || "-"}
        </div>
      ),
    },

    {
      key: "id",
      label: "Ações",
      render: (_, row) => (
        <div className="flex gap-1">
          <button
            onClick={() =>
              onEdit(row)
            }
            className="
              p-2
              rounded-md
              hover:bg-blue-50
              text-blue-600
            "
          >
            <Pencil size={14} />
          </button>

          <button
            onClick={() =>
              onDelete(row)
            }
            className="
              p-2
              rounded-md
              hover:bg-red-50
              text-red-500
            "
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];
}