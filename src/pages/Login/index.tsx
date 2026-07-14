import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, LogIn, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { login } from "@/modules/login/loginService";
import { saveAuth } from "@/modules/login/loginStorage";

function GearIcon({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSenha, setShowSenha] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      setLoading(true);
      const data = await login({ email, senha });
      saveAuth(data.token, data.user);
      navigate("/");
    } catch {
      setError("E-mail ou senha inválidos. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #eff6ff 0%, #f8fafc 50%, #eff6ff 100%)" }}
    >
      {/* FUNDO */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-blue-100/60" />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-blue-100/40" />
        <div className="absolute top-1/2 left-1/4 w-48 h-48 rounded-full bg-slate-100/80" />
      </div>

      <div className="w-full max-w-sm relative z-10">

        {/* LOGO */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-slate-700 flex items-center justify-center mb-4 shadow-md">
            <GearIcon size={28} />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
            ZDM<span className="text-blue-600">SaaS</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Gestão de manutenção industrial
          </p>
        </div>

        {/* FORM CARD */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8">

          <div className="mb-6">
            <h2 className="text-base font-semibold text-slate-800">Acesse sua conta</h2>
            <p className="text-sm text-slate-400 mt-0.5">Entre com suas credenciais</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* EMAIL */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                E-mail
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <Input
                  type="email"
                  placeholder="seu@empresa.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  className="h-11 pl-10 rounded-xl border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 shadow-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all hover:border-slate-300"
                  required
                />
              </div>
            </div>

            {/* SENHA */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                Senha
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <Input
                  type={showSenha ? "text" : "password"}
                  placeholder="••••••••"
                  value={senha}
                  onChange={(e) => { setSenha(e.target.value); setError(""); }}
                  className="h-11 pl-10 pr-10 rounded-xl border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 shadow-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all hover:border-slate-300"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowSenha((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-0.5"
                  tabIndex={-1}
                  aria-label={showSenha ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showSenha ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* ERRO */}
            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-50 border border-red-100">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}

            {/* BOTÃO */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 mt-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-sm active:scale-[0.99] transition-all disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Validando acesso...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <LogIn size={15} />
                  Entrar no sistema
                </span>
              )}
            </Button>
          </form>
        </div>

        {/* RODAPÉ */}
        <p className="text-center text-xs text-slate-400 mt-6">
          ZDM SaaS • v1.0 • Gestão industrial inteligente
        </p>
      </div>
    </div>
  );
}