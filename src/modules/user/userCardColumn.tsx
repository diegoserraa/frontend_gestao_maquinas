import type { CardColumn } from "@/components/data/DataCard";
import type { User } from "./userType";

import {
  Pencil,
  Power,
  Trash2,
  UserCog,
} from "lucide-react";

import type { AcoesDaLinhaUsuario } from "./userType";

export function getUserCardColumns(
  onEdit: (user: User) => void,
  onToggle: (id: number) => void,
  onDelete: (user: User) => void,
  onPermissoes: (user: User) => void,
  acoesDaLinha: (user: User) => AcoesDaLinhaUsuario
): CardColumn<User>[] {
  return [
    {
      render: (user) => (
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
          <div className="flex justify-between items-start gap-2">
            <div className="flex items-start gap-3 min-w-0">
              <div className="min-w-0">
              <p className="font-medium text-slate-900 [overflow-wrap:anywhere]">
                {user.nome}
              </p>

              <p className="text-xs text-slate-500">
                ID #{user.id}
              </p>
              </div>
            </div>

            <span
              className={`shrink-0 text-xs px-2 py-1 rounded-md font-medium ${
                user.ativo
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {user.ativo
                ? "Ativo"
                : "Inativo"}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div>
              <p className="text-xs text-slate-500">
                E-mail
              </p>

              <p className="text-sm text-slate-700 break-all">
                {user.email}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Perfil
              </p>

              <p className="text-sm text-slate-700">
                {user.role}
              </p>
            </div>
          </div>

          {(() => {
            const acoes = acoesDaLinha(user);

            if (!acoes.permissoes && !acoes.editar && !acoes.alternar && !acoes.excluir) return null;

            const botao =
              "size-10 inline-flex items-center justify-center rounded-md border border-slate-300 hover:bg-slate-50";

            return (
              <div className="flex flex-wrap justify-end gap-1.5 border-t border-slate-300 pt-3">
                {acoes.permissoes && (
                  <button
                    onClick={() => onPermissoes(user)}
                    aria-label={`Permissões de ${user.nome}`}
                    className={`${botao} text-indigo-600 hover:bg-indigo-50`}
                  >
                    <UserCog size={16} />
                  </button>
                )}

                {acoes.editar && (
                  <button
                    onClick={() => onEdit(user)}
                    aria-label={`Editar ${user.nome}`}
                    className={`${botao} text-blue-600 hover:bg-blue-50`}
                  >
                    <Pencil size={16} />
                  </button>
                )}

                {acoes.alternar && (
                  <button
                    onClick={() => onToggle(user.id)}
                    aria-label={user.ativo ? `Desativar ${user.nome}` : `Ativar ${user.nome}`}
                    className={`${botao} text-slate-600`}
                  >
                    <Power size={16} />
                  </button>
                )}

                {acoes.excluir && (
                  <button
                    onClick={() => onDelete(user)}
                    aria-label={`Excluir ${user.nome}`}
                    className={`${botao} text-red-500 hover:bg-red-50`}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            );
          })()}
        </div>
      ),
    },
  ];
}