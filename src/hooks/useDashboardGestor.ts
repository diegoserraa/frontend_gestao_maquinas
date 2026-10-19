import { useCallback, useEffect, useState } from "react";

import {
  getKpis,
  getEvolucao,
  getTempoMedioResolucao,
  getMaquinasParadas,
  getPreventivasVencidas,
  getRankingTecnicos,
  getCustos,
  getResumoParadas,
} from "../modules/dashboardGestor/DashboardGestorService";

import type {
  DashboardKpis,
  EvolucaoPonto,
  TempoMedioResolucao,
  MaquinaParada,
  PreventivasVencidas,
  RankingTecnicoItem,
  CustosGestor,
  ResumoParadas,
} from "../modules/dashboardGestor/DashboardGestorTypes";


export function useDashboardGestor(
  dataInicio: string,
  dataFim: string
) {

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(false);
  const [atualizadoEm, setAtualizadoEm] = useState<Date | null>(null);


  const [kpis, setKpis] =
    useState<DashboardKpis | null>(null);


  const [evolucao, setEvolucao] =
    useState<EvolucaoPonto[]>([]);


  const [tempoMedioResolucao, setTempoMedioResolucao] =
    useState<TempoMedioResolucao | null>(null);


  const [maquinasParadas, setMaquinasParadas] =
    useState<MaquinaParada[]>([]);


  const [preventivasVencidas, setPreventivasVencidas] =
  useState<PreventivasVencidas | null>(null);


  const [rankingTecnicos, setRankingTecnicos] =
    useState<RankingTecnicoItem[]>([]);


  const [custos, setCustos] =
    useState<CustosGestor | null>(null);


  const [resumoParadas, setResumoParadas] =
    useState<ResumoParadas | null>(null);



  const carregar = useCallback(async () => {

    setLoading(true);
    setErro(false);


    try {

      const [
        k,
        e,
        tmr,
        mp,
        mv,
        rt,
        c,
        rp
      ] = await Promise.all([

        getKpis(
          dataInicio,
          dataFim
        ),

        getEvolucao(
          dataInicio,
          dataFim
        ),

        getTempoMedioResolucao(
          dataInicio,
          dataFim
        ),

        getMaquinasParadas(
          dataInicio,
          dataFim
        ),

        getPreventivasVencidas(),

        getRankingTecnicos(
          dataInicio,
          dataFim
        ),

        getCustos(
          dataInicio,
          dataFim
        ),

        getResumoParadas(),

      ]);



      setKpis(k);

      setEvolucao(e ?? []);


      setTempoMedioResolucao(
        tmr ?? null
      );


      setMaquinasParadas(
        mp ?? []
      );


      setPreventivasVencidas(
        mv ?? null
      );


      setRankingTecnicos(
        rt ?? []
      );


      setCustos(c);

      setResumoParadas(
        rp ?? null
      );


      setAtualizadoEm(
        new Date()
      );


    } catch (error) {

      console.error(
        "Erro ao carregar dashboard do gestor:",
        error
      );

      setErro(true);

    } finally {

      setLoading(false);

    }


  }, [
    dataInicio,
    dataFim,
  ]);



  useEffect(() => {

    carregar();

  }, [carregar]);



  return {

    loading,

    erro,

    atualizadoEm,

    kpis,

    evolucao,

    tempoMedioResolucao,

    maquinasParadas,

    preventivasVencidas,

    rankingTecnicos,

    custos,

    resumoParadas,

    refetch: carregar,

  };

}