import { mascaraCnpj, mascaraTelefone } from "./cnpj";
import { PLANOS, UFS, type FormEmpresa } from "./empresaForm";

type Props = {
  valores: FormEmpresa;
  onChange: (mudanca: Partial<FormEmpresa>) => void;
  desabilitado?: boolean;
  /** só no cadastro: o primeiro gestor da empresa */
  comGestor?: boolean;
  /** prefixo dos ids (evita ids repetidos na página) */
  prefixo?: string;
};

export const CAMPO =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-700 shadow-sm " +
  "placeholder:text-slate-400 transition-all hover:border-slate-300 focus:outline-none focus:ring-2 " +
  "focus:ring-blue-100 focus:border-blue-500 disabled:opacity-60";

const ROTULO = "text-xs font-medium uppercase tracking-wide text-slate-600";

function Campo({ id, rotulo, dica, children }: { id: string; rotulo: string; dica?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className={ROTULO}>
        {rotulo}
      </label>
      {children}
      {dica && <p className="text-[11px] text-slate-400">{dica}</p>}
    </div>
  );
}

function Secao({ titulo, subtitulo, children }: { titulo: string; subtitulo?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-slate-800">{titulo}</p>
      {subtitulo && <p className="text-xs text-slate-500">{subtitulo}</p>}
      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

const Larga = ({ children }: { children: React.ReactNode }) => <div className="sm:col-span-2">{children}</div>;

/** Campos de identificação e cobrança de uma empresa (cadastro e edição). Só dados do cliente, nada de operação. */
export function FormularioEmpresa({ valores, onChange, desabilitado = false, comGestor = false, prefixo = "emp" }: Props) {
  const id = (nome: string) => `${prefixo}-${nome}`;

  return (
    <div className="space-y-4">
      <Secao titulo="Empresa">
        <Larga>
          <Campo id={id("nome")} rotulo="Nome fantasia *">
            <input
              id={id("nome")}
              value={valores.nome}
              onChange={(e) => onChange({ nome: e.target.value })}
              placeholder="Ex.: Metalúrgica Silva"
              maxLength={120}
              autoFocus
              disabled={desabilitado}
              className={CAMPO}
            />
          </Campo>
        </Larga>

        <Larga>
          <Campo id={id("razao")} rotulo="Razão social">
            <input
              id={id("razao")}
              value={valores.razao_social}
              onChange={(e) => onChange({ razao_social: e.target.value })}
              placeholder="Como aparece na nota fiscal"
              maxLength={160}
              disabled={desabilitado}
              className={CAMPO}
            />
          </Campo>
        </Larga>

        <Campo id={id("cnpj")} rotulo={valores.sem_cnpj ? "CNPJ" : "CNPJ *"}>
          <input
            id={id("cnpj")}
            inputMode="numeric"
            value={valores.sem_cnpj ? "" : valores.cnpj}
            onChange={(e) => onChange({ cnpj: mascaraCnpj(e.target.value) })}
            placeholder={valores.sem_cnpj ? "Cliente sem CNPJ" : "00.000.000/0000-00"}
            maxLength={18}
            disabled={desabilitado || valores.sem_cnpj}
            className={CAMPO}
          />
        </Campo>

        <div className="flex items-end pb-2.5">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={valores.sem_cnpj}
              onChange={(e) => onChange({ sem_cnpj: e.target.checked, cnpj: e.target.checked ? "" : valores.cnpj })}
              disabled={desabilitado}
              className="size-4 rounded border-slate-300 accent-blue-600"
            />
            Cliente sem CNPJ
          </label>
        </div>

        <Campo id={id("cidade")} rotulo="Cidade">
          <input id={id("cidade")} value={valores.cidade} onChange={(e) => onChange({ cidade: e.target.value })} maxLength={80} disabled={desabilitado} className={CAMPO} />
        </Campo>

        <Campo id={id("uf")} rotulo="UF">
          <select id={id("uf")} value={valores.uf} onChange={(e) => onChange({ uf: e.target.value })} disabled={desabilitado} className={CAMPO}>
            <option value="">Selecione</option>
            {UFS.map((uf) => (
              <option key={uf} value={uf}>
                {uf}
              </option>
            ))}
          </select>
        </Campo>
      </Secao>

      <Secao titulo="Contato e cobrança" subtitulo="Para falar com o cliente e enviar a cobrança">
        <Campo id={id("telefone")} rotulo="Telefone / WhatsApp">
          <input
            id={id("telefone")}
            type="tel"
            inputMode="tel"
            value={valores.telefone}
            onChange={(e) => onChange({ telefone: mascaraTelefone(e.target.value) })}
            placeholder="(11) 91234-5678"
            maxLength={15}
            disabled={desabilitado}
            className={CAMPO}
          />
        </Campo>

        <Campo id={id("email-cobranca")} rotulo="E-mail de cobrança">
          <input
            id={id("email-cobranca")}
            type="email"
            value={valores.email_cobranca}
            onChange={(e) => onChange({ email_cobranca: e.target.value })}
            placeholder="financeiro@empresa.com"
            maxLength={254}
            disabled={desabilitado}
            className={CAMPO}
          />
        </Campo>
      </Secao>

      <Secao titulo="Contrato">
        <Campo id={id("plano")} rotulo="Plano">
          <select id={id("plano")} value={valores.plano} onChange={(e) => onChange({ plano: e.target.value })} disabled={desabilitado} className={CAMPO}>
            <option value="">Sem plano definido</option>
            {PLANOS.map((p) => (
              <option key={p.valor} value={p.valor}>
                {p.rotulo}
              </option>
            ))}
          </select>
        </Campo>

        <Campo id={id("inicio")} rotulo="Início do contrato">
          <input
            id={id("inicio")}
            type="date"
            value={valores.inicio_contrato}
            onChange={(e) => onChange({ inicio_contrato: e.target.value })}
            disabled={desabilitado}
            className={CAMPO}
          />
        </Campo>

        <Larga>
          <Campo
            id={id("obs")}
            rotulo={valores.sem_cnpj ? "Observações internas *" : "Observações internas"}
            dica={valores.sem_cnpj ? "Explique por que o cliente não tem CNPJ." : "Só você vê. O cliente não tem acesso a este texto."}
          >
            <textarea
              id={id("obs")}
              value={valores.observacoes}
              onChange={(e) => onChange({ observacoes: e.target.value })}
              maxLength={1000}
              rows={3}
              disabled={desabilitado}
              placeholder="Ex.: desconto do piloto, combinado de pagamento..."
              className="w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700 shadow-sm placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
            />
          </Campo>
        </Larga>
      </Secao>

      {comGestor && (
        <Secao titulo="Gestor da empresa" subtitulo="Quem vai administrar o sistema. Recebe uma senha temporária.">
          <Campo id={id("gestor-nome")} rotulo="Nome *">
            <input
              id={id("gestor-nome")}
              value={valores.gestor_nome}
              onChange={(e) => onChange({ gestor_nome: e.target.value })}
              placeholder="Nome de quem vai administrar"
              maxLength={150}
              disabled={desabilitado}
              className={CAMPO}
            />
          </Campo>

          <Campo id={id("gestor-telefone")} rotulo="Telefone / WhatsApp">
            <input
              id={id("gestor-telefone")}
              type="tel"
              inputMode="tel"
              value={valores.gestor_telefone}
              onChange={(e) => onChange({ gestor_telefone: mascaraTelefone(e.target.value) })}
              placeholder="(11) 91234-5678"
              maxLength={15}
              disabled={desabilitado}
              className={CAMPO}
            />
          </Campo>

          <Larga>
            <Campo id={id("gestor-email")} rotulo="E-mail (será o login) *">
              <input
                id={id("gestor-email")}
                type="email"
                value={valores.gestor_email}
                onChange={(e) => onChange({ gestor_email: e.target.value })}
                placeholder="gestor@empresa.com"
                maxLength={254}
                disabled={desabilitado}
                className={CAMPO}
              />
            </Campo>
          </Larga>
        </Secao>
      )}
    </div>
  );
}
