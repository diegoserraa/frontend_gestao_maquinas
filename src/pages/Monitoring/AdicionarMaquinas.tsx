import { useEffect, useMemo, useState } from "react";
import { Search, Cpu, Loader2, Wifi, TriangleAlert, Building2, Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import { notify } from "@/lib/notify";
import { Switch } from "@/components/ui/switch";
import { usePermissoes } from "@/modules/permissoes/usePermissoes";
import { PareamentoModal } from "@/modules/machine/PareamentoModal";
import { VinculoExternoModal } from "@/modules/machine/VinculoExternoModal";
import { getMachines, toggleMonitoramento } from "@/modules/machine/machineService";
import type { Machine } from "@/modules/machine/machineTypes";
import { getTelemetriaAtual } from "@/modules/monitoramento/monitoramentoService";
import { estaAoVivo } from "@/modules/monitoramento/monitoramentoHelpers";

// re-checa quem tá "ao vivo" sem precisar dar F5 — leve o bastante pra
// deixar ligado nessa tela parada (ex.: enquanto pareia o sensor e espera
// a primeira leitura chegar)
const INTERVALO_REFRESH_MS = 15_000;

type SinalMaquina = "ao-vivo" | "sem-sinal" | "desativada";

/** Bolinha "ao vivo" — pisca só quando tem sinal de verdade chegando. */
function PontoSinal({ sinal }: { sinal: SinalMaquina }) {
  if (sinal === "ao-vivo") {
    return (
      <span className="relative flex size-2.5 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
      </span>
    );
  }
  return (
    <span
      className={cn(
        "size-2.5 shrink-0 rounded-full",
        sinal === "sem-sinal" ? "bg-amber-500" : "bg-slate-300"
      )}
    />
  );
}

function LinhaMaquina({
  m,
  sinal,
  podeEditar,
  podeParear,
  alterando,
  onAlternar,
  onParear,
}: {
  m: Machine;
  sinal: SinalMaquina;
  podeEditar: boolean;
  podeParear: boolean;
  alterando: boolean;
  onAlternar: () => void;
  onParear: () => void;
}) {
  const ativa = !!m.monitoramento_ativo;

  const ROTULO: Record<SinalMaquina, string> = {
    "ao-vivo": "Ao vivo",
    "sem-sinal": "Sem sinal",
    desativada: "Desativada",
  };
  const COR_TEXTO: Record<SinalMaquina, string> = {
    "ao-vivo": "text-emerald-700",
    "sem-sinal": "text-amber-700",
    desativada: "text-slate-400",
  };

  const CHIP: Record<SinalMaquina, string> = {
    "ao-vivo": "bg-emerald-50 text-emerald-600",
    "sem-sinal": "bg-amber-50 text-amber-600",
    desativada: "bg-slate-100 text-slate-400",
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border bg-white p-3.5 shadow-sm sm:flex-row sm:items-center sm:justify-between",
        sinal === "sem-sinal" ? "border-amber-200 bg-amber-50/40" : sinal === "desativada" ? "border-slate-200 opacity-80" : "border-slate-200"
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", CHIP[sinal])}>
          <Cpu size={16} />
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-sm font-medium text-slate-800">{m.nome}</p>
            {m.vinculo_externo && (
              <span
                title={
                  [m.sistema_origem, m.referencia_externa].filter(Boolean).join(" · ") ||
                  "Máquina do cliente — gerenciada no sistema dele"
                }
                className="inline-flex shrink-0 items-center gap-1 rounded-full bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-600"
              >
                <Building2 size={10} /> Cliente
              </span>
            )}
          </div>
          <p className="truncate text-xs text-slate-500">
            {m.setor?.nome ?? "Sem setor"} · {m.vinculo_externo ? "vínculo externo" : m.modelo}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-2.5 sm:justify-end">
        <button
          type="button"
          onClick={onParear}
          disabled={!podeParear}
          title={podeParear ? "Gerar código de pareamento pro sensor" : "Sem permissão pra parear sensores"}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Wifi size={13} /> Gerar código
        </button>

        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5">
          <PontoSinal sinal={sinal} />
          <span className={cn("text-xs font-semibold", COR_TEXTO[sinal])}>{ROTULO[sinal]}</span>
          {alterando ? (
            <Loader2 size={15} className="animate-spin text-slate-400" />
          ) : (
            <Switch
              checked={ativa}
              onCheckedChange={onAlternar}
              disabled={!podeEditar}
              label={`Ativar monitoramento de ${m.nome}`}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * "Boto uma a uma pra funcionar" — não cadastra máquina nova nenhuma, só
 * lista o que já existe em Máquinas: liga/desliga se ela aparece no
 * dashboard e, junto, já gera o código de 6 dígitos pra vincular o sensor
 * físico (mesmo fluxo de pareamento usado em Máquinas). Pensado pro
 * cenário "empresa que já tem outro sistema de gestão e só quer plugar
 * os sensores aqui".
 *
 * O sinal "ao vivo" NÃO é só "monitoramento_ativo = true" — isso é só o
 * interruptor (se a máquina deve aparecer no dashboard), não prova que o
 * sensor físico está de fato mandando dado. Por isso cruza com a telemetria
 * atual (mesma regra de "ao vivo" do resto do sistema, ver estaAoVivo):
 * ativa + leitura recente = ao vivo; ativa sem leitura recente = sem sinal
 * (sensor nunca pareado, desligado, sem WiFi etc.) — e isso precisa ficar
 * visualmente óbvio, não escondido atrás de uma bolinha verde genérica.
 */
export default function AdicionarMaquinas() {
  const { pode } = usePermissoes();
  const podeEditar = pode("monitoramento.configurar_limites");
  const podeParear = pode("maquinas.editar");

  const [maquinas, setMaquinas] = useState<Machine[]>([]);
  const [atualizadoEm, setAtualizadoEm] = useState<Record<number, string | null>>({});
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [alterando, setAlterando] = useState<number | null>(null);
  const [pareando, setPareando] = useState<Machine | null>(null);
  const [vinculoAberto, setVinculoAberto] = useState(false);

  async function carregar() {
    setCarregando(true);
    try {
      setMaquinas(await getMachines());
    } catch {
      notify.error("Erro ao carregar máquinas");
    } finally {
      setCarregando(false);
    }
  }

  async function carregarSinal() {
    try {
      const leituras = await getTelemetriaAtual();
      setAtualizadoEm(Object.fromEntries(leituras.map((l) => [l.maquina_id, l.atualizado_em])));
    } catch {
      // só degrada a bolinha pra "sem sinal" — não trava a tela por causa disso
    }
  }

  useEffect(() => {
    carregar();
    carregarSinal();
    const id = setInterval(carregarSinal, INTERVALO_REFRESH_MS);
    return () => clearInterval(id);
  }, []);

  function sinalDe(m: Machine): SinalMaquina {
    if (!m.monitoramento_ativo) return "desativada";
    return estaAoVivo(atualizadoEm[m.id] ?? null) ? "ao-vivo" : "sem-sinal";
  }

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return maquinas;
    return maquinas.filter(
      (m) =>
        m.nome.toLowerCase().includes(termo) ||
        (m.setor?.nome ?? "").toLowerCase().includes(termo)
    );
  }, [maquinas, busca]);

  const aoVivo = useMemo(() => filtradas.filter((m) => sinalDe(m) === "ao-vivo"), [filtradas, atualizadoEm]);
  const semSinal = useMemo(() => filtradas.filter((m) => sinalDe(m) === "sem-sinal"), [filtradas, atualizadoEm]);
  const disponiveis = useMemo(() => filtradas.filter((m) => sinalDe(m) === "desativada"), [filtradas, atualizadoEm]);
  const totalAtivas = maquinas.filter((m) => m.monitoramento_ativo).length;

  async function alternar(m: Machine) {
    const novoValor = !m.monitoramento_ativo;
    setAlterando(m.id);
    try {
      const atualizada = await toggleMonitoramento(m.id, novoValor);
      setMaquinas((prev) => prev.map((x) => (x.id === m.id ? atualizada : x)));
      notify.success(
        novoValor
          ? `"${m.nome}" agora aparece no Monitoramento`
          : `"${m.nome}" saiu do Monitoramento`
      );
    } catch {
      notify.error("Erro ao atualizar monitoramento dessa máquina");
    } finally {
      setAlterando(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Adicionar máquinas</h1>
          <p className="text-sm text-slate-500">
            Liga o monitoramento de uma máquina já cadastrada (sem criar nada novo) e gera o
            código pra vincular o sensor físico.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* só faz sentido quando a empresa ainda não tem NENHUMA máquina
              cadastrada (cliente 100% externo) — tendo cadastro, é só usar
              "Nova máquina" em Máquinas (já aceita criar só com nome/setor)
              e ativar o monitoramento dela aqui embaixo, sem duplicar o fluxo */}
          {podeEditar && !carregando && maquinas.length === 0 && (
            <button
              type="button"
              onClick={() => setVinculoAberto(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
            >
              <Plus size={14} /> Vincular máquina do cliente
            </button>
          )}
          <span className="inline-flex w-fit items-center gap-2 rounded-lg bg-blue-50 px-3 py-1.5 text-blue-700">
            <Cpu size={15} />
            <span className="text-base font-bold tabular-nums">{totalAtivas}</span>
            <span className="text-xs text-blue-600/70">/ {maquinas.length} monitorada(s)</span>
          </span>
        </div>
      </div>

      <div className="relative w-full sm:max-w-sm">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar máquina ou setor..."
          className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {!podeEditar && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-700">
          Você pode ver esta lista, mas não tem permissão pra ativar/desativar o monitoramento
          de uma máquina.
        </p>
      )}

      {carregando ? (
        <div className="flex items-center justify-center gap-2 py-16 text-slate-400">
          <Loader2 size={16} className="animate-spin" />
          <span className="text-sm">Carregando...</span>
        </div>
      ) : maquinas.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white py-16 text-slate-400">
          <Building2 size={26} />
          <div className="text-center">
            <p className="text-sm text-slate-500">Nenhuma máquina cadastrada ainda.</p>
            <p className="text-xs text-slate-400">
              Se o cliente gerencia o parque dele em outro sistema, vincule a máquina direto aqui.
            </p>
          </div>
          {podeEditar && (
            <button
              type="button"
              onClick={() => setVinculoAberto(true)}
              className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-3.5 py-2 text-xs font-medium text-white shadow-sm"
            >
              <Plus size={14} /> Vincular máquina do cliente
            </button>
          )}
        </div>
      ) : filtradas.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white py-16 text-slate-400">
          <Cpu size={26} />
          <p className="text-sm">Nenhuma máquina encontrada.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {semSinal.length > 0 && (
            <section className="space-y-2.5">
              <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-600">
                <TriangleAlert size={13} /> Ativada, mas sem sinal ({semSinal.length})
              </h2>
              <p className="text-xs text-slate-400">
                Monitoramento ligado, mas nenhuma leitura recente chegou — o sensor ainda não foi
                pareado (use "Gerar código") ou está sem energia/WiFi.
              </p>
              <div className="space-y-2.5">
                {semSinal.map((m) => (
                  <LinhaMaquina
                    key={m.id}
                    m={m}
                    sinal="sem-sinal"
                    podeEditar={podeEditar}
                    podeParear={podeParear}
                    alterando={alterando === m.id}
                    onAlternar={() => alternar(m)}
                    onParear={() => setPareando(m)}
                  />
                ))}
              </div>
            </section>
          )}

          {aoVivo.length > 0 && (
            <section className="space-y-2.5">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Ao vivo ({aoVivo.length})
              </h2>
              <div className="space-y-2.5">
                {aoVivo.map((m) => (
                  <LinhaMaquina
                    key={m.id}
                    m={m}
                    sinal="ao-vivo"
                    podeEditar={podeEditar}
                    podeParear={podeParear}
                    alterando={alterando === m.id}
                    onAlternar={() => alternar(m)}
                    onParear={() => setPareando(m)}
                  />
                ))}
              </div>
            </section>
          )}

          {disponiveis.length > 0 && (
            <section className="space-y-2.5">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Disponíveis pra ativar ({disponiveis.length})
              </h2>
              <div className="space-y-2.5">
                {disponiveis.map((m) => (
                  <LinhaMaquina
                    key={m.id}
                    m={m}
                    sinal="desativada"
                    podeEditar={podeEditar}
                    podeParear={podeParear}
                    alterando={alterando === m.id}
                    onAlternar={() => alternar(m)}
                    onParear={() => setPareando(m)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      <PareamentoModal open={pareando !== null} onClose={() => setPareando(null)} maquina={pareando} />

      <VinculoExternoModal
        open={vinculoAberto}
        onClose={() => setVinculoAberto(false)}
        onCriado={(maquina) => {
          setMaquinas((prev) => [maquina, ...prev]);
          // já emenda no pareamento — acabou de vincular, o próximo passo
          // natural é gerar o código e colar no sensor físico
          setPareando(maquina);
        }}
      />
    </div>
  );
}
