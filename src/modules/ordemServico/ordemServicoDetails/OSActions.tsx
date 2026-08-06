import { useState } from "react";
import {
  CheckCircle2,
  PlayCircle,
  ClipboardCheck,
  Ban,
  HardHat,
  UserPlus,
  Bell,
  Loader2,
  X,
} from "lucide-react";
import { createPortal } from "react-dom";

import {
  atribuirTecnicoOS,
  iniciarAtendimentoOS,
  finalizarOS,
  cancelarOS,
} from "@/modules/ordemServico/ordemServicoService";
import { ID_TECNICO_EXTERNO } from "@/modules/ordemServico/ordemServicoConstants";
import type { OrdemServico } from "@/modules/ordemServico/ordemServicoType";

import { FinalizarOrdemServicoModal } from "@/components/modals/ordemServico/FinalizarOrdemServico";
import { OrdemServicoTimeline } from "@/modules/ordemServico/ordemDeServicoTimeline";

type Tecnico = {
  id: number;
  nome: string;
};

type Props = {
  os: OrdemServico;
  userRole: "ADMIN" | "GESTOR" | "TECNICO" | "OPERADOR";
  userId: number;
  tecnicos: Tecnico[];
  onRefresh: (nextStatus?: string) => void;
};

const BUTTON_COLORS = {
  slate: "border border-slate-200 bg-white hover:bg-slate-50 text-slate-700",
  blue: "bg-blue-600 hover:bg-blue-700 text-white",
  amber: "bg-amber-500 hover:bg-amber-600 text-white",
  emerald: "bg-emerald-600 hover:bg-emerald-700 text-white",
  red: "bg-red-600 hover:bg-red-700 text-white",
  violet: "border border-violet-200 bg-violet-50 hover:bg-violet-100 text-violet-700",
} as const;

function ActionButton({
  color,
  icon,
  loading,
  onClick,
  children,
}: {
  color: keyof typeof BUTTON_COLORS;
  icon: React.ReactNode;
  loading?: boolean;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={`
        h-11 flex-1 min-w-[150px] rounded-xl flex items-center justify-center gap-1.5
        text-sm font-semibold whitespace-nowrap transition-all
        disabled:opacity-60 disabled:cursor-not-allowed
        active:scale-[0.98]
        ${BUTTON_COLORS[color]}
      `}
    >
      {loading ? <Loader2 size={15} className="animate-spin" /> : icon}
      {children}
    </button>
  );
}

