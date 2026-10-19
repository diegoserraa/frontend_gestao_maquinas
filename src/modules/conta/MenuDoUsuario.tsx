import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { KeyRound, LogOut } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getUser, logout } from "@/modules/login/loginStorage";

import { TrocarSenhaModal } from "./TrocarSenhaModal";

const ROTULO_DO_PERFIL: Record<string, string> = {
  ADMIN: "Administrador",
  GESTOR: "Gestor",
  TECNICO: "Técnico",
  OPERADOR: "Operador",
};

/** O círculo do usuário no topo: dados da conta, "Alterar senha" (abre um modal) e "Sair". */
export function MenuDoUsuario() {
  const navigate = useNavigate();
  const usuario = getUser();
  const inicial = usuario?.nome?.trim()?.[0]?.toUpperCase() ?? "?";

  const [trocandoSenha, setTrocandoSenha] = useState(false);

  function sair() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Menu da conta"
          className="
            w-9 h-9 rounded-full
            bg-gradient-to-br from-blue-500 to-blue-700
            flex items-center justify-center
            text-white text-sm font-medium
            shadow-md border border-white
            transition-transform hover:scale-105
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2
          "
        >
          {inicial}
        </DropdownMenuTrigger>

        {/* mesmo acabamento dos outros menus do sistema (Select, diálogos): fundo branco, borda e sombra */}
        <DropdownMenuContent
          align="end"
          sideOffset={10}
          className="w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 text-slate-700 shadow-xl ring-0"
        >
          <DropdownMenuLabel className="flex items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-white via-blue-50 to-blue-100 px-4 py-3.5">
            <span
              aria-hidden="true"
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-sm font-semibold text-white shadow-sm"
            >
              {inicial}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-slate-900">{usuario?.nome ?? "Usuário"}</span>
              <span className="block truncate text-xs font-normal text-slate-500">{usuario?.email}</span>
              {usuario?.role && (
                <span className="mt-1 inline-flex rounded-md bg-white/80 px-2 py-0.5 text-[11px] font-medium text-blue-700 ring-1 ring-blue-100">
                  {ROTULO_DO_PERFIL[usuario.role] ?? usuario.role}
                </span>
              )}
            </span>
          </DropdownMenuLabel>

          <div className="p-1.5">
            <DropdownMenuItem
              onSelect={() => setTrocandoSenha(true)}
              className="cursor-pointer gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 focus:bg-blue-50 focus:text-blue-700 [&_svg]:text-slate-400 focus:[&_svg]:text-blue-600"
            >
              <KeyRound size={16} /> Alterar senha
            </DropdownMenuItem>

            <DropdownMenuSeparator className="mx-1 my-1 bg-slate-100" />

            <DropdownMenuItem
              onSelect={sair}
              className="cursor-pointer gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 focus:bg-red-50 focus:text-red-600 [&_svg]:text-slate-400 focus:[&_svg]:text-red-500"
            >
              <LogOut size={16} /> Sair
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <TrocarSenhaModal open={trocandoSenha} onClose={() => setTrocandoSenha(false)} />
    </>
  );
}
