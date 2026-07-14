import { Menu, Bell } from "lucide-react";

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
          className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-blue-100 transition"
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
      <div className="flex items-center gap-2 sm:gap-3">

        {/* NOTIFICATION */}
        <button className="relative w-9 h-9 flex items-center justify-center rounded-lg bg-white border border-blue-100 hover:bg-blue-100 transition shadow-sm">
          <Bell size={18} className="text-slate-600" />

          <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
        </button>

        {/* AVATAR */}
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-sm font-medium shadow-md border border-white">
          D
        </div>

      </div>
    </header>
  );
}