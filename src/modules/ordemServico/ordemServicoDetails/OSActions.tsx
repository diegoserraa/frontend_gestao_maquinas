import { useState } from "react";
import {
  CheckCircle2,
  PlayCircle,
  ClipboardCheck,
  Ban,
  HardHat,
  UserPlus,
  Bell,
  BellRing,
  ChevronDown,
  Loader2,
  X,
} from "lucide-react";

import {
  atribuirTecnicoOS,
  iniciarAtendimentoOS,
  finalizarOS,
  cancelarOS,
} from "@/modules/ordemServico/ordemServicoService";
import { ID_TECNICO_EXTERNO } from "@/modules/ordemServico/ordemServicoConstants";
import type { OrdemServico } from "@/modules/ordemServico/ordemServicoType";

import { FinalizarOrdemServicoModal } from "@/components/modals/ordemServico/FinalizarOrdemServico";

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

// ── botão compacto estilo "pill" — mesma linguagem visual dos badges
// de status/prioridade do resto da tela (fundo clarinho + borda +
// texto colorido), em vez de blocos sólidos grandes. Cor com
// intenção: quem é destrutivo (cancelar) fica sutil e à parte, quem
// é a ação principal do momento tem o tom mais "cheio" dos três.
const PILL_VARIANTS = {
  blue: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
  amber: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
  violet: "bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100",
  red: "bg-white text-red-600 border-red-200 hover:bg-red-50",
  neutral: "bg-white text-slate-600 border-slate-200 hover:bg-slate-50",
  active: "bg-blue-50 text-blue-700 border-blue-200",
} as const;

function PillButton({
  variant = "neutral",
  icon,
  loading,
  onClick,
  className = "",
  children,
}: {
  variant?: keyof typeof PILL_VARIANTS;
  icon?: React.ReactNode;
  loading?: boolean;
  onClick: (e: React.MouseEvent) => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={`
        h-9 px-3.5 rounded-lg border inline-flex items-center gap-1.5 shrink-0
        text-sm font-medium transition-all
        disabled:opacity-60 disabled:cursor-not-allowed
        active:scale-[0.97]
        ${PILL_VARIANTS[variant]} ${className}
      `}
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : icon}
      {children}
    </button>
  );
}

export function OSActions({ os, userRole, userId, tecnicos, onRefresh }: Props) {
  const [assumindo, setAssumindo] = useState(false);
  const [iniciando, setIniciando] = useState(false);
  const [definindoExterno, setDefinindoExterno] = useState(false);
  const [atribuindoId, setAtribuindoId] = useState<number | null>(null);

  const [openFinalizar, setOpenFinalizar] = useState(false);
  const [openCancelar, setOpenCancelar] = useState(false);
  const [motivoCancelamento, setMotivoCancelamento] = useState("");
  const [cancelando, setCancelando] = useState(false);

  // "Acompanhar OS" — visível pra todos os perfis. Ainda não existe
  // endpoint pra persistir isso, então por enquanto é só um estado
  // visual local (otimista). Assim que houver um service pra
  // seguir/deixar de seguir, é só trocar o setSeguindo por uma chamada
  // real dentro de handleToggleSeguir.
  const [seguindo, setSeguindo] = useState(false);

  // ── mesmas regras de sempre ──────────────────────────────
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

  // ── handlers ──────────────────────────────────────────────
  function handleToggleSeguir(e: React.MouseEvent) {
    e.stopPropagation();
    setSeguindo((v) => !v);
  }

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
      // reaproveita o endpoint de atribuir técnico com o id fixo do
      // placeholder, e já pula direto pra EM_ANDAMENTO (não existe
      // etapa intermediária visível pra técnico externo)
      await atribuirTecnicoOS(os.id, ID_TECNICO_EXTERNO, userId);
      await iniciarAtendimentoOS(os.id);
      onRefresh("EM_ANDAMENTO");
    } catch (err) {
      console.error(err);
    } finally {
      setDefinindoExterno(false);
    }
  }

  async function handleAtribuirTecnico(tecnicoId: number) {
    if (!tecnicoId) return;
    setAtribuindoId(tecnicoId);
    try {
      await atribuirTecnicoOS(os.id, tecnicoId, userId);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setAtribuindoId(null);
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

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
      <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
        Ações
      </h2>

      {isExterno && (
        <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-violet-50 border border-violet-100 mb-3">
          <HardHat size={15} className="text-violet-500 shrink-0" />
          <span className="text-xs font-medium text-violet-700">
            Execução por técnico externo
          </span>
        </div>
      )}

      {/* TUDO NUMA LINHA SÓ — quebra naturalmente em telas estreitas */}
      <div className="flex flex-wrap items-center gap-2">
        {/* ação principal do status atual — a mais "cheia" das três,
            já que é o próximo passo óbvio */}
        {podeAssumir && (
          <PillButton variant="blue" icon={<CheckCircle2 size={15} />} loading={assumindo} onClick={handleAssumir}>
            Assumir atendimento
          </PillButton>
        )}

        {podeIniciar && (
          <PillButton variant="amber" icon={<PlayCircle size={15} />} loading={iniciando} onClick={handleIniciar}>
            Iniciar atendimento
          </PillButton>
        )}

        {podeFinalizar && (
          <PillButton
            variant="emerald"
            icon={<ClipboardCheck size={15} />}
            onClick={(e) => {
              e.stopPropagation();
              setOpenFinalizar(true);
            }}
          >
            Finalizar atendimento
          </PillButton>
        )}

        {/* sempre visível, em qualquer perfil */}
        <PillButton
          variant={seguindo ? "active" : "neutral"}
          icon={seguindo ? <BellRing size={15} /> : <Bell size={15} />}
          onClick={handleToggleSeguir}
        >
          {seguindo ? "Acompanhando" : "Acompanhar OS"}
        </PillButton>

        {podeDefinirExterno && (
          <PillButton variant="violet" icon={<HardHat size={15} />} loading={definindoExterno} onClick={handleDefinirExterno}>
            Definir técnico externo
          </PillButton>
        )}

        {podeAtribuir && (
          <div className="relative shrink-0">
            <UserPlus size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-600 pointer-events-none" />
            <select
              defaultValue=""
              disabled={atribuindoId !== null}
              onChange={(e) => handleAtribuirTecnico(Number(e.target.value))}
              className="
                h-9 pl-9 pr-8 rounded-lg border border-slate-200 bg-white
                text-sm font-medium text-slate-700 appearance-none
                hover:bg-slate-50 transition-all cursor-pointer
                disabled:opacity-60 disabled:cursor-not-allowed
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
            {atribuindoId !== null ? (
              <Loader2 size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 animate-spin pointer-events-none" />
            ) : (
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            )}
          </div>
        )}

        {/* destrutivo — sutil (não sólido) e separado à direita quando
            há espaço, pra não competir visualmente com o resto */}
        {podeCancelar && (
          <PillButton
            variant="red"
            icon={<Ban size={15} />}
            onClick={(e) => {
              e.stopPropagation();
              setOpenCancelar(true);
            }}
            className="sm:ml-auto"
          >
            Cancelar OS
          </PillButton>
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

      {/* MODAL CANCELAR */}
      {openCancelar && (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4"
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
