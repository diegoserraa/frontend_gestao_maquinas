import { useState } from "react";
import {
  Search,
  Boxes,
  Building2,
} from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Sector = {
  id: number;
  nome: string;
};

type Props = {
  onSearch: (value: string) => void;
  onStatusChange: (value: string) => void;
  onModelChange: (value: string) => void;
  onSectorChange?: (value: string) => void;
  sectors?: Sector[];
};

export function DataFilters({
  onSearch,
  onStatusChange,
  onModelChange,
  onSectorChange,
  sectors = [],
}: Props) {
  const [search, setSearch] = useState("");

  return (
    <div className="flex flex-col xl:flex-row gap-3 w-full">

      {/* BUSCA */}
      <div className="relative flex-1 min-w-[280px]">
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
          placeholder="Buscar máquina..."
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

      {/* MODELO */}
      <div className="relative w-full md:w-56">
        <Boxes
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
        />

        <input
          placeholder="Modelo"
          onChange={(e) => onModelChange(e.target.value)}
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

      {/* STATUS */}
      <div className="w-full md:w-44">
        <Select
          onValueChange={(value: string) =>
            onStatusChange(value === "all" ? "" : value)
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="all">
              Todos os status
            </SelectItem>

            <SelectItem value="ativa">
              Ativa
            </SelectItem>

            <SelectItem value="inativa">
              Inativa
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* SETOR */}
      <div className="w-full md:w-56">
        <Select
          onValueChange={(value: string) =>
            onSectorChange?.(value === "all" ? "" : value)
          }
        >
          <SelectTrigger>
            <div className="flex items-center gap-2">
              <Building2
                size={16}
                className="text-slate-400"
              />

              <SelectValue placeholder="Setor" />
            </div>
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="all">
              Todos os setores
            </SelectItem>

            {sectors.map((sector) => (
              <SelectItem
                key={sector.id}
                value={String(sector.id)}
              >
                {sector.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

    </div>
  );
}