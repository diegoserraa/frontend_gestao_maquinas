import { cn } from "@/lib/utils";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Cpu,
  Users,
  Building2,
  Handshake,
  X,
  LogOut,
} from "lucide-react";

interface Props {
  isOpen: boolean;
  closeSidebar: () => void;
}

export default function SidebarMobile({
  isOpen,
  closeSidebar,
}: Props) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    closeSidebar();
    navigate("/login");
  };

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
    <div
      className={cn(
        "fixed inset-0 z-50 md:hidden",
        isOpen
          ? "pointer-events-auto"
          : "pointer-events-none"
      )}
    >
      {/* BACKDROP */}
      <div
        onClick={closeSidebar}
        className={cn(
          "absolute inset-0 bg-slate-900 transition-opacity duration-300",
          isOpen ? "opacity-40" : "opacity-0"
        )}
      />

      {/* PANEL */}
      <div
        className={cn(
          "absolute top-0 left-0 w-full",
          "bg-gradient-to-b from-white via-blue-50 to-blue-100",
          "rounded-b-2xl shadow-2xl border-b border-blue-100",
          "transition-transform duration-300 ease-out",
          isOpen
            ? "translate-y-0"
            : "-translate-y-full"
        )}
      >
        {/* HEADER */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-blue-100">
          <div className="text-sm font-semibold text-slate-800">
            ZDM{" "}
            <span className="text-blue-600">
              SaaS
            </span>
          </div>

          <button
            onClick={closeSidebar}
            className={cn(
              "w-8 h-8 flex items-center justify-center rounded-lg",
              "hover:bg-blue-100 transition active:scale-95"
            )}
          >
            <X
              size={18}
              className="text-slate-600"
            />
          </button>
        </div>

        {/* MENU */}
        <nav className="p-2 space-y-1">
          {items.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={closeSidebar}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                    "hover:bg-blue-100 hover:text-blue-700",
                    isActive &&
                      "bg-blue-100 text-blue-700 shadow-sm border border-blue-200"
                  )
                }
              >
                <div className="w-8 h-8 flex items-center justify-center">
                  <Icon size={18} />
                </div>

                <span className="text-sm font-medium">
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </nav>

        {/* FOOTER */}
        <div className="border-t border-white/60 p-3 space-y-2">
          <button
            onClick={handleLogout}
            className={cn(
              "group w-full flex items-center gap-3 px-4 py-3 rounded-xl",
              "transition-all duration-200",
              "text-slate-500 hover:text-slate-900",
              "hover:bg-white/80 backdrop-blur-sm",
              "hover:shadow-sm"
            )}
          >
            <div className="w-8 h-8 flex items-center justify-center">
              <LogOut
                size={18}
                className="transition-transform duration-200 group-hover:-translate-x-0.5"
              />
            </div>

            <span className="text-sm font-medium">
              Sair
            </span>
          </button>

          <div className="h-10 flex items-center justify-center">
            <span className="text-xs text-slate-500">
              v1.0 SaaS
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}