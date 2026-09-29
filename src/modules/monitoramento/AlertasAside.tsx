import { usePermissoes } from "@/modules/permissoes/usePermissoes";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  TriangleAlert,
  WifiOff,
  Wrench,
  Check,
  X,
  Loader2,
  ExternalLink,
  Thermometer,
  Activity,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { notify } from "@/lib/notify";
import { getUser } from "@/modules/login/loginStorage";
import { createOrdemServico } from "@/modules/ordemServico/ordemServicoService";
import { NIVEL_UI, NIVEL_UI_ESCURO, type Nivel } from "./monitoramentoHelpers";
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

// reaproveita a mesma paleta/ícone por nível dos cards de máquina — o painel
// de alertas fala a mesma língua visual do resto da tela, não é uma ilha
function nivelDoAlerta(a: AlertaMonitoramento): Nivel {
  if (a.nivel === "critico") return "critico";
  if (a.nivel === "atencao") return "atencao";
  return "sem-dado"; // "sem_sinal" no alerta = "sem-dado" no vocabulário do card
}

const ICONE_CHAVE: Record<string, typeof Thermometer> = {
  temperatura: Thermometer,
  vibracao: Activity,
};

type Props = {
  alertas: AlertaMonitoramento[];
  onMudou: () => void;
  escuro?: boolean;
};

