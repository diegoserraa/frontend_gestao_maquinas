import type { Column } from "@/components/data/DataTable";
import type { User } from "./userType";

import {
  Pencil,
  Power,
  ShieldCheck,
  Trash2,
} from "lucide-react";

import type { AcoesDaLinhaUsuario } from "./userType";

type Props = {
  onEdit: (user: User) => void;
  onToggle: (id: number) => void;
  onDelete: (user: User) => void;
  onPermissoes: (user: User) => void;
  /** o que quem está logado pode fazer com cada funcionário da lista */
  acoesDaLinha: (user: User) => AcoesDaLinhaUsuario;
};

export function getUserTableColumns({
  onEdit,
  onToggle,
  onDelete,
  onPermissoes,
  acoesDaLinha,
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
      render: (_, row) => {
        const acoes = acoesDaLinha(row);

        return (
          <div className="flex items-center gap-1">
            {acoes.permissoes && (
              <button
                onClick={() => onPermissoes(row)}
                title="Permissões"
                aria-label={`Permissões de ${row.nome}`}
                className="p-2 rounded-md hover:bg-indigo-50 text-indigo-600"
              >
                <ShieldCheck size={14} />
              </button>
            )}

            {acoes.editar && (
              <button
                onClick={() => onEdit(row)}
                title="Editar"
                aria-label={`Editar ${row.nome}`}
                className="p-2 rounded-md hover:bg-blue-50 text-blue-600"
              >
                <Pencil size={14} />
              </button>
            )}

            {acoes.alternar && (
              <button
                onClick={() => onToggle(row.id)}
                title={row.ativo ? "Desativar" : "Ativar"}
                aria-label={row.ativo ? `Desativar ${row.nome}` : `Ativar ${row.nome}`}
                className="p-2 rounded-md hover:bg-slate-50 text-slate-600"
              >
                <Power size={14} />
              </button>
            )}

            {acoes.excluir && (
              <button
                onClick={() => onDelete(row)}
                title="Excluir"
                aria-label={`Excluir ${row.nome}`}
                className="p-2 rounded-md hover:bg-red-50 text-red-500"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        );
      },
    },
  ];
}