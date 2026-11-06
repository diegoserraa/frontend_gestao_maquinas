import { Activity, Search } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { FiltroSituacao } from "./empresasTypes";

type Props = {
  onBusca: (valor: string) => void;
  onSituacao: (valor: FiltroSituacao) => void;
};

export function EmpresasFilters({ onBusca, onSituacao }: Props) {
  return (
    <div className="flex flex-col md:flex-row gap-3 w-full">
      <div className="relative flex-1">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

        <input
          type="search"
          aria-label="Buscar empresa"
          onChange={(e) => onBusca(e.target.value)}
          placeholder="Buscar por nome, CNPJ ou cidade..."
          className="
            h-11 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4
            text-sm text-slate-700 shadow-sm placeholder:text-slate-400
            transition-all duration-200 hover:border-slate-300 hover:shadow-md
            focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500
          "
        />
      </div>

      <div className="w-full md:w-56">
        <Select onValueChange={(v) => onSituacao(v as FiltroSituacao)}>
          <SelectTrigger aria-label="Situação">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-slate-400" />
              <SelectValue placeholder="Situação" />
            </div>
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="todas">Todas as situações</SelectItem>
            <SelectItem value="ativas">Ativas</SelectItem>
            <SelectItem value="inativas">Inativas</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
