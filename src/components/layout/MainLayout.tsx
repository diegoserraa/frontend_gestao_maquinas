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
    <div className="h-screen flex bg-slate-50">
      {/* 👇 COLOCA AQUI (global para todas as telas) */}
      <Toaster position="top-right" richColors />

      <div className="hidden md:flex">
        <Sidebar
          isCollapsed={sidebar.isCollapsed}
          toggleCollapse={sidebar.toggleCollapse}
        />
      </div>

      <SidebarMobile
        isOpen={sidebar.isOpen}
        closeSidebar={sidebar.closeSidebar}
      />

      <div className="flex flex-col flex-1">
        <Header openSidebar={sidebar.openSidebar} />

        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}