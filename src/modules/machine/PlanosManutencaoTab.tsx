import { useEffect, useState } from "react";
import { Loader2, Plus, Pencil, Trash2, Calendar, Gauge, Sparkles, Check, Save } from "lucide-react";

import { notify } from "@/lib/notify";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { DateInput } from "@/components/ui/date-input";
import { ConfirmDialog } from "@/components/modals/machine/confirmDialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

import { getMachines } from "./machineService";
import type { Machine } from "./machineTypes";
import { getTelemetriaAtual } from "../monitoramento/monitoramentoService";
import { estaAoVivo } from "../monitoramento/monitoramentoHelpers";
import {
  listarPlanosManutencao,
  criarPlanoManutencao,
  atualizarPlanoManutencao,
  excluirPlanoManutencao,
  clonarPlanosManutencao,
} from "./planoManutencaoService";
import type { NovoPlanoManutencao, PlanoManutencao, TipoGatilhoPreventiva } from "./planoManutencaoTypes";

// mesma janela usada no backend (PlanoManutencaoRepository.horasAtuais): uma
// leitura de semanas atrás (sensor testado uma vez e nunca mais) não conta
// como "a máquina tem sensor" — precisa ter mandado algo nos últimos 7 dias
const JANELA_SENSOR_ATIVO_SEGUNDOS = 7 * 24 * 60 * 60;

type Props = {
  maquinaId?: number;
  // chamado depois que "Salvar" manda tudo pra API com sucesso — quem usa
  // decide o que fazer (ex.: fechar o modal). Não dispara em exclusão nem
  // em clonagem, e não dispara em "Guardar" (isso é só local, ainda).
  // Não se aplica no modo "direto" (ver abaixo).
  onSalvou?: () => void;
  // modo do assistente de criação: cada plano salva na hora (sem fila de
  // "guardar"/"salvar em lote") — lá quem controla o avanço é só o botão
  // "Avançar" do assistente. Fora disso (editar máquina), fica no modo
  // padrão: guardar vários localmente e salvar tudo de uma vez.
  direto?: boolean;
};

// Um plano "guardado" mas ainda não mandado pra API — vive só no navegador
// até alguém clicar no "Salvar" geral. idExistente presente = é uma EDIÇÃO
// de um plano que já existe de verdade; ausente = é um plano NOVO.
type PlanoPendente = {
  chave: string;
  idExistente?: number;
  dados: NovoPlanoManutencao;
};

// mesmo padrão visual do resto dos forms de máquina (ver MachineForm.tsx —
// "baseInput"/inputClass): sombra + anel azul no foco, não só borda
const CAMPO =
  "h-10 w-full rounded-xl border bg-white px-4 text-sm text-slate-700 shadow-sm placeholder:text-slate-400 transition-all duration-150 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 border-slate-200 hover:border-slate-300";
const RADIO_LABEL = "text-xs font-medium text-slate-600";

function formatarUltimaManutencao(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `última em ${d.toLocaleDateString("pt-BR", { timeZone: "UTC" })}`;
}

function formatarVencimento(p: PlanoManutencao): string {
  if (p.tipo_gatilho === "DIAS") {
    if (!p.proxima_data) return "—";
    // o backend devolve a data já como ISO completo (ex. "2026-10-22T00:00:00.000Z"),
    // não um "AAAA-MM-DD" puro — não colar mais hora em cima disso (virava Invalid Date)
    const d = new Date(p.proxima_data);
    if (Number.isNaN(d.getTime())) return "—";
    return `vence em ${d.toLocaleDateString("pt-BR", { timeZone: "UTC" })}`;
  }
  const referencia = p.horas_referencia != null ? Number(p.horas_referencia) : null;
  if (referencia == null) return "—";
  return `próxima aos ${(referencia + (p.intervalo_horas ?? 0)).toFixed(0)}h de uso`;
}

function resumoIntervalo(dados: {
  tipo_gatilho: TipoGatilhoPreventiva;
  intervalo_dias?: number | null;
  intervalo_horas?: number | null;
}): string {
  return dados.tipo_gatilho === "DIAS"
    ? `a cada ${dados.intervalo_dias} dia${dados.intervalo_dias === 1 ? "" : "s"}`
    : `a cada ${dados.intervalo_horas}h de uso`;
}

