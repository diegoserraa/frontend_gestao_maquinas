
import { useCallback, useEffect, useState } from "react";

import type { OrdemServicoResumo } from "@/modules/dashboardGestor/OrdemServicoCard";

import {
  getResumoTecnico,
  getOsAbertasTecnico,
  getOsAndamentoTecnico,
  getOsFinalizadasTecnico,
  type ResumoTecnico,
} from "@/modules/dashboardGestor/DashboardGestorService";

export function useDashboardTecnico(
  tecnicoId: string | number | undefined
) {
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(false);

  const [atualizadoEm, setAtualizadoEm] =
    useState<Date | null>(null);

  const [resumo, setResumo] =
    useState<ResumoTecnico | null>(null);

  const [osAbertas, setOsAbertas] =
    useState<OrdemServicoResumo[]>([]);

  const [osAndamento, setOsAndamento] =
    useState<OrdemServicoResumo[]>([]);

  const [osFinalizadas, setOsFinalizadas] =
    useState<OrdemServicoResumo[]>([]);

  const fetchData = useCallback(async () => {
    if (!tecnicoId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setErro(false);

    try {
      const [
        resumoData,
        abertasData,
        andamentoData,
        finalizadasData,
      ] = await Promise.all([
        getResumoTecnico(tecnicoId),
        getOsAbertasTecnico(tecnicoId),
        getOsAndamentoTecnico(tecnicoId),
        getOsFinalizadasTecnico(tecnicoId),
      ]);

      setResumo(resumoData);

      setOsAbertas(
        abertasData?.ordens ?? []
      );

      setOsAndamento(
        andamentoData?.ordens ?? []
      );

      setOsFinalizadas(
        finalizadasData?.ordens ?? []
      );

      setAtualizadoEm(new Date());
    } catch (error) {
      console.error(
        "Erro ao carregar dashboard do técnico:",
        error
      );

      setErro(true);
    } finally {
      setLoading(false);
    }
  }, [tecnicoId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const minhasOs: OrdemServicoResumo[] = [
    ...osAbertas,
    ...osAndamento,
    ...osFinalizadas,
  ];

  return {
    loading,
    erro,
    atualizadoEm,
    resumo,

    minhasOs,

    osAbertas,
    osAndamento,
    osFinalizadas,

    refetch: fetchData,
  };
}

