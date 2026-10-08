import { apiPatch } from "@/lib/apiClient";
import { getUser } from "@/modules/login/loginStorage";

/**
 * Enquanto a troca de senha está no ar, as outras chamadas do app (notificações, tempo real) podem receber
 * 401 "sessão encerrada": o servidor já subiu a versão da sessão mas o token novo ainda não foi guardado.
 * Isso NÃO pode deslogar quem acabou de trocar a senha.
 */
let trocandoSenha = false;
export const estaTrocandoSenha = (): boolean => trocandoSenha;

/**
 * Troca a senha do próprio usuário (qualquer perfil). O servidor encerra todas as outras sessões e devolve
 * um token novo: guardamos ele aqui, então quem chama não precisa se preocupar com isso.
 */
export async function trocarSenha(senhaAtual: string, novaSenha: string): Promise<void> {
  trocandoSenha = true;

  try {
    const { token } = await apiPatch<{ token: string }>("/conta/senha", { senha_atual: senhaAtual, nova_senha: novaSenha });

    localStorage.setItem("token", token);

    const usuario = getUser();
    if (usuario?.deve_trocar_senha) localStorage.setItem("user", JSON.stringify({ ...usuario, deve_trocar_senha: false }));
  } finally {
    // deixa passar as chamadas que já estavam em voo com o token velho
    window.setTimeout(() => {
      trocandoSenha = false;
    }, 2000);
  }
}
