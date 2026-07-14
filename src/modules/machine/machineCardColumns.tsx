import type { CardColumn } from "@/components/data/DataCard";
import type { Machine } from "@/modules/machine/machineTypes";
import { ImageOff, Pencil, Power, Trash2, History, ClipboardCheck } from "lucide-react";

export function getMachineCardColumns(
  onEdit: (machine: Machine) => void,
  onToggle: (id: number) => void,
  onDelete: (machine: Machine) => void,
  onHistory?: (machine: Machine) => void
): CardColumn<Machine>[] {
  return [
    {
      render: (m) => {
        const active = m.status === "ativa";

        return (
          <div className="w-full border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden">

            {/* FOTO */}
            {m.imagem_url ? (
              <div className="w-full h-32 bg-slate-100">
                <img
                  src={m.imagem_url}
                  alt={m.nome}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-full h-20 bg-slate-50 flex items-center justify-center border-b border-slate-100">
                <ImageOff size={22} className="text-slate-300" />
              </div>
            )}

            <div className="p-4 space-y-3">

              {/* HEADER */}
              <div className="flex justify-between items-start gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-slate-900 truncate">{m.nome}</p>
                  <p className="text-xs text-slate-500">ID #{m.id}</p>
                </div>

                <span
                  className={`shrink-0 text-xs px-2 py-1 rounded-md font-medium ${
                    active
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {active ? "Ativa" : "Inativa"}
                </span>
              </div>

              {/* DADOS */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <div>
                  <p className="text-xs text-slate-500">Modelo</p>
                  <p className="text-sm text-slate-700">{m.modelo}</p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">Ano</p>
                  <p className="text-sm text-slate-700">{m.ano}</p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">Fabricante</p>
                  <p className="text-sm text-slate-700 truncate">{m.fabricante}</p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">Setor</p>
                  <p className="text-sm text-slate-700 truncate">
                    {m.setor?.nome ?? "—"}
                  </p>
                </div>
              </div>

              {/* FOOTER */}
              <div className="flex justify-between items-center border-t border-slate-100 pt-3">
                
                {/* QR */}
                <div>
                  {m.qr_code ? (
                    <img
                      src={m.qr_code}
                      alt="QR Code"
                      className="w-10 h-10 rounded-md border border-slate-200"
                    />
                  ) : (
                    <div className="w-10 h-10 border border-slate-200 rounded-md flex items-center justify-center text-slate-400 text-xs">
                      —
                    </div>
                  )}
                </div>

                {/* ACTIONS */}
                <div className="flex gap-1 flex-wrap justify-end">

  <button
            onClick={() => onHistory?.(m)}
            className="p-2 rounded-md border border-slate-200 text-indigo-600 hover:bg-indigo-50 transition-colors"
            title="Histórico de manutenção"
          >
            <ClipboardCheck size={14} />
          </button>
                  <button
                    onClick={() => onEdit(m)}
                    className="p-2 rounded-md border border-slate-200 text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    <Pencil size={14} />
                  </button>

                  <button
                    onClick={() => onToggle(m.id)}
                    className="p-2 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    <Power size={14} />
                  </button>
                  <button
                    onClick={() => onDelete(m)}
                    className="p-2 rounded-md border border-slate-200 text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>

                </div>
              </div>

            </div>
          </div>
        );
      },
    },
  ];
}