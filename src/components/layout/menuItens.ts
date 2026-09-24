import {
  Activity,
  Building2,
  Cpu,
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
];

/** Só os itens que o usuário logado pode acessar. */
export function useItensDoMenu(): ItemMenu[] {
  const { podeQualquer } = usePermissoes();

  return ITENS_MENU.filter((item) => !item.qualquer || podeQualquer(...item.qualquer));
}
