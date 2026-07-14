import { Eye, ClipboardList, HardHat } from "lucide-react";
import { useState } from "react";

import {
  atribuirTecnicoOS,
  iniciarAtendimentoOS,
  finalizarOS,
  cancelarOS,
} from "./ordemServicoService";
import { ID_TECNICO_EXTERNO } from "./ordemServicoConstants";

import type { OrdemServico } from "../machineDetails/machineDetailsTypes";

import { FinalizarOrdemServicoModal } from "../../components/modals/ordemServico/FinalizarOrdemServico";

type Tecnico = {
  id: number;
  nome: string;
};

type Props = {
  mode?: "table" | "panel" | "mobile";
  ordem?: OrdemServico;
  userRole: "ADMIN" | "GESTOR" | "TECNICO" | "OPERADOR";
  userId?: number;
  tecnicos?: Tecnico[];
  machineId?: number;
  onCreateOS?: (machineId: number) => void;
  onViewOS?: () => void;
  onRefresh?: () => void;
  onView?: (os: OrdemServico) => void;
};

export function OrdemServicoActions({
  mode = "table",
  ordem,
  userRole,
  userId = 0,
  tecnicos = [],
  machineId,
  onCreateOS,
  onViewOS,
  onRefresh,
  onView,
}: Props) {
  const [openFinalizar, setOpenFinalizar] = useState(false);
  const [osSelecionada, setOsSelecionada] = useState<OrdemServico | null>(null);
  const [definindoExterno, setDefinindoExterno] = useState(false);
   

  const isAdmin = userRole === "ADMIN";

const isGestor =
  userRole === "GESTOR" ||
  isAdmin;

const isTecnico =
  userRole === "TECNICO";

const isOperador =
  userRole === "OPERADOR";

  /* =========================
     PAINEL DA MÁQUINA
  ========================= */
  if (mode === "panel") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {isOperador && (
          <>
            <button
              onClick={() => machineId && onCreateOS?.(machineId)}
              className="
                group flex items-center gap-3 rounded-xl
                border border-blue-100 bg-blue-50
                px-4 py-3 w-full
                transition-all duration-150
                hover:shadow-sm hover:-translate-y-px
                active:scale-[0.98]
              "
            >
              <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-blue-100 text-blue-600">
                <ClipboardList size={15} />
              </div>
              <span className="text-[12px] font-semibold text-blue-700">
                Abrir OS
              </span>
            </button>

            <button
              onClick={onViewOS}
              className="
                group flex items-center gap-3 rounded-xl
                border border-slate-200 bg-slate-50
                px-4 py-3 w-full
                transition-all duration-150
                hover:shadow-sm hover:-translate-y-px
                active:scale-[0.98]
              "
            >
              <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-slate-100 text-slate-600">
                <Eye size={15} />
              </div>
              <span className="text-[12px] font-semibold text-slate-700">
                Ver última OS
              </span>
            </button>
          </>
        )}
      </div>
    );
  }

  /* =========================
     AÇÕES DA TABELA / MOBILE
  ========================= */

  if (!ordem) return null;

  const status = String(ordem.status ?? "").toUpperCase();
  const isExterno = ordem.id_tecnico === ID_TECNICO_EXTERNO;
 

  // ── Técnico ──────────────────────────────────────────────
  const podeAssumir =
    isTecnico && status === "ABERTA" && !isExterno;

  const podeIniciar =
    isTecnico &&
    status === "ATRIBUIDA" &&
    ordem.id_tecnico === userId &&
    !isExterno;

  const podeFinalizar =
    // Técnico próprio finaliza normalmente
    (isTecnico &&
      status === "EM_ANDAMENTO" &&
      ordem.id_tecnico === userId &&
      !isExterno) ||
    // Gestor pode finalizar qualquer OS em andamento
    (isGestor && status === "EM_ANDAMENTO") ||
    // Gestor finaliza OS marcada como técnico externo, em qualquer status aberto
    (isGestor &&
      isExterno &&
      !["FINALIZADA", "CANCELADA"].includes(status));

  // ── Gestor ───────────────────────────────────────────────
  const tecnicoJaDefinido =
  !!ordem.id_tecnico &&
  ordem.id_tecnico !== 0;

