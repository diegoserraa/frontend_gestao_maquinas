import { Navigate, useLocation } from "react-router-dom";

import { getToken, getUser } from "@/modules/login/loginStorage";
import { guardarDestino } from "@/modules/login/destino";


interface Props {
  children: React.ReactNode;
}


export default function ProtectedRoute({
  children,
}: Props) {


  const token = getToken();
  const local = useLocation();


  if (!token) {
    // lembra para onde a pessoa ia (ex.: QR Code da máquina) e leva para lá depois do login
    guardarDestino(`${local.pathname}${local.search}${local.hash}`);

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