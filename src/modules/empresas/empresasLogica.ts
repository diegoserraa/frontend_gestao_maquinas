import { casaComBusca } from "@/modules/permissoes/permissoesBusca";
import { somenteDigitos } from "./cnpj";
import type { EmpresaResumo, FiltroSituacao } from "./empresasTypes";

/** Regras de exibição do painel de empresas — funções puras (sem React), para poder testar. */

/** "há 5 min", "há 3 dias", "Nunca acessou"... (o servidor guarda o instante do último login). */
export function rotuloUltimoAcesso(iso: string | null | undefined, agoraMs: number = Date.now()): string {
  if (!iso) return "Nunca acessou";

  const quando = new Date(iso).getTime();
  if (Number.isNaN(quando)) return "-";

  const seg = Math.max(0, Math.floor((agoraMs - quando) / 1000));
  if (seg < 60) return "agora mesmo";

  const min = Math.floor(seg / 60);
  if (min < 60) return `há ${min} min`;

  const horas = Math.floor(min / 60);
  if (horas < 24) return `há ${horas}h`;

  const dias = Math.floor(horas / 24);
  if (dias === 1) return "ontem";
  if (dias < 30) return `há ${dias} dias`;

  return new Date(iso).toLocaleDateString("pt-BR");
}

/** Filtra pela situação e pela busca (nome, razão social, CNPJ com ou sem máscara, cidade). */
export function filtrarEmpresas(empresas: EmpresaResumo[], busca: string, situacao: FiltroSituacao): EmpresaResumo[] {
  const digitos = somenteDigitos(busca);

  return empresas.filter((e) => {
    if (situacao === "ativas" && !e.ativo) return false;
    if (situacao === "inativas" && e.ativo) return false;

    if (digitos.length >= 3 && e.cnpj?.includes(digitos)) return true;

    return casaComBusca([e.nome, e.razao_social ?? "", e.cidade ?? ""], busca);
  });
}

/** Texto para copiar e mandar ao gestor da empresa nova. */
export function textoDoAcesso(dados: { empresa: string; email: string; senha: string; url?: string }): string {
  return [
    `Acesso ao sistema — ${dados.empresa}`,
    dados.url ? `Endereço: ${dados.url}` : null,
    `E-mail: ${dados.email}`,
    `Senha temporária: ${dados.senha}`,
    "",
    "No primeiro acesso o sistema pede para você trocar a senha.",
  ]
    .filter((linha) => linha !== null)
    .join("\n");
}

export const emailPareceValido = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
