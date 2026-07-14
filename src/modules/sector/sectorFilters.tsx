import { useState } from "react";
import { Search } from "lucide-react";

type Props = {
  onSearch: (value: string) => void;
};

export function SectorFilters({
  onSearch,
}: Props) {
  const [search, setSearch] = useState("");

  return (
    <div className="w-full">
      <div className="relative">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
        />

        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            onSearch(e.target.value);
          }}
          placeholder="Buscar setor..."
          className="
            h-11
            w-full
            rounded-xl
            border
            border-slate-200
            bg-white
            pl-11
            pr-4

            text-sm
            text-slate-700

            shadow-sm

            placeholder:text-slate-400

            transition-all
            duration-200

            hover:border-slate-300
            hover:shadow-md

            focus:outline-none
            focus:ring-2
            focus:ring-blue-100
            focus:border-blue-500
          "
        />
      </div>
    </div>
  );
}