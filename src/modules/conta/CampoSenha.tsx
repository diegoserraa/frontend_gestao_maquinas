import { useState } from "react";
import { Check, Eye, EyeOff, Lock } from "lucide-react";

import { Input } from "@/components/ui/input";

import { forcaDaSenha, regrasDaSenha } from "./senhaLogica";

const CAMPO =
  "h-11 pl-10 pr-10 rounded-xl border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 shadow-sm " +
  "focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all hover:border-slate-300";

type CampoProps = {
  id: string;
  rotulo: string;
  valor: string;
  aoMudar: (valor: string) => void;
  autoFocus?: boolean;
  disabled?: boolean;
  autoComplete: "current-password" | "new-password";
  maxLength?: number;
};

/** Campo de senha com o botão de mostrar/ocultar. */
export function CampoSenha({ id, rotulo, valor, aoMudar, autoFocus, disabled, autoComplete, maxLength = 200 }: CampoProps) {
  const [mostrar, setMostrar] = useState(false);

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-xs font-medium uppercase tracking-wide text-slate-600">
        {rotulo}
      </label>
      <div className="relative">
        <Lock size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input
          id={id}
          type={mostrar ? "text" : "password"}
          value={valor}
          onChange={(e) => aoMudar(e.target.value)}
          autoFocus={autoFocus}
          disabled={disabled}
          autoComplete={autoComplete}
          maxLength={maxLength}
          className={CAMPO}
        />
        <button
          type="button"
          onClick={() => setMostrar((m) => !m)}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 transition-colors hover:text-slate-600"
          tabIndex={-1}
          aria-label={mostrar ? `Ocultar ${rotulo.toLowerCase()}` : `Mostrar ${rotulo.toLowerCase()}`}
        >
          {mostrar ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  );
}

const COR_DA_FORCA = ["bg-slate-200", "bg-red-400", "bg-amber-400", "bg-emerald-500"];

/** Indicador de força + lista de regras, atualizados enquanto a pessoa digita. */
export function RegrasDaSenha({ nova, atual, confirmacao }: { nova: string; atual: string; confirmacao: string }) {
  const regras = regrasDaSenha(nova, atual, confirmacao);
  const forca = forcaDaSenha(nova);

  return (
    <div className="space-y-2.5 rounded-xl bg-slate-50 px-3 py-3">
      <div className="flex items-center gap-2" aria-live="polite">
        <div className="flex flex-1 gap-1" aria-hidden="true">
          {[1, 2, 3].map((n) => (
            <span key={n} className={`h-1.5 flex-1 rounded-full transition-colors ${forca.nivel >= n ? COR_DA_FORCA[forca.nivel] : "bg-slate-200"}`} />
          ))}
        </div>
        <span className="w-12 text-right text-[11px] font-medium text-slate-500">{forca.rotulo || "Força"}</span>
      </div>

      <ul className="space-y-1" aria-label="Regras da senha">
        {regras.map((r) => (
          <li key={r.chave} className={`flex items-center gap-1.5 text-xs ${r.ok ? "text-emerald-600" : "text-slate-400"}`}>
            <Check size={12} aria-hidden="true" className={r.ok ? "" : "opacity-30"} />
            {r.texto}
          </li>
        ))}
      </ul>
    </div>
  );
}
