/** CNPJ e telefone: só dígitos para guardar/enviar, máscara para mostrar. Funções puras. */

export const somenteDigitos = (v: string): string => v.replace(/\D/g, "");

/** Mesma regra do servidor: 14 dígitos, não repetidos, dois dígitos verificadores corretos. */
export function cnpjValido(valor: string): boolean {
  const c = somenteDigitos(valor);
  if (c.length !== 14 || /^(\d)\1{13}$/.test(c)) return false;

  const digito = (base: string): number => {
    const pesos = base.length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const resto = base.split("").reduce((soma, d, i) => soma + Number(d) * pesos[i], 0) % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  const d1 = digito(c.slice(0, 12));
  const d2 = digito(c.slice(0, 12) + d1);
  return c.endsWith(`${d1}${d2}`);
}

/** Máscara enquanto a pessoa digita: 12.345.678/0001-90 (aceita incompleto). */
export function mascaraCnpj(valor: string): string {
  const d = somenteDigitos(valor).slice(0, 14);

  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

/** (11) 91234-5678 ou (11) 1234-5678 (aceita incompleto). */
export function mascaraTelefone(valor: string): string {
  const d = somenteDigitos(valor).slice(0, 11);

  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** Telefone com DDD: 10 ou 11 dígitos. */
export const telefoneValido = (valor: string): boolean => {
  const n = somenteDigitos(valor).length;
  return n === 10 || n === 11;
};