export function PlanosManutencaoTab({ maquinaId, onSalvou, direto }: Props) {
  const [planos, setPlanos] = useState<PlanoManutencao[]>([]);
  const [pendentes, setPendentes] = useState<PlanoPendente[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [salvandoTudo, setSalvandoTudo] = useState(false);
  const [salvandoForm, setSalvandoForm] = useState(false);
  const [temSensor, setTemSensor] = useState(false);

  // "novo" = formulário em branco; number = editando um plano real (id dele);
  // string = editando um pendente que já estava na fila (chave dele)
  const [formAberto, setFormAberto] = useState<"novo" | number | string | null>(null);
  const [excluindo, setExcluindo] = useState<PlanoManutencao | null>(null);
  const [excluindoCarregando, setExcluindoCarregando] = useState(false);

  async function carregar() {
    if (!maquinaId) return;
    setCarregando(true);
    try {
      setPlanos(await listarPlanosManutencao(maquinaId));
    } catch {
      notify.error("Erro ao carregar planos de manutenção");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maquinaId]);

  // plano "por horas" só faz sentido se a máquina já manda horímetro —
  // trava no front além do backend já recusar, pra não deixar a pessoa
  // preencher tudo e só descobrir no final que não dava pra usar essa opção
  useEffect(() => {
    if (!maquinaId) return;
    getTelemetriaAtual()
      .then((lista) => {
        const leitura = lista.find((l) => l.maquina_id === maquinaId);
        const temLeitura = leitura?.horas_ligadas != null;
        const recente = estaAoVivo(leitura?.atualizado_em ?? null, JANELA_SENSOR_ATIVO_SEGUNDOS);
        setTemSensor(temLeitura && recente);
      })
      .catch(() => setTemSensor(false));
  }, [maquinaId]);

  if (!maquinaId) {
    return (
      <p className="py-10 text-center text-sm text-slate-500">
        Salve a máquina primeiro para configurar os planos de manutenção.
      </p>
    );
  }

  if (carregando) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-slate-400">
        <Loader2 size={16} className="animate-spin" />
        <span className="text-sm">Carregando...</span>
      </div>
    );
  }

  // valores iniciais do formulário, vindo de onde fizer sentido conforme o
  // que está sendo editado (plano real, pendente já na fila, ou em branco)
  let valoresIniciais: NovoPlanoManutencao | undefined;
  if (typeof formAberto === "number") {
    const pendenteDesseReal = pendentes.find((p) => p.idExistente === formAberto);
    if (pendenteDesseReal) {
      valoresIniciais = pendenteDesseReal.dados;
    } else {
      const real = planos.find((p) => p.id === formAberto);
      if (real) {
        valoresIniciais = {
          descricao: real.descricao,
          tipo_gatilho: real.tipo_gatilho,
          intervalo_dias: real.intervalo_dias ?? undefined,
          intervalo_horas: real.intervalo_horas ?? undefined,
          ultima_manutencao: real.ultima_manutencao ?? undefined,
          ativo: real.ativo,
        };
      }
    }
  } else if (typeof formAberto === "string") {
    valoresIniciais = pendentes.find((p) => p.chave === formAberto)?.dados;
  }

  async function handleGuardar(dados: NovoPlanoManutencao) {
    // modo direto (assistente de criação): salva na API na hora, sem fila —
    // aqui formAberto só pode ser "novo" ou o id de um plano real (nunca uma
    // chave de pendente, porque nesse modo nunca existe pendente nenhum)
    if (direto) {
      if (!maquinaId) return;
      setSalvandoForm(true);
      try {
        if (typeof formAberto === "number") {
          await atualizarPlanoManutencao(maquinaId, formAberto, dados);
        } else {
          await criarPlanoManutencao(maquinaId, dados);
        }
        await carregar();
        setFormAberto(null);
        notify.success("Plano de preventiva salvo");
      } catch (erro: any) {
        notify.error(erro?.message ?? "Erro ao salvar plano de manutenção");
      } finally {
        setSalvandoForm(false);
      }
      return;
    }

    if (typeof formAberto === "number") {
      const idExistente = formAberto;
      setPendentes((prev) => [...prev.filter((p) => p.idExistente !== idExistente), { chave: `edicao-${idExistente}`, idExistente, dados }]);
    } else if (typeof formAberto === "string" && formAberto !== "novo") {
      // formAberto === "novo" é o sentinel de "formulário em branco", não a
      // chave de um pendente de verdade — precisa ser checado antes deste
      // ramo, senão cai aqui, não acha ninguém com essa chave e não guarda nada
      const chave = formAberto;
      setPendentes((prev) => prev.map((p) => (p.chave === chave ? { ...p, dados } : p)));
    } else {
      setPendentes((prev) => [...prev, { chave: `novo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, dados }]);
    }
    setFormAberto(null);
  }

  async function salvarTudo() {
    if (pendentes.length === 0 || !maquinaId) return;
    setSalvandoTudo(true);
    const falharam: PlanoPendente[] = [];

    for (const p of pendentes) {
      try {
        if (p.idExistente) {
          await atualizarPlanoManutencao(maquinaId, p.idExistente, p.dados);
        } else {
          await criarPlanoManutencao(maquinaId, p.dados);
        }
      } catch {
        falharam.push(p);
      }
    }

    setPendentes(falharam);
    await carregar();
    setSalvandoTudo(false);

    if (falharam.length > 0) {
      notify.error(`${falharam.length} plano(s) não foram salvos — corrija e tente de novo`);
    } else {
      notify.success("Planos de preventiva salvos");
      onSalvou?.();
    }
  }

  function removerPendenteNovo(chave: string) {
    setPendentes((prev) => prev.filter((p) => p.chave !== chave));
  }

  const pendentesNovos = pendentes.filter((p) => p.idExistente == null);
  const temPendencias = pendentes.length > 0;

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500">
        Cada plano gera sua própria O.S. preventiva, no próprio ritmo — pode ter
        quantos quiser (ex.: "troca de óleo" a cada 90 dias e "verificar
        correias" a cada 500h de uso, ao mesmo tempo).
        {!direto && ' "Guardar" só coloca na lista; nada vira realidade até clicar em "Salvar".'}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setFormAberto("novo")}
          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3.5 py-2.5 text-xs font-medium text-white shadow-sm transition-all duration-150 hover:shadow-md"
        >
          <Plus size={14} /> Novo plano
        </button>

        <BotaoAproveitarPlano maquinaId={maquinaId} onClonado={carregar} />
      </div>

      {formAberto !== null && (
        <FormPlano
          valoresIniciais={valoresIniciais}
          temSensor={temSensor}
          salvando={direto && salvandoForm}
          rotuloBotao={direto ? "Salvar" : "Guardar"}
          onGuardar={handleGuardar}
          onCancelar={() => setFormAberto(null)}
        />
      )}

      {planos.length === 0 && pendentesNovos.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 py-8 text-center text-sm text-slate-400">
          Nenhum plano de manutenção cadastrado ainda.
        </p>
      ) : (
        <div className="space-y-2">
          {planos.map((real) => {
            const pendenteEdicao = pendentes.find((p) => p.idExistente === real.id);
            return (
              <CardPlano
                key={real.id}
                descricao={pendenteEdicao?.dados.descricao ?? real.descricao}
                resumo={resumoIntervalo(pendenteEdicao?.dados ?? real)}
                vencimento={pendenteEdicao ? "alterações não salvas" : formatarVencimento(real)}
                ultimaManutencao={!pendenteEdicao ? formatarUltimaManutencao(real.ultima_manutencao) : null}
                ativo={pendenteEdicao?.dados.ativo ?? real.ativo}
                tipoGatilho={pendenteEdicao?.dados.tipo_gatilho ?? real.tipo_gatilho}
                pendente={!!pendenteEdicao}
                onEditar={() => setFormAberto(real.id)}
                onExcluir={() => setExcluindo(real)}
              />
            );
          })}

          {pendentesNovos.map((p) => (
            <CardPlano
              key={p.chave}
              descricao={p.dados.descricao}
              resumo={resumoIntervalo(p.dados)}
              vencimento="será calculado ao salvar"
              ultimaManutencao={null}
              ativo={p.dados.ativo ?? true}
              tipoGatilho={p.dados.tipo_gatilho}
              pendente
              onEditar={() => setFormAberto(p.chave)}
              onExcluir={() => removerPendenteNovo(p.chave)}
            />
          ))}
        </div>
      )}

      {!direto && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={salvarTudo}
            disabled={salvandoTudo || !temPendencias}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all duration-150 hover:shadow-md disabled:opacity-60"
          >
            {salvandoTudo ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {temPendencias ? `Salvar (${pendentes.length})` : "Salvar"}
          </button>
        </div>
      )}

      <ConfirmDialog
        open={!!excluindo}
        title="Excluir plano de manutenção"
        description={`Tem certeza que deseja excluir "${excluindo?.descricao}"? Essa ação não pode ser desfeita.`}
        loading={excluindoCarregando}
        onOpenChange={(v) => !v && setExcluindo(null)}
        onConfirm={async () => {
          if (!excluindo || !maquinaId) return;
          setExcluindoCarregando(true);
          try {
            await excluirPlanoManutencao(maquinaId, excluindo.id);
            notify.success("Plano excluído");
            setPendentes((prev) => prev.filter((p) => p.idExistente !== excluindo.id));
            setExcluindo(null);
            carregar();
          } catch {
            notify.error("Erro ao excluir plano");
          } finally {
            setExcluindoCarregando(false);
          }
        }}
      />
    </div>
  );
}

function CardPlano({
  descricao,
  resumo,
  vencimento,
  ultimaManutencao,
  ativo,
  tipoGatilho,
  pendente,
  onEditar,
  onExcluir,
}: {
  descricao: string;
  resumo: string;
  vencimento: string;
  ultimaManutencao: string | null;
  ativo: boolean;
  tipoGatilho: TipoGatilhoPreventiva;
  pendente: boolean;
  onEditar: () => void;
  onExcluir: () => void;
}) {
  const Icone = tipoGatilho === "DIAS" ? Calendar : Gauge;

  return (
    <div
      className={cn(
        "rounded-xl border bg-white p-3 shadow-sm",
        pendente ? "border-amber-300 bg-amber-50/40" : ativo ? "border-slate-200" : "border-slate-100 opacity-60"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <Icone size={14} className={pendente ? "shrink-0 text-amber-500" : "shrink-0 text-blue-500"} />
            <span className="truncate text-sm font-medium text-slate-800">{descricao}</span>
            {pendente && (
              <span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                não salvo
              </span>
            )}
            {!pendente && !ativo && (
              <span className="shrink-0 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                inativo
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            {resumo}
            {" · "}
            {vencimento}
            {ultimaManutencao && ` · ${ultimaManutencao}`}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button type="button" onClick={onEditar} title="Editar" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <Pencil size={14} />
          </button>
          <button type="button" onClick={onExcluir} title="Excluir" className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

function FormPlano({
  valoresIniciais,
  temSensor,
  salvando,
  rotuloBotao,
  onGuardar,
  onCancelar,
}: {
  valoresIniciais?: NovoPlanoManutencao;
  temSensor: boolean;
  salvando?: boolean;
  rotuloBotao: string;
  onGuardar: (dados: NovoPlanoManutencao) => void;
  onCancelar: () => void;
}) {
  const podeHoras = temSensor || valoresIniciais?.tipo_gatilho === "HORAS";

  const [descricao, setDescricao] = useState(valoresIniciais?.descricao ?? "");
  const [tipo, setTipo] = useState<TipoGatilhoPreventiva>(valoresIniciais?.tipo_gatilho ?? "DIAS");
  const [intervaloDias, setIntervaloDias] = useState(String(valoresIniciais?.intervalo_dias ?? ""));
  const [intervaloHoras, setIntervaloHoras] = useState(String(valoresIniciais?.intervalo_horas ?? ""));
  const [ultimaManutencao, setUltimaManutencao] = useState(valoresIniciais?.ultima_manutencao?.slice(0, 10) ?? "");
  const [ativo, setAtivo] = useState(valoresIniciais?.ativo ?? true);

  function guardar() {
    if (!descricao.trim()) return notify.error("Descreva a tarefa do plano");

    const intervalo_dias = tipo === "DIAS" ? Number(intervaloDias) : undefined;
    const intervalo_horas = tipo === "HORAS" ? Number(intervaloHoras) : undefined;

    if (tipo === "DIAS" && (!intervalo_dias || intervalo_dias <= 0)) return notify.error("Informe o intervalo em dias");
    if (tipo === "HORAS" && (!intervalo_horas || intervalo_horas <= 0)) return notify.error("Informe o intervalo em horas");

    onGuardar({
      descricao: descricao.trim(),
      tipo_gatilho: tipo,
      intervalo_dias,
      intervalo_horas,
      ultima_manutencao: tipo === "DIAS" && ultimaManutencao ? ultimaManutencao : undefined,
      ativo,
    });
  }

  return (
    <div className="space-y-3 rounded-xl border border-blue-200 bg-blue-50/40 p-3.5">
      <div className="space-y-1">
        <label className={RADIO_LABEL}>Tarefa</label>
        <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex.: Troca de óleo" className={CAMPO} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setTipo("DIAS")}
          className={cn(
            "flex h-10 items-center justify-center gap-1.5 rounded-xl border text-xs font-medium shadow-sm transition-all duration-150",
            tipo === "DIAS" ? "border-blue-500 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
          )}
        >
          <Calendar size={13} /> Por dias
        </button>
        <button
          type="button"
          onClick={() => podeHoras && setTipo("HORAS")}
          disabled={!podeHoras}
          title={podeHoras ? undefined : "Essa máquina ainda não tem sensor enviando horímetro"}
          className={cn(
            "flex h-10 items-center justify-center gap-1.5 rounded-xl border text-xs font-medium shadow-sm transition-all duration-150",
            tipo === "HORAS"
              ? "border-blue-500 bg-blue-600 text-white"
              : podeHoras
              ? "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
              : "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300"
          )}
        >
          <Gauge size={13} /> Por horas de uso
        </button>
      </div>
      {!podeHoras && (
        <p className="-mt-1.5 text-[11px] text-slate-400">
          "Por horas de uso" só fica disponível depois que essa máquina tiver um sensor enviando horímetro.
        </p>
      )}

      {tipo === "DIAS" ? (
        <div className="space-y-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className={RADIO_LABEL}>Intervalo (dias)</label>
              <Input inputMode="numeric" value={intervaloDias} onChange={(e) => setIntervaloDias(e.target.value)} className={CAMPO} />
            </div>

            <div className="space-y-1">
              <label className={RADIO_LABEL}>Última vez que foi feita (opcional)</label>
              <DateInput value={ultimaManutencao} onChange={setUltimaManutencao} />
            </div>
          </div>
          <p className="text-[11px] text-slate-400">
            Ex.: 7 dias = semanal, 30 = mensal. Deixe a data em branco pra contar a partir de hoje.
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          <label className={RADIO_LABEL}>Intervalo (horas de operação)</label>
          <div className="grid grid-cols-2 gap-3">
            <Input inputMode="numeric" value={intervaloHoras} onChange={(e) => setIntervaloHoras(e.target.value)} className={CAMPO} />
          </div>
        </div>
      )}

      <label className="flex items-center gap-1.5 text-xs text-slate-600">
        <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} />
        Ativo
      </label>

      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onCancelar} className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-600 shadow-sm hover:border-slate-300">
          Cancelar
        </button>
        <button
          type="button"
          onClick={guardar}
          disabled={salvando}
          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3.5 py-2 text-xs font-medium text-white shadow-sm transition-all duration-150 hover:shadow-md disabled:opacity-60"
        >
          {salvando ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
          {rotuloBotao}
        </button>
      </div>
    </div>
  );
}

function BotaoAproveitarPlano({ maquinaId, onClonado }: { maquinaId: number; onClonado: () => void }) {
  const [aberto, setAberto] = useState(false);
  const [maquinas, setMaquinas] = useState<Machine[]>([]);
  const [carregandoLista, setCarregandoLista] = useState(false);
  const [copiando, setCopiando] = useState(false);

  useEffect(() => {
    if (!aberto || maquinas.length > 0) return;
    setCarregandoLista(true);
    getMachines()
      .then((lista) => setMaquinas(lista.filter((m) => m.id !== maquinaId)))
      .catch(() => notify.error("Erro ao carregar máquinas"))
      .finally(() => setCarregandoLista(false));
  }, [aberto, maquinaId, maquinas.length]);

  async function escolher(origem: Machine) {
    setCopiando(true);
    try {
      const resultado = await clonarPlanosManutencao(maquinaId, origem.id);
      setAberto(false);
      if (resultado.criados.length > 0) {
        notify.success(`${resultado.criados.length} plano(s) copiado(s) de "${origem.nome}"`);
      }
      if (resultado.ignorados.length > 0) {
        notify.error(`${resultado.ignorados.length} plano(s) não copiado(s): ${resultado.ignorados.map((i) => i.descricao).join(", ")}`);
      }
      onClonado();
    } catch (erro: any) {
      notify.error(erro?.message ?? "Erro ao copiar planos");
    } finally {
      setCopiando(false);
    }
  }

  return (
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={copiando}
          className="inline-flex items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3.5 py-2.5 text-xs font-medium text-violet-700 shadow-sm transition-all duration-150 hover:border-violet-300 hover:bg-violet-100 disabled:opacity-60"
        >
          <Sparkles size={14} /> Aproveitar plano de manutenção
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar máquina..." />
          <CommandList>
            {carregandoLista ? (
              <div className="flex items-center justify-center gap-2 py-6 text-slate-400">
                <Loader2 size={14} className="animate-spin" />
                <span className="text-xs">Carregando...</span>
              </div>
            ) : (
              <>
                <CommandEmpty>Nenhuma máquina encontrada.</CommandEmpty>
                {maquinas.map((m) => (
                  <CommandItem key={m.id} value={m.nome} onSelect={() => escolher(m)}>
                    {m.nome}
                  </CommandItem>
                ))}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
