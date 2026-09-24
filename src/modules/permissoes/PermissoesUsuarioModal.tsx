import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Building2,
  ClipboardList,
  Cpu,
  FileBarChart,
  Handshake,
  LayoutDashboard,
  Loader2,
  Lock,
  Paperclip,
  RotateCcw,
  Users,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { notify } from "@/lib/notify";

import {
  getAuditoriaDoUsuario,
  getCatalogo,
  getPermissoesDoUsuario,
  salvarPermissoesDoUsuario,
} from "./permissoesService";
import {
  alternarModulo,
  contarDoModulo,
  definirEscopoOS,
  desligar,
  diferenca,
  escopoDeOS,
  ligar,
  mesmoConjunto,
  OS_VER_PROPRIAS,
  OS_VER_TODAS,
  rotulosDe,
  type EscopoOS,
} from "./permissoesLogica";
import type {
  Catalogo,
  ModuloCatalogo,
  PermissoesDoUsuario,
  RegistroAuditoria,
} from "./permissoesTypes";

/* ------------------------------------------------------------------ */

const ICONES: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  maquinas: Cpu,
  os: ClipboardList,
  monitoramento: Activity,
  setores: Building2,
  parceiros: Handshake,
  usuarios: Users,
  relatorios: FileBarChart,
  anexos: Paperclip,
};

const ROTULO_TIPO: Record<string, string> = {
  GESTOR: "Gestor",
  TECNICO: "Técnico",
  OPERADOR: "Operador",
};

const ROTULO_ACAO: Record<string, string> = {
  definir: "Permissões alteradas",
  restaurar_padrao: "Padrão do tipo restaurado",
  criacao: "Cadastro (permissões iniciais)",
  mudanca_de_tipo: "Mudança de tipo do funcionário",
};

// o catálogo não muda durante a sessão: uma busca só
let catalogoEmCache: Promise<Catalogo> | null = null;
const carregarCatalogo = () => (catalogoEmCache ??= getCatalogo().catch((e) => {
  catalogoEmCache = null;
  throw e;
}));

const mensagemDe = (e: unknown, padrao: string) => (e instanceof Error && e.message ? e.message : padrao);

/* ------------------------------------------------------------------ */

type Props = {
  open: boolean;
  onClose: () => void;
  usuario: { id: number; nome: string; role: string } | null;
  onSalvo?: () => void;
};

