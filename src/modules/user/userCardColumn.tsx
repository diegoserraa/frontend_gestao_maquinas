import type { CardColumn } from "@/components/data/DataCard";
import type { User } from "./userType";

import {
  Pencil,
  Power,
  Trash2,
} from "lucide-react";

export function getUserCardColumns(
  onEdit: (user: User) => void,
  onToggle: (id: number) => void,
  onDelete: (user: User) => void
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
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium text-slate-900">
                {user.nome}
              </p>

              <p className="text-xs text-slate-500">
                ID #{user.id}
              </p>
            </div>

            <span
              className={`text-xs px-2 py-1 rounded-md font-medium ${
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

          <div className="flex justify-end gap-1 border-t border-slate-300 pt-3">
            <button
              onClick={() => onEdit(user)}
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
              onClick={() =>
                onToggle(user.id)
              }
              className="
                p-2
                rounded-md
                border
                border-slate-300
                text-slate-600
                hover:bg-slate-50
              "
            >
              <Power size={14} />
            </button>

            <button
              onClick={() =>
                onDelete(user)
              }
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