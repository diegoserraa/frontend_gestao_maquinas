import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Info, Loader2, Search, TriangleAlert, UsersRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { notify } from "@/lib/notify";

import { carregarCatalogo, mensagemDe } from "./catalogoCache";
import { CartaoModuloLista } from "./CartoesPermissoes";
import { acoesVisiveis, casaComBusca, iniciais } from "./permissoesBusca";
import {
  alternarNaEscolha,
  escolhaInicial,
  frasePreview,
  montarPedido,
  plural,
  resumirResultado,
  ROTULO_MOTIVO,
  type ModoAlvo,
} from "./permissoesGrupoLogica";
import { aplicarPermissoesEmGrupo } from "./permissoesService";
import { usePermissoes } from "./usePermissoes";
import type { AcaoEmGrupo, Catalogo, ResultadoEmGrupo, TipoFuncionario } from "./permissoesTypes";

/* ------------------------------------------------------------------ */

export type FuncionarioResumo = { id: number; nome: string; role: string; ativo: boolean };

type Props = {
  open: boolean;
  onClose: () => void;
  /** funcionários que quem está aplicando pode alterar (para contar por tipo e escolher pessoas) */
  usuarios: FuncionarioResumo[];
  /** depois de aplicar com sucesso (a tela recarrega o que precisar) */
  aoAplicar?: () => void;
};

const ROTULO_TIPO: Record<string, string> = {
  GESTOR: "Gestor",
  TECNICO: "Técnico",
  OPERADOR: "Operador",
};

const ROTULO_TIPO_PLURAL: Record<string, string> = {
  GESTOR: "Gestores",
  TECNICO: "Técnicos",
  OPERADOR: "Operadores",
};

type Simulacao =
  | { estado: "ocioso" }
  | { estado: "carregando" }
  | { estado: "pronto"; resultado: ResultadoEmGrupo }
  | { estado: "erro"; mensagem: string };

const ATRASO_SIMULACAO_MS = 350;

/**
 * Dar ou retirar permissões de VÁRIOS funcionários de uma vez: por tipo (todos os técnicos,
 * todos os operadores) ou escolhendo as pessoas aqui mesmo. Antes de aplicar mostra o que vai
 * acontecer. Quem tem ajuste individual não é alterado (o individual tem prioridade).
 */
