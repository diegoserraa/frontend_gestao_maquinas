import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  TriangleAlert,
  WifiOff,
  Wrench,
  Check,
  Loader2,
  ExternalLink,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { notify } from "@/lib/notify";
import { getUser } from "@/modules/login/loginStorage";
import {
  getAlertas,
  resolverAlerta,
  abrirOSDoAlerta,
  type AlertaMonitoramento,
} from "./monitoramentoService";

/* ================= hook =================
 * Só traz alertas já CONFIRMADOS (janela cumprida). Enquanto uma métrica
 * está só oscilando fora do limite, ela não aparece em lugar nenhum —
 * evita "ansiedade de contagem regressiva"; a máquina simplesmente surge
 * aqui quando (e se) o problema se confirmar.
 */

export function usePainelAlertas() {
  const [alertas, setAlertas] = useState<AlertaMonitoramento[]>([]);
  const vivo = useRef(true);

  const recarregar = useCallback(() => {
    getAlertas("ativos")
      .then((l) => vivo.current && setAlertas(l))
      .catch(() => {});
  }, []);

  useEffect(() => {
    vivo.current = true;
    recarregar();
    const id = setInterval(recarregar, 10000);
    return () => {
      vivo.current = false;
      clearInterval(id);
    };
  }, [recarregar]);

  return { alertas, recarregar };
}

/* ================= aside ================= */

const DOT: Record<string, string> = {
  critico: "bg-rose-500",
  atencao: "bg-amber-500",
  sem_sinal: "bg-slate-400",
};

type Props = {
  alertas: AlertaMonitoramento[];
  onMudou: () => void;
};

export function AlertasAside({ alertas, onMudou }: Props) {
  const navigate = useNavigate();
  const [ocupado, setOcupado] = useState<number | null>(null);

  if (alertas.length === 0) return null;

  async function abrirOS(a: AlertaMonitoramento) {
    try {
      setOcupado(a.id);
      const r = await abrirOSDoAlerta(a.id, getUser()?.id);
      notify.success(
        r.ordem_servico_id ? `O.S. #${r.ordem_servico_id} aberta` : "O.S. aberta"
      );
      onMudou();
    } catch (e) {
      notify.error(e instanceof Error ? e.message : "Erro ao abrir O.S.");
    } finally {
      setOcupado(null);
    }
  }

  async function resolver(a: AlertaMonitoramento) {
    try {
      setOcupado(a.id);
      await resolverAlerta(a.id);
      notify.success("Alerta resolvido");
      onMudou();
    } catch {
      notify.error("Erro ao resolver");
    } finally {
      setOcupado(null);
    }
  }

  return (
    <section className="flex max-h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/60 px-4 py-3">
        <TriangleAlert size={15} className="text-rose-500" />
        <h2 className="text-sm font-semibold text-slate-900">Precisam de ação</h2>
        <span className="ml-auto rounded-full bg-slate-200/70 px-2 py-0.5 text-[11px] font-medium text-slate-600">
          {alertas.length}
        </span>
      </div>

      <div className="min-h-0 flex-1 divide-y divide-slate-100 overflow-y-auto">
        {alertas.map((a) => {
          const busy = ocupado === a.id;
          return (
            <div key={a.id} className="px-4 py-3">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "h-2 w-2 shrink-0 rounded-full",
                    DOT[a.nivel] ?? DOT.atencao
                  )}
                />
                <span className="truncate text-[13px] font-semibold text-slate-800">
                  {a.maquina_nome}
                </span>
              </div>
              <p className="mt-0.5 truncate text-[11px] text-slate-500">
                {a.setor_nome ? `${a.setor_nome} · ` : ""}
                {a.nivel === "sem_sinal" ? (
                  <span className="inline-flex items-center gap-1">
                    <WifiOff size={10} /> parou de enviar
                  </span>
                ) : (
                  <>
                    {a.chave} <b>{a.valor}</b>
                    {a.limite != null && ` (limite ${a.limite})`}
                  </>
                )}
              </p>

              <div className="mt-2 flex flex-wrap gap-2">
                {a.status === "convertido" && a.ordem_servico_id ? (
                  <button
                    type="button"
                    onClick={() => navigate(`/ordens-servico/${a.ordem_servico_id}`)}
                    className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-[11px] font-medium text-blue-700 hover:bg-blue-100"
                  >
                    <ExternalLink size={12} /> Ver O.S. #{a.ordem_servico_id}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => abrirOS(a)}
                    className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-2.5 py-1.5 text-[11px] font-medium text-white disabled:opacity-60"
                  >
                    {busy ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Wrench size={12} />
                    )}
                    Abrir O.S.
                  </button>
                )}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => resolver(a)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-60"
                >
                  <Check size={12} /> Resolver
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
