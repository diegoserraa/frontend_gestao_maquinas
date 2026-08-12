import { useEffect, useState } from "react";

import { getUser } from "@/modules/login/loginStorage";
import { registrarPush } from "@/modules/push/pushService";

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