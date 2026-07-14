import { useState } from "react";

import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

import {
  Wrench,
  AlertTriangle,
  User,
  ClipboardList,
  Settings,
  Gauge,
} from "lucide-react";

export type OrdemServicoFormData = {
  maquina_id: number;
  descricao: string;
  status: "ABERTA";
  tipo_manutencao: "CORRETIVA" | "PREVENTIVA" | "PREDITIVA";
  prioridade: "BAIXA" | "MEDIA" | "ALTA" | "CRITICA";
  id_tecnico?: number | null;
  resolucao?: string;
};

type Tecnico = {
  id: number;
  nome: string;
};

type Props = {
  machineId: number;
  tecnicos: Tecnico[];
  loading?: boolean;
  onSubmit: (data: OrdemServicoFormData) => void;
};

type FormErrors = Partial<Record<keyof OrdemServicoFormData, string>>;

function validate(form: OrdemServicoFormData): FormErrors {
  const errors: FormErrors = {};

  if (!form.descricao.trim()) errors.descricao = "Descrição obrigatória.";
  if (!form.tipo_manutencao) errors.tipo_manutencao = "Selecione o tipo.";
  if (!form.prioridade) errors.prioridade = "Selecione a prioridade.";

  return errors;
}

export function OrdemServicoForm({
  machineId,
  tecnicos,
  loading,
  onSubmit,
}: Props) {
  const [form, setForm] = useState<OrdemServicoFormData>({
    maquina_id: machineId,
    descricao: "",
    status: "ABERTA",
    tipo_manutencao: "CORRETIVA",
    prioridade: "MEDIA",
    id_tecnico: null,
    resolucao: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof OrdemServicoFormData, boolean>>>({});

  function touch(field: keyof OrdemServicoFormData) {
    setTouched((p) => ({ ...p, [field]: true }));
  }

  function handleChange<K extends keyof OrdemServicoFormData>(key: K, value: OrdemServicoFormData[K]) {
    const updated = { ...form, [key]: value };
    setForm(updated);

    if (touched[key]) {
      setErrors(validate(updated));
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const allTouched = Object.fromEntries(
      Object.keys(form).map((k) => [k, true])
    ) as any;

    setTouched(allTouched);

    const errs = validate(form);
    setErrors(errs);

    if (Object.keys(errs).length === 0) {
      onSubmit(form);
    }
  }

  const baseInput =
    "h-11 w-full rounded-xl border bg-white px-4 text-sm text-slate-700 shadow-sm transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500";

  const inputClass = (field: keyof OrdemServicoFormData) =>
    `${baseInput} ${
      touched[field] && errors[field]
        ? "border-red-400 focus:ring-red-100"
        : "border-slate-200"
    }`;

  const selectClass = (field: keyof OrdemServicoFormData) =>
    `h-11 w-full rounded-xl border bg-white px-4 text-sm shadow-sm transition-all hover:shadow-md ${
      touched[field] && errors[field]
        ? "border-red-400 focus:ring-red-100"
        : "border-slate-200"
    }`;

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-5">

      {/* DESCRIÇÃO */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-700">
          Descrição <span className="text-red-400">*</span>
        </label>

        <Textarea
          rows={5}
          className={`${inputClass("descricao")} min-h-[120px]`}
          placeholder="Descreva o problema da máquina..."
          value={form.descricao}
          onChange={(e) => handleChange("descricao", e.target.value)}
          onBlur={() => touch("descricao")}
        />

        {touched.descricao && errors.descricao && (
          <p className="text-xs text-red-500">{errors.descricao}</p>
        )}
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

        {/* TIPO */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">
            Tipo de manutenção
          </label>

          <Select
            value={form.tipo_manutencao}
            onValueChange={(v) => handleChange("tipo_manutencao", v as any)}
          >
            <SelectTrigger className={selectClass("tipo_manutencao")}>
              <div className="flex items-center gap-2">
                <Settings size={15} className="text-slate-400" />
                <SelectValue />
              </div>
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="CORRETIVA">Corretiva</SelectItem>
              <SelectItem value="PREVENTIVA">Preventiva</SelectItem>
              <SelectItem value="PREDITIVA">Preditiva</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* PRIORIDADE */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">
            Prioridade
          </label>

          <Select
            value={form.prioridade}
            onValueChange={(v) => handleChange("prioridade", v as any)}
          >
            <SelectTrigger className={selectClass("prioridade")}>
              <div className="flex items-center gap-2">
                <Gauge size={15} className="text-slate-400" />
                <SelectValue />
              </div>
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="BAIXA">Baixa</SelectItem>
              <SelectItem value="MEDIA">Média</SelectItem>
              <SelectItem value="ALTA">Alta</SelectItem>
              <SelectItem value="CRITICA">Crítica</SelectItem>
            </SelectContent>
          </Select>
        </div>

    
      </div>

      {/* BOTÃO */}
      <div className="flex justify-end pt-4">
        <Button
          type="submit"
          disabled={loading}
          className="h-11 px-8 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
        >
          {loading ? "Salvando..." : "Criar Ordem de Serviço"}
        </Button>
      </div>
    </form>
  );
}