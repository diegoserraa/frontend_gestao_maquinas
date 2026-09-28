import { Toaster } from "@/components/ui/sonner";
import { useSidebar } from "@/hooks/useSidebar";
import Sidebar from "./Sidebar";
import SidebarMobile from "./SidebarMobile";
import Header from "./Header";
import { Outlet } from "react-router-dom";
import { useSincronizarPermissoes } from "@/modules/permissoes/usePermissoes";

export default function MainLayout() {
  const sidebar = useSidebar();

  // mantém menus e botões alinhados com o que o gestor liberou
  useSincronizarPermissoes();

  return (
    <div className="h-screen flex bg-slate-50 print:h-auto print:block">
      {/* 👇 COLOCA AQUI (global para todas as telas) */}
      <Toaster position="top-right" richColors />

      {/* menu, cabeçalho e a barra de rolagem da tela não fazem sentido no papel */}
      <div className="hidden md:flex print:hidden">
        <Sidebar
          isCollapsed={sidebar.isCollapsed}
          toggleCollapse={sidebar.toggleCollapse}
        />
      </div>

      <div className="print:hidden">
        <SidebarMobile
          isOpen={sidebar.isOpen}
          closeSidebar={sidebar.closeSidebar}
        />
      </div>

      <div className="flex flex-col flex-1 min-w-0 print:block">
        <div className="print:hidden">
          <Header openSidebar={sidebar.openSidebar} />
        </div>

        <main className="flex-1 p-6 overflow-auto print:p-0 print:overflow-visible">
          <Outlet />
        </main>
      </div>
    </div>
  );
}