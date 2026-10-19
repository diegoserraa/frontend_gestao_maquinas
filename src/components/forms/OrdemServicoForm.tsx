import { useState } from "react";

import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

import { Settings, Gauge, OctagonPause } from "lucide-react";

export type OrdemServicoFormData = {
  id_solicitante?: number;
  maquina_id: number;
  descricao: string;
  status: "ABERTA";
  tipo_manutencao: "CORRETIVA" | "PREVENTIVA" | "PREDITIVA";
  prioridade: "BAIXA" | "MEDIA" | "ALTA" | "CRITICA";
  id_tecnico?: number | null;
  resolucao?: string;
  // "máquina parada" v1 enxuto: só respondido aqui, na abertura — sem
  // reabrir/fechar depois. A duração vira automática (abertura -> fim da
  // O.S.), calculada no backend, nunca editada à mão.
  maquina_parada?: boolean;
  motivo_parada?: string;
};

// atribuir técnico é sempre um passo separado, depois de criar a O.S.
// (regra de negócio: gestor atribui a técnico/parceiro externo depois de
// aberta) — não existe seletor de técnico neste formulário, então "tecnicos"
// nunca chegou a ser usado aqui; a busca em si continua acontecendo em
// Mantenance/index.tsx pra outras telas que precisam dela.
type Props = {
  machineId: number;
  loading?: boolean;
  onSubmit: (data: OrdemServicoFormData) => void;
};

type FormErrors = Partial<Record<keyof OrdemServicoFormData, string>>;

function validate(form: OrdemServicoFormData): FormErrors {
  const errors: FormErrors = {};

  if (!form.descricao.trim()) errors.descricao = "Descrição obrigatória.";
  if (!form.tipo_manutencao) errors.tipo_manutencao = "Selecione o tipo.";
  if (!form.prioridade) errors.prioridade = "Selecione a prioridade.";
  if (form.maquina_parada && !form.motivo_parada?.trim()) {
    errors.motivo_parada = "Informe o motivo da parada.";
  }

  return errors;
}


export function OrdemServicoForm({
  machineId,
  loading,
  onSubmit,
}: Props) {

   const usuarioLogado = JSON.parse(
    localStorage.getItem("user") || "{}"
  );
  const [form, setForm] = useState<OrdemServicoFormData>({
    id_solicitante: usuarioLogado.id, // 👈 adicionando o id do usuário logado como solicitante
    maquina_id: machineId,
    descricao: "",
    status: "ABERTA",
    tipo_manutencao: "CORRETIVA",
    prioridade: "MEDIA",
    id_tecnico: null,
    resolucao: "",
    maquina_parada: false,
    motivo_parada: "",
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

      {/* MÁQUINA PARADA */}
      <div className="space-y-1.5">
        <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
          <OctagonPause size={15} className="text-slate-400" />
          A máquina está parada?
        </label>

        <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => handleChange("maquina_parada", false)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
              !form.maquina_parada ? "bg-slate-100 text-slate-800" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            Não
          </button>
          <button
            type="button"
            onClick={() => handleChange("maquina_parada", true)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
              form.maquina_parada ? "bg-rose-50 text-rose-700" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            Sim, está parada
          </button>
        </div>

        {form.maquina_parada && (
          <div className="pt-1.5">
            <input
              type="text"
              placeholder="Motivo da parada (ex.: correia rompida)"
              value={form.motivo_parada ?? ""}
              onChange={(e) => handleChange("motivo_parada", e.target.value)}
              onBlur={() => touch("motivo_parada")}
              className={inputClass("motivo_parada")}
            />
            {touched.motivo_parada && errors.motivo_parada && (
              <p className="mt-1 text-xs text-red-500">{errors.motivo_parada}</p>
            )}
            <p className="mt-1 text-xs text-slate-400">
              O tempo parado é contado a partir de agora até a O.S. ser finalizada ou cancelada.
            </p>
          </div>
        )}
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