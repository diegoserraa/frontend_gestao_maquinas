import { estaTrocandoSenha } from "@/modules/conta/contaService";
import { AVISO_DE_LOGIN, getToken, logout } from "@/modules/login/loginStorage";

/**
 * Backend passou a exigir token em toda rota (antes não validava nada).
 * Nenhum dos módulos de serviço anexava o header Authorization — o token
 * era salvo no login e nunca mais usado. Isso corrige isso de forma
 * central (sem precisar editar os 13 arquivos de *Service.ts um por um),
 * anexando o token em toda chamada pra API e deslogando automaticamente
 * se o token expirar/for inválido (401).
 *
 * Só intercepta chamadas para a própria API (mesma origem do VITE_API_URL)
 * — não mexe em outras requisições (ex.: fontes, CDNs).
 */
const API_URL = import.meta.env.VITE_API_URL ?? "";

const fetchOriginal = window.fetch.bind(window);

window.fetch = async (input: RequestInfo | URL, init: RequestInit = {}) => {
  const url = typeof input === "string" ? input : input.toString();
  const ehChamadaDaApi = API_URL !== "" && url.startsWith(API_URL);

  if (!ehChamadaDaApi) {
    return fetchOriginal(input, init);
  }

  const token = getToken();
  const headers = new Headers(init.headers);

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const resposta = await fetchOriginal(input, { ...init, headers });

  if (resposta.status === 401 && !url.includes("/auth/login")) {
    // a própria pessoa acabou de trocar a senha: as chamadas em voo com o token velho não a derrubam
    if (estaTrocandoSenha()) return resposta;

    // senha trocada em outro aparelho: explica na tela de login em vez de só chutar para fora
    const corpo = await resposta.clone().json().catch(() => null);
    if (corpo?.codigo === "SESSAO_ENCERRADA") {
      try {
        sessionStorage.setItem(AVISO_DE_LOGIN, "Sua senha foi alterada em outro lugar. Entre novamente com a senha nova.");
      } catch {
        // sem sessionStorage: só perde o aviso
      }
    }

    logout();
    if (!window.location.pathname.startsWith("/login")) {
      window.location.href = "/login";
    }
  }

  return resposta;
};
