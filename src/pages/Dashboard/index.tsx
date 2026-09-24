import { useEffect, useState } from "react";

import { getUser } from "@/modules/login/loginStorage";
import { registrarPush } from "@/modules/push/pushService";
import { usePermissoes } from "@/modules/permissoes/usePermissoes";
import { ShieldOff } from "lucide-react";

import { DashboardGestorDesktop } from "@/modules/dashboardGestor/DashBoardGestorDesktop";
import { DashboardGestorMobile } from "@/modules/dashboardGestor/DashboardGestorMobile";

import { DashboardTecnico } from "@/modules/dashboardGestor/DashboardTecnico";
import { DashboardOperador } from "@/modules/dashboardGestor/DasboardOperador";

import { getDefaultPeriodo } from "@/modules/dashboardGestor/DashboardGestorParts";

const MOBILE_BREAKPOINT = 768;

function useIsMobile(breakpoint = MOBILE_BREAKPOINT) {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < breakpoint
  );

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < breakpoint);
    }

    handleResize();

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, [breakpoint]);

  return isMobile;
}

export default function Dashboard() {
  const [periodo, setPeriodo] = useState(getDefaultPeriodo());

  const isMobile = useIsMobile();
  const { pode } = usePermissoes();

  const usuario = getUser();

  useEffect(() => {
    async function registrarDispositivo() {
      try {
        if (!usuario?.id) {
          return;
        }

        await registrarPush(usuario.id);
      } catch (error) {
        console.error("Erro ao registrar push:", error);
      }
    }

    registrarDispositivo();
  }, [usuario]);

  console.log("USUARIO:", usuario);

  if (!usuario) {
    return <div>Usuário não encontrado.</div>;
  }

  // AJUSTE AQUI SE NO SEU OBJETO FOR "tipo" AO INVÉS DE "role"
  const perfil = usuario.role;

  console.log("PERFIL:", perfil);

  if (perfil === "GESTOR" || perfil === "ADMIN") {
    // o gestor da empresa pode ter tirado este acesso deste funcionário
    if (!pode("dashboard.ver_gestor")) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-center text-slate-500">
          <ShieldOff size={36} className="text-slate-400" />
          <p className="text-base font-medium text-slate-700">Você não tem acesso ao dashboard geral</p>
          <p className="max-w-sm text-sm">Use o menu ao lado para acessar as telas liberadas para você.</p>
        </div>
      );
    }

    return isMobile ? (
      <DashboardGestorMobile
        periodo={periodo}
        onPeriodoChange={setPeriodo}
      />
    ) : (
      <DashboardGestorDesktop
        periodo={periodo}
        onPeriodoChange={setPeriodo}
      />
    );
  }

  if (perfil === "TECNICO") {
    return <DashboardTecnico />;
  }

  if (perfil === "OPERADOR") {
    return <DashboardOperador />;
  }

  return (
    <div className="flex items-center justify-center h-screen">
      Perfil não encontrado: {String(perfil)}
    </div>
  );
}