export function PermissoesUsuarioModal({ open, onClose, usuario, onSalvo }: Props) {
  const [catalogo, setCatalogo] = useState<Catalogo | null>(null);
  const [dados, setDados] = useState<PermissoesDoUsuario | null>(null);
  const [selecionadas, setSelecionadas] = useState<Set<string>>(new Set());
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [aba, setAba] = useState("permissoes");
  const [historico, setHistorico] = useState<RegistroAuditoria[] | null>(null);
  const [erroHistorico, setErroHistorico] = useState<string | null>(null);

  const usuarioId = usuario?.id;

  useEffect(() => {
    if (!open || usuarioId === undefined) return;

    let ativo = true;
    setCarregando(true);
    setErro(null);
    setDados(null);
    setHistorico(null);
    setErroHistorico(null);
    setAba("permissoes");

    Promise.all([carregarCatalogo(), getPermissoesDoUsuario(usuarioId)])
      .then(([c, d]) => {
        if (!ativo) return;
        setCatalogo(c);
        setDados(d);
        setSelecionadas(new Set(d.permissoes));
      })
      .catch((e) => ativo && setErro(mensagemDe(e, "Não foi possível carregar as permissões.")))
      .finally(() => ativo && setCarregando(false));

    return () => {
      ativo = false;
    };
  }, [open, usuarioId]);

  // o histórico só é buscado quando a aba é aberta
  useEffect(() => {
    if (!open || aba !== "historico" || usuarioId === undefined || historico) return;

    let ativo = true;
    setErroHistorico(null);

    getAuditoriaDoUsuario(usuarioId)
      .then((h) => ativo && setHistorico(h))
      .catch((e) => ativo && setErroHistorico(mensagemDe(e, "Não foi possível carregar o histórico.")));

    return () => {
      ativo = false;
    };
  }, [open, aba, usuarioId, historico]);

  const original = useMemo(() => new Set(dados?.permissoes ?? []), [dados]);
  const concedivel = useMemo(() => new Set(dados?.concedivel ?? []), [dados]);
  const rotulos = useMemo(() => (catalogo ? rotulosDe(catalogo) : new Map<string, string>()), [catalogo]);

  const alterado = !mesmoConjunto(original, selecionadas);
  const totalAlteracoes = useMemo(() => {
    const d = diferenca(original, selecionadas);
    return d.adicionadas.length + d.removidas.length;
  }, [original, selecionadas]);

  const totalPermissoes = catalogo?.modulos.reduce((n, m) => n + m.acoes.length, 0) ?? 0;

  /** Aplica a mudança se tudo que ela toca estiver dentro do que quem edita pode conceder. */
  function aplicar(proximo: Set<string>) {
    const d = diferenca(selecionadas, proximo);
    const bloqueada = [...d.adicionadas, ...d.removidas].find((p) => !concedivel.has(p));

    if (bloqueada) {
      notify.error(`Essa mudança mexeria em "${rotulos.get(bloqueada) ?? bloqueada}", que você não pode alterar.`);
      return;
    }

    setSelecionadas(proximo);
  }

  const aoAlternarAcao = (permissao: string, valor: boolean) =>
    catalogo && aplicar(valor ? ligar(selecionadas, permissao, catalogo) : desligar(selecionadas, permissao, catalogo));

  const aoAlternarModulo = (modulo: ModuloCatalogo, valor: boolean) =>
    catalogo && aplicar(alternarModulo(selecionadas, modulo, valor, catalogo));

  const aoDefinirEscopo = (escopo: EscopoOS) =>
    catalogo && aplicar(definirEscopoOS(selecionadas, escopo, catalogo));

  function restaurarPadrao() {
    if (!dados) return;
    // só troca o que este gestor pode mexer; o resto fica exatamente como está
    setSelecionadas(
      new Set([...dados.padrao.filter((p) => concedivel.has(p)), ...[...original].filter((p) => !concedivel.has(p))])
    );
    notify.info("Padrão do tipo aplicado. Clique em “Salvar permissões” para confirmar.");
  }

  function pedirFechar() {
    if (alterado && !window.confirm("Há alterações não salvas. Deseja descartá-las?")) return;
    onClose();
  }

  async function salvar() {
    if (usuarioId === undefined) return;

    try {
      setSalvando(true);
      const resultado = await salvarPermissoesDoUsuario(usuarioId, [...selecionadas]);

      if (resultado.adicionadasPorDependencia.length > 0) {
        notify.info(
          `Também foram liberadas, por dependência: ${resultado.adicionadasPorDependencia
            .map((p) => rotulos.get(p) ?? p)
            .join(", ")}.`
        );
      }

      notify.success("Permissões atualizadas");
      onSalvo?.();
      onClose();
    } catch (e) {
      notify.error(mensagemDe(e, "Não foi possível salvar as permissões."));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(aberto) => !aberto && pedirFechar()}>
      <DialogContent
        className="flex max-h-[92vh] w-[96vw] flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-4xl"
      >
        {/* CABEÇALHO */}
        <DialogHeader className="shrink-0 px-4 pb-3 pt-5 text-left sm:px-6 sm:pt-6">
          <DialogTitle className="flex flex-wrap items-center gap-2 text-left text-lg font-semibold sm:text-xl">
            Permissões de {usuario?.nome}
            {usuario && (
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                {ROTULO_TIPO[usuario.role] ?? usuario.role}
              </span>
            )}
          </DialogTitle>
          <DialogDescription className="text-left text-xs text-slate-500 sm:text-sm">
            Escolha quais telas este funcionário acessa e o que ele pode fazer em cada uma.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={aba} onValueChange={setAba} className="flex min-h-0 flex-1 flex-col gap-0">
          <div className="shrink-0 border-b px-4 sm:px-6">
            <TabsList className="mb-2 grid w-full grid-cols-2 sm:w-fit">
              <TabsTrigger value="permissoes">Permissões</TabsTrigger>
              <TabsTrigger value="historico">Histórico</TabsTrigger>
            </TabsList>
          </div>

          {/* ---------- PERMISSÕES ---------- */}
          <TabsContent value="permissoes" className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
            {carregando && <EsqueletoCartoes />}

            {!carregando && erro && (
              <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {erro}
              </div>
            )}

            {!carregando && !erro && catalogo && dados && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 sm:text-sm">
                  <span>
                    <strong className="text-slate-800">{selecionadas.size}</strong> de {totalPermissoes} permissões
                    liberadas
                  </span>
                  {dados.concedivel.length < totalPermissoes && (
                    <span className="inline-flex items-center gap-1 text-amber-700">
                      <Lock size={12} /> Você só pode alterar o que você mesmo possui.
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {catalogo.modulos.map((modulo) => (
                    <CartaoModulo
                      key={modulo.chave}
                      modulo={modulo}
                      selecionadas={selecionadas}
                      concedivel={concedivel}
                      aoAlternarAcao={aoAlternarAcao}
                      aoAlternarModulo={aoAlternarModulo}
                      aoDefinirEscopo={aoDefinirEscopo}
                    />
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* ---------- HISTÓRICO ---------- */}
          <TabsContent value="historico" className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
            {erroHistorico && (
              <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {erroHistorico}
              </div>
            )}

            {!erroHistorico && !historico && (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-400">
                <Loader2 size={16} className="animate-spin" /> Carregando histórico...
              </div>
            )}

            {historico && historico.length === 0 && (
              <p className="py-10 text-center text-sm text-slate-400">Nenhuma alteração registrada ainda.</p>
            )}

            {historico && historico.length > 0 && (
              <ul className="space-y-2">
                {historico.map((h) => (
                  <ItemHistorico key={h.id} registro={h} rotulos={rotulos} />
                ))}
              </ul>
            )}
          </TabsContent>
        </Tabs>

        {/* RODAPÉ */}
        <div className="flex shrink-0 flex-col-reverse gap-2 border-t bg-slate-50/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Button
            type="button"
            variant="outline"
            onClick={restaurarPadrao}
            disabled={!dados || salvando}
            className="h-10 w-full sm:h-9 sm:w-auto"
          >
            <RotateCcw size={14} /> Restaurar padrão do tipo
          </Button>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
            {alterado && (
              <span className="text-center text-xs text-amber-700 sm:mr-1 sm:text-right" aria-live="polite">
                {totalAlteracoes} {totalAlteracoes === 1 ? "alteração não salva" : "alterações não salvas"}
              </span>
            )}

            <Button type="button" variant="outline" onClick={pedirFechar} className="h-10 w-full sm:h-9 sm:w-auto">
              Cancelar
            </Button>

            <Button
              type="button"
              onClick={salvar}
              disabled={!alterado || salvando || !dados}
              className="h-10 w-full bg-blue-600 text-white hover:bg-blue-700 sm:h-9 sm:w-auto"
            >
              {salvando && <Loader2 size={14} className="animate-spin" />}
              Salvar permissões
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */

type CartaoProps = {
  modulo: ModuloCatalogo;
  selecionadas: ReadonlySet<string>;
  concedivel: ReadonlySet<string>;
  aoAlternarAcao: (permissao: string, valor: boolean) => void;
  aoAlternarModulo: (modulo: ModuloCatalogo, valor: boolean) => void;
  aoDefinirEscopo: (escopo: EscopoOS) => void;
};

function CartaoModulo({ modulo, selecionadas, concedivel, aoAlternarAcao, aoAlternarModulo, aoDefinirEscopo }: CartaoProps) {
  const Icone = ICONES[modulo.chave] ?? ClipboardList;
  const ehOS = modulo.chave === "os";

  const escopo = ehOS ? escopoDeOS(selecionadas) : null;
  const acessoLigado = ehOS ? escopo !== "nenhuma" : selecionadas.has(modulo.acesso);

  // as ações que aparecem como linhas (a de "acesso" é o interruptor do cartão)
  const linhas = modulo.acoes.filter(
    (a) => a.permissao !== modulo.acesso && !(ehOS && (a.permissao === OS_VER_TODAS || a.permissao === OS_VER_PROPRIAS))
  );

  const { ligadas, total } = contarDoModulo(selecionadas, modulo);
  const podeMudarAcesso = ehOS
    ? concedivel.has(OS_VER_TODAS) || concedivel.has(OS_VER_PROPRIAS)
    : concedivel.has(modulo.acesso);

  return (
    <section
      aria-labelledby={`mod-${modulo.chave}`}
      className={cn(
        "rounded-xl border bg-white shadow-sm transition-colors",
        acessoLigado ? "border-blue-200" : "border-slate-200"
      )}
    >
      <header className="flex items-start gap-3 p-3 sm:p-4">
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg",
            acessoLigado ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-400"
          )}
        >
          <Icone size={18} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 id={`mod-${modulo.chave}`} className="text-sm font-semibold text-slate-900">
              {modulo.rotulo}
            </h3>
            {acessoLigado && total > 1 && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                {ligadas}/{total}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">{modulo.descricao}</p>
        </div>

        {!ehOS && (
          <div className="flex shrink-0 items-center gap-2">
            {!podeMudarAcesso && <Lock size={13} className="text-slate-400" aria-hidden="true" />}
            <Switch
              id={`sw-modulo-${modulo.chave}`}
              checked={acessoLigado}
              onCheckedChange={(v) => aoAlternarModulo(modulo, v)}
              disabled={!podeMudarAcesso}
              label={`Acesso à tela ${modulo.rotulo}`}
            />
          </div>
        )}
      </header>

      {/* O.S.: o "ver" tem três níveis */}
      {ehOS && (
        <div className="px-3 pb-3 sm:px-4">
          <p className="mb-1.5 text-xs font-medium text-slate-600">Quais O.S. este funcionário enxerga</p>
          <div role="radiogroup" aria-label="O.S. visíveis" className="grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1">
            {(
              [
                ["nenhuma", "Nenhuma"],
                ["proprias", "Só as minhas"],
                ["todas", "Todas"],
              ] as [EscopoOS, string][]
            ).map(([valor, rotulo]) => {
              const marcado = escopo === valor;
              const bloqueado =
                !podeMudarAcesso ||
                (valor === "todas" && !concedivel.has(OS_VER_TODAS)) ||
                (valor === "proprias" && !concedivel.has(OS_VER_PROPRIAS));

              return (
                <button
                  key={valor}
                  type="button"
                  role="radio"
                  aria-checked={marcado}
                  disabled={bloqueado}
                  onClick={() => aoDefinirEscopo(valor)}
                  className={cn(
                    "min-h-9 rounded-md px-2 py-1.5 text-xs font-medium transition",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                    marcado ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-900",
                    bloqueado && "cursor-not-allowed opacity-50"
                  )}
                >
                  {rotulo}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {acessoLigado && linhas.length > 0 && (
        <ul className="divide-y divide-slate-100 border-t border-slate-100 px-3 sm:px-4">
          {linhas.map((acao) => {
            const bloqueada = !concedivel.has(acao.permissao);

            return (
              <li key={acao.permissao} className="flex min-h-11 items-center justify-between gap-3 py-2.5">
                {/* o texto também aciona o interruptor: alvo de toque grande no celular */}
                <label
                  htmlFor={`sw-${acao.permissao}`}
                  className={cn("min-w-0 flex-1 py-0.5", bloqueada ? "cursor-not-allowed" : "cursor-pointer")}
                >
                  <span className="flex items-center gap-1.5 text-sm font-medium text-slate-800">
                    {acao.rotulo}
                    {bloqueada && (
                      <Lock size={12} className="text-slate-400" aria-label="Você não possui esta permissão" />
                    )}
                  </span>
                  <span className="block text-xs text-slate-500">{acao.descricao}</span>
                </label>

                <Switch
                  id={`sw-${acao.permissao}`}
                  checked={selecionadas.has(acao.permissao)}
                  onCheckedChange={(v) => aoAlternarAcao(acao.permissao, v)}
                  disabled={bloqueada}
                  label={`${modulo.rotulo}: ${acao.rotulo}`}
                />
              </li>
            );
          })}
        </ul>
      )}

      {!acessoLigado && (
        <p className="border-t border-slate-100 px-3 py-2.5 text-xs text-slate-400 sm:px-4">Sem acesso a esta tela.</p>
      )}
    </section>
  );
}

function ItemHistorico({ registro, rotulos }: { registro: RegistroAuditoria; rotulos: Map<string, string> }) {
  const { adicionadas, removidas } = diferenca(registro.antes, registro.depois);
  const mostrar = (lista: string[]) => lista.slice(0, 6);

  const data = new Date(registro.criado_em).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

  return (
    <li className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 text-xs text-slate-500">
        <span>{data}</span>
        <span>por {registro.alterado_por_nome ?? "usuário removido"}</span>
      </div>

      <p className="mt-1 text-sm font-medium text-slate-800">{ROTULO_ACAO[registro.acao] ?? registro.acao}</p>

      {adicionadas.length === 0 && removidas.length === 0 && (
        <p className="mt-1 text-xs text-slate-400">Nenhuma diferença.</p>
      )}

      <div className="mt-2 flex flex-wrap gap-1.5">
        {mostrar(adicionadas).map((p) => (
          <span key={`+${p}`} className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700">
            + {rotulos.get(p) ?? p}
          </span>
        ))}
        {mostrar(removidas).map((p) => (
          <span key={`-${p}`} className="rounded-md bg-red-50 px-2 py-0.5 text-[11px] text-red-700">
            − {rotulos.get(p) ?? p}
          </span>
        ))}
        {adicionadas.length + removidas.length > 12 && (
          <span className="px-1 py-0.5 text-[11px] text-slate-400">e mais…</span>
        )}
      </div>
    </li>
  );
}

function EsqueletoCartoes() {
  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2" aria-busy="true" aria-label="Carregando permissões">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-28 animate-pulse rounded-xl bg-slate-100" />
      ))}
    </div>
  );
}
