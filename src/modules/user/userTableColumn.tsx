import type { Column } from "@/components/data/DataTable";
import type { User } from "./userType";

import {
  Pencil,
  Power,
  Trash2,
} from "lucide-react";

type Props = {
  onEdit: (user: User) => void;
  onToggle: (id: number) => void;
  onDelete: (user: User) => void;
};

export function getUserTableColumns({
  onEdit,
  onToggle,
  onDelete,
}: Props): Column<User>[] {
  return [
    {
      key: "nome",
      label: "Usuário",
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
      key: "email",
      label: "E-mail",
    },

    {
      key: "role",
      label: "Perfil",
      render: (_, row) => (
        <span className="px-2 py-1 text-xs rounded-md bg-slate-100 text-slate-700">
          {row.role}
        </span>
      ),
    },

    {
      key: "ativo",
      label: "Status",
      render: (_, row) => (
        <span
          className={`text-xs px-2 py-1 rounded-md font-medium ${
            row.ativo
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {row.ativo
            ? "Ativo"
            : "Inativo"}
        </span>
      ),
    },

    {
      key: "id",
      label: "Ações",
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(row)}
            className="p-2 rounded-md hover:bg-blue-50 text-blue-600"
          >
            <Pencil size={14} />
          </button>

          <button
            onClick={() => onToggle(row.id)}
            className="p-2 rounded-md hover:bg-slate-50 text-slate-600"
          >
            <Power size={14} />
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