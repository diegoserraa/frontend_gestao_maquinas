/** Regras da senha do usuário — funções puras (sem React), iguais às do servidor. */

/** O servidor (bcrypt) só lê os 72 primeiros bytes: acima disso a senha é recusada. */
export const MAX_BYTES_SENHA = 72;

const bytes = (texto: string): number => new TextEncoder().encode(texto).length;

/** Primeiro problema da senha nova (ou null se pode enviar). O servidor confere tudo de novo. */
export function problemaNaNovaSenha(nova: string, atual: string): string | null {
  if (nova.length < 8) return "A nova senha precisa ter pelo menos 8 caracteres";
  if (bytes(nova) > MAX_BYTES_SENHA) return "A nova senha pode ter no máximo 72 caracteres";
  if (!/[A-Za-z]/.test(nova) || !/\d/.test(nova)) return "A nova senha precisa ter letras e números";
  if (nova === atual) return "A nova senha precisa ser diferente da atual";
  return null;
}

export type RegraDaSenha = { chave: string; texto: string; ok: boolean };

/** Lista de regras com o estado de cada uma, para mostrar enquanto a pessoa digita. */
export function regrasDaSenha(nova: string, atual: string, confirmacao: string): RegraDaSenha[] {
  return [
    { chave: "tamanho", texto: "Pelo menos 8 caracteres", ok: nova.length >= 8 && bytes(nova) <= MAX_BYTES_SENHA },
    { chave: "mistura", texto: "Letras e números", ok: /[A-Za-z]/.test(nova) && /\d/.test(nova) },
    { chave: "diferente", texto: "Diferente da senha atual", ok: nova.length > 0 && atual.length > 0 && nova !== atual },
    { chave: "confere", texto: "As duas senhas novas são iguais", ok: nova.length > 0 && nova === confirmacao },
  ];
}

export type ForcaDaSenha = { nivel: 0 | 1 | 2 | 3; rotulo: string };

/** Indicador simples de força (não é regra: só orienta). 0 = vazia. */
export function forcaDaSenha(senha: string): ForcaDaSenha {
  if (!senha) return { nivel: 0, rotulo: "" };

  let pontos = 0;
  if (senha.length >= 8) pontos++;
  if (senha.length >= 12) pontos++;
  if (/[a-z]/.test(senha) && /[A-Z]/.test(senha)) pontos++;
  if (/\d/.test(senha) && /[A-Za-z]/.test(senha)) pontos++;
  if (/[^A-Za-z0-9]/.test(senha)) pontos++;
  if (/^(.)\1+$/.test(senha) || /^(0123|1234|abcd|qwer|senha|password)/i.test(senha)) pontos = Math.min(pontos, 1);

  if (pontos <= 2) return { nivel: 1, rotulo: "Fraca" };
  if (pontos <= 3) return { nivel: 2, rotulo: "Boa" };
  return { nivel: 3, rotulo: "Forte" };
}
