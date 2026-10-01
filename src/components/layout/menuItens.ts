import {
  Activity,
  Building2,
  Cpu,
  Factory,
  FileBarChart,
  Handshake,
  LayoutDashboard,
  Users,
  type LucideIcon,
} from "lucide-react";
import { usePermissoes } from "@/modules/permissoes/usePermissoes";

type ItemMenu = {
  label: string;
  path: string;
  icon: LucideIcon;
  /** aparece se o usuário tiver QUALQUER uma destas; sem lista = todos veem */
  qualquer?: string[];
  /** só o dono do sistema (administrador) */
  soAdmin?: boolean;
};

/** Menu do sistema — um item por tela; a permissão de acesso da tela decide se aparece. */
export const ITENS_MENU: ItemMenu[] = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Máquinas", path: "/machines", icon: Cpu, qualquer: ["maquinas.ver"] },
  { label: "Monitoramento", path: "/monitoring", icon: Activity, qualquer: ["monitoramento.ver"] },
  { label: "Setores", path: "/sector", icon: Building2, qualquer: ["setores.ver"] },
  { label: "Parceiros", path: "/partner", icon: Handshake, qualquer: ["parceiros.ver"] },
  { label: "Usuários", path: "/user", icon: Users, qualquer: ["usuarios.ver"] },
  { label: "Relatórios", path: "/reports", icon: FileBarChart, qualquer: ["relatorios.ver"] },
  { label: "Empresas", path: "/admin/empresas", icon: Factory, soAdmin: true },
];

/** Só os itens que o usuário logado pode acessar. */
export function useItensDoMenu(): ItemMenu[] {
  const { podeQualquer, role } = usePermissoes();

  // o dono do sistema não opera uma empresa: só o dashboard das empresas e a lista de empresas
  if (role === "ADMIN") return ITENS_MENU.filter((item) => item.soAdmin || item.path === "/");

  return ITENS_MENU.filter((item) => {
    if (item.soAdmin) return false;
    return !item.qualquer || podeQualquer(...item.qualquer);
  });
}
