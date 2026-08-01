import { useEffect, useState } from "react";

import { getUser } from "@/modules/login/loginStorage";
import { registrarPush } from "@/modules/push/pushService";

import { DashboardGestorDesktop } from "@/modules/dashboardGestor/DashBoardGestorDesktop";
import { DashboardGestorMobile } from "@/modules/dashboardGestor/DashboardGestorMobile";
import { getDefaultPeriodo } from "@/modules/dashboardGestor/DashboardGestorParts";
import type { FiltroPeriodo } from "@/modules/dashboardGestor/DashboardGestorTypes";

// mesmo breakpoint usado em outras telas do sistema (ex: MachineDetails)
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
  const [periodo, setPeriodo] = useState<FiltroPeriodo>(getDefaultPeriodo());
  const isMobile = useIsMobile();

  useEffect(() => {
    async function registrarDispositivo() {
      try {
        const usuario = getUser();

        if (!usuario?.id) {
          console.log("Usuário não encontrado para registrar push");
          return;
        }

        await registrarPush(usuario.id);
        console.log("✅ Push registrado com sucesso");
      } catch (error) {
        console.error("Erro ao registrar push:", error);
      }
    }

    registrarDispositivo();
  }, []);

  return (
    <div className="space-y-4 sm:space-y-6">
      

      {/* DASHBOARD DO GESTOR */}
      {isMobile ? (
        <DashboardGestorMobile periodo={periodo} onPeriodoChange={setPeriodo} />
      ) : (
        <DashboardGestorDesktop periodo={periodo} onPeriodoChange={setPeriodo} />
      )}
    </div>
  );
}
