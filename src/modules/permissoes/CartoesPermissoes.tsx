import { useState } from "react";
import {
  Activity,
  Building2,
  ChevronDown,
  ClipboardList,
  Cpu,
  FileBarChart,
  Handshake,
  LayoutDashboard,
  Lock,
  Paperclip,
  Users,
  type LucideIcon,
} from "lucide-react";

import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

import { acoesVisiveis } from "./permissoesBusca";
import {
  contarDoModulo,
  escopoDeOS,
  OS_VER_PROPRIAS,
  OS_VER_TODAS,
  type EscopoOS,
} from "./permissoesLogica";
import type { ModuloCatalogo } from "./permissoesTypes";

/**
 * Módulos de permissões em "sanfona": cada módulo abre e fecha, então a tela nunca despeja as 39
 * permissões de uma vez. Usado pelo painel de UM funcionário e pelo de GRUPO.
 */

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

const iconeDo = (chave: string): LucideIcon => ICONES[chave] ?? ClipboardList;

const ROTULO_ESCOPO: Record<EscopoOS, string> = {
  nenhuma: "Nenhuma O.S.",
  proprias: "Só as dele",
  todas: "Todas as O.S.",
};

/* ------------------------------------------------------------------ */
/*  Peças compartilhadas                                               */
/* ------------------------------------------------------------------ */

function IconeDoModulo({ Icone, ativo }: { Icone: LucideIcon; ativo: boolean }) {
  return (
    <div
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors",
        ativo ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-400"
      )}
    >
      <Icone size={19} aria-hidden="true" />
    </div>
  );
}