export function PermissoesGrupoModal({ open, onClose, usuarios, aoAplicar }: Props) {
  const { role: meuPapel, lista: minhasPermissoes } = usePermissoes();
  const souAdmin = meuPapel === "ADMIN";

  const [catalogo, setCatalogo] = useState<Catalogo | null>(null);
  const [erroCatalogo, setErroCatalogo] = useState<string | null>(null);

  const [modo, setModo] = useState<ModoAlvo>("tipo");
  const [tipo, setTipo] = useState<TipoFuncionario | null>("TECNICO");
  const [ids, setIds] = useState<number[]>([]);
  const [acao, setAcao] = useState<AcaoEmGrupo>("dar");
  const [escolhidas, setEscolhidas] = useState<Set<string>>(escolhaInicial());
  const [busca, setBusca] = useState("");

  const [simulacao, setSimulacao] = useState<Simulacao>({ estado: "ocioso" });
  const [aplicando, setAplicando] = useState(false);
  const [final, setFinal] = useState<ResultadoEmGrupo | null>(null);

  // abrir: recomeça tudo
  useEffect(() => {
    if (!open) return;

    setModo("tipo");
    setTipo("TECNICO");
    setIds([]);
    setAcao("dar");
    setEscolhidas(escolhaInicial());
    setBusca("");
    setSimulacao({ estado: "ocioso" });
    setFinal(null);
    setErroCatalogo(null);

    let ativo = true;
    carregarCatalogo()
      .then((c) => ativo && setCatalogo(c))
      .catch((e) => ativo && setErroCatalogo(mensagemDe(e, "Não foi possível carregar as permissões.")));

    return () => {
      ativo = false;
    };
  }, [open]);

  /** O que este usuário pode dar/retirar: o que ele mesmo possui (o dono do sistema, tudo). */
  const concedivel = useMemo(() => {
    if (souAdmin && catalogo) return new Set(catalogo.modulos.flatMap((m) => m.acoes.map((a) => a.permissao)));

    // o gestor não faz manutenção (não assume/inicia/pausa), mas configura isso para os técnicos dele
    const extras = meuPapel === "GESTOR" ? catalogo?.vedadas?.GESTOR ?? [] : [];
    return new Set([...minhasPermissoes, ...extras]);
  }, [souAdmin, meuPapel, catalogo, minhasPermissoes]);

  const tiposDisponiveis: TipoFuncionario[] = souAdmin ? ["TECNICO", "OPERADOR", "GESTOR"] : ["TECNICO", "OPERADOR"];

  const contagemPorTipo = useMemo(() => {
    const c: Record<string, number> = {};
    for (const u of usuarios) c[u.role] = (c[u.role] ?? 0) + 1;
    return c;
  }, [usuarios]);

  const pedido = useMemo(
    () => montarPedido({ modo, tipo, usuarios: ids, acao, permissoes: escolhidas }),
    [modo, tipo, ids, acao, escolhidas]
  );

  // pré-visualização: pergunta ao servidor o que aconteceria (sem gravar) sempre que o pedido muda
  useEffect(() => {
    if (!open || final) return;

    if (!pedido) {
      setSimulacao({ estado: "ocioso" });
      return;
    }

    let ativo = true;
    setSimulacao({ estado: "carregando" });

    const timer = window.setTimeout(() => {
      aplicarPermissoesEmGrupo(pedido, true)
        .then((resultado) => ativo && setSimulacao({ estado: "pronto", resultado }))
        .catch((e) => ativo && setSimulacao({ estado: "erro", mensagem: mensagemDe(e, "Não foi possível simular.") }));
    }, ATRASO_SIMULACAO_MS);

    return () => {
      ativo = false;
      window.clearTimeout(timer);
    };
  }, [open, pedido, final]);

  function trocarAcao(nova: AcaoEmGrupo) {
    if (nova === acao) return;
    setAcao(nova);
    setEscolhidas(escolhaInicial()); // "marcado" muda de significado (dar × retirar)
  }

  function alternar(permissao: string, valor: boolean) {
    if (!catalogo) return;
    setEscolhidas((atual) => alternarNaEscolha(atual, permissao, valor, acao, catalogo));
  }

  const alterados = simulacao.estado === "pronto" ? simulacao.resultado.alterados.length : 0;
  const podeAplicar = simulacao.estado === "pronto" && alterados > 0 && !aplicando;

  // se o alvo são só gestores, esconde o que gestor não pode ter (assumir/iniciar/pausar O.S.)
  const ocultas = useMemo(() => {
    if (!catalogo?.vedadas) return new Set<string>();

    const tiposAlvo: string[] =
      modo === "tipo"
        ? tipo
          ? [tipo]
          : []
        : [...new Set(ids.map((id) => usuarios.find((u) => u.id === id)?.role).filter((r): r is string => !!r))];

    const todosVedam = tiposAlvo.length > 0 ? tiposAlvo.map((t) => catalogo.vedadas?.[t as TipoFuncionario] ?? []) : [];
    if (todosVedam.length === 0) return new Set<string>();

    // só some quando TODOS os tipos alvo vedam a permissão
    const primeiro = todosVedam[0];
    return new Set(primeiro.filter((p) => todosVedam.every((lista) => lista.includes(p))));
  }, [catalogo, modo, tipo, ids, usuarios]);

  const semResultado = !!catalogo && busca.trim() !== "" && catalogo.modulos.every((m) => acoesVisiveis(m, busca) === null);

  async function aplicar() {
    if (!pedido) return;

    try {
      setAplicando(true);
      const resultado = await aplicarPermissoesEmGrupo(pedido, false);
      setFinal(resultado);
      notify.success(
        resultado.alterados.length > 0
          ? `${plural(resultado.alterados.length, "funcionário alterado", "funcionários alterados")}`
          : "Nada precisou mudar"
      );
      aoAplicar?.();
    } catch (e) {
      notify.error(mensagemDe(e, "Não foi possível aplicar as permissões."));
    } finally {
      setAplicando(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(aberto) => !aberto && onClose()}>
      <DialogContent className="flex max-h-[92vh] w-[96vw] flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-2xl">
        <DialogHeader className="shrink-0 px-4 pb-4 pt-5 text-left sm:px-6 sm:pt-6">
          <div className="flex items-center gap-3 pr-8">
            <span
              aria-hidden="true"
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm"
            >
              <UsersRound size={20} />
            </span>
            <div className="min-w-0">
              <DialogTitle className="text-left text-lg font-semibold sm:text-xl">Permissões em grupo</DialogTitle>
              <DialogDescription className="text-left text-xs text-slate-500 sm:text-sm">
                Dê ou retire permissões de vários funcionários de uma vez.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto border-t bg-slate-50/60 px-4 py-4 sm:px-6">
          {erroCatalogo && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {erroCatalogo}
            </div>
          )}

          {!erroCatalogo && !catalogo && (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-400">
              <Loader2 size={16} className="animate-spin" /> Carregando...
            </div>
          )}

          {/* ---------- RESULTADO (depois de aplicar) ---------- */}
          {final && <TelaResultado resultado={final} acao={acao} onFechar={onClose} />}

          {/* ---------- ESCOLHAS ---------- */}
          {!final && catalogo && (
            <div className="space-y-5">
              <div className="flex gap-2 rounded-xl border border-blue-100 bg-blue-50/70 p-3 text-xs text-blue-800 sm:text-sm">
                <Info size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                <p>
                  Quem tem <strong>ajuste individual</strong> (feito no botão de permissões de cada funcionário)
                  <strong> não é alterado por aqui</strong>: o ajuste individual tem prioridade sobre o grupo.
                </p>
              </div>

              {/* 1. PARA QUEM */}
              <Secao numero={1} titulo="Para quem">
                <Segmentado
                  rotulo="Alvo"
                  valor={modo}
                  aoMudar={(v) => setModo(v as ModoAlvo)}
                  opcoes={[
                    ["tipo", "Por tipo"],
                    ["selecao", ids.length > 0 ? `Escolher pessoas (${ids.length})` : "Escolher pessoas"],
                  ]}
                />

                {modo === "tipo" ? (
                  <div role="radiogroup" aria-label="Tipo de funcionário" className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {tiposDisponiveis.map((t) => {
                      const marcado = tipo === t;
                      const total = contagemPorTipo[t] ?? 0;

                      return (
                        <button
                          key={t}
                          type="button"
                          role="radio"
                          aria-checked={marcado}
                          onClick={() => setTipo(t)}
                          className={cn(
                            "flex min-h-14 flex-col items-start justify-center rounded-xl border px-3.5 py-2 text-left transition",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                            marcado ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-white hover:border-slate-300"
                          )}
                        >
                          <span className="text-sm font-semibold text-slate-900">Todos os {ROTULO_TIPO_PLURAL[t].toLowerCase()}</span>
                          <span className="text-xs text-slate-500">{plural(total, "funcionário", "funcionários")}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <SeletorDePessoas usuarios={usuarios} ids={ids} aoMudar={setIds} />
                )}
              </Secao>

              {/* 2. O QUE FAZER */}
              <Secao numero={2} titulo="O que fazer">
                <Segmentado
                  rotulo="Ação"
                  valor={acao}
                  aoMudar={(v) => trocarAcao(v as AcaoEmGrupo)}
                  opcoes={[
                    ["dar", "Dar permissões"],
                    ["retirar", "Retirar permissões"],
                  ]}
                />
                {acao === "retirar" && (
                  <p className="mt-2 flex gap-1.5 text-xs text-amber-700">
                    <TriangleAlert size={14} className="mt-px shrink-0" aria-hidden="true" />
                    Retirar também tira o que depende da permissão retirada (ex.: tirar “Ver máquinas” tira também
                    cadastrar e editar).
                  </p>
                )}
              </Secao>

              {/* 3. QUAIS PERMISSÕES */}
              <Secao numero={3} titulo={acao === "dar" ? "Quais permissões dar" : "Quais permissões retirar"}>
                <div className="relative mb-2.5">
                  <Search size={15} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder="Buscar permissão (ex.: excluir, relatório)"
                    aria-label="Buscar permissão"
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div className="space-y-2.5">
                  {catalogo.modulos.map((modulo) => (
                    <CartaoModuloLista
                      key={modulo.chave}
                      modulo={modulo}
                      escolhidas={escolhidas}
                      concedivel={concedivel}
                      aoAlternar={alternar}
                      busca={busca}
                      ocultas={ocultas}
                    />
                  ))}

                  {semResultado && (
                    <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                      Nenhuma permissão encontrada para “{busca}”.
                    </p>
                  )}
                </div>
              </Secao>
            </div>
          )}
        </div>

        {/* RODAPÉ */}
        {!final && (
          <div className="shrink-0 border-t bg-white px-4 py-3 sm:px-6">
            <Previa simulacao={simulacao} acao={acao} temEscolha={escolhidas.size > 0} temAlvo={modo === "tipo" || ids.length > 0} />

            <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={onClose} className="h-10 w-full sm:h-9 sm:w-auto">
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={aplicar}
                disabled={!podeAplicar}
                className="h-10 w-full bg-blue-600 text-white hover:bg-blue-700 sm:h-9 sm:w-auto"
              >
                {aplicando && <Loader2 size={14} className="animate-spin" />}
                {alterados > 0 ? `Aplicar em ${plural(alterados, "funcionário", "funcionários")}` : "Aplicar"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */

function Secao({ numero, titulo, children }: { numero: number; titulo: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
        <span className="flex size-5 items-center justify-center rounded-full bg-slate-900 text-[11px] font-semibold text-white">
          {numero}
        </span>
        {titulo}
      </h3>
      {children}
    </section>
  );
}

function Segmentado({
  rotulo,
  valor,
  aoMudar,
  opcoes,
}: {
  rotulo: string;
  valor: string;
  aoMudar: (v: string) => void;
  opcoes: [string, string][];
}) {
  return (
    <div role="radiogroup" aria-label={rotulo} className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 sm:w-fit sm:min-w-80">
      {opcoes.map(([v, texto]) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={valor === v}
          onClick={() => aoMudar(v)}
          className={cn(
            "min-h-10 rounded-lg px-3 py-1.5 text-sm font-medium transition sm:min-h-9",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
            valor === v ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
          )}
        >
          {texto}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Escolher pessoas (dentro do próprio painel)                        */
/* ------------------------------------------------------------------ */

function SeletorDePessoas({
  usuarios,
  ids,
  aoMudar,
}: {
  usuarios: FuncionarioResumo[];
  ids: number[];
  aoMudar: (ids: number[]) => void;
}) {
  const [texto, setTexto] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<string>("TODOS");

  const tipos = useMemo(() => [...new Set(usuarios.map((u) => u.role))], [usuarios]);
  const marcados = useMemo(() => new Set(ids), [ids]);

  const visiveis = useMemo(
    () => usuarios.filter((u) => (filtroTipo === "TODOS" || u.role === filtroTipo) && casaComBusca([u.nome], texto)),
    [usuarios, filtroTipo, texto]
  );

  const todosVisiveisMarcados = visiveis.length > 0 && visiveis.every((u) => marcados.has(u.id));

  function alternar(id: number) {
    aoMudar(marcados.has(id) ? ids.filter((i) => i !== id) : [...ids, id]);
  }

  function alternarVisiveis() {
    if (todosVisiveisMarcados) {
      const fora = new Set(visiveis.map((u) => u.id));
      aoMudar(ids.filter((i) => !fora.has(i)));
    } else {
      aoMudar([...new Set([...ids, ...visiveis.map((u) => u.id)])]);
    }
  }

  if (usuarios.length === 0) {
    return (
      <p className="mt-3 rounded-xl border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500">
        Não há funcionários que você possa alterar.
      </p>
    );
  }

  return (
    <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="space-y-2 border-b border-slate-100 p-2.5">
        <div className="relative">
          <Search size={15} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Buscar funcionário pelo nome"
            aria-label="Buscar funcionário"
            className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {tipos.length > 1 && (
          <div role="radiogroup" aria-label="Filtrar por tipo" className="flex flex-wrap gap-1.5">
            {["TODOS", ...tipos].map((t) => (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={filtroTipo === t}
                onClick={() => setFiltroTipo(t)}
                className={cn(
                  "min-h-8 rounded-full border px-3 text-xs font-medium transition",
                  filtroTipo === t
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                )}
              >
                {t === "TODOS" ? "Todos" : ROTULO_TIPO_PLURAL[t] ?? t}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={alternarVisiveis}
            disabled={visiveis.length === 0}
            className="min-h-8 rounded-md px-1 font-medium text-blue-600 hover:text-blue-700 disabled:opacity-40"
          >
            {todosVisiveisMarcados ? "Desmarcar os da lista" : `Marcar ${visiveis.length === 1 ? "o da lista" : `os ${visiveis.length} da lista`}`}
          </button>
          <span className="text-slate-500" aria-live="polite">
            {plural(ids.length, "escolhido", "escolhidos")}
          </span>
        </div>
      </div>

      <ul className="max-h-60 divide-y divide-slate-100 overflow-y-auto" aria-label="Funcionários">
        {visiveis.map((u) => {
          const marcado = marcados.has(u.id);

          return (
            <li key={u.id}>
              <label
                className={cn(
                  "flex min-h-12 cursor-pointer items-center gap-3 px-3 py-2 transition-colors",
                  marcado ? "bg-blue-50/60" : "hover:bg-slate-50"
                )}
              >
                <input
                  type="checkbox"
                  checked={marcado}
                  onChange={() => alternar(u.id)}
                  aria-label={`Escolher ${u.nome}`}
                  className="size-5 shrink-0 cursor-pointer accent-blue-600"
                />
                <span
                  aria-hidden="true"
                  className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600"
                >
                  {iniciais(u.nome)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-slate-800">{u.nome}</span>
                  <span className="block text-xs text-slate-500">
                    {ROTULO_TIPO[u.role] ?? u.role}
                    {!u.ativo && " · inativo"}
                  </span>
                </span>
              </label>
            </li>
          );
        })}

        {visiveis.length === 0 && (
          <li className="p-4 text-center text-sm text-slate-500">Ninguém encontrado.</li>
        )}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Previa({
  simulacao,
  acao,
  temEscolha,
  temAlvo,
}: {
  simulacao: Simulacao;
  acao: AcaoEmGrupo;
  temEscolha: boolean;
  temAlvo: boolean;
}) {
  let conteudo: React.ReactNode;

  if (simulacao.estado === "carregando") {
    conteudo = (
      <span className="inline-flex items-center gap-1.5 text-slate-500">
        <Loader2 size={13} className="animate-spin" /> Calculando...
      </span>
    );
  } else if (simulacao.estado === "erro") {
    conteudo = <span className="text-red-600">{simulacao.mensagem}</span>;
  } else if (simulacao.estado === "pronto") {
    const r = resumirResultado(simulacao.resultado);
    conteudo = (
      <div>
        <p className={cn("font-medium", r.algoParaAplicar ? "text-slate-800" : "text-slate-500")}>
          {frasePreview(simulacao.resultado, acao)}
        </p>
        {r.ajusteIndividual.length > 0 && (
          <p className="mt-0.5 text-xs text-slate-500">Com ajuste individual: {r.ajusteIndividual.join(", ")}.</p>
        )}
      </div>
    );
  } else {
    conteudo = (
      <span className="text-slate-500">
        {!temAlvo ? "Escolha para quem." : !temEscolha ? "Marque ao menos uma permissão para ver o resultado." : ""}
      </span>
    );
  }

  return (
    <div className="min-h-9 text-sm" role="status" aria-live="polite" data-previa>
      {conteudo}
    </div>
  );
}

function TelaResultado({
  resultado,
  acao,
  onFechar,
}: {
  resultado: ResultadoEmGrupo;
  acao: AcaoEmGrupo;
  onFechar: () => void;
}) {
  const r = resumirResultado(resultado);

  const grupos: [string, string[]][] = [
    [ROTULO_MOTIVO.ajuste_individual, r.ajusteIndividual],
    [ROTULO_MOTIVO.sem_mudanca, r.semMudanca],
    [ROTULO_MOTIVO.fora_do_seu_limite, r.foraDoLimite],
  ];

  return (
    <div className="space-y-4" role="status" data-resultado>
      <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={20} aria-hidden="true" />
        <div>
          <p className="text-sm font-semibold text-emerald-900">{frasePreview(resultado, acao)}</p>
          {r.alterados > 0 && (
            <p className="mt-1 text-xs text-emerald-800">{resultado.alterados.map((a) => a.nome).join(", ")}</p>
          )}
        </div>
      </div>

      {grupos
        .filter(([, nomes]) => nomes.length > 0)
        .map(([texto, nomes]) => (
          <div key={texto} className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="text-xs font-semibold text-slate-700">Ignorados — {texto}</p>
            <p className="mt-1 text-xs text-slate-500">{nomes.join(", ")}</p>
          </div>
        ))}

      <Button type="button" onClick={onFechar} className="h-10 w-full bg-blue-600 text-white hover:bg-blue-700 sm:h-9 sm:w-auto">
        Concluir
      </Button>
    </div>
  );
}
