import { useEffect, useState } from "react";

import type {
  MaquinaOption,
  SetorOption,
} from "../modules/relatorios/types";

import {
  getSetoresRelatorio,
  getMaquinasRelatorio,
} from "../modules/relatorios/RelatorioService";

export function useOpcoesFiltroRelatorio() {
  const [setores, setSetores] = useState<SetorOption[]>([]);
  const [maquinas, setMaquinas] = useState<MaquinaOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      setLoading(true);
      setErro(false);

      try {
        const [setoresData, maquinasData] =
          await Promise.all([
            getSetoresRelatorio(),
            getMaquinasRelatorio(),
          ]);

        if (!ativo) return;

        setSetores(setoresData ?? []);
        setMaquinas(maquinasData ?? []);
      } catch {
        if (ativo) {
          setErro(true);
        }
      } finally {
        if (ativo) {
          setLoading(false);
        }
      }
    }

    carregar();

    return () => {
      ativo = false;
    };
  }, []);

  return {
    setores,
    maquinas,
    loading,
    erro,
  };
}