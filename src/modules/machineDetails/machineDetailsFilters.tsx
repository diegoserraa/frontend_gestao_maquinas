import { useState } from "react";
import {
  Search,
  Activity,
  AlertTriangle,
} from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  status: string; // 👈 agora controlado por fora (MachineDetails.tsx)
  userRole: string; // 👈 recebido de verdade, sem mock
  onSearch: (v: string) => void;
  onStatus: (v: string) => void;
  onPriority: (v: string) => void;
};

export function MachineDetailsFilters({
  status,
  userRole,
  onSearch,
  onStatus,
  onPriority,
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
          placeholder="Buscar ordem de serviço..."
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
      <div className="w-full md:w-56">
        <Select
          value={status || "all"} // 👈 controlado (antes era defaultValue)
          onValueChange={(value) =>
            onStatus(value === "all" ? "" : value)
          }
        >
          <SelectTrigger>
            <div className="flex items-center gap-2">
              <Activity
                size={16}
                className="text-slate-400"
              />
              <SelectValue />
            </div>
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="all">
              Todos os status
            </SelectItem>

            <SelectItem value="ABERTA">
              Aberta
            </SelectItem>

            <SelectItem value="ATRIBUIDA">
              Atribuída
            </SelectItem>

            <SelectItem value="EM_ANDAMENTO">
              Em andamento
            </SelectItem>

            <SelectItem value="FINALIZADA">
              Finalizada
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* PRIORIDADE */}
      <div className="w-full md:w-56">
        <Select
          onValueChange={(value) =>
            onPriority(value === "all" ? "" : value)
          }
        >
          <SelectTrigger>
            <div className="flex items-center gap-2">
              <AlertTriangle
                size={16}
                className="text-slate-400"
              />

              <SelectValue placeholder="Prioridade" />
            </div>
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="all">
              Todas as prioridades
            </SelectItem>

            <SelectItem value="ALTA">
              Alta
            </SelectItem>

            <SelectItem value="MEDIA">
              Média
            </SelectItem>

            <SelectItem value="BAIXA">
              Baixa
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

    </div>
  );
}
