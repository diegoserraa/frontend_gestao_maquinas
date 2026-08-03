export interface Notificacao {
    id:number;
    usuario_id:number;
    titulo:string;
    mensagem:string;
    tipo:string;
    url:string;
    lida:boolean;
    created_at:string;
}