export function OSActions({ os, userRole, userId, tecnicos, onRefresh }: Props) {
  const [assumindo, setAssumindo] = useState(false);
  const [iniciando, setIniciando] = useState(false);
  const [definindoExterno, setDefinindoExterno] = useState(false);
  const [atribuindo, setAtribuindo] = useState(false);

  const [openFinalizar, setOpenFinalizar] = useState(false);
  const [openCancelar, setOpenCancelar] = useState(false);
  const [motivoCancelamento, setMotivoCancelamento] = useState("");
  const [cancelando, setCancelando] = useState(false);

  const [timelineAberta, setTimelineAberta] = useState(false);

  // ── mesmas regras de sempre, copiadas 1:1 do OrdemServicoActions ──
  const isAdmin = userRole === "ADMIN";
  const isGestor = userRole === "GESTOR" || isAdmin;
  const isTecnico = userRole === "TECNICO";

  const status = String(os.status ?? "").toUpperCase();
  const isExterno = os.id_tecnico === ID_TECNICO_EXTERNO;

  const podeAssumir = isTecnico && status === "ABERTA" && !isExterno;

  const podeIniciar =
    isTecnico && status === "ATRIBUIDA" && os.id_tecnico === userId && !isExterno;

  const podeFinalizar =
    (isTecnico && status === "EM_ANDAMENTO" && os.id_tecnico === userId && !isExterno) ||
    (isGestor && status === "EM_ANDAMENTO") ||
    (isGestor && isExterno && !["FINALIZADA", "CANCELADA"].includes(status));

  const tecnicoJaDefinido = !!os.id_tecnico && os.id_tecnico !== 0;

  const podeAtribuir =
    isGestor && !["FINALIZADA", "CANCELADA"].includes(status) && !tecnicoJaDefinido;

  const podeDefinirExterno =
    isGestor && !tecnicoJaDefinido && !["FINALIZADA", "CANCELADA"].includes(status);

  const podeCancelar = isGestor && status !== "FINALIZADA";

  const semNenhumaAcao =
    !podeAssumir && !podeIniciar && !podeFinalizar && !podeCancelar && !podeAtribuir && !podeDefinirExterno;

  // ── handlers — mesma sequência de chamadas do componente original ──
  async function handleAssumir(e: React.MouseEvent) {
    e.stopPropagation();
    setAssumindo(true);
    try {
      await atribuirTecnicoOS(os.id, userId, userId);
      onRefresh("ATRIBUIDA");
    } catch (err) {
      console.error(err);
    } finally {
      setAssumindo(false);
    }
  }

  async function handleIniciar(e: React.MouseEvent) {
    e.stopPropagation();
    setIniciando(true);
    try {
      await iniciarAtendimentoOS(os.id);
      onRefresh("EM_ANDAMENTO");
    } catch (err) {
      console.error(err);
    } finally {
      setIniciando(false);
    }
  }

  async function handleFinalizar(
    resolucao: string,
    valorGasto: number,
    parceiro?: { id_parceiro: number; valor_parceiro: number } | null
  ) {
    await finalizarOS(os.id, resolucao, valorGasto, parceiro);
    setOpenFinalizar(false);
    onRefresh("FINALIZADA");
  }

  async function handleDefinirExterno(e: React.MouseEvent) {
    e.stopPropagation();
    setDefinindoExterno(true);
    try {
      await atribuirTecnicoOS(os.id, ID_TECNICO_EXTERNO, userId);
      await iniciarAtendimentoOS(os.id);
      onRefresh("EM_ANDAMENTO");
    } catch (err) {
      console.error(err);
    } finally {
      setDefinindoExterno(false);
    }
  }

  async function handleAtribuirTecnico(e: React.ChangeEvent<HTMLSelectElement>) {
    const tecnicoId = Number(e.target.value);
    if (!tecnicoId) return;

    setAtribuindo(true);
    try {
      await atribuirTecnicoOS(os.id, tecnicoId, userId);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setAtribuindo(false);
      e.target.value = "";
    }
  }

  async function handleConfirmarCancelamento() {
    if (!motivoCancelamento.trim()) return;
    setCancelando(true);
    try {
      await cancelarOS(os.id, motivoCancelamento.trim());
      setOpenCancelar(false);
      setMotivoCancelamento("");
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setCancelando(false);
    }
  }

  function handleAbrirTimeline(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    setTimelineAberta(true);
  }

  function handleFecharTimeline() {
    setTimelineAberta(false);
  }

  return (
    <div className="bg-white p-5 sm:p-6">
      <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
        Ações
      </h2>

      {isExterno && (
        <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-violet-50 border border-violet-100">
          <HardHat size={15} className="text-violet-500 shrink-0" />
          <span className="text-xs font-medium text-violet-700">
            Execução por técnico externo
          </span>
        </div>
      )}

      {semNenhumaAcao && (
        <p className="text-sm text-slate-400">
          Nenhuma ação disponível para o seu perfil neste momento.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleAbrirTimeline}
          className="
            h-11 flex-1 min-w-[150px] rounded-xl flex items-center justify-center gap-1.5
            text-sm font-semibold whitespace-nowrap transition-all active:scale-[0.98]
            border border-slate-200 bg-white hover:bg-slate-50 text-slate-700
          "
        >
          <Bell size={16} />
          Acompanhar OS
        </button>

        {podeAssumir && (
          <ActionButton color="blue" icon={<CheckCircle2 size={16} />} loading={assumindo} onClick={handleAssumir}>
            Assumir atendimento
          </ActionButton>
        )}

        {podeIniciar && (
          <ActionButton color="amber" icon={<PlayCircle size={16} />} loading={iniciando} onClick={handleIniciar}>
            Iniciar atendimento
          </ActionButton>
        )}

        {podeDefinirExterno && (
          <ActionButton color="violet" icon={<HardHat size={16} />} loading={definindoExterno} onClick={handleDefinirExterno}>
            Definir técnico externo
          </ActionButton>
        )}

        {podeAtribuir && (
          <div className="relative flex-1 min-w-[150px]">
            <select
              defaultValue=""
              disabled={atribuindo}
              onChange={handleAtribuirTecnico}
              className="
                w-full h-11 rounded-xl border border-slate-200 bg-white
                pl-9 pr-3 text-sm font-semibold text-slate-700
                outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400
                disabled:opacity-60 appearance-none cursor-pointer
              "
            >
              <option value="" disabled>
                Atribuir técnico
              </option>
              {tecnicos.map((tecnico) => (
                <option key={tecnico.id} value={tecnico.id}>
                  {tecnico.nome}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-blue-600">
              {atribuindo ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
            </div>
          </div>
        )}

        {podeFinalizar && (
          <ActionButton
            color="emerald"
            icon={<ClipboardCheck size={16} />}
            onClick={(e) => {
              e.stopPropagation();
              setOpenFinalizar(true);
            }}
          >
            Finalizar atendimento
          </ActionButton>
        )}

        {podeCancelar && (
          <ActionButton
            color="red"
            icon={<Ban size={16} />}
            onClick={(e) => {
              e.stopPropagation();
              setOpenCancelar(true);
            }}
          >
            Cancelar OS
          </ActionButton>
        )}
      </div>

      {/* MODAL FINALIZAR — já existente, reaproveitado sem alteração */}
      <FinalizarOrdemServicoModal
        open={openFinalizar}
        onClose={() => setOpenFinalizar(false)}
        osId={os.id}
        isExterno={isExterno}
        onConfirm={handleFinalizar}
      />

      {/* MODAL TIMELINE — "Acompanhar OS". z-index bem alto de propósito,
          pra nunca ficar escondido atrás de outro elemento com z-index
          alto no resto do app (header fixo, sidebar, etc). */}
      {timelineAberta &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
            onClick={handleFecharTimeline}
          >
            <div
              className="w-full max-w-lg max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <OrdemServicoTimeline os={os} onClose={handleFecharTimeline} />
            </div>
          </div>,
          document.body
        )}

      {/* MODAL CANCELAR — substitui o window.prompt por um formulário de verdade */}
      {openCancelar && (
        <div
          className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4"
          onClick={() => !cancelando && setOpenCancelar(false)}
        >
          <div
            className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">Cancelar ordem de serviço</h3>
              <button
                onClick={() => setOpenCancelar(false)}
                disabled={cancelando}
                className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Motivo do cancelamento</label>
              <textarea
                autoFocus
                value={motivoCancelamento}
                onChange={(e) => setMotivoCancelamento(e.target.value)}
                placeholder="Descreva o motivo..."
                rows={3}
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400 resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setOpenCancelar(false)}
                disabled={cancelando}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Voltar
              </button>
              <button
                onClick={handleConfirmarCancelamento}
                disabled={cancelando || !motivoCancelamento.trim()}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {cancelando && <Loader2 size={14} className="animate-spin" />}
                Confirmar cancelamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
