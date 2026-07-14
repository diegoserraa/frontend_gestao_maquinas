import { useState } from "react";
import { Search, Mail, Shield } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  onNameSearch: (value: string) => void;
  onEmailSearch: (value: string) => void;
  onRoleChange: (value: string) => void;
};

export function UserFilters({
  onNameSearch,
  onEmailSearch,
  onRoleChange,
}: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  return (
    <div className="flex flex-col xl:flex-row gap-3 w-full">

      {/* NOME */}
      <div className="relative flex-1">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
        />

        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            onNameSearch(e.target.value);
          }}
          placeholder="Buscar por nome..."
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

      {/* EMAIL */}
      <div className="relative flex-1">
        <Mail
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
        />

        <input
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            onEmailSearch(e.target.value);
          }}
          placeholder="Buscar por e-mail..."
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

      {/* PERFIL */}
      <div className="w-full md:w-56">
        <Select
          onValueChange={(value) =>
            onRoleChange(value === "all" ? "" : value)
          }
        >
          <SelectTrigger>
            <div className="flex items-center gap-2">
              <Shield
                size={16}
                className="text-slate-400"
              />

              <SelectValue placeholder="Perfil" />
            </div>
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="all">
              Todos os perfis
            </SelectItem>

            <SelectItem value="ADMIN">
              Administrador
            </SelectItem>

            <SelectItem value="GESTOR">
              Gestor
            </SelectItem>

            <SelectItem value="TECNICO">
              Técnico
            </SelectItem>

            <SelectItem value="OPERADOR">
              Operador
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

    </div>
  );
}