/** Painel que desliza para abrir/fechar (sem JS de animação; conteúdo inerte enquanto fechado). */
function Painel({ aberto, id, children }: { aberto: boolean; id: string; children: React.ReactNode }) {
  return (
    <div
      id={id}
      inert={!aberto}
      className={cn(
        "grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none",
        aberto ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
      )}
    >
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}

function Chip({ children, tom }: { children: React.ReactNode; tom: "azul" | "cinza" | "ambar" }) {
  return (
    <span
      className={cn(
        "shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium",
        tom === "azul" && "bg-blue-50 text-blue-700",
        tom === "cinza" && "bg-slate-100 text-slate-500",
        tom === "ambar" && "bg-amber-50 text-amber-700"
      )}
    >
      {children}
    </span>
  );
}

function CabecalhoDoModulo({
  chave,
  Icone,
  titulo,
  descricao,
  chip,
  aberto,
  ativo,
  aoAlternar,
  direita,
}: {
  chave: string;
  Icone: LucideIcon;
  titulo: string;
  descricao: string;
  chip: React.ReactNode;
  aberto: boolean;
  ativo: boolean;
  aoAlternar: () => void;
  direita?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1 pr-3 sm:pr-3.5">
      <button
        type="button"
        id={`mod-${chave}`}
        aria-expanded={aberto}
        aria-controls={`painel-${chave}`}
        onClick={aoAlternar}
        className="flex min-h-16 min-w-0 flex-1 items-center gap-3 rounded-2xl p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 sm:p-3.5"
      >
        <IconeDoModulo Icone={Icone} ativo={ativo} />

        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold text-slate-900">{titulo}</span>
            {chip}
          </span>
          <span className="block truncate text-xs text-slate-500">{descricao}</span>
        </span>

        <ChevronDown
          size={18}
          aria-hidden="true"
          className={cn("shrink-0 text-slate-400 transition-transform duration-200", aberto && "rotate-180")}
        />
      </button>

      {direita}
    </div>
  );
}

/* ================================================================== */
/*  PAINEL INDIVIDUAL: o interruptor liga a tela; abrir mostra o resto */
/* ================================================================== */

type CartaoProps = {
  modulo: ModuloCatalogo;
  selecionadas: ReadonlySet<string>;
  concedivel: ReadonlySet<string>;
  aoAlternarAcao: (permissao: string, valor: boolean) => void;
  aoAlternarModulo: (modulo: ModuloCatalogo, valor: boolean) => void;
  aoDefinirEscopo: (escopo: EscopoOS) => void;
  /** texto da busca; quando preenchido os módulos com resultado abrem sozinhos */
  busca?: string;
  /** permissões que este tipo de funcionário não pode ter: nem aparecem */
  ocultas?: ReadonlySet<string>;
};

export function CartaoModulo({
  modulo,
  selecionadas,
  concedivel,
  aoAlternarAcao,
  aoAlternarModulo,
  aoDefinirEscopo,
  busca = "",
  ocultas,
}: CartaoProps) {
  const [aberto, setAberto] = useState(false);

  const visiveis = acoesVisiveis(modulo, busca)?.filter((a) => !ocultas?.has(a.permissao)) ?? null;
  if (!visiveis) return null;

  const buscando = busca.trim() !== "";
  const expandido = buscando || aberto;

  const Icone = iconeDo(modulo.chave);
  const ehOS = modulo.chave === "os";

  const escopo = ehOS ? escopoDeOS(selecionadas) : null;
  const acessoLigado = ehOS ? escopo !== "nenhuma" : selecionadas.has(modulo.acesso);

  // as ações que aparecem como linhas (a de "acesso" é o interruptor do cabeçalho)
  const ehVerOS = (p: string) => ehOS && (p === OS_VER_TODAS || p === OS_VER_PROPRIAS);
  const linhas = visiveis.filter((a) => a.permissao !== modulo.acesso && !ehVerOS(a.permissao));
  const mostraEscopo = ehOS && (visiveis.length === modulo.acoes.length || visiveis.some((a) => ehVerOS(a.permissao)));

  const { ligadas, total: totalBruto } = contarDoModulo(selecionadas, modulo);
  const total = totalBruto - modulo.acoes.filter((a) => ocultas?.has(a.permissao)).length;
  const podeMudarAcesso = ehOS
    ? concedivel.has(OS_VER_TODAS) || concedivel.has(OS_VER_PROPRIAS)
    : concedivel.has(modulo.acesso);

  const chip = ehOS ? (
    <Chip tom={acessoLigado ? "azul" : "cinza"}>{ROTULO_ESCOPO[escopo as EscopoOS]}</Chip>
  ) : acessoLigado ? (
    <Chip tom="azul">{total > 1 ? `${ligadas} de ${total}` : "Liberado"}</Chip>
  ) : (
    <Chip tom="cinza">Sem acesso</Chip>
  );

  return (
    <section
      aria-labelledby={`mod-${modulo.chave}`}
      className={cn(
        "rounded-2xl border bg-white shadow-sm transition-colors",
        acessoLigado ? "border-blue-200" : "border-slate-200"
      )}
    >
      <CabecalhoDoModulo
        chave={modulo.chave}
        Icone={Icone}
        titulo={modulo.rotulo}
        descricao={modulo.descricao}
        chip={chip}
        aberto={expandido}
        ativo={acessoLigado}
        aoAlternar={() => setAberto((a) => !a)}
        direita={
          !ehOS && (
            <div className="flex shrink-0 items-center gap-2 pl-1 pr-1">
              {!podeMudarAcesso && <Lock size={13} className="text-slate-400" aria-hidden="true" />}
              <Switch
                id={`sw-modulo-${modulo.chave}`}
                checked={acessoLigado}
                onCheckedChange={(v) => {
                  aoAlternarModulo(modulo, v);
                  if (v) setAberto(true); // ligou a tela: já mostra o que dá pra ajustar dentro dela
                }}
                disabled={!podeMudarAcesso}
                label={`Acesso à tela ${modulo.rotulo}`}
              />
            </div>
          )
        }
      />

      <Painel aberto={expandido} id={`painel-${modulo.chave}`}>
        {/* O.S.: o "ver" tem três níveis */}
        {mostraEscopo && (
          <div className="border-t border-slate-100 px-3 py-3 sm:px-4">
            <p className="mb-1.5 text-xs font-medium text-slate-600">Quais O.S. este funcionário enxerga</p>
            <div role="radiogroup" aria-label="O.S. visíveis" className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1">
              {(
                [
                  ["nenhuma", "Nenhuma"],
                  ["proprias", "Só as dele"],
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
                      "min-h-10 rounded-lg px-2 py-1.5 text-xs font-medium transition",
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
            {linhas.map((acao) => (
              <LinhaDePermissao
                key={acao.permissao}
                id={acao.permissao}
                rotulo={acao.rotulo}
                descricao={acao.descricao}
                ligado={selecionadas.has(acao.permissao)}
                bloqueada={!concedivel.has(acao.permissao)}
                rotuloAcessivel={`${modulo.rotulo}: ${acao.rotulo}`}
                aoMudar={(v) => aoAlternarAcao(acao.permissao, v)}
              />
            ))}
          </ul>
        )}

        {!acessoLigado && !mostraEscopo && (
          <p className="border-t border-slate-100 px-3 py-3 text-xs text-slate-500 sm:px-4">
            Sem acesso a esta tela. Ligue o interruptor para liberar e ajustar o que ele pode fazer aqui.
          </p>
        )}
      </Painel>
    </section>
  );
}

/* ================================================================== */
/*  PAINEL DE GRUPO: cada linha é uma permissão a dar/retirar          */
/* ================================================================== */

type CartaoListaProps = {
  modulo: ModuloCatalogo;
  escolhidas: ReadonlySet<string>;
  /** o que quem está aplicando pode dar/retirar (o que ele mesmo possui) */
  concedivel: ReadonlySet<string>;
  aoAlternar: (permissao: string, valor: boolean) => void;
  busca?: string;
  ocultas?: ReadonlySet<string>;
};

export function CartaoModuloLista({ modulo, escolhidas, concedivel, aoAlternar, busca = "", ocultas }: CartaoListaProps) {
  const [aberto, setAberto] = useState(false);

  const visiveis = acoesVisiveis(modulo, busca)?.filter((a) => !ocultas?.has(a.permissao)) ?? null;
  if (!visiveis || visiveis.length === 0) return null;

  const expandido = busca.trim() !== "" || aberto;
  const disponiveis = modulo.acoes.filter((a) => !ocultas?.has(a.permissao));
  const marcadas = disponiveis.filter((a) => escolhidas.has(a.permissao)).length;

  return (
    <section
      aria-labelledby={`mod-grupo-${modulo.chave}`}
      className={cn(
        "rounded-2xl border bg-white shadow-sm transition-colors",
        marcadas > 0 ? "border-blue-200" : "border-slate-200"
      )}
    >
      <CabecalhoDoModulo
        chave={`grupo-${modulo.chave}`}
        Icone={iconeDo(modulo.chave)}
        titulo={modulo.rotulo}
        descricao={modulo.descricao}
        chip={
          marcadas > 0 ? (
            <Chip tom="azul">{marcadas === 1 ? "1 escolhida" : `${marcadas} escolhidas`}</Chip>
          ) : (
            <Chip tom="cinza">{disponiveis.length === 1 ? "1 opção" : `${disponiveis.length} opções`}</Chip>
          )
        }
        aberto={expandido}
        ativo={marcadas > 0}
        aoAlternar={() => setAberto((a) => !a)}
      />

      <Painel aberto={expandido} id={`painel-grupo-${modulo.chave}`}>
        <ul className="divide-y divide-slate-100 border-t border-slate-100 px-3 sm:px-4">
          {visiveis.map((acao) => (
            <LinhaDePermissao
              key={acao.permissao}
              id={`grupo-${acao.permissao}`}
              rotulo={acao.rotulo}
              descricao={acao.descricao}
              ligado={escolhidas.has(acao.permissao)}
              bloqueada={!concedivel.has(acao.permissao)}
              rotuloAcessivel={`${modulo.rotulo}: ${acao.rotulo}`}
              aoMudar={(v) => aoAlternar(acao.permissao, v)}
            />
          ))}
        </ul>
      </Painel>
    </section>
  );
}

/* ------------------------------------------------------------------ */

type LinhaProps = {
  id: string;
  rotulo: string;
  descricao: string;
  ligado: boolean;
  bloqueada: boolean;
  rotuloAcessivel: string;
  aoMudar: (valor: boolean) => void;
};

/** Uma permissão: texto + interruptor. O texto também aciona o interruptor (alvo de toque grande no celular). */
function LinhaDePermissao({ id, rotulo, descricao, ligado, bloqueada, rotuloAcessivel, aoMudar }: LinhaProps) {
  return (
    <li className="flex min-h-12 items-center justify-between gap-3 py-2.5">
      <label
        htmlFor={`sw-${id}`}
        className={cn("min-w-0 flex-1 py-0.5", bloqueada ? "cursor-not-allowed" : "cursor-pointer")}
      >
        <span className="flex items-center gap-1.5 text-sm font-medium text-slate-800">
          {rotulo}
          {bloqueada && <Lock size={12} className="text-slate-400" aria-label="Você não possui esta permissão" />}
        </span>
        <span className="block text-xs text-slate-500">{descricao}</span>
      </label>

      <Switch id={`sw-${id}`} checked={ligado} onCheckedChange={aoMudar} disabled={bloqueada} label={rotuloAcessivel} />
    </li>
  );
}
