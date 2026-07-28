const API_URL = import.meta.env.VITE_API_URL;


/* =========================
   NOTIFICAÇÕES
========================= */


/*
   Buscar notificações do usuário
*/
export async function getNotificacoes(usuario_id: number) {

  const res = await fetch(
    `${API_URL}/notificacoes?usuario_id=${usuario_id}`
  );


  if (!res.ok) {
    throw new Error("Erro ao buscar notificações");
  }


  return res.json();
}



/*
   Buscar apenas notificações não lidas
*/
export async function getNotificacoesNaoLidas(
  usuario_id: number
) {

  const res = await fetch(
    `${API_URL}/notificacoes/nao-lidas?usuario_id=${usuario_id}`
  );


  if (!res.ok) {
    throw new Error(
      "Erro ao buscar notificações não lidas"
    );
  }


  return res.json();

}



/*
   Buscar contador do sino
*/
export async function getContadorNotificacoes(
  usuario_id: number
) {

  const res = await fetch(
    `${API_URL}/notificacoes/contador?usuario_id=${usuario_id}`
  );


  if (!res.ok) {
    throw new Error(
      "Erro ao buscar contador de notificações"
    );
  }


  return res.json();

}



/*
   Marcar notificação como lida
*/
export async function marcarNotificacaoComoLida(
  id: number
) {

  const res = await fetch(
    `${API_URL}/notificacoes/${id}/lida`,
    {
      method: "PATCH",
      headers:{
        "Content-Type":"application/json",
      },
    }
  );


  if (!res.ok) {
    throw new Error(
      "Erro ao marcar notificação como lida"
    );
  }


  return res.json();

}



/*
   Marcar todas como lidas
*/
export async function marcarTodasNotificacoesComoLidas(
  usuario_id:number
) {

  const res = await fetch(
    `${API_URL}/notificacoes/marcar-todas`,
    {
      method:"PATCH",

      headers:{
        "Content-Type":"application/json",
      },

      body:JSON.stringify({
        usuario_id
      })
    }
  );


  if (!res.ok) {
    throw new Error(
      "Erro ao marcar notificações como lidas"
    );
  }


  return res.json();

}



/*
   Excluir notificação
*/
export async function excluirNotificacao(
  id:number
){

  const res = await fetch(
    `${API_URL}/notificacoes/${id}`,
    {
      method:"DELETE",
    }
  );


  if (!res.ok) {
    throw new Error(
      "Erro ao excluir notificação"
    );
  }


  return true;

}