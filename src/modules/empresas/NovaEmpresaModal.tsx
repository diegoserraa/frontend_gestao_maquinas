import { useEffect, useState } from "react";
import { Building2, Check, Copy, KeyRound, Loader2, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { notify } from "@/lib/notify";

import { FORM_VAZIO, paraNovaEmpresa, problemaNoFormulario, type FormEmpresa } from "./empresaForm";
import { textoDoAcesso } from "./empresasLogica";
import { criarEmpresa } from "./empresasService";
import type { EmpresaCriada } from "./empresasTypes";
import { FormularioEmpresa } from "./FormularioEmpresa";

type Props = {
  open: boolean;
  onClose: () => void;
  /** depois de criar (a lista recarrega) */
  aoCriar: () => void;
};

async function copiar(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    // navegador sem permissão de área de transferência: o usuário ainda pode selecionar e copiar à mão
    return false;
  }
}

/** Cadastro de empresa + primeiro gestor. A senha temporária aparece UMA vez, na tela de sucesso. */
export function NovaEmpresaModal({ open, onClose, aoCriar }: Props) {
  const [form, setForm] = useState<FormEmpresa>(FORM_VAZIO);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [criada, setCriada] = useState<EmpresaCriada | null>(null);
  const [copiado, setCopiado] = useState<"senha" | "tudo" | null>(null);

  useEffect(() => {
    if (open) return;
    setForm(FORM_VAZIO);
    setErro(null);
    setCriada(null);
    setCopiado(null);
    setEnviando(false);
  }, [open]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();

    const problema = problemaNoFormulario(form, true);
    if (problema) {
      setErro(problema);
      return;
    }

    try {
      setEnviando(true);
      setErro(null);
      setCriada(await criarEmpresa(paraNovaEmpresa(form)));
      aoCriar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível cadastrar a empresa.");
    } finally {
      setEnviando(false);
    }
  }

  async function copiarTexto(tipo: "senha" | "tudo") {
    if (!criada) return;

    const texto =
      tipo === "senha"
        ? criada.senha_temporaria
        : textoDoAcesso({
            empresa: criada.empresa.nome,
            email: criada.gestor.email,
            senha: criada.senha_temporaria,
            url: window.location.origin,
          });

    if (await copiar(texto)) {
      setCopiado(tipo);
      window.setTimeout(() => setCopiado(null), 2500);
    } else {
      notify.error("Não foi possível copiar. Selecione o texto e copie manualmente.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(aberto) => !aberto && !enviando && onClose()}>
      <DialogContent className="flex max-h-[92vh] w-[96vw] flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-2xl">
        <DialogHeader className="shrink-0 px-4 pb-4 pt-5 text-left sm:px-6 sm:pt-6">
          <div className="flex items-center gap-3 pr-8">
            <span
              aria-hidden="true"
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm"
            >
              {criada ? <Check size={20} /> : <Building2 size={20} />}
            </span>
            <div className="min-w-0">
              <DialogTitle className="text-left text-lg font-semibold sm:text-xl">
                {criada ? "Empresa cadastrada" : "Nova empresa"}
              </DialogTitle>
              <DialogDescription className="text-left text-xs text-slate-500 sm:text-sm">
                {criada
                  ? "Envie o acesso abaixo ao gestor."
                  : "Dados do cliente e o primeiro gestor dele. Os campos com * são obrigatórios."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {!criada ? (
          <form onSubmit={enviar} noValidate className="flex min-h-0 flex-1 flex-col border-t bg-slate-50/60">
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
              <FormularioEmpresa
                valores={form}
                onChange={(m) => {
                  setForm((f) => ({ ...f, ...m }));
                  setErro(null);
                }}
                desabilitado={enviando}
                comGestor
                prefixo="nova"
              />

              {erro && (
                <div role="alert" className="mt-4 flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5">
                  <span className="size-1.5 shrink-0 rounded-full bg-red-400" />
                  <p className="text-xs text-red-600">{erro}</p>
                </div>
              )}
            </div>

            <div className="flex shrink-0 flex-col-reverse gap-2 border-t bg-white px-4 py-3 sm:flex-row sm:justify-end sm:px-6">
              <Button type="button" variant="outline" onClick={onClose} disabled={enviando} className="h-10 w-full sm:h-9 sm:w-auto">
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={enviando}
                className="h-10 w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white sm:h-9 sm:w-auto"
              >
                {enviando && <Loader2 size={14} className="animate-spin" />}
                Cadastrar empresa
              </Button>
            </div>
          </form>
        ) : (
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto border-t bg-slate-50/60 px-4 py-5 sm:px-6">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-slate-400">Empresa</p>
              <p className="text-sm font-semibold text-slate-900">{criada.empresa.nome}</p>

              <p className="mt-3 text-xs uppercase tracking-wide text-slate-400">E-mail de acesso</p>
              <p className="break-all text-sm text-slate-800">{criada.gestor.email}</p>

              <p className="mt-3 flex items-center gap-1.5 text-xs uppercase tracking-wide text-slate-400">
                <KeyRound size={12} aria-hidden="true" /> Senha temporária
              </p>
              <div className="mt-1 flex items-center gap-2">
                <code
                  data-senha-temporaria
                  className="flex-1 select-all rounded-lg bg-slate-100 px-3 py-2 font-mono text-base font-semibold tracking-wider text-slate-900"
                >
                  {criada.senha_temporaria}
                </code>
                <button
                  type="button"
                  onClick={() => copiarTexto("senha")}
                  aria-label="Copiar senha temporária"
                  className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  {copiado === "senha" ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                </button>
              </div>
            </div>

            <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 sm:text-sm">
              <ShieldAlert size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              <p>
                Esta senha aparece <strong>somente agora</strong>: depois de fechar esta janela ela não pode mais ser vista. O gestor
                precisará trocá-la no primeiro acesso.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => copiarTexto("tudo")} className="h-10 w-full sm:h-9 sm:w-auto">
                {copiado === "tudo" ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                {copiado === "tudo" ? "Copiado" : "Copiar acesso completo"}
              </Button>
              <Button type="button" onClick={onClose} className="h-10 w-full bg-blue-600 text-white hover:bg-blue-700 sm:h-9 sm:w-auto">
                Concluir
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
