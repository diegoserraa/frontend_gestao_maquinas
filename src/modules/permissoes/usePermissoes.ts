import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import { getUser, getToken } from "@/modules/login/loginStorage";
import { getMinhasPermissoes } from "./permissoesService";
import {
  assinarPermissoes,
  lerPermissoes,
  permissoesDoServidor,
  salvarPermissoes,
} from "./permissoesStore";

/**
 * Permissões do usuário logado.
 *
 *   const { pode, podeQualquer } = usePermissoes();
 *   pode("os.cancelar")                  // uma
 *   podeQualquer("os.ver", "os.ver_proprias")  // qualquer uma
 */
export function usePermissoes() {
  const estado = useSyncExternalStore(assinarPermissoes, lerPermissoes, permissoesDoServidor);
  const role = getUser()?.role ?? null;

  const pode = useCallback(
    (permissao: string) => role === "ADMIN" || estado.conjunto.has(permissao),
    [estado, role]
  );

  const podeQualquer = useCallback(
    (...permissoes: string[]) => permissoes.some((p) => role === "ADMIN" || estado.conjunto.has(p)),
    [estado, role]
  );

  return useMemo(() => ({ pode, podeQualquer, role, lista: estado.lista }), [pode, podeQualquer, role, estado]);
}

const INTERVALO_MS = 60_000;

/**
 * Mantém as permissões em dia enquanto o sistema está aberto: busca ao abrir, ao voltar
 * pra aba e a cada minuto. Assim, o que o gestor mudar chega na tela do funcionário sem ele
 * precisar sair e entrar (o backend já barra na hora; isto só atualiza menus e botões).
 */
export function useSincronizarPermissoes(): void {
  useEffect(() => {
    let ativo = true;

    async function atualizar() {
      if (!getToken()) return;

      try {
        const eu = await getMinhasPermissoes();
        if (!ativo) return;

        salvarPermissoes(eu.permissoes);

        // o tipo do funcionário pode ter mudado (ex.: promovido a gestor)
        const usuario = getUser();
        if (usuario && usuario.role !== eu.usuario.role) {
          localStorage.setItem("user", JSON.stringify({ ...usuario, role: eu.usuario.role }));
        }
      } catch {
        // sem rede / sessão expirada: o authFetch já trata o 401
      }
    }

    void atualizar();

    const aoVoltar = () => {
      if (document.visibilityState === "visible") void atualizar();
    };

    document.addEventListener("visibilitychange", aoVoltar);
    const timer = window.setInterval(atualizar, INTERVALO_MS);

    return () => {
      ativo = false;
      document.removeEventListener("visibilitychange", aoVoltar);
      window.clearInterval(timer);
    };
  }, []);
}