export function AlertasAside({ alertas, onMudou, escuro = false }: Props) {
  const navigate = useNavigate();
  const { pode } = usePermissoes();
  const [ocupado, setOcupado] = useState<number | null>(null);

  // alerta simulado (id < 0) não existe no banco — resolverAlerta/
  // abrirOSDoAlerta chamariam a API por um id que não existe. "Abrir O.S."
  // continua de verdade (a máquina é real, só o alerta é simulado), só que
  // criando a ordem direto em vez de converter um alerta inexistente;
  // guarda por maquina_id porque a lista é recalculada a cada leitura nova
  // e o alerta em si não tem identidade estável entre uma leitura e outra.
  const [demoConvertidos, setDemoConvertidos] = useState<Record<number, number>>({});
  const [demoDispensados, setDemoDispensados] = useState<Set<number>>(new Set());

  const visiveis = alertas.filter(
    (a) => !(a.id < 0 && demoDispensados.has(a.maquina_id))
  );

  if (visiveis.length === 0) return null;

  async function abrirOS(a: AlertaMonitoramento) {
    try {
      setOcupado(a.id);
      if (a.id < 0) {
        // mesma descrição/prioridade que o backend monta pro alerta real
        // (MonitoramentoService.abrirOSDoAlerta), só que criando a O.S.
        // direto pela máquina em vez de converter um alerta que não existe
        const descricao =
          a.chave === "sinal"
            ? `Máquina ${a.maquina_nome} está sem comunicação (sensor/ESP32) — verificar dispositivo, rede WiFi e alimentação.`
            : `Alerta de monitoramento — ${a.chave.toUpperCase()} ${a.valor ?? "?"} (limite ${a.limite ?? "?"}) na máquina ${a.maquina_nome}.`;
        const os: any = await createOrdemServico({
          maquina_id: a.maquina_id,
          descricao,
          status: "ABERTA",
          tipo_manutencao: "CORRETIVA",
          prioridade: a.nivel === "critico" ? "ALTA" : "MEDIA",
        });
        const osId = os?.id ?? os?.ordem?.id;
        if (osId) setDemoConvertidos((prev) => ({ ...prev, [a.maquina_id]: osId }));
        notify.success(osId ? `O.S. #${osId} aberta` : "O.S. aberta");
        return;
      }
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
    if (a.id < 0) {
      // não existe de verdade pra "resolver" no banco — só tira da lista
      // (some por completo até a simulação gerar outro alerta pra ela)
      setDemoDispensados((prev) => new Set(prev).add(a.maquina_id));
      return;
    }
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
    <section
      className={cn(
        "flex max-h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-2xl border shadow-sm transition-colors",
        escuro
          ? "border-white/[0.08] bg-slate-900/50 backdrop-blur-xl"
          : "border-slate-200 bg-white"
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2 border-b px-4 py-3",
          escuro ? "border-white/[0.06]" : "border-slate-100 bg-slate-50/60"
        )}
      >
        <span
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg",
            escuro ? "bg-rose-500/10 text-rose-300" : "bg-rose-50 text-rose-500"
          )}
        >
          <TriangleAlert size={13} />
        </span>
        <h2 className={cn("text-sm font-semibold", escuro ? "text-slate-100" : "text-slate-900")}>
          Precisam de ação
        </h2>
        <span
          className={cn(
            "ml-auto rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums",
            escuro ? "bg-white/10 text-slate-300" : "bg-slate-200/70 text-slate-600"
          )}
        >
          {visiveis.length}
        </span>
      </div>

      <div
        className={cn(
          "min-h-0 flex-1 divide-y overflow-y-auto",
          escuro ? "divide-white/[0.06]" : "divide-slate-100"
        )}
      >
        {visiveis.map((a) => {
          const busy = ocupado === a.id;
          const nivel = nivelDoAlerta(a);
          const ui = escuro ? NIVEL_UI_ESCURO[nivel] : NIVEL_UI[nivel];
          const Icone = a.nivel === "sem_sinal" ? WifiOff : ICONE_CHAVE[a.chave] ?? TriangleAlert;
          const corBorda =
            nivel === "critico"
              ? escuro
                ? "border-l-rose-500/60"
                : "border-l-rose-400"
              : nivel === "atencao"
              ? escuro
                ? "border-l-amber-400/50"
                : "border-l-amber-300"
              : escuro
              ? "border-l-white/10"
              : "border-l-slate-200";

          return (
            <div
              key={a.id}
              className={cn(
                "border-l-2 px-3.5 py-3 pl-3 transition-colors",
                corBorda,
                escuro ? "hover:bg-white/[0.03]" : "hover:bg-slate-50/60"
              )}
            >
              <div className="flex items-center gap-2">
                <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-md", ui.suave)}>
                  <Icone size={11} />
                </span>
                <span className={cn("truncate text-[13px] font-semibold", escuro ? "text-slate-100" : "text-slate-800")}>
                  {a.maquina_nome}
                </span>
              </div>
              <p className={cn("mt-1 truncate pl-7 text-[11px]", escuro ? "text-slate-500" : "text-slate-500")}>
                {a.setor_nome ? `${a.setor_nome} · ` : ""}
                {a.nivel === "sem_sinal" ? (
                  "parou de enviar"
                ) : (
                  <>
                    {a.chave}{" "}
                    <b className={escuro ? "text-slate-300" : "text-slate-700"}>{a.valor}</b>
                    {a.limite != null && ` (limite ${a.limite})`}
                  </>
                )}
              </p>

              {(() => {
                // alerta real convertido vem do backend (a.ordem_servico_id);
                // alerta simulado (id < 0) vira "convertido" localmente
                // assim que Abrir O.S. cria a ordem de verdade pra máquina
                const ordemId =
                  a.id < 0 ? demoConvertidos[a.maquina_id] : a.ordem_servico_id;

                // pré-O.S.: quem pode agir escolhe entre abrir de verdade ou
                // ignorar (não é "resolver" nada ainda, é descartar o alerta
                // sem virar trabalho). Só depois que existe uma O.S. é que
                // faz sentido falar em "Resolver" — o gestor abriu e agora só
                // acompanha (Ver O.S.); quem resolve de fato é o técnico, na
                // O.S. em si — o botão aqui só confirma que o alerta acabou.
                return (
                  <div className="mt-2.5 flex flex-wrap gap-1.5 pl-7">
                    {ordemId && (
                      <button
                        type="button"
                        onClick={() => navigate(`/ordens-servico/${ordemId}`)}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors",
                          escuro
                            ? "border-blue-500/25 bg-blue-500/10 text-blue-300 hover:bg-blue-500/15"
                            : "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                        )}
                      >
                        <ExternalLink size={12} /> Ver O.S. #{ordemId}
                      </button>
                    )}
                    {!ordemId && pode("monitoramento.abrir_os") && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => abrirOS(a)}
                        className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-2.5 py-1.5 text-[11px] font-medium text-white shadow-sm disabled:opacity-60"
                      >
                        {busy ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Wrench size={12} />
                        )}
                        Abrir O.S.
                      </button>
                    )}
                    {pode("monitoramento.resolver_alertas") &&
                      (ordemId ? (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => resolver(a)}
                          className={cn(
                            "inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors disabled:opacity-60",
                            escuro
                              ? "border-emerald-500/25 text-emerald-300 hover:bg-emerald-500/10"
                              : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                          )}
                        >
                          <Check size={12} /> Resolver
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => resolver(a)}
                          className={cn(
                            "inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors disabled:opacity-60",
                            escuro
                              ? "border-white/10 text-slate-400 hover:bg-white/5 hover:text-slate-200"
                              : "border-slate-200 text-slate-500 hover:bg-slate-50"
                          )}
                        >
                          <X size={12} /> Ignorar
                        </button>
                      ))}
                  </div>
                );
              })()}
            </div>
          );
        })}
      </div>
    </section>
  );
}
