import { cn } from "@/lib/utils";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Cpu,
  Users,
  Building2,
  Handshake,
  Menu,
} from "lucide-react";

interface Props {
  isCollapsed: boolean;
  toggleCollapse: () => void;
}

export default function Sidebar({
  isCollapsed,
  toggleCollapse,
}: Props) {
  const items = [
    {
      label: "Dashboard",
      path: "/",
      icon: LayoutDashboard,
    },
    {
      label: "Máquinas",
      path: "/machines",
      icon: Cpu,
    },
    {
      label: "Setores",
      path: "/sector",
      icon: Building2,
    },
    {
      label: "Parceiros",
      path: "/partner",
      icon: Handshake,
    },
    {
      label: "Usuários",
      path: "/user",
      icon: Users,
    },
  ];

  return (
    <aside
      className={cn(
        "h-screen flex flex-col border-r border-blue-100 transition-all duration-300",
        "bg-gradient-to-b from-white via-blue-50 to-blue-100",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* TOP BAR FIXADO NO MESMO GRID DOS ITENS */}
      <div className="h-16 flex items-center justify-center border-b border-blue-100">
        <div
          className={cn(
            "w-full flex items-center",
            isCollapsed
              ? "justify-center"
              : "justify-between px-3"
          )}
        >
          {!isCollapsed && (
            <div className="text-sm font-semibold text-slate-800">
              ZDM{" "}
              <span className="text-blue-600">
                SaaS
              </span>
            </div>
          )}

          <button
            onClick={toggleCollapse}
            className={cn(
              "w-8 h-8 flex items-center justify-center rounded-lg",
              "hover:bg-blue-100 transition active:scale-95"
            )}
          >
            <Menu
              size={18}
              className="text-slate-600"
            />
          </button>
        </div>
      </div>

      {/* MENU */}
      <nav className="flex-1 p-2 space-y-1">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "group flex items-center rounded-xl transition-all duration-200",
                  "hover:bg-blue-100 hover:text-blue-700",
                  isActive &&
                    "bg-blue-100 text-blue-700 shadow-sm border border-blue-200",
                  isCollapsed
                    ? "justify-center p-3"
                    : "gap-3 px-3 py-2"
                )
              }
            >
              <div className="w-8 h-8 flex items-center justify-center">
                <Icon size={18} />
              </div>

              {!isCollapsed && (
                <span className="text-sm font-medium">
                  {item.label}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* FOOTER */}
      <div className="h-12 flex items-center justify-center border-t border-blue-100">
        {!isCollapsed ? (
          <span className="text-xs text-slate-500">
            v1.0 SaaS
          </span>
        ) : (
          <div className="w-2 h-2 bg-blue-500 rounded-full" />
        )}
      </div>
    </aside>
  );
}