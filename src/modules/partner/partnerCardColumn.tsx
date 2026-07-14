import type { CardColumn } from "@/components/data/DataCard";

import type { Partner } from "./partnerTypes";

import {
  Pencil,
  Trash2,
} from "lucide-react";

export function getPartnerCardColumns(
  onEdit: (partner: Partner) => void,
  onDelete: (partner: Partner) => void
): CardColumn<Partner>[] {
  return [
    {
      render: (partner) => (
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
              ID #{partner.id}
            </p>

            <p className="font-medium text-slate-900">
              {partner.nome}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500 mb-1">
              CNPJ
            </p>

            <p className="text-sm text-slate-700">
              {partner.cnpj || "-"}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500 mb-1">
              Telefone
            </p>

            <p className="text-sm text-slate-700">
              {partner.telefone || "-"}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500 mb-1">
              E-mail
            </p>

            <p
              title={partner.email}
              className="
                text-sm
                text-slate-700
                break-all
              "
            >
              {partner.email || "-"}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500 mb-1">
              Observações
            </p>

            <p
              title={partner.observacoes}
              className="
                text-sm
                text-slate-700
                line-clamp-2
                break-all
              "
            >
              {partner.observacoes || "-"}
            </p>
          </div>

          <div className="flex justify-end gap-1 border-t border-slate-300 pt-3">
            <button
              onClick={() =>
                onEdit(partner)
              }
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
                onDelete(partner)
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