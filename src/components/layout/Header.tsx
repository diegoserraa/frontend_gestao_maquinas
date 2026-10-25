import { Menu } from "lucide-react";

import { NotificationBell } from "@/modules/notificacao/notificacaoBell";
import { getUser } from "@/modules/login/loginStorage";
import { MenuDoUsuario } from "@/modules/conta/MenuDoUsuario";

interface Props {
  openSidebar: () => void;
}

// o cabeçalho mostrava "Dashboard" fixo em toda tela — tentamos trocar pelo
// título da própria rota, mas aí ficava repetindo o que a tela já escreve
// no corpo (ex.: "Máquinas" duas vezes). Uma saudação nunca duplica nada.
function saudacao(): string {
  const hora = new Date().getHours();
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

export default function Header({ openSidebar }: Props) {
  const usuario = getUser();
  const primeiroNome = usuario?.nome?.trim().split(" ")[0];

  return (
    <header
      className="
        h-14 md:h-16
        border-b border-blue-100
        bg-gradient-to-r from-white via-blue-50 to-blue-100
        flex items-center justify-between
        px-3 sm:px-4 md:px-6
        shadow-sm
      "
    >
      {/* LEFT */}
      <div className="flex items-center gap-3">
        <button
          onClick={openSidebar}
          className="
            md:hidden
            w-9 h-9
            flex items-center justify-center
            rounded-lg hover:bg-blue-100
          "
        >
          <Menu size={18} className="text-slate-700" />
        </button>

        <div className="flex flex-col leading-tight">
          <h1 className="text-sm md:text-base font-semibold text-slate-800">
            {saudacao()}{primeiroNome ? `, ${primeiroNome}` : ""}
          </h1>
          <span className="text-[11px] text-slate-500 hidden sm:block">
            Bem-vindo(a) de volta
          </span>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-3">
        {/* o administrador não tem notificações de manutenção */}
        {usuario?.role !== "ADMIN" && <NotificationBell />}

        {/* AVATAR: dados da conta, alterar senha e sair */}
        <MenuDoUsuario />
      </div>
    </header>
  );
}
