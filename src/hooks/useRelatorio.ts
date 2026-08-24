import { useCallback, useState } from "react";
import type { FiltrosRelatorio } from "../modules/relatorios/types";
import {
  visualizarRelatorio,
  exportarRelatorio,
} from "../modules/relatorios/RelatorioService";

export function useRelatorio<T>(
  previewUrl: string,
  exportUrl: string,
  exportFilenamePadrao: string
) {
  const [dados, setDados] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(false);
  const [buscou, setBuscou] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [erroExportar, setErroExportar] = useState(false);

  const visualizar = useCallback(
    async (filtros: FiltrosRelatorio) => {
      setLoading(true);
      setErro(false);

      try {
        const dados = await visualizarRelatorio<T>(
          previewUrl,
          filtros
        );

        setDados(dados);
      } catch {
        setErro(true);
        setDados([]);
      } finally {
        setBuscou(true);
        setLoading(false);
      }
    },
    [previewUrl]
  );

  const exportar = useCallback(
    async (
      filtros: FiltrosRelatorio,
      nomeArquivoPersonalizado?: string
    ) => {
      setExportando(true);
      setErroExportar(false);

      try {
        await exportarRelatorio(
          exportUrl,
          filtros,
          exportFilenamePadrao,
          nomeArquivoPersonalizado
        );
      } catch {
        setErroExportar(true);
      } finally {
        setExportando(false);
      }
    },
    [exportUrl, exportFilenamePadrao]
  );

  return {
    dados,
    loading,
    erro,
    buscou,
    exportando,
    erroExportar,
    visualizar,
    exportar,
  };
}