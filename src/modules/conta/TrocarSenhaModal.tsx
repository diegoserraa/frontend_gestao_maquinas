import { useEffect, useState } from "react";
import { KeyRound, Loader2, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { notify } from "@/lib/notify";

import { CampoSenha, RegrasDaSenha } from "./CampoSenha";
import { trocarSenha } from "./contaService";
import { problemaNaNovaSenha } from "./senhaLogica";

type Props = {
  open: boolean;
  onClose: () => void;
};

/** "Alterar minha senha": qualquer perfil, dentro do sistema. Pede a senha atual e encerra as outras sessões. */
export function TrocarSenhaModal({ open, onClose }: Props) {
  const [atual, setAtual] = useState("");
  const [nova, setNova] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // nunca deixa senha digitada guardada depois de fechar
  useEffect(() => {
    if (open) return;
    setAtual("");
    setNova("");
    setConfirmacao("");
    setErro(null);
    setEnviando(false);
  }, [open]);

  const mudar = (definir: (v: string) => void) => (v: string) => {
    definir(v);
    setErro(null);
  };

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (enviando) return;

    const problema = !atual
      ? "Informe a sua senha atual"
      : problemaNaNovaSenha(nova, atual) ?? (nova !== confirmacao ? "A confirmação não confere com a nova senha" : null);

    if (problema) {
      setErro(problema);
      return;
    }

    try {
      setEnviando(true);
      setErro(null);
      await trocarSenha(atual, nova);

      notify.success("Senha alterada. Os outros aparelhos foram desconectados.");
      onClose();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível alterar a senha.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(aberto) => !aberto && !enviando && onClose()}>
      <DialogContent className="flex max-h-[92vh] w-[96vw] flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-md">
        <DialogHeader className="shrink-0 px-4 pb-4 pt-5 text-left sm:px-6 sm:pt-6">
          <div className="flex items-center gap-3 pr-8">
            <span
              aria-hidden="true"
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm"
            >
              <KeyRound size={20} />
            </span>
            <div className="min-w-0">
              <DialogTitle className="text-left text-lg font-semibold sm:text-xl">Alterar senha</DialogTitle>
              <DialogDescription className="text-left text-xs text-slate-500 sm:text-sm">
                Escolha uma senha nova só sua.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={enviar} noValidate className="flex min-h-0 flex-1 flex-col border-t bg-slate-50/60">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6">
            <CampoSenha id="conta-senha-atual" rotulo="Senha atual" valor={atual} aoMudar={mudar(setAtual)} autoFocus disabled={enviando} autoComplete="current-password" />
            <CampoSenha id="conta-senha-nova" rotulo="Nova senha" valor={nova} aoMudar={mudar(setNova)} disabled={enviando} autoComplete="new-password" maxLength={72} />
            <CampoSenha id="conta-senha-confirmacao" rotulo="Repita a nova senha" valor={confirmacao} aoMudar={mudar(setConfirmacao)} disabled={enviando} autoComplete="new-password" maxLength={72} />

            <RegrasDaSenha nova={nova} atual={atual} confirmacao={confirmacao} />

            <p className="flex items-start gap-2 text-xs text-slate-500">
              <ShieldCheck size={14} aria-hidden="true" className="mt-0.5 shrink-0 text-slate-400" />
              Por segurança, ao alterar a senha você continua aqui, mas os outros aparelhos em que sua conta estiver aberta serão desconectados.
            </p>

            {erro && (
              <div role="alert" className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5">
                <span className="size-1.5 shrink-0 rounded-full bg-red-400" />
                <p className="text-xs text-red-600">{erro}</p>
              </div>
            )}
          </div>

          <div className="flex shrink-0 flex-col-reverse gap-2 border-t bg-white px-4 py-3 sm:flex-row sm:justify-end sm:px-6">
            <Button type="button" variant="outline" onClick={onClose} disabled={enviando} className="h-10 w-full sm:h-9 sm:w-auto">
              Cancelar
            </Button>
            <Button type="submit" disabled={enviando} className="h-10 w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white sm:h-9 sm:w-auto">
              {enviando && <Loader2 size={14} className="animate-spin" />}
              Alterar senha
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
