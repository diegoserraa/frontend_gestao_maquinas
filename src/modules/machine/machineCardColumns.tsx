import type { CardColumn } from "@/components/data/DataCard";
import type { Machine } from "@/modules/machine/machineTypes";
import {
  ImageOff,
  Pencil,
  Power,
  Trash2,
  ClipboardCheck,
  QrCode,
  ZoomIn,
  Wifi,
} from "lucide-react";

import {
  formatMaintenanceDate,
  getMaintenanceDaysRemaining,
  getMaintenanceStatus,
} from "@/lib/helperMachine";

import type { AcoesPermitidas } from "@/modules/permissoes/permissoesTypes";
import type { ImagemAmpliada } from "./ImagemAmpliadaModal";

export function getMachineCardColumns(
  onEdit: (machine: Machine) => void,
  onToggle: (id: number) => void,
  onDelete: (machine: Machine) => void,
  onHistory?: (machine: Machine) => void,
  permitir?: AcoesPermitidas,
  onQr?: (machine: Machine) => void,
  /** amplia a foto/QR num visualizador em tela cheia */
  onAmpliar?: (imagem: ImagemAmpliada) => void,
  onParear?: (machine: Machine) => void
): CardColumn<Machine>[] {
  return [
    {
      render: (m) => {
        const active = m.status === "ativa";

        const maintenanceStatus =
          getMaintenanceStatus(
            m.proxima_manutencao
          );

        const diasRestantes =
          getMaintenanceDaysRemaining(
            m.proxima_manutencao
          );

        return (
          <div className="w-full border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden">
            {/* FOTO */}
            {m.imagem_url ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAmpliar?.({ src: m.imagem_url!, titulo: m.nome });
                }}
                title={`Ampliar foto de ${m.nome}`}
                className="group relative block h-32 w-full cursor-pointer bg-slate-100"
              >
                <img
                  src={m.imagem_url}
                  alt={m.nome}
                  className="h-full w-full object-cover transition group-hover:brightness-75"
                />
                <span className="absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100">
                  <ZoomIn size={22} className="text-white drop-shadow" />
                </span>
              </button>
            ) : (
              <div className="w-full h-20 bg-slate-50 flex items-center justify-center border-b border-slate-100">
                <ImageOff
                  size={22}
                  className="text-slate-300"
                />
              </div>
            )}

            <div className="p-4 space-y-4">
              {/* HEADER */}
              <div className="flex justify-between items-start gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-slate-900 truncate">
                    {m.nome}
                  </p>

                  <p className="text-xs text-slate-500">
                    ID #{m.id}
                  </p>
                </div>

                <span
                  className={`shrink-0 text-xs px-2 py-1 rounded-md font-medium ${
                    active
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {active
                    ? "Ativa"
                    : "Inativa"}
                </span>
              </div>

              {/* DADOS */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <div>
                  <p className="text-xs text-slate-500">
                    Modelo
                  </p>
                  <p className="text-sm text-slate-700">
                    {m.modelo}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Ano
                  </p>
                  <p className="text-sm text-slate-700">
                    {m.ano}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Fabricante
                  </p>
                  <p className="text-sm text-slate-700 truncate">
                    {m.fabricante}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Setor
                  </p>
                  <p className="text-sm text-slate-700 truncate">
                    {m.setor?.nome ?? "—"}
                  </p>
                </div>
              </div>

              {/* MANUTENÇÃO */}
              <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Manutenção
                  </p>

                  <span
                    className={`text-xs px-2 py-1 rounded-md font-medium ${maintenanceStatus.className}`}
                  >
                    {maintenanceStatus.label}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-slate-500">
                      Última
                    </p>

                    <p className="text-sm font-medium text-slate-800">
                      {formatMaintenanceDate(
                        m.ultima_manutencao
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">
                      Próxima
                    </p>

                    <p className="text-sm font-medium text-slate-800">
                      {formatMaintenanceDate(
                        m.proxima_manutencao
                      )}
                    </p>
                  </div>
                </div>

                {diasRestantes !== null && (
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <p className="text-xs text-slate-500">
                      {diasRestantes < 0
                        ? `${Math.abs(
                            diasRestantes
                          )} dias atrasada`
                        : `${diasRestantes} dias restantes`}
                    </p>
                  </div>
                )}
              </div>

              {/* FOOTER */}
              <div className="flex justify-between items-center border-t border-slate-100 pt-3">
                {/* QR */}
                <div>
                  {m.qr_code ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAmpliar?.({ src: m.qr_code!, titulo: `QR Code — ${m.nome}` });
                      }}
                      title={`Ampliar QR Code de ${m.nome}`}
                      className="group relative block h-10 w-10 cursor-pointer"
                    >
                      <img
                        src={m.qr_code}
                        alt={`QR Code de ${m.nome}`}
                        className="h-10 w-10 rounded-md border border-slate-200 transition group-hover:brightness-75"
                      />
                      <span className="absolute inset-0 flex items-center justify-center rounded-md opacity-0 transition group-hover:opacity-100">
                        <ZoomIn size={16} className="text-white drop-shadow" />
                      </span>
                    </button>
                  ) : (
                    <div className="w-10 h-10 border border-slate-200 rounded-md flex items-center justify-center text-slate-400 text-xs">
                      —
                    </div>
                  )}
                </div>

                {/* ACTIONS */}
                <div className="flex gap-1 flex-wrap justify-end">
                  <button
                    onClick={() =>
                      onHistory?.(m)
                    }
                    className="p-2 rounded-md border border-slate-200 text-indigo-600 hover:bg-indigo-50 transition-colors"
                    title="Histórico de manutenção"
                  >
                    <ClipboardCheck size={14} />
                  </button>

                  {permitir?.qr !== false && onQr && (
<button
                    onClick={() => onQr(m)}
                    className="p-2 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                    title="Exportar QR Code"
                    aria-label={`Exportar QR Code de ${m.nome}`}
                  >
                    <QrCode size={14} />
                  </button>
)}

                  {permitir?.editar !== false && onParear && (
<button
                    onClick={() => onParear(m)}
                    className="p-2 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                    title="Vincular sensor (ESP32)"
                    aria-label={`Vincular sensor à ${m.nome}`}
                  >
                    <Wifi size={14} />
                  </button>
)}

                  {permitir?.editar !== false && (
<button
                    onClick={() => onEdit(m)}
                    className="p-2 rounded-md border border-slate-200 text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    <Pencil size={14} />
                  </button>
)}

                  {permitir?.alternar !== false && (
<button
                    onClick={() =>
                      onToggle(m.id)
                    }
                    className="p-2 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    <Power size={14} />
                  </button>
)}

                  {permitir?.excluir !== false && (
<button
                    onClick={() =>
                      onDelete(m)
                    }
                    className="p-2 rounded-md border border-slate-200 text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
)}
                </div>
              </div>
            </div>
          </div>
        );
      },
    },
  ];
}