const podeAtribuir =
  isGestor &&
  !["FINALIZADA", "CANCELADA"].includes(status) &&
  !tecnicoJaDefinido;

  // Marcar como técnico externo — só faz sentido antes de já estar marcado assim
const podeDefinirExterno =
  isGestor &&
  !tecnicoJaDefinido &&
  !["FINALIZADA", "CANCELADA"].includes(status);

  const podeCancelar =
    isGestor && status !== "FINALIZADA";

  async function handleDefinirExterno(e: React.MouseEvent) {
    e.stopPropagation();
    if (!ordem) return;

    try {
      setDefinindoExterno(true);
      // Reaproveita o endpoint de atribuir técnico, com o id fixo do placeholder
      await atribuirTecnicoOS(ordem.id, ID_TECNICO_EXTERNO, userId);
      // Pula direto pra EM_ANDAMENTO — não existe etapa intermediária visível
      // pra técnico externo, então já habilita a finalização (evita erro de
      // transição de status "ATRIBUIDA → FINALIZADA" no backend)
      await iniciarAtendimentoOS(ordem.id);
      onRefresh?.();
    } catch (err) {
      console.error(err);
    } finally {
      setDefinindoExterno(false);
    }
  }

  async function handleFinalizar(
    resolucao: string,
    valorGasto: number,
    parceiro?: { id_parceiro: number; valor_parceiro: number } | null
  ) {
    if (!osSelecionada) return;
    await finalizarOS(osSelecionada.id, resolucao, valorGasto, parceiro);
    setOpenFinalizar(false);
    setOsSelecionada(null);
    onRefresh?.();
  }

  /* =========================
     MODO MOBILE
  ========================= */
  if (mode === "mobile") {
    return (
      <>
        <div className="flex flex-col gap-2 w-full">
          {isExterno && (
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-violet-50 border border-violet-100">
              <HardHat size={13} className="text-violet-500 shrink-0" />
              <span className="text-[11px] font-medium text-violet-700">
                Execução por técnico externo
              </span>
            </div>
          )}

          {podeAssumir && (
            <button
              onClick={async (e) => {
                e.stopPropagation();
                try {
                  await atribuirTecnicoOS(ordem.id, userId, userId);
                  onRefresh?.();
                } catch (err) {
                  console.error(err);
                }
              }}
              className="w-full h-10 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
            >
              Assumir atendimento
            </button>
          )}

          {podeIniciar && (
            <button
              onClick={async (e) => {
                e.stopPropagation();
                try {
                  await iniciarAtendimentoOS(ordem.id);
                  onRefresh?.();
                } catch (err) {
                  console.error(err);
                }
              }}
              className="w-full h-10 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600"
            >
              Iniciar atendimento
            </button>
          )}

          {podeFinalizar && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOsSelecionada(ordem);
                setOpenFinalizar(true);
              }}
              className="w-full h-10 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700"
            >
              Finalizar atendimento
            </button>
          )}

          {podeDefinirExterno && (
            <button
              onClick={handleDefinirExterno}
              disabled={definindoExterno}
              className="w-full h-10 rounded-lg border border-violet-200 bg-violet-50 text-violet-700 text-sm font-medium hover:bg-violet-100 disabled:opacity-50"
            >
              {definindoExterno ? "Definindo..." : "Definir técnico externo"}
            </button>
          )}

          {podeAtribuir && (
            <select
              className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm"
              defaultValue=""
              onClick={(e) => e.stopPropagation()}
              onChange={async (e) => {
                const tecnicoId = Number(e.target.value);
                if (!tecnicoId) return;
                try {
                  await atribuirTecnicoOS(ordem.id, tecnicoId, userId);
                  onRefresh?.();
                } catch (err) {
                  console.error(err);
                }
                e.target.value = "";
              }}
            >
              <option value="">Atribuir técnico</option>
              {tecnicos.map((tecnico) => (
                <option key={tecnico.id} value={tecnico.id}>
                  {tecnico.nome}
                </option>
              ))}
            </select>
          )}

          {podeCancelar && (
            <button
              onClick={async (e) => {
                e.stopPropagation();
                const motivo = window.prompt("Motivo do cancelamento:");
                if (!motivo?.trim()) return;
                try {
                  await cancelarOS(ordem.id, motivo);
                  onRefresh?.();
                } catch (err) {
                  console.error(err);
                }
              }}
              className="w-full h-10 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700"
            >
              Cancelar OS
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onView?.(ordem);
            }}
            className="w-full h-10 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50"
          >
            Ver detalhes
          </button>
        </div>

        {osSelecionada && (
          <FinalizarOrdemServicoModal
            open={openFinalizar}
            onClose={() => {
              setOpenFinalizar(false);
              setOsSelecionada(null);
            }}
            osId={osSelecionada.id}
            isExterno={osSelecionada.id_tecnico === ID_TECNICO_EXTERNO}
            onConfirm={handleFinalizar}
          />
        )}
      </>
    );
  }

  /* =========================
     MODO TABLE (padrão)
  ========================= */
  return (
    <>
      <div className="flex items-center">
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 flex-wrap">
          {isExterno && (
            <span className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-violet-50 text-violet-700 border border-violet-100">
              <HardHat size={11} />
              Externo
            </span>
          )}

          {podeAssumir && (
            <button
              onClick={async (e) => {
                e.stopPropagation();
                try {
                  await atribuirTecnicoOS(ordem.id, userId, userId);
                  onRefresh?.();
                } catch (err) {
                  console.error(err);
                }
              }}
              className="rounded px-2 py-1 text-[11px] font-medium text-blue-700 hover:bg-blue-100"
            >
              Assumir
            </button>
          )}

          {podeIniciar && (
            <button
              onClick={async (e) => {
                e.stopPropagation();
                try {
                  await iniciarAtendimentoOS(ordem.id);
                  onRefresh?.();
                } catch (err) {
                  console.error(err);
                }
              }}
              className="rounded px-2 py-1 text-[11px] font-medium text-amber-700 hover:bg-amber-100"
            >
              Iniciar
            </button>
          )}

          {podeFinalizar && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOsSelecionada(ordem);
                setOpenFinalizar(true);
              }}
              className="rounded px-2 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100"
            >
              Finalizar
            </button>
          )}

          {podeDefinirExterno && (
            <button
              onClick={handleDefinirExterno}
              disabled={definindoExterno}
              className="rounded px-2 py-1 text-[11px] font-medium text-violet-700 hover:bg-violet-100 disabled:opacity-50"
            >
              {definindoExterno ? "Definindo..." : "Técnico externo"}
            </button>
          )}

          {podeAtribuir && (
            <select
              className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs"
              defaultValue=""
              onClick={(e) => e.stopPropagation()}
              onChange={async (e) => {
                const tecnicoId = Number(e.target.value);
                if (!tecnicoId) return;
                try {
                  await atribuirTecnicoOS(ordem.id, tecnicoId, userId);
                  onRefresh?.();
                } catch (err) {
                  console.error(err);
                }
                e.target.value = "";
              }}
            >
              <option value="">Atribuir</option>
              {tecnicos.map((tecnico) => (
                <option key={tecnico.id} value={tecnico.id}>
                  {tecnico.nome}
                </option>
              ))}
            </select>
          )}

          {podeCancelar && (
            <button
              onClick={async (e) => {
                e.stopPropagation();
                const motivo = window.prompt("Motivo do cancelamento:");
                if (!motivo?.trim()) return;
                try {
                  await cancelarOS(ordem.id, motivo);
                  onRefresh?.();
                } catch (err) {
                  console.error(err);
                }
              }}
              className="rounded px-2 py-1 text-[11px] font-medium text-red-600 hover:bg-red-100"
            >
              Cancelar
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onView?.(ordem);
            }}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-100"
          >
            <Eye size={14} />
          </button>
        </div>
      </div>

      {/* MODAL FINALIZAR */}
      {osSelecionada && (
        <FinalizarOrdemServicoModal
          open={openFinalizar}
          onClose={() => {
            setOpenFinalizar(false);
            setOsSelecionada(null);
          }}
          osId={osSelecionada.id}
          isExterno={osSelecionada.id_tecnico === ID_TECNICO_EXTERNO}
          onConfirm={handleFinalizar}
        />
      )}
    </>
  );
}
