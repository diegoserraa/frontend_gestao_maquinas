import { Menu } from "lucide-react";
import { useLocation } from "react-router-dom";

import { NotificationBell } from "@/modules/notificacao/notificacaoBell";
import { getUser } from "@/modules/login/loginStorage";
import { MenuDoUsuario } from "@/modules/conta/MenuDoUsuario";

interface Props {
  openSidebar: () => void;
}

// título do cabeçalho ficava travado em "Dashboard" em toda tela do sistema
// (Máquinas, Monitoramento, O.S. ...) — cada rota tem o seu, igual ao que a
// própria tela já mostra no corpo, pra não ficarem dizendo coisas diferentes
function tituloDaPagina(pathname: string): { titulo: string; subtitulo: string } {
  if (pathname.startsWith("/machines/")) return { titulo: "Máquina", subtitulo: "Detalhes do ativo" };
  if (pathname.startsWith("/machines")) return { titulo: "Máquinas", subtitulo: "Gestão de ativos industriais" };
  if (pathname.startsWith("/monitoring")) return { titulo: "Monitoramento", subtitulo: "Máquinas em tempo real" };
  if (pathname.startsWith("/ordens-servico/")) return { titulo: "Ordem de Serviço", subtitulo: "Detalhes do atendimento" };
  if (pathname.startsWith("/sector")) return { titulo: "Setores", subtitulo: "Organização da planta" };
  if (pathname.startsWith("/partner")) return { titulo: "Parceiros", subtitulo: "Prestadores externos" };
  if (pathname.startsWith("/user")) return { titulo: "Usuários", subtitulo: "Equipe e acessos" };
  if (pathname.startsWith("/admin/empresas")) return { titulo: "Empresas", subtitulo: "Painel do administrador" };
  if (pathname.startsWith("/reports")) return { titulo: "Relatórios", subtitulo: "Indicadores e exportação" };
  return { titulo: "Dashboard", subtitulo: "Visão geral" };
}

export default function Header({ openSidebar }: Props) {
  const usuario = getUser();
  const { pathname } = useLocation();
  const { titulo, subtitulo } = tituloDaPagina(pathname);

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
            {titulo}
          </h1>
          <span className="text-[11px] text-slate-500 hidden sm:block">
            {subtitulo}
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
