import {
  Pencil,
  Power,
  Trash2,
  ClipboardCheck,
} from "lucide-react";

import type { Column } from "@/components/data/DataTable";
import type { Machine } from "./machineTypes";

type Props = {
  onEdit: (machine: Machine) => void;
  onToggle: (id: number) => void;
  onDelete: (machine: Machine) => void;
  onRowClick: (id: number) => void;
  onViewOS: (id: number) => void;
};

export function getMachineTableColumns({
  onEdit,
  onToggle,
  onDelete,
  onRowClick,
  onViewOS,
}: Props): Column<Machine>[] {
  return [
{
  key: "imagem_url",
  label: "Imagem",
  render: (_, row) => (
    <div
      className="relative w-12 h-12"
      onClick={() => onRowClick(row.id)}
    >
      {row.imagem_url ? (
        <img
          src={row.imagem_url}
          alt={row.nome}
          className="
            w-12
            h-12
            rounded-lg
            object-cover
            border
            shadow-sm
            cursor-pointer

            transition-all
            duration-200

            hover:scale-[3]
            hover:z-50

            origin-left
            relative
          "
        />
      ) : (
        <div
          className="
            w-12
            h-12
            rounded-lg
            border
            bg-slate-50
            flex
            items-center
            justify-center
            text-slate-300
            text-xs
          "
        >
          —
        </div>
      )}
    </div>
  ),
},

    {
      key: "nome",
      label: "Máquina",
      render: (_, row) => (
        <div
          className="flex flex-col cursor-pointer"
          onClick={() => onRowClick(row.id)}
        >
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
      key: "modelo",
      label: "Modelo",
      render: (v, row) => (
        <span
          className="text-sm text-slate-700 cursor-pointer"
          onClick={() => onRowClick(row.id)}
        >
          {v}
        </span>
      ),
    },

    {
      key: "fabricante",
      label: "Fabricante",
      render: (v, row) => (
        <span
          className="text-sm text-slate-700 cursor-pointer"
          onClick={() => onRowClick(row.id)}
        >
          {v}
        </span>
      ),
    },

    {
      key: "ano",
      label: "Ano",
      render: (v, row) => (
        <span
          className="text-sm text-slate-700 cursor-pointer"
          onClick={() => onRowClick(row.id)}
        >
          {v}
        </span>
      ),
    },

    {
      key: "setor",
      label: "Setor",
      render: (_, row) => (
        <span
          className="
            px-2
            py-1
            text-xs
            rounded-md
            bg-slate-100
            text-slate-700
            cursor-pointer
          "
          onClick={() => onRowClick(row.id)}
        >
          {row.setor?.nome ?? "—"}
        </span>
      ),
    },

    {
      key: "status",
      label: "Status",
      render: (_, row) => {
        const active = row.status === "ativa";

        return (
          <span
            onClick={() => onRowClick(row.id)}
            className={`text-xs px-2 py-1 rounded-md font-medium cursor-pointer ${
              active
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {active ? "Ativa" : "Inativa"}
          </span>
        );
      },
    },

    {
      key: "qr_code",
      label: "QR",
      render: (_, row) =>
        row.qr_code ? (
          <img
            src={row.qr_code}
            alt="QR Code"
            className="
              w-8
              h-8
              rounded-md
              hover:scale-[3.3]
              transition
              cursor-pointer
            "
            onClick={() => onRowClick(row.id)}
          />
        ) : (
          <span
            className="text-xs text-slate-300 cursor-pointer"
            onClick={() => onRowClick(row.id)}
          >
            —
          </span>
        ),
    },

    {
      key: "id",
      label: "Ações",
      render: (_, row) => (
        <div
          className="flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => onViewOS(row.id)}
            className="p-2 rounded-md hover:bg-indigo-50 text-indigo-600"
            title="Ordens de Serviço"
          >
            <ClipboardCheck size={16} />
          </button>

          <button
            onClick={() => onEdit(row)}
            className="p-2 rounded-md hover:bg-blue-50 text-blue-600"
            title="Editar máquina"
          >
            <Pencil size={14} />
          </button>

          <button
            onClick={() => onToggle(row.id)}
            className="p-2 rounded-md hover:bg-slate-50"
            title="Ativar/Desativar"
          >
            <Power size={14} />
          </button>

          <button
            onClick={() => onDelete(row)}
            className="p-2 rounded-md hover:bg-red-50 text-red-500"
            title="Excluir"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];
}