import { Navigate } from "react-router-dom";

import { getToken, getUser } from "@/modules/login/loginStorage";


interface Props {
  children: React.ReactNode;
}


export default function ProtectedRoute({
  children,
}: Props) {


  const token = getToken();


  if (!token) {
    return (
      <Navigate 
        to="/login"
        replace
      />
    );
  }


  // conta com senha temporária: só a tela de troca de senha está liberada
  if (getUser()?.deve_trocar_senha) {
    return (
      <Navigate
        to="/trocar-senha"
        replace
      />
    );
  }

  return children;

}