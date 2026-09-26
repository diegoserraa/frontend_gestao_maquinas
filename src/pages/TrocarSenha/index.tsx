import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { KeyRound, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { notify } from "@/lib/notify";
import { CampoSenha, RegrasDaSenha } from "@/modules/conta/CampoSenha";
import { trocarSenha } from "@/modules/conta/contaService";
import { problemaNaNovaSenha } from "@/modules/conta/senhaLogica";
import { getToken, getUser, logout } from "@/modules/login/loginStorage";
import { consumirDestino } from "@/modules/login/destino";

/** Primeiro acesso (senha temporária): o sistema só libera depois de trocar a senha. */
export default function TrocarSenha() {
  const navigate = useNavigate();

  const [atual, setAtual] = useState("");
  const [nova, setNova] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  if (!getToken()) return <Navigate to="/login" replace />;

  const usuario = getUser();

  async function enviar(e: React.FormEvent) {
    e.preventDefault();

    const problema = problemaNaNovaSenha(nova, atual) ?? (nova !== confirmacao ? "A confirmação não confere com a nova senha" : null);
    if (problema) {
      setErro(problema);
      return;
    }

    try {
      setEnviando(true);
      setErro("");
      // guarda o token novo e tira a marca de "senha temporária" do usuário salvo
      await trocarSenha(atual, nova);

      notify.success("Senha alterada. Bem-vindo!");
      navigate(consumirDestino() ?? "/", { replace: true });
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível trocar a senha.");
    } finally {
      setEnviando(false);
    }
  }

  function sair() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #eff6ff 0%, #f8fafc 50%, #eff6ff 100%)" }}
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-blue-100/60" />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-blue-100/40" />
      </div>

      <div className="w-full max-w-sm relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-slate-700 flex items-center justify-center mb-4 shadow-md text-white">
            <KeyRound size={26} aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
            ZDM<span className="text-blue-600">SaaS</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">Gestão de manutenção industrial</p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-base font-semibold text-slate-800">Crie sua senha</h2>
            <p className="text-sm text-slate-400 mt-0.5">
              {usuario?.nome ? `${usuario.nome}, ` : ""}
              você entrou com uma senha temporária. Escolha uma senha só sua para continuar.
            </p>
          </div>

          <form onSubmit={enviar} className="space-y-4">
            <CampoSenha id="senha-atual" rotulo="Senha temporária" valor={atual} aoMudar={(v) => { setAtual(v); setErro(""); }} autoFocus autoComplete="current-password" />
            <CampoSenha id="senha-nova" rotulo="Nova senha" valor={nova} aoMudar={(v) => { setNova(v); setErro(""); }} autoComplete="new-password" maxLength={72} />
            <CampoSenha id="senha-confirmacao" rotulo="Repita a nova senha" valor={confirmacao} aoMudar={(v) => { setConfirmacao(v); setErro(""); }} autoComplete="new-password" maxLength={72} />

            <RegrasDaSenha nova={nova} atual={atual} confirmacao={confirmacao} />

            {erro && (
              <div role="alert" className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-50 border border-red-100">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                <p className="text-xs text-red-600">{erro}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={enviando}
              className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-sm active:scale-[0.99] transition-all disabled:opacity-60"
            >
              {enviando ? "Salvando..." : "Salvar e entrar"}
            </Button>
          </form>

          <button type="button" onClick={sair} className="mt-4 flex w-full items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-slate-600">
            <LogOut size={13} aria-hidden="true" /> Sair
          </button>
        </div>
      </div>
    </div>
  );
}
