import { useCallback, useEffect, useState } from "react";
import type { OrdemServicoResumo } from "@/modules/dashboardGestor/OrdemServicoCard";
import {
  getResumoOperador,
  getMinhasOs,
  type ResumoOperador,
} from "@/modules/dashboardGestor/DashboardGestorService";

export function useDashboardOperador(
  operadorId: string | number | undefined
) {
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(false);
  const [atualizadoEm, setAtualizadoEm] = useState<Date | null>(null);

  const [resumo, setResumo] = useState<ResumoOperador | null>(null);
  const [minhasOs, setMinhasOs] = useState<OrdemServicoResumo[]>([]);

  const fetchData = useCallback(async () => {
    if (!operadorId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setErro(false);

    try {
      const [resumoData, minhasOsData] = await Promise.all([
        getResumoOperador(operadorId),
        getMinhasOs(operadorId),
      ]);

      setResumo(resumoData);
      setMinhasOs(minhasOsData ?? []);
      setAtualizadoEm(new Date());
    } catch (error) {
      console.error("Erro ao carregar dashboard do operador:", error);
      setErro(true);
    } finally {
      setLoading(false);
    }
  }, [operadorId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    loading,
    erro,
    atualizadoEm,
    resumo,
    minhasOs,
    refetch: fetchData,
  };
}