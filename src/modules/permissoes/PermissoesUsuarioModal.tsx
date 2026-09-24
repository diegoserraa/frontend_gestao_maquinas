import { useEffect, useMemo, useState } from "react";
import { Loader2, Lock, RotateCcw, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { notify } from "@/lib/notify";

import { CartaoModulo } from "./CartoesPermissoes";
import { acoesVisiveis, iniciais } from "./permissoesBusca";
import { carregarCatalogo, mensagemDe } from "./catalogoCache";
import {
  getPermissoesDoUsuario,
  restaurarPadraoDoUsuario,
  salvarPermissoesDoUsuario,
} from "./permissoesService";
import {
  alternarModulo,
  definirEscopoOS,
  desligar,
  diferenca,
  ligar,
  mesmoConjunto,
  rotulosDe,
  type EscopoOS,
} from "./permissoesLogica";
import type { Catalogo, ModuloCatalogo, PermissoesDoUsuario } from "./permissoesTypes";

/* ------------------------------------------------------------------ */

const ROTULO_TIPO: Record<string, string> = {
  GESTOR: "Gestor",
  TECNICO: "Técnico",
  OPERADOR: "Operador",
};

/* ------------------------------------------------------------------ */

type Props = {
  open: boolean;
  onClose: () => void;
  usuario: { id: number; nome: string; role: string } | null;
  onSalvo?: () => void;
};

/**
 * Permissões de UM funcionário. O que se salva aqui é um "ajuste individual" e tem
 * prioridade sobre as permissões definidas em grupo.
 */
export function PermissoesUsuarioModal({ open, onClose, usuario, onSalvo }: Props) {
  const [catalogo, setCatalogo] = useState<Catalogo | null>(null);
  const [dados, setDados] = useState<PermissoesDoUsuario | null>(null);
  const [selecionadas, setSelecionadas] = useState<Set<string>>(new Set());
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [busca, setBusca] = useState("");

  const usuarioId = usuario?.id;

  useEffect(() => {
    if (!open || usuarioId === undefined) return;

    let ativo = true;
    setCarregando(true);
    setErro(null);
    setDados(null);
    setBusca("");

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

  const original = useMemo(() => new Set(dados?.permissoes ?? []), [dados]);
  const concedivel = useMemo(() => new Set(dados?.concedivel ?? []), [dados]);
  const rotulos = useMemo(() => (catalogo ? rotulosDe(catalogo) : new Map<string, string>()), [catalogo]);

  const alterado = !mesmoConjunto(original, selecionadas);
  const totalAlteracoes = useMemo(() => {
    const d = diferenca(original, selecionadas);
    return d.adicionadas.length + d.removidas.length;
  }, [original, selecionadas]);

  // o que o tipo do funcionário não pode ter (ex.: gestor não assume/inicia/pausa O.S.) nem aparece
  const ocultas = useMemo(
    () => new Set<string>((usuario && catalogo?.vedadas?.[usuario.role as keyof NonNullable<Catalogo["vedadas"]>]) || []),
    [catalogo, usuario]
  );

  const totalPermissoes = (catalogo?.modulos.reduce((n, m) => n + m.acoes.length, 0) ?? 0) - ocultas.size;
  const semResultado = !!catalogo && busca.trim() !== "" && catalogo.modulos.every((m) => acoesVisiveis(m, busca) === null);

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

  /** Volta ao padrão do tipo e a seguir o grupo (o ajuste individual deixa de existir). */
  async function voltarAoPadrao() {
    if (usuarioId === undefined || !usuario) return;

    const tipo = ROTULO_TIPO[usuario.role] ?? usuario.role;
    const aviso =
      `Voltar ${usuario.nome} ao padrão de ${tipo}?\n\n` +
      "O ajuste individual será descartado e ele passa a receber também as alterações feitas em grupo.";

    if (!window.confirm(aviso)) return;

    try {
      setSalvando(true);
      await restaurarPadraoDoUsuario(usuarioId);
      notify.success("Voltou ao padrão do tipo");
      onSalvo?.();
      onClose();
    } catch (e) {
      notify.error(mensagemDe(e, "Não foi possível restaurar o padrão."));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(aberto) => !aberto && pedirFechar()}>
      <DialogContent className="flex max-h-[92vh] w-[96vw] flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-2xl">
        {/* CABEÇALHO */}
        <DialogHeader className="shrink-0 space-y-3 px-4 pb-4 pt-5 text-left sm:px-6 sm:pt-6">
          <div className="flex items-center gap-3 pr-8">
            <span
              aria-hidden="true"
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-sm font-semibold text-white shadow-sm"
            >
              {iniciais(usuario?.nome ?? "")}
            </span>

            <div className="min-w-0">
              <DialogTitle className="truncate text-left text-lg font-semibold sm:text-xl">
                {usuario?.nome}
              </DialogTitle>
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                {usuario && (
                  <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                    {ROTULO_TIPO[usuario.role] ?? usuario.role}
                  </span>
                )}
                {dados?.personalizado && (
                  <span
                    className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700"
                    title="Este funcionário tem um ajuste individual: as alterações em grupo não mexem nele."
                  >
                    Ajuste individual
                  </span>
                )}
              </div>
            </div>
          </div>

          <DialogDescription className="text-left text-xs text-slate-500 sm:text-sm">
            Abra cada tela para escolher o que este funcionário pode fazer. O que for salvo aqui tem prioridade
            sobre as permissões definidas em grupo.
          </DialogDescription>

          {catalogo && dados && (
            <div className="space-y-2.5">
              <div>
                <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                  <span>
                    <strong className="text-slate-800">{selecionadas.size}</strong> de {totalPermissoes} permissões
                    liberadas
                  </span>
                  {dados.concedivel.length < totalPermissoes && (
                    <span className="inline-flex items-center gap-1 text-amber-700">
                      <Lock size={12} aria-hidden="true" /> Só o que você possui
                    </span>
                  )}
                </div>
                <div
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={totalPermissoes}
                  aria-valuenow={selecionadas.size}
                  aria-label="Permissões liberadas"
                  className="h-1.5 overflow-hidden rounded-full bg-slate-100"
                >
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-[width] duration-300"
                    style={{ width: `${totalPermissoes ? (selecionadas.size / totalPermissoes) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div className="relative">
                <Search size={15} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar permissão (ex.: excluir, relatório)"
                  aria-label="Buscar permissão"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-9 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
                {busca && (
                  <button
                    type="button"
                    onClick={() => setBusca("")}
                    aria-label="Limpar busca"
                    className="absolute right-1.5 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          )}
        </DialogHeader>

        {/* CORPO */}
        <div className="min-h-0 flex-1 overflow-y-auto border-t bg-slate-50/60 px-4 py-4 sm:px-6">
          {carregando && <EsqueletoCartoes />}

          {!carregando && erro && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {erro}
            </div>
          )}

          {!carregando && !erro && catalogo && dados && (
            <div className="space-y-2.5">
              {catalogo.modulos.map((modulo) => (
                <CartaoModulo
                  key={modulo.chave}
                  modulo={modulo}
                  selecionadas={selecionadas}
                  concedivel={concedivel}
                  aoAlternarAcao={aoAlternarAcao}
                  aoAlternarModulo={aoAlternarModulo}
                  aoDefinirEscopo={aoDefinirEscopo}
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
          )}
        </div>

        {/* RODAPÉ */}
        <div className="flex shrink-0 flex-col-reverse gap-2 border-t bg-slate-50/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Button
            type="button"
            variant="outline"
            onClick={voltarAoPadrao}
            disabled={!dados || salvando}
            className="h-10 w-full sm:h-9 sm:w-auto"
          >
            <RotateCcw size={14} /> Voltar ao padrão do tipo
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

function EsqueletoCartoes() {
  return (
    <div className="space-y-2.5" aria-busy="true" aria-label="Carregando permissões">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-100" />
      ))}
    </div>
  );
}
