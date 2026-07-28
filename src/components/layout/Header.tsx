import { Menu } from "lucide-react";

import { NotificationBell } from "@/modules/notificacao/notificacaoBell";

interface Props {
  openSidebar: () => void;
}

export default function Header({ openSidebar }: Props) {
  return (
    <header
      className="
        h-14 md:h-16
        border-b border-blue-100
        bg-gradient-to-r from-white via-blue-50 to-blue-100
        flex items-center justify-between
        px-3 sm:px-4 md:px-6
        shadow-sm
      "
    >
      {/* LEFT */}
      <div className="flex items-center gap-3">
        <button
          onClick={openSidebar}
          className="
            md:hidden
            w-9 h-9
            flex items-center justify-center
            rounded-lg hover:bg-blue-100
          "
        >
          <Menu size={18} className="text-slate-700" />
        </button>

        <div className="flex flex-col leading-tight">
          <h1 className="text-sm md:text-base font-semibold text-slate-800">
            Dashboard
          </h1>
          <span className="text-[11px] text-slate-500 hidden sm:block">
            Visão geral
          </span>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-3">
        <NotificationBell />

        {/* AVATAR */}
        <div
          className="
            w-9 h-9 rounded-full
            bg-gradient-to-br from-blue-500 to-blue-700
            flex items-center justify-center
            text-white text-sm font-medium
            shadow-md border border-white
          "
        >
          D
        </div>
      </div>
    </header>
  );
}
