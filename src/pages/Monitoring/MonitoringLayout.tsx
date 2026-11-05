import { NavLink, Outlet } from "react-router-dom";
import { Gauge, FileBarChart, PlugZap } from "lucide-react";

import { cn } from "@/lib/utils";
import { usePermissoes } from "@/modules/permissoes/usePermissoes";

/**
 * Barra do módulo de Monitoramento — pensada pra, no futuro, ele poder
 * "viver sozinho" (empresa que já tem outro sistema e só quer plugar os
 * sensores aqui). Por enquanto só Relatórios e Adicionar máquinas; outras
 * abas (ex.: integração por API) entram aqui depois, sem mexer no resto.
 */
export default function MonitoringLayout() {
  const { pode } = usePermissoes();

  const abas = [
    { to: "/monitoring", label: "Visão geral", icon: Gauge, end: true, mostrar: true },
    { to: "/monitoring/relatorios", label: "Relatórios", icon: FileBarChart, end: false, mostrar: true },
    {
      to: "/monitoring/maquinas",
      label: "Adicionar máquinas",
      icon: PlugZap,
      end: false,
      mostrar: pode("monitoramento.configurar_limites"),
    },
  ];

  return (
    <div className="space-y-4">
      <nav className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 pb-2">
        {abas
          .filter((a) => a.mostrar)
          .map((aba) => (
            <NavLink
              key={aba.to}
              to={aba.to}
              end={aba.end}
              className={({ isActive }) =>
                cn(
                  "inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                )
              }
            >
              <aba.icon size={15} />
              {aba.label}
            </NavLink>
          ))}
      </nav>

      <Outlet />
    </div>
  );
}
