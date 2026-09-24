import type { User } from "./loginType";
import { limparPermissoes, salvarPermissoes } from "@/modules/permissoes/permissoesStore";


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