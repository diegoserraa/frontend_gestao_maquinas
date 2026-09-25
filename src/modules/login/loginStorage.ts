import type { User } from "./loginType";
import { limparPermissoes, salvarPermissoes } from "@/modules/permissoes/permissoesStore";


/** Recado que a tela de login mostra uma vez (ex.: sessão encerrada por troca de senha). */
export const AVISO_DE_LOGIN = "aviso_de_login";

export function saveAuth(
  token:string,
  user:User,
  permissoes:string[] = []
){

  salvarPermissoes(permissoes);


  localStorage.setItem(
    "token",
    token
  );


  localStorage.setItem(
    "user",
    JSON.stringify(user)
  );

}



export function getToken(){

  return localStorage.getItem(
    "token"
  );

}



export function getUser():User|null{

  const user =
    localStorage.getItem("user");


  return user
    ? JSON.parse(user)
    : null;

}


export function logout(){

  limparPermissoes();

  localStorage.removeItem(
    "token"
  );

  localStorage.removeItem(
    "user"
  );

}