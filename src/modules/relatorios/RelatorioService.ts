import type { FiltrosRelatorio } from "../../modules/relatorios/types";
import type {
  MaquinaOption,
  SetorOption,
} from "../../modules/relatorios/types";

const API_URL = import.meta.env.VITE_API_URL;

function montarQueryString(filtros: FiltrosRelatorio): string {
  const params = new URLSearchParams();

  if (filtros.dataInicial) {
    params.set("dataInicial", filtros.dataInicial);
  }

  if (filtros.dataFinal) {
    params.set("dataFinal", filtros.dataFinal);
  }

  if (filtros.setorId) {
    params.set("setorId", String(filtros.setorId));
  }

  if (filtros.maquinaId) {
    params.set("maquinaId", String(filtros.maquinaId));
  }

  const query = params.toString();

  return query ? `?${query}` : "";
}

function extrairNomeArquivo(
  headers: Headers,
  fallback: string
): string {
  const disposition =
    headers.get("Content-Disposition") ||
    headers.get("content-disposition");

  if (!disposition) {
    return fallback;
  }

  const match = disposition.match(/filename="?([^";]+)"?/i);

  return match?.[1] ?? fallback;
}

// Remove caracteres inválidos e garante .xlsx
function sanitizarNomeArquivo(
  nome: string,
  fallback: string
): string {
  const limpo = nome
    .trim()
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, " ");

  if (!limpo) {
    return fallback;
  }

  return limpo.toLowerCase().endsWith(".xlsx")
    ? limpo
    : `${limpo}.xlsx`;
}

function montarUrl(
  endpoint: string,
  filtros: FiltrosRelatorio
): string {
  return `${API_URL.replace(/\/$/, "")}/relatorios/${endpoint.replace(
    /^\//,
    ""
  )}${montarQueryString(filtros)}`;
}

export async function visualizarRelatorio<T>(
  endpoint: string,
  filtros: FiltrosRelatorio
): Promise<T[]> {
  const response = await fetch(
    montarUrl(endpoint, filtros),
    {
      headers: {
        Accept: "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Falha ao consultar relatório (${response.status})`
    );
  }

  const json = await response.json();

  return Array.isArray(json)
    ? json
    : json?.dados ?? [];
}

export async function exportarRelatorio(
  endpoint: string,
  filtros: FiltrosRelatorio,
  exportFilenamePadrao: string,
  nomeArquivoPersonalizado?: string
): Promise<void> {
  const response = await fetch(
    montarUrl(endpoint, filtros),
    {
      headers: {
        Accept:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Falha ao exportar relatório (${response.status})`
    );
  }

  const blob = await response.blob();

  const nomeArquivo = nomeArquivoPersonalizado
    ? sanitizarNomeArquivo(
        nomeArquivoPersonalizado,
        exportFilenamePadrao
      )
    : extrairNomeArquivo(
        response.headers,
        exportFilenamePadrao
      );

  const url = window.URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;
  link.download = nomeArquivo;

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.URL.revokeObjectURL(url);
}
export async function getSetoresRelatorio(): Promise<SetorOption[]> {
  const response = await fetch(`${API_URL}/setores`, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Falha ao consultar setores (${response.status})`
    );
  }

  return response.json();
}

export async function getMaquinasRelatorio(): Promise<MaquinaOption[]> {
  const response = await fetch(`${API_URL}/maquinas`, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Falha ao consultar máquinas (${response.status})`
    );
  }

  return response.